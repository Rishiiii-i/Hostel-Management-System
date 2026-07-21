import { useState, useRef } from 'react'
import Icon from '../../components/Icon'

export default function AdminProfile({ profile, setProfile }) {
  const fileInputRef = useRef(null)
  const [formData, setFormData] = useState({
    fullName: profile?.fullName || 'System Administrator',
    email: profile?.email || 'admin@smarthostel.com',
    phone: profile?.phone || '+91 9876543210',
    office: profile?.office || 'Central Admin Block, Room 101',
    role: 'System Administrator',
    photo: profile?.photo || ''
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const [showPassword, setShowPassword] = useState(false)
  const [msg, setMsg] = useState({ type: '', text: '' })

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setMsg({ type: 'error', text: 'File size should be less than 5MB.' })
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const photoUrl = reader.result
      setFormData(prev => ({ ...prev, photo: photoUrl }))
      const updated = { ...(profile || {}), photo: photoUrl }
      if (setProfile) {
        setProfile(updated)
      }
      try {
        localStorage.setItem('shm_user_profile', JSON.stringify(updated))
      } catch (err) {}
      setMsg({ type: 'success', text: 'Admin profile photo updated successfully.' })
      setTimeout(() => setMsg({ type: '', text: '' }), 4000)
    }
    reader.readAsDataURL(file)
  }

  const handleRemovePhoto = () => {
    setFormData(prev => ({ ...prev, photo: '' }))
    const updated = { ...(profile || {}), photo: '' }
    if (setProfile) {
      setProfile(updated)
    }
    try {
      localStorage.setItem('shm_user_profile', JSON.stringify(updated))
    } catch (err) {}
    if (fileInputRef.current) fileInputRef.current.value = ''
    setMsg({ type: 'success', text: 'Admin profile photo removed.' })
    setTimeout(() => setMsg({ type: '', text: '' }), 4000)
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (setProfile) {
      setProfile({ ...profile, ...formData })
    }
    setMsg({ type: 'success', text: 'Admin profile updated successfully.' })
    setTimeout(() => setMsg({ type: '', text: '' }), 4000)
  }

  const handlePasswordSubmit = (e) => {
    e.preventDefault()
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMsg({ type: 'error', text: 'New passwords do not match.' })
      return
    }
    setMsg({ type: 'success', text: 'Admin password changed successfully.' })
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
    setTimeout(() => setMsg({ type: '', text: '' }), 4000)
  }

  return (
    <div className="tab-pane animate-fade-in-slide-up" style={{ maxWidth: '900px' }}>
      {msg.text && (
        <div style={{
          padding: '12px 18px',
          borderRadius: '12px',
          marginBottom: '20px',
          fontWeight: 600,
          fontSize: '13.5px',
          background: msg.type === 'error' ? '#fee2e2' : '#d1fae5',
          color: msg.type === 'error' ? '#dc2626' : '#059669',
          border: `1px solid ${msg.type === 'error' ? '#fecaca' : '#a7f3d0'}`
        }}>
          {msg.text}
        </div>
      )}

      {/* Profile Header Banner */}
      <div className="owner-card-box" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: '#ffffff',
            fontWeight: 800,
            fontSize: '24px',
            display: 'grid',
            placeItems: 'center',
            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
            overflow: 'hidden',
            flexShrink: 0
          }}>
            {profile?.photo || formData.photo ? (
              <img src={profile?.photo || formData.photo} alt="Admin" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              'SA'
            )}
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>{formData.fullName}</h2>
            <p style={{ margin: '4px 0 8px 0', color: '#64748b', fontSize: '13.5px' }}>{formData.email}</p>
            <span className="owner-pill available">
              {formData.role}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handlePhotoUpload}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              border: 'none',
              padding: '9px 16px',
              borderRadius: '10px',
              fontWeight: 600,
              fontSize: '13.5px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
              transition: 'all 0.2s ease'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
            {profile?.photo || formData.photo ? 'Change Photo' : 'Add Photo'}
          </button>

          {(profile?.photo || formData.photo) && (
            <button
              type="button"
              onClick={handleRemovePhoto}
              style={{
                background: '#fee2e2',
                color: '#dc2626',
                border: '1px solid #fecaca',
                padding: '9px 16px',
                borderRadius: '10px',
                fontWeight: 600,
                fontSize: '13.5px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
              Remove Photo
            </button>
          )}
        </div>
      </div>

      {/* Information Form */}
      <div className="owner-card-box" style={{ marginBottom: '24px' }}>
        <div className="owner-card-header">
          <h3>Administrator Details</h3>
          <p>Update your personal and administrative contact details.</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '18px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Full Name</label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '14px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '14px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Phone Number</label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '14px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Office Location</label>
            <input
              type="text"
              name="office"
              value={formData.office}
              onChange={handleChange}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '14px' }}
            />
          </div>

          <div style={{ gridColumn: 'span 2', marginTop: '6px' }}>
            <button type="submit" className="btn-purple-primary" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)' }}>
              Save Admin Profile
            </button>
          </div>
        </form>
      </div>

      {/* Password Security Form */}
      <div className="owner-card-box">
        <div className="owner-card-header">
          <h3>Security &amp; Password</h3>
          <p>Ensure your account remains secure by updating your password regularly.</p>
        </div>

        <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '420px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Current Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                placeholder="••••••••"
                required
                style={{ width: '100%', padding: '10px 42px 10px 14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '14px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', opacity: 0.6 }}
              >
                <Icon name={showPassword ? 'eye-off' : 'eye'} width="18" height="18" />
              </button>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>New Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                placeholder="••••••••"
                required
                style={{ width: '100%', padding: '10px 42px 10px 14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '14px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', opacity: 0.6 }}
              >
                <Icon name={showPassword ? 'eye-off' : 'eye'} width="18" height="18" />
              </button>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Confirm New Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                placeholder="••••••••"
                required
                style={{ width: '100%', padding: '10px 42px 10px 14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '14px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', opacity: 0.6 }}
              >
                <Icon name={showPassword ? 'eye-off' : 'eye'} width="18" height="18" />
              </button>
            </div>
          </div>

          <div style={{ marginTop: '6px' }}>
            <button type="submit" className="owner-refresh-btn" style={{ background: '#f1f5f9' }}>
              Update Password
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
