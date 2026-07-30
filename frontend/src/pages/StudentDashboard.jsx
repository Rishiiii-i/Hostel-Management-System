import './StudentDashboard.css'
import { useState, useRef, useEffect } from 'react'
import Icon from '../components/Icon'
import { useAuth } from '../context/AuthContext'
import Chat from './chat/Chat'

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function StudentDashboard({ activeTab = 'overview', setActiveTab, profile, setProfile }) {
  const { user, updateProfileName, updateUserData, logOut } = useAuth()
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

  // reset edit status when changing tabs
  useEffect(() => {
    setIsFormEdited(false);
  }, [activeTab]);

  // sync profile form without losing edits
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
  const [showRazorpaySimulator, setShowRazorpaySimulator] = useState(false)
  const [simulatorMethod, setSimulatorMethod] = useState('upi')
  const [simCardNumber, setSimCardNumber] = useState('')
  const [simCardExpiry, setSimCardExpiry] = useState('')
  const [simCardCvv, setSimCardCvv] = useState('')
  const [simUpiAddress, setSimUpiAddress] = useState('')
  const [paymentStep, setPaymentStep] = useState('form') // 'form', 'otp', 'success'
  const [otpCode, setOtpCode] = useState('')
  const [receiptData, setReceiptData] = useState(null)
  const [cardFlip, setCardFlip] = useState(false)
  const [isToggling2FA, setIsToggling2FA] = useState(false)
  const [twoFactorMessage, setTwoFactorMessage] = useState('')

  const handleToggle2FA = async () => {
    setIsToggling2FA(true);
    setTwoFactorMessage('');
    const targetState = !profile?.is2FAEnabled;
    try {
      const response = await fetchWithAuth('http://localhost:5000/api/student/toggle-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is2FAEnabled: targetState })
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to toggle 2FA status');
      }

      // Update the user profile locally
      const updatedProfile = { ...profile, is2FAEnabled: targetState };
      setProfile(updatedProfile);
      updateUserData({ is2FAEnabled: targetState });

      if (targetState) {
        // Turning ON 2FA: start 3s logout countdown
        let seconds = 3;
        setTwoFactorMessage(`2FA successfully enabled! Logging out in ${seconds} seconds...`);
        const interval = setInterval(() => {
          seconds -= 1;
          if (seconds > 0) {
            setTwoFactorMessage(`2FA successfully enabled! Logging out in ${seconds} seconds...`);
          } else {
            clearInterval(interval);
            logOut(true, '#login'); // logout without confirmation popup and redirect to login page
          }
        }, 1000);
      } else {
        // Turning OFF 2FA: just show success message
        setTwoFactorMessage('2FA has been successfully disabled.');
        setTimeout(() => setTwoFactorMessage(''), 4000);
      }
    } catch (err) {
      alert(err.message || 'An error occurred while changing 2FA settings.');
    } finally {
      setIsToggling2FA(false);
    }
  };

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

  // sync local fee states when profile prop changes (eg background sidebar fetch)
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

  // get dashboard data from server on startup
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!user || !token) return;

    let active = true;
    const loadDashboardData = async () => {
      setLoadingData(true);
      try {
        // get student profile
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
            photo: profileData.photo || '',
            feeStatus: profileData.feeStatus || 'Unpaid',
            totalFee: totalF,
            paidFee: paidF,
            dueFee: dueF,
            notifications: profileData.notifications || [],
            is2FAEnabled: profileData.is2FAEnabled || false
          };
          if (setProfile) setProfile(mappedProfile);
          localStorage.setItem('shm_user_profile', JSON.stringify(mappedProfile));
        }

        // get student complaints
        const complaintsRes = await fetchWithAuth('http://localhost:5000/api/student/complaints');
        if (complaintsRes.ok && active) {
          const complaintsData = await complaintsRes.json();
          setComplaints(complaintsData);
        }

        // get student gate passes
        const gatePassesRes = await fetchWithAuth('http://localhost:5000/api/student/gatepasses');
        if (gatePassesRes.ok && active) {
          const gatePassesData = await gatePassesRes.json();
          setGatePasses(gatePassesData);
        }

        // get student payment transactions
        const transactionsRes = await fetchWithAuth('http://localhost:5000/api/student/transactions');
        if (transactionsRes.ok && active) {
          const transactionsData = await transactionsRes.json();
          setTransactions(transactionsData);
        }

        // get weekly mess menu
        const messMenuRes = await fetchWithAuth('http://localhost:5000/api/student/mess/menu');
        if (messMenuRes.ok && active) {
          const messMenuData = await messMenuRes.json();
          setMessMenu(messMenuData);
        }

        // get notices
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

        // get student attendance stats
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

  // upload student photo
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
        // save changes to database
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

  // remove student photo
  const handleRemovePhoto = async () => {
    const updated = { ...(profile || {}), photo: '' }
    if (setProfile) setProfile(updated)
    setProfileForm(prev => ({ ...prev, photo: '' }))
    try {
      localStorage.setItem('shm_user_profile', JSON.stringify(updated))
      // save changes to database
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

  // save profile details
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

  // submit new complaint
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

  // request gate pass
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

  // download payment receipt as pdf
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
    setPaymentStep('form');
    setOtpCode('');
    setReceiptData(null);
    setCardFlip(false);
    setShowPayModal(true);
  };

  const handleSimulatorSuccess = async () => {
    const paymentId = `pay_sim_${Math.floor(100000 + Math.random() * 900000)}`;
    setIsProcessingPayment(true);
    setShowRazorpaySimulator(false);
    try {
      const res = await fetchWithAuth('http://localhost:5000/api/student/transactions', {
        method: 'POST',
        body: JSON.stringify({
          amount: payAmount,
          period: paymentPeriod,
          paymentId: paymentId
        })
      });
      if (res.ok) {
        const saved = await res.json();
        setTransactions([saved, ...transactions]);
        setReceiptData(saved);
        
        const amountPaid = Number(payAmount) || 0;
        
        if (['Hostel Fee', 'Mess Fee', 'Utility Bill', 'Amenity Fee', 'Other Charges'].includes(paymentPeriod)) {
          setFeeDetails(prev => {
            const newPaid = prev.paidFee + amountPaid;
            const newDue = Math.max(0, prev.totalFee - newPaid);
            const isCleared = newDue <= 0;
            const nextStatus = isCleared ? 'Paid' : (newPaid > 0 ? 'Partial' : 'Unpaid');
            
            setFeePaid(isCleared);

            const updatedProfile = {
              ...profile,
              paidFee: newPaid,
              dueFee: newDue,
              feeStatus: nextStatus
            };
            if (setProfile) setProfile(updatedProfile);
            localStorage.setItem('shm_user_profile', JSON.stringify(updatedProfile));
            
            return {
              ...prev,
              paidFee: newPaid,
              dueFee: newDue,
              feeStatus: nextStatus
            };
          });
        }
        setPaymentStep('success');
        window.dispatchEvent(new CustomEvent('shm:new_notification', {
          detail: {
            notification: {
              title: 'Fee Payment Completed',
              body: `Payment of ₹${payAmount} transacted successfully via Razorpay.`
            },
            data: { type: 'fee', targetScreen: 'fee', targetHash: '#dashboard' }
          }
        }));
      } else {
        const errData = await res.json();
        alert(errData.message || 'Failed to process payment.');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to connect to backend server for verification.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handlePayFee = async (e) => {
    if (e) e.preventDefault();
    
    setIsProcessingPayment(true);
    
    let razorpayKey = 'rzp_test_HILw76iG5K3s2f';
    try {
      const keyRes = await fetch('http://localhost:5000/api/payment/key');
      if (keyRes.ok) {
        const keyData = await keyRes.json();
        if (keyData.key) razorpayKey = keyData.key;
      }
    } catch (keyErr) {
      console.warn('Failed to fetch Razorpay key from backend, using default dummy key.', keyErr);
    }

    if (razorpayKey === 'rzp_test_HILw76iG5K3s2f') {
      setIsProcessingPayment(false);
      setShowPayModal(false);
      setShowRazorpaySimulator(true);
      return;
    }

    const loaded = await loadRazorpayScript();
    if (!loaded) {
      alert('Razorpay Checkout SDK failed to load. Are you connected to the internet?');
      setIsProcessingPayment(false);
      return;
    }

    const options = {
      key: razorpayKey,
      amount: Math.round(Number(payAmount) * 100),
      currency: 'INR',
      name: 'Smart Hostel System',
      description: `${paymentPeriod} Checkout`,
      image: 'https://cdn-icons-png.flaticon.com/512/1042/1042308.png',
      handler: async function (response) {
        const paymentId = response.razorpay_payment_id;
        try {
          const res = await fetchWithAuth('http://localhost:5000/api/student/transactions', {
            method: 'POST',
            body: JSON.stringify({
              amount: payAmount,
              period: paymentPeriod,
              paymentId: paymentId
            })
          });
          if (res.ok) {
            const saved = await res.json();
            setTransactions([saved, ...transactions]);
            setReceiptData(saved);
            
            const amountPaid = Number(payAmount) || 0;
            
            if (['Hostel Fee', 'Mess Fee', 'Utility Bill', 'Amenity Fee', 'Other Charges'].includes(paymentPeriod)) {
              setFeeDetails(prev => {
                const newPaid = prev.paidFee + amountPaid;
                const newDue = Math.max(0, prev.totalFee - newPaid);
                const isCleared = newDue <= 0;
                const nextStatus = isCleared ? 'Paid' : (newPaid > 0 ? 'Partial' : 'Unpaid');
                
                setFeePaid(isCleared);

                const updatedProfile = {
                  ...profile,
                  paidFee: newPaid,
                  dueFee: newDue,
                  feeStatus: nextStatus
                };
                if (setProfile) setProfile(updatedProfile);
                localStorage.setItem('shm_user_profile', JSON.stringify(updatedProfile));
                
                return {
                  ...prev,
                  paidFee: newPaid,
                  dueFee: newDue,
                  feeStatus: nextStatus
                };
              });
            }
            setPaymentStep('success');
            window.dispatchEvent(new CustomEvent('shm:new_notification', {
              detail: {
                notification: {
                  title: 'Fee Payment Completed',
                  body: `Payment of ₹${payAmount} transacted successfully via Razorpay.`
                },
                data: { type: 'fee', targetScreen: 'fee', targetHash: '#dashboard' }
              }
            }));
          } else {
            const errData = await res.json();
            alert(errData.message || 'Failed to process payment.');
          }
        } catch (err) {
          console.error(err);
          alert('Failed to connect to backend server for verification.');
        } finally {
          setIsProcessingPayment(false);
        }
      },
      prefill: {
        name: profile?.fullName || profile?.name || 'Student',
        email: profile?.email || ''
      },
      theme: {
        color: '#10b981'
      },
      modal: {
        ondismiss: function () {
          setIsProcessingPayment(false);
        }
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  return (
    <div className="student-dashboard-page">
      {/* overview tab */}
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

      {/* my room tab */}
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
                <span className={`status-badge ${feePaid ? 'paid' : 'pending'}`}>{feePaid ? 'Occupied' : 'Pending'}</span>
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
                  <strong className="info-val">{profile?.room ? (profile?.bedPosition || 'Bed A') : 'N/A'}</strong>
                </div>
                <div className="info-row">
                  <span className="info-label">Floor Level</span>
                  <strong className="info-val">{profile?.room ? (profile?.floor || '1st Floor') : 'N/A'}</strong>
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
                  <strong className="info-val">{profile?.room ? (feePaid ? 'Room Allocated' : 'Pending Payment') : 'Not Assigned'}</strong>
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

      {/* fees & payments tab */}
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

      {/* complaints tab */}
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

      {/* gate pass & attendance tab */}
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

      {/* notices tab */}
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

      {/* warden desk tab */}
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

      {/* chat tab */}
      {activeTab === 'chat' && (
        <Chat />
      )}

      {/* settings tab */}
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
                  {profile?.photo && (profile.photo.startsWith('data:image') || profile.photo.startsWith('http') || profile.photo.startsWith('/')) ? (
                    <img src={profile.photo} alt="Profile" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <Icon name="user" width="32" height="32" />
                  )}
                </div>
                <div className="profile-card-details">
                  <h3>{profile?.fullName || 'Student'}</h3>
                  <span className="profile-roll">{profile?.rollNo || 'Resident'}</span>
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

            <div className="dash-card" style={{ display: 'flex', flexDirection: 'column', padding: '12px 20px', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ padding: '6px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.1)', display: 'grid', placeItems: 'center' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary, #1e293b)' }}>2-Factor Authentication (2FA):</span>
                  <span className={profile?.is2FAEnabled ? "profile-badge-active" : ""} style={{ backgroundColor: profile?.is2FAEnabled ? '#d1fae5' : '#f1f5f9', color: profile?.is2FAEnabled ? '#065f46' : '#64748b', padding: '2px 8px', borderRadius: '99px', fontSize: '10.5px', fontWeight: 800 }}>
                    {profile?.is2FAEnabled ? 'ENABLED' : 'DISABLED'}
                  </span>
                </div>
                <button
                  type="button"
                  disabled={isToggling2FA}
                  onClick={handleToggle2FA}
                  style={{
                    background: profile?.is2FAEnabled ? '#fee2e2' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: profile?.is2FAEnabled ? '#dc2626' : '#ffffff',
                    border: profile?.is2FAEnabled ? '1px solid #fecaca' : 'none',
                    padding: '6px 14px',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '12.5px',
                    cursor: 'pointer',
                    boxShadow: profile?.is2FAEnabled ? 'none' : '0 3px 8px rgba(16, 185, 129, 0.15)',
                    transition: 'all 0.2s ease',
                    opacity: isToggling2FA ? 0.7 : 1
                  }}
                >
                  {profile?.is2FAEnabled ? 'Disable' : 'Enable'}
                </button>
              </div>
              {twoFactorMessage && (
                <div className="alert-success-box animate-fade-in" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', backgroundColor: '#ecfdf5', border: '1px solid #10b981', borderRadius: '8px', color: '#065f46', fontSize: '12.5px', margin: '4px 0 0 0' }}>
                  <Icon name="checkmark" width="14" height="14" />
                  <span>{twoFactorMessage}</span>
                </div>
              )}
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

      {/* modals */}
      {showPayModal && (
        <div className="modal-backdrop modal-pay-fee animate-fade-in" style={{ zIndex: 10000 }}>
          <div className="modal-box animate-scale-in" style={{ maxWidth: '520px', borderRadius: '24px', padding: '32px', border: '1px solid #e2e8f0', boxShadow: '0 20px 40px rgba(15,23,42,0.1)' }}>
            
            {/* Payment Headers */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>Secure Checkout</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>Powered by SmartPay Gateway</p>
              </div>
              <button 
                onClick={() => { setShowPayModal(false); setPaymentStep('form'); }}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#94a3b8' }}
              >
                ✕
              </button>
            </div>

            {isProcessingPayment ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0', gap: '20px' }}>
                <div className="spinner-loader" style={{ width: '48px', height: '48px', border: '4px solid rgba(16, 185, 129, 0.1)', borderTopColor: '#10b981', borderRadius: '50%', animation: 'spin-loader 0.8s linear infinite' }}></div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontWeight: 700, color: '#1e293b', margin: 0, fontSize: '15px' }}>Verifying Transaction Details...</p>
                  <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: '#64748b' }}>Please do not close this window or refresh the page.</p>
                </div>
                <style>{`
                  @keyframes spin-loader { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                `}</style>
              </div>
            ) : paymentStep === 'form' ? (
              <form onSubmit={handlePayFee}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <label className="form-label" style={{ margin: 0 }}>
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
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', fontSize: '14px', marginTop: '6px', outline: 'none' }}
                    >
                      <option value="Hostel Fee">Hostel Fee (Dues: ₹{feeDetails.dueFee})</option>
                      <option value="Mess Fee">Mess Fee</option>
                      <option value="Utility Bill">Utility Bill (Electricity, Water, Wifi)</option>
                      <option value="Amenity Fee">Amenity Fee (Gym, Laundry)</option>
                      <option value="Other Charges">Other Charges</option>
                    </select>
                  </label>

                  <label className="form-label" style={{ margin: 0 }}>
                    Amount (₹)
                    <input
                      type="number"
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      required
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', marginTop: '6px', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </label>
                </div>
                
                {/* Razorpay Integration Info */}
                <div style={{ marginTop: '24px', padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                  <img src="https://razorpay.com/assets/razorpay-glyph.svg" alt="Razorpay Logo" style={{ height: '24px', margin: '0 auto 10px auto', display: 'block' }} />
                  <p style={{ margin: 0, fontSize: '13px', color: '#475569', fontWeight: 500 }}>
                    Safe & Secure transaction processed via Razorpay Secure Gateway.
                  </p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#94a3b8' }}>
                    Supports Cards, UPI, Netbanking, and Wallets
                  </p>
                </div>

                <div className="modal-actions" style={{ marginTop: '28px', display: 'flex', gap: '12px' }}>
                  <button type="button" className="btn-secondary" onClick={() => setShowPayModal(false)} style={{ flex: 1, padding: '12px', borderRadius: '10px' }}>Cancel</button>
                  <button type="submit" className="btn-pay-fee" style={{ flex: 1, padding: '12px', borderRadius: '10px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#ffffff', fontWeight: 600, border: 'none', cursor: 'pointer' }}>Proceed to Payment</button>
                </div>
              </form>
            ) : (
              // Styled Success Receipt Block
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ textAlign: 'center', padding: '10px 0' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', borderRadius: '50%', background: '#d1fae5', color: '#10b981', fontSize: '24px', marginBottom: '14px', animation: 'scaleUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>✓</div>
                  <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#065f46' }}>Payment Approved!</h4>
                  <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>Your receipt has been generated successfully.</p>
                </div>

                {/* Printable Invoice Details */}
                <div id="payment-invoice-receipt" style={{ background: '#f8fafc', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', fontFamily: 'monospace', fontSize: '12px', color: '#334155', display: 'flex', flexDirection: 'column', gap: '10px', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.01)' }}>
                  <div style={{ textAlign: 'center', borderBottom: '1px dashed #cbd5e1', paddingBottom: '12px', marginBottom: '6px' }}>
                    <strong style={{ fontSize: '13px', color: '#0f172a' }}>SMART HOSTEL SYSTEM</strong>
                    <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>OFFICIAL TRANSACTION INVOICE</div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>RECEIPT ID:</span>
                    <strong>{receiptData?.id || 'TXN-UNKNOWN'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>DATE & TIME:</span>
                    <strong>{receiptData?.date || new Date().toISOString().split('T')[0]}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>STUDENT EMAIL:</span>
                    <strong>{receiptData?.studentEmail || profile.email}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>PAYMENT CATEGORY:</span>
                    <strong>{receiptData?.period || paymentPeriod}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>METHOD:</span>
                    <strong style={{ textTransform: 'uppercase' }}>{paymentMethod} checkout</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>GATEWAY STATUS:</span>
                    <strong style={{ color: '#10b981' }}>PAID / SETTLED</strong>
                  </div>
                  <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '12px', marginTop: '6px', display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#0f172a' }}>
                    <strong>AMOUNT TRANSACTED:</strong>
                    <strong>{receiptData?.amount || `₹${payAmount}`}</strong>
                  </div>
                </div>

                <div className="modal-actions" style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                  <button 
                    type="button" 
                    onClick={() => {
                      const printContent = document.getElementById('payment-invoice-receipt').innerHTML;
                      const originalContent = document.body.innerHTML;
                      const printWindow = window.open('', '', 'height=500,width=500');
                      printWindow.document.write('<html><head><title>Receipt Print</title>');
                      printWindow.document.write('</head><body style="font-family:monospace;padding:30px;">');
                      printWindow.document.write(printContent);
                      printWindow.document.write('</body></html>');
                      printWindow.document.close();
                      printWindow.print();
                    }}
                    style={{ flex: 1, padding: '12px', borderRadius: '10px', background: '#f1f5f9', color: '#475569', fontWeight: 600, border: '1px solid #cbd5e1', cursor: 'pointer' }}
                  >
                    Print Receipt
                  </button>
                  <button 
                    type="button" 
                    className="btn-pay-fee" 
                    onClick={() => { setShowPayModal(false); setPaymentStep('form'); }} 
                    style={{ flex: 1, padding: '12px', borderRadius: '10px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#ffffff', fontWeight: 600, border: 'none', cursor: 'pointer' }}
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
          <style>{`
            @keyframes scan-line {
              0% { top: 0%; }
              50% { top: 100%; }
              100% { top: 0%; }
            }
            @keyframes scaleUp {
              from { transform: scale(0.8); opacity: 0; }
              to { transform: scale(1); opacity: 1; }
            }
          `}</style>
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
                  <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#94a3b8' }}>{paymentPeriod} Checkout</p>
                </div>
              </div>
              <div style={{ marginTop: '16px', fontSize: '20px', fontWeight: 700 }}>
                ₹{parseFloat(payAmount).toLocaleString()}
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
                Pay ₹{parseFloat(payAmount).toLocaleString()}
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
