import { useState } from 'react'

export default function AdminComplaints() {
  const [complaints] = useState([])

  const handleRefresh = () => {
    // refresh list
  }

  return (
    <div className="tab-pane animate-fade-in-slide-up">
      <div className="tab-header-box" style={{ background: '#ffffff', border: '1px solid #f1f5f9', borderRadius: '20px', padding: '16px 20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#64748b' }}>{complaints.length} total complaints</span>
          <button type="button" className="owner-refresh-btn" onClick={handleRefresh}>
            Refresh
          </button>
        </div>
      </div>

      <div className="owner-table-wrapper">
        {complaints.length === 0 ? (
          <p className="empty-state-text" style={{ padding: '30px 0', textAlign: 'center' }}>No complaints logged.</p>
        ) : (
          <table className="owner-table">
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
                    <span className="owner-pill paid">
                      {c.status}
                    </span>
                  </td>
                  <td>
                    <button type="button" className="owner-action-btn">Edit</button>
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
