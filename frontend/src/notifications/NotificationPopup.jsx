/**
 * NotificationPopup Component
 * Displays real-time stacked top-right popup banners (Slack/WhatsApp style) with auto-close timers.
 */

import React, { useEffect } from 'react';
import { useNotifications } from './NotificationProvider';
import { navigateFromNotification } from '../utils/deepLinking';
import './notificationStyles.css';

const ICON_MAP = {
  complaint: '🛠️',
  gatepass: '🚗',
  leave: '🚗',
  fee: '💳',
  payment: '💳',
  notice: '📢',
  announcement: '📢',
  mess: '🍲',
  room: '🚪',
  general: '🔔'
};

export default function NotificationPopup() {
  const { activePopups, removePopup, markAsRead } = useNotifications();

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
          onNavigate={() => {
            markAsRead(popup.id);
            removePopup(popup.id);
            navigateFromNotification(popup);
          }}
        />
      ))}
    </div>
  );
}

function PopupCard({ popup, onClose, onNavigate }) {
  // Auto-dismiss after 6 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 6000);
    return () => clearTimeout(timer);
  }, [popup.id, onClose]);

  const icon = ICON_MAP[popup.type] || '🔔';

  return (
    <div className={`notification-popup-card type-${popup.type}`}>
      <div className="notification-popup-header">
        <div className="notification-popup-title-box">
          <div className="notification-popup-icon">{icon}</div>
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
        <button
          type="button"
          className="notification-popup-action-btn"
          onClick={onNavigate}
        >
          View Details
        </button>
      </div>

      <div className="notification-popup-progress" />
    </div>
  );
}
