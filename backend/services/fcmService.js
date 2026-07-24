/**
 * FCM Push Notification Service
 * Dispatches multicast and topic-based push notifications using Firebase Admin SDK.
 * Features standardized payload schema, topic management, and automatic stale token pruning.
 */

import mongoose from 'mongoose';
import { adminInstance, getMessaging } from '../config/firebaseAdmin.js';
import { User } from '../db.js';

export class FCMService {
  /**
   * Format payload into standard production schema
   */
  static formatPayload(payload = {}) {
    const {
      title = 'Smart Hostel Alert',
      body = '',
      icon = '/logo.png',
      notificationType = 'SYSTEM_ALERT',
      eventId = 'EVT_' + Date.now(),
      userId = '',
      targetHash = '#dashboard',
      targetTab = 'overview',
      data = {},
      metadata = {}
    } = payload;

    const stringifiedData = {
      title: String(title),
      body: String(body),
      notificationType: String(notificationType),
      type: String(data.type || notificationType || 'alert'),
      targetScreen: String(targetTab),
      eventId: String(eventId),
      userId: String(userId),
      targetHash: String(targetHash),
      targetTab: String(targetTab),
      timestamp: String(Date.now()),
      icon: String(icon)
    };

    Object.keys(data).forEach(key => {
      stringifiedData[key] = String(data[key]);
    });

    return {
      title,
      body,
      icon,
      stringifiedData
    };
  }

  /**
   * Subscribe FCM registration tokens to a topic
   * @param {string[]} tokens 
   * @param {string} topic 
   */
  static async subscribeToTopic(tokens, topic) {
    if (!adminInstance || !tokens || tokens.length === 0 || !topic) return null;
    try {
      const response = await getMessaging(adminInstance).subscribeToTopic(tokens, topic);
      console.log(`[FCMService] Subscribed ${response.successCount} tokens to topic '${topic}'`);
      return response;
    } catch (error) {
      console.error(`[FCMService] Error subscribing to topic '${topic}':`, error.message);
      throw error;
    }
  }

  /**
   * Unsubscribe FCM registration tokens from a topic
   * @param {string[]} tokens 
   * @param {string} topic 
   */
  static async unsubscribeFromTopic(tokens, topic) {
    if (!adminInstance || !tokens || tokens.length === 0 || !topic) return null;
    try {
      const response = await getMessaging(adminInstance).unsubscribeFromTopic(tokens, topic);
      console.log(`[FCMService] Unsubscribed ${response.successCount} tokens from topic '${topic}'`);
      return response;
    } catch (error) {
      console.error(`[FCMService] Error unsubscribing from topic '${topic}':`, error.message);
      throw error;
    }
  }

  /**
   * Send notification to a specific topic
   * @param {string} topic 
   * @param {Object} rawPayload 
   */
  static async sendToTopic(topic, rawPayload = {}) {
    if (!adminInstance) {
      console.warn('[FCMService] Firebase Admin is not initialized. Skipping topic dispatch.');
      return null;
    }

    const { title, body, icon, stringifiedData } = this.formatPayload(rawPayload);

    const message = {
      topic: topic,
      notification: { title, body },
      data: stringifiedData,
      webpush: {
        notification: {
          title,
          body,
          icon,
          badge: '/favicon.svg'
        },
        fcmOptions: {
          link: stringifiedData.url || `/#${stringifiedData.targetHash}`
        }
      }
    };

    try {
      console.log(`[FCMService] Dispatching notification to topic '${topic}'...`);
      const messageId = await getMessaging(adminInstance).send(message);
      console.log(`[FCMService] Topic message sent successfully with ID: ${messageId}`);
      return { success: true, messageId };
    } catch (error) {
      console.error(`[FCMService] Error sending message to topic '${topic}':`, error.message);
      throw error;
    }
  }

  /**
   * Send FCM push notification to a list of target tokens
   * @param {string[]} tokens Array of FCM registration tokens
   * @param {Object} rawPayload 
   */
  static async sendMulticastPush(tokens, rawPayload = {}) {
    if (!tokens || tokens.length === 0) {
      return { successCount: 0, failureCount: 0 };
    }

    if (!adminInstance) {
      console.warn('[FCMService] Firebase Admin is not initialized. Skipping FCM dispatch.');
      return { successCount: 0, failureCount: 0 };
    }

    const { title, body, icon, stringifiedData } = this.formatPayload(rawPayload);

    const message = {
      tokens: tokens,
      notification: { title, body },
      data: stringifiedData,
      webpush: {
        notification: {
          title,
          body,
          icon,
          badge: '/favicon.svg'
        },
        fcmOptions: {
          link: stringifiedData.url || `/#${stringifiedData.targetHash}`
        }
      }
    };

    try {
      console.log(`[FCMService] Dispatching push notification to ${tokens.length} tokens...`);
      const response = await getMessaging(adminInstance).sendEachForMulticast(message);

      console.log(`[FCMService] FCM Multicast Result: ${response.successCount} succeeded, ${response.failureCount} failed.`);

      // Identify invalid or expired tokens and prune them from MongoDB
      if (response.failureCount > 0) {
        const failedTokens = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            const errorCode = resp.error?.code;
            if (
              errorCode === 'messaging/invalid-registration-token' ||
              errorCode === 'messaging/registration-token-not-registered'
            ) {
              failedTokens.push(tokens[idx]);
            }
          }
        });

        if (failedTokens.length > 0) {
          console.log(`[FCMService] Pruning ${failedTokens.length} invalid FCM tokens from database...`);
          await User.updateMany(
            {},
            { $pull: { fcmTokens: { token: { $in: failedTokens } } } }
          );
        }
      }

      return {
        successCount: response.successCount,
        failureCount: response.failureCount
      };
    } catch (error) {
      console.error('[FCMService] Error sending FCM multicast push:', error);
      return { successCount: 0, failureCount: tokens.length, error: error.message };
    }
  }

  /**
   * Send FCM push notification to specific users by ID/email
   */
  static async sendFCMToUserIds(userIds, payload) {
    if (!userIds || userIds.length === 0) return;

    try {
      const validObjectIds = userIds.filter(id => mongoose.Types.ObjectId.isValid(id));
      const stringIdentifiers = userIds.map(id => typeof id === 'string' ? id.toLowerCase() : String(id));

      const orConditions = [
        { id: { $in: userIds } },
        { email: { $in: stringIdentifiers } }
      ];

      if (validObjectIds.length > 0) {
        orConditions.push({ _id: { $in: validObjectIds } });
      }

      const users = await User.find({ $or: orConditions }).select('fcmTokens');

      const tokens = [];
      users.forEach(u => {
        if (u.fcmTokens && u.fcmTokens.length > 0) {
          u.fcmTokens.forEach(t => tokens.push(t.token));
        }
      });

      const uniqueTokens = [...new Set(tokens)];
      return await this.sendMulticastPush(uniqueTokens, payload);
    } catch (error) {
      console.error('[FCMService] Error finding user FCM tokens:', error);
    }
  }

  /**
   * Send FCM push notification to all users with a specific role
   */
  static async sendFCMToRole(role, payload) {
    try {
      const users = await User.find({ role }).select('fcmTokens');
      const tokens = [];
      users.forEach(u => {
        if (u.fcmTokens && u.fcmTokens.length > 0) {
          u.fcmTokens.forEach(t => tokens.push(t.token));
        }
      });

      const uniqueTokens = [...new Set(tokens)];
      return await this.sendMulticastPush(uniqueTokens, payload);
    } catch (error) {
      console.error(`[FCMService] Error sending FCM to role ${role}:`, error);
    }
  }
}
