import Icon from '../../components/Icon'
import { useAuth } from '../../context/AuthContext'

export default function AdminOverview({ setActiveTab }) {
  const { user } = useAuth()
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
        <div className="owner-stat-card purple">
          <div className="card-top">
            <span className="card-label">TOTAL STUDENTS</span>
            <div className="card-icon-box">
              <Icon name="user" width="22" height="22" style={{ filter: 'brightness(0) invert(1)' }} />
            </div>
          </div>
          <div>
            <div className="card-value">0</div>
            <div className="card-sub">Enrolled in hostel</div>
          </div>
        </div>

        <div className="owner-stat-card orange">
          <div className="card-top">
            <span className="card-label">PENDING FEES</span>
            <div className="card-icon-box">
              <Icon name="fee" width="22" height="22" style={{ filter: 'brightness(0) invert(1)' }} />
            </div>
          </div>
          <div>
            <div className="card-value">₹0</div>
            <div className="card-sub">From 0 students</div>
          </div>
        </div>

        <div className="owner-stat-card red">
          <div className="card-top">
            <span className="card-label">ACTIVE COMPLAINTS</span>
            <div className="card-icon-box">
              <Icon name="complaint" width="22" height="22" style={{ filter: 'brightness(0) invert(1)' }} />
            </div>
          </div>
          <div>
            <div className="card-value">0</div>
            <div className="card-sub">Pending resolution</div>
          </div>
        </div>

        <div className="owner-stat-card teal">
          <div className="card-top">
            <span className="card-label">OCCUPIED ROOMS</span>
            <div className="card-icon-box">
              <Icon name="room" width="22" height="22" style={{ filter: 'brightness(0) invert(1)' }} />
            </div>
          </div>
          <div>
            <div className="card-value">0</div>
            <div className="card-sub">of 0 total rooms</div>
          </div>
        </div>
      </div>

      {/* Middle Row Charts */}
      <div className="owner-charts-grid" style={{ marginTop: '24px' }}>
        <div className="owner-card-box">
          <div className="owner-card-header">
            <h3>Fee Status Breakdown</h3>
            <p>Paid: 0 &bull; Pending: 0 &bull; Partial: 0</p>
          </div>
          <div className="bar-chart-container">
            <div className="bar-column">
              <div className="bar-fill green" style={{ height: '0%' }}></div>
              <span className="bar-label">Paid (0)</span>
            </div>
            <div className="bar-column">
              <div className="bar-fill amber" style={{ height: '0%' }}></div>
              <span className="bar-label">Pending (0)</span>
            </div>
            <div className="bar-column">
              <div className="bar-fill blue" style={{ height: '0%' }}></div>
              <span className="bar-label">Partial (0)</span>
            </div>
          </div>
        </div>

        <div className="owner-card-box">
          <div className="owner-card-header">
            <h3>Complaint Status</h3>
          </div>
          <div className="donut-chart-wrapper">
            <div className="donut-circle" style={{ background: '#e2e8f0' }}>
              <div className="donut-inner"></div>
            </div>
            <div className="chart-legend">
              <span className="legend-item"><span className="legend-dot amber"></span> Pending (0)</span>
              <span className="legend-item"><span className="legend-dot blue"></span> In Progress (0)</span>
              <span className="legend-item"><span className="legend-dot green"></span> Resolved (0)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row Tables */}
      <div className="owner-charts-grid" style={{ marginTop: '24px' }}>
        <div className="owner-card-box">
          <div className="owner-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#f59e0b' }}>₹</span> Students with Pending Fees <span className="owner-pill pending">0</span>
            </h3>
            <button type="button" onClick={() => setActiveTab('fees')} style={{ background: 'none', border: 'none', color: '#10b981', fontWeight: 700, cursor: 'pointer', fontSize: '13px' }}>
              View all &rarr;
            </button>
          </div>
          <p className="empty-state-text" style={{ padding: '20px 0', textAlign: 'center' }}>No pending fee records.</p>
        </div>

        <div className="owner-card-box">
          <div className="owner-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icon name="complaint" width="18" height="18" /> Active Complaints <span className="owner-pill partial">0</span>
            </h3>
            <button type="button" onClick={() => setActiveTab('complaints')} style={{ background: 'none', border: 'none', color: '#10b981', fontWeight: 700, cursor: 'pointer', fontSize: '13px' }}>
              View all &rarr;
            </button>
          </div>
          <p className="empty-state-text" style={{ padding: '20px 0', textAlign: 'center' }}>No active complaints pending resolution.</p>
        </div>
      </div>
    </div>
  )
}
