import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function WardenRooms() {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showAllocateModal, setShowAllocateModal] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState(null)
  
  const [newRoom, setNewRoom] = useState({
    roomNo: '',
    block: 'Block A',
    capacity: 2,
    type: '2-Sharing Non-AC',
    floor: '1st Floor'
  })
  
  const [occupantEmail, setOccupantEmail] = useState('')
  const [students, setStudents] = useState([])
  const [allocationStep, setAllocationStep] = useState('details') // 'details', 'pay', 'otp', 'success'
  const [paymentMethod, setPaymentMethod] = useState('card')
  const [cardDetails, setCardDetails] = useState({ number: '', expiry: '', cvv: '', name: '' })
  const [upiId, setUpiId] = useState('')
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [showRazorpaySimulator, setShowRazorpaySimulator] = useState(false)
  const [simulatorMethod, setSimulatorMethod] = useState('upi')
  const [simCardNumber, setSimCardNumber] = useState('')
  const [simCardExpiry, setSimCardExpiry] = useState('')
  const [simCardCvv, setSimCardCvv] = useState('')
  const [simUpiAddress, setSimUpiAddress] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [receiptData, setReceiptData] = useState(null)
  const [cardFlip, setCardFlip] = useState(false)

  // helper for requests with auth token
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

  const loadStudentsData = async () => {
    try {
      const res = await fetchWithAuth('http://localhost:5000/api/warden/students')
      if (res.ok) {
        const data = await res.json()
        setStudents(data)
      }
    } catch (err) {
      console.error('Failed to load students:', err)
    }
  }

  useEffect(() => {
    loadRoomsData()
    loadStudentsData()
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
        window.dispatchEvent(new CustomEvent('shm:new_notification', {
          detail: {
            notification: {
              title: 'Room Added',
              body: `Room ${newRoom.roomNo} in ${newRoom.block} added.`
            },
            data: { type: 'room', targetScreen: 'profile', targetHash: '#warden-dashboard' }
          }
        }));
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
    setAllocationStep('details')
    setOtpCode('')
    setReceiptData(null)
    setCardFlip(false)
    setShowAllocateModal(true)
  }

  const handleSimulatorSuccess = async () => {
    const paymentId = `pay_sim_${Math.floor(100000 + Math.random() * 900000)}`
    setIsProcessingPayment(true)
    setShowRazorpaySimulator(false)
    try {
      const res = await fetchWithAuth('http://localhost:5000/api/warden/rooms/allocate', {
        method: 'POST',
        body: JSON.stringify({
          roomId: selectedRoom.id,
          occupantEmail: occupantEmail,
          status: 'Occupied',
          paymentId: paymentId
        })
      })
      if (res.ok) {
        const roomData = await res.json()
        
        const receipt = {
          id: paymentId,
          date: new Date().toISOString().split('T')[0],
          studentEmail: occupantEmail,
          period: 'Room Allocation Fee',
          amount: '₹45,000'
        }
        setReceiptData(receipt)

        window.dispatchEvent(new CustomEvent('shm:new_notification', {
          detail: {
            notification: {
              title: 'Room Allocated',
              body: `Room ${selectedRoom.roomNo} allocated to ${occupantEmail} after payment.`
            },
            data: { type: 'room', targetScreen: 'profile', targetHash: '#warden-dashboard' }
          }
        }))
        
        loadRoomsData()
        setAllocationStep('success')
      } else {
        const errData = await res.json()
        alert(errData.message || 'Failed to allocate room.')
        setAllocationStep('details')
      }
    } catch (err) {
      console.error('Failed to allocate room:', err)
      alert('Allocation verification request failed.')
      setAllocationStep('details')
    } finally {
      setIsProcessingPayment(false)
    }
  }

  const handleAllocateSubmit = async (e) => {
    if (e) e.preventDefault()
    if (!occupantEmail || !selectedRoom) return

    setIsProcessingPayment(true)
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
        window.dispatchEvent(new CustomEvent('shm:new_notification', {
          detail: {
            notification: {
              title: 'Room Assigned',
              body: `Room ${selectedRoom.roomNo} assigned to ${occupantEmail}.`
            },
            data: { type: 'room', targetScreen: 'profile', targetHash: '#warden-dashboard' }
          }
        }))
        
        loadRoomsData()
        setShowAllocateModal(false)
        setOccupantEmail('')
        alert('Room assigned successfully! The student can now pay the allocation fee from their student dashboard to confirm.')
      } else {
        const errData = await res.json()
        alert(errData.message || 'Failed to allocate room.')
      }
    } catch (err) {
      console.error('Failed to allocate room:', err)
      alert('Failed to allocate room.')
    } finally {
      setIsProcessingPayment(false)
    }
  }

  const handleDeallocate = async (room) => {
    const confirm = window.confirm(`Are you sure you want to deallocate ALL occupants from room ${room.roomNo}?`)
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
        window.dispatchEvent(new CustomEvent('shm:new_notification', {
          detail: {
            notification: {
              title: 'Room Deallocated',
              body: `All occupants deallocated from Room ${room.roomNo}.`
            },
            data: { type: 'room', targetScreen: 'profile', targetHash: '#warden-dashboard' }
          }
        }));
        loadRoomsData()
      } else {
        alert('Failed to deallocate room.')
      }
    } catch (err) {
      console.error('Failed to deallocate room:', err)
    }
  }

  const handleDeallocateSpecific = async (room, occupantEmail) => {
    const confirm = window.confirm(`Are you sure you want to deallocate ${occupantEmail} from room ${room.roomNo}?`)
    if (!confirm) return

    try {
      const res = await fetchWithAuth('http://localhost:5000/api/warden/rooms/allocate', {
        method: 'POST',
        body: JSON.stringify({
          roomId: room.id,
          occupantEmail: occupantEmail,
          status: 'Vacant'
        })
      })
      if (res.ok) {
        window.dispatchEvent(new CustomEvent('shm:new_notification', {
          detail: {
            notification: {
              title: 'Room Deallocated',
              body: `Occupant ${occupantEmail} deallocated from Room ${room.roomNo}.`
            },
            data: { type: 'room', targetScreen: 'profile', targetHash: '#warden-dashboard' }
          }
        }));
        loadRoomsData()
      } else {
        alert('Failed to deallocate occupant.')
      }
    } catch (err) {
      console.error('Failed to deallocate occupant:', err)
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
      {/* header bar */}
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

      {/* rooms table container */}
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
                      {r.occupants && r.occupants.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {r.occupants.map((occ, idx) => (
                            <div key={idx} style={{ 
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              background: '#f8fafc',
                              padding: '8px 12px',
                              borderRadius: '8px',
                              border: '1px solid #e2e8f0',
                              gap: '12px'
                            }}>
                              <div>
                                <strong style={{ display: 'block', fontSize: '13px', color: '#1e293b' }}>{occ.name}</strong>
                                <span style={{ display: 'block', fontSize: '11px', color: '#64748b', wordBreak: 'break-all' }}>{occ.email}</span>
                                
                                {/* Individual Fee Status */}
                                <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{ 
                                    fontSize: '9px', 
                                    fontWeight: 800, 
                                    color: occ.feeStatus === 'Paid' ? '#10b981' : '#d97706',
                                    background: occ.feeStatus === 'Paid' ? '#d1fae5' : '#fef3c7',
                                    padding: '1px 6px',
                                    borderRadius: '4px',
                                    textTransform: 'uppercase'
                                  }}>
                                    {occ.feeStatus || 'Unpaid'}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleToggleFee(occ.email)}
                                    style={{
                                      background: '#ffffff',
                                      border: '1px solid #cbd5e1',
                                      color: '#475569',
                                      fontSize: '9px',
                                      fontWeight: 700,
                                      padding: '1px 6px',
                                      borderRadius: '4px',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    Toggle Fee
                                  </button>
                                </div>
                              </div>
                              
                              <button
                                type="button"
                                onClick={() => handleDeallocateSpecific(r, occ.email)}
                                style={{
                                  background: '#fee2e2',
                                  border: 'none',
                                  color: '#ef4444',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  padding: '4px 8px',
                                  borderRadius: '6px',
                                  transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = '#fca5a5';
                                  e.currentTarget.style.color = '#b91c1c';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = '#fee2e2';
                                  e.currentTarget.style.color = '#ef4444';
                                }}
                              >
                                Deallocate
                              </button>
                            </div>
                          ))}
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
                      {(!r.occupants || r.occupants.length < r.capacity) ? (
                        <button
                          type="button"
                          className="btn-pay-fee"
                          style={{ padding: '6px 12px', fontSize: '12px', background: '#3b82f6', border: 'none' }}
                          onClick={() => handleAllocateClick(r)}
                        >
                          Allocate
                        </button>
                      ) : (
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', background: '#e2e8f0', padding: '4px 8px', borderRadius: '6px' }}>
                          Room Full
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* add room modal */}
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

            <form onSubmit={handleAddRoom} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Room Number</label>
                <input
                  type="text"
                  placeholder="enter room number"
                  value={newRoom.roomNo}
                  onChange={(e) => setNewRoom({ ...newRoom, roomNo: e.target.value })}
                  required
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Hostel Block</label>
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
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Floor Location</label>
                <select
                  value={newRoom.floor}
                  onChange={(e) => setNewRoom({ ...newRoom, floor: e.target.value })}
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
                  value={newRoom.type}
                  onChange={(e) => setNewRoom({ ...newRoom, type: e.target.value })}
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
                  max="10"
                  value={newRoom.capacity}
                  onChange={(e) => setNewRoom({ ...newRoom, capacity: parseInt(e.target.value) || 2 })}
                  required
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
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* allocate occupant modal */}
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
          <div className="owner-card-box" style={{ maxWidth: '520px', width: '100%', padding: '32px', borderRadius: '24px', background: '#ffffff', boxShadow: '0 20px 40px rgba(15,23,42,0.1)' }}>
            
            {/* modal header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                  Room Allocation & Payment
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                  Allocate Room {selectedRoom?.roomNo} ({selectedRoom?.block})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAllocateModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#94a3b8' }}
              >
                ✕
              </button>
            </div>            {isProcessingPayment ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0', gap: '20px' }}>
                <div style={{ width: '48px', height: '48px', border: '4px solid rgba(16, 185, 129, 0.1)', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin-loader 0.8s linear infinite' }}></div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontWeight: 700, color: '#1e293b', margin: 0, fontSize: '15px' }}>Assigning Room to Student...</p>
                  <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: '#64748b' }}>Please wait, securing database records.</p>
                </div>
                <style>{`
                  @keyframes spin-loader { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                `}</style>
              </div>
            ) : (
              <form onSubmit={handleAllocateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Select Student for Allocation</label>
                  <select
                    required
                    value={occupantEmail}
                    onChange={(e) => setOccupantEmail(e.target.value)}
                    style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#ffffff', fontSize: '14px', boxSizing: 'border-box', color: '#0f172a', outline: 'none' }}
                  >
                    <option value="" disabled>select student email</option>
                    {students.map(s => (
                      <option key={s._id || s.email} value={s.email}>
                        {s.email} ({s.name})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
                    <span style={{ color: '#64748b' }}>Room Capacity:</span>
                    <strong style={{ color: '#0f172a' }}>{selectedRoom?.capacity || 4} Bed(s)</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
                    <span style={{ color: '#64748b' }}>Current Occupants:</span>
                    <strong style={{ color: '#0f172a' }}>{(selectedRoom?.occupants || []).length} / {selectedRoom?.capacity || 4} occupied</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderTop: '1px solid #cbd5e1', paddingTop: '8px', marginTop: '8px' }}>
                    <span style={{ color: '#0f172a', fontWeight: 700 }}>Hostel Admission Fee:</span>
                    <strong style={{ color: '#10b981', fontSize: '15px' }}>₹45,000 (To be paid by Student)</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                  <button
                    type="button"
                    className="owner-refresh-btn"
                    onClick={() => setShowAllocateModal(false)}
                    style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', background: 'none', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-purple-primary"
                    style={{ flex: 1, padding: '12px', borderRadius: '10px', background: '#3b82f6', color: '#ffffff', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Assign Room
                  </button>
                </div>
              </form>
            )}
          </div>
          <style>{`
            @keyframes scan-line {
              0% { top: 0%; }
              50% { top: 100%; }
              100% { top: 0%; }
            }
          `}</style>
        </div>,
        document.body
      )}
      {showRazorpaySimulator && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ width: '100%', maxWidth: '380px', background: '#ffffff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 8px 30px rgba(0,0,0,0.2)', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
            
            {/* Header */}
            <div style={{ background: '#092444', color: '#ffffff', padding: '20px 24px', position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.1)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 'bold' }}>
                  H
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#ffffff' }}>Smart Hostel System</h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#94a3b8' }}>Room Allocation & Admission Fee</p>
                </div>
              </div>
              <div style={{ marginTop: '16px', fontSize: '20px', fontWeight: 700 }}>
                ₹45,000
              </div>
            </div>

            {/* Selector */}
            <div style={{ display: 'flex', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              {['upi', 'card', 'netbanking'].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setSimulatorMethod(m)}
                  style={{
                    flex: 1,
                    padding: '12px 6px',
                    border: 'none',
                    background: 'transparent',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: simulatorMethod === m ? '#2563eb' : '#64748b',
                    borderBottom: simulatorMethod === m ? '2px solid #2563eb' : '2px solid transparent',
                    cursor: 'pointer',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}
                >
                  {m === 'upi' ? 'UPI' : m === 'card' ? 'Card' : 'Net Banking'}
                </button>
              ))}
            </div>

            {/* Form Details */}
            <div style={{ padding: '24px 24px 16px 24px' }}>
              {simulatorMethod === 'upi' && (
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>UPI ID / VPA</label>
                  <input
                    type="text"
                    placeholder="e.g. success@razorpay"
                    value={simUpiAddress}
                    onChange={(e) => setSimUpiAddress(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '13px', outline: 'none' }}
                  />
                  <p style={{ margin: '8px 0 0 0', fontSize: '11px', color: '#64748b', fontStyle: 'italic' }}>
                    Tip: Enter any UPI ID to proceed.
                  </p>
                </div>
              )}

              {simulatorMethod === 'card' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Card Number</label>
                    <input
                      type="text"
                      maxLength="16"
                      placeholder="4381 2345 6789 1111"
                      value={simCardNumber}
                      onChange={(e) => setSimCardNumber(e.target.value.replace(/\D/g, ''))}
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '13px', outline: 'none' }}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Expiry</label>
                      <input
                        type="text"
                        maxLength="5"
                        placeholder="MM/YY"
                        value={simCardExpiry}
                        onChange={(e) => {
                          let val = e.target.value;
                          if (val.length === 2 && !val.includes('/')) val += '/';
                          setSimCardExpiry(val);
                        }}
                        style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '13px', outline: 'none' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>CVV</label>
                      <input
                        type="password"
                        maxLength="3"
                        placeholder="123"
                        value={simCardCvv}
                        onChange={(e) => setSimCardCvv(e.target.value.replace(/\D/g, ''))}
                        style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '13px', outline: 'none' }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {simulatorMethod === 'netbanking' && (
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>Popular Banks</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {['SBI', 'HDFC', 'ICICI', 'Axis'].map(b => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => alert(`Selected ${b} Netbanking.`)}
                        style={{ padding: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '11px', fontWeight: 500, borderRadius: '4px', cursor: 'pointer', textAlign: 'center' }}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div style={{ padding: '0 24px 24px 24px' }}>
              <button
                type="button"
                onClick={handleSimulatorSuccess}
                style={{ width: '100%', padding: '12px', background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '4px', fontWeight: 600, fontSize: '13px', cursor: 'pointer', boxShadow: '0 2px 4px rgba(37,99,235,0.2)' }}
              >
                Pay ₹45,000
              </button>
              <button
                type="button"
                onClick={() => setShowRazorpaySimulator(false)}
                style={{ width: '100%', padding: '10px', background: 'transparent', color: '#64748b', border: 'none', fontSize: '11px', fontWeight: 500, cursor: 'pointer', marginTop: '6px' }}
              >
                Cancel Payment
              </button>
            </div>

            {/* Razorpay Footer */}
            <div style={{ background: '#f1f5f9', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <span style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Secured by</span>
              <img src="https://razorpay.com/assets/razorpay-glyph.svg" alt="Razorpay logo" style={{ height: '14px' }} />
              <span style={{ fontSize: '9px', color: '#092444', fontWeight: 'bold' }}>Razorpay</span>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
