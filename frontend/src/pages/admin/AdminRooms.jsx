import { useState } from 'react'

export default function AdminRooms() {
  const [rooms] = useState([])

  return (
    <div className="tab-pane animate-fade-in-slide-up">
      <div className="owner-table-wrapper">
        {rooms.length === 0 ? (
          <p className="empty-state-text" style={{ padding: '30px 0', textAlign: 'center' }}>No hostel rooms configured.</p>
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
