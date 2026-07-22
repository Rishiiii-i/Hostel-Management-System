import { useState, useEffect } from 'react'
import Icon from '../../components/Icon'

export default function WardenComplaints() {
  const [complaints, setComplaints] = useState([])
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

  const loadComplaintsData = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth('http://localhost:5000/api/warden/complaints');
      if (res.ok) {
        const data = await res.json();
        setComplaints(data);
      }
    } catch (err) {
      console.error('Failed to load complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const res = await fetchWithAuth(`http://localhost:5000/api/warden/complaints/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        alert(`Complaint status successfully updated to ${newStatus}`);
        loadComplaintsData();
      } else {
        alert('Failed to update complaint status.');
      }
    } catch (err) {
      console.error('Failed to update complaint status:', err);
    }
  };

  useEffect(() => {
    loadComplaintsData();
  }, []);

  return (
    <div className="tab-pane animate-fade-in-slide-up">
      {/* Header Bar */}
      <div className="owner-card-box" style={{ padding: '20px 24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ margin: 0, font: '800 18px "Manrope", sans-serif', color: '#0f172a' }}>Student Complaints &amp; Requests</h3>
            <span style={{ fontSize: '13px', color: '#64748b' }}>{complaints.length} total complaints logged</span>
          </div>

          <button
            type="button"
            className="btn-pay-fee"
            style={{ padding: '7px 16px', fontSize: '13px' }}
            onClick={loadComplaintsData}
          >
            Refresh List
          </button>
        </div>
      </div>

      {/* Complaints Table Container */}
      <div className="dash-card">
        {loading ? (
          <div style={{ padding: '40px 0', textAlign: 'center', fontWeight: 600, color: '#557162' }}>
            Loading complaints records...
          </div>
        ) : complaints.length === 0 ? (
          <p className="empty-state-text" style={{ padding: '30px 0', textAlign: 'center', margin: 0 }}>
            No complaints logged by students yet.
          </p>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Ticket ID</th>
                  <th>Student</th>
                  <th>Room</th>
                  <th>Category</th>
                  <th>Problem Description</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map((c) => (
                  <tr key={c.id}>
                    <td><strong>{c.id}</strong></td>
                    <td><strong>{c.studentName}</strong></td>
                    <td><strong>{c.room || 'N/A'}</strong></td>
                    <td><span className="category-tag">{c.category}</span></td>
                    <td>{c.title}</td>
                    <td>
                      <span className={`status-badge ${c.status.toLowerCase().replace(/\s+/g, '-')}`}>
                        {c.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {c.status === 'Pending' && (
                          <button
                            type="button"
                            className="btn-pay-fee"
                            style={{ padding: '6px 12px', fontSize: '12px', background: '#3b82f6', border: 'none' }}
                            onClick={() => handleUpdateStatus(c.id, 'In Progress')}
                          >
                            Start Work
                          </button>
                        )}
                        {c.status !== 'Resolved' && (
                          <button
                            type="button"
                            className="btn-pay-fee"
                            style={{ padding: '6px 12px', fontSize: '12px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: 'none' }}
                            onClick={() => handleUpdateStatus(c.id, 'Resolved')}
                          >
                            Resolve
                          </button>
                        )}
                        {c.status === 'Resolved' && (
                          <span style={{ fontSize: '12.5px', color: '#64748b', fontStyle: 'italic' }}>No actions</span>
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
