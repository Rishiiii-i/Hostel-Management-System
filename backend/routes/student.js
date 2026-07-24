import express from 'express';
import mongoose from 'mongoose';
import { User, GatePass, Complaint, Notice, Transaction, WardenProfile, MessMenu, Attendance } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import { FCMService } from '../services/fcmService.js';
import { notificationQueue } from '../services/notificationQueue.js';

const router = express.Router();

// Check if MongoDB is connected
function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

// Get student profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.status(200).json({ email: req.user.email, name: req.user.name });
    }
    const user = await User.findOne({ email: req.user.email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let wardenInfo = {
      fullName: 'Dileep',
      phone: '+91 987654321',
      emergencyContact: '+91 123456789'
    };

    const warden = await WardenProfile.findOne();
    if (warden) {
      wardenInfo = {
        fullName: warden.fullName || 'Dileep',
        phone: warden.phone || '+91 987654321',
        emergencyContact: warden.emergencyContact || warden.phone || '+91 123456789'
      };
    }

    let roomStudentsCount = 0;
    if (user.room) {
      roomStudentsCount = await User.countDocuments({ room: user.room, block: user.block });
    }

    const responseObj = user.toObject();
    responseObj.wardenInfo = wardenInfo;
    responseObj.roomStudentsCount = roomStudentsCount;

    res.status(200).json(responseObj);
  } catch (error) {
    console.error('Failed to fetch student profile:', error);
    res.status(500).json({ message: 'Failed to fetch student profile' });
  }
});

// Update student profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, rollNo, phone, emergencyContact, room, block, photo } = req.body;
    
    if (!isDbConnected()) {
      return res.status(200).json({ name, rollNo, phone, emergencyContact, room, block, photo });
    }
    const user = await User.findOneAndUpdate(
      { email: req.user.email.toLowerCase() },
      { 
        name, 
        rollNo, 
        phone, 
        emergencyContact, 
        room, 
        block, 
        photo 
      },
      { returnDocument: 'after' }
    );
    res.status(200).json(user);
  } catch (error) {
    console.error('Failed to update student profile:', error);
    res.status(500).json({ message: 'Failed to update student profile' });
  }
});

// Get all student complaints
router.get('/complaints', authenticateToken, async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.status(200).json([]);
    }
    const list = await Complaint.find({ studentEmail: req.user.email.toLowerCase() }).sort({ createdAt: -1 });
    res.status(200).json(list);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch complaints list' });
  }
});

// Add new complaint
router.post('/complaints', authenticateToken, async (req, res) => {
  try {
    const { category, title, priority } = req.body;
    
    if (!isDbConnected()) {
      return res.status(503).json({ message: 'Database disconnected.' });
    }

    const student = await User.findOne({ email: req.user.email.toLowerCase() });
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found in database.' });
    }
    
    const newComplaintData = {
      id: `REQ-${Math.floor(100 + Math.random() * 900)}`,
      studentName: student.name,
      studentEmail: student.email.toLowerCase(),
      room: student.room || 'N/A',
      category,
      title,
      priority,
      status: 'Pending',
      date: new Date().toISOString().split('T')[0]
    };

    const complaint = new Complaint(newComplaintData);
    await complaint.save();

    notificationQueue.enqueue({
      type: 'ROLE',
      target: 'warden',
      payload: {
        title: 'New Student Complaint',
        body: `${student.name} (${student.room || 'N/A'}) submitted: "${title}"`,
        notificationType: 'COMPLAINT_SUBMITTED',
        targetHash: '#warden-dashboard',
        targetTab: 'complaints',
        data: { type: 'complaint', id: complaint.id }
      }
    });

    res.status(201).json(complaint);
  } catch (error) {
    console.error('Failed to register new complaint:', error);
    res.status(500).json({ message: 'Failed to register new complaint', error: error.message });
  }
});

// Get student gate passes
router.get('/gatepasses', authenticateToken, async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.status(200).json([]);
    }
    const list = await GatePass.find({ studentEmail: req.user.email.toLowerCase() }).sort({ createdAt: -1 });
    res.status(200).json(list);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch gate passes' });
  }
});

