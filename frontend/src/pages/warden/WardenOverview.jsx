import { useState, useEffect } from 'react'
import Icon from '../../components/Icon'
import { useAuth } from '../../context/AuthContext'

export default function WardenOverview({ setActiveTab }) {
  const { user } = useAuth()
  const [stats, setStats] = useState({ totalStudents: 0, vacantBeds: 0, pendingGatePasses: 0, openComplaints: 0 })
  const [attendanceSummary, setAttendanceSummary] = useState({ present: 0, absent: 0, late: 0, marked: false })
  const [complaints, setComplaints] = useState([])
  const [notices, setNotices] = useState([])
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
    setLoading(true);
    try {
      // Get statistics
      const statsRes = await fetchWithAuth('http://localhost:5000/api/warden/overview');
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      // Get today attendance status
      const todayStr = new Date().toISOString().split('T')[0];
      const attRes = await fetchWithAuth(`http://localhost:5000/api/warden/attendance?date=${todayStr}`);
      if (attRes.ok) {
        const attData = await attRes.json();
        if (attData && Array.isArray(attData) && attData.length > 0) {
          const present = attData.filter(r => r.status === 'Present').length;
          const absent = attData.filter(r => r.status === 'Absent').length;
          const late = attData.filter(r => r.status === 'Late').length;
          setAttendanceSummary({ present, absent, late, marked: true });
        } else {
          setAttendanceSummary({ present: 0, absent: 0, late: 0, marked: false });
        }
      }

      // Get complaints list
      const compRes = await fetchWithAuth('http://localhost:5000/api/warden/complaints');
      if (compRes.ok) {
        const compData = await compRes.json();
        if (compData && Array.isArray(compData)) {
          setComplaints(compData);
        }
      }

      // Get notices
      const noticesRes = await fetchWithAuth('http://localhost:5000/api/warden/notices');
      if (noticesRes.ok) {
        const noticesData = await noticesRes.json();
        if (noticesData && Array.isArray(noticesData)) {
          setNotices(noticesData);
        }
      }
    } catch (err) {
      console.error('Failed to load overview details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverviewData();
  }, []);

  const activeComplaints = Array.isArray(complaints) ? complaints.filter(c => c.status !== 'Resolved').slice(0, 5) : [];
  const recentNotices = Array.isArray(notices) ? notices.slice(0, 3) : [];

  // Calculate conic gradient for the complaints donut chart
  const pendingComplaintsCount = Array.isArray(complaints) ? complaints.filter(c => c.status === 'Pending').length : 0;
  const inProgressComplaintsCount = Array.isArray(complaints) ? complaints.filter(c => c.status === 'In Progress').length : 0;
  const resolvedComplaintsCount = Array.isArray(complaints) ? complaints.filter(c => c.status === 'Resolved').length : 0;
  const totalComp = pendingComplaintsCount + inProgressComplaintsCount + resolvedComplaintsCount;

  const pendingPct = totalComp > 0 ? (pendingComplaintsCount / totalComp) * 100 : 0;
  const inProgressPct = totalComp > 0 ? (inProgressComplaintsCount / totalComp) * 100 : 0;

  const pendingEnd = pendingPct;
  const inProgressEnd = pendingPct + inProgressPct;

  const conicGradient = totalComp > 0
    ? `conic-gradient(#f59e0b 0% ${pendingEnd}%, #3b82f6 ${pendingEnd}% ${inProgressEnd}%, #10b981 ${inProgressEnd}% 100%)`
    : '#e2e8f0';

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
            <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 800 }}>Welcome back, {user?.name || 'Warden'}!</h2>
            <p style={{ margin: '6px 0 0 0', opacity: 0.85, fontSize: '14px' }}>Manage daily student attendance, gate passes, and complaints efficiently.</p>
          </div>
          <div style={{ background: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(8px)', padding: '8px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: 700 }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '40px 0', textAlign: 'center', fontWeight: 600, color: '#557162' }}>
          Loading dashboard metrics...
        </div>
      ) : (
        <>
          {/* 4 Top Vibrant Cards */}
          <div className="owner-stat-grid">
            <div className="owner-stat-card purple">
              <div className="card-top">
                <span className="card-label">PRESENT TODAY</span>
                <div className="card-icon-box">
                  <Icon name="user" width="22" height="22" style={{ filter: 'brightness(0) invert(1)' }} />
                </div>
              </div>
              <div>
                <div className="card-value">{attendanceSummary.present}</div>
                <div className="card-sub">Out of {stats.totalStudents} total</div>
              </div>
            </div>

            <div className="owner-stat-card orange">
              <div className="card-top">
                <span className="card-label">ABSENT TODAY</span>
                <div className="card-icon-box">
                  <Icon name="user" width="22" height="22" style={{ filter: 'brightness(0) invert(1)' }} />
                </div>
              </div>
              <div>
                <div className="card-value">{attendanceSummary.absent}</div>
                <div className="card-sub">Not checked in</div>
              </div>
            </div>

            <div className="owner-stat-card red">
              <div className="card-top">
                <span className="card-label">LATE TODAY</span>
                <div className="card-icon-box">
                  <Icon name="attendance" width="22" height="22" style={{ filter: 'brightness(0) invert(1)' }} />
                </div>
              </div>
              <div>
                <div className="card-value">{attendanceSummary.late}</div>
                <div className="card-sub">Came in late</div>
              </div>
            </div>

            <div className="owner-stat-card teal">
              <div className="card-top">
                <span className="card-label">ATTENDANCE</span>
                <div className="card-icon-box">
                  <Icon name="attendance" width="22" height="22" style={{ filter: 'brightness(0) invert(1)' }} />
                </div>
              </div>
              <div>
                <div className="card-value" style={{ fontSize: '20px', margin: '8px 0 6px' }}>
                  {attendanceSummary.marked ? 'Marked' : 'Not Marked'}
                </div>
                <button
                  type="button"
                  className="rector-mark-btn"
                  onClick={() => setActiveTab('attendance')}
                >
                  Mark Now &rarr;
                </button>
              </div>
            </div>
          </div>

          {/* Middle Row 3 Stat Cards */}
          <div className="owner-stat-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginTop: '24px' }}>
            <div className="owner-card-box">
              <small style={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '12px' }}>
                Pending Complaints
              </small>
              <div style={{ font: '800 32px "Manrope", sans-serif', color: '#f59e0b', marginTop: '6px' }}>
                {complaints.filter(c => c.status === 'Pending').length}
              </div>
            </div>

            <div className="owner-card-box">
              <small style={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '12px' }}>
                In Progress Issues
              </small>
              <div style={{ font: '800 32px "Manrope", sans-serif', color: '#6366f1', marginTop: '6px' }}>
                {complaints.filter(c => c.status === 'In Progress').length}
              </div>
            </div>

            <div className="owner-card-box">
              <small style={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '12px' }}>
                Total Active Complaints
              </small>
              <div style={{ font: '800 32px "Manrope", sans-serif', color: '#10b981', marginTop: '6px' }}>
                {complaints.filter(c => c.status !== 'Resolved').length}
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
                  <span className="legend-item"><span className="legend-dot amber"></span> Pending ({pendingComplaintsCount})</span>
                  <span className="legend-item"><span className="legend-dot blue"></span> In Progress ({inProgressComplaintsCount})</span>
                  <span className="legend-item"><span className="legend-dot green"></span> Resolved ({resolvedComplaintsCount})</span>
                </div>
              </div>
            </div>
          </div>

          {/* Active Complaints */}
          <div className="owner-card-box" style={{ marginTop: '24px' }}>
            <div className="owner-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>Active Complaints</h3>
              <button
                type="button"
                className="owner-refresh-btn"
                onClick={loadOverviewData}
              >
                Refresh
              </button>
            </div>
            {activeComplaints.length === 0 ? (
              <div className="owner-table-wrapper">
                <p className="empty-state-text" style={{ padding: '24px 0', textAlign: 'center', margin: 0 }}>
                  No active complaints reported today.
                </p>
              </div>
            ) : (
              <div className="owner-table-wrapper">
                <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left', color: '#64748b', fontWeight: 700 }}>
                      <th style={{ padding: '12px' }}>Ticket ID</th>
                      <th style={{ padding: '12px' }}>Student</th>
                      <th style={{ padding: '12px' }}>Room</th>
                      <th style={{ padding: '12px' }}>Problem Description</th>
                      <th style={{ padding: '12px' }}>Category</th>
                      <th style={{ padding: '12px' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeComplaints.map(c => (
                      <tr key={c.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '12px', fontWeight: 700 }}>{c.id}</td>
                        <td style={{ padding: '12px' }}>{c.studentName}</td>
                        <td style={{ padding: '12px' }}>{c.room || 'N/A'}</td>
                        <td style={{ padding: '12px' }}>{c.title}</td>
                        <td style={{ padding: '12px' }}>{c.category}</td>
                        <td style={{ padding: '12px' }}>
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

          {/* Recent Notices Feed */}
          <div className="owner-card-box" style={{ marginTop: '24px' }}>
            <div className="owner-card-header">
              <h3>Recent Notices</h3>
            </div>
            {recentNotices.length === 0 ? (
              <p className="empty-state-text" style={{ padding: '16px 0', margin: 0 }}>
                No recent notices posted.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
                {recentNotices.map(n => (
                  <div key={n.id} style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 8px', borderRadius: '6px', background: n.isUrgent ? '#fee2e2' : '#e0f2fe', color: n.isUrgent ? '#991b1b' : '#0369a1' }}>
                        {n.targetBlock} {n.isUrgent ? '(Urgent)' : ''}
                      </span>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>{n.date}</span>
                    </div>
                    <h4 style={{ margin: '0 0 6px 0', fontSize: '14.5px', fontWeight: 700, color: '#1e293b' }}>{n.title}</h4>
                    <p style={{ margin: 0, fontSize: '13px', color: '#475569', lineHeight: 1.5 }}>{n.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
