import { useState, useEffect } from 'react'

export default function AdminComplaints() {
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Modals
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [selectedComplaint, setSelectedComplaint] = useState(null)
  const [newStatus, setNewStatus] = useState('Pending')

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

  const loadComplaints = async () => {
    setLoading(true)
    try {
      const res = await fetchWithAuth('http://localhost:5000/api/admin/complaints')
      if (res.ok) {
        const data = await res.json()
        setComplaints(data)
      }
    } catch (err) {
      console.error('Failed to load complaints:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadComplaints()
  }, [])

  const handleEditClick = (complaint) => {
    setSelectedComplaint(complaint)
    setNewStatus(complaint.status || 'Pending')
    setShowStatusModal(true)
  }

  const handleStatusSubmit = async (e) => {
    e.preventDefault()
    if (!selectedComplaint) return

    try {
      const res = await fetchWithAuth(`http://localhost:5000/api/admin/complaints/${selectedComplaint.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      })
      if (res.ok) {
        alert('Complaint status updated successfully')
        setShowStatusModal(false)
        setSelectedComplaint(null)
        loadComplaints()
      } else {
        alert('Failed to update complaint status.')
      }
    } catch (err) {
      console.error('Error updating complaint status:', err)
    }
  }

  return (
    <div className="tab-pane animate-fade-in-slide-up">
      {/* Header Bar */}
      <div className="owner-card-box" style={{ padding: '20px 24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ margin: 0, font: '800 18px "Manrope", sans-serif', color: '#0f172a' }}>Student Complaints &amp; Issues</h3>
            <span style={{ fontSize: '13px', color: '#64748b' }}>{complaints.length} total complaints logged</span>
          </div>
          <button type="button" className="owner-refresh-btn" onClick={loadComplaints}>
            Refresh List
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="owner-table-wrapper">
        {loading ? (
          <p className="empty-state-text" style={{ padding: '36px 0', textAlign: 'center', margin: 0, fontWeight: 600 }}>Loading complaints...</p>
        ) : complaints.length === 0 ? (
          <p className="empty-state-text" style={{ padding: '36px 0', textAlign: 'center', margin: 0 }}>No complaints logged by students yet.</p>
        ) : (
          <table className="owner-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Room</th>
                <th>Category</th>
                <th>Title</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {complaints.map((c) => (
                <tr key={c.id}>
                  <td><strong>{c.studentName}</strong><div style={{ fontSize: '12px', color: '#64748b' }}>{c.studentEmail}</div></td>
                  <td><strong>{c.room || 'N/A'}</strong></td>
                  <td>{c.category}</td>
                  <td>
                    <strong>{c.title}</strong>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Logged on: {c.date}</div>
                  </td>
                  <td>
                    <span className={`owner-pill ${c.status === 'Resolved' ? 'available' : c.status === 'In Progress' ? 'partial' : 'pending'}`}>
                      {c.status}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="owner-action-btn"
                      onClick={() => handleEditClick(c)}
                      style={{ border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                    >
                      Update Status
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Update Status Modal */}
      {showStatusModal && (
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
              <h3 style={{ margin: 0, font: '800 18px "Manrope", sans-serif' }}>Update Complaint Status</h3>
              <button
                type="button"
                onClick={() => setShowStatusModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#64748b' }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleStatusSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Selected Issue</label>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b', background: '#f8fafc', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  {selectedComplaint?.title} ({selectedComplaint?.category})
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Update Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '14px', boxSizing: 'border-box' }}
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  className="owner-refresh-btn"
                  onClick={() => setShowStatusModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-purple-primary"
                >
                  Update Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
