import { useState } from 'react'
import Icon from '../../components/Icon'

export default function AdminStudents() {
  const [searchQuery, setSearchQuery] = useState('')
  const [students, setStudents] = useState([])

  const handleDelete = (id) => {
    setStudents(students.filter(s => s.id !== id))
  }

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.room.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="tab-pane animate-fade-in-slide-up">
      <div className="tab-header-box" style={{ background: '#ffffff', border: '1px solid #f1f5f9', borderRadius: '20px', padding: '16px 20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '280px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 16px 10px 38px',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  outline: 'none',
                  fontSize: '14px',
                  background: '#f8fafc'
                }}
              />
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>
                <Icon name="search" width="16" height="16" />
              </span>
            </div>
            <button type="button" className="btn-purple-primary" style={{ padding: '10px 18px', background: '#f1f5f9', color: '#0f172a', border: '1px solid #e2e8f0', boxShadow: 'none' }}>
              Search
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>{filtered.length} students</span>
            <button type="button" className="btn-purple-primary" onClick={() => alert('Add Student Modal')}>
              + Add Student
            </button>
          </div>
        </div>
      </div>

      <div className="owner-table-wrapper">
        {filtered.length === 0 ? (
          <p className="empty-state-text" style={{ padding: '30px 0', textAlign: 'center' }}>No enrolled students found.</p>
        ) : (
          <table className="owner-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Room</th>
                <th>Branch</th>
                <th>Year</th>
                <th>Fee Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id}>
                  <td><strong>{s.name}</strong></td>
                  <td style={{ color: '#64748b' }}>{s.email}</td>
                  <td><strong>{s.room}</strong></td>
                  <td>{s.branch}</td>
                  <td>{s.year}</td>
                  <td>
                    <span className={`owner-pill ${s.feeStatus.toLowerCase()}`}>
                      {s.feeStatus}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button type="button" className="owner-action-btn" title="Edit Student">Edit</button>
                      <button type="button" className="owner-action-btn delete" title="Delete Student" onClick={() => handleDelete(s.id)}>Delete</button>
                    </div>
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
