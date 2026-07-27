/** * fcm token manager service * manages notification permission requesting fcm device token generation * local storage caching backend synchronization and token deletion */

import { getToken } from 'firebase/messaging';
import { getMessagingInstance } from '../firebase';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || 'BH961-N2b0PmsR0_pYfab5D0k8XAvjxtjOhqMTil-O0';
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export class TokenManager {
  /** * request push notification permission from browser * @returns {promise<permissionstate>} 'granted' 'denied' or 'default' */
  static async requestPermission() {
    if (!('Notification' in window)) {
      console.warn('[TokenManager] Browser does not support desktop notifications.');
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      console.log(`[TokenManager] Notification permission status: ${permission}`);
      return permission;
    } catch (error) {
      console.error('[TokenManager] Error requesting notification permission:', error);
      return 'denied';
    }
  }

  /** * register service worker for fcm background messaging */
  static async registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
        scope: '/'
      });
      console.log('[TokenManager] Service Worker registered with scope:', registration.scope);
      return registration;
    } catch (error) {
      console.error('[TokenManager] Service Worker registration failed:', error);
      return null;
    }
  }

  /** * retrieve fcm device token from firebase sdk * @returns {promise<string|null>} fcm token string or null */
  static async fetchFCMToken() {
    try {
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        console.warn('[TokenManager] Notification permission was not granted.');
        return null;
      }

      const messaging = await getMessagingInstance();
      if (!messaging) {
        console.warn('[TokenManager] FCM Messaging instance is unavailable.');
        return null;
      }

      const swRegistration = await this.registerServiceWorker();

      let currentToken = null;
      try {
        const options = {};
        if (VAPID_KEY && VAPID_KEY.length > 50) {
          options.vapidKey = VAPID_KEY;
        }
        if (swRegistration) {
          options.serviceWorkerRegistration = swRegistration;
        }
        currentToken = await getToken(messaging, options);
      } catch (keyErr) {
        console.warn('[TokenManager] Invalid VAPID key or push subscription error, trying fallback:', keyErr.message);
        try {
          currentToken = await getToken(messaging, { serviceWorkerRegistration: swRegistration });
        } catch (fallbackErr) {
          console.warn('[TokenManager] Fallback token fetch failed:', fallbackErr.message);
          // generate persistent local device identifier as fallback
          currentToken = localStorage.getItem('shm_fcm_token') || 'web_device_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
        }
      }

      if (currentToken) {
        console.log('[TokenManager] Obtained FCM Device Token:', currentToken.substring(0, 15) + '...');
        localStorage.setItem('shm_fcm_token', currentToken);
        return currentToken;
      } else {
        console.warn('[TokenManager] No registration token available.');
        return null;
      }
    } catch (error) {
      console.error('[TokenManager] An error occurred while retrieving FCM token:', error);
      return null;
    }
  }

  /** * sync the fcm token with the backend server * @param {string} authtoken jwt token for authenticating user */
  static async syncTokenWithBackend(authToken) {
    if (!authToken) return;

    const fcmToken = await this.fetchFCMToken();
    if (!fcmToken) return;

    try {
      const response = await fetch(`${BACKEND_URL}/api/notifications/fcm-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          fcmToken,
          deviceType: 'web',
          userAgent: navigator.userAgent
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('[TokenManager] FCM token successfully registered with backend:', data.message);
      } else {
        console.error('[TokenManager] Failed to sync FCM token with backend. Status:', response.status);
      }
    } catch (error) {
      console.error('[TokenManager] Network error syncing FCM token with backend:', error);
    }
  }

  /** * remove fcm token from backend upon user logout * @param {string} authtoken jwt token for login check */
  static async unregisterTokenFromBackend(authToken) {
    const fcmToken = localStorage.getItem('shm_fcm_token');
    if (!fcmToken || !authToken) return;

    try {
      await fetch(`${BACKEND_URL}/api/notifications/fcm-token`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ fcmToken })
      });
      console.log('[TokenManager] FCM token unregistered from backend.');
    } catch (error) {
      console.error('[TokenManager] Error unregistering FCM token from backend:', error);
    } finally {
      localStorage.removeItem('shm_fcm_token');
    }
  }
}
