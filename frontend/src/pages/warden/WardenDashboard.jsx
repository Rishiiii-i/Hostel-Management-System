import './WardenDashboard.css'
import WardenOverview from './WardenOverview'
import WardenAttendance from './WardenAttendance'
import WardenComplaints from './WardenComplaints'
import WardenNotices from './WardenNotices'
import WardenProfile from './WardenProfile'

export default function WardenDashboard({ activeTab = 'overview', setActiveTab, profile, setProfile }) {
  return (
    <div className="warden-dashboard-page">
      {activeTab === 'overview' && <WardenOverview setActiveTab={setActiveTab} />}
      {activeTab === 'attendance' && <WardenAttendance />}
      {activeTab === 'complaints' && <WardenComplaints />}
      {activeTab === 'notices' && <WardenNotices />}
      {activeTab === 'profile' && <WardenProfile profile={profile} setProfile={setProfile} />}
    </div>
  )
}
