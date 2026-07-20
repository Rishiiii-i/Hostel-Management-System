import { useState } from 'react'
import roomIcon from '../assets/icons/room.png'
import feeIcon from '../assets/icons/fee.png'
import complaintIcon from '../assets/icons/complaint.png'
import attendanceIcon from '../assets/icons/attendance.png'
import bellIcon from '../assets/icons/bell.png'
import settingsIcon from '../assets/icons/settings.png'
import Icon from '../components/Icon'

export default function StudentDashboard({ activeTab = 'overview', setActiveTab, profile, setProfile }) {
  const [complaints, setComplaints] = useState([])
  const [gatePasses, setGatePasses] = useState([])
  const [transactions, setTransactions] = useState([])
  const [notices] = useState([])

  const [feePaid, setFeePaid] = useState(false)
  const [showPayModal, setShowPayModal] = useState(false)
  const [showComplaintModal, setShowComplaintModal] = useState(false)
  const [showGatePassModal, setShowGatePassModal] = useState(false)

  const [newComplaint, setNewComplaint] = useState({ category: 'Electrical', title: '', priority: 'Medium' })
  const [newGatePass, setNewGatePass] = useState({ reason: '', departure: '', returnDate: '' })
  const [payAmount, setPayAmount] = useState('450.00')

  const [savedSuccessMsg, setSavedSuccessMsg] = useState('')

  const handleSaveProfile = (e) => {
    e.preventDefault()
    setSavedSuccessMsg('Profile updated successfully!')
    setTimeout(() => {
      setSavedSuccessMsg('')
    }, 4000)
  }

  const handleAddComplaint = (e) => {
    e.preventDefault()
    if (!newComplaint.title) return
    const item = {
      id: `REQ-${Math.floor(100 + Math.random() * 900)}`,
      category: newComplaint.category,
      title: newComplaint.title,
      date: new Date().toISOString().split('T')[0],
      status: 'Pending',
      priority: newComplaint.priority
    }
    setComplaints([item, ...complaints])
    setNewComplaint({ category: 'Electrical', title: '', priority: 'Medium' })
    setShowComplaintModal(false)
  }

  const handleAddGatePass = (e) => {
    e.preventDefault()
    if (!newGatePass.reason) return
    const item = {
      id: `GP-${Math.floor(100 + Math.random() * 900)}`,
      reason: newGatePass.reason,
      departure: newGatePass.departure || new Date().toISOString().slice(0, 16),
      returnDate: newGatePass.returnDate || new Date().toISOString().slice(0, 16),
      status: 'Pending'
    }
    setGatePasses([item, ...gatePasses])
    setNewGatePass({ reason: '', departure: '', returnDate: '' })
    setShowGatePassModal(false)
  }

  const handlePayFee = () => {
    const txn = {
      id: `TXN-${Math.floor(1000 + Math.random() * 9000)}`,
      period: 'Hostel Fee',
      amount: `$${payAmount}`,
      date: new Date().toISOString().split('T')[0],
      status: 'Paid'
    }
    setTransactions([txn, ...transactions])
    setFeePaid(true)
    setShowPayModal(false)
  }

  return (
    <div className="student-dashboard">
      {/*
home / overview tab
 */}
      {activeTab === 'overview' && (
        <div className="tab-pane animate-fade-in-slide-up">
          <div className="welcome-banner">
            <div className="banner-content">
              <h1>Welcome to Smart Hostel</h1>
              <p>Manage your room, fees, and requests easily in one place.</p>
            </div>
            <div className="banner-quick-stats">
              <div className="stat-box">
                <span className="stat-label">My Room</span>
                <strong className="stat-value">{profile.room}</strong>
                <small className="stat-sub">{profile.block}</small>
              </div>
              <div className="stat-box">
                <span className="stat-label">Pending Fees</span>
                <strong className={`stat-value ${feePaid ? 'text-success' : 'text-warning'}`}>
                  {feePaid ? 'Paid' : '$0.00'}
                </strong>
                <small className="stat-sub">{feePaid ? 'Fee paid in full' : 'No dues pending'}</small>
              </div>
            </div>
          </div>

          <div className="dashboard-feature-grid">
            <div className="dash-card dashboard-feature-card" onClick={() => setActiveTab('room')}>
              <img src={roomIcon} alt="Room" width="32" height="32" />
              <h4>Rooms and Allocation</h4>
              <p>Check your assigned room, bed number, room status, and view roommates.</p>
              <span className="dashboard-feature-card-link">Go to Room Details &rarr;</span>
            </div>

            <div className="dash-card dashboard-feature-card" onClick={() => setActiveTab('fees')}>
              <img src={feeIcon} alt="Fees" width="32" height="32" />
              <h4>Fees & Payments</h4>
              <p>View your pending dues, payment history, and download official receipts.</p>
              <span className="dashboard-feature-card-link">Go to Fees &rarr;</span>
            </div>

            <div className="dash-card dashboard-feature-card" onClick={() => setActiveTab('complaints')}>
              <img src={complaintIcon} alt="Complaints" width="32" height="32" />
              <h4>Requests & Complaints</h4>
              <p>Report maintenance problems, register complaints, and track repair status.</p>
              <span className="dashboard-feature-card-link">Go to Complaints &rarr;</span>
            </div>

            <div className="dash-card dashboard-feature-card" onClick={() => setActiveTab('gatepass')}>
              <img src={attendanceIcon} alt="Attendance" width="32" height="32" />
              <h4>Gate Pass & Attendance</h4>
              <p>Submit gate pass outing requests and check your monthly attendance records.</p>
              <span className="dashboard-feature-card-link">Go to Gate Pass &rarr;</span>
            </div>
          </div>

          <div className="dashboard-grid-2col">
            <div className="dash-card">
              <div className="card-header">
                <h3>Mess Menu</h3>
                <span className="badge-tag">Today</span>
              </div>
              <div className="mess-menu-grid">
                <p className="empty-state-text">No menu added for today.</p>
              </div>
            </div>

            <div className="dash-card">
              <div className="card-header">
                <h3>Quick Actions</h3>
              </div>
              <div className="quick-actions-btns">
                <button type="button" className="btn-pay-fee" onClick={() => setShowPayModal(true)}>
                  Pay Fee
                </button>
                <button type="button" className="btn-report-problem" onClick={() => setShowComplaintModal(true)}>
                  Report a Problem
                </button>
                <button type="button" className="btn-ask-gatepass" onClick={() => setShowGatePassModal(true)}>
                  Ask for Gate Pass
                </button>
              </div>

              <div className="card-header" style={{ marginTop: '24px' }}>
                <h3>Hostel Notices</h3>
              </div>
              <div className="notice-mini-list">
                {notices.length === 0 ? (
                  <p className="empty-state-text">No notices right now.</p>
                ) : (
                  notices.map((n, i) => (
                    <div key={i} className="notice-item">
                      <span className="notice-tag info">Notice</span>
                      <div>
                        <strong>{n.title}</strong>
                        <small>{n.date}</small>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/*
my room tab
 */}
      {activeTab === 'room' && (
        <div className="tab-pane animate-fade-in-slide-up">
          <div className="tab-header-box">
            <div className="tab-title-row">
              <div className="tab-title-with-icon">
                <img src={roomIcon} alt="Room" width="28" height="28" style={{ marginRight: '8px' }} />
                <div>
                  <h2 className="tab-title">My Room Details</h2>
                  <p className="tab-subtitle">Check details about your assigned hostel room and bed.</p>
                </div>
              </div>
            </div>
            <div className="tab-divider"></div>
          </div>

          <div className="dash-card">
            <h3>Assigned Room Information</h3>
            <div className="room-info-grid">
              <p><strong>Room Number:</strong> {profile.room}</p>
              <p><strong>Block:</strong> {profile.block}</p>
              <p><strong>Occupants:</strong> 2 Students</p>
              <p><strong>Status:</strong> Active Resident</p>
            </div>
          </div>
        </div>
      )}

      {/*
fees & payments tab
 */}
      {activeTab === 'fees' && (
        <div className="tab-pane animate-fade-in-slide-up">
          <div className="tab-header-box">
            <div className="tab-title-row">
              <div className="tab-title-with-icon">
                <img src={feeIcon} alt="Fees" width="28" height="28" style={{ marginRight: '8px' }} />
                <div>
                  <h2 className="tab-title">Fees & Payments</h2>
                  <p className="tab-subtitle">Check your hostel fees and download official payment receipts.</p>
                </div>
              </div>
              <button type="button" className="btn-pay-fee" onClick={() => setShowPayModal(true)}>
                Pay Fee
              </button>
            </div>
            <div className="tab-divider"></div>
          </div>

          <div className="dash-card">
            <h3>Payment History</h3>
            {transactions.length === 0 ? (
              <p className="empty-state-text">No payments yet.</p>
            ) : (
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Payment ID</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => (
                    <tr key={t.id}>
                      <td><strong>{t.id}</strong></td>
                      <td>{t.period}</td>
                      <td>{t.amount}</td>
                      <td>{t.date}</td>
                      <td><span className="status-badge paid">{t.status}</span></td>
                      <td><button type="button" className="btn-sm" onClick={() => alert('Downloading receipt...')}>Download</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/*
complaints tab
 */}
      {activeTab === 'complaints' && (
        <div className="tab-pane animate-fade-in-slide-up">
          <div className="tab-header-box">
            <div className="tab-title-row">
              <div className="tab-title-with-icon">
                <img src={complaintIcon} alt="Complaints" width="28" height="28" style={{ marginRight: '8px' }} />
                <div>
                  <h2 className="tab-title">Complaints & Repairs</h2>
                  <p className="tab-subtitle">Report a maintenance problem and track repair progress.</p>
                </div>
              </div>
              <button type="button" className="btn-report-problem" onClick={() => setShowComplaintModal(true)}>
                Report a Problem
              </button>
            </div>
            <div className="tab-divider"></div>
          </div>

          <div className="dash-card">
            {complaints.length === 0 ? (
              <p className="empty-state-text">No complaints reported yet.</p>
            ) : (
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Category</th>
                    <th>Problem Description</th>
                    <th>Date</th>
                    <th>Priority</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {complaints.map((c) => (
                    <tr key={c.id}>
                      <td><strong>{c.id}</strong></td>
                      <td><span className="category-tag">{c.category}</span></td>
                      <td>{c.title}</td>
                      <td>{c.date}</td>
                      <td><span className={`priority-tag ${c.priority.toLowerCase()}`}>{c.priority}</span></td>
                      <td>
                        <span className={`status-badge ${c.status.toLowerCase().replace(' ', '-')}`}>
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/*
gate pass & attendance tab
 */}
      {activeTab === 'gatepass' && (
        <div className="tab-pane animate-fade-in-slide-up">
          <div className="tab-header-box">
            <div className="tab-title-row">
              <div className="tab-title-with-icon">
                <img src={attendanceIcon} alt="Attendance" width="28" height="28" style={{ marginRight: '8px' }} />
                <div>
                  <h2 className="tab-title">Gate Pass & Attendance</h2>
                  <p className="tab-subtitle">Apply for outing gate pass or view your monthly attendance record.</p>
                </div>
              </div>
              <button type="button" className="btn-ask-gatepass" onClick={() => setShowGatePassModal(true)}>
                Ask for Gate Pass
              </button>
            </div>
            <div className="tab-divider"></div>
          </div>

          <div className="dashboard-grid-2col" style={{ marginTop: '24px' }}>
            <div className="dash-card">
              <h3>Monthly Attendance</h3>
              <div className="attendance-summary">
                <div className="att-stat">
                  <strong>0 Days</strong>
                  <span>Present</span>
                </div>
                <div className="att-stat">
                  <strong>0 Days</strong>
                  <span>Leave</span>
                </div>
                <div className="att-stat">
                  <strong>0%</strong>
                  <span>Total</span>
                </div>
              </div>
            </div>

            <div className="dash-card">
              <h3>Gate Pass Requests</h3>
              {gatePasses.length === 0 ? (
                <p className="empty-state-text">No gate pass requests yet.</p>
              ) : (
                <div className="gatepass-list">
                  {gatePasses.map((gp) => (
                    <div key={gp.id} className="gatepass-card">
                      <div className="gp-header">
                        <strong>{gp.id} &bull; {gp.reason}</strong>
                        <span className={`status-badge ${gp.status.toLowerCase().replace(' ', '-')}`}>{gp.status}</span>
                      </div>
                      <p>Departure: {gp.departure} &bull; Return: {gp.returnDate}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/*
notices tab
 */}
      {activeTab === 'notices' && (
        <div className="tab-pane animate-fade-in-slide-up">
          <div className="tab-header-box">
            <div className="tab-title-row">
              <div className="tab-title-with-icon">
                <img src={bellIcon} alt="Notices" width="28" height="28" style={{ marginRight: '8px' }} />
                <div>
                  <h2 className="tab-title">Hostel Notices</h2>
                  <p className="tab-subtitle">Important announcements and official updates from hostel management.</p>
                </div>
              </div>
            </div>
            <div className="tab-divider"></div>
          </div>

          <div className="dash-card">
            <p className="empty-state-text">No notices right now.</p>
          </div>
        </div>
      )}

      {/*
settings / profile tab
 */}
      {activeTab === 'settings' && (
        <div className="tab-pane animate-fade-in-slide-up">
          <div className="tab-header-box">
            <div className="tab-title-row">
              <div className="tab-title-with-icon">
                <img src={settingsIcon} alt="Settings" width="28" height="28" style={{ marginRight: '8px' }} />
                <div>
                  <h2 className="tab-title">Account & Profile Settings</h2>
                  <p className="tab-subtitle">View and update your personal information and contact details.</p>
                </div>
              </div>
            </div>
            <div className="tab-divider"></div>
          </div>

          {savedSuccessMsg && (
            <div className="alert-success-box animate-fade-in">
              <Icon name="checkmark" width="20" height="20" />
              <span>{savedSuccessMsg}</span>
            </div>
          )}

          <div className="settings-grid">
            <div className="dash-card profile-card-header">
              <div className="profile-avatar-big">
                <Icon name="user" width="30" height="30" />
              </div>
              <div className="profile-card-details">
                <h3>{profile.fullName}</h3>
                <span className="profile-roll">{profile.rollNo} &bull; Computer Science</span>
                <span className="profile-badge-active">Active Student</span>
              </div>
            </div>

            <div className="dash-card">
              <h3>Personal & Contact Details</h3>
              <form onSubmit={handleSaveProfile} className="settings-form">
                <div className="form-grid-2col">
                  <label className="form-label">
                    Full Name
                    <input
                      type="text"
                      value={profile.fullName}
                      onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                      required
                    />
                  </label>

                  <label className="form-label">
                    Email Address
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      required
                    />
                  </label>

                  <label className="form-label">
                    Phone Number
                    <input
                      type="tel"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      required
                    />
                  </label>

                  <label className="form-label">
                    Emergency Contact
                    <input
                      type="tel"
                      value={profile.emergencyContact}
                      onChange={(e) => setProfile({ ...profile, emergencyContact: e.target.value })}
                      required
                    />
                  </label>

                  <label className="form-label">
                    Room Number
                    <input
                      type="text"
                      value={profile.room}
                      onChange={(e) => setProfile({ ...profile, room: e.target.value })}
                      required
                    />
                  </label>

                  <label className="form-label">
                    Hostel Block
                    <input
                      type="text"
                      value={profile.block}
                      onChange={(e) => setProfile({ ...profile, block: e.target.value })}
                      required
                    />
                  </label>
                </div>

                <div className="form-actions-right">
                  <button type="submit" className="btn-save-profile">
                    Save Profile Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/*
fee payment modal
 */}
      {showPayModal && (
        <div className="modal-backdrop modal-pay-fee animate-fade-in">
          <div className="modal-box animate-scale-in">
            <h3>Pay Fee</h3>
            <label className="form-label">
              Enter Amount ($)
              <input
                type="number"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                required
              />
            </label>
            <div className="payment-options">
              <label><input type="radio" name="pay" defaultChecked /> Credit / Debit Card</label>
              <label><input type="radio" name="pay" /> Bank Transfer</label>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setShowPayModal(false)}>Cancel</button>
              <button type="button" className="btn-pay-fee" onClick={handlePayFee}>Pay Now</button>
            </div>
          </div>
        </div>
      )}

      {/*
report a problem modal
 */}
      {showComplaintModal && (
        <div className="modal-backdrop modal-report-problem animate-fade-in">
          <div className="modal-box animate-scale-in">
            <h3>Report a Problem</h3>
            <form onSubmit={handleAddComplaint}>
              <label className="form-label">
                Category
                <select
                  value={newComplaint.category}
                  onChange={(e) => setNewComplaint({ ...newComplaint, category: e.target.value })}
                >
                  <option value="Electrical">Electrical</option>
                  <option value="Plumbing">Plumbing</option>
                  <option value="Furniture">Furniture</option>
                  <option value="Cleaning">Cleaning</option>
                  <option value="Internet">Internet</option>
                </select>
              </label>

              <label className="form-label">
                Problem Description
                <input
                  type="text"
                  placeholder="Describe your problem"
                  value={newComplaint.title}
                  onChange={(e) => setNewComplaint({ ...newComplaint, title: e.target.value })}
                  required
                />
              </label>

              <label className="form-label">
                Priority
                <select
                  value={newComplaint.priority}
                  onChange={(e) => setNewComplaint({ ...newComplaint, priority: e.target.value })}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </label>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowComplaintModal(false)}>Cancel</button>
                <button type="submit" className="btn-report-problem">Submit Complaint</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/*
gate pass modal
 */}
      {showGatePassModal && (
        <div className="modal-backdrop modal-ask-gatepass animate-fade-in">
          <div className="modal-box animate-scale-in">
            <h3>Ask for Gate Pass</h3>
            <form onSubmit={handleAddGatePass}>
              <label className="form-label">
                Reason
                <input
                  type="text"
                  placeholder="Reason for going out"
                  value={newGatePass.reason}
                  onChange={(e) => setNewGatePass({ ...newGatePass, reason: e.target.value })}
                  required
                />
              </label>

              <label className="form-label">
                Departure Time
                <input
                  type="datetime-local"
                  value={newGatePass.departure}
                  onChange={(e) => setNewGatePass({ ...newGatePass, departure: e.target.value })}
                  required
                />
              </label>

              <label className="form-label">
                Return Time
                <input
                  type="datetime-local"
                  value={newGatePass.returnDate}
                  onChange={(e) => setNewGatePass({ ...newGatePass, returnDate: e.target.value })}
                  required
                />
              </label>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowGatePassModal(false)}>Cancel</button>
                <button type="submit" className="btn-ask-gatepass">Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