// Add new gate pass request
router.post('/gatepasses', authenticateToken, async (req, res) => {
  try {
    const { reason, departure, returnDate } = req.body;
    
    if (!isDbConnected()) {
      return res.status(503).json({ message: 'Database disconnected.' });
    }

    const student = await User.findOne({ email: req.user.email.toLowerCase() });
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found in database.' });
    }
    
    const newPassData = {
      id: `GP-${Math.floor(100 + Math.random() * 900)}`,
      studentName: student.name,
      studentEmail: student.email.toLowerCase(),
      rollNo: student.rollNo || '',
      room: student.room || 'N/A',
      reason,
      departure,
      returnDate,
      status: 'Pending'
    };

    const gatePass = new GatePass(newPassData);
    await gatePass.save();

    notificationQueue.enqueue({
      type: 'ROLE',
      target: 'warden',
      payload: {
        title: 'New Gate Pass Request',
        body: `${student.name} requested leave for "${reason}"`,
        notificationType: 'GATE_PASS_SUBMITTED',
        targetHash: '#warden-dashboard',
        targetTab: 'leave',
        data: { type: 'gatepass', id: gatePass.id }
      }
    });

    res.status(201).json(gatePass);
  } catch (error) {
    console.error('Failed to submit gate pass request:', error);
    res.status(500).json({ message: 'Failed to submit gate pass request', error: error.message });
  }
});

// Get notices for the student
router.get('/notices', authenticateToken, async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.status(200).json([]);
    }
    const student = await User.findOne({ email: req.user.email.toLowerCase() });
    const query = {
      $or: [
        { targetBlock: 'All Blocks' },
        { targetStudentEmail: req.user.email.toLowerCase() }
      ]
    };
    if (student && student.block) {
      query.$or.push({ targetBlock: student.block });
    }
    const notices = await Notice.find(query).sort({ createdAt: -1 });
    res.status(200).json(notices);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch notice board announcements' });
  }
});

// Get student transactions
router.get('/transactions', authenticateToken, async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.status(200).json([]);
    }
    const list = await Transaction.find({ studentEmail: req.user.email.toLowerCase() }).sort({ createdAt: -1 });
    res.status(200).json(list);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch transactions list' });
  }
});

// Add a payment transaction
router.post('/transactions', authenticateToken, async (req, res) => {
  try {
    const { amount, period } = req.body;
    const parsedAmount = Number(amount) || 0;
    
    if (!isDbConnected()) {
      return res.status(503).json({ message: 'Database disconnected.' });
    }

    const student = await User.findOne({ email: req.user.email.toLowerCase() });
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found in database.' });
    }

    const newTxnData = {
      id: `TXN-${Math.floor(1000 + Math.random() * 9000)}`,
      studentEmail: student.email.toLowerCase(),
      period: period || 'Hostel Fee',
      amount: `₹${parsedAmount}`,
      date: new Date().toISOString().split('T')[0],
      status: 'Paid'
    };

    const txn = new Transaction(newTxnData);
    if (student) {
      const currentPaid = student.paidFee || 0;
      student.paidFee = currentPaid + parsedAmount;
      student.dueFee = Math.max(0, (student.totalFee || 45000) - student.paidFee);
      student.feeStatus = student.dueFee <= 0 ? 'Paid' : (student.paidFee > 0 ? 'Partial' : 'Unpaid');
      await student.save();

      // Dispatch notifications to Warden and Admin
      try {
        const payNotification = {
          id: `NT-${Math.floor(1000 + Math.random() * 9000)}`,
          title: 'Student Fee Payment Received',
          text: `Student ${student.name} (${student.email}) has successfully paid ₹${parsedAmount} for ${period || 'Hostel Fee'}.`,
          time: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          read: false
        };

        // Notify Warden
        const warden = await User.findOne({ email: 'warden@smarthostel.com' });
        if (warden) {
          warden.notifications.unshift(payNotification);
          warden.markModified('notifications');
          await warden.save();
        }

        // Notify Admin
        const admin = await User.findOne({ email: 'admin@smarthostel.com' });
        if (admin) {
          admin.notifications.unshift(payNotification);
          admin.markModified('notifications');
          await admin.save();
        }

        notificationQueue.enqueue({
          type: 'ROLE',
          target: 'warden',
          payload: {
            title: payNotification.title,
            body: payNotification.text,
            notificationType: 'PAYMENT_CONFIRMATION',
            targetHash: '#warden-dashboard',
            targetTab: 'fee',
            data: { type: 'fee_payment' }
          }
        });

        notificationQueue.enqueue({
          type: 'ROLE',
          target: 'administrator',
          payload: {
            title: payNotification.title,
            body: payNotification.text,
            notificationType: 'PAYMENT_CONFIRMATION',
            targetHash: '#admin-dashboard',
            targetTab: 'fee',
            data: { type: 'fee_payment' }
          }
        });
      } catch (notifErr) {
        console.error('Failed to dispatch fee notifications to admin/warden:', notifErr);
      }

    res.status(201).json(txn);
  } catch (error) {
    console.error('Error in POST /transactions:', error);
    res.status(500).json({ message: 'Failed to record payment transaction', error: error.message });
  }
});

