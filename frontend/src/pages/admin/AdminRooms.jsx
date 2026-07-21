import { useState } from 'react'

export default function AdminRooms() {
  const [rooms] = useState([])

  return (
    <div className="tab-pane animate-fade-in-slide-up">
      {/* Header Bar */}
      <div className="owner-card-box" style={{ padding: '20px 24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ margin: 0, font: '800 18px "Manrope", sans-serif', color: '#0f172a' }}>Hostel Room Management</h3>
            <span style={{ fontSize: '13px', color: '#64748b' }}>{rooms.length} total rooms configured</span>
          </div>
          <button type="button" className="btn-purple-primary" onClick={() => alert('Add Room Modal')}>
            + Add Room
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="owner-table-wrapper">
        {rooms.length === 0 ? (
          <p className="empty-state-text" style={{ padding: '36px 0', textAlign: 'center', margin: 0 }}>No hostel rooms configured.</p>
        ) : (
          <table className="owner-table">
            <thead>
              <tr>
                <th>Room No</th>
                <th>Floor</th>
                <th>Type</th>
                <th>Capacity</th>
                <th>Occupied</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((r) => (
                <tr key={r.id}>
                  <td><strong>{r.roomNo}</strong></td>
                  <td>{r.floor}</td>
                  <td>{r.type}</td>
                  <td>{r.capacity}</td>
                  <td>{r.occupied}</td>
                  <td>
                    <span className="owner-pill available">
                      {r.status}
                    </span>
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
