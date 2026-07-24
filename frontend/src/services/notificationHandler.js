/**
 * FCM Foreground Native System Notification Handler
 * Triggers NATIVE OS/browser system notifications when FCM messages arrive while app is active.
 * No custom React or in-app UI popup popups are rendered.
 */

import { onMessage } from 'firebase/messaging';
import { getMessagingInstance } from '../firebase';
import { navigateFromNotification } from '../utils/deepLinking';

class NotificationHandler {
  constructor() {
    this.processedMessageIds = new Set();
    this.unsubscribe = null;
  }

  /**
   * Deduplicate incoming messages using messageId signature
   */
  isDuplicate(payload) {
    const id = payload.messageId || payload.data?.eventId || payload.data?.notificationId || (payload.notification?.title + '_' + payload.notification?.body);
    if (!id) return false;

    if (this.processedMessageIds.has(id)) {
      console.log(`[NotificationHandler] Ignored duplicate message: ${id}`);
      return true;
    }

    this.processedMessageIds.add(id);

    // Clean up old IDs after 5 minutes
    setTimeout(() => {
      this.processedMessageIds.delete(id);
    }, 5 * 60 * 1000);

    return false;
  }

  /**
   * Display native operating system/browser notification
   * @param {Object} payload FCM message payload
   */
  async showNativeNotification(payload) {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      console.warn('[NotificationHandler] Native notification permission is not granted.');
      return;
    }

    const title = payload.notification?.title || payload.data?.title || 'Smart Hostel Alert';
    const body = payload.notification?.body || payload.data?.body || payload.data?.message || '';
    const icon = payload.notification?.icon || payload.data?.icon || '/logo.png';
    const data = payload.data || {};

    const options = {
      body: body,
      icon: icon,
      badge: '/favicon.svg',
      tag: data.eventId || payload.messageId || 'shm_' + Date.now(),
      data: data
    };

    try {
      // Try displaying via Service Worker registration first for native OS behavior
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        if (registration && registration.showNotification) {
          await registration.showNotification(title, options);
          return;
        }
      }

      // Fallback to standard Window Notification API
      const nativeNotif = new Notification(title, options);

      nativeNotif.onclick = (event) => {
        event.preventDefault();
        window.focus();
        nativeNotif.close();
        console.log('[NotificationHandler] Native notification clicked:', data);
        navigateFromNotification(data);
      };
    } catch (error) {
      console.error('[NotificationHandler] Error showing native notification:', error);
    }
  }

  /**
   * Start listening for foreground messages
   */
  async listen() {
    const messaging = await getMessagingInstance();
    if (!messaging) {
      console.warn('[NotificationHandler] Cannot start listener: Messaging is not supported.');
      return;
    }

    if (this.unsubscribe) {
      this.unsubscribe();
    }

    this.unsubscribe = onMessage(messaging, (payload) => {
      console.log('[NotificationHandler] Foreground FCM message received:', payload);

      if (this.isDuplicate(payload)) return;

      // Trigger NATIVE OS notification directly
      this.showNativeNotification(payload);
    });

    console.log('[NotificationHandler] Native foreground FCM listener initialized.');
  }

  /**
   * Stop listening
   */
  stop() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
      console.log('[NotificationHandler] Foreground FCM listener stopped.');
    }
  }
}

export const notificationHandler = new NotificationHandler();
