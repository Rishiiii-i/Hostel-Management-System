import './MainLayout.css'
import { useState } from 'react'
import Sidebar from '../components/Sidebar'
import Icon from '../components/Icon'
import { useAuth } from '../context/AuthContext'

export default function MainLayout({ children, activeTab, setActiveTab, profile }) {
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications] = useState([])
  const { user } = useAuth()

  return (
    <div className="dashboard-container">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} profile={profile} />
      
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
              <h2>Student Dashboard</h2>
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
                onClick={() => setShowNotifications(!showNotifications)}
                title="Notifications"
                aria-label="Notifications"
              >
                <Icon name="bell" width="18" height="18" />
                {notifications.length > 0 && <span className="badge">{notifications.length}</span>}
              </button>

              {showNotifications && (
                <div className="notification-dropdown animate-fade-in-slide-up">
                  <div className="dropdown-header">
                    <h4>Notifications</h4>
                    <span className="count">{notifications.length} new</span>
                  </div>
                  <div className="dropdown-list">
                    {notifications.length === 0 ? (
                      <p className="empty-state-text">No notifications.</p>
                    ) : (
                      notifications.map((n) => (
                        <div key={n.id} className="notification-item">
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
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <Icon name="user" width="18" height="18" />
                )}
              </div>
              <div className="user-profile-text">
                <span className="user-profile-name">{profile?.fullName || user?.name || 'Rahul Sharma'}</span>
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
