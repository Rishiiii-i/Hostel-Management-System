import { useState, useEffect } from 'react'
import Icon from '../../components/Icon'

export default function WardenNotices() {
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

  const loadNoticesData = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth('http://localhost:5000/api/warden/notices');
      if (res.ok) {
        const data = await res.json();
        const mapped = data.map(n => ({
          id: n.id,
          title: n.title,
          category: n.targetStudentEmail ? `Personal (${n.targetStudentEmail})` : n.targetBlock,
          body: n.content,
          date: n.date,
          author: n.author || 'Warden',
          isUrgent: !!n.isUrgent
        }));
        setNotices(mapped);
      }
    } catch (err) {
      console.error('Failed to load notices:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id) => {
    setNotices(notices.filter(n => n.id !== id))
  }

  const handlePostSubmit = async (e) => {
    e.preventDefault()
    if (!newNotice.title || !newNotice.body) return

    try {
      const res = await fetchWithAuth('http://localhost:5000/api/warden/notices', {
        method: 'POST',
        body: JSON.stringify({
          title: newNotice.title,
          content: newNotice.body,
          targetBlock: newNotice.category,
          isUrgent: newNotice.isUrgent
        })
      });

      if (res.ok) {
        alert('Notice successfully published');
        setNewNotice({ title: '', category: 'All Blocks', body: '', isUrgent: false });
        setShowModal(false);
        loadNoticesData();
      } else {
        alert('Failed to publish notice.');
      }
    } catch (err) {
      console.error('Failed to publish notice:', err);
    }
  }

  const loadStudentsData = async () => {
    try {
      const res = await fetchWithAuth('http://localhost:5000/api/warden/students');
      if (res.ok) {
        const data = await res.json();
        setStudents(data);
        if (data.length > 0) {
          setIndividualNotice(prev => ({ ...prev, studentEmail: data[0].email }));
        }
      }
    } catch (err) {
      console.error('Failed to load students list:', err);
    }
  };

  const handleIndividualSubmit = async (e) => {
    e.preventDefault();
    if (!individualNotice.studentEmail || !individualNotice.title || !individualNotice.body) return;

    try {
      const res = await fetchWithAuth('http://localhost:5000/api/warden/notifications/individual', {
        method: 'POST',
        body: JSON.stringify({
          studentEmail: individualNotice.studentEmail,
          title: individualNotice.title,
          content: individualNotice.body,
          isUrgent: individualNotice.isUrgent
        })
      });

      if (res.ok) {
        alert('Notification successfully sent to student');
        setIndividualNotice({
          studentEmail: students.length > 0 ? students[0].email : '',
          title: '',
          body: '',
          isUrgent: false
        });
        setShowIndividualModal(false);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(`Failed to send notification: ${err.message || 'Server error'}`);
      }
    } catch (err) {
      console.error('Failed to send individual notification:', err);
    }
  };

  useEffect(() => {
    loadNoticesData();
    loadStudentsData();
  }, []);

  return (
    <div className="tab-pane animate-fade-in-slide-up">
      {/* Header Bar */}
      <div className="owner-card-box" style={{ padding: '20px 24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ margin: 0, font: '800 18px "Manrope", sans-serif', color: '#0f172a' }}>Hostel Notice Board</h3>
            <span style={{ fontSize: '13px', color: '#64748b' }}>{notices.length} active notices published</span>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              className="btn-purple-primary"
              onClick={() => setShowModal(true)}
            >
              + Post New Notice
            </button>
            <button
              type="button"
              className="btn-purple-primary"
              style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' }}
              onClick={() => setShowIndividualModal(true)}
            >
              + Send Individual Alert
            </button>
          </div>
        </div>
      </div>

      {/* Notices Feed */}
      <div className="owner-card-box">
        {loading ? (
          <div style={{ padding: '40px 0', textAlign: 'center', fontWeight: 600, color: '#557162' }}>
            Loading notices feed...
          </div>
        ) : notices.length === 0 ? (
          <p className="empty-state-text" style={{ padding: '30px 0', textAlign: 'center', margin: 0 }}>
            No notices posted yet. Click "+ Post New Notice" to create one.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {notices.map((n) => (
              <div key={n.id} style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                padding: '18px 22px',
                borderRadius: '16px',
                border: '1px solid #f1f5f9',
                background: '#ffffff',
                gap: '16px'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <strong style={{ fontSize: '15.5px', color: '#0f172a' }}>{n.title}</strong>
                    <span className="owner-pill paid" style={{ background: n.isUrgent ? '#fee2e2' : '#e0f2fe', color: n.isUrgent ? '#991b1b' : '#0369a1' }}>
                      {n.category} {n.isUrgent ? '(Urgent)' : ''}
                    </span>
                  </div>
                  <p style={{ color: '#475569', fontSize: '14px', margin: '4px 0 10px 0', lineHeight: 1.5 }}>
                    {n.body}
                  </p>
                  <small style={{ color: '#94a3b8', fontSize: '12.5px', fontWeight: 600 }}>
                    {n.date} &bull; {n.author}
                  </small>
                </div>

                <button
                  type="button"
                  className="owner-action-btn delete"
                  title="Delete Notice"
                  onClick={() => handleDelete(n.id)}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Post Notice Modal */}
      {showModal && (
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
              <h3 style={{ margin: 0, font: '800 18px "Manrope", sans-serif' }}>Post New Notice</h3>
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
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Notice Title</label>
                <input
                  type="text"
                  placeholder="Enter the notice title"
                  value={newNotice.title}
                  onChange={(e) => setNewNotice({ ...newNotice, title: e.target.value })}
                  required
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Target Block</label>
                <select
                  value={newNotice.category}
                  onChange={(e) => setNewNotice({ ...newNotice, category: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '14px', boxSizing: 'border-box' }}
                >
                  <option value="All Blocks">All Blocks</option>
                  <option value="Block A">Block A</option>
                  <option value="Block B">Block B</option>
                  <option value="Block C">Block C</option>
                  <option value="Block F">Block F</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="isUrgent"
                  checked={newNotice.isUrgent}
                  onChange={(e) => setNewNotice({ ...newNotice, isUrgent: e.target.checked })}
                  style={{ cursor: 'pointer' }}
                />
                <label htmlFor="isUrgent" style={{ fontSize: '13px', fontWeight: 700, color: '#475569', cursor: 'pointer' }}>Mark notice as Urgent</label>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Notice Details</label>
                <textarea
                  rows="4"
                  placeholder="Enter the notice description"
                  value={newNotice.body}
                  onChange={(e) => setNewNotice({ ...newNotice, body: e.target.value })}
                  required
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '14px', boxSizing: 'border-box', fontFamily: 'inherit' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
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
        </div>
      )}


      {/* Send Individual Notification Modal */}
      {showIndividualModal && (
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
              <h3 style={{ margin: 0, font: '800 18px "Manrope", sans-serif' }}>Send Individual Alert</h3>
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
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Select Student</label>
                {students.length === 0 ? (
                  <p style={{ fontSize: '13.5px', color: '#ef4444', margin: '4px 0' }}>No registered students found.</p>
                ) : (
                  <select
                    value={individualNotice.studentEmail}
                    onChange={(e) => setIndividualNotice({ ...individualNotice, studentEmail: e.target.value })}
                    required
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '14px', boxSizing: 'border-box' }}
                  >
                    {students.map((s) => (
                      <option key={s.id} value={s.email}>{s.name} ({s.email})</option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Alert Title</label>
                <input
                  type="text"
                  placeholder="Enter the alert title"
                  value={individualNotice.title}
                  onChange={(e) => setIndividualNotice({ ...individualNotice, title: e.target.value })}
                  required
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="isUrgentIndividual"
                  checked={individualNotice.isUrgent}
                  onChange={(e) => setIndividualNotice({ ...individualNotice, isUrgent: e.target.checked })}
                  style={{ cursor: 'pointer' }}
                />
                <label htmlFor="isUrgentIndividual" style={{ fontSize: '13px', fontWeight: 700, color: '#475569', cursor: 'pointer' }}>Mark alert as Urgent</label>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Message Details</label>
                <textarea
                  rows="4"
                  placeholder="Enter the notification message details"
                  value={individualNotice.body}
                  onChange={(e) => setIndividualNotice({ ...individualNotice, body: e.target.value })}
                  required
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '14px', boxSizing: 'border-box', fontFamily: 'inherit' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
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
                  style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' }}
                  disabled={students.length === 0}
                >
                  Send Alert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
