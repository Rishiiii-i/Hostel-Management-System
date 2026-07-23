import express from 'express';
import mongoose from 'mongoose';
import { User, Room, Complaint, Transaction, Notice } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

// Middleware to check if user is admin
function isAdmin(req, res, next) {
  if (req.user && (req.user.role === 'administrator' || req.user.role === 'admin' || req.user.email?.toLowerCase().includes('admin'))) {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: Admin permissions required' });
  }
}

// Get dashboard overview stats for admin
router.get('/overview', authenticateToken, isAdmin, async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.status(200).json({
        totalStudents: 0,
        pendingFees: 0,
        activeComplaints: 0,
        occupiedRooms: 0,
        totalRooms: 0,
        paidCount: 0,
        pendingCount: 0,
        partialCount: 0,
        collectedTotal: 0,
        outstandingTotal: 0,
        totalFees: 0,
        pendingFeesList: [],
        activeComplaintsList: []
      });
    }

    const [
      totalStudents,
      activeComplaintsCount,
      occupiedRoomsCount,
      totalRoomsCount,
      pendingComplaintsCount,
      inProgressComplaintsCount,
      resolvedComplaintsCount
    ] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      Complaint.countDocuments({ status: { $ne: 'Resolved' } }),
      Room.countDocuments({ status: 'Occupied' }),
      Room.countDocuments({}),
      Complaint.countDocuments({ status: 'Pending' }),
      Complaint.countDocuments({ status: 'In Progress' }),
      Complaint.countDocuments({ status: 'Resolved' })
    ]);

    const students = await User.find({ role: 'student' });
    let totalFees = 0;
    let collectedTotal = 0;
    let outstandingTotal = 0;
    let paidCount = 0;
    let pendingCount = 0;
    let partialCount = 0;

    for (const s of students) {
      const total = Number(s.totalFee) || 0;
      const paid = Number(s.paidFee) || 0;
      const due = total - paid;

      let expectedStatus = 'Unpaid';
      if (due <= 0 && total > 0) {
        expectedStatus = 'Paid';
      } else if (paid > 0 && due > 0) {
        expectedStatus = 'Partial';
      }

      // Self-heal: update database if document attributes are mismatched
      if (s.feeStatus !== expectedStatus || s.dueFee !== due) {
        s.dueFee = due;
        s.feeStatus = expectedStatus;
        await s.save();
      }

      totalFees += total;
      collectedTotal += paid;
      outstandingTotal += due;

      if (expectedStatus === 'Paid') {
        paidCount++;
      } else if (expectedStatus === 'Partial') {
        partialCount++;
      } else {
        pendingCount++;
      }
    }

    // List of students with outstanding fees
    const pendingFeesList = students
      .filter(s => (Number(s.totalFee) || 0) > (Number(s.paidFee) || 0))
      .map(s => ({
        id: s.id,
        name: s.name,
        room: s.room || 'N/A',
        totalFee: `₹${s.totalFee || 0}`,
        paid: `₹${s.paidFee || 0}`,
        due: `₹${(s.totalFee || 0) - (s.paidFee || 0)}`,
        status: s.feeStatus || 'Unpaid'
      }))
      .slice(0, 5);

    // List of active complaints
    const activeComplaints = await Complaint.find({ status: { $ne: 'Resolved' } })
      .sort({ createdAt: -1 })
      .limit(5);

    const activeComplaintsList = activeComplaints.map(c => ({
      id: c.id,
      student: c.studentName,
      room: c.room || 'N/A',
      title: c.title,
      complaint: c.category,
      status: c.status
    }));

    res.status(200).json({
      totalStudents,
      pendingFees: outstandingTotal,
      activeComplaints: activeComplaintsCount,
      occupiedRooms: occupiedRoomsCount,
      totalRooms: totalRoomsCount,
      paidCount,
      pendingCount,
      partialCount,
      collectedTotal,
      outstandingTotal,
      totalFees,
      pendingFeesList,
      activeComplaintsList,
      pendingComplaintsCount,
      inProgressComplaintsCount,
      resolvedComplaintsCount
    });
  } catch (error) {
    console.error('Error fetching admin overview metrics:', error);
    res.status(500).json({ message: 'Error fetching admin overview metrics' });
  }
});

