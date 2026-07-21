import { useState } from 'react'

export default function AdminFees() {
  const [activeSubTab, setActiveSubTab] = useState('all')
  const [feeData] = useState([])

  const filtered = activeSubTab === 'pending' ? feeData.filter(f => f.status === 'Pending') : feeData

  return (
    <div className="tab-pane animate-fade-in-slide-up">
      {/* Sub tabs */}
      <div className="owner-subtab-container">
        <button
          type="button"
          className={`owner-subtab-btn ${activeSubTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('all')}
        >
          All Fees
        </button>
        <button
          type="button"
          className={`owner-subtab-btn ${activeSubTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('pending')}
        >
          Pending Fees <span className="owner-pill pending" style={{ marginLeft: '6px' }}>0</span>
        </button>
        <button
          type="button"
          className={`owner-subtab-btn ${activeSubTab === 'structure' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('structure')}
        >
          Fee Structure
        </button>
      </div>

      {/* 3 Top Summary Cards */}
      <div className="owner-stat-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '24px' }}>
        <div className="owner-card-box">
          <small style={{ color: '#64748b', fontWeight: 600 }}>Total Fees</small>
          <div style={{ font: '800 28px Manrope, sans-serif', color: '#0f172a', marginTop: '6px' }}>₹0</div>
        </div>
        <div className="owner-card-box">
          <small style={{ color: '#64748b', fontWeight: 600 }}>Collected</small>
          <div style={{ font: '800 28px Manrope, sans-serif', color: '#10b981', marginTop: '6px' }}>₹0</div>
        </div>
        <div className="owner-card-box">
          <small style={{ color: '#64748b', fontWeight: 600 }}>Outstanding</small>
          <div style={{ font: '800 28px Manrope, sans-serif', color: '#f43f5e', marginTop: '6px' }}>₹0</div>
        </div>
      </div>

      {/* Fees Table */}
      <div className="owner-table-wrapper">
        {filtered.length === 0 ? (
          <p className="empty-state-text" style={{ padding: '30px 0', textAlign: 'center' }}>No fee records found.</p>
        ) : (
          <table className="owner-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Room</th>
                <th>Total Fee</th>
                <th>Paid</th>
                <th>Due</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((f) => (
                <tr key={f.id}>
                  <td><strong>{f.name}</strong></td>
                  <td><strong>{f.room}</strong></td>
                  <td>{f.totalFee}</td>
                  <td style={{ color: '#10b981', fontWeight: 700 }}>{f.paid}</td>
                  <td style={{ color: f.due.includes('-') ? '#10b981' : '#f43f5e', fontWeight: 700 }}>{f.due}</td>
                  <td>
                    <span className={`owner-pill ${f.status.toLowerCase()}`}>
                      {f.status}
                    </span>
                  </td>
                  <td>
                    <button type="button" className="owner-action-btn" title="Edit Fee">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
