import express from 'express';
import mongoose from 'mongoose';
import { User, GatePass, Complaint, Notice, Transaction, WardenProfile, MessMenu, Attendance } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// check if database is active
function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

// get profile details of the logged in student
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
      fullName: 'Macha Rishi',
      phone: '+91 987654321',
      emergencyContact: '+91 123456789'
    };

    const warden = await WardenProfile.findOne();
    if (warden) {
      wardenInfo = {
        fullName: warden.fullName || 'Macha Rishi',
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

// update profile details of the logged in student
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, rollNo, phone, emergencyContact, room, block, photo } = req.body;
    if (name !== undefined && name.trim() === '') {
      return res.status(400).json({ message: 'Full name cannot be empty' });
    }
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
      { new: true }
    );
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update student profile' });
  }
});

// get all complaints filed by the logged in student
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

// file a new complaint
router.post('/complaints', authenticateToken, async (req, res) => {
  try {
    const { category, title, priority } = req.body;
    const student = await User.findOne({ email: req.user.email.toLowerCase() });
    
    const newComplaintData = {
      id: `REQ-${Math.floor(100 + Math.random() * 900)}`,
      studentName: student ? student.name : req.user.name,
      studentEmail: req.user.email.toLowerCase(),
      room: student && student.room ? student.room : 'N/A',
      category,
      title,
      priority,
      status: 'Pending',
      date: new Date().toISOString().split('T')[0]
    };

    if (!isDbConnected()) {
      return res.status(201).json(newComplaintData);
    }

    const complaint = new Complaint(newComplaintData);
    await complaint.save();
    res.status(201).json(complaint);
  } catch (error) {
    console.error('Failed to register new complaint:', error);
    res.status(500).json({ message: 'Failed to register new complaint', error: error.message });
  }
});

// get all outing gate passes for the logged in student
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

// submit a new outing gate pass request
router.post('/gatepasses', authenticateToken, async (req, res) => {
  try {
    const { reason, departure, returnDate } = req.body;
    const student = await User.findOne({ email: req.user.email.toLowerCase() });
    
    const newPassData = {
      id: `GP-${Math.floor(100 + Math.random() * 900)}`,
      studentName: student ? student.name : req.user.name,
      studentEmail: req.user.email.toLowerCase(),
      rollNo: student && student.rollNo ? student.rollNo : '',
      room: student && student.room ? student.room : 'N/A',
      reason,
      departure,
      returnDate,
      status: 'Pending'
    };

    if (!isDbConnected()) {
      return res.status(201).json(newPassData);
    }

    const gatePass = new GatePass(newPassData);
    await gatePass.save();
    res.status(201).json(gatePass);
  } catch (error) {
    console.error('Failed to submit gate pass request:', error);
    res.status(500).json({ message: 'Failed to submit gate pass request', error: error.message });
  }
});

// get announcements target to the student block or all blocks
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

// get all payment transactions for the logged in student
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

// submit a new payment transaction
router.post('/transactions', authenticateToken, async (req, res) => {
  try {
    const { amount, period } = req.body;
    
    const newTxnData = {
      id: `TXN-${Math.floor(1000 + Math.random() * 9000)}`,
      studentEmail: req.user.email.toLowerCase(),
      period: period || 'Hostel Fee',
      amount: `$${amount}`,
      date: new Date().toISOString().split('T')[0],
      status: 'Paid'
    };

    if (!isDbConnected()) {
      return res.status(201).json(newTxnData);
    }

    const txn = new Transaction(newTxnData);
    await txn.save();
    res.status(201).json(txn);
  } catch (error) {
    console.error('Error in POST /transactions:', error);
    res.status(500).json({ message: 'Failed to record payment transaction', error: error.message });
  }
});

// mark all or category-specific notifications as read for logged in student
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
      // mark all as read
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

// GET student attendance stats
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

// GET Mess Menu
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
