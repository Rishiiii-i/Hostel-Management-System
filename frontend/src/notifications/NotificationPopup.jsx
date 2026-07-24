/**
 * NotificationPopup Component
 * Displays real-time stacked top-right popup banners (clean theme) with auto-close timers.
 * Emojis and action buttons have been removed.
 */

import React, { useEffect } from 'react';
import { useNotifications } from './NotificationProvider';
import './notificationStyles.css';

export default function NotificationPopup() {
  const { activePopups, removePopup } = useNotifications();

  if (!activePopups || activePopups.length === 0) {
    return null;
  }

  return (
    <div className="notification-popup-container">
      {activePopups.map((popup) => (
        <PopupCard
          key={popup.id}
          popup={popup}
          onClose={() => removePopup(popup.id)}
        />
      ))}
    </div>
  );
}

function PopupCard({ popup, onClose }) {
  // Auto-dismiss after 6 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 6000);
    return () => clearTimeout(timer);
  }, [popup.id, onClose]);

  return (
    <div className={`notification-popup-card type-${popup.type}`}>
      <div className="notification-popup-header">
        <div className="notification-popup-title-box">
          <h4 className="notification-popup-title">{popup.title}</h4>
        </div>
        <button
          type="button"
          className="notification-popup-close-btn"
          onClick={onClose}
          aria-label="Close notification"
        >
          &times;
        </button>
      </div>

      <p className="notification-popup-body">{popup.body}</p>

      <div className="notification-popup-footer">
        <span className="notification-popup-time">{popup.timestampText || 'Just now'}</span>
      </div>

      <div className="notification-popup-progress" />
    </div>
  );
}
