/**
 * NotificationProvider Component
 * Context Provider wrapping the main app interface to supply reactive notification store state.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { notificationStore } from './notificationStore';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [storeState, setStoreState] = useState({
    activePopups: notificationStore.activePopups,
    history: notificationStore.history,
    unreadCount: notificationStore.unreadCount
  });

  useEffect(() => {
    const unsubscribe = notificationStore.subscribe((newState) => {
      setStoreState(newState);
    });
    return unsubscribe;
  }, []);

  const value = {
    activePopups: storeState.activePopups,
    history: storeState.history,
    unreadCount: storeState.unreadCount,
    addNotification: (payload) => notificationStore.addNotification(payload),
    removePopup: (id) => notificationStore.removePopup(id),
    markAsRead: (id) => notificationStore.markAsRead(id),
    markAllAsRead: () => notificationStore.markAllAsRead(),
    clearPopups: () => notificationStore.clearPopups()
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
