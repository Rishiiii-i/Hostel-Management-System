import Icon from './Icon'
import roomIcon from '../assets/icons/room.png'
import feeIcon from '../assets/icons/fee.png'
import complaintIcon from '../assets/icons/complaint.png'
import attendanceIcon from '../assets/icons/attendance.png'
import bellIcon from '../assets/icons/bell.png'
import { useAuth } from '../context/AuthContext'

export default function Sidebar({ activeTab, setActiveTab }) {
  const { user, logOut } = useAuth()

  const navItems = [
    {
      id: 'overview',
      label: 'Home',
      icon: <Icon name="building" />
    },
    {
      id: 'room',
      label: 'My Room',
      icon: <img src={roomIcon} alt="My Room" width="18" height="18" />
    },
    {
      id: 'fees',
      label: 'Fees & Payments',
      icon: <img src={feeIcon} alt="Fees" width="18" height="18" />
    },
    {
      id: 'complaints',
      label: 'Complaints',
      icon: <img src={complaintIcon} alt="Complaints" width="18" height="18" />
    },
    {
      id: 'gatepass',
      label: 'Gate Pass & Attendance',
      icon: <img src={attendanceIcon} alt="Attendance" width="18" height="18" />
    },
    {
      id: 'notices',
      label: 'Notices',
      icon: <img src={bellIcon} alt="Notices" width="18" height="18" />
    }
  ]

  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to log out?")) {
      await logOut()
      window.location.href = '#home'
    }
  }

  return (
    <aside className="dashboard-sidebar">
      <div className="sidebar-brand">
        <a className="brand" href="#home">
          <span>
            <Icon name="building" />
          </span>
          Smart Hostel
        </a>
      </div>

      <div className="portal-badge" style={{ textTransform: 'capitalize' }}>
        <span className="portal-dot"></span>
        {user?.role || 'Student'} Portal
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`sidebar-link ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
          >
            <span className="sidebar-icon">{item.icon}</span>
            <span className="sidebar-label">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-profile">
          <div className="user-avatar-wrapper" style={{ overflow: 'hidden', borderRadius: '50%', width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <svg viewBox="0 0 40 40" width="38" height="38" className="user-photo-avatar">
                <rect width="40" height="40" rx="20" fill="url(#sidebar-avatar-grad)" />
                <defs>
                  <linearGradient id="sidebar-avatar-grad" x1="0" y1="0" x2="40" y2="40">
                    <stop offset="0%" stopColor="#1e6b51" />
                    <stop offset="100%" stopColor="#0f3d2e" />
                  </linearGradient>
                </defs>
                <circle cx="20" cy="14" r="7" fill="#ffffff" opacity="0.95" />
                <path d="M7 34c0-6.8 5.4-12 13-12s13 5.2 13 12" fill="#ffffff" opacity="0.95" />
              </svg>
            )}
          </div>
          <div className="user-info">
            <span className="user-name">{user?.name || 'Rahul Sharma'}</span>
            <span className="user-role" style={{ textTransform: 'capitalize' }}>{user?.role || 'Student'}</span>
          </div>
          <button 
            type="button" 
            className="sidebar-logout-btn" 
            title="Log Out" 
            onClick={handleLogout}
            aria-label="Log Out"
          >
            <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  )
}
