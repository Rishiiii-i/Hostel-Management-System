/** * main notification service facade * coordinates tokenmanager notificationhandler serviceworker messaging and deeplinking */

import { TokenManager } from './tokenManager';
import { notificationHandler } from './notificationHandler';
import { navigateFromNotification } from '../utils/deepLinking';

class NotificationService {
  constructor() {
    this.isInitialized = false;
    this.swMessageListenerRegistered = false;
  }

  /** * start fcm push notification engine for an logged in user * @param {string} usertoken jwt login check token of the logged-in user * @param {function} setactivetab optional react state setter for active navigation tab */
  async initialize(userToken, setActiveTab = null) {
    if (!userToken) return;

    try {
      console.log('[NotificationService] Initializing FCM notification system...');

      // 1 sync fcm token with backend
      await TokenManager.syncTokenWithBackend(userToken);

      // 2 start foreground messaging listener
      await notificationHandler.listen((notification) => {
        console.log('[NotificationService] Processing foreground payload:', notification);
      });

      // 3 register service worker message listener for notification clicks (background -> foreground focus)
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

  /** * diagnostic helper to trigger a instant native os system notification */
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

  /** * clean up notification listeners and unregister fcm token on user logout * @param {string} usertoken */
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