// Get all students
router.get('/students', authenticateToken, isAdmin, async (req, res) => {
  try {
    if (!isDbConnected()) return res.status(200).json([]);
    const students = await User.find({ role: 'student' }).select('-password');
    res.status(200).json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ message: 'Error fetching students list' });
  }
});

// Add a student
router.post('/students', authenticateToken, isAdmin, async (req, res) => {
  try {
    if (!isDbConnected()) return res.status(200).json({ message: 'Database offline' });
    const { name, email, phone, room, block, rollNo, branch, year, totalFee, paidFee } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'Student with this email already exists' });
    }

    const parsedTotalFee = Number(totalFee) || 0;
    const parsedPaidFee = Number(paidFee) || 0;
    const parsedDueFee = parsedTotalFee - parsedPaidFee;
    let feeStatus = 'Unpaid';
    if (parsedDueFee <= 0) feeStatus = 'Paid';
    else if (parsedPaidFee > 0) feeStatus = 'Partial';

    const id = `STU-${Math.floor(100000 + Math.random() * 900000)}`;

    const newUser = new User({
      id,
      name,
      email: email.toLowerCase(),
      phone,
      room,
      block,
      rollNo,
      branch: branch || 'N/A',
      year: year || '1st Year',
      totalFee: parsedTotalFee,
      paidFee: parsedPaidFee,
      dueFee: parsedDueFee,
      feeStatus,
      role: 'student'
    });

    // Handle room allocation if room is assigned
    if (room) {
      const roomDoc = await Room.findOne({ roomNo: room });
      if (roomDoc) {
        roomDoc.status = 'Occupied';
        roomDoc.occupantName = name;
        roomDoc.occupantEmail = email.toLowerCase();
        await roomDoc.save();
      }
    }

    await newUser.save();
    res.status(201).json(newUser);
  } catch (error) {
    console.error('Error adding student:', error);
    res.status(500).json({ message: 'Error adding student record', error: error.message });
  }
});

// Update student
router.put('/students/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    if (!isDbConnected()) return res.status(200).json({ message: 'Database offline' });
    const { id } = req.params;
    const { name, email, phone, room, block, rollNo, branch, year, totalFee, paidFee } = req.body;

    const student = await User.findOne({ id });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Check if room changed
    const oldRoom = student.room;
    if (oldRoom !== room) {
      // Deallocate old room
      if (oldRoom) {
        const oldRoomDoc = await Room.findOne({ roomNo: oldRoom });
        if (oldRoomDoc && oldRoomDoc.occupantEmail === student.email) {
          oldRoomDoc.status = 'Vacant';
          oldRoomDoc.occupantName = null;
          oldRoomDoc.occupantEmail = null;
          await oldRoomDoc.save();
        }
      }
      // Allocate new room
      if (room) {
        const newRoomDoc = await Room.findOne({ roomNo: room });
        if (newRoomDoc) {
          newRoomDoc.status = 'Occupied';
          newRoomDoc.occupantName = name || student.name;
          newRoomDoc.occupantEmail = (email || student.email).toLowerCase();
          await newRoomDoc.save();
        }
      }
    }

    student.name = name || student.name;
    student.email = (email || student.email).toLowerCase();
    student.phone = phone || student.phone;
    student.room = room;
    student.block = block || student.block;
    student.rollNo = rollNo || student.rollNo;
    student.branch = branch || student.branch;
    student.year = year || student.year;

    if (totalFee !== undefined || paidFee !== undefined) {
      const t = totalFee !== undefined ? Number(totalFee) : (student.totalFee || 0);
      const p = paidFee !== undefined ? Number(paidFee) : (student.paidFee || 0);
      student.totalFee = t;
      student.paidFee = p;
      student.dueFee = t - p;
      student.feeStatus = student.dueFee <= 0 ? 'Paid' : (p > 0 ? 'Partial' : 'Unpaid');
    }

    await student.save();
    res.status(200).json(student);
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ message: 'Error updating student record' });
  }
});

