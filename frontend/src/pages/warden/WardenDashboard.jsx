import './WardenDashboard.css'
import '../admin/AdminDashboard.css'
import WardenOverview from './WardenOverview'
import WardenAttendance from './WardenAttendance'
import WardenRooms from './WardenRooms'
import WardenGatePasses from './WardenGatePasses'
import WardenComplaints from './WardenComplaints'
import WardenNotices from './WardenNotices'
import WardenProfile from './WardenProfile'
import WardenMess from './WardenMess'

export default function WardenDashboard({ activeTab = 'overview', setActiveTab, profile, setProfile }) {
  const validTabs = ['overview', 'attendance', 'rooms', 'gatepasses', 'complaints', 'notices', 'mess', 'profile']
  const currentTab = validTabs.includes(activeTab) ? activeTab : 'overview'

  return (
    <div className="warden-dashboard-page">
      {currentTab === 'overview' && <WardenOverview setActiveTab={setActiveTab} />}
      {currentTab === 'attendance' && <WardenAttendance />}
      {currentTab === 'rooms' && <WardenRooms />}
      {currentTab === 'gatepasses' && <WardenGatePasses />}
      {currentTab === 'complaints' && <WardenComplaints />}
      {currentTab === 'notices' && <WardenNotices />}
      {currentTab === 'mess' && <WardenMess />}
      {currentTab === 'profile' && <WardenProfile profile={profile} setProfile={setProfile} />}
    </div>
  )
}
