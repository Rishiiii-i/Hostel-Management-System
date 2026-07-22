import { useState, useEffect } from 'react'

export default function WardenGatePasses() {
  const [passes, setPasses] = useState([])
  const [loading, setLoading] = useState(true)

  // helper for requests with authentication headers
  const fetchWithAuth = async (url, options = {}) => {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers
    };
    return fetch(url, { ...options, headers });
  };

  const loadGatePassesData = async () => {
    setLoading(true)
    try {
      const res = await fetchWithAuth('http://localhost:5000/api/warden/gatepasses')
      if (res.ok) {
        const data = await res.json()
        setPasses(data)
      }
    } catch (err) {
      console.error('Failed to load gate passes:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadGatePassesData()
  }, [])

  const handleUpdateStatus = async (id, status) => {
    try {
      const res = await fetchWithAuth(`http://localhost:5000/api/warden/gatepasses/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      })
      if (res.ok) {
        alert(`Gate pass request successfully ${status.toLowerCase()}`)
        loadGatePassesData()
      } else {
        alert('Failed to update gate pass status.')
      }
    } catch (err) {
      console.error('Failed to update gate pass status:', err)
    }
  }

  return (
    <div className="tab-pane animate-fade-in-slide-up">
      {/* Header Bar */}
      <div className="owner-card-box" style={{ padding: '20px 24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ margin: 0, font: '800 18px "Manrope", sans-serif', color: '#0f172a' }}>Gate Pass Applications</h3>
            <span style={{ fontSize: '13px', color: '#64748b' }}>{passes.length} total requests registered</span>
          </div>
          <button
            type="button"
            className="btn-pay-fee"
            style={{ padding: '7px 16px', fontSize: '13px' }}
            onClick={loadGatePassesData}
          >
            Refresh List
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="dash-card">
        {loading ? (
          <div style={{ padding: '40px 0', textAlign: 'center', fontWeight: 600, color: '#557162' }}>
            Loading gate pass logs...
          </div>
        ) : passes.length === 0 ? (
          <p className="empty-state-text" style={{ padding: '30px 0', textAlign: 'center', margin: 0 }}>
            No gate pass requests found.
          </p>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Pass ID</th>
                  <th>Student</th>
                  <th>Room</th>
                  <th>Destination</th>
                  <th>Outing Reason</th>
                  <th>Departure Date</th>
                  <th>Return Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {passes.map((p) => (
                  <tr key={p.id}>
                    <td><strong>{p.id}</strong></td>
                    <td><strong>{p.studentName}</strong></td>
                    <td><strong>{p.room || 'N/A'}</strong></td>
                    <td>{p.destination || 'N/A'}</td>
                    <td>{p.reason}</td>
                    <td>{p.departure}</td>
                    <td>{p.returnDate}</td>
                    <td>
                      <span className={`status-badge ${p.status.toLowerCase()}`}>
                        {p.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {p.status === 'Pending' ? (
                          <>
                            <button
                              type="button"
                              className="btn-pay-fee"
                              style={{ padding: '6px 12px', fontSize: '12px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: 'none' }}
                              onClick={() => handleUpdateStatus(p.id, 'Approved')}
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              className="owner-action-btn delete"
                              style={{ padding: '6px 12px', fontSize: '12px', background: '#ef4444', color: '#ffffff', borderColor: '#fca5a5' }}
                              onClick={() => handleUpdateStatus(p.id, 'Rejected')}
                            >
                              Reject
                            </button>
                          </>
                        ) : (
                          <span style={{ fontSize: '12.5px', color: '#64748b', fontStyle: 'italic' }}>Reviewed</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
