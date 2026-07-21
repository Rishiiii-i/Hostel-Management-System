import Icon from '../../components/Icon'

export default function WardenOverview({ setActiveTab }) {
  return (
    <div className="tab-pane animate-fade-in-slide-up">
      {/* Welcome Banner - Exact Match to Admin Banner */}
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
            <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 800 }}>Welcome back, Macha Rishi! 👋</h2>
            <p style={{ margin: '6px 0 0 0', opacity: 0.85, fontSize: '14px' }}>Manage daily student attendance, gate passes, and complaints efficiently.</p>
          </div>
          <div style={{ background: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(8px)', padding: '8px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: 700 }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
        </div>
      </div>

      {/* 4 Top Vibrant Cards - Exact Match to Admin Card Gradients */}
      <div className="owner-stat-grid">
        <div className="owner-stat-card purple">
          <div className="card-top">
            <span className="card-label">PRESENT TODAY</span>
            <div className="card-icon-box">
              <Icon name="user" width="22" height="22" style={{ filter: 'brightness(0) invert(1)' }} />
            </div>
          </div>
          <div>
            <div className="card-value">0</div>
            <div className="card-sub">Out of 0 total</div>
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
            <div className="card-value">0</div>
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
            <div className="card-value">0</div>
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
            <div className="card-value" style={{ fontSize: '20px', margin: '8px 0 6px' }}>Not Marked</div>
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
          <div style={{ font: '800 32px "Manrope", sans-serif', color: '#f59e0b', marginTop: '6px' }}>0</div>
        </div>

        <div className="owner-card-box">
          <small style={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '12px' }}>
            In Progress Issues
          </small>
          <div style={{ font: '800 32px "Manrope", sans-serif', color: '#6366f1', marginTop: '6px' }}>0</div>
        </div>

        <div className="owner-card-box">
          <small style={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '12px' }}>
            Total Active Complaints
          </small>
          <div style={{ font: '800 32px "Manrope", sans-serif', color: '#10b981', marginTop: '6px' }}>0</div>
        </div>
      </div>

      {/* Active Complaints */}
      <div className="owner-card-box" style={{ marginTop: '24px' }}>
        <div className="owner-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>Active Complaints</h3>
          <button
            type="button"
            className="owner-refresh-btn"
            onClick={() => setActiveTab('complaints')}
          >
            Refresh
          </button>
        </div>
        <div className="owner-table-wrapper">
          <p className="empty-state-text" style={{ padding: '24px 0', textAlign: 'center', margin: 0 }}>
            No active complaints reported today.
          </p>
        </div>
      </div>

      {/* Recent Notices Feed */}
      <div className="owner-card-box" style={{ marginTop: '24px' }}>
        <div className="owner-card-header">
          <h3>Recent Notices</h3>
        </div>
        <p className="empty-state-text" style={{ padding: '16px 0', margin: 0 }}>
          No recent notices posted.
        </p>
      </div>
    </div>
  )
}
