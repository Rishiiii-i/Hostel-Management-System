import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Icon from '../../components/Icon'

export default function AdminStudents() {
  const [searchQuery, setSearchQuery] = useState('')
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState(null)

  // Forms
  const [studentForm, setStudentForm] = useState({
    name: '',
    email: '',
    phone: '',
    room: '',
    block: 'Block A',
    rollNo: '',
    branch: 'Computer Science',
    year: '1st Year',
    totalFee: 45000,
    paidFee: 0
  })

  const resetForm = () => {
    setStudentForm({
      name: '',
      email: '',
      phone: '',
      room: '',
      block: 'Block A',
      rollNo: '',
      branch: 'Computer Science',
      year: '1st Year',
      totalFee: 45000,
      paidFee: 0
    })
  }

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

  const loadStudents = async () => {
    setLoading(true)
    try {
      const res = await fetchWithAuth('http://localhost:5000/api/admin/students')
      if (res.ok) {
        const data = await res.json()
        setStudents(data)
      }
    } catch (err) {
      console.error('Failed to load students:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStudents()
  }, [])

  const handleAddSubmit = async (e) => {
    e.preventDefault()
    try {
      const res = await fetchWithAuth('http://localhost:5000/api/admin/students', {
        method: 'POST',
        body: JSON.stringify(studentForm)
      })
      if (res.ok) {
        alert('Student successfully registered')
        setShowAddModal(false)
        resetForm()
        loadStudents()
      } else {
        const errData = await res.json()
        alert(errData.message || 'Failed to add student.')
      }
    } catch (err) {
      console.error('Error adding student:', err)
    }
  }

  const handleEditClick = (student) => {
    setSelectedStudent(student)
    setStudentForm({
      name: student.name || '',
      email: student.email || '',
      phone: student.phone || '',
      room: student.room || '',
      block: student.block || 'Block A',
      rollNo: student.rollNo || '',
      branch: student.branch || 'Computer Science',
      year: student.year || '1st Year',
      totalFee: student.totalFee || 45000,
      paidFee: student.paidFee || 0
    })
    setShowEditModal(true)
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    try {
      const res = await fetchWithAuth(`http://localhost:5000/api/admin/students/${selectedStudent.id}`, {
        method: 'PUT',
        body: JSON.stringify(studentForm)
      })
      if (res.ok) {
        alert('Student details updated successfully')
        setShowEditModal(false)
        setSelectedStudent(null)
        resetForm()
        loadStudents()
      } else {
        const errData = await res.json()
        alert(errData.message || 'Failed to update student details.')
      }
    } catch (err) {
      console.error('Error updating student:', err)
    }
  }

  const handleDelete = async (id) => {
    const confirm = window.confirm('Are you sure you want to delete this student record? This action will also release their room.')
    if (!confirm) return

    try {
      const res = await fetchWithAuth(`http://localhost:5000/api/admin/students/${id}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        alert('Student record deleted successfully')
        loadStudents()
      } else {
        alert('Failed to delete student record.')
      }
    } catch (err) {
      console.error('Error deleting student:', err)
    }
  }

  const filtered = Array.isArray(students) ? students.filter(s =>
    (s.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.room || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.rollNo || '').toLowerCase().includes(searchQuery.toLowerCase())
  ) : []

  return (
    <div className="tab-pane animate-fade-in-slide-up">
      {/* Search & Action Header Bar */}
      <div className="owner-card-box" style={{ padding: '20px 24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '280px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                type="text"
                placeholder="Search by name, email, roll number or room..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 16px 10px 38px',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  outline: 'none',
                  fontSize: '14px',
                  background: '#f8fafc',
                  boxSizing: 'border-box'
                }}
              />
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5, display: 'flex' }}>
                <Icon name="search" width="16" height="16" />
              </span>
            </div>
            <button type="button" className="owner-refresh-btn" onClick={loadStudents} style={{ padding: '10px 18px' }}>
              Refresh
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>{filtered.length} students found</span>
            <button
              type="button"
              className="btn-purple-primary"
              onClick={() => { resetForm(); setShowAddModal(true); }}
            >
              + Add Student
            </button>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="owner-table-wrapper">
        {loading ? (
          <p className="empty-state-text" style={{ padding: '36px 0', textAlign: 'center', margin: 0, fontWeight: 600 }}>Loading student accounts...</p>
        ) : filtered.length === 0 ? (
          <p className="empty-state-text" style={{ padding: '36px 0', textAlign: 'center', margin: 0 }}>No enrolled students found.</p>
        ) : (
          <table className="owner-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Room</th>
                <th>Fee Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id}>
                  <td>
                    <div>
                      <strong>{s.name}</strong>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>{s.email}</div>
                    </div>
                  </td>
                  <td><strong>{s.room ? `${s.room} (${s.block || 'N/A'})` : 'Not Allocated'}</strong></td>
                  <td>
                    <span className={`owner-pill ${s.feeStatus ? s.feeStatus.toLowerCase() : 'unpaid'}`}>
                      {s.feeStatus || 'Unpaid'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        className="owner-action-btn"
                        title="Edit Student"
                        onClick={() => handleEditClick(s)}
                        style={{ border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="owner-action-btn delete"
                        title="Delete Student"
                        onClick={() => handleDelete(s.id)}
                        style={{ padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Student Modal */}
      {showAddModal && createPortal(
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
          <div className="owner-card-box" style={{ maxWidth: '600px', width: '100%', padding: '28px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, font: '800 18px "Manrope", sans-serif' }}>Register New Student</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#64748b' }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="Student's name"
                  value={studentForm.name}
                  onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Email ID</label>
                <input
                  type="email"
                  required
                  placeholder="Registered mail ID"
                  value={studentForm.email}
                  onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Phone Number</label>
                <input
                  type="text"
                  placeholder="Phone number"
                  value={studentForm.phone}
                  onChange={(e) => setStudentForm({ ...studentForm, phone: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Roll Number</label>
                <input
                  type="text"
                  required
                  placeholder="University roll no"
                  value={studentForm.rollNo}
                  onChange={(e) => setStudentForm({ ...studentForm, rollNo: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Branch</label>
                <select
                  value={studentForm.branch}
                  onChange={(e) => setStudentForm({ ...studentForm, branch: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '14px', boxSizing: 'border-box' }}
                >
                  <option value="Computer Science">Computer Science</option>
                  <option value="Electronics & Comm">Electronics & Comm</option>
                  <option value="Mechanical Engg">Mechanical Engg</option>
                  <option value="Electrical Engg">Electrical Engg</option>
                  <option value="Civil Engg">Civil Engg</option>
                  <option value="Diploma">Diploma</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Academic Year</label>
                <select
                  value={studentForm.year}
                  onChange={(e) => setStudentForm({ ...studentForm, year: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '14px', boxSizing: 'border-box' }}
                >
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Hostel Room No</label>
                <input
                  type="text"
                  placeholder="e.g. 101 (optional)"
                  value={studentForm.room}
                  onChange={(e) => setStudentForm({ ...studentForm, room: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Hostel Block</label>
                <select
                  value={studentForm.block}
                  onChange={(e) => setStudentForm({ ...studentForm, block: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '14px', boxSizing: 'border-box' }}
                >
                  <option value="Block A">Block A</option>
                  <option value="Block B">Block B</option>
                  <option value="Block C">Block C</option>
                  <option value="Block F">Block F</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Total Fee Amount (₹)</label>
                <input
                  type="number"
                  required
                  value={studentForm.totalFee}
                  onChange={(e) => setStudentForm({ ...studentForm, totalFee: Number(e.target.value) || 0 })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Paid Fee Amount (₹)</label>
                <input
                  type="number"
                  required
                  value={studentForm.paidFee}
                  onChange={(e) => setStudentForm({ ...studentForm, paidFee: Number(e.target.value) || 0 })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  className="owner-refresh-btn"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-purple-primary"
                >
                  Register Student
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Edit Student Modal */}
      {showEditModal && createPortal(
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
          <div className="owner-card-box" style={{ maxWidth: '600px', width: '100%', padding: '28px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, font: '800 18px "Manrope", sans-serif' }}>Edit Student Account</h3>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#64748b' }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleEditSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="Student's name"
                  value={studentForm.name}
                  onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Email ID</label>
                <input
                  type="email"
                  required
                  disabled
                  placeholder="Registered mail ID"
                  value={studentForm.email}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#e2e8f0', color: '#64748b', fontSize: '14px', boxSizing: 'border-box', cursor: 'not-allowed' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Phone Number</label>
                <input
                  type="text"
                  placeholder="Phone number"
                  value={studentForm.phone}
                  onChange={(e) => setStudentForm({ ...studentForm, phone: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Roll Number</label>
                <input
                  type="text"
                  required
                  placeholder="University roll no"
                  value={studentForm.rollNo}
                  onChange={(e) => setStudentForm({ ...studentForm, rollNo: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Branch</label>
                <select
                  value={studentForm.branch}
                  onChange={(e) => setStudentForm({ ...studentForm, branch: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '14px', boxSizing: 'border-box' }}
                >
                  <option value="Computer Science">Computer Science</option>
                  <option value="Electronics & Comm">Electronics & Comm</option>
                  <option value="Mechanical Engg">Mechanical Engg</option>
                  <option value="Electrical Engg">Electrical Engg</option>
                  <option value="Civil Engg">Civil Engg</option>
                  <option value="Diploma">Diploma</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Academic Year</label>
                <select
                  value={studentForm.year}
                  onChange={(e) => setStudentForm({ ...studentForm, year: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '14px', boxSizing: 'border-box' }}
                >
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Hostel Room No</label>
                <input
                  type="text"
                  placeholder="e.g. 101 (optional)"
                  value={studentForm.room}
                  onChange={(e) => setStudentForm({ ...studentForm, room: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Hostel Block</label>
                <select
                  value={studentForm.block}
                  onChange={(e) => setStudentForm({ ...studentForm, block: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '14px', boxSizing: 'border-box' }}
                >
                  <option value="Block A">Block A</option>
                  <option value="Block B">Block B</option>
                  <option value="Block C">Block C</option>
                  <option value="Block F">Block F</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Total Fee Amount (₹)</label>
                <input
                  type="number"
                  required
                  value={studentForm.totalFee}
                  onChange={(e) => setStudentForm({ ...studentForm, totalFee: Number(e.target.value) || 0 })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Paid Fee Amount (₹)</label>
                <input
                  type="number"
                  required
                  value={studentForm.paidFee}
                  onChange={(e) => setStudentForm({ ...studentForm, paidFee: Number(e.target.value) || 0 })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
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
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
