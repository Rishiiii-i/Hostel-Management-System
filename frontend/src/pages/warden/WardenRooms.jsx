import { useState, useEffect } from 'react'

export default function WardenRooms() {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showAllocateModal, setShowAllocateModal] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState(null)
  
  const [newRoom, setNewRoom] = useState({
    roomNo: '',
    block: 'Block A',
    capacity: 2
  })
  
  const [occupantEmail, setOccupantEmail] = useState('')

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

  const loadRoomsData = async () => {
    setLoading(true)
    try {
      const res = await fetchWithAuth('http://localhost:5000/api/warden/rooms')
      if (res.ok) {
        const data = await res.json()
        setRooms(data)
      }
    } catch (err) {
      console.error('Failed to load rooms:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRoomsData()
  }, [])

  const handleAddRoom = async (e) => {
    e.preventDefault()
    if (!newRoom.roomNo) return

    try {
      const res = await fetchWithAuth('http://localhost:5000/api/warden/rooms', {
        method: 'POST',
        body: JSON.stringify(newRoom)
      })
      if (res.ok) {
        alert('Room successfully added');
        setNewRoom({ roomNo: '', block: 'Block A', capacity: 2 })
        setShowAddModal(false)
        loadRoomsData()
      } else {
        const errData = await res.json();
        alert(errData.message || 'Failed to add room.');
      }
    } catch (err) {
      console.error('Failed to add room:', err)
    }
  }

  const handleAllocateClick = (room) => {
    setSelectedRoom(room)
    setOccupantEmail('')
    setShowAllocateModal(true)
  }

  const handleAllocateSubmit = async (e) => {
    e.preventDefault()
    if (!occupantEmail || !selectedRoom) return

    try {
      const res = await fetchWithAuth('http://localhost:5000/api/warden/rooms/allocate', {
        method: 'POST',
        body: JSON.stringify({
          roomId: selectedRoom.id,
          occupantEmail: occupantEmail,
          status: 'Occupied'
        })
      })
      if (res.ok) {
        alert('Room successfully allocated');
        setShowAllocateModal(false)
        setSelectedRoom(null)
        setOccupantEmail('')
        loadRoomsData()
      } else {
        const errData = await res.json();
        alert(errData.message || 'Failed to allocate room.');
      }
    } catch (err) {
      console.error('Failed to allocate room:', err)
    }
  }

  const handleDeallocate = async (room) => {
    const confirm = window.confirm(`Are you sure you want to deallocate occupant from room ${room.roomNo}?`)
    if (!confirm) return

    try {
      const res = await fetchWithAuth('http://localhost:5000/api/warden/rooms/allocate', {
        method: 'POST',
        body: JSON.stringify({
          roomId: room.id,
          occupantEmail: '',
          status: 'Vacant'
        })
      })
      if (res.ok) {
        alert('Room successfully deallocated');
        loadRoomsData()
      } else {
        alert('Failed to deallocate room.')
      }
    } catch (err) {
      console.error('Failed to deallocate room:', err)
    }
  }

  const handleToggleFee = async (email) => {
    if (!email) return;
    try {
      const res = await fetchWithAuth(`http://localhost:5000/api/warden/students/${email}/toggle-fee`, {
        method: 'POST'
      });
      if (res.ok) {
        const data = await res.json();
        alert(data.message);
        loadRoomsData();
      } else {
        const errData = await res.json();
        alert(errData.message || 'Failed to toggle fee status.');
      }
    } catch (err) {
      console.error('Failed to toggle fee status:', err);
    }
  };

  return (
    <div className="tab-pane animate-fade-in-slide-up">
      {/* Header Bar */}
      <div className="owner-card-box" style={{ padding: '20px 24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ margin: 0, font: '800 18px "Manrope", sans-serif', color: '#0f172a' }}>Hostel Room Management</h3>
            <span style={{ fontSize: '13px', color: '#64748b' }}>{rooms.length} total rooms configured</span>
          </div>
          <button
            type="button"
            className="btn-purple-primary"
            onClick={() => setShowAddModal(true)}
          >
            + Add Room
          </button>
        </div>
      </div>

      {/* Rooms Table Container */}
      <div className="dash-card">
        {loading ? (
          <div style={{ padding: '40px 0', textAlign: 'center', fontWeight: 600, color: '#557162' }}>
            Loading rooms data...
          </div>
        ) : rooms.length === 0 ? (
          <p className="empty-state-text" style={{ padding: '30px 0', textAlign: 'center', margin: 0 }}>
            No rooms configured yet. Click "+ Add Room" to create one.
          </p>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Room No</th>
                  <th>Block</th>
                  <th>Capacity</th>
                  <th>Occupant (Email)</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map((r) => (
                  <tr key={r.id}>
                    <td><strong>{r.roomNo}</strong></td>
                    <td><strong>{r.block}</strong></td>
                    <td>{r.capacity} Beds</td>
                    <td>
                      {r.occupantName ? (
                        <div>
                          <strong>{r.occupantName}</strong>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>{r.occupantEmail}</div>
                          <div style={{ 
                            marginTop: '8px', 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: '8px',
                            background: '#f8fafc',
                            padding: '4px 8px',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0'
                          }}>
                            <span style={{ 
                              fontSize: '10px', 
                              fontWeight: 800, 
                              color: r.occupantFeeStatus === 'Paid' ? '#10b981' : '#d97706',
                              background: r.occupantFeeStatus === 'Paid' ? '#d1fae5' : '#fef3c7',
                              padding: '2px 8px',
                              borderRadius: '5px',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px'
                            }}>
                              {r.occupantFeeStatus === 'Paid' ? 'Paid' : 'Unpaid'}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleToggleFee(r.occupantEmail)}
                              style={{
                                background: '#ffffff',
                                border: '1px solid #cbd5e1',
                                color: '#475569',
                                fontSize: '11px',
                                fontWeight: 700,
                                padding: '2px 8px',
                                borderRadius: '5px',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease-in-out',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#f1f5f9';
                                e.currentTarget.style.borderColor = '#94a3b8';
                                e.currentTarget.style.color = '#1e293b';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#ffffff';
                                e.currentTarget.style.borderColor = '#cbd5e1';
                                e.currentTarget.style.color = '#475569';
                              }}
                            >
                              Update Status
                            </button>
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>None</span>
                      )}
                    </td>
                    <td>
                      <span className={`status-badge ${r.status.toLowerCase()}`}>
                        {r.status}
                      </span>
                    </td>
                    <td>
                      {r.status === 'Vacant' ? (
                        <button
                          type="button"
                          className="btn-pay-fee"
                          style={{ padding: '6px 12px', fontSize: '12px', background: '#3b82f6', border: 'none' }}
                          onClick={() => handleAllocateClick(r)}
                        >
                          Allocate
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="owner-action-btn delete"
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                          onClick={() => handleDeallocate(r)}
                        >
                          Deallocate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Room Modal */}
      {showAddModal && (
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
          <div className="owner-card-box" style={{ maxWidth: '400px', width: '100%', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, font: '800 18px "Manrope", sans-serif' }}>Add New Room</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#64748b' }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddRoom} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Room Number</label>
                <input
                  type="text"
                  placeholder="Enter the room number"
                  value={newRoom.roomNo}
                  onChange={(e) => setNewRoom({ ...newRoom, roomNo: e.target.value })}
                  required
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Block</label>
                <select
                  value={newRoom.block}
                  onChange={(e) => setNewRoom({ ...newRoom, block: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '14px', boxSizing: 'border-box' }}
                >
                  <option value="Block A">Block A</option>
                  <option value="Block B">Block B</option>
                  <option value="Block C">Block C</option>
                  <option value="Block F">Block F</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Capacity (Beds)</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={newRoom.capacity}
                  onChange={(e) => setNewRoom({ ...newRoom, capacity: parseInt(e.target.value) || 2 })}
                  required
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
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
                  Create Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Allocate Occupant Modal */}
      {showAllocateModal && (
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
          <div className="owner-card-box" style={{ maxWidth: '400px', width: '100%', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, font: '800 18px "Manrope", sans-serif' }}>Allocate Room {selectedRoom?.roomNo}</h3>
              <button
                type="button"
                onClick={() => setShowAllocateModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#64748b' }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAllocateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Registered Mail ID</label>
                <input
                  type="email"
                  placeholder="Enter the registered mail ID"
                  value={occupantEmail}
                  onChange={(e) => setOccupantEmail(e.target.value)}
                  required
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  className="owner-refresh-btn"
                  onClick={() => setShowAllocateModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-purple-primary"
                >
                  Allocate Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
