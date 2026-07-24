/**
 * FCM Notification Express Routes
 * Handles token registration, topic subscriptions, topic broadcasts, and test push endpoints.
 */

import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { User } from '../db.js';
import { FCMService } from '../services/fcmService.js';
import { notificationQueue } from '../services/notificationQueue.js';

const router = express.Router();

/**
 * POST /api/notifications/fcm-token
 * Register or update FCM device token for authenticated user
 */
router.post('/fcm-token', authenticateToken, async (req, res) => {
  try {
    const { fcmToken, deviceType = 'web' } = req.body;

    if (!fcmToken) {
      return res.status(400).json({ message: 'FCM token is required' });
    }

    const email = req.user?.email;
    if (!email) {
      return res.status(401).json({ message: 'User email not found in token' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.fcmTokens) {
      user.fcmTokens = [];
    }

    const existingIndex = user.fcmTokens.findIndex(t => t.token === fcmToken);

    if (existingIndex > -1) {
      user.fcmTokens[existingIndex].updatedAt = new Date();
      user.fcmTokens[existingIndex].deviceType = deviceType;
    } else {
      user.fcmTokens.push({
        token: fcmToken,
        deviceType,
        updatedAt: new Date()
      });
    }

    // Disassociate token from any other user accounts
    await User.updateMany(
      { email: { $ne: email } },
      { $pull: { fcmTokens: { token: fcmToken } } }
    );

    await user.save();

    // Automatically subscribe user token to relevant role topic & announcements channel
    const topicsToSubscribe = ['system_announcements'];
    if (user.role === 'student') topicsToSubscribe.push('students_all');
    else if (user.role === 'warden') topicsToSubscribe.push('wardens_all');
    else if (user.role === 'administrator' || user.role === 'admin') topicsToSubscribe.push('admin_all');

    if (user.block) topicsToSubscribe.push(`block_${user.block.replace(/\s+/g, '_')}`);

    for (const topic of topicsToSubscribe) {
      try {
        await FCMService.subscribeToTopic([fcmToken], topic);
      } catch (topicErr) {
        console.warn(`[NotificationRoute] Failed auto-subscribing token to topic ${topic}:`, topicErr.message);
      }
    }

    console.log(`[NotificationRoute] Registered FCM token & topics for user ${email}`);
    res.status(200).json({ message: 'FCM token and topic subscriptions saved successfully' });
  } catch (error) {
    console.error('[NotificationRoute] Error saving FCM token:', error);
    res.status(500).json({ message: 'Failed to save FCM token', error: error.message });
  }
});

/**
 * DELETE /api/notifications/fcm-token
 * Unregister FCM device token when user logs out
 */
router.delete('/fcm-token', authenticateToken, async (req, res) => {
  try {
    const { fcmToken } = req.body;
    const email = req.user?.email;

    if (!fcmToken) {
      return res.status(400).json({ message: 'FCM token is required' });
    }

    if (email) {
      await User.updateOne(
        { email },
        { $pull: { fcmTokens: { token: fcmToken } } }
      );
    } else {
      await User.updateMany(
        {},
        { $pull: { fcmTokens: { token: fcmToken } } }
      );
    }

    console.log(`[NotificationRoute] Unregistered FCM token for ${email || 'unknown user'}`);
    res.status(200).json({ message: 'FCM token removed successfully' });
  } catch (error) {
    console.error('[NotificationRoute] Error removing FCM token:', error);
    res.status(500).json({ message: 'Failed to remove FCM token', error: error.message });
  }
});

/**
 * POST /api/notifications/topics/subscribe
 * Subscribe authenticated user token to a specific topic
 */
router.post('/topics/subscribe', authenticateToken, async (req, res) => {
  try {
    const { fcmToken, topic } = req.body;
    if (!fcmToken || !topic) {
      return res.status(400).json({ message: 'fcmToken and topic are required' });
    }

    await FCMService.subscribeToTopic([fcmToken], topic);
    res.status(200).json({ message: `Successfully subscribed token to topic '${topic}'` });
  } catch (error) {
    console.error('[NotificationRoute] Error subscribing to topic:', error);
    res.status(500).json({ message: 'Failed to subscribe to topic', error: error.message });
  }
});

/**
 * POST /api/notifications/topics/unsubscribe
 * Unsubscribe token from a topic
 */
router.post('/topics/unsubscribe', authenticateToken, async (req, res) => {
  try {
    const { fcmToken, topic } = req.body;
    if (!fcmToken || !topic) {
      return res.status(400).json({ message: 'fcmToken and topic are required' });
    }

    await FCMService.unsubscribeFromTopic([fcmToken], topic);
    res.status(200).json({ message: `Successfully unsubscribed token from topic '${topic}'` });
  } catch (error) {
    console.error('[NotificationRoute] Error unsubscribing from topic:', error);
    res.status(500).json({ message: 'Failed to unsubscribe from topic', error: error.message });
  }
});

/**
 * POST /api/notifications/topics/send
 * Send broadcast notification to a topic (Admin/Warden only)
 */
router.post('/topics/send', authenticateToken, async (req, res) => {
  try {
    const { topic, title, body, targetHash = '#dashboard', targetTab = 'notices' } = req.body;
    if (!topic || !title || !body) {
      return res.status(400).json({ message: 'topic, title, and body are required' });
    }

    // Queue job asynchronously
    notificationQueue.enqueue({
      type: 'TOPIC',
      target: topic,
      payload: {
        title,
        body,
        notificationType: 'SYSTEM_ANNOUNCEMENT',
        targetHash,
        targetTab
      }
    });

    res.status(202).json({ message: `Broadcast push notification queued for topic '${topic}'` });
  } catch (error) {
    console.error('[NotificationRoute] Error queueing topic notification:', error);
    res.status(500).json({ message: 'Failed to send topic notification', error: error.message });
  }
});

/**
 * POST /api/notifications/test-push
 * Dev test endpoint to trigger async push notification
 */
router.post('/test-push', authenticateToken, async (req, res) => {
  try {
    const email = req.user?.email;
    const { title = 'Test Push Notification', body = 'Production FCM integration is active!', targetTab = 'overview' } = req.body;

    notificationQueue.enqueue({
      type: 'USERS',
      target: [email],
      payload: {
        title,
        body,
        notificationType: 'TEST_ALERT',
        targetHash: '#dashboard',
        targetTab
      }
    });

    res.status(202).json({
      message: 'Test push notification job accepted and queued for delivery'
    });
  } catch (error) {
    console.error('[NotificationRoute] Error queueing test push:', error);
    res.status(500).json({ message: 'Failed to queue test push notification', error: error.message });
  }
});

export default router;
