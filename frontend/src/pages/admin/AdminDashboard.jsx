import './AdminDashboard.css'
import AdminOverview from './AdminOverview'
import AdminStudents from './AdminStudents'
import AdminRooms from './AdminRooms'
import AdminFees from './AdminFees'
import AdminComplaints from './AdminComplaints'
import AdminProfile from './AdminProfile'
import AdminNotices from './AdminNotices'

export default function AdminDashboard({ activeTab = 'overview', setActiveTab, profile, setProfile }) {
  const validTabs = ['overview', 'students', 'rooms', 'fees', 'complaints', 'notices', 'profile']
  const currentTab = validTabs.includes(activeTab) ? activeTab : 'overview'

  return (
    <div className="admin-dashboard-page">
      {currentTab === 'overview' && <AdminOverview setActiveTab={setActiveTab} />}
      {currentTab === 'students' && <AdminStudents />}
      {currentTab === 'rooms' && <AdminRooms />}
      {currentTab === 'fees' && <AdminFees />}
      {currentTab === 'complaints' && <AdminComplaints />}
      {currentTab === 'notices' && <AdminNotices />}
      {currentTab === 'profile' && <AdminProfile profile={profile} setProfile={setProfile} />}
    </div>
  )
}
