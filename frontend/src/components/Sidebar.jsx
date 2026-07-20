import Icon from './Icon'
import homeIcon from '../assets/icons/home.png'
import roomIcon from '../assets/icons/room.png'
import feeIcon from '../assets/icons/fee.png'
import complaintIcon from '../assets/icons/complaint.png'
import attendanceIcon from '../assets/icons/attendance.png'
import bellIcon from '../assets/icons/bell.png'
import settingsIcon from '../assets/icons/settings.png'
import { useAuth } from '../context/AuthContext'

export default function Sidebar({ activeTab, setActiveTab, profile }) {
  const { user, logOut } = useAuth()

  const navItems = [
    {
      id: 'overview',
      label: 'Home',
      icon: <img src={homeIcon} alt="Home" width="18" height="18" />
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
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <img src={settingsIcon} alt="Settings" width="18" height="18" />
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
            <div className="user-avatar-wrapper" style={{ overflow: 'hidden', borderRadius: '50%', width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {user?.photoURL ? (
                <img src={user.photoURL} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <Icon name="user" width="20" height="20" />
              )}
            </div>
            <div className="user-info" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
              <span className="user-name" style={{ fontWeight: 600, fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{profile.fullName}</span>
              <span className="user-role" style={{ fontSize: '0.75rem', opacity: 0.75, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{profile.room} &bull; {profile.block}</span>
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