// Delete student
router.delete('/students/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    if (!isDbConnected()) return res.status(200).json({ message: 'Database offline' });
    const { id } = req.params;

    const student = await User.findOne({ id });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Deallocate room
    if (student.room) {
      const roomDoc = await Room.findOne({ roomNo: student.room });
      if (roomDoc && roomDoc.occupantEmail === student.email) {
        roomDoc.status = 'Vacant';
        roomDoc.occupantName = null;
        roomDoc.occupantEmail = null;
        await roomDoc.save();
      }
    }

    await User.deleteOne({ id });
    res.status(200).json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ message: 'Error deleting student' });
  }
});

// Get all rooms
router.get('/rooms', authenticateToken, isAdmin, async (req, res) => {
  try {
    if (!isDbConnected()) return res.status(200).json([]);
    const rooms = await Room.find({});
    
    // Add dynamically calculated floor and type if not set
    const processedRooms = rooms.map(r => {
      const rObj = r.toObject();
      if (!rObj.floor) {
        rObj.floor = r.roomNo ? (r.roomNo.substring(0, 1) + 'st Floor') : '1st Floor';
      }
      if (!rObj.type) {
        rObj.type = '2-Sharing';
      }
      rObj.occupied = r.status === 'Occupied' ? 1 : 0;
      return rObj;
    });

    res.status(200).json(processedRooms);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({ message: 'Error fetching rooms list' });
  }
});

// Add a room
router.post('/rooms', authenticateToken, isAdmin, async (req, res) => {
  try {
    if (!isDbConnected()) return res.status(200).json({ message: 'Database offline' });
    const { roomNo, block, capacity, type, floor } = req.body;

    const existingRoom = await Room.findOne({ roomNo, block });
    if (existingRoom) {
      return res.status(400).json({ message: 'Room already configured' });
    }

    const id = `RM-${Math.floor(1000 + Math.random() * 9000)}`;
    const newRoom = new Room({
      id,
      roomNo,
      block,
      capacity: Number(capacity) || 2,
      status: 'Vacant',
      type: type || '2-Sharing',
      floor: floor || (roomNo ? (roomNo.substring(0, 1) + 'st Floor') : '1st Floor')
    });

    await newRoom.save();
    res.status(201).json(newRoom);
  } catch (error) {
    console.error('Error adding room:', error);
    res.status(500).json({ message: 'Error configuring room' });
  }
});

// Delete a room
router.delete('/rooms/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    if (!isDbConnected()) return res.status(200).json({ message: 'Database offline' });
    const { id } = req.params;

    const room = await Room.findOne({ id });
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Update occupant student
    if (room.occupantEmail) {
      const student = await User.findOne({ email: room.occupantEmail });
      if (student) {
        student.room = null;
        student.block = null;
        await student.save();
      }
    }

    await Room.deleteOne({ id });
    res.status(200).json({ message: 'Room deleted successfully' });
  } catch (error) {
    console.error('Error deleting room:', error);
    res.status(500).json({ message: 'Error deleting room' });
  }
});

