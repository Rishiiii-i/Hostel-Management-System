import { useState } from 'react'
import Icon from '../../components/Icon'

export default function WardenAttendance() {
  const [selectedDate, setSelectedDate] = useState('2026-07-21')
  const [searchQuery, setSearchQuery] = useState('')
  const [students, setStudents] = useState([])

  const handleSetStatus = (id, status) => {
    setStudents(students.map(s => s.id === id ? { ...s, status } : s))
  }

  const handleMarkAll = (status) => {
    setStudents(students.map(s => ({ ...s, status })))
  }

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.room.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const presentCount = students.filter(s => s.status === 'Present').length
  const absentCount = students.filter(s => s.status === 'Absent').length
  const lateCount = students.filter(s => s.status === 'Late').length
  const leaveCount = students.filter(s => s.status === 'On Leave').length

  return (
    <div className="tab-pane animate-fade-in-slide-up">
      {/* Top Filter Bar */}
      <div className="owner-card-box" style={{ padding: '20px 24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{ padding: '9px 14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '13.5px', fontWeight: 600 }}
            />
            <div style={{ position: 'relative', minWidth: '240px' }}>
              <input
                type="text"
                placeholder="Search name or room..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '9px 14px 9px 36px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '13.5px', boxSizing: 'border-box' }}
              />
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5, display: 'flex' }}>
                <Icon name="search" width="15" height="15" />
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              className="btn-purple-primary"
              style={{ padding: '8px 16px', fontSize: '13px' }}
              onClick={() => handleMarkAll('Present')}
            >
              All Present
            </button>
            <button
              type="button"
              className="owner-refresh-btn"
              style={{ padding: '8px 16px', fontSize: '13px', color: '#dc2626', borderColor: '#fecaca', background: '#fee2e2' }}
              onClick={() => handleMarkAll('Absent')}
            >
              All Absent
            </button>
          </div>
        </div>
      </div>

      {/* 4 Summary Cards Grid */}
      <div className="owner-stat-grid" style={{ marginBottom: '24px' }}>
        <div className="owner-card-box">
          <small style={{ color: '#059669', fontWeight: 700, textTransform: 'uppercase', fontSize: '11.5px', letterSpacing: '0.5px' }}>Present</small>
          <div style={{ font: '800 32px "Manrope", sans-serif', color: '#10b981', marginTop: '6px' }}>{presentCount}</div>
          <small style={{ color: '#64748b' }}>{students.length ? Math.round((presentCount / students.length) * 100) : 0}%</small>
        </div>

        <div className="owner-card-box">
          <small style={{ color: '#dc2626', fontWeight: 700, textTransform: 'uppercase', fontSize: '11.5px', letterSpacing: '0.5px' }}>Absent</small>
          <div style={{ font: '800 32px "Manrope", sans-serif', color: '#f43f5e', marginTop: '6px' }}>{absentCount}</div>
          <small style={{ color: '#64748b' }}>{students.length ? Math.round((absentCount / students.length) * 100) : 0}%</small>
        </div>

        <div className="owner-card-box">
          <small style={{ color: '#d97706', fontWeight: 700, textTransform: 'uppercase', fontSize: '11.5px', letterSpacing: '0.5px' }}>Late</small>
          <div style={{ font: '800 32px "Manrope", sans-serif', color: '#f59e0b', marginTop: '6px' }}>{lateCount}</div>
          <small style={{ color: '#64748b' }}>{students.length ? Math.round((lateCount / students.length) * 100) : 0}%</small>
        </div>

        <div className="owner-card-box">
          <small style={{ color: '#0284c7', fontWeight: 700, textTransform: 'uppercase', fontSize: '11.5px', letterSpacing: '0.5px' }}>On Leave</small>
          <div style={{ font: '800 32px "Manrope", sans-serif', color: '#0284c7', marginTop: '6px' }}>{leaveCount}</div>
          <small style={{ color: '#64748b' }}>{students.length ? Math.round((leaveCount / students.length) * 100) : 0}%</small>
        </div>
      </div>

      {/* Warning Banner */}
      <div className="rector-warn-banner">
        <span>Attendance not marked yet for today. Mark and save below.</span>
      </div>

      {/* Student List Container */}
      <div className="owner-card-box">
        <div style={{ fontSize: '14px', fontWeight: 700, color: '#64748b', marginBottom: '16px' }}>{filtered.length} students</div>
        {filtered.length === 0 ? (
          <p className="empty-state-text" style={{ padding: '30px 0', textAlign: 'center', margin: 0 }}>No students found.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filtered.map((s) => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderRadius: '14px', border: '1px solid #f1f5f9', background: '#ffffff', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#e0e7ff', color: '#4338ca', fontWeight: 800, fontSize: '14px', display: 'grid', placeItems: 'center' }}>
                    {s.initials}
                  </div>
                  <div>
                    <strong style={{ display: 'block', fontSize: '14.5px', color: '#0f172a' }}>{s.name}</strong>
                    <small style={{ color: '#64748b', fontSize: '13px' }}>Room {s.room} &bull; {s.branch} &bull; {s.year}</small>
                  </div>
                </div>

                <div className="att-pill-group">
                  <button type="button" className={`att-pill-btn present ${s.status === 'Present' ? 'active' : ''}`} onClick={() => handleSetStatus(s.id, 'Present')}>Present</button>
                  <button type="button" className={`att-pill-btn absent ${s.status === 'Absent' ? 'active' : ''}`} onClick={() => handleSetStatus(s.id, 'Absent')}>Absent</button>
                  <button type="button" className={`att-pill-btn late ${s.status === 'Late' ? 'active' : ''}`} onClick={() => handleSetStatus(s.id, 'Late')}>Late</button>
                  <button type="button" className={`att-pill-btn leave ${s.status === 'On Leave' ? 'active' : ''}`} onClick={() => handleSetStatus(s.id, 'On Leave')}>On Leave</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
