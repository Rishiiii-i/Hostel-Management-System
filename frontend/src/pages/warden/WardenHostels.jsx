import { useState, useEffect } from 'react'

export default function WardenHostels() {
  const [hostels, setHostels] = useState([])
  const [loading, setLoading] = useState(true)

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
      const res = await fetchWithAuth('http://localhost:5000/api/warden/hostels')
      if (res.ok) {
        const data = await res.json()
        setHostels(data)
      }
    } catch (err) {
      console.error('Failed to load warden hostels overview:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadHostels()
  }, [])

  return (
    <div style={{ padding: '24px', boxSizing: 'border-box', minHeight: 'calc(100vh - 80px)', background: '#f8fafc' }}>
      
      {/* Header Panel */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '28px',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        padding: '24px 32px',
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(15, 23, 42, 0.08)',
        color: '#ffffff'
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 700, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🏢 Hostels Directory & Capacity
          </h2>
          <p style={{ margin: '6px 0 0 0', opacity: 0.8, fontSize: '14px' }}>
            Monitor total occupancy, rooms, and real-time bed availability for student room allocations.
          </p>
        </div>
        <button
          onClick={loadHostels}
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#ffffff',
            padding: '10px 18px',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            backdropFilter: 'blur(4px)',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'}
          onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
        >
          🔄 Refresh Directory
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
          <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 600, color: '#1e293b' }}>No Registered Hostels Available</h3>
          <p style={{ margin: '0 0 20px 0', color: '#64748b', fontSize: '14px', maxWidth: '380px' }}>
            Please contact the Hostel Owner or Chief Administrator to register a hostel block and generate room numbers.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
          {hostels.map((hostel) => {
            const occupancyPercentage = hostel.totalCapacity > 0 
              ? Math.min(100, Math.round((hostel.occupiedBeds / hostel.totalCapacity) * 100))
              : 0;
            
            return (
              <div key={hostel.id} style={{
                background: '#ffffff',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)',
                border: '1px solid #f1f5f9',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = '0 12px 20px -8px rgba(0,0,0,0.08)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'none'
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.05)'
              }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
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
                        marginBottom: '6px'
                      }}>
                        {hostel.type} Block
                      </span>
                      <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>{hostel.name}</h3>
                      <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                        Block Ref: <strong style={{ color: '#334155' }}>{hostel.block}</strong>
                      </p>
                    </div>

                    {hostel.isFull ? (
                      <span style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 700,
                        background: '#fee2e2',
                        color: '#ef4444',
                        border: '1px solid #fca5a5',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        animation: 'pulse 2s infinite'
                      }}>
                        🔴 HOSTEL FULL
                      </span>
                    ) : (
                      <span style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 700,
                        background: '#ecfdf5',
                        color: '#10b981',
                        border: '1px solid #a7f3d0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        🟢 Available
                      </span>
                    )}
                  </div>

                  {/* Occupancy Indicator */}
                  <div style={{ margin: '24px 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Bed Occupancy</span>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: hostel.isFull ? '#ef4444' : '#0f172a' }}>
                        {hostel.occupiedBeds} / {hostel.totalCapacity} ({occupancyPercentage}%)
                      </span>
                    </div>
                    <div style={{ width: '100%', height: '10px', background: '#e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
                      <div style={{
                        width: `${occupancyPercentage}%`,
                        height: '100%',
                        background: hostel.isFull 
                          ? 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)' 
                          : 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
                        borderRadius: '10px',
                        transition: 'width 0.4s ease-out'
                      }} />
                    </div>
                  </div>

                  {/* Hostel Details breakdown */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', padding: '14px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                    <div>
                      <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Total Rooms</div>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b' }}>{hostel.totalRooms} Rooms</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Vacant Beds</div>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: hostel.isFull ? '#ef4444' : '#059669' }}>
                        {hostel.vacantBeds} Bed(s)
                      </div>
                    </div>
                    <div style={{ marginTop: '4px' }}>
                      <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Structure</div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                        {hostel.totalFloors} floors, {hostel.roomsPerFloor} rms/flr
                      </div>
                    </div>
                    <div style={{ marginTop: '4px' }}>
                      <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Sharing Details</div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                        {hostel.roomCapacity} Occupants / Room
                      </div>
                    </div>
                  </div>
                </div>

                {hostel.isFull && (
                  <div style={{
                    marginTop: '16px',
                    padding: '10px 12px',
                    background: '#fef2f2',
                    color: '#991b1b',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 500,
                    border: '1px solid #fca5a5'
                  }}>
                    ⚠️ <strong>Hostel is completely filled!</strong> Further student allocation requests for this block are blocked until beds are vacated.
                  </div>
                )}

                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '14px', marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>Allocation Cost / Semester</span>
                  <span style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>₹{hostel.fee.toLocaleString()}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  )
}
