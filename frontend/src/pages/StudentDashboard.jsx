import { useState } from 'react'
import roomIcon from '../assets/icons/room.png'
import feeIcon from '../assets/icons/fee.png'
import complaintIcon from '../assets/icons/complaint.png'
import attendanceIcon from '../assets/icons/attendance.png'

export default function StudentDashboard({ activeTab = 'overview', setActiveTab }) {
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
      {/* Home / Overview Tab */}
      {activeTab === 'overview' && (
        <div className="tab-pane animate-fade-in-slide-up">
          <div className="welcome-banner">
            <div className="banner-content">
              <span className="badge-pill">Student Portal</span>
              <h1>Welcome to Smart Hostel</h1>
              <p>Manage your room, fees, and requests easily in one place.</p>
            </div>
            <div className="banner-quick-stats">
              <div className="stat-box">
                <span className="stat-label">My Room</span>
                <strong className="stat-value">Not Assigned</strong>
                <small className="stat-sub">Waiting for room</small>
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

          <div className="kpi-grid">
            <div className="kpi-card" onClick={() => setActiveTab('room')}>
              <div className="kpi-icon icon-room">
                <img src={roomIcon} alt="Room" width="24" height="24" />
              </div>
              <div className="kpi-info">
                <span>Room</span>
                <strong>Unassigned</strong>
                <small>No room details</small>
              </div>
            </div>

            <div className="kpi-card" onClick={() => setActiveTab('fees')}>
              <div className="kpi-icon icon-fee">
                <img src={feeIcon} alt="Fees" width="24" height="24" />
              </div>
              <div className="kpi-info">
                <span>Fees</span>
                <strong>{feePaid ? 'Paid' : '$0.00 Due'}</strong>
                <small>{transactions.length} Payments</small>
              </div>
            </div>

            <div className="kpi-card" onClick={() => setActiveTab('complaints')}>
              <div className="kpi-icon icon-complaint">
                <img src={complaintIcon} alt="Complaints" width="24" height="24" />
              </div>
              <div className="kpi-info">
                <span>Complaints</span>
                <strong>{complaints.length} Total</strong>
                <small>{complaints.filter(c => c.status !== 'Resolved').length} Active</small>
              </div>
            </div>

            <div className="kpi-card" onClick={() => setActiveTab('gatepass')}>
              <div className="kpi-icon icon-pass">
                <img src={attendanceIcon} alt="Attendance" width="24" height="24" />
              </div>
              <div className="kpi-info">
                <span>Attendance</span>
                <strong>0%</strong>
                <small>No attendance data</small>
              </div>
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

      {/* My Room Tab */}
      {activeTab === 'room' && (
        <div className="tab-pane animate-fade-in-slide-up">
          <div className="section-title-box">
            <h2>My Room Details</h2>
            <p>Check details about your room and bed.</p>
          </div>

          <div className="dash-card">
            <p className="empty-state-text">No room assigned yet.</p>
          </div>
        </div>
      )}

      {/* Fees & Payments Tab */}
      {activeTab === 'fees' && (
        <div className="tab-pane animate-fade-in-slide-up">
          <div className="section-title-box flex-between">
            <div>
              <h2>Fees & Payments</h2>
              <p>Check your fees and download payment receipts.</p>
            </div>
            <button type="button" className="btn-pay-fee" onClick={() => setShowPayModal(true)}>
              Pay Fee
            </button>
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

      {/* Complaints Tab */}
      {activeTab === 'complaints' && (
        <div className="tab-pane animate-fade-in-slide-up">
          <div className="section-title-box flex-between">
            <div>
              <h2>Complaints & Repairs</h2>
              <p>Report a problem and check repair status.</p>
            </div>
            <button type="button" className="btn-report-problem" onClick={() => setShowComplaintModal(true)}>
              Report a Problem
            </button>
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

      {/* Gate Pass & Attendance Tab */}
      {activeTab === 'gatepass' && (
        <div className="tab-pane animate-fade-in-slide-up">
          <div className="section-title-box flex-between">
            <div>
              <h2>Gate Pass & Attendance</h2>
              <p>Ask for leave or check your attendance.</p>
            </div>
            <button type="button" className="btn-ask-gatepass" onClick={() => setShowGatePassModal(true)}>
              Ask for Gate Pass
            </button>
          </div>

          <div className="dashboard-grid-2col">
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

      {/* Notices Tab */}
      {activeTab === 'notices' && (
        <div className="tab-pane animate-fade-in-slide-up">
          <div className="section-title-box">
            <h2>Hostel Notices</h2>
            <p>Important news and updates from hostel.</p>
          </div>

          <div className="dash-card">
            <p className="empty-state-text">No notices right now.</p>
          </div>
        </div>
      )}

      {/* Fee Payment Modal */}
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

      {/* Report a Problem Modal */}
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

      {/* Gate Pass Modal */}
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
