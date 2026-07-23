import { useState, useEffect } from 'react'
import Icon from '../../components/Icon'

export default function WardenAttendance() {
  // Get date as string
  const getLocalDateString = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState(getLocalDateString)
  const [searchQuery, setSearchQuery] = useState('')
  const [students, setStudents] = useState([])
  const [alreadyMarked, setAlreadyMarked] = useState(false)
  const [loading, setLoading] = useState(true)

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

  const loadAttendanceData = async () => {
    setLoading(true);
    try {
      // 1. Get all students
      const studentsRes = await fetchWithAuth('http://localhost:5000/api/warden/students');
      let studentList = [];
      if (studentsRes.ok) {
        studentList = await studentsRes.json();
      }

      // 2. Get attendance for the date
      const res = await fetchWithAuth(`http://localhost:5000/api/warden/attendance?date=${selectedDate}`);
      let attRecords = [];
      if (res.ok) {
        attRecords = await res.json();
      }

      setAlreadyMarked(attRecords.length > 0);

      // 3. Merge students with their attendance status
      const merged = studentList.map(s => {
        const studentId = s.id || s.email;
        const matchingRecord = attRecords.find(r => r.studentId === studentId);
        return {
          id: studentId,
          name: s.name,
          room: s.room || 'N/A',
          status: matchingRecord ? matchingRecord.status : 'Absent',
          initials: s.name ? s.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'ST'
        };
      });

      setStudents(merged);
    } catch (err) {
      console.error('Failed to load attendance list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendanceData();
  }, [selectedDate]);

  // Update status in state
  const handleSetStatus = (id, status) => {
    setStudents(students.map(s => s.id === id ? { ...s, status } : s))
  }

  // Update all status in state
  const handleMarkAll = (status) => {
    setStudents(students.map(s => ({ ...s, status })))
  }

  // Save records to database
  const handleSaveAttendance = async () => {
    try {
      const recordsToPost = students.map(s => ({
        studentId: s.id,
        studentName: s.name,
        room: s.room,
        status: s.status
      }));

      const res = await fetchWithAuth('http://localhost:5000/api/warden/attendance/mark', {
        method: 'POST',
        body: JSON.stringify({
          date: selectedDate,
          records: recordsToPost
        })
      });

      if (res.ok) {
        alert('Attendance records successfully updated');
        setAlreadyMarked(true);
      } else {
        alert('Failed to save attendance records.');
      }
    } catch (err) {
      console.error('Failed to save attendance records:', err);
    }
  };

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
            <button
              type="button"
              className="btn-purple-primary"
              style={{ padding: '8px 16px', fontSize: '13px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)', border: 'none' }}
              onClick={handleSaveAttendance}
            >
              Save Attendance
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '40px 0', textAlign: 'center', fontWeight: 600, color: '#557162' }}>
          Loading student attendance list...
        </div>
      ) : (
        <>
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
          <div className="rector-warn-banner" style={{ background: alreadyMarked ? '#ecfdf5' : '#fffbeb', border: alreadyMarked ? '1px solid #a7f3d0' : '1px solid #fef3c7', color: alreadyMarked ? '#065f46' : '#92400e' }}>
            <span>
              {alreadyMarked 
                ? 'Attendance already marked for this date. Click Save Attendance to commit changes.' 
                : 'Attendance not marked yet for this date. Click Save Attendance to commit changes.'}
            </span>
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
                        <small style={{ color: '#64748b', fontSize: '13px' }}>Room {s.room}</small>
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
        </>
      )}
    </div>
  )
}
