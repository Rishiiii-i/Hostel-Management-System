import './MainLayout.css'
import { useState, useEffect, useRef } from 'react'
import Sidebar from '../components/Sidebar'
import Icon from '../components/Icon'
import { useAuth } from '../context/AuthContext'
import { NotificationProvider, useNotifications } from '../notifications/NotificationProvider'
import NotificationPopup from '../notifications/NotificationPopup'
import { notificationService } from '../notifications/notificationService'
import { navigateFromNotification } from '../utils/deepLinking'
import Chatbot from '../components/Chatbot'
import { notificationStore } from '../notifications/notificationStore'

export default function MainLayout({ children, activeTab, setActiveTab, profile, setProfile }) {
  return (
    <NotificationProvider>
      <MainLayoutContent
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        profile={profile}
        setProfile={setProfile}
      >
        {children}
      </MainLayoutContent>
    </NotificationProvider>
  );
}

function MainLayoutContent({ children, activeTab, setActiveTab, profile, setProfile }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user } = useAuth();
  const { history, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const profileRef = useRef(profile);

  // keep profileRef updated
  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (user && token) {
      notificationService.initialize(token);

      // Start background polling for notifications
      const fetchNotifications = async () => {
        try {
          const res = await fetch('http://127.0.0.1:5000/api/notifications', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (res.ok) {
            const data = await res.json(); // Array of notifications from user document
            if (Array.isArray(data)) {
              // Compare with existing notification IDs to find new ones
              const currentHistoryIds = new Set((notificationStore.history || []).map(n => n.id));
              const currentDbIds = new Set((profileRef.current?.notifications || []).map(n => n.id));

              let hasNew = false;
              // Iterate in reverse (oldest to newest) to show them in chronological order
              const reversedData = [...data].reverse();
              for (const notif of reversedData) {
                const notifId = notif.id;
                if (notifId && !currentHistoryIds.has(notifId) && !currentDbIds.has(notifId)) {
                  // This is a new notification that we haven't seen in the UI store
                  notificationStore.addNotification({
                    id: notifId,
                    notification: {
                      title: notif.title,
                      body: notif.text || notif.body
                    },
                    data: {
                      title: notif.title,
                      body: notif.text || notif.body,
                      type: 'general',
                      id: notifId
                    }
                  });
                  hasNew = true;
                }
              }

              if (hasNew || data.length !== (profileRef.current?.notifications || []).length) {
                // Update profile notifications to keep bell list in sync
                setProfile(prev => {
                  if (!prev) return prev;
                  return {
                    ...prev,
                    notifications: data
                  };
                });
              }
            }
          }
        } catch (err) {
          console.error('Error polling notifications:', err);
        }
      };

      // Poll immediately and then every 10 seconds
      fetchNotifications();
      const intervalId = setInterval(fetchNotifications, 10000);
      return () => {
        clearInterval(intervalId);
      };
    }
  }, [user]);

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  const handleNotificationClick = async (item) => {
    markAsRead(item.id);
    if (profile && profile.notifications) {
      const updatedNotifications = profile.notifications.map((n, idx) => {
        const generatedId = n.id || `profile_notif_${idx}`;
        if (n.id === item.id || generatedId === item.id) {
          return { ...n, read: true };
        }
        return n;
      });
      setProfile(prev => ({
        ...prev,
        notifications: updatedNotifications
      }));
    }
    setShowNotifications(false);
    navigateFromNotification(item, setActiveTab);

    try {
      const token = localStorage.getItem('token');
      await fetch('http://127.0.0.1:5000/api/notifications/read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id: item.id })
      });
    } catch (err) {
      console.error('Failed to sync notification read status to backend:', err);
    }
  };

  const handleMarkAllRead = async () => {
    markAllAsRead();
    if (profile && profile.notifications) {
      const updatedNotifications = profile.notifications.map(n => ({ ...n, read: true }));
      setProfile(prev => ({
        ...prev,
        notifications: updatedNotifications
      }));
    }

    try {
      const token = localStorage.getItem('token');
      await fetch('http://127.0.0.1:5000/api/notifications/read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({})
      });
    } catch (err) {
      console.error('Failed to sync mark all read to backend:', err);
    }
  };

  // combine live store history with database-backed profile notifications
  const liveIds = new Set((history || []).map(n => n.id));
  const dbNotifications = (profile?.notifications || [])
    .filter(n => !liveIds.has(n.id))
    .map((n, idx) => ({
      id: n.id || `profile_notif_${idx}`,
      title: n.title,
      body: n.text || n.body,
      read: n.read || false,
      timestampText: n.time || 'Recently',
      type: 'general'
    }));

  const allNotifications = [...(history || []), ...dbNotifications];

  const displayUnreadCount = allNotifications.filter(n => !n.read).length;

  return (
    <div className="dashboard-container">
      <NotificationPopup />
      {user?.role === 'student' && <Chatbot />}
      {isSidebarOpen && (
        <div className="sidebar-backdrop" onClick={() => setIsSidebarOpen(false)} />
      )}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        profile={profile} 
        setProfile={setProfile} 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />
      
      <div className="dashboard-main">
        <header className="dashboard-header">
          <div className="header-left">
            <button 
              type="button" 
              className="sidebar-toggle-btn"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open Sidebar"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
            <div 
              className="header-title-flex" 
              onClick={() => setActiveTab('overview')}
              style={{ cursor: 'pointer' }}
              title="Go to Home section"
            >
              <span className="header-logo-badge">
                <Icon name="building" />
              </span>
              <h2>
                {user?.role === 'administrator' || user?.role === 'admin' || window.location.hash === '#admin-dashboard'
                  ? 'Admin Dashboard'
                  : user?.role === 'warden' || window.location.hash === '#warden-dashboard'
                  ? 'Warden Dashboard'
                  : 'Student Dashboard'}
              </h2>
            </div>
            <p className="header-date">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
 
          <div className="header-right">
            <div className="header-search">
              <Icon name="search" width="15" height="15" />
              <input type="text" placeholder="Search dashboard..." />
            </div>
 
            <div className="notification-wrapper">
              <button 
                type="button" 
                className="notification-btn" 
                onClick={toggleNotifications}
                title="Notifications"
                aria-label="Notifications"
              >
                <Icon name="bell" width="18" height="18" />
                {displayUnreadCount > 0 && <span className="badge">{displayUnreadCount}</span>}
              </button>
 
              {showNotifications && (
                <div className="notification-dropdown animate-fade-in-slide-up">
                  <div className="dropdown-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h4 style={{ margin: 0 }}>Notifications</h4>
                    {displayUnreadCount > 0 ? (
                      <button 
                        type="button"
                        onClick={handleMarkAllRead}
                        style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                      >
                        Mark all read ({displayUnreadCount})
                      </button>
                    ) : (
                      <span className="count">0 new</span>
                    )}
                  </div>
                  <div className="dropdown-list">
                    {allNotifications.length === 0 ? (
                      <p className="empty-state-text">No notifications.</p>
                    ) : (
                      allNotifications.map((n) => (
                        <div 
                          key={n.id} 
                          className="notification-item" 
                          style={{ opacity: n.read ? 0.65 : 1, cursor: 'pointer', padding: '10px 12px' }}
                          onClick={() => handleNotificationClick(n)}
                        >
                          <strong style={{ fontSize: '13px', display: 'block', color: '#0f172a' }}>{n.title}</strong>
                          <p style={{ margin: '4px 0', fontSize: '12px', color: '#475569' }}>{n.body || n.text}</p>
                          <small style={{ fontSize: '11px', color: '#94a3b8' }}>{n.timestampText || n.time || 'Just now'}</small>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="user-profile-header-card">
              <div className="header-avatar-circle" style={{ overflow: 'hidden', borderRadius: '50%', width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {(() => {
                  const photoUrl = (profile?.photo && (profile.photo.startsWith('data:image') || profile.photo.startsWith('http') || profile.photo.startsWith('/')))
                    ? profile.photo
                    : (user?.photoURL && (user.photoURL.startsWith('data:image') || user.photoURL.startsWith('http') || user.photoURL.startsWith('/')))
                      ? user.photoURL
                      : null;
                  return photoUrl ? (
                    <img src={photoUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <Icon name="user" width="18" height="18" />
                  );
                })()}
              </div>
              <div className="user-profile-text">
                <span className="user-profile-name">{profile?.fullName || user?.name || 'User'}</span>
                <span className="user-profile-role" style={{ textTransform: 'capitalize' }}>{user?.role || 'Student'}</span>
              </div>
            </div>
          </div>
        </header>

        <main className="dashboard-content">
          {children}
        </main>
      </div>
    </div>
  );
}
