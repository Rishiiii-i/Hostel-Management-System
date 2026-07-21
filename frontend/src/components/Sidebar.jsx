import './Sidebar.css'
import Icon from './Icon'
import { useAuth } from '../context/AuthContext'

export default function Sidebar({ activeTab, setActiveTab, profile = {} }) {
  const { user, logOut } = useAuth()

  const isAdmin = user?.role === 'administrator' || user?.role === 'admin' || window.location.hash === '#admin-dashboard'
  const isWarden = user?.role === 'warden' || window.location.hash === '#warden-dashboard'

  const navItems = isAdmin ? [
    {
      id: 'overview',
      label: 'Dashboard',
      icon: <Icon name="home" width="18" height="18" />
    },
    {
      id: 'students',
      label: 'Students',
      icon: <Icon name="user" width="18" height="18" />
    },
    {
      id: 'rooms',
      label: 'Rooms',
      icon: <Icon name="room" width="18" height="18" />
    },
    {
      id: 'fees',
      label: 'Fees',
      icon: <Icon name="fee" width="18" height="18" />
    },
    {
      id: 'complaints',
      label: 'Complaints',
      icon: <Icon name="complaint" width="18" height="18" />
    },
    {
      id: 'notices',
      label: 'Notices',
      icon: <Icon name="bell" width="18" height="18" />
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: <Icon name="user" width="18" height="18" />
    }
  ] : isWarden ? [
    {
      id: 'overview',
      label: 'Dashboard',
      icon: <Icon name="home" width="18" height="18" />
    },
    {
      id: 'attendance',
      label: 'Attendance',
      icon: <Icon name="attendance" width="18" height="18" />
    },
    {
      id: 'complaints',
      label: 'Complaints',
      icon: <Icon name="complaint" width="18" height="18" />
    },
    {
      id: 'notices',
      label: 'Notices',
      icon: <Icon name="bell" width="18" height="18" />
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: <Icon name="user" width="18" height="18" />
    }
  ] : [
    {
      id: 'overview',
      label: 'Home',
      icon: <Icon name="home" width="18" height="18" />
    },
    {
      id: 'room',
      label: 'My Room',
      icon: <Icon name="room" width="18" height="18" />
    },
    {
      id: 'fees',
      label: 'Fees & Payments',
      icon: <Icon name="fee" width="18" height="18" />
    },
    {
      id: 'complaints',
      label: 'Complaints',
      icon: <Icon name="complaint" width="18" height="18" />
    },
    {
      id: 'gatepass',
      label: 'Gate Pass',
      icon: <Icon name="attendance" width="18" height="18" />
    },
    {
      id: 'notices',
      label: 'Notices',
      icon: <Icon name="bell" width="18" height="18" />
    },
    {
      id: 'settings',
      label: 'Profile',
      icon: <Icon name="settings" width="18" height="18" />
    }
  ]

  const handleLogout = async () => {
    try {
      await logOut()
    } catch (err) {
      console.error('Logout failed:', err)
    }
  }

  const userInitials = profile?.fullName
    ? profile.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : isAdmin ? 'SA' : isWarden ? 'MR' : 'ST'

  return (
    <aside className="dashboard-sidebar">
      <div className="sidebar-brand">
        <button 
          type="button" 
          className="brand" 
          onClick={() => setActiveTab('overview')}
          style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}
        >
          <span className="brand-logo-icon">
            <Icon name="building" />
          </span>
          Smart Hostel
        </button>
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
        <div className="user-profile" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden', minWidth: 0, flex: 1 }}>
            <div className="user-avatar-wrapper" style={{ overflow: 'hidden', borderRadius: '50%', width: '38px', height: '38px', display: 'grid', placeItems: 'center', background: '#1e6b51', color: '#ffffff', fontWeight: 800, fontSize: '13px', flexShrink: 0 }}>
              {profile?.photo || user?.photoURL ? (
                <img src={profile?.photo || user?.photoURL} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                userInitials
              )}
            </div>
            <div className="user-info" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
              <span className="user-name" style={{ fontWeight: 700, fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {profile?.fullName || user?.name || (isAdmin ? 'System Administrator' : isWarden ? 'Macha Rishi' : 'Student')}
              </span>
              <span className="user-role" style={{ fontSize: '0.75rem', opacity: 0.75, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {isAdmin ? 'System Administrator' : isWarden ? 'Hostel Warden' : (profile?.room ? `Room ${profile.room}` : 'Student')}
              </span>
            </div>
          </div>
          <button 
            type="button" 
            className="sidebar-logout-icon-btn" 
            onClick={handleLogout}
            title="Log Out"
          >
            <Icon name="logout" width="16" height="16" />
          </button>
        </div>
      </div>
    </aside>
  )
}
