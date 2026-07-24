import { useState, useEffect } from 'react'
import './Sidebar.css'
import Icon from './Icon'
import { useAuth } from '../context/AuthContext'

export default function Sidebar({ activeTab, setActiveTab, profile = {}, setProfile }) {
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
      id: 'rooms',
      label: 'Room Allocation',
      icon: <Icon name="room" width="18" height="18" />
    },
    {
      id: 'gatepasses',
      label: 'Gate Passes',
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
      id: 'mess',
      label: 'Mess Menu',
      icon: <Icon name="fee" width="18" height="18" />
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

  const [badges, setBadges] = useState({
    complaints: 0,
    gatepasses: 0,
    attendanceUnmarked: false,
    feesUnpaid: false,
    roomNotifications: 0,
    noticesNotifications: 0
  });

  useEffect(() => {
    let active = true;
    const fetchBadges = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      const fetchWithHeaders = async (url) => {
        try {
          const res = await fetch(url, {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });
          if (res.ok) return await res.json();
        } catch (e) {
          console.error(e);
        }
        return null;
      };

      try {
        if (isWarden) {
          const comps = await fetchWithHeaders('http://localhost:5000/api/warden/complaints');
          const pendingComps = comps && Array.isArray(comps) ? comps.filter(c => c.status === 'Pending').length : 0;

          const passes = await fetchWithHeaders('http://localhost:5000/api/warden/gatepasses');
          const pendingPasses = passes && Array.isArray(passes) ? passes.filter(p => p.status === 'Pending').length : 0;

          const today = new Date().toISOString().split('T')[0];
          const att = await fetchWithHeaders(`http://localhost:5000/api/warden/attendance?date=${today}`);
          const unmarked = att && Array.isArray(att) ? att.length === 0 : false;

          // Sync warden profile for notifications
          const prof = await fetchWithHeaders('http://localhost:5000/api/warden/profile');
          if (prof && setProfile) {
            setProfile(prof);
          }

          if (active) {
            setBadges({
              complaints: pendingComps,
              gatepasses: pendingPasses,
              attendanceUnmarked: unmarked,
              feesUnpaid: false,
              roomNotifications: 0,
              noticesNotifications: 0
            });
          }
        } else if (isAdmin) {
          const comps = await fetchWithHeaders('http://localhost:5000/api/warden/complaints');
          const pendingComps = comps && Array.isArray(comps) ? comps.filter(c => c.status === 'Pending').length : 0;
          
          const passes = await fetchWithHeaders('http://localhost:5000/api/warden/gatepasses');
          const pendingPasses = passes && Array.isArray(passes) ? passes.filter(p => p.status === 'Pending').length : 0;

          // Sync admin profile for notifications
          const prof = await fetchWithHeaders('http://localhost:5000/api/admin/profile');
          if (prof && setProfile) {
            setProfile(prof);
          }

          if (active) {
            setBadges({
              complaints: pendingComps,
              gatepasses: pendingPasses,
              attendanceUnmarked: false,
              feesUnpaid: false,
              roomNotifications: 0,
              noticesNotifications: 0
            });
          }
        } else {
          const txns = await fetchWithHeaders('http://localhost:5000/api/student/transactions');
          const unpaid = txns && Array.isArray(txns) ? txns.length === 0 : false;

          const prof = await fetchWithHeaders('http://localhost:5000/api/student/profile');
          if (prof && setProfile) {
            setProfile({
              ...prof,
              fullName: prof.name || prof.fullName || ''
            });
          }

          const notificationsList = prof && prof.notifications && Array.isArray(prof.notifications)
            ? prof.notifications.filter(n => !n.read)
            : [];

          let roomUnread = 0;
          let gatepassUnread = 0;
          let complaintsUnread = 0;
          let noticesUnread = 0;

          notificationsList.forEach(n => {
            const title = (n.title || '').toLowerCase();
            if (title.includes('room')) {
              roomUnread++;
            } else if (title.includes('gate pass') || title.includes('pass')) {
              gatepassUnread++;
            } else if (title.includes('complaint')) {
              complaintsUnread++;
            } else {
              noticesUnread++;
            }
          });

          if (active) {
            setBadges({
              complaints: complaintsUnread,
              gatepasses: gatepassUnread,
              attendanceUnmarked: false,
              feesUnpaid: unpaid,
              roomNotifications: roomUnread,
              noticesNotifications: noticesUnread
            });
          }
        }
      } catch (err) {
        console.error('Failed to fetch sidebar badges:', err);
      }
    };

    fetchBadges();
    const interval = setInterval(fetchBadges, 30000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [user, isWarden, isAdmin]);

  const handleLogout = async () => {
    try {
      await logOut()
    } catch (err) {
      console.error('Logout failed:', err)
    }
  }

  const handleTabClick = async (tabId) => {
    setActiveTab(tabId);
    if (isWarden || isAdmin) return;

    let category = null;
    if (tabId === 'room' && badges.roomNotifications > 0) {
      category = 'room';
    } else if (tabId === 'gatepass' && badges.gatepasses > 0) {
      category = 'gatepass';
    } else if (tabId === 'complaints' && badges.complaints > 0) {
      category = 'complaint';
    } else if (tabId === 'notices' && badges.noticesNotifications > 0) {
      category = 'notice';
    }

    if (category) {
      setBadges(prev => {
        const updated = { ...prev };
        if (category === 'room') updated.roomNotifications = 0;
        else if (category === 'gatepass') updated.gatepasses = 0;
        else if (category === 'complaint') updated.complaints = 0;
        else if (category === 'notice') updated.noticesNotifications = 0;
        return updated;
      });

      try {
        const token = localStorage.getItem('token');
        await fetch('http://localhost:5000/api/student/notifications/read', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ category })
        });
      } catch (err) {
        console.error('Failed to mark category notifications as read:', err);
      }
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
        {navItems.map((item) => {
          let badgeText = null;
          let badgeColor = '#ef4444';
          
          if (item.id === 'complaints') {
            if (isWarden || isAdmin) {
              if (badges.complaints > 0) badgeText = badges.complaints;
            } else {
              if (badges.complaints > 0) {
                badgeText = badges.complaints;
                badgeColor = '#3b82f6';
              }
            }
          } else if (item.id === 'gatepasses' || item.id === 'gatepass') {
            if (isWarden || isAdmin) {
              if (badges.gatepasses > 0) badgeText = badges.gatepasses;
            } else {
              if (badges.gatepasses > 0) {
                badgeText = badges.gatepasses;
                badgeColor = '#3b82f6';
              }
            }
          } else if (item.id === 'room') {
            if (!isWarden && !isAdmin && badges.roomNotifications > 0) {
              badgeText = badges.roomNotifications;
              badgeColor = '#3b82f6';
            }
          } else if (item.id === 'notices') {
            if (!isWarden && !isAdmin && badges.noticesNotifications > 0) {
              badgeText = badges.noticesNotifications;
              badgeColor = '#3b82f6';
            }
          } else if (item.id === 'attendance' && badges.attendanceUnmarked) {
            badgeText = 'unmarked';
            badgeColor = '#f59e0b';
          } else if (item.id === 'fees' && badges.feesUnpaid) {
            badgeText = 'unpaid';
            badgeColor = '#ef4444';
          }

          return (
            <button
              key={item.id}
              type="button"
              className={`sidebar-link ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => handleTabClick(item.id)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="sidebar-icon">{item.icon}</span>
                <span className="sidebar-label">{item.label}</span>
              </div>
              {badgeText && (
                <span style={{
                  background: badgeColor,
                  color: '#ffffff',
                  fontSize: '10.5px',
                  fontWeight: 800,
                  padding: badgeText === 'unmarked' || badgeText === 'unpaid' ? '3px 8px' : '2px 7px',
                  borderRadius: '10px',
                  lineHeight: 1,
                  marginLeft: 'auto'
                }}>
                  {badgeText}
                </span>
              )}
            </button>
          )
        })}
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
                {profile?.fullName || user?.name || (isAdmin ? 'System Administrator' : isWarden ? 'Dileep' : 'Student')}
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
