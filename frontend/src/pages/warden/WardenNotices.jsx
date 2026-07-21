import { useState } from 'react'

export default function WardenNotices() {
  const [notices, setNotices] = useState([])

  const [showModal, setShowModal] = useState(false)
  const [newNotice, setNewNotice] = useState({
    title: '',
    category: 'General',
    body: ''
  })

  const handleDelete = (id) => {
    setNotices(notices.filter(n => n.id !== id))
  }

  const handlePostSubmit = (e) => {
    e.preventDefault()
    if (!newNotice.title || !newNotice.body) return

    const item = {
      id: `N-${Date.now().toString().slice(-4)}`,
      title: newNotice.title,
      category: newNotice.category,
      body: newNotice.body,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      author: 'Warden'
    }

    setNotices([item, ...notices])
    setNewNotice({ title: '', category: 'General', body: '' })
    setShowModal(false)
  }

  return (
    <div className="tab-pane animate-fade-in-slide-up">
      {/* Header Bar */}
      <div className="owner-card-box" style={{ padding: '20px 24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ margin: 0, font: '800 18px "Manrope", sans-serif', color: '#0f172a' }}>Hostel Notice Board</h3>
            <span style={{ fontSize: '13px', color: '#64748b' }}>{notices.length} active notices published</span>
          </div>

          <button
            type="button"
            className="btn-purple-primary"
            onClick={() => setShowModal(true)}
          >
            + Post New Notice
          </button>
        </div>
      </div>

      {/* Notices Feed */}
      <div className="owner-card-box">
        {notices.length === 0 ? (
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
                    <span className="owner-pill paid">
                      {n.category}
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
          zIndex: 1000,
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
                  placeholder="e.g. Water Maintenance Tomorrow"
                  value={newNotice.title}
                  onChange={(e) => setNewNotice({ ...newNotice, title: e.target.value })}
                  required
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Category</label>
                <select
                  value={newNotice.category}
                  onChange={(e) => setNewNotice({ ...newNotice, category: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '14px', boxSizing: 'border-box' }}
                >
                  <option value="General">General</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Event">Event</option>
                  <option value="Emergency">Emergency</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Notice Details</label>
                <textarea
                  rows="4"
                  placeholder="Write notice description..."
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
    </div>
  )
}
