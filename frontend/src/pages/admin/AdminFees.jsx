import { useState, useEffect } from 'react'

export default function AdminFees() {
  const [activeSubTab, setActiveSubTab] = useState('all')
  const [feeData, setFeeData] = useState([])
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState({ totalFees: 0, collectedFees: 0, outstandingFees: 0 })
  
  // Modals
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState(null)
  
  // Form fields
  const [totalFee, setTotalFee] = useState(45000)
  const [paidFee, setPaidFee] = useState(0)

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

  const loadFeesData = async () => {
    setLoading(true)
    try {
      const res = await fetchWithAuth('http://localhost:5000/api/admin/fees')
      if (res.ok) {
        const data = await res.json()
        setFeeData(data.feeData)
        setSummary({
          totalFees: data.totalFees,
          collectedFees: data.collectedFees,
          outstandingFees: data.outstandingFees
        })
      }
    } catch (err) {
      console.error('Failed to load fees data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFeesData()
  }, [])

  const handleEditClick = (record) => {
    setSelectedStudent(record)
    // Extract numbers from strings like "₹45000"
    const totalVal = Number(record.totalFee.replace(/[₹$,]/g, '')) || 0
    const paidVal = Number(record.paid.replace(/[₹$,]/g, '')) || 0
    setTotalFee(totalVal)
    setPaidFee(paidVal)
    setShowEditModal(true)
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    try {
      const res = await fetchWithAuth(`http://localhost:5000/api/admin/students/${selectedStudent.id}/fees`, {
        method: 'PUT',
        body: JSON.stringify({ totalFee, paidFee })
      })
      if (res.ok) {
        alert('Student fee records updated successfully')
        setShowEditModal(false)
        setSelectedStudent(null)
        loadFeesData()
      } else {
        alert('Failed to update student fee record.')
      }
    } catch (err) {
      console.error('Error updating fee details:', err)
    }
  }

  const pendingCount = feeData.filter(f => f.status === 'Unpaid' || f.status === 'Pending' || f.status === 'Partial').length

  const filtered = activeSubTab === 'pending'
    ? feeData.filter(f => f.status === 'Unpaid' || f.status === 'Pending' || f.status === 'Partial')
    : feeData

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
          Pending/Partial Fees <span className="owner-pill pending" style={{ marginLeft: '6px' }}>{pendingCount}</span>
        </button>
      </div>

      {/* 3 Top Summary Cards */}
      <div className="owner-stat-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '24px' }}>
        <div className="owner-card-box">
          <small style={{ color: '#64748b', fontWeight: 600 }}>Total Fees</small>
          <div style={{ font: '800 28px Manrope, sans-serif', color: '#0f172a', marginTop: '6px' }}>₹{summary.totalFees}</div>
        </div>
        <div className="owner-card-box">
          <small style={{ color: '#64748b', fontWeight: 600 }}>Collected</small>
          <div style={{ font: '800 28px Manrope, sans-serif', color: '#10b981', marginTop: '6px' }}>₹{summary.collectedFees}</div>
        </div>
        <div className="owner-card-box">
          <small style={{ color: '#64748b', fontWeight: 600 }}>Outstanding</small>
          <div style={{ font: '800 28px Manrope, sans-serif', color: '#f43f5e', marginTop: '6px' }}>₹{summary.outstandingFees}</div>
        </div>
      </div>

      {/* Fees Table */}
      <div className="owner-table-wrapper">
        {loading ? (
          <p className="empty-state-text" style={{ padding: '30px 0', textAlign: 'center', fontWeight: 600 }}>Loading fee details...</p>
        ) : filtered.length === 0 ? (
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
                  <td style={{ color: f.due === '₹0' ? '#10b981' : '#f43f5e', fontWeight: 700 }}>{f.due}</td>
                  <td>
                    <span className={`owner-pill ${f.status.toLowerCase()}`}>
                      {f.status}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="owner-action-btn"
                      title="Edit Fee"
                      onClick={() => handleEditClick(f)}
                      style={{ border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                    >
                      Update Fee
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Update Fee Modal */}
      {showEditModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.5)',
          backdropFilter: 'blur(4px)',
          display: 'grid',
          placeItems: 'center',
          zIndex: 10000,
          padding: '20px'
        }}>
          <div className="owner-card-box" style={{ maxWidth: '400px', width: '100%', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, font: '800 18px "Manrope", sans-serif' }}>Update Fees - {selectedStudent?.name}</h3>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#64748b' }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Total Fee Assigned (₹)</label>
                <input
                  type="number"
                  required
                  value={totalFee}
                  onChange={(e) => setTotalFee(Number(e.target.value) || 0)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Fee Amount Paid (₹)</label>
                <input
                  type="number"
                  required
                  value={paidFee}
                  onChange={(e) => setPaidFee(Number(e.target.value) || 0)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  className="owner-refresh-btn"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-purple-primary"
                >
                  Save Updates
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