// Mark notifications as read
router.post('/notifications/read', authenticateToken, async (req, res) => {
  try {
    if (!isDbConnected()) return res.status(200).json({ message: 'Success' });
    
    const { category } = req.body;
    
    if (category) {
      const keyword = category.toLowerCase();
      const user = await User.findOne({ email: req.user.email.toLowerCase() });
      if (user && user.notifications) {
        user.notifications.forEach(n => {
          const title = (n.title || '').toLowerCase();
          if (keyword === 'room' && title.includes('room')) {
            n.read = true;
          } else if (keyword === 'gatepass' && (title.includes('gate pass') || title.includes('pass'))) {
            n.read = true;
          } else if (keyword === 'complaint' && title.includes('complaint')) {
            n.read = true;
          } else if (keyword === 'notice') {
            if (title.includes('notice') || (!title.includes('room') && !title.includes('gate pass') && !title.includes('pass') && !title.includes('complaint'))) {
              n.read = true;
            }
          }
        });
        user.markModified('notifications');
        await user.save();
      }
    } else {
      // Mark all read
      await User.updateOne(
        { email: req.user.email.toLowerCase() },
        { $set: { "notifications.$[].read": true } }
      );
    }
    
    res.status(200).json({ message: 'Notifications marked as read' });
  } catch (error) {
    console.error('Error reading notifications:', error);
    res.status(500).json({ message: 'Failed to read notifications' });
  }
});

// Get student attendance stats
router.get('/attendance/stats', authenticateToken, async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.status(200).json({ presentCount: 0, outingCount: 0, attendanceRate: 100 });
    }

    const student = await User.findOne({ email: req.user.email.toLowerCase() });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const records = await Attendance.find({ studentId: student.id });
    const approvedPasses = await GatePass.countDocuments({ 
      studentEmail: req.user.email.toLowerCase(), 
      status: 'Approved' 
    });

    const totalDays = records.length;
    const presentDays = records.filter(r => r.status === 'Present' || r.status === 'Late').length;
    const outingCount = approvedPasses;

    let attendanceRate = 0;
    if (totalDays > 0) {
      attendanceRate = Math.round((presentDays / totalDays) * 100);
    } else {
      attendanceRate = 100;
    }

    res.status(200).json({
      presentCount: presentDays,
      outingCount: outingCount,
      attendanceRate: attendanceRate
    });
  } catch (error) {
    console.error('Failed to fetch attendance stats:', error);
    res.status(500).json({ message: 'Failed to fetch attendance stats' });
  }
});

// Get mess menu
router.get('/mess/menu', authenticateToken, async (req, res) => {
  try {
    if (!isDbConnected()) return res.status(200).json([]);
    const menus = await MessMenu.find();
    res.status(200).json(menus);
  } catch (err) {
    console.error('Error fetching student mess menu:', err);
    res.status(500).json({ message: 'Error fetching mess menu' });
  }
});

export default router;
