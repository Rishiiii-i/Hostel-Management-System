import './MainLayout.css'
import { useState } from 'react'
import Sidebar from '../components/Sidebar'
import Icon from '../components/Icon'
import { useAuth } from '../context/AuthContext'

export default function MainLayout({ children, activeTab, setActiveTab, profile, setProfile }) {
  const [showNotifications, setShowNotifications] = useState(false)
  const { user } = useAuth()

  const notifications = profile?.notifications || []
  const unreadCount = notifications.filter(n => !n.read).length

  const toggleNotifications = async () => {
    const nextShow = !showNotifications;
    setShowNotifications(nextShow);
    
    if (nextShow && unreadCount > 0) {
      try {
        const res = await fetch('http://localhost:5000/api/student/notifications/read', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (res.ok) {
          if (profile && profile.notifications) {
            profile.notifications.forEach(n => { n.read = true; });
          }
          // Clear local profile alert badges
          if (setProfile) {
            setProfile({ ...profile });
          }
        }
      } catch (err) {
        console.error('Failed to mark notifications as read:', err);
      }
    }
  }

  return (
    <div className="dashboard-container">
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
              <h2>{user?.role === 'administrator' || user?.role === 'admin' || window.location.hash === '#admin-dashboard' ? 'Admin Dashboard' : user?.role === 'warden' || window.location.hash === '#warden-dashboard' ? 'Warden Dashboard' : 'Student Dashboard'}</h2>
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
                  <div className="dropdown-header">
                    <h4>Notifications</h4>
                    <span className="count">{unreadCount} new</span>
                  </div>
                  <div className="dropdown-list">
                    {notifications.length === 0 ? (
                      <p className="empty-state-text">No notifications.</p>
                    ) : (
                      notifications.map((n) => (
                        <div key={n.id} className="notification-item" style={{ opacity: n.read ? 0.65 : 1 }}>
                          <strong>{n.title}</strong>
                          <p>{n.text}</p>
                          <small>{n.time}</small>
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
  )
}
