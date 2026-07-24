/**
 * Notification Service (Frontend FCM Engine)
 * Manages token registration, FCM foreground listeners, and syncing with NotificationStore.
 */

import { onMessage } from 'firebase/messaging';
import { getMessagingInstance } from '../firebase';
import { TokenManager } from '../services/tokenManager';
import { notificationStore } from './notificationStore';

class NotificationService {
  constructor() {
    this.isInitialized = false;
    this.unsubscribeFCM = null;
  }

  /**
   * Initialize FCM Push Notification engine for logged in user
   */
  async initialize(userToken) {
    if (!userToken) return;

    try {
      console.log('[NotificationService] Initializing Real-Time FCM Notification System...');

      // 1. Request Permission & Sync FCM device token with backend
      await TokenManager.syncTokenWithBackend(userToken);

      // 2. Start FCM Foreground Listener
      const messaging = await getMessagingInstance();
      if (messaging) {
        if (this.unsubscribeFCM) {
          this.unsubscribeFCM();
        }

        this.unsubscribeFCM = onMessage(messaging, (payload) => {
          console.log('[NotificationService] Received real-time FCM payload:', payload);
          // Pass incoming message directly to the UI Notification Store to render popup
          notificationStore.addNotification(payload);
        });
      }

      this.isInitialized = true;
      console.log('[NotificationService] Real-Time Notification System successfully initialized.');
    } catch (error) {
      console.error('[NotificationService] Error initializing Notification System:', error);
    }
  }

  /**
   * Clean up listeners on logout
   */
  async teardown(userToken) {
    try {
      if (this.unsubscribeFCM) {
        this.unsubscribeFCM();
        this.unsubscribeFCM = null;
      }
      if (userToken) {
        await TokenManager.unregisterTokenFromBackend(userToken);
      }
      notificationStore.clearPopups();
      this.isInitialized = false;
      console.log('[NotificationService] Notification system torn down.');
    } catch (error) {
      console.error('[NotificationService] Error tearing down Notification System:', error);
    }
  }
}

export const notificationService = new NotificationService();

if (typeof window !== 'undefined') {
  window.addEventListener('shm:new_notification', (event) => {
    if (event.detail) {
      notificationStore.addNotification(event.detail);
    }
  });

  window.testSystemNotification = () => {
    notificationStore.addNotification({
      notification: {
        title: 'Real-Time In-App Alert',
        body: 'Complaint status updated to Resolved.'
      },
      data: {
        type: 'complaint',
        targetScreen: 'complaints',
        targetHash: '#dashboard',
        id: 'REQ-' + Math.floor(100 + Math.random() * 900)
      }
    });
  };
}
