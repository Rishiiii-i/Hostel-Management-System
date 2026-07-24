/**
 * Main Notification Service Facade
 * Coordinates TokenManager, NotificationHandler, ServiceWorker messaging, and DeepLinking.
 */

import { TokenManager } from './tokenManager';
import { notificationHandler } from './notificationHandler';
import { navigateFromNotification } from '../utils/deepLinking';

class NotificationService {
  constructor() {
    this.isInitialized = false;
    this.swMessageListenerRegistered = false;
  }

  /**
   * Initialize FCM push notification engine for an authenticated user
   * @param {string} userToken JWT authentication token of the logged-in user
   * @param {Function} setActiveTab Optional React state setter for active navigation tab
   */
  async initialize(userToken, setActiveTab = null) {
    if (!userToken) return;

    try {
      console.log('[NotificationService] Initializing FCM notification system...');

      // 1. Sync FCM Token with backend
      await TokenManager.syncTokenWithBackend(userToken);

      // 2. Start Foreground Messaging Listener
      await notificationHandler.listen((notification) => {
        console.log('[NotificationService] Processing foreground payload:', notification);
      });

      // 3. Register Service Worker message listener for notification clicks (background -> foreground focus)
      if ('serviceWorker' in navigator && !this.swMessageListenerRegistered) {
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data && event.data.type === 'FCM_NOTIFICATION_CLICK') {
            console.log('[NotificationService] Received FCM notification click event from Service Worker:', event.data);
            navigateFromNotification(event.data.payload || {
              targetHash: event.data.targetHash,
              targetTab: event.data.targetTab
            }, setActiveTab);
          }
        });
        this.swMessageListenerRegistered = true;
      }

      this.isInitialized = true;
      console.log('[NotificationService] FCM notification system successfully initialized.');
    } catch (error) {
      console.error('[NotificationService] Error initializing FCM notification system:', error);
    }
  }

  /**
   * Diagnostic helper to trigger a instant native OS system notification
   */
  async triggerTestNativeNotification() {
    if (!('Notification' in window)) {
      alert('Browser does not support desktop notifications.');
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      alert('Notification permission is currently blocked/denied in browser settings. Please allow notifications for http://localhost:5173');
      return;
    }

    try {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.ready;
        if (reg && reg.showNotification) {
          await reg.showNotification('Hostel System Alert', {
            body: 'Native OS Push Notification system is active!',
            icon: '/logo.png',
            badge: '/favicon.svg'
          });
          return;
        }
      }

      new Notification('Hostel System Alert', {
        body: 'Native OS Push Notification system is active!',
        icon: '/logo.png'
      });
    } catch (err) {
      console.error('Error triggering test native notification:', err);
    }
  }

  /**
   * Clean up notification listeners and unregister FCM token on user logout
   * @param {string} userToken 
   */
  async teardown(userToken) {
    try {
      notificationHandler.stop();
      if (userToken) {
        await TokenManager.unregisterTokenFromBackend(userToken);
      }
      this.isInitialized = false;
      console.log('[NotificationService] Notification service torn down.');
    } catch (error) {
      console.error('[NotificationService] Error tearing down notification service:', error);
    }
  }
}

export const notificationService = new NotificationService();

if (typeof window !== 'undefined') {
  window.testSystemNotification = () => notificationService.triggerTestNativeNotification();
}
