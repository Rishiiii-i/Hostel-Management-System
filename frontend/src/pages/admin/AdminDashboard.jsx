import './AdminDashboard.css'
import AdminOverview from './AdminOverview'
import AdminStudents from './AdminStudents'
import AdminRooms from './AdminRooms'
import AdminFees from './AdminFees'
import AdminComplaints from './AdminComplaints'
import AdminProfile from './AdminProfile'

export default function AdminDashboard({ activeTab = 'overview', setActiveTab, profile, setProfile }) {
  return (
    <div className="admin-dashboard-page">
      {activeTab === 'overview' && <AdminOverview setActiveTab={setActiveTab} />}
      {activeTab === 'students' && <AdminStudents />}
      {activeTab === 'rooms' && <AdminRooms />}
      {activeTab === 'fees' && <AdminFees />}
      {activeTab === 'complaints' && <AdminComplaints />}
      {activeTab === 'notices' && (
        <div className="tab-pane animate-fade-in-slide-up">
          <div className="owner-card-box">
            <h3>Hostel Broadcast Notices</h3>
            <p style={{ color: '#64748b', marginTop: '10px' }}>No active broadcast announcements posted today.</p>
          </div>
        </div>
      )}
      {activeTab === 'profile' && <AdminProfile profile={profile} setProfile={setProfile} />}
    </div>
  )
}
