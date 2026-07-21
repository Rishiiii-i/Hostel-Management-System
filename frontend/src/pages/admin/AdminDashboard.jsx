import './AdminDashboard.css'
import AdminOverview from './AdminOverview'
import AdminStudents from './AdminStudents'
import AdminRooms from './AdminRooms'
import AdminFees from './AdminFees'
import AdminComplaints from './AdminComplaints'
import AdminProfile from './AdminProfile'

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
      {currentTab === 'notices' && (
        <div className="tab-pane animate-fade-in-slide-up">
          <div className="owner-card-box">
            <h3>Hostel Broadcast Notices</h3>
            <p style={{ color: '#64748b', marginTop: '10px' }}>No active broadcast announcements posted today.</p>
          </div>
        </div>
      )}
      {currentTab === 'profile' && <AdminProfile profile={profile} setProfile={setProfile} />}
    </div>
  )
}
