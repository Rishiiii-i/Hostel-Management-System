import { useState } from 'react'

export default function WardenComplaints() {
  const [complaints] = useState([])

  const handleRefresh = () => {
    // refresh list
  }

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
            onClick={handleRefresh}
          >
            Refresh List
          </button>
        </div>
      </div>

      {/* Complaints Table Container */}
      <div className="dash-card">
        {complaints.length === 0 ? (
          <p className="empty-state-text" style={{ padding: '30px 0', textAlign: 'center', margin: 0 }}>
            No complaints logged by students yet.
          </p>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Room</th>
                  <th>Title</th>
                  <th>Complaint</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map((c) => (
                  <tr key={c.id}>
                    <td><strong>{c.student}</strong></td>
                    <td><strong>{c.room}</strong></td>
                    <td>{c.title}</td>
                    <td>{c.complaint}</td>
                    <td>
                      <span className="status-badge paid">
                        {c.status}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn-pay-fee"
                        style={{ padding: '4px 10px', fontSize: '12px' }}
                        title="View Details"
                      >
                        View
                      </button>
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
