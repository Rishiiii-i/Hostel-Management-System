import { useState, useEffect } from 'react'
import Icon from '../../components/Icon'
import { useAuth } from '../../context/AuthContext'

export default function AdminOverview({ setActiveTab }) {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalStudents: 0,
    pendingFees: 0,
    activeComplaints: 0,
    occupiedRooms: 0,
    totalRooms: 0,
    paidCount: 0,
    pendingCount: 0,
    partialCount: 0,
    collectedTotal: 0,
    outstandingTotal: 0,
    totalFees: 0,
    pendingFeesList: [],
    activeComplaintsList: [],
    pendingComplaintsCount: 0,
    inProgressComplaintsCount: 0,
    resolvedComplaintsCount: 0
  })
  const [loading, setLoading] = useState(true)

  // Helper for requests with auth token
  const fetchWithAuth = async (url, options = {}) => {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers
    };
    return fetch(url, { ...options, headers });
  };

  const loadOverviewData = async () => {
    setLoading(true)
    try {
      const res = await fetchWithAuth('http://localhost:5000/api/admin/overview')
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch (err) {
      console.error('Failed to load admin overview details:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOverviewData()
  }, [])

  // Calculate conic gradient for the complaints donut chart
  const totalComp = (stats.pendingComplaintsCount || 0) + (stats.inProgressComplaintsCount || 0) + (stats.resolvedComplaintsCount || 0)
  const pendingPct = totalComp > 0 ? (stats.pendingComplaintsCount / totalComp) * 100 : 0
  const inProgressPct = totalComp > 0 ? (stats.inProgressComplaintsCount / totalComp) * 100 : 0

  const pendingEnd = pendingPct
  const inProgressEnd = pendingPct + inProgressPct

  const conicGradient = totalComp > 0
    ? `conic-gradient(#f59e0b 0% ${pendingEnd}%, #3b82f6 ${pendingEnd}% ${inProgressEnd}%, #10b981 ${inProgressEnd}% 100%)`
    : '#e2e8f0'

  if (loading) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', minHeight: '300px' }}>
        <div className="owner-refresh-btn" style={{ padding: '16px 24px', borderRadius: '12px' }}>
          Loading admin overview data...
        </div>
      </div>
    )
  }

  return (
    <div className="tab-pane animate-fade-in-slide-up">
      {/* Welcome Banner */}
      <div className="owner-card-box" style={{
        background: 'linear-gradient(135deg, #1e6b51 0%, #0d3b2c 100%)',
        color: '#ffffff',
        padding: '24px 28px',
        marginBottom: '24px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 8px 24px rgba(30, 107, 81, 0.22)'
      }}>
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 800 }}>Welcome back, {user?.name || 'Admin'}</h2>
            <p style={{ margin: '6px 0 0 0', opacity: 0.85, fontSize: '14px' }}>Here is what's happening across your hostel facility today.</p>
          </div>
          <div style={{ background: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(8px)', padding: '8px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: 700 }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
        </div>
      </div>

      {/* 4 Top Vibrant Cards */}
      <div className="owner-stat-grid">
        <div className="owner-stat-card purple" onClick={() => setActiveTab('students')} style={{ cursor: 'pointer' }}>
          <div className="card-top">
            <span className="card-label">TOTAL STUDENTS</span>
            <div className="card-icon-box">
              <Icon name="user" width="22" height="22" style={{ filter: 'brightness(0) invert(1)' }} />
            </div>
          </div>
          <div>
            <div className="card-value">{stats.totalStudents}</div>
            <div className="card-sub">Enrolled in hostel</div>
          </div>
        </div>

        <div className="owner-stat-card orange" onClick={() => setActiveTab('fees')} style={{ cursor: 'pointer' }}>
          <div className="card-top">
            <span className="card-label">PENDING FEES</span>
            <div className="card-icon-box">
              <Icon name="fee" width="22" height="22" style={{ filter: 'brightness(0) invert(1)' }} />
            </div>
          </div>
          <div>
            <div className="card-value">₹{stats.outstandingTotal}</div>
            <div className="card-sub">From {stats.pendingCount + stats.partialCount} students</div>
          </div>
        </div>

        <div className="owner-stat-card red" onClick={() => setActiveTab('complaints')} style={{ cursor: 'pointer' }}>
          <div className="card-top">
            <span className="card-label">ACTIVE COMPLAINTS</span>
            <div className="card-icon-box">
              <Icon name="complaint" width="22" height="22" style={{ filter: 'brightness(0) invert(1)' }} />
            </div>
          </div>
          <div>
            <div className="card-value">{stats.activeComplaints}</div>
            <div className="card-sub">Pending resolution</div>
          </div>
        </div>

        <div className="owner-stat-card teal" onClick={() => setActiveTab('rooms')} style={{ cursor: 'pointer' }}>
          <div className="card-top">
            <span className="card-label">OCCUPIED ROOMS</span>
            <div className="card-icon-box">
              <Icon name="room" width="22" height="22" style={{ filter: 'brightness(0) invert(1)' }} />
            </div>
          </div>
          <div>
            <div className="card-value">{stats.occupiedRooms}</div>
            <div className="card-sub">of {stats.totalRooms} total rooms</div>
          </div>
        </div>
      </div>

      {/* Middle Row Charts */}
      <div className="owner-charts-grid" style={{ marginTop: '24px' }}>
        <div className="owner-card-box">
          <div className="owner-card-header">
            <h3>Fee Status Breakdown</h3>
            <p>Paid: {stats.paidCount} &bull; Pending: {stats.pendingCount} &bull; Partial: {stats.partialCount}</p>
          </div>
          <div className="bar-chart-container">
            <div className="bar-column">
              <div className="bar-fill green" style={{ height: stats.totalStudents > 0 ? `${(stats.paidCount / stats.totalStudents) * 100}%` : '0%' }}></div>
              <span className="bar-label">Paid ({stats.paidCount})</span>
            </div>
            <div className="bar-column">
              <div className="bar-fill amber" style={{ height: stats.totalStudents > 0 ? `${(stats.pendingCount / stats.totalStudents) * 100}%` : '0%' }}></div>
              <span className="bar-label">Pending ({stats.pendingCount})</span>
            </div>
            <div className="bar-column">
              <div className="bar-fill blue" style={{ height: stats.totalStudents > 0 ? `${(stats.partialCount / stats.totalStudents) * 100}%` : '0%' }}></div>
              <span className="bar-label">Partial ({stats.partialCount})</span>
            </div>
          </div>
        </div>

        <div className="owner-card-box">
          <div className="owner-card-header">
            <h3>Complaint Status</h3>
          </div>
          <div className="donut-chart-wrapper">
            <div className="donut-circle" style={{ background: conicGradient }}>
              <div className="donut-inner"></div>
            </div>
            <div className="chart-legend">
              <span className="legend-item"><span className="legend-dot amber"></span> Pending ({stats.pendingComplaintsCount})</span>
              <span className="legend-item"><span className="legend-dot blue"></span> In Progress ({stats.inProgressComplaintsCount})</span>
              <span className="legend-item"><span className="legend-dot green"></span> Resolved ({stats.resolvedComplaintsCount})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row Tables */}
      <div className="owner-charts-grid" style={{ marginTop: '24px' }}>
        <div className="owner-card-box">
          <div className="owner-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#f59e0b' }}>₹</span> Students with Pending Fees <span className="owner-pill pending">{stats.pendingFeesList.length}</span>
            </h3>
            <button type="button" onClick={() => setActiveTab('fees')} style={{ background: 'none', border: 'none', color: '#10b981', fontWeight: 700, cursor: 'pointer', fontSize: '13px' }}>
              View all &rarr;
            </button>
          </div>
          
          {stats.pendingFeesList.length === 0 ? (
            <p className="empty-state-text" style={{ padding: '20px 0', textAlign: 'center', margin: 0 }}>No pending fee records.</p>
          ) : (
            <div className="owner-table-wrapper" style={{ boxShadow: 'none', margin: '10px 0 0 0', padding: 0 }}>
              <table className="owner-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Room</th>
                    <th>Outstanding</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.pendingFeesList.map((s, idx) => (
                    <tr key={s.id || idx}>
                      <td><strong>{s.name}</strong></td>
                      <td><strong>{s.room}</strong></td>
                      <td style={{ color: '#f43f5e', fontWeight: 700 }}>{s.due}</td>
                      <td>
                        <span className={`owner-pill ${s.status.toLowerCase()}`}>
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="owner-card-box">
          <div className="owner-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icon name="complaint" width="18" height="18" /> Active Complaints <span className="owner-pill partial">{stats.activeComplaints}</span>
            </h3>
            <button type="button" onClick={() => setActiveTab('complaints')} style={{ background: 'none', border: 'none', color: '#10b981', fontWeight: 700, cursor: 'pointer', fontSize: '13px' }}>
              View all &rarr;
            </button>
          </div>

          {stats.activeComplaintsList.length === 0 ? (
            <p className="empty-state-text" style={{ padding: '20px 0', textAlign: 'center', margin: 0 }}>No active complaints pending resolution.</p>
          ) : (
            <div className="owner-table-wrapper" style={{ boxShadow: 'none', margin: '10px 0 0 0', padding: 0 }}>
              <table className="owner-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Room</th>
                    <th>Issue</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.activeComplaintsList.map((c, idx) => (
                    <tr key={c.id || idx}>
                      <td><strong>{c.student}</strong></td>
                      <td><strong>{c.room}</strong></td>
                      <td>{c.title}</td>
                      <td>
                        <span className={`owner-pill ${c.status === 'Pending' ? 'pending' : 'partial'}`}>
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
    </div>
  )
}
