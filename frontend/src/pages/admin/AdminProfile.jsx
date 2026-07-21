import { useState } from 'react'
import Icon from '../../components/Icon'

export default function AdminProfile({ profile, setProfile }) {
  const [formData, setFormData] = useState({
    fullName: profile?.fullName || 'System Administrator',
    email: profile?.email || 'admin@smarthostel.com',
    phone: profile?.phone || '+91 9876543210',
    office: profile?.office || 'Central Admin Block, Room 101',
    role: 'System Administrator'
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const [showPassword, setShowPassword] = useState(false)
  const [msg, setMsg] = useState({ type: '', text: '' })

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
      <div className="owner-card-box" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
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
          boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)'
        }}>
          SA
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>{formData.fullName}</h2>
          <p style={{ margin: '4px 0 8px 0', color: '#64748b', fontSize: '13.5px' }}>{formData.email}</p>
          <span className="owner-pill available">
            {formData.role}
          </span>
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
