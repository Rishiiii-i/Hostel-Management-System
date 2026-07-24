import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

export default function AdminRooms() {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false)
  const [showAllocateModal, setShowAllocateModal] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState(null)
  
  // Form states
  const [roomForm, setRoomForm] = useState({
    roomNo: '',
    block: 'Block A',
    capacity: 2,
    type: '2-Sharing Non-AC',
    floor: '1st Floor'
  })
  
  const [occupantEmail, setOccupantEmail] = useState('')
  const [students, setStudents] = useState([])

  const resetRoomForm = () => {
    setRoomForm({
      roomNo: '',
      block: 'Block A',
      capacity: 2,
      type: '2-Sharing Non-AC',
      floor: '1st Floor'
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

  const loadRooms = async () => {
    setLoading(true)
    try {
      const res = await fetchWithAuth('http://localhost:5000/api/admin/rooms')
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

  const loadStudents = async () => {
    try {
      const res = await fetchWithAuth('http://localhost:5000/api/admin/students')
      if (res.ok) {
        const data = await res.json()
        setStudents(data)
      }
    } catch (err) {
      console.error('Failed to load students:', err)
    }
  }

  useEffect(() => {
    loadRooms()
    loadStudents()
  }, [])

  const handleAddRoomSubmit = async (e) => {
    e.preventDefault()
    try {
      const res = await fetchWithAuth('http://localhost:5000/api/admin/rooms', {
        method: 'POST',
        body: JSON.stringify(roomForm)
      })
      if (res.ok) {
        window.dispatchEvent(new CustomEvent('shm:new_notification', {
          detail: {
            notification: {
              title: 'Room Configured',
              body: `Room ${roomForm.roomNo} in ${roomForm.block} configured.`
            },
            data: { type: 'room', targetScreen: 'profile', targetHash: '#admin-dashboard' }
          }
        }));
        setShowAddModal(false)
        resetRoomForm()
        loadRooms()
      } else {
        const errData = await res.json()
        alert(errData.message || 'Failed to configure room.')
      }
    } catch (err) {
      console.error('Error adding room:', err)
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
      const res = await fetchWithAuth('http://localhost:5000/api/admin/rooms/allocate', {
        method: 'POST',
        body: JSON.stringify({
          roomId: selectedRoom.id,
          occupantEmail: occupantEmail,
          status: 'Occupied'
        })
      })
      if (res.ok) {
        window.dispatchEvent(new CustomEvent('shm:new_notification', {
          detail: {
            notification: {
              title: 'Student Allocated',
              body: `Student ${occupantEmail} allocated to Room ${selectedRoom.roomNo}.`
            },
            data: { type: 'room', targetScreen: 'profile', targetHash: '#admin-dashboard' }
          }
        }));
        setShowAllocateModal(false)
        setSelectedRoom(null)
        setOccupantEmail('')
        loadRooms()
      } else {
        const errData = await res.json()
        alert(errData.message || 'Failed to allocate student.')
      }
    } catch (err) {
      console.error('Error allocating room:', err)
    }
  }

  const handleDeallocate = async (room) => {
    const confirm = window.confirm(`Are you sure you want to deallocate the occupant from Room ${room.roomNo}?`)
    if (!confirm) return

    try {
      const res = await fetchWithAuth('http://localhost:5000/api/admin/rooms/allocate', {
        method: 'POST',
        body: JSON.stringify({
          roomId: room.id,
          occupantEmail: '',
          status: 'Vacant'
        })
      })
      if (res.ok) {
        window.dispatchEvent(new CustomEvent('shm:new_notification', {
          detail: {
            notification: {
              title: 'Room Deallocated',
              body: `Occupant deallocated from Room ${room.roomNo}.`
            },
            data: { type: 'room', targetScreen: 'profile', targetHash: '#admin-dashboard' }
          }
        }));
        loadRooms()
      } else {
        alert('Failed to deallocate room.')
      }
    } catch (err) {
      console.error('Error deallocating room:', err)
    }
  }

  const handleDeleteRoom = async (room) => {
    const confirm = window.confirm(`Are you sure you want to delete Room ${room.roomNo} configuration?`)
    if (!confirm) return

    try {
      const res = await fetchWithAuth(`http://localhost:5000/api/admin/rooms/${room.id}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        alert('Room configuration deleted')
        loadRooms()
      } else {
        alert('Failed to delete room.')
      }
    } catch (err) {
      console.error('Error deleting room:', err)
    }
  }

  return (
    <div className="tab-pane animate-fade-in-slide-up">
      {/* Header Bar */}
      <div className="owner-card-box" style={{ padding: '20px 24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ margin: 0, font: '800 18px "Manrope", sans-serif', color: '#0f172a' }}>Hostel Room Management</h3>
            <span style={{ fontSize: '13px', color: '#64748b' }}>{rooms.length} total rooms configured</span>
          </div>
          <button
            type="button"
            className="btn-purple-primary"
            onClick={() => { resetRoomForm(); setShowAddModal(true); }}
          >
            + Add Room
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="owner-table-wrapper">
        {loading ? (
          <p className="empty-state-text" style={{ padding: '36px 0', textAlign: 'center', margin: 0, fontWeight: 600 }}>Loading rooms list...</p>
        ) : rooms.length === 0 ? (
          <p className="empty-state-text" style={{ padding: '36px 0', textAlign: 'center', margin: 0 }}>No hostel rooms configured yet.</p>
        ) : (
          <table className="owner-table">
            <thead>
              <tr>
                <th>Room No</th>
                <th>Block &amp; Floor</th>
                <th>Room Type</th>
                <th>Capacity</th>
                <th>Occupant Details</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((r) => (
                <tr key={r.id}>
                  <td><strong>{r.roomNo}</strong></td>
                  <td><strong>{r.block}</strong> <div style={{ fontSize: '12px', color: '#64748b' }}>{r.floor || '1st Floor'}</div></td>
                  <td>{r.type || '2-Sharing'}</td>
                  <td>{r.capacity} Beds</td>
                  <td>
                    {r.occupantName ? (
                      <div>
                        <strong>{r.occupantName}</strong>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>{r.occupantEmail}</div>
                      </div>
                    ) : (
                      <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Vacant</span>
                    )}
                  </td>
                  <td>
                    <span className={`owner-pill ${r.status.toLowerCase() === 'occupied' ? 'partial' : 'available'}`}>
                      {r.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {r.status === 'Vacant' ? (
                        <button
                          type="button"
                          className="owner-action-btn"
                          style={{ border: '1px solid #3b82f6', color: '#3b82f6', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                          onClick={() => handleAllocateClick(r)}
                        >
                          Allocate
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="owner-action-btn delete"
                          style={{ padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                          onClick={() => handleDeallocate(r)}
                        >
                          Deallocate
                        </button>
                      )}
                      <button
                        type="button"
                        className="owner-action-btn delete"
                        title="Delete Room"
                        onClick={() => handleDeleteRoom(r)}
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

      {/* Add Room Modal */}
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

            <form onSubmit={handleAddRoomSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Room Number</label>
                <input
                  type="text"
                  required
                  placeholder="enter room number"
                  value={roomForm.roomNo}
                  onChange={(e) => setRoomForm({ ...roomForm, roomNo: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Hostel Block</label>
                <select
                  value={roomForm.block}
                  onChange={(e) => setRoomForm({ ...roomForm, block: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '14px', boxSizing: 'border-box' }}
                >
                  <option value="Block A">Block A</option>
                  <option value="Block B">Block B</option>
                  <option value="Block C">Block C</option>
                  <option value="Block F">Block F</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Floor Location</label>
                <select
                  value={roomForm.floor}
                  onChange={(e) => setRoomForm({ ...roomForm, floor: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '14px', boxSizing: 'border-box' }}
                >
                  <option value="Ground Floor">Ground Floor</option>
                  <option value="1st Floor">1st Floor</option>
                  <option value="2nd Floor">2nd Floor</option>
                  <option value="3rd Floor">3rd Floor</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Room Type</label>
                <select
                  value={roomForm.type}
                  onChange={(e) => setRoomForm({ ...roomForm, type: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '14px', boxSizing: 'border-box' }}
                >
                  <option value="2-Sharing AC">2-Sharing AC</option>
                  <option value="2-Sharing Non-AC">2-Sharing Non-AC</option>
                  <option value="3-Sharing Non-AC">3-Sharing Non-AC</option>
                  <option value="Single Room AC">Single Room AC</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Beds Capacity</label>
                <input
                  type="number"
                  min="1"
                  max="4"
                  value={roomForm.capacity}
                  onChange={(e) => setRoomForm({ ...roomForm, capacity: Number(e.target.value) || 2 })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
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
                  Configure Room
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Allocate Occupant Modal */}
      {showAllocateModal && createPortal(
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
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Registered Student Email</label>
                <select
                  required
                  value={occupantEmail}
                  onChange={(e) => setOccupantEmail(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '14px', boxSizing: 'border-box', color: occupantEmail ? '#0f172a' : '#94a3b8' }}
                >
                  <option value="" disabled style={{ color: '#94a3b8' }}>enter mail id</option>
                  {students.map(s => (
                    <option key={s._id || s.email} value={s.email} style={{ color: '#0f172a' }}>
                      {s.email} ({s.name})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
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
        </div>,
        document.body
      )}
    </div>
  )
}
