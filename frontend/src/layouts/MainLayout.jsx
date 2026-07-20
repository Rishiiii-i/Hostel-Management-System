import { useState } from 'react'
import Sidebar from '../components/Sidebar'
import Icon from '../components/Icon'

export default function MainLayout({ children, activeTab, setActiveTab }) {
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications] = useState([])

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      window.location.href = '#home'
    }
  }

  return (
    <div className="dashboard-container">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <div className="dashboard-main">
        <header className="dashboard-header">
          <div className="header-left">
            <div className="header-title-flex">
              <span className="header-logo-badge">
                <Icon name="building" />
              </span>
              <h2>Student Dashboard</h2>
            </div>
            <p className="header-date">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>

          <div className="header-right">
            <div className="header-search">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#64748b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input type="text" placeholder="Search dashboard..." />
              <kbd className="search-kbd">⌘K</kbd>
            </div>

            <div className="notification-wrapper">
              <button 
                type="button" 
                className="notification-btn" 
                onClick={() => setShowNotifications(!showNotifications)}
                title="Notifications"
                aria-label="Notifications"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
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
              <div className="header-avatar-circle">
                <svg viewBox="0 0 36 36" width="34" height="34" className="header-photo-avatar">
                  <rect width="36" height="36" rx="18" fill="url(#hdr-avatar-grad)" />
                  <defs>
                    <linearGradient id="hdr-avatar-grad" x1="0" y1="0" x2="36" y2="36">
                      <stop offset="0%" stopColor="#1e6b51" />
                      <stop offset="100%" stopColor="#0f3d2e" />
                    </linearGradient>
                  </defs>
                  <circle cx="18" cy="13" r="6" fill="#ffffff" opacity="0.95" />
                  <path d="M6 31c0-6 5-11 12-11s12 5 12 11" fill="#ffffff" opacity="0.95" />
                </svg>
              </div>
              <div className="user-profile-text">
                <span className="user-profile-name">Rahul Sharma</span>
                <span className="user-profile-role">Student</span>
              </div>
              <button 
                type="button" 
                className="header-logout-pill-btn" 
                title="Log Out" 
                onClick={handleLogout}
              >
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span>Logout</span>
              </button>
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
