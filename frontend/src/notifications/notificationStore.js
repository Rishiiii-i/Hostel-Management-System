/**
 * Notification Store
 * Manages active in-app popups, unread badge counter, and notification history.
 */

class NotificationStore {
  constructor() {
    this.listeners = new Set();
    this.activePopups = [];
    this.history = [];
    this.unreadCount = 0;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.listeners.forEach(fn => fn({
      activePopups: [...this.activePopups],
      history: [...this.history],
      unreadCount: this.unreadCount
    }));
  }

  /**
   * Add new incoming notification payload to popups & history
   */
  addNotification(payload = {}) {
    const id = payload.id || payload.messageId || payload.data?.eventId || 'notif_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);

    // Prevent duplicate entries
    if (this.history.some(n => n.id === id)) {
      return;
    }

    const title = payload.notification?.title || payload.data?.title || 'Smart Hostel Alert';
    const body = payload.notification?.body || payload.data?.body || payload.data?.message || '';
    const type = (payload.data?.type || payload.data?.notificationType || 'general').toLowerCase();
    const targetScreen = payload.data?.targetScreen || payload.data?.targetTab || payload.data?.screen || 'overview';
    const targetHash = payload.data?.targetHash || '#dashboard';

    const item = {
      id,
      title,
      body,
      type,
      targetScreen,
      targetHash,
      read: false,
      createdAt: new Date().toISOString(),
      timestampText: 'Just now',
      data: payload.data || {}
    };

    // Add to popups stack (max 5 active popups at a time)
    this.activePopups = [item, ...this.activePopups.slice(0, 4)];

    // Add to history
    this.history = [item, ...this.history];
    this.unreadCount += 1;

    this.notify();
  }

  /**
   * Dismiss an active popup from the screen
   */
  removePopup(id) {
    this.activePopups = this.activePopups.filter(p => p.id !== id);
    this.notify();
  }

  /**
   * Mark single notification as read
   */
  markAsRead(id) {
    let updated = false;
    this.history = this.history.map(item => {
      if (item.id === id && !item.read) {
        updated = true;
        return { ...item, read: true };
      }
      return item;
    });

    if (updated) {
      this.unreadCount = Math.max(0, this.unreadCount - 1);
      this.notify();
    }
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead() {
    this.history = this.history.map(item => ({ ...item, read: true }));
    this.unreadCount = 0;
    this.notify();
  }

  /**
   * Clear active popups
   */
  clearPopups() {
    this.activePopups = [];
    this.notify();
  }
}

export const notificationStore = new NotificationStore();
