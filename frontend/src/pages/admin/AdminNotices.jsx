import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Icon from '../../components/Icon'

export default function AdminNotices() {
  const [notices, setNotices] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showIndividualModal, setShowIndividualModal] = useState(false)
  const [students, setStudents] = useState([])
  
  const [newNotice, setNewNotice] = useState({
    title: '',
    category: 'All Blocks',
    body: '',
    isUrgent: false
  })
  
  const [individualNotice, setIndividualNotice] = useState({
    studentEmail: '',
    title: '',
    body: '',
    isUrgent: false
  })

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

  const loadNotices = async () => {
    setLoading(true)
    try {
      const res = await fetchWithAuth('http://localhost:5000/api/admin/notices')
      if (res.ok) {
        const data = await res.json()
        const mapped = data.map(n => ({
          id: n.id,
          title: n.title,
          category: n.targetStudentEmail ? `Personal (${n.targetStudentEmail})` : n.targetBlock,
          body: n.content,
          date: n.date,
          author: n.author || 'System Administrator',
          isUrgent: !!n.isUrgent
        }))
        setNotices(mapped)
      }
    } catch (err) {
      console.error('Failed to load notices:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadStudents = async () => {
    try {
      const res = await fetchWithAuth('http://localhost:5000/api/admin/students')
      if (res.ok) {
        const data = await res.json()
        setStudents(data)
        if (data.length > 0) {
          setIndividualNotice(prev => ({ ...prev, studentEmail: data[0].email }))
        }
      }
    } catch (err) {
      console.error('Failed to load students list for dropdown:', err)
    }
  }

  useEffect(() => {
    loadNotices()
    loadStudents()
  }, [])

  const handlePostSubmit = async (e) => {
    e.preventDefault()
    if (!newNotice.title || !newNotice.body) return

    try {
      const res = await fetchWithAuth('http://localhost:5000/api/admin/notices', {
        method: 'POST',
        body: JSON.stringify({
          title: newNotice.title,
          content: newNotice.body,
          targetBlock: newNotice.category,
          isUrgent: newNotice.isUrgent
        })
      })

      if (res.ok) {
        alert('Notice successfully published to boards')
        setNewNotice({ title: '', category: 'All Blocks', body: '', isUrgent: false })
        setShowModal(false)
        loadNotices()
      } else {
        alert('Failed to publish notice.')
      }
    } catch (err) {
      console.error('Failed to publish notice:', err)
    }
  }

  const handleIndividualSubmit = async (e) => {
    e.preventDefault()
    if (!individualNotice.studentEmail || !individualNotice.title || !individualNotice.body) return

    try {
      const res = await fetchWithAuth('http://localhost:5000/api/admin/notifications/individual', {
        method: 'POST',
        body: JSON.stringify({
          studentEmail: individualNotice.studentEmail,
          title: individualNotice.title,
          content: individualNotice.body,
          isUrgent: individualNotice.isUrgent
        })
      })

      if (res.ok) {
        alert('Notification successfully sent to student profile')
        setIndividualNotice({
          studentEmail: students.length > 0 ? students[0].email : '',
          title: '',
          body: '',
          isUrgent: false
        })
        setShowIndividualModal(false)
        loadNotices() // Reload notice board list
      } else {
        const err = await res.json().catch(() => ({}))
        alert(`Failed to send notification: ${err.message || 'Server error'}`)
      }
    } catch (err) {
      console.error('Failed to send individual notification:', err)
    }
  }

  const handleDelete = async (id) => {
    const confirm = window.confirm('Are you sure you want to delete this notice/alert?')
    if (!confirm) return

    try {
      const res = await fetchWithAuth(`http://localhost:5000/api/admin/notices/${id}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        alert('Notice deleted successfully')
        loadNotices()
      } else {
        alert('Failed to delete notice.')
      }
    } catch (err) {
      console.error('Error deleting notice:', err)
    }
  }

  return (
    <div className="tab-pane animate-fade-in-slide-up">
      {/* Header Bar */}
      <div className="owner-card-box" style={{ padding: '20px 24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <h3 style={{ margin: 0, font: '800 18px "Manrope", sans-serif', color: '#0f172a' }}>Hostel Notice Board</h3>
            <span style={{ fontSize: '13px', color: '#64748b' }}>{notices.length} active notices published</span>
          </div>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              className="owner-refresh-btn"
              onClick={() => setShowIndividualModal(true)}
              style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#475569', fontWeight: 700 }}
            >
              Send Personal Alert
            </button>
            <button
              type="button"
              className="btn-purple-primary"
              onClick={() => setShowModal(true)}
            >
              + Create Notice
            </button>
          </div>
        </div>
      </div>

      {/* Notice Board List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {loading ? (
          <div className="owner-card-box" style={{ textAlign: 'center', padding: '36px 0', fontWeight: 600 }}>Loading announcements...</div>
        ) : notices.length === 0 ? (
          <div className="owner-card-box" style={{ textAlign: 'center', padding: '36px 0' }}>
            <p style={{ color: '#64748b', margin: 0 }}>No active broadcast announcements posted today.</p>
          </div>
        ) : (
          notices.map((n) => (
            <div key={n.id} className="owner-card-box animate-fade-in" style={{
              borderLeft: n.isUrgent ? '4px solid #ef4444' : '4px solid #10b981',
              position: 'relative'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '8px' }}>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      color: n.isUrgent ? '#ef4444' : '#10b981',
                      background: n.isUrgent ? '#fee2e2' : '#d1fae5',
                      padding: '2px 8px',
                      borderRadius: '5px',
                      textTransform: 'uppercase'
                    }}>
                      {n.category}
                    </span>
                    <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
                      Posted on: {n.date}
                    </span>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>
                      By: {n.author}
                    </span>
                  </div>
                  <h4 style={{ margin: '0 0 8px 0', font: '800 16px "Manrope", sans-serif', color: '#0f172a' }}>{n.title}</h4>
                  <p style={{ margin: 0, color: '#475569', fontSize: '14px', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{n.body}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(n.id)}
                  style={{
                    background: '#fee2e2',
                    color: '#ef4444',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  Delete Notice
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Broadcast Notice Modal */}
      {showModal && createPortal(
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
          <div className="owner-card-box" style={{ maxWidth: '500px', width: '100%', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, font: '800 18px "Manrope", sans-serif' }}>Publish Broadcast Notice</h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#64748b' }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handlePostSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Broadcast Destination</label>
                <select
                  value={newNotice.category}
                  onChange={(e) => setNewNotice({ ...newNotice, category: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '14px', boxSizing: 'border-box' }}
                >
                  <option value="All Blocks">All Blocks &amp; Students</option>
                  <option value="Block A">Block A Students</option>
                  <option value="Block B">Block B Students</option>
                  <option value="Block C">Block C Students</option>
                  <option value="Block F">Block F Students</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Notice Title</label>
                <input
                  type="text"
                  required
                  placeholder="Enter notice title"
                  value={newNotice.title}
                  onChange={(e) => setNewNotice({ ...newNotice, title: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Notice Body</label>
                <textarea
                  required
                  rows="4"
                  placeholder="Enter the details of the notice announcement..."
                  value={newNotice.body}
                  onChange={(e) => setNewNotice({ ...newNotice, body: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '14px', boxSizing: 'border-box', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="broadcastUrgent"
                  checked={newNotice.isUrgent}
                  onChange={(e) => setNewNotice({ ...newNotice, isUrgent: e.target.checked })}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label htmlFor="broadcastUrgent" style={{ fontSize: '13.5px', fontWeight: 600, color: '#ef4444', cursor: 'pointer' }}>Mark notice as URGENT (displays in red warning flag)</label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  className="owner-refresh-btn"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-purple-primary"
                >
                  Publish Notice
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Send Personal Alert Modal */}
      {showIndividualModal && createPortal(
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
          <div className="owner-card-box" style={{ maxWidth: '500px', width: '100%', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, font: '800 18px "Manrope", sans-serif' }}>Send Individual Student Alert</h3>
              <button
                type="button"
                onClick={() => setShowIndividualModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#64748b' }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleIndividualSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Recipient Student</label>
                <select
                  value={individualNotice.studentEmail}
                  onChange={(e) => setIndividualNotice({ ...individualNotice, studentEmail: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '14px', boxSizing: 'border-box' }}
                >
                  {students.map(s => (
                    <option key={s.id} value={s.email}>
                      {s.name} ({s.email})
                    </option>
                  ))}
                  {students.length === 0 && <option value="">No students registered</option>}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Alert Title</label>
                <input
                  type="text"
                  required
                  placeholder="Enter notice title"
                  value={individualNotice.title}
                  onChange={(e) => setIndividualNotice({ ...individualNotice, title: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Message Body</label>
                <textarea
                  required
                  rows="4"
                  placeholder="Enter alert message details..."
                  value={individualNotice.body}
                  onChange={(e) => setIndividualNotice({ ...individualNotice, body: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '14px', boxSizing: 'border-box', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="individualUrgent"
                  checked={individualNotice.isUrgent}
                  onChange={(e) => setIndividualNotice({ ...individualNotice, isUrgent: e.target.checked })}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label htmlFor="individualUrgent" style={{ fontSize: '13.5px', fontWeight: 600, color: '#ef4444', cursor: 'pointer' }}>Mark notice as URGENT (displays in red warning flag)</label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  className="owner-refresh-btn"
                  onClick={() => setShowIndividualModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-purple-primary"
                  disabled={students.length === 0}
                >
                  Send Alert
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
