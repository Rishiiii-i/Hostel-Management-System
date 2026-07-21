import './StudentDashboard.css'
import { useState, useRef } from 'react'
import Icon from '../components/Icon'

export default function StudentDashboard({ activeTab = 'overview', setActiveTab, profile, setProfile }) {
  const fileInputRef = useRef(null)
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

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      alert('File size should be less than 5MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const updated = { ...(profile || {}), photo: reader.result }
      if (setProfile) setProfile(updated)
      try {
        localStorage.setItem('shm_user_profile', JSON.stringify(updated))
      } catch (err) {}
      setSavedSuccessMsg('Profile photo updated successfully!')
      setTimeout(() => setSavedSuccessMsg(''), 4000)
    }
    reader.readAsDataURL(file)
  }

  const handleRemovePhoto = () => {
    const updated = { ...(profile || {}), photo: '' }
    if (setProfile) setProfile(updated)
    try {
      localStorage.setItem('shm_user_profile', JSON.stringify(updated))
    } catch (err) {}
    if (fileInputRef.current) fileInputRef.current.value = ''
    setSavedSuccessMsg('Profile photo removed.')
    setTimeout(() => setSavedSuccessMsg(''), 4000)
  }

  const handleSaveProfile = (e) => {
    e.preventDefault()
    setSavedSuccessMsg('Profile details updated successfully!')
    setTimeout(() => setSavedSuccessMsg(''), 4000)
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
      departure: newGatePass.departure || new Date().toISOString().slice(0, 16).replace('T', ' '),
      returnDate: newGatePass.returnDate || new Date().toISOString().slice(0, 16).replace('T', ' '),
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
    <div className="student-dashboard-page">
      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="tab-pane animate-fade-in-slide-up">
          <div className="welcome-banner">
            <div className="banner-content">
              <h1>Welcome back, {profile?.fullName || 'Student'}</h1>
              <p>Manage your room details, fee receipts, gate passes, and maintenance requests in one dashboard.</p>
            </div>
            <div className="banner-quick-stats">
              <div className="stat-box">
                <span className="stat-label">Assigned Room</span>
                <strong className="stat-value">{profile?.room || 'N/A'}</strong>
                <small className="stat-sub">{profile?.block || 'Unassigned'}</small>
              </div>
              <div className="stat-box">
                <span className="stat-label">Fee Status</span>
                <strong className={`stat-value ${feePaid ? 'text-success' : 'text-warning'}`}>
                  {feePaid ? 'Cleared' : '$450.00 Dues'}
                </strong>
                <small className="stat-sub">{feePaid ? 'Receipt Available' : 'Payment Due'}</small>
              </div>
            </div>
          </div>

          <div className="dashboard-feature-grid">
            <div className="dash-card dashboard-feature-card room-theme" onClick={() => setActiveTab('room')}>
              <div className="feature-card-header">
                <div className="feature-icon-box"><Icon name="room" width="22" height="22" style={{ filter: 'brightness(0) invert(1)' }} /></div>
                <span className="feature-badge">Active</span>
              </div>
              <h4>Room Details</h4>
              <p>View room number, block, bed allocation, and roommate details.</p>
              <span className="dashboard-feature-card-link">View Details &rarr;</span>
            </div>

            <div className="dash-card dashboard-feature-card fees-theme" onClick={() => setActiveTab('fees')}>
              <div className="feature-card-header">
                <div className="feature-icon-box"><Icon name="fee" width="22" height="22" style={{ filter: 'brightness(0) invert(1)' }} /></div>
                <span className="feature-badge">Finance</span>
              </div>
              <h4>Fees & Payments</h4>
              <p>Check pending dues, transaction receipts, and online fee portal.</p>
              <span className="dashboard-feature-card-link">View Payments &rarr;</span>
            </div>

            <div className="dash-card dashboard-feature-card complaints-theme" onClick={() => setActiveTab('complaints')}>
              <div className="feature-card-header">
                <div className="feature-icon-box"><Icon name="complaint" width="22" height="22" style={{ filter: 'brightness(0) invert(1)' }} /></div>
                <span className="feature-badge">Support</span>
              </div>
              <h4>Complaints & Repairs</h4>
              <p>Log maintenance issues and track resolution status in real-time.</p>
              <span className="dashboard-feature-card-link">Log Issue &rarr;</span>
            </div>

            <div className="dash-card dashboard-feature-card gatepass-theme" onClick={() => setActiveTab('gatepass')}>
              <div className="feature-card-header">
                <div className="feature-icon-box"><Icon name="attendance" width="22" height="22" style={{ filter: 'brightness(0) invert(1)' }} /></div>
                <span className="feature-badge">Outing</span>
              </div>
              <h4>Gate Pass & Attendance</h4>
              <p>Request outing permissions and view monthly attendance logs.</p>
              <span className="dashboard-feature-card-link">Request Pass &rarr;</span>
            </div>
          </div>

          <div className="dashboard-grid-2col">
            <div className="dash-card">
              <div className="card-header">
                <h3>Today&apos;s Mess Menu</h3>
                <span className="badge-tag info">Live Menu</span>
              </div>
              <div className="mess-menu-grid">
                <p className="empty-state-text">No mess menu added for today.</p>
              </div>
            </div>

            <div className="dash-card">
              <div className="card-header">
                <h3>Quick Actions</h3>
              </div>
              <div className="quick-actions-btns">
                <button type="button" className="btn-pay-fee" onClick={() => setShowPayModal(true)}>
                  Pay Fee Dues
                </button>
                <button type="button" className="btn-report-problem" onClick={() => setShowComplaintModal(true)}>
                  Report Problem
                </button>
                <button type="button" className="btn-ask-gatepass" onClick={() => setShowGatePassModal(true)}>
                  Request Gate Pass
                </button>
              </div>

              <div className="card-header" style={{ marginTop: '28px' }}>
                <h3>Recent Announcements</h3>
              </div>
              <div className="notice-mini-list">
                {notices.length === 0 ? (
                  <p className="empty-state-text">No announcements right now.</p>
                ) : (
                  notices.map((n) => (
                    <div key={n.id} className="notice-item">
                      <span className="notice-tag info">{n.category}</span>
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

      {/* MY ROOM TAB */}
      {activeTab === 'room' && (
        <div className="tab-pane animate-fade-in-slide-up">
          <div className="tab-header-box">
            <div className="tab-title-row">
              <div className="tab-title-with-icon">
                <div className="tab-icon-wrapper">
                  <Icon name="room" width="22" height="22" />
                </div>
                <div>
                  <h2 className="tab-title">My Room Details</h2>
                  <p className="tab-subtitle">Check details about your assigned hostel room and bed allocation.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="dashboard-grid-3col">
            <div className="dash-card">
              <div className="card-title-badge">
                <h3>Assigned Room Info</h3>
                <span className="status-badge paid">Occupied</span>
              </div>
              <div className="room-info-grid">
                <div className="info-row">
                  <span className="info-label">Room Number</span>
                  <strong className="info-val">{profile?.room || 'N/A'}</strong>
                </div>
                <div className="info-row">
                  <span className="info-label">Hostel Block</span>
                  <strong className="info-val">{profile?.block || 'Unassigned'}</strong>
                </div>
                <div className="info-row">
                  <span className="info-label">Bed Position</span>
                  <strong className="info-val">0</strong>
                </div>
                <div className="info-row">
                  <span className="info-label">Floor Level</span>
                  <strong className="info-val">0</strong>
                </div>
              </div>
            </div>

            <div className="dash-card">
              <div className="card-title-badge">
                <h3>Occupancy & Support</h3>
                <span className="status-badge info">0 Students</span>
              </div>
              <div className="room-info-grid">
                <div className="info-row">
                  <span className="info-label">Resident Status</span>
                  <strong className="info-val">Not Assigned</strong>
                </div>
                <div className="info-row">
                  <span className="info-label">Warden In-Charge</span>
                  <strong className="info-val">Not Assigned</strong>
                </div>
                <div className="info-row">
                  <span className="info-label">Warden Contact</span>
                  <strong className="info-val">0</strong>
                </div>
                <div className="info-row">
                  <span className="info-label">Emergency Desk</span>
                  <strong className="info-val">0</strong>
                </div>
              </div>
            </div>

            <div className="dash-card">
              <div className="card-title-badge">
                <h3>Room Amenities</h3>
                <span className="status-badge paid">Verified</span>
              </div>
              <ul className="amenities-list">
                <li><Icon name="checkmark" width={16} height={16} /> High-Speed Hostel Wi-Fi</li>
                <li><Icon name="checkmark" width={16} height={16} /> Individual Study Desk &amp; Chair</li>
                <li><Icon name="checkmark" width={16} height={16} /> Attached Bathroom with Geyser</li>
                <li><Icon name="checkmark" width={16} height={16} /> 24/7 Security &amp; Power Backup</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* FEES & PAYMENTS TAB */}
      {activeTab === 'fees' && (
        <div className="tab-pane animate-fade-in-slide-up">
          <div className="tab-header-box">
            <div className="tab-title-row">
              <div className="tab-title-with-icon">
                <div className="tab-icon-wrapper">
                  <Icon name="fee" width="22" height="22" />
                </div>
                <div>
                  <h2 className="tab-title">Fees &amp; Payments</h2>
                  <p className="tab-subtitle">Check your hostel fee breakdown and download official payment receipts.</p>
                </div>
              </div>
              <button type="button" className="btn-pay-fee" onClick={() => setShowPayModal(true)}>
                Pay Fee Dues
              </button>
            </div>
          </div>

          <div className="dashboard-grid-2col">
            <div className="dash-card">
              <h3>Current Dues Summary</h3>
              <div className="fee-summary-box">
                <div className="fee-amount-display">
                  <small>Total Dues Payable</small>
                  <b>$0.00</b>
                  <span className="fee-due-date">No pending dues</span>
                </div>
                <div className="fee-breakdown-list">
                  <div className="fee-item">
                    <span>Hostel Room Rent</span>
                    <strong>$0.00</strong>
                  </div>
                  <div className="fee-item">
                    <span>Mess Charges</span>
                    <strong>$0.00</strong>
                  </div>
                  <div className="fee-item">
                    <span>Maintenance &amp; Security</span>
                    <strong>$0.00</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="dash-card">
              <h3>Payment History</h3>
              {transactions.length === 0 ? (
                <p className="empty-state-text">No payment records found.</p>
              ) : (
                <div className="table-responsive">
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
                          <td><strong>{t.amount}</strong></td>
                          <td>{t.date}</td>
                          <td><span className="status-badge paid">{t.status}</span></td>
                          <td>
                            <button type="button" className="btn-table-action" onClick={() => alert('Downloading official receipt PDF...')}>
                              Receipt PDF
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* COMPLAINTS TAB */}
      {activeTab === 'complaints' && (
        <div className="tab-pane animate-fade-in-slide-up">
          <div className="tab-header-box">
            <div className="tab-title-row">
              <div className="tab-title-with-icon">
                <div className="tab-icon-wrapper">
                  <Icon name="complaint" width="22" height="22" />
                </div>
                <div>
                  <h2 className="tab-title">Requests &amp; Complaints</h2>
                  <p className="tab-subtitle">Report maintenance issues and track resolution progress by hostel staff.</p>
                </div>
              </div>
              <button type="button" className="btn-report-problem" onClick={() => setShowComplaintModal(true)}>
                Report Problem
              </button>
            </div>
          </div>

          <div className="dash-card">
            <h3>Registered Maintenance Requests</h3>
            {complaints.length === 0 ? (
              <p className="empty-state-text">No maintenance complaints reported yet.</p>
            ) : (
              <div className="table-responsive">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Ticket ID</th>
                      <th>Category</th>
                      <th>Problem Description</th>
                      <th>Reported Date</th>
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
                          <span className={`status-badge ${c.status.toLowerCase().replace(/\s+/g, '-')}`}>
                            {c.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* GATE PASS & ATTENDANCE TAB */}
      {activeTab === 'gatepass' && (
        <div className="tab-pane animate-fade-in-slide-up">
          <div className="tab-header-box">
            <div className="tab-title-row">
              <div className="tab-title-with-icon">
                <div className="tab-icon-wrapper">
                  <Icon name="attendance" width="22" height="22" />
                </div>
                <div>
                  <h2 className="tab-title">Gate Pass &amp; Attendance</h2>
                  <p className="tab-subtitle">Apply for outing gate pass permissions and track your monthly attendance logs.</p>
                </div>
              </div>
              <button type="button" className="btn-ask-gatepass" onClick={() => setShowGatePassModal(true)}>
                Request Gate Pass
              </button>
            </div>
          </div>

          <div className="dashboard-grid-2col">
            <div className="dash-card">
              <h3>Monthly Attendance Record</h3>
              <div className="attendance-summary-box">
                <div className="att-stat-card green">
                  <strong>0 Days</strong>
                  <span>Present</span>
                </div>
                <div className="att-stat-card amber">
                  <strong>0 Days</strong>
                  <span>Approved Outing</span>
                </div>
                <div className="att-stat-card emerald">
                  <strong>0%</strong>
                  <span>Attendance Rate</span>
                </div>
              </div>
            </div>

            <div className="dash-card">
              <h3>Gate Pass Requests History</h3>
              {gatePasses.length === 0 ? (
                <p className="empty-state-text">No gate pass requests submitted yet.</p>
              ) : (
                <div className="gatepass-list">
                  {gatePasses.map((gp) => (
                    <div key={gp.id} className="gatepass-card">
                      <div className="gp-header">
                        <div>
                          <strong>{gp.id} &bull; {gp.reason}</strong>
                        </div>
                        <span className={`status-badge ${gp.status.toLowerCase().replace(/\s+/g, '-')}`}>{gp.status}</span>
                      </div>
                      <div className="gp-times">
                        <span><strong>Departure:</strong> {gp.departure}</span>
                        <span><strong>Return:</strong> {gp.returnDate}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* NOTICES TAB */}
      {activeTab === 'notices' && (
        <div className="tab-pane animate-fade-in-slide-up">
          <div className="tab-header-box">
            <div className="tab-title-row">
              <div className="tab-title-with-icon">
                <div className="tab-icon-wrapper">
                  <Icon name="bell" width="22" height="22" />
                </div>
                <div>
                  <h2 className="tab-title">Hostel Notice Board</h2>
                  <p className="tab-subtitle">Official announcements, emergency alerts, and updates from warden office.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="dash-card">
            {notices.length === 0 ? (
              <p className="empty-state-text">No notices right now.</p>
            ) : (
              <div className="notices-feed-grid">
                {notices.map((n) => (
                  <div key={n.id} className="notice-feed-card">
                    <div className="notice-top-bar">
                      <span className="notice-tag info">{n.category}</span>
                      <span className="notice-date">{n.date}</span>
                    </div>
                    <h3>{n.title}</h3>
                    <p>{n.body}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* WARDEN DESK TAB */}
      {activeTab === 'warden' && (
        <div className="tab-pane animate-fade-in-slide-up">
          <div className="tab-header-box">
            <div className="tab-title-row">
              <div className="tab-title-with-icon">
                <div className="tab-icon-wrapper">
                  <Icon name="user" width="22" height="22" />
                </div>
                <div>
                  <h2 className="tab-title">Hostel Warden Desk</h2>
                  <p className="tab-subtitle">Contact your chief warden, view official desk hours, and request emergency assistance.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="dashboard-grid-3col">
            <div className="dash-card">
              <div className="card-title-badge">
                <h3>Chief Warden Details</h3>
                <span className="status-badge paid">On Duty</span>
              </div>
              <div className="room-info-grid">
                <div className="info-row">
                  <span className="info-label">Full Name</span>
                  <strong className="info-val">Macha Rishi</strong>
                </div>
                <div className="info-row">
                  <span className="info-label">Official Email</span>
                  <strong className="info-val">warden@smarthostel.com</strong>
                </div>
                <div className="info-row">
                  <span className="info-label">Contact Number</span>
                  <strong className="info-val">+91 98765 43210</strong>
                </div>
                <div className="info-row">
                  <span className="info-label">Office Location</span>
                  <strong className="info-val">Shnoor Hills, Block A (Ground Floor)</strong>
                </div>
              </div>
            </div>

            <div className="dash-card">
              <div className="card-title-badge">
                <h3>Desk Hours &amp; Support</h3>
                <span className="status-badge info">Active</span>
              </div>
              <div className="room-info-grid">
                <div className="info-row">
                  <span className="info-label">Morning Hours</span>
                  <strong className="info-val">09:00 AM – 12:30 PM</strong>
                </div>
                <div className="info-row">
                  <span className="info-label">Evening Hours</span>
                  <strong className="info-val">04:30 PM – 07:30 PM</strong>
                </div>
                <div className="info-row">
                  <span className="info-label">Night Curfew</span>
                  <strong className="info-val">10:00 PM Sharp</strong>
                </div>
                <div className="info-row">
                  <span className="info-label">Emergency Helpline</span>
                  <strong className="info-val">+91 12345 67890</strong>
                </div>
              </div>
            </div>

            <div className="dash-card">
              <div className="card-title-badge">
                <h3>Quick Actions</h3>
                <span className="status-badge paid">Instant</span>
              </div>
              <div className="warden-quick-actions-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
                <button type="button" className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }} onClick={() => setActiveTab('complaints')}>
                  <Icon name="complaint" width="16" height="16" /> Log Maintenance Ticket
                </button>
                <button type="button" className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }} onClick={() => setActiveTab('gatepass')}>
                  <Icon name="attendance" width="16" height="16" /> Apply Outing Gate Pass
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SETTINGS TAB */}
      {activeTab === 'settings' && (
        <div className="tab-pane animate-fade-in-slide-up">
          <div className="tab-header-box">
            <div className="tab-title-row">
              <div className="tab-title-with-icon">
                <div className="tab-icon-wrapper">
                  <Icon name="settings" width="22" height="22" />
                </div>
                <div>
                  <h2 className="tab-title">Account &amp; Profile Settings</h2>
                  <p className="tab-subtitle">Manage your personal information, emergency contact details, and hostel profile.</p>
                </div>
              </div>
            </div>
          </div>

          {savedSuccessMsg && (
            <div className="alert-success-box animate-fade-in">
              <Icon name="checkmark" width="18" height="18" />
              <span>{savedSuccessMsg}</span>
            </div>
          )}

          <div className="settings-container-grid">
            <div className="dash-card profile-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div className="profile-avatar-big" style={{ overflow: 'hidden', position: 'relative', width: '72px', height: '72px', borderRadius: '50%', background: 'linear-gradient(135deg, #1e6b51 0%, #10b981 100%)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  {profile?.photo ? (
                    <img src={profile.photo} alt="Profile" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <Icon name="user" width="32" height="32" />
                  )}
                </div>
                <div className="profile-card-details">
                  <h3>{profile?.fullName || 'Student'}</h3>
                  <span className="profile-roll">{profile?.rollNo || 'Resident'} &bull; Computer Science</span>
                  <span className="profile-badge-active">Active Student Resident</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handlePhotoUpload}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '9px 16px',
                    borderRadius: '10px',
                    fontWeight: 600,
                    fontSize: '13.5px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                  {profile?.photo ? 'Change Photo' : 'Add Photo'}
                </button>

                {profile?.photo && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    style={{
                      background: '#fee2e2',
                      color: '#dc2626',
                      border: '1px solid #fecaca',
                      padding: '9px 16px',
                      borderRadius: '10px',
                      fontWeight: 600,
                      fontSize: '13.5px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                    Remove Photo
                  </button>
                )}
              </div>
            </div>

            <div className="dash-card settings-form-card">
              <h3>Personal &amp; Contact Details</h3>
              <form onSubmit={handleSaveProfile} className="settings-form">
                <div className="form-grid-2col">
                  <label className="form-label">
                    Full Name
                    <input
                      type="text"
                      value={profile?.fullName || ''}
                      onChange={(e) => setProfile({ ...(profile || {}), fullName: e.target.value })}
                      required
                    />
                  </label>

                  <label className="form-label">
                    Email Address
                    <input
                      type="email"
                      value={profile?.email || ''}
                      onChange={(e) => setProfile({ ...(profile || {}), email: e.target.value })}
                      required
                    />
                  </label>

                  <label className="form-label">
                    Phone Number
                    <input
                      type="tel"
                      value={profile?.phone || ''}
                      onChange={(e) => setProfile({ ...(profile || {}), phone: e.target.value })}
                      required
                    />
                  </label>

                  <label className="form-label">
                    Emergency Contact
                    <input
                      type="tel"
                      value={profile?.emergencyContact || ''}
                      onChange={(e) => setProfile({ ...(profile || {}), emergencyContact: e.target.value })}
                      required
                    />
                  </label>

                  <label className="form-label">
                    Room Number
                    <input
                      type="text"
                      value={profile?.room || ''}
                      onChange={(e) => setProfile({ ...(profile || {}), room: e.target.value })}
                      required
                    />
                  </label>

                  <label className="form-label">
                    Hostel Block
                    <input
                      type="text"
                      value={profile?.block || ''}
                      onChange={(e) => setProfile({ ...(profile || {}), block: e.target.value })}
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

      {/* MODALS */}
      {showPayModal && (
        <div className="modal-backdrop modal-pay-fee animate-fade-in">
          <div className="modal-box animate-scale-in">
            <h3>Pay Fee Dues</h3>
            <label className="form-label">
              Amount ($)
              <input
                type="number"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                required
              />
            </label>
            <div className="payment-options">
              <label><input type="radio" name="pay" defaultChecked /> Credit / Debit Card</label>
              <label><input type="radio" name="pay" /> UPI / Net Banking</label>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setShowPayModal(false)}>Cancel</button>
              <button type="button" className="btn-pay-fee" onClick={handlePayFee}>Pay Now</button>
            </div>
          </div>
        </div>
      )}

      {showComplaintModal && (
        <div className="modal-backdrop modal-report-problem animate-fade-in">
          <div className="modal-box animate-scale-in">
            <h3>Report a Maintenance Problem</h3>
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
                  placeholder="e.g. Bathroom light flickering"
                  value={newComplaint.title}
                  onChange={(e) => setNewComplaint({ ...newComplaint, title: e.target.value })}
                  required
                />
              </label>

              <label className="form-label">
                Priority Level
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
                <button type="submit" className="btn-report-problem">Submit Ticket</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showGatePassModal && (
        <div className="modal-backdrop modal-ask-gatepass animate-fade-in">
          <div className="modal-box animate-scale-in">
            <h3>Request Gate Outing Pass</h3>
            <form onSubmit={handleAddGatePass}>
              <label className="form-label">
                Reason for Outing
                <input
                  type="text"
                  placeholder="e.g. Medical appointment / Home Visit"
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
                Expected Return Time
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
