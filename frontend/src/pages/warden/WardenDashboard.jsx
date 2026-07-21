import './WardenDashboard.css'
import '../admin/AdminDashboard.css'
import WardenOverview from './WardenOverview'
import WardenAttendance from './WardenAttendance'
import WardenComplaints from './WardenComplaints'
import WardenNotices from './WardenNotices'
import WardenProfile from './WardenProfile'

export default function WardenDashboard({ activeTab = 'overview', setActiveTab, profile, setProfile }) {
  const validTabs = ['overview', 'attendance', 'complaints', 'notices', 'profile']
  const currentTab = validTabs.includes(activeTab) ? activeTab : 'overview'

  return (
    <div className="warden-dashboard-page">
      {currentTab === 'overview' && <WardenOverview setActiveTab={setActiveTab} />}
      {currentTab === 'attendance' && <WardenAttendance />}
      {currentTab === 'complaints' && <WardenComplaints />}
      {currentTab === 'notices' && <WardenNotices />}
      {currentTab === 'profile' && <WardenProfile profile={profile} setProfile={setProfile} />}
    </div>
  )
}