// Allocate/Deallocate a room
router.post('/rooms/allocate', authenticateToken, isAdmin, async (req, res) => {
  try {
    if (!isDbConnected()) return res.status(200).json({ message: 'Database offline' });
    const { roomId, occupantEmail, status } = req.body;

    const roomDoc = await Room.findOne({ id: roomId });
    if (!roomDoc) {
      return res.status(404).json({ message: 'Room not found' });
    }

    if (status === 'Vacant' || !occupantEmail) {
      // Deallocate
      const oldEmail = roomDoc.occupantEmail;
      if (oldEmail) {
        const student = await User.findOne({ email: oldEmail.toLowerCase() });
        if (student) {
          student.room = null;
          student.block = null;
          await student.save();
        }
      }

      roomDoc.status = 'Vacant';
      roomDoc.occupantName = null;
      roomDoc.occupantEmail = null;
      await roomDoc.save();

      return res.status(200).json({ message: 'Room deallocated successfully', room: roomDoc });
    } else {
      // Allocate
      const student = await User.findOne({ email: occupantEmail.toLowerCase() });
      if (!student) {
        return res.status(404).json({ message: 'No registered student found with this email' });
      }

      // Check if student is already in a room
      if (student.room) {
        const otherRoom = await Room.findOne({ roomNo: student.room });
        if (otherRoom) {
          otherRoom.status = 'Vacant';
          otherRoom.occupantName = null;
          otherRoom.occupantEmail = null;
          await otherRoom.save();
        }
      }

      student.room = roomDoc.roomNo;
      student.block = roomDoc.block;
      await student.save();

      roomDoc.status = 'Occupied';
      roomDoc.occupantName = student.name;
      roomDoc.occupantEmail = student.email;
      await roomDoc.save();

      return res.status(200).json({ message: 'Room allocated successfully', room: roomDoc });
    }
  } catch (error) {
    console.error('Error allocating room:', error);
    res.status(500).json({ message: 'Error allocating room occupant' });
  }
});

// Get fees list
router.get('/fees', authenticateToken, isAdmin, async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.status(200).json({
        feeData: [],
        totalFees: 0,
        collectedFees: 0,
        outstandingFees: 0
      });
    }

    const students = await User.find({ role: 'student' });
    let totalFees = 0;
    let collectedFees = 0;
    let outstandingFees = 0;

    const feeData = students.map(s => {
      const total = Number(s.totalFee) || 0;
      const paid = Number(s.paidFee) || 0;
      const due = total - paid;
      totalFees += total;
      collectedFees += paid;
      outstandingFees += due;

      return {
        id: s.id,
        name: s.name,
        room: s.room || 'N/A',
        totalFee: `₹${total}`,
        paid: `₹${paid}`,
        due: `₹${due}`,
        status: s.feeStatus || 'Unpaid'
      };
    });

    res.status(200).json({
      feeData,
      totalFees,
      collectedFees,
      outstandingFees
    });
  } catch (error) {
    console.error('Error fetching fees data:', error);
    res.status(500).json({ message: 'Error fetching fees data' });
  }
});

// Update fee for a student
router.put('/students/:id/fees', authenticateToken, isAdmin, async (req, res) => {
  try {
    if (!isDbConnected()) return res.status(200).json({ message: 'Database offline' });
    const { id } = req.params;
    const { totalFee, paidFee } = req.body;

    const student = await User.findOne({ id });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const total = totalFee !== undefined ? Number(totalFee) : (student.totalFee || 0);
    const paid = paidFee !== undefined ? Number(paidFee) : (student.paidFee || 0);

    student.totalFee = total;
    student.paidFee = paid;
    student.dueFee = total - paid;
    student.feeStatus = student.dueFee <= 0 ? 'Paid' : (paid > 0 ? 'Partial' : 'Unpaid');

    await student.save();

    // Create a mock transaction if payment is recorded
    if (paidFee !== undefined && paidFee > 0) {
      const txnId = `TXN-${Math.floor(1000 + Math.random() * 9000)}`;
      const newTxn = new Transaction({
        id: txnId,
        studentEmail: student.email,
        period: 'Hostel Fee Update',
        amount: `₹${paidFee}`,
        date: new Date().toISOString().split('T')[0],
        status: 'Paid'
      });
      await newTxn.save();
    }

    res.status(200).json({
      message: 'Student fee updated successfully',
      student: {
        id: student.id,
        name: student.name,
        totalFee: student.totalFee,
        paidFee: student.paidFee,
        dueFee: student.dueFee,
        feeStatus: student.feeStatus
      }
    });
  } catch (error) {
    console.error('Error updating fee status:', error);
    res.status(500).json({ message: 'Error updating fee status' });
  }
});

