import './StudentDashboard.css'
import { useState, useRef, useEffect } from 'react'
import Icon from '../components/Icon'
import { useAuth } from '../context/AuthContext'

export default function StudentDashboard({ activeTab = 'overview', setActiveTab, profile, setProfile }) {
  const { user, updateProfileName, updateUserData } = useAuth()
  const fileInputRef = useRef(null)
  const [complaints, setComplaints] = useState([])
  const [gatePasses, setGatePasses] = useState([])
  const [transactions, setTransactions] = useState([])
  const [notices, setNotices] = useState([])
  const [messMenu, setMessMenu] = useState([])
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    emergencyContact: '',
    room: '',
    block: '',
    photo: ''
  })
  const [attendanceStats, setAttendanceStats] = useState({
    presentCount: 0,
    outingCount: 0,
    attendanceRate: 100
  })
  const [loadingData, setLoadingData] = useState(true)
  const [isFormEdited, setIsFormEdited] = useState(false)

  // Reset edit status when changing tabs
  useEffect(() => {
    setIsFormEdited(false);
  }, [activeTab]);

  // Sync profile form without losing edits
  useEffect(() => {
    if (profile) {
      if (!isFormEdited || activeTab !== 'settings') {
        setProfileForm({
          fullName: profile.fullName || '',
          email: profile.email || '',
          phone: profile.phone || '',
          emergencyContact: profile.emergencyContact || '',
          room: profile.room || '',
          block: profile.block || '',
          photo: profile.photo || ''
        });
      }
    }
  }, [profile, activeTab, isFormEdited]);

  const [feePaid, setFeePaid] = useState(false)
  const [feeDetails, setFeeDetails] = useState({
    totalFee: 0,
    paidFee: 0,
    dueFee: 0,
    feeStatus: 'Unpaid'
  })
  const [showPayModal, setShowPayModal] = useState(false)
  const [showComplaintModal, setShowComplaintModal] = useState(false)
  const [showGatePassModal, setShowGatePassModal] = useState(false)

  const [newComplaint, setNewComplaint] = useState({ category: 'Electrical', title: '', priority: 'Medium' })
  const [newGatePass, setNewGatePass] = useState({ reason: '', departure: '', returnDate: '' })
  const [payAmount, setPayAmount] = useState('5000.00')
  const [paymentPeriod, setPaymentPeriod] = useState('Hostel Fee')

  const [savedSuccessMsg, setSavedSuccessMsg] = useState('')
  const [customCategory, setCustomCategory] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('card')
  const [cardDetails, setCardDetails] = useState({ number: '', expiry: '', cvv: '', name: '' })
  const [upiId, setUpiId] = useState('')
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)

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

  // Sync local fee states when profile prop changes (e.g. background sidebar fetch)
  useEffect(() => {
    if (profile) {
      const isPaid = profile.feeStatus === 'Paid';
      setFeePaid(isPaid);
      
      const totalF = profile.totalFee !== undefined ? Number(profile.totalFee) : 45000;
      const paidF = profile.paidFee !== undefined ? Number(profile.paidFee) : 0;
      const dueF = profile.dueFee !== undefined ? Number(profile.dueFee) : (totalF - paidF);
      
      setFeeDetails({
        totalFee: totalF,
        paidFee: paidF,
        dueFee: dueF,
        feeStatus: profile.feeStatus || 'Unpaid'
      });
      setPayAmount(dueF.toString());
    }
  }, [profile]);

  // Get dashboard data from server on startup
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!user || !token) return;

    let active = true;
    const loadDashboardData = async () => {
      setLoadingData(true);
      try {
        // Get student profile
        const profileRes = await fetchWithAuth('http://localhost:5000/api/student/profile');
        if (!profileRes.ok) {
          console.error('Failed to fetch profile:', profileRes.status);
          return;
        }
        let isPaidProfile = false;
        if (active) {
          const profileData = await profileRes.json();
          isPaidProfile = profileData.feeStatus === 'Paid';
          setFeePaid(isPaidProfile);
          
          const totalF = profileData.totalFee !== undefined ? profileData.totalFee : 45000;
          const paidF = profileData.paidFee !== undefined ? profileData.paidFee : 0;
          const dueF = profileData.dueFee !== undefined ? profileData.dueFee : (totalF - paidF);
          
          setFeeDetails({
            totalFee: totalF,
            paidFee: paidF,
            dueFee: dueF,
            feeStatus: profileData.feeStatus || 'Unpaid'
          });
          setPayAmount(dueF.toString());

          const mappedProfile = {
            fullName: profileData.name || profile.fullName || 'Student',
            email: profileData.email || '',
            phone: profileData.phone || '',
            emergencyContact: profileData.emergencyContact || '',
            room: profileData.room || '',
            block: profileData.block || '',
            rollNo: profileData.rollNo || '',
            photo: profileData.photo || ''
          };
          if (setProfile) setProfile(mappedProfile);
          localStorage.setItem('shm_user_profile', JSON.stringify(mappedProfile));
        }

        // Get student complaints
        const complaintsRes = await fetchWithAuth('http://localhost:5000/api/student/complaints');
        if (complaintsRes.ok && active) {
          const complaintsData = await complaintsRes.json();
          setComplaints(complaintsData);
        }

        // Get student gate passes
        const gatePassesRes = await fetchWithAuth('http://localhost:5000/api/student/gatepasses');
        if (gatePassesRes.ok && active) {
          const gatePassesData = await gatePassesRes.json();
          setGatePasses(gatePassesData);
        }

        // Get student payment transactions
        const transactionsRes = await fetchWithAuth('http://localhost:5000/api/student/transactions');
        if (transactionsRes.ok && active) {
          const transactionsData = await transactionsRes.json();
          setTransactions(transactionsData);
        }

        // Get weekly mess menu
        const messMenuRes = await fetchWithAuth('http://localhost:5000/api/student/mess/menu');
        if (messMenuRes.ok && active) {
          const messMenuData = await messMenuRes.json();
          setMessMenu(messMenuData);
        }

        // Get notices
        const noticesRes = await fetchWithAuth('http://localhost:5000/api/student/notices');
        if (noticesRes.ok && active) {
          const noticesData = await noticesRes.json();
          const formattedNotices = noticesData.map(n => ({
            id: n.id,
            title: n.title,
            body: n.content,
            date: n.date,
            category: n.targetStudentEmail ? 'Personal Alert' : n.targetBlock
          }));
          setNotices(formattedNotices);
        }

        // Get student attendance stats
        const attendanceStatsRes = await fetchWithAuth('http://localhost:5000/api/student/attendance/stats');
        if (attendanceStatsRes.ok && active) {
          const statsData = await attendanceStatsRes.json();
          setAttendanceStats(statsData);
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        if (active) setLoadingData(false);
      }
    };

    loadDashboardData();
    return () => {
      active = false;
    };
  }, [user, user?.email]);

  // Upload student photo
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      alert('File size should be less than 5MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = async () => {
      const updated = { ...(profile || {}), photo: reader.result }
      if (setProfile) setProfile(updated)
      setProfileForm(prev => ({ ...prev, photo: reader.result }))
      try {
        localStorage.setItem('shm_user_profile', JSON.stringify(updated))
        // Save changes to database
        const res = await fetchWithAuth('http://localhost:5000/api/student/profile', {
          method: 'PUT',
          body: JSON.stringify({
            name: updated.fullName || '',
            rollNo: updated.rollNo || '',
            phone: updated.phone || '',
            emergencyContact: updated.emergencyContact || '',
            room: updated.room || '',
            block: updated.block || '',
            photo: updated.photo || ''
          })
        });
        if (res.ok && updateUserData) {
          const resData = await res.json();
          await updateUserData(resData);
        }
      } catch (err) {
        console.error('Failed to save profile photo:', err);
      }
      setSavedSuccessMsg('Profile photo updated successfully!')
      setTimeout(() => setSavedSuccessMsg(''), 4000)
    }
    reader.readAsDataURL(file)
  }

  // Remove student photo
  const handleRemovePhoto = async () => {
    const updated = { ...(profile || {}), photo: '' }
    if (setProfile) setProfile(updated)
    setProfileForm(prev => ({ ...prev, photo: '' }))
    try {
      localStorage.setItem('shm_user_profile', JSON.stringify(updated))
      // Save changes to database
      const res = await fetchWithAuth('http://localhost:5000/api/student/profile', {
        method: 'PUT',
        body: JSON.stringify({
          name: updated.fullName || '',
          rollNo: updated.rollNo || '',
          phone: updated.phone || '',
          emergencyContact: updated.emergencyContact || '',
          room: updated.room || '',
          block: updated.block || '',
          photo: ''
        })
      });
      if (res.ok && updateUserData) {
        const resData = await res.json();
        await updateUserData(resData);
      }
    } catch (err) {
      console.error('Failed to remove profile photo:', err);
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
    setSavedSuccessMsg('Profile photo removed.')
    setTimeout(() => setSavedSuccessMsg(''), 4000)
  }

  // Save profile details
  const handleSaveProfile = async (e) => {
    e.preventDefault()
    try {
      const res = await fetchWithAuth('http://localhost:5000/api/student/profile', {
        method: 'PUT',
        body: JSON.stringify({
          name: profileForm.fullName || '',
          rollNo: profile?.rollNo || '',
          phone: profileForm.phone || '',
          emergencyContact: profileForm.emergencyContact || '',
          room: profileForm.room || '',
          block: profileForm.block || '',
          photo: profileForm.photo || ''
        })
      });
      if (res.ok) {
        const updated = await res.json();
        const localProfile = {
          ...profile,
          fullName: updated.name,
          rollNo: updated.rollNo,
          phone: updated.phone,
          emergencyContact: updated.emergencyContact,
          room: updated.room,
          block: updated.block,
          photo: updated.photo
        };
        if (setProfile) setProfile(localProfile);
        setIsFormEdited(false);
        localStorage.setItem('shm_user_profile', JSON.stringify(localProfile));
        if (updateUserData) {
          await updateUserData(updated);
        } else if (updateProfileName) {
          await updateProfileName(updated.name);
        }
        setSavedSuccessMsg('Profile details updated successfully!')
      } else {
        alert('Failed to save profile changes to server.');
      }
    } catch (err) {
      console.error('Failed to save profile info:', err);
    }
    setTimeout(() => setSavedSuccessMsg(''), 4000)
  }

  // Submit new complaint
  const handleAddComplaint = async (e) => {
    e.preventDefault()
    if (!newComplaint.title) return
    try {
      const finalCategory = newComplaint.category === 'Other' ? customCategory : newComplaint.category;
      const res = await fetchWithAuth('http://localhost:5000/api/student/complaints', {
        method: 'POST',
        body: JSON.stringify({
          category: finalCategory,
          title: newComplaint.title,
          priority: newComplaint.priority
        })
      });
      if (res.ok) {
        const saved = await res.json();
        setComplaints([saved, ...complaints]);
        setCustomCategory('');
        window.dispatchEvent(new CustomEvent('shm:new_notification', {
          detail: {
            notification: {
              title: 'Complaint Registered',
              body: `Your ${saved.priority || ''} complaint "${saved.title}" has been submitted.`
            },
            data: { type: 'complaint', targetScreen: 'complaints', targetHash: '#dashboard', id: saved.id }
          }
        }));
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(`Failed to submit complaint: ${errData.error || errData.message || 'Server error'}`);
      }
    } catch (err) {
      console.error('Failed to submit complaint:', err);
    }
    setNewComplaint({ category: 'Electrical', title: '', priority: 'Medium' })
    setShowComplaintModal(false)
  }

  // Request gate pass
  const handleAddGatePass = async (e) => {
    e.preventDefault()
    if (!newGatePass.reason) return
    try {
      const departureVal = newGatePass.departure || new Date().toISOString().slice(0, 16).replace('T', ' ');
      const returnDateVal = newGatePass.returnDate || new Date().toISOString().slice(0, 16).replace('T', ' ');
      const res = await fetchWithAuth('http://localhost:5000/api/student/gatepasses', {
        method: 'POST',
        body: JSON.stringify({
          reason: newGatePass.reason,
          departure: departureVal,
          returnDate: returnDateVal
        })
      });
      if (res.ok) {
        const saved = await res.json();
        setGatePasses([saved, ...gatePasses]);
        window.dispatchEvent(new CustomEvent('shm:new_notification', {
          detail: {
            notification: {
              title: 'Gate Pass Requested',
              body: `Your leave request for "${saved.reason}" has been submitted.`
            },
            data: { type: 'gatepass', targetScreen: 'leave', targetHash: '#dashboard', id: saved.id }
          }
        }));
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(`Failed to request gate pass: ${errData.error || errData.message || 'Server error'}`);
      }
    } catch (err) {
      console.error('Failed to apply for gate pass:', err);
    }
    setNewGatePass({ reason: '', departure: '', returnDate: '' })
    setShowGatePassModal(false)
  }

  // Download payment receipt as PDF
  const handleDownloadReceipt = (txn) => {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      alert('Pop-up blocker is enabled. Please allow pop-ups to print the receipt.');
      return;
    }
    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt-${txn.id}</title>
          <style>
            body {
              font-family: 'Segoe UI', system-ui, sans-serif;
              color: #1e293b;
              padding: 30px;
              background: #ffffff;
              line-height: 1.5;
            }
            .receipt-box {
              max-width: 600px;
              margin: 0 auto;
              border: 1px solid #e2e8f0;
              border-radius: 16px;
              padding: 30px;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #f1f5f9;
              padding-bottom: 20px;
              margin-bottom: 20px;
            }
            .header h1 {
              font-size: 22px;
              margin: 0 0 4px 0;
              color: #0f172a;
              font-weight: 800;
            }
            .header p {
              margin: 0;
              color: #64748b;
              font-size: 13px;
            }
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 14px;
              margin-bottom: 24px;
            }
            .info-item {
              margin-bottom: 4px;
            }
            .info-item label {
              display: block;
              font-size: 11px;
              color: #64748b;
              text-transform: uppercase;
              font-weight: 600;
              margin-bottom: 2px;
            }
            .info-item span {
              display: block;
              font-size: 14px;
              color: #0f172a;
              font-weight: 700;
            }
            .details-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 24px;
            }
            .details-table th, .details-table td {
              padding: 10px;
              text-align: left;
              border-bottom: 1px solid #f1f5f9;
            }
            .details-table th {
              color: #64748b;
              font-weight: 600;
              font-size: 12px;
            }
            .details-table td {
              font-size: 13px;
              color: #334155;
            }
            .total-row td {
              font-weight: 800;
              font-size: 14px;
              color: #10b981;
              border-top: 2px solid #f1f5f9;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              font-size: 11px;
              color: #94a3b8;
              border-top: 1px dashed #e2e8f0;
              padding-top: 16px;
            }
          </style>
        </head>
        <body>
          <div class="receipt-box">
            <div class="header">
              <h1>SMART HOSTEL</h1>
              <p>Official Payment Receipt</p>
            </div>
            
            <div class="info-grid">
              <div class="info-item">
                <label>Receipt ID</label>
                <span>${txn.id}</span>
              </div>
              <div class="info-item">
                <label>Payment Date</label>
                <span>${txn.date}</span>
              </div>
              <div class="info-item">
                <label>Student Name</label>
                <span>${profile?.fullName || 'N/A'}</span>
              </div>
              <div class="info-item">
                <label>Email Address</label>
                <span>${profile?.email || 'N/A'}</span>
              </div>
              <div class="info-item">
                <label>Room / Block</label>
                <span>Room ${profile?.room || 'N/A'} (${profile?.block || 'N/A'})</span>
              </div>
              <div class="info-item">
                <label>Transaction Status</label>
                <span style="color: #10b981;">${txn.status}</span>
              </div>
            </div>

            <table class="details-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th style="text-align: right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>${txn.period} Allocation Fee</td>
                  <td style="text-align: right; font-weight: 700;">${txn.amount}</td>
                </tr>
                <tr class="total-row">
                  <td>Total Paid</td>
                  <td style="text-align: right;">${txn.amount}</td>
                </tr>
              </tbody>
            </table>

            <div class="footer">
              <p>This is a computer-generated receipt and does not require a signature.</p>
              <p>&copy; ${new Date().getFullYear()} Smart Hostel Management System. All rights reserved.</p>
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleOpenPayModal = () => {
    setPaymentPeriod('Hostel Fee');
    setPayAmount(feeDetails.dueFee.toString());
    setShowPayModal(true);
  };

  const handlePayFee = async (e) => {
    if (e) e.preventDefault();
    setIsProcessingPayment(true);
    
    setTimeout(async () => {
      try {
        const res = await fetchWithAuth('http://localhost:5000/api/student/transactions', {
          method: 'POST',
          body: JSON.stringify({
            amount: payAmount,
            period: paymentPeriod
          })
        });
        if (res.ok) {
          const saved = await res.json();
          setTransactions([saved, ...transactions]);
          
          const amountPaid = Number(payAmount) || 0;
          
          if (paymentPeriod === 'Hostel Fee') {
            setFeeDetails(prev => {
              const newPaid = prev.paidFee + amountPaid;
              const newDue = Math.max(0, prev.totalFee - newPaid);
              const isCleared = newDue <= 0;
              
              setFeePaid(isCleared);
              return {
                ...prev,
                paidFee: newPaid,
                dueFee: newDue,
                feeStatus: isCleared ? 'Paid' : (newPaid > 0 ? 'Partial' : 'Unpaid')
              };
            });
          }

          setShowPayModal(false);
          setCardDetails({ number: '', expiry: '', cvv: '', name: '' });
          setUpiId('');
          window.dispatchEvent(new CustomEvent('shm:new_notification', {
            detail: {
              notification: {
                title: 'Fee Payment Completed',
                body: `Payment of ₹${payAmount} processed successfully.`
              },
              data: { type: 'fee', targetScreen: 'fee', targetHash: '#dashboard' }
            }
          }));
        } else {
          const errData = await res.json();
          alert(errData.message || 'Failed to process payment.');
        }
      } catch (err) {
        console.error('Failed to submit fee payment:', err);
      } finally {
        setIsProcessingPayment(false);
      }
    }, 1500);
  }

  return (
    <div className="student-dashboard-page">
      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="tab-pane animate-fade-in-slide-up">
          <div className="welcome-banner">
            <div className="banner-content">
              <h1>Welcome back, {profile?.fullName || profile?.name || 'Student'}</h1>
              <p>Manage your room details, fee receipts, gate passes, and maintenance requests in one dashboard.</p>
            </div>
            <div className="banner-quick-stats">
              <div className="stat-box">
                <span className="stat-label">Assigned Room</span>
                <strong className="stat-value">{profile?.room || 'N/A'}</strong>
                <small className="stat-sub">{profile?.block || 'Unassigned'}</small>
              </div>
              <div className="stat-box">
                <span className="stat-label">Fee Status</span>
                <strong className={`stat-value ${feePaid ? 'text-success' : 'text-warning'}`}>
                  {feePaid ? 'Cleared' : `₹${feeDetails.dueFee} Dues`}
                </strong>
                <small className="stat-sub">{feePaid ? 'Receipt Available' : 'Payment Due'}</small>
              </div>
            </div>
          </div>

          <div className="dashboard-feature-grid">
            <div className="dash-card dashboard-feature-card room-theme" onClick={() => setActiveTab('room')}>
              <div className="feature-card-header">
                <div className="feature-icon-box"><Icon name="room" width="22" height="22" style={{ filter: 'brightness(0) invert(1)' }} /></div>
                <span className="feature-badge">Active</span>
              </div>
              <h4>Room Details</h4>
              <p>View room number, block, bed allocation, and roommate details.</p>
              <span className="dashboard-feature-card-link">View Details &rarr;</span>
            </div>

            <div className="dash-card dashboard-feature-card fees-theme" onClick={() => setActiveTab('fees')}>
              <div className="feature-card-header">
                <div className="feature-icon-box"><Icon name="fee" width="22" height="22" style={{ filter: 'brightness(0) invert(1)' }} /></div>
                <span className="feature-badge">Finance</span>
              </div>
              <h4>Fees & Payments</h4>
              <p>Check pending dues, transaction receipts, and online fee portal.</p>
              <span className="dashboard-feature-card-link">View Payments &rarr;</span>
            </div>

            <div className="dash-card dashboard-feature-card complaints-theme" onClick={() => setActiveTab('complaints')}>
              <div className="feature-card-header">
                <div className="feature-icon-box"><Icon name="complaint" width="22" height="22" style={{ filter: 'brightness(0) invert(1)' }} /></div>
                <span className="feature-badge">Support</span>
              </div>
              <h4>Complaints & Repairs</h4>
              <p>Log maintenance issues and track resolution status in real-time.</p>
              <span className="dashboard-feature-card-link">Log Issue &rarr;</span>
            </div>

            <div className="dash-card dashboard-feature-card gatepass-theme" onClick={() => setActiveTab('gatepass')}>
              <div className="feature-card-header">
                <div className="feature-icon-box"><Icon name="attendance" width="22" height="22" style={{ filter: 'brightness(0) invert(1)' }} /></div>
                <span className="feature-badge">Outing</span>
              </div>
              <h4>Gate Pass & Attendance</h4>
              <p>Request outing permissions and view monthly attendance logs.</p>
              <span className="dashboard-feature-card-link">Request Pass &rarr;</span>
            </div>
          </div>

          <div className="dashboard-grid-2col">
            <div className="dash-card">
              <div className="card-header">
                <h3>Today&apos;s Mess Menu ({new Date().toLocaleDateString('en-US', { weekday: 'long' })})</h3>
                <span className="badge-tag info">Live Menu</span>
              </div>
              {(() => {
                const todayDay = new Date().toLocaleDateString('en-US', { weekday: 'long' });
                const menu = Array.isArray(messMenu) ? messMenu.find(m => m.day === todayDay) : null;
                if (menu) {
                  return (
                    <div className="mess-menu-grid">
                      <div className="mess-item">
                        <h5>Breakfast</h5>
                        <p>{menu.breakfast}</p>
                      </div>
                      <div className="mess-item">
                        <h5>Lunch</h5>
                        <p>{menu.lunch}</p>
                      </div>
                      <div className="mess-item">
                        <h5>Snacks</h5>
                        <p>{menu.snacks}</p>
                      </div>
                      <div className="mess-item">
                        <h5>Dinner</h5>
                        <p>{menu.dinner}</p>
                      </div>
                    </div>
                  );
                }
                return (
                  <div className="mess-menu-grid">
                    <p className="empty-state-text">No mess menu added for today.</p>
                  </div>
                );
              })()}
            </div>

            <div className="dash-card">
              <div className="card-header">
                <h3>Quick Actions</h3>
              </div>
              <div className="quick-actions-btns">
                <button type="button" className="btn-pay-fee" onClick={handleOpenPayModal}>
                  Pay Fee Dues
                </button>
                <button type="button" className="btn-report-problem" onClick={() => setShowComplaintModal(true)}>
                  Report Problem
                </button>
                <button type="button" className="btn-ask-gatepass" onClick={() => setShowGatePassModal(true)}>
                  Request Gate Pass
                </button>
              </div>

              <div className="card-header" style={{ marginTop: '28px' }}>
                <h3>Recent Announcements</h3>
              </div>
              <div className="notice-mini-list">
                {notices.length === 0 ? (
                  <p className="empty-state-text">No announcements right now.</p>
                ) : (
                  notices.map((n) => (
                    <div key={n.id} className="notice-item">
                      <span className="notice-tag info">{n.category}</span>
                      <div>
                        <strong>{n.title}</strong>
                        <small>{n.date}</small>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MY ROOM TAB */}
      {activeTab === 'room' && (
        <div className="tab-pane animate-fade-in-slide-up">
          <div className="tab-header-box">
            <div className="tab-title-row">
              <div className="tab-title-with-icon">
                <div className="tab-icon-wrapper">
                  <Icon name="room" width="22" height="22" />
                </div>
                <div>
                  <h2 className="tab-title">My Room Details</h2>
                  <p className="tab-subtitle">Check details about your assigned hostel room and bed allocation.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="dashboard-grid-3col">
            <div className="dash-card">
              <div className="card-title-badge">
                <h3>Assigned Room Info</h3>
                <span className="status-badge paid">Occupied</span>
              </div>
              <div className="room-info-grid">
                <div className="info-row">
                  <span className="info-label">Room Number</span>
                  <strong className="info-val">{profile?.room || 'N/A'}</strong>
                </div>
                <div className="info-row">
                  <span className="info-label">Hostel Block</span>
                  <strong className="info-val">{profile?.block || 'Unassigned'}</strong>
                </div>
                <div className="info-row">
                  <span className="info-label">Bed Position</span>
                  <strong className="info-val">0</strong>
                </div>
                <div className="info-row">
                  <span className="info-label">Floor Level</span>
                  <strong className="info-val">0</strong>
                </div>
              </div>
            </div>

            <div className="dash-card">
              <div className="card-title-badge">
                <h3>Occupancy & Support</h3>
              </div>
              <div className="room-info-grid">
                <div className="info-row">
                  <span className="info-label">Resident Status</span>
                  <strong className="info-val">{profile?.room ? 'Room Allocated' : 'Not Assigned'}</strong>
                </div>
                <div className="info-row">
                  <span className="info-label">Warden In-Charge</span>
                  <strong className="info-val">{profile?.room ? (profile?.wardenInfo?.fullName || 'Dileep') : 'Not Assigned'}</strong>
                </div>
                <div className="info-row">
                  <span className="info-label">Warden Contact</span>
                  <strong className="info-val">{profile?.room ? (profile?.wardenInfo?.phone || '+91 987654321') : '0'}</strong>
                </div>
                <div className="info-row">
                  <span className="info-label">Emergency Desk</span>
                  <strong className="info-val">{profile?.room ? (profile?.wardenInfo?.emergencyContact || '+91 123456789') : '0'}</strong>
                </div>
              </div>
            </div>

            <div className="dash-card">
              <div className="card-title-badge">
                <h3>Room Amenities</h3>
                <span className="status-badge paid">Verified</span>
              </div>
              <div className="room-info-grid">
                <div className="info-row">
                  <span className="info-label">Hostel Internet</span>
                  <strong className="info-val">High-Speed Wi-Fi</strong>
                </div>
                <div className="info-row">
                  <span className="info-label">Study Setup</span>
                  <strong className="info-val">Desk &amp; Chair</strong>
                </div>
                <div className="info-row">
                  <span className="info-label">Washroom Type</span>
                  <strong className="info-val">Attached (Geyser)</strong>
                </div>
                <div className="info-row">
                  <span className="info-label">Power &amp; Security</span>
                  <strong className="info-val">24/7 Backup &amp; Guard</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FEES & PAYMENTS TAB */}
      {activeTab === 'fees' && (
        <div className="tab-pane animate-fade-in-slide-up">
          <div className="tab-header-box">
            <div className="tab-title-row">
              <div className="tab-title-with-icon">
                <div className="tab-icon-wrapper">
                  <Icon name="fee" width="22" height="22" />
                </div>
                <div>
                  <h2 className="tab-title">Fees &amp; Payments</h2>
                  <p className="tab-subtitle">Check your hostel fee breakdown and download official payment receipts.</p>
                </div>
              </div>
              <button type="button" className="btn-pay-fee" onClick={handleOpenPayModal}>
                Pay Fee Dues
              </button>
            </div>
          </div>

          <div className="dashboard-grid-2col">
            <div className="dash-card">
              <h3>Current Dues Summary</h3>
              <div className="fee-summary-box">
                <div className="fee-amount-display">
                  <small>Total Dues Payable</small>
                  <b>{feePaid ? '₹0.00' : `₹${feeDetails.dueFee}`}</b>
                  <span className="fee-due-date">{feePaid ? 'No pending dues' : 'Due by July 31, 2026'}</span>
                </div>
                <div className="fee-breakdown-list">
                  <div className="fee-item">
                    <span>Hostel Room Rent</span>
                    <strong>{feePaid ? '₹0.00' : `₹${(feeDetails.dueFee * 0.7).toFixed(2)}`}</strong>
                  </div>
                  <div className="fee-item">
                    <span>Mess Charges</span>
                    <strong>{feePaid ? '₹0.00' : `₹${(feeDetails.dueFee * 0.24).toFixed(2)}`}</strong>
                  </div>
                  <div className="fee-item">
                    <span>Maintenance &amp; Security</span>
                    <strong>{feePaid ? '₹0.00' : `₹${(feeDetails.dueFee * 0.06).toFixed(2)}`}</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="dash-card">
              <h3>Payment History</h3>
              {transactions.length === 0 ? (
                <p className="empty-state-text">No payment records found.</p>
              ) : (
                <div className="payment-history-scroll-box">
                  <div className="table-responsive">
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>Payment ID</th>
                          <th>Type</th>
                          <th>Amount</th>
                          <th>Date</th>
                          <th>Status</th>
                          <th>Receipt</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map((t) => (
                          <tr key={t.id}>
                            <td><strong>{t.id}</strong></td>
                            <td>{t.period}</td>
                            <td><strong>{t.amount}</strong></td>
                            <td>{t.date}</td>
                            <td><span className="status-badge paid">{t.status}</span></td>
                            <td>
                              <button type="button" className="btn-table-action" onClick={() => handleDownloadReceipt(t)}>
                                Receipt PDF
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* COMPLAINTS TAB */}
      {activeTab === 'complaints' && (
        <div className="tab-pane animate-fade-in-slide-up">
          <div className="tab-header-box">
            <div className="tab-title-row">
              <div className="tab-title-with-icon">
                <div className="tab-icon-wrapper">
                  <Icon name="complaint" width="22" height="22" />
                </div>
                <div>
                  <h2 className="tab-title">Requests &amp; Complaints</h2>
                  <p className="tab-subtitle">Report maintenance issues and track resolution progress by hostel staff.</p>
                </div>
              </div>
              <button type="button" className="btn-report-problem" onClick={() => setShowComplaintModal(true)}>
                Report Problem
              </button>
            </div>
          </div>

          <div className="dash-card">
            <h3>Registered Maintenance Requests</h3>
            {complaints.length === 0 ? (
              <p className="empty-state-text">No maintenance complaints reported yet.</p>
            ) : (
              <div className="table-responsive">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Ticket ID</th>
                      <th>Category</th>
                      <th>Problem Description</th>
                      <th>Reported Date</th>
                      <th>Priority</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {complaints.map((c) => (
                      <tr key={c.id}>
                        <td><strong>{c.id}</strong></td>
                        <td><span className="category-tag">{c.category}</span></td>
                        <td>{c.title}</td>
                        <td>{c.date}</td>
                        <td><span className={`priority-tag ${c.priority.toLowerCase()}`}>{c.priority}</span></td>
                        <td>
                          <span className={`status-badge ${c.status.toLowerCase().replace(/\s+/g, '-')}`}>
                            {c.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* GATE PASS & ATTENDANCE TAB */}
      {activeTab === 'gatepass' && (
        <div className="tab-pane animate-fade-in-slide-up">
          <div className="tab-header-box">
            <div className="tab-title-row">
              <div className="tab-title-with-icon">
                <div className="tab-icon-wrapper">
                  <Icon name="attendance" width="22" height="22" />
                </div>
                <div>
                  <h2 className="tab-title">Gate Pass &amp; Attendance</h2>
                  <p className="tab-subtitle">Apply for outing gate pass permissions and track your monthly attendance logs.</p>
                </div>
              </div>
              <button type="button" className="btn-ask-gatepass" onClick={() => setShowGatePassModal(true)}>
                Request Gate Pass
              </button>
            </div>
          </div>

          <div className="dashboard-grid-2col">
            <div className="dash-card">
              <h3>Monthly Attendance Record</h3>
              <div className="attendance-summary-box">
                <div className="att-stat-card green">
                  <strong>{attendanceStats.presentCount} Days</strong>
                  <span>Present</span>
                </div>
                <div className="att-stat-card amber">
                  <strong>{attendanceStats.outingCount} Days</strong>
                  <span>Approved Outing</span>
                </div>
                <div className="att-stat-card emerald">
                  <strong>{attendanceStats.attendanceRate}%</strong>
                  <span>Attendance Rate</span>
                </div>
              </div>
            </div>

            <div className="dash-card">
              <h3>Gate Pass Requests History</h3>
              {gatePasses.length === 0 ? (
                <p className="empty-state-text">No gate pass requests submitted yet.</p>
              ) : (
                <div className="gatepass-list">
                  {gatePasses.map((gp) => (
                    <div key={gp.id} className="gatepass-card">
                      <div className="gp-header">
                        <div>
                          <strong>{gp.id} &bull; {gp.reason}</strong>
                        </div>
                        <span className={`status-badge ${gp.status.toLowerCase().replace(/\s+/g, '-')}`}>{gp.status}</span>
                      </div>
                      <div className="gp-times">
                        <span><strong>Departure:</strong> {gp.departure}</span>
                        <span><strong>Return:</strong> {gp.returnDate}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* NOTICES TAB */}
      {activeTab === 'notices' && (
        <div className="tab-pane animate-fade-in-slide-up">
          <div className="tab-header-box">
            <div className="tab-title-row">
              <div className="tab-title-with-icon">
                <div className="tab-icon-wrapper">
                  <Icon name="bell" width="22" height="22" />
                </div>
                <div>
                  <h2 className="tab-title">Hostel Notice Board</h2>
                  <p className="tab-subtitle">Official announcements, emergency alerts, and updates from warden office.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="dash-card">
            {notices.length === 0 ? (
              <p className="empty-state-text">No notices right now.</p>
            ) : (
              <div className="notices-feed-grid">
                {notices.map((n) => (
                  <div key={n.id} className="notice-feed-card">
                    <div className="notice-top-bar">
                      <span className="notice-tag info">{n.category}</span>
                      <span className="notice-date">{n.date}</span>
                    </div>
                    <h3>{n.title}</h3>
                    <p>{n.body}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* WARDEN DESK TAB */}
      {activeTab === 'warden' && (
        <div className="tab-pane animate-fade-in-slide-up">
          <div className="tab-header-box">
            <div className="tab-title-row">
              <div className="tab-title-with-icon">
                <div className="tab-icon-wrapper">
                  <Icon name="user" width="22" height="22" />
                </div>
                <div>
                  <h2 className="tab-title">Hostel Warden Desk</h2>
                  <p className="tab-subtitle">Contact your chief warden, view official desk hours, and request emergency assistance.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="dashboard-grid-3col">
            <div className="dash-card">
              <div className="card-title-badge">
                <h3>Chief Warden Details</h3>
                <span className="status-badge paid">On Duty</span>
              </div>
              <div className="room-info-grid">
                <div className="info-row">
                  <span className="info-label">Full Name</span>
                  <strong className="info-val">{profile?.wardenInfo?.fullName || 'Dileep'}</strong>
                </div>
                <div className="info-row">
                  <span className="info-label">Official Email</span>
                  <strong className="info-val">warden@smarthostel.com</strong>
                </div>
                <div className="info-row">
                  <span className="info-label">Contact Number</span>
                  <strong className="info-val">+91 98765 43210</strong>
                </div>
                <div className="info-row">
                  <span className="info-label">Office Location</span>
                  <strong className="info-val">Shnoor Hills, Block A (Ground Floor)</strong>
                </div>
              </div>
            </div>

            <div className="dash-card">
              <div className="card-title-badge">
                <h3>Desk Hours &amp; Support</h3>
                <span className="status-badge info">Active</span>
              </div>
              <div className="room-info-grid">
                <div className="info-row">
                  <span className="info-label">Morning Hours</span>
                  <strong className="info-val">09:00 AM – 12:30 PM</strong>
                </div>
                <div className="info-row">
                  <span className="info-label">Evening Hours</span>
                  <strong className="info-val">04:30 PM – 07:30 PM</strong>
                </div>
                <div className="info-row">
                  <span className="info-label">Night Curfew</span>
                  <strong className="info-val">10:00 PM Sharp</strong>
                </div>
                <div className="info-row">
                  <span className="info-label">Emergency Helpline</span>
                  <strong className="info-val">+91 12345 67890</strong>
                </div>
              </div>
            </div>

            <div className="dash-card">
              <div className="card-title-badge">
                <h3>Quick Actions</h3>
                <span className="status-badge paid">Instant</span>
              </div>
              <div className="warden-quick-actions-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
                <button type="button" className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }} onClick={() => setActiveTab('complaints')}>
                  <Icon name="complaint" width="16" height="16" /> Log Maintenance Ticket
                </button>
                <button type="button" className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }} onClick={() => setActiveTab('gatepass')}>
                  <Icon name="attendance" width="16" height="16" /> Apply Outing Gate Pass
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SETTINGS TAB */}
      {activeTab === 'settings' && (
        <div className="tab-pane animate-fade-in-slide-up">
          <div className="tab-header-box">
            <div className="tab-title-row">
              <div className="tab-title-with-icon">
                <div className="tab-icon-wrapper">
                  <Icon name="settings" width="22" height="22" />
                </div>
                <div>
                  <h2 className="tab-title">Account &amp; Profile Settings</h2>
                  <p className="tab-subtitle">Manage your personal information, emergency contact details, and hostel profile.</p>
                </div>
              </div>
            </div>
          </div>

          {savedSuccessMsg && (
            <div className="alert-success-box animate-fade-in">
              <Icon name="checkmark" width="18" height="18" />
              <span>{savedSuccessMsg}</span>
            </div>
          )}

          <div className="settings-container-grid">
            <div className="dash-card profile-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div className="profile-avatar-big" style={{ overflow: 'hidden', position: 'relative', width: '72px', height: '72px', borderRadius: '50%', background: 'linear-gradient(135deg, #1e6b51 0%, #10b981 100%)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  {profile?.photo ? (
                    <img src={profile.photo} alt="Profile" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <Icon name="user" width="32" height="32" />
                  )}
                </div>
                <div className="profile-card-details">
                  <h3>{profile?.fullName || 'Student'}</h3>
                  <span className="profile-roll">{profile?.rollNo || 'Resident'} &bull; Computer Science</span>
                  <span className="profile-badge-active">Active Student Resident</span>
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
                  {profile?.photo ? 'Change Photo' : 'Add Photo'}
                </button>

                {profile?.photo && (
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

            <div className="dash-card settings-form-card">
              <h3>Personal &amp; Contact Details</h3>
              <form onSubmit={handleSaveProfile} className="settings-form">
                <div className="form-grid-2col">
                  <label className="form-label">
                    Full Name
                    <input
                      type="text"
                      value={profileForm.fullName || ''}
                      onChange={(e) => {
                        setProfileForm({ ...profileForm, fullName: e.target.value });
                        setIsFormEdited(true);
                      }}
                      required
                    />
                  </label>

                  <label className="form-label">
                    Email Address
                    <input
                      type="email"
                      value={profileForm.email || ''}
                      onChange={(e) => {
                        setProfileForm({ ...profileForm, email: e.target.value });
                        setIsFormEdited(true);
                      }}
                      required
                    />
                  </label>

                  <label className="form-label">
                    Phone Number
                    <input
                      type="tel"
                      value={profileForm.phone || ''}
                      onChange={(e) => {
                        setProfileForm({ ...profileForm, phone: e.target.value });
                        setIsFormEdited(true);
                      }}
                      required
                    />
                  </label>

                  <label className="form-label">
                    Emergency Contact
                    <input
                      type="tel"
                      value={profileForm.emergencyContact || ''}
                      onChange={(e) => {
                        setProfileForm({ ...profileForm, emergencyContact: e.target.value });
                        setIsFormEdited(true);
                      }}
                      required
                    />
                  </label>

                  <label className="form-label">
                    Room Number
                    <input
                      type="text"
                      value={profileForm.room || ''}
                      onChange={(e) => {
                        setProfileForm({ ...profileForm, room: e.target.value });
                        setIsFormEdited(true);
                      }}
                      required
                    />
                  </label>

                  <label className="form-label">
                    Hostel Block
                    <input
                      type="text"
                      value={profileForm.block || ''}
                      onChange={(e) => {
                        setProfileForm({ ...profileForm, block: e.target.value });
                        setIsFormEdited(true);
                      }}
                      required
                    />
                  </label>
                </div>

                <div className="form-actions-right">
                  <button type="submit" className="btn-save-profile">
                    Save Profile Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODALS */}
      {showPayModal && (
        <div className="modal-backdrop modal-pay-fee animate-fade-in">
          <div className="modal-box animate-scale-in">
            <h3>Pay Fee Dues</h3>
            {isProcessingPayment ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '30px 0', gap: '16px' }}>
                <div style={{ width: '40px', height: '40px', border: '4px solid rgba(16, 185, 129, 0.2)', borderTopColor: '#10b981', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                <p style={{ fontWeight: 600, color: '#557162', margin: 0 }}>Processing secure payment...</p>
              </div>
            ) : (
              <form onSubmit={handlePayFee}>
                <label className="form-label">
                  Payment Category
                  <select
                    value={paymentPeriod}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPaymentPeriod(val);
                      if (val === 'Hostel Fee') {
                        setPayAmount(feeDetails.dueFee.toString());
                      } else if (val === 'Mess Fee') {
                        setPayAmount('3000.00');
                      } else if (val === 'Utility Bill') {
                        setPayAmount('800.00');
                      } else if (val === 'Amenity Fee') {
                        setPayAmount('1200.00');
                      } else {
                        setPayAmount('1000.00');
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      backgroundColor: '#ffffff',
                      color: '#1e293b',
                      fontSize: '14px',
                      fontWeight: 500,
                      marginTop: '6px',
                      marginBottom: '14px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="Hostel Fee">Hostel Fee (Dues: ₹{feeDetails.dueFee})</option>
                    <option value="Mess Fee">Mess Fee</option>
                    <option value="Utility Bill">Utility Bill (Electricity, Water, Wifi)</option>
                    <option value="Amenity Fee">Amenity Fee (Gym, Laundry)</option>
                    <option value="Other Charges">Other Charges</option>
                  </select>
                </label>

                <label className="form-label">
                  Amount (₹)
                  <input
                    type="number"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    required
                  />
                </label>
                
                <div className="payment-options" style={{ display: 'flex', gap: '20px', margin: '16px 0' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="paymentMethod" 
                      checked={paymentMethod === 'card'} 
                      onChange={() => setPaymentMethod('card')} 
                    /> 
                    Credit / Debit Card
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="paymentMethod" 
                      checked={paymentMethod === 'upi'} 
                      onChange={() => setPaymentMethod('upi')} 
                    /> 
                    UPI ID
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="paymentMethod" 
                      checked={paymentMethod === 'qr'} 
                      onChange={() => setPaymentMethod('qr')} 
                    /> 
                    QR Code
                  </label>
                </div>

                {paymentMethod === 'card' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                    <label className="form-label" style={{ margin: 0 }}>
                      Cardholder Name
                      <input
                        type="text"
                        placeholder="Enter the cardholder name"
                        value={cardDetails.name}
                        onChange={(e) => setCardDetails({ ...cardDetails, name: e.target.value })}
                        required
                      />
                    </label>
                    <label className="form-label" style={{ margin: 0 }}>
                      Card Number
                      <input
                        type="text"
                        maxLength="19"
                        placeholder="Enter the 16 digit card number"
                        value={cardDetails.number}
                        onChange={(e) => setCardDetails({ ...cardDetails, number: e.target.value })}
                        required
                      />
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <label className="form-label" style={{ margin: 0 }}>
                        Expiry Date
                        <input
                          type="text"
                          maxLength="5"
                          placeholder="Enter the expiry date (MM/YY)"
                          value={cardDetails.expiry}
                          onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value })}
                          required
                        />
                      </label>
                      <label className="form-label" style={{ margin: 0 }}>
                        CVV
                        <input
                          type="password"
                          maxLength="3"
                          placeholder="Enter the 3 digit CVV"
                          value={cardDetails.cvv}
                          onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value })}
                          required
                        />
                      </label>
                    </div>
                  </div>
                )}

                {paymentMethod === 'upi' && (
                  <div style={{ marginBottom: '16px' }}>
                    <label className="form-label">
                      UPI ID
                      <input
                        type="text"
                        placeholder="Enter the UPI ID (username@upi)"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        required
                      />
                    </label>
                  </div>
                )}

                {paymentMethod === 'qr' && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginBottom: '16px', padding: '10px', background: '#f9fbf9', borderRadius: '14px', border: '1px solid #e1e9e2' }}>
                    <p style={{ margin: 0, fontSize: '13px', color: '#557162', textAlign: 'center' }}>
                      Scan the QR code with GPay, PhonePe, or any UPI app to pay ₹{payAmount}.
                    </p>
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=smarthostel@upi%26pn=SmartHostel%26am=${payAmount}%26cu=INR`}
                      alt="Payment QR Code" 
                      style={{ width: '150px', height: '150px', border: '4px solid #ffffff', borderRadius: '8px', boxShadow: '0 4px 12px rgba(18, 55, 38, 0.08)' }} 
                    />
                    <p style={{ margin: 0, fontSize: '12px', color: '#8ca295', fontStyle: 'italic' }}>
                      UPI ID: smarthostel@upi
                    </p>
                  </div>
                )}

                <div className="modal-actions" style={{ marginTop: '24px' }}>
                  <button type="button" className="btn-secondary" onClick={() => setShowPayModal(false)}>Cancel</button>
                  <button type="submit" className="btn-pay-fee">Pay Now</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {showComplaintModal && (
        <div className="modal-backdrop modal-report-problem animate-fade-in">
          <div className="modal-box animate-scale-in">
            <h3>Report a Maintenance Problem</h3>
            <form onSubmit={handleAddComplaint}>
              <label className="form-label">
                Category
                <select
                  value={newComplaint.category}
                  onChange={(e) => setNewComplaint({ ...newComplaint, category: e.target.value })}
                >
                  <option value="Electrical">Electrical</option>
                  <option value="Plumbing">Plumbing</option>
                  <option value="Furniture">Furniture</option>
                  <option value="Cleaning">Cleaning</option>
                  <option value="Internet">Internet</option>
                  <option value="Other">Other</option>
                </select>
              </label>

              {newComplaint.category === 'Other' && (
                <label className="form-label">
                  Specify Category
                  <input
                    type="text"
                    placeholder="Enter the custom category"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    required
                  />
                </label>
              )}

              <label className="form-label">
                Problem Description
                <input
                  type="text"
                  placeholder="Enter the problem details"
                  value={newComplaint.title}
                  onChange={(e) => setNewComplaint({ ...newComplaint, title: e.target.value })}
                  required
                />
              </label>

              <label className="form-label">
                Priority Level
                <select
                  value={newComplaint.priority}
                  onChange={(e) => setNewComplaint({ ...newComplaint, priority: e.target.value })}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </label>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowComplaintModal(false)}>Cancel</button>
                <button type="submit" className="btn-report-problem">Submit Ticket</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showGatePassModal && (
        <div className="modal-backdrop modal-ask-gatepass animate-fade-in">
          <div className="modal-box animate-scale-in">
            <h3>Request Gate Outing Pass</h3>
            <form onSubmit={handleAddGatePass}>
              <label className="form-label">
                Reason for Outing
                <input
                  type="text"
                  placeholder="Enter the reason for outing"
                  value={newGatePass.reason}
                  onChange={(e) => setNewGatePass({ ...newGatePass, reason: e.target.value })}
                  required
                />
              </label>

              <label className="form-label">
                Departure Time
                <input
                  type="datetime-local"
                  value={newGatePass.departure}
                  onChange={(e) => setNewGatePass({ ...newGatePass, departure: e.target.value })}
                  required
                />
              </label>

              <label className="form-label">
                Expected Return Time
                <input
                  type="datetime-local"
                  value={newGatePass.returnDate}
                  onChange={(e) => setNewGatePass({ ...newGatePass, returnDate: e.target.value })}
                  required
                />
              </label>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowGatePassModal(false)}>Cancel</button>
                <button type="submit" className="btn-ask-gatepass">Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
