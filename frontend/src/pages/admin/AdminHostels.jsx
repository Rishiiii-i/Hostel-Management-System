import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

export default function AdminHostels() {
  const [hostels, setHostels] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [hostelForm, setHostelForm] = useState({
    name: '',
    block: 'Block A',
    totalFloors: 4,
    roomsPerFloor: 20,
    roomCapacity: 4,
    fee: 45000,
    type: 'Boys',
    description: ''
  })
  const [roomsCountPreview, setRoomsCountPreview] = useState(80)

  const resetForm = () => {
    setHostelForm({
      name: '',
      block: 'Block A',
      totalFloors: 4,
      roomsPerFloor: 20,
      roomCapacity: 4,
      fee: 45000,
      type: 'Boys',
      description: ''
    })
    setRoomsCountPreview(80)
  }

  // Handle inputs to update room preview
  const handleInputChange = (field, val) => {
    const updated = { ...hostelForm, [field]: val }
    setHostelForm(updated)
    
    if (field === 'totalFloors' || field === 'roomsPerFloor') {
      const floors = Number(field === 'totalFloors' ? val : hostelForm.totalFloors) || 0
      const rooms = Number(field === 'roomsPerFloor' ? val : hostelForm.roomsPerFloor) || 0
      setRoomsCountPreview(floors * rooms)
    }
  }

  const fetchWithAuth = async (url, options = {}) => {
    const token = localStorage.getItem('token')
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers
    }
    return fetch(url, { ...options, headers })
  }

  const loadHostels = async () => {
    setLoading(true)
    try {
      const res = await fetchWithAuth('http://localhost:5000/api/admin/hostels')
      if (res.ok) {
        const data = await res.json()
        setHostels(data)
      }
    } catch (err) {
      console.error('Failed to load hostels:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadHostels()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!hostelForm.name || !hostelForm.block) {
      alert('Hostel name and block are required')
      return
    }

    try {
      const res = await fetchWithAuth('http://localhost:5000/api/admin/hostels', {
        method: 'POST',
        body: JSON.stringify(hostelForm)
      })

      if (res.ok) {
        window.dispatchEvent(new CustomEvent('shm:new_notification', {
          detail: {
            notification: {
              title: 'Hostel Created',
              body: `Hostel ${hostelForm.name} registered. ${roomsCountPreview} rooms configured.`
            },
            data: { type: 'hostel', targetScreen: 'profile', targetHash: '#admin-dashboard' }
          }
        }))
        setShowAddModal(false)
        resetForm()
        loadHostels()
      } else {
        const errData = await res.json()
        alert(errData.message || 'Failed to register hostel.')
      }
    } catch (err) {
      console.error('Error adding hostel:', err)
    }
  }

  const handleDeleteHostel = async (hostel) => {
    const confirm = window.confirm(`Are you sure you want to delete ${hostel.name}? This will delete all ${hostel.totalFloors * hostel.roomsPerFloor} associated rooms and deallocate any occupants!`)
    if (!confirm) return

    try {
      const res = await fetchWithAuth(`http://localhost:5000/api/admin/hostels/${hostel.id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        window.dispatchEvent(new CustomEvent('shm:new_notification', {
          detail: {
            notification: {
              title: 'Hostel Deleted',
              body: `Hostel ${hostel.name} has been deleted.`
            },
            data: { type: 'hostel', targetScreen: 'profile', targetHash: '#admin-dashboard' }
          }
        }))
        loadHostels()
      } else {
        const errData = await res.json()
        alert(errData.message || 'Failed to delete hostel.')
      }
    } catch (err) {
      console.error('Error deleting hostel:', err)
    }
  }

  return (
    <div style={{ padding: '24px', boxSizing: 'border-box', minHeight: 'calc(100vh - 80px)', background: '#f8fafc' }}>
      
      {/* Header Panel */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '28px',
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        padding: '24px 32px',
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(15, 23, 42, 0.08)',
        color: '#ffffff'
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 700, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🏢 Hostel Registration
          </h2>
          <p style={{ margin: '6px 0 0 0', opacity: 0.8, fontSize: '14px' }}>
            Configure and register physical hostel blocks and automatically generate their floor rooms.
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setShowAddModal(true); }}
          style={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: '#ffffff',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'none'}
        >
          ➕ Add New Hostel
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
          <div style={{ width: '32px', height: '32px', border: '3px solid rgba(16,185,129,0.1)', borderTopColor: '#10b981', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      ) : hostels.length === 0 ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#ffffff',
          borderRadius: '16px',
          padding: '60px 24px',
          textAlign: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          border: '1px dashed #cbd5e1'
        }}>
          <span style={{ fontSize: '48px', marginBottom: '16px' }}>🏨</span>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 600, color: '#1e293b' }}>No Hostels Registered Yet</h3>
          <p style={{ margin: '0 0 20px 0', color: '#64748b', fontSize: '14px', maxWidth: '380px' }}>
            Get started by registering your first hostel block. The system will automatically configure and seed the floor rooms based on your layout.
          </p>
          <button
            onClick={() => { resetForm(); setShowAddModal(true); }}
            style={{
              background: '#0f172a',
              color: '#ffffff',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '8px',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            Create First Hostel
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
          {hostels.map((hostel) => (
            <div key={hostel.id} style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)',
              border: '1px solid #f1f5f9',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)'
              e.currentTarget.style.boxShadow = '0 12px 20px -8px rgba(0,0,0,0.1)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'none'
              e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.05)'
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 700,
                      background: hostel.type === 'Boys' ? '#dbeafe' : hostel.type === 'Girls' ? '#fce7f3' : '#fef9c3',
                      color: hostel.type === 'Boys' ? '#1e40af' : hostel.type === 'Girls' ? '#9d174d' : '#854d0e',
                      textTransform: 'uppercase',
                      marginBottom: '8px'
                    }}>
                      {hostel.type} Hostel
                    </span>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>{hostel.name}</h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b', fontWeight: 500 }}>
                      Block Code: <strong style={{ color: '#0f172a' }}>{hostel.block}</strong>
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteHostel(hostel)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '16px',
                      color: '#94a3b8',
                      padding: '4px',
                      borderRadius: '6px',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.color = '#ef4444'}
                    onMouseOut={(e) => e.currentTarget.style.color = '#94a3b8'}
                    title="Delete Hostel"
                  >
                    🗑️
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', margin: '20px 0', padding: '16px', borderRadius: '12px', background: '#f8fafc' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>Floors</div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b', marginTop: '2px' }}>{hostel.totalFloors}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>Rooms / Floor</div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b', marginTop: '2px' }}>{hostel.roomsPerFloor}</div>
                  </div>
                  <div style={{ marginTop: '8px' }}>
                    <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>Room Capacity</div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b', marginTop: '2px' }}>{hostel.roomCapacity} Bed(s)</div>
                  </div>
                  <div style={{ marginTop: '8px' }}>
                    <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>Total Rooms</div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b', marginTop: '2px' }}>{hostel.totalFloors * hostel.roomsPerFloor}</div>
                  </div>
                </div>

                {hostel.description && (
                  <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 20px 0', lineHeight: 1.5 }}>
                    {hostel.description}
                  </p>
                )}
              </div>

              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '16px', marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>Allocation Fee</span>
                <span style={{ fontSize: '18px', fontWeight: 800, color: '#10b981' }}>₹{hostel.fee.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Hostel Modal */}
      {showAddModal && createPortal(
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '520px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid #f1f5f9',
            overflow: 'hidden',
            animation: 'modalSlide 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
          }}>
            
            {/* Modal Header */}
            <div style={{
              background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
              padding: '24px 28px',
              color: '#ffffff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Add New Hostel Block</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', opacity: 0.8 }}>Define parameters to generate rooms instantly.</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', color: '#ffffff', fontSize: '20px', cursor: 'pointer', opacity: 0.7 }}
                onMouseOver={(e) => e.currentTarget.style.opacity = '1'}
                onMouseOut={(e) => e.currentTarget.style.opacity = '0.7'}
              >
                ✕
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSubmit} style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Hostel Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Himalaya Boys"
                    value={hostelForm.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Block (Unique ID)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Block C"
                    value={hostelForm.block}
                    onChange={(e) => handleInputChange('block', e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Hostel Type</label>
                  <select
                    value={hostelForm.type}
                    onChange={(e) => handleInputChange('type', e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', background: 'white' }}
                  >
                    <option value="Boys">Boys</option>
                    <option value="Girls">Girls</option>
                    <option value="Co-ed">Co-ed</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Allocation Fee (₹)</label>
                  <input
                    type="number"
                    required
                    value={hostelForm.fee}
                    onChange={(e) => handleInputChange('fee', Number(e.target.value))}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', padding: '16px', background: '#f8fafc', borderRadius: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '6px' }}>Total Floors</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={hostelForm.totalFloors}
                    onChange={(e) => handleInputChange('totalFloors', Number(e.target.value))}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '6px' }}>Rooms/Floor</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={hostelForm.roomsPerFloor}
                    onChange={(e) => handleInputChange('roomsPerFloor', Number(e.target.value))}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '6px' }}>Room Capacity</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={hostelForm.roomCapacity}
                    onChange={(e) => handleInputChange('roomCapacity', Number(e.target.value))}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ background: '#ecfdf5', color: '#065f46', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, display: 'flex', justifyContent: 'space-between' }}>
                <span>📊 Auto-Generation Preview:</span>
                <strong>{roomsCountPreview} Rooms / {roomsCountPreview * hostelForm.roomCapacity} Total Beds</strong>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Description / Location</label>
                <textarea
                  placeholder="e.g. Near Main Gate, North Campus"
                  rows="2"
                  value={hostelForm.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', resize: 'none', fontFamily: 'inherit' }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#475569', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#ffffff', fontWeight: 600, cursor: 'pointer' }}
                >
                  Confirm & Seed Rooms
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      <style>{`
        @keyframes modalSlide {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  )
}