// Get all complaints
router.get('/complaints', authenticateToken, isAdmin, async (req, res) => {
  try {
    if (!isDbConnected()) return res.status(200).json([]);
    const complaints = await Complaint.find({}).sort({ createdAt: -1 });
    res.status(200).json(complaints);
  } catch (error) {
    console.error('Error fetching complaints:', error);
    res.status(500).json({ message: 'Error fetching complaints list' });
  }
});

// Update complaint status
router.put('/complaints/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    if (!isDbConnected()) return res.status(200).json({ message: 'Database offline' });
    const { id } = req.params;
    const { status } = req.body;

    const complaint = await Complaint.findOne({ id });
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    complaint.status = status;
    await complaint.save();

    res.status(200).json({ message: 'Complaint status updated successfully', complaint });
  } catch (error) {
    console.error('Error updating complaint:', error);
    res.status(500).json({ message: 'Error updating complaint status' });
  }
});

// Get administrator profile
router.get('/profile', authenticateToken, isAdmin, async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.status(200).json({
        fullName: 'System Administrator',
        email: 'admin@smarthostel.com',
        phone: '+91 9876543210',
        office: 'Central Admin Block, Room 101',
        photo: ''
      });
    }

    const admin = await User.findOne({ email: req.user.email.toLowerCase() });
    if (!admin) {
      return res.status(404).json({ message: 'Administrator profile not found' });
    }

    res.status(200).json({
      fullName: admin.name || 'System Administrator',
      email: admin.email,
      phone: admin.phone || '+91 9876543210',
      office: admin.block || 'Central Admin Block, Room 101',
      photo: admin.photo || '',
      notifications: admin.notifications || []
    });
  } catch (error) {
    console.error('Error fetching admin profile:', error);
    res.status(500).json({ message: 'Error fetching admin profile' });
  }
});

// Update administrator profile
router.put('/profile', authenticateToken, isAdmin, async (req, res) => {
  try {
    if (!isDbConnected()) return res.status(200).json({ message: 'Database offline' });
    const { fullName, phone, office, photo } = req.body;

    const admin = await User.findOne({ email: req.user.email.toLowerCase() });
    if (!admin) {
      return res.status(404).json({ message: 'Administrator user not found' });
    }

    admin.name = fullName || admin.name;
    admin.phone = phone || admin.phone;
    admin.block = office || admin.block; // Storing office location in block attribute
    if (photo !== undefined) admin.photo = photo;

    await admin.save();

    res.status(200).json({
      message: 'Admin profile updated successfully',
      profile: {
        fullName: admin.name,
        email: admin.email,
        phone: admin.phone,
        office: admin.block,
        photo: admin.photo
      }
    });
  } catch (error) {
    console.error('Error updating admin profile:', error);
    res.status(500).json({ message: 'Error updating admin profile' });
  }
});

// Change administrator password
router.put('/change-password', authenticateToken, isAdmin, async (req, res) => {
  try {
    if (!isDbConnected()) return res.status(200).json({ message: 'Database offline' });
    const { currentPassword, newPassword } = req.body;

    const admin = await User.findOne({ email: req.user.email.toLowerCase() });
    if (!admin) {
      return res.status(404).json({ message: 'Administrator not found' });
    }

    // Check if the current password is correct (plain text check)
    if (admin.password) {
      if (admin.password !== currentPassword) {
        return res.status(400).json({ message: 'Incorrect current password' });
      }
    } else {
      // Fallback for predefined login before registration password set
      if (currentPassword !== 'admin123') {
        return res.status(400).json({ message: 'Incorrect current password' });
      }
    }

    admin.password = newPassword;
    await admin.save();

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error changing admin password:', error);
    res.status(500).json({ message: 'Error updating password' });
  }
});

// Notices Endpoints

