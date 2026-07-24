import './MainLayout.css'
import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import Icon from '../components/Icon'
import { useAuth } from '../context/AuthContext'
import { NotificationProvider, useNotifications } from '../notifications/NotificationProvider'
import NotificationPopup from '../notifications/NotificationPopup'
import { notificationService } from '../notifications/notificationService'
import { navigateFromNotification } from '../utils/deepLinking'

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
  const { user } = useAuth();
  const { history, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (user && token) {
      notificationService.initialize(token);
    }
  }, [user]);

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  const handleNotificationClick = (item) => {
    markAsRead(item.id);
    setShowNotifications(false);
    navigateFromNotification(item, setActiveTab);
  };

  const handleMarkAllRead = () => {
    markAllAsRead();
  };

  // Combine live store history with any profile notifications
  const allNotifications = history && history.length > 0
    ? history
    : (profile?.notifications || []).map((n, idx) => ({
        id: n.id || `profile_notif_${idx}`,
        title: n.title,
        body: n.text || n.body,
        read: n.read,
        timestampText: n.time || 'Recently',
        type: 'general'
      }));

  return (
    <div className="dashboard-container">
      <NotificationPopup />
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} profile={profile} setProfile={setProfile} />
      
      <div className="dashboard-main">
        <header className="dashboard-header">
          <div className="header-left">
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
                {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
              </button>

              {showNotifications && (
                <div className="notification-dropdown animate-fade-in-slide-up">
                  <div className="dropdown-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h4 style={{ margin: 0 }}>Notifications</h4>
                    {unreadCount > 0 ? (
                      <button 
                        type="button"
                        onClick={handleMarkAllRead}
                        style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                      >
                        Mark all read ({unreadCount})
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
                {profile?.photo || user?.photoURL ? (
                  <img src={profile?.photo || user.photoURL} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <Icon name="user" width="18" height="18" />
                )}
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