// Get all notices
router.get('/notices', authenticateToken, isAdmin, async (req, res) => {
  try {
    if (!isDbConnected()) return res.status(200).json([]);
    const notices = await Notice.find({}).sort({ createdAt: -1 });
    res.status(200).json(notices);
  } catch (error) {
    console.error('Error fetching admin notices:', error);
    res.status(500).json({ message: 'Failed to fetch notice board announcements' });
  }
});

// Post a broadcast notice
router.post('/notices', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { title, content, targetBlock, isUrgent } = req.body;
    
    const newNoticeData = {
      id: `N-${Math.floor(100 + Math.random() * 900)}`,
      title,
      content,
      targetBlock: targetBlock || 'All Blocks',
      author: 'System Administrator',
      isUrgent: !!isUrgent,
      date: new Date().toISOString().split('T')[0]
    };

    if (!isDbConnected()) {
      return res.status(201).json(newNoticeData);
    }

    const newNotice = new Notice(newNoticeData);
    await newNotice.save();

    // Send notifications to corresponding students
    try {
      const studentQuery = { role: 'student' };
      if (targetBlock && targetBlock !== 'All Blocks') {
        studentQuery.block = targetBlock;
      }
      const students = await User.find(studentQuery);

      const noticeNotification = {
        id: `NT-${Math.floor(1000 + Math.random() * 9000)}`,
        title: isUrgent ? `Urgent Notice: ${title}` : `New Notice: ${title}`,
        text: content.length > 80 ? `${content.substring(0, 80)}...` : content,
        time: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        read: false
      };

      for (const student of students) {
        student.notifications.unshift(noticeNotification);
        await student.save();
      }
    } catch (notifErr) {
      console.error('Failed to dispatch notice notifications to students:', notifErr);
    }

    res.status(201).json(newNotice);
  } catch (error) {
    console.error('Error creating admin broadcast notice:', error);
    res.status(500).json({ message: 'Error creating broadcast notice' });
  }
});

// Send notification to individual student
router.post('/notifications/individual', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { studentEmail, title, content, isUrgent } = req.body;
    if (!studentEmail || !title || !content) {
      return res.status(400).json({ message: 'studentEmail, title, and content are required' });
    }

    if (!isDbConnected()) {
      return res.status(200).json({ message: 'Mock notification sent successfully' });
    }

    const student = await User.findOne({ email: studentEmail.toLowerCase(), role: 'student' });
    if (!student) {
      return res.status(404).json({ message: 'Student not found in system' });
    }

    const newNotification = {
      id: `NT-${Math.floor(1000 + Math.random() * 9000)}`,
      title: isUrgent ? `Urgent Alert: ${title}` : title,
      text: content,
      time: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      read: false
    };

    student.notifications.unshift(newNotification);
    await student.save();

    // Create a personal notice card
    const personalNotice = new Notice({
      id: `N-${Math.floor(100 + Math.random() * 900)}`,
      title: isUrgent ? `Urgent Alert: ${title}` : title,
      content: content,
      author: 'System Administrator',
      targetBlock: 'Personal',
      targetStudentEmail: studentEmail.toLowerCase(),
      isUrgent: !!isUrgent,
      date: new Date().toISOString().split('T')[0]
    });
    await personalNotice.save();

    res.status(200).json({ message: 'Notification sent successfully', notification: newNotification });
  } catch (error) {
    console.error('Error sending individual notification:', error);
    res.status(500).json({ message: 'Failed to send notification' });
  }
});

// Delete a notice
router.delete('/notices/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    if (!isDbConnected()) return res.status(200).json({ message: 'Database offline' });
    const { id } = req.params;

    const notice = await Notice.findOne({ id });
    if (!notice) {
      return res.status(404).json({ message: 'Notice not found' });
    }

    await Notice.deleteOne({ id });
    res.status(200).json({ message: 'Notice deleted successfully' });
  } catch (error) {
    console.error('Error deleting notice:', error);
    res.status(500).json({ message: 'Error deleting notice' });
  }
});

export default router;
