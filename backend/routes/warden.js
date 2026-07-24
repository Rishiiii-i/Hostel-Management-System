import express from 'express';
import mongoose from 'mongoose';
import { GatePass, Complaint, Room, Notice, WardenProfile, User, Attendance, MessMenu, Transaction } from '../db.js';

const router = express.Router();

// Check if MongoDB is connected
function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

// Attendance API
router.get('/attendance', async (req, res) => {
  try {
    const { date } = req.query;
    const searchDate = date || new Date().toISOString().split('T')[0];
    console.log('GET /attendance queried for date:', searchDate);
    if (!isDbConnected()) return res.status(200).json([]);
    const records = await Attendance.find({ date: searchDate });
    console.log('GET /attendance returned count:', records.length);
    res.status(200).json(records);
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ message: 'Error fetching attendance records' });
  }
});

router.post('/attendance/mark', async (req, res) => {
  try {
    const { date, records } = req.body;
    console.log('POST /attendance/mark body date:', date, 'records count:', records ? records.length : 0);
    if (!isDbConnected()) return res.status(200).json({ message: 'Saved' });

    if (!records || !Array.isArray(records)) {
      return res.status(400).json({ message: 'Invalid records format' });
    }

    const bulkOps = records.map(r => ({
      updateOne: {
        filter: { date, studentId: r.studentId },
        update: {
          $set: {
            studentName: r.studentName,
            room: r.room,
            status: r.status,
            updatedAt: new Date()
          }
        },
        upsert: true
      }
    }));

    await Attendance.bulkWrite(bulkOps);
    console.log('POST /attendance/mark successfully wrote ops');
    res.status(200).json({ message: 'Attendance records updated successfully' });
  } catch (error) {
    console.error('Error updating attendance:', error);
    res.status(500).json({ message: 'Error updating attendance records' });
  }
});

// Get overview stats
router.get('/overview', async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.status(200).json({
        totalStudents: 0,
        vacantBeds: 0,
        pendingGatePasses: 0,
        openComplaints: 0,
        paidCount: 0,
        pendingCount: 0,
        partialCount: 0,
        collectedTotal: 0,
        outstandingTotal: 0,
        totalFees: 0,
        occupancyStats: {
          totalBeds: 0,
          occupiedBeds: 0,
          vacantBeds: 0,
          blockWise: [],
          floorWise: []
        },
        studentStats: {
          branchWise: [],
          yearWise: []
        },
        complaintStats: {
          categoryWise: []
        }
      });
    }

    const [totalStudents, vacantBedsCount, pendingGatePassesCount, openComplaintsCount] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      Room.countDocuments({ status: 'Vacant' }),
      GatePass.countDocuments({ status: 'Pending' }),
      Complaint.countDocuments({ status: { $ne: 'Resolved' } })
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

    // In-memory calculations for occupancy stats
    const rooms = await Room.find({});
    const totalRooms = rooms.length;
    const totalBeds = rooms.reduce((acc, r) => acc + (r.capacity || 2), 0);
    const occupiedBeds = students.filter(s => s.room && s.room !== 'N/A').length;
    const vacantBeds = Math.max(0, totalBeds - occupiedBeds);

    const blockMap = {};
    const floorMap = {};
    rooms.forEach(r => {
      const blk = r.block || 'Unknown';
      const flr = r.floor || 'Unknown';
      
      if (!blockMap[blk]) blockMap[blk] = { name: blk, total: 0, occupied: 0, vacant: 0 };
      blockMap[blk].total += 1;
      if (r.status === 'Occupied') blockMap[blk].occupied += 1;
      else blockMap[blk].vacant += 1;

      if (!floorMap[flr]) floorMap[flr] = { name: flr, total: 0, occupied: 0, vacant: 0 };
      floorMap[flr].total += 1;
      if (r.status === 'Occupied') floorMap[flr].occupied += 1;
      else floorMap[flr].vacant += 1;
    });

    const blockWise = Object.values(blockMap);
    const floorWise = Object.values(floorMap);

    // Demographics stats
    const branchMap = {};
    const yearMap = {};
    students.forEach(s => {
      const branchName = s.branch && s.branch !== 'N/A' ? s.branch : 'CSE';
      const yearName = s.year || '1st Year';
      
      branchMap[branchName] = (branchMap[branchName] || 0) + 1;
      yearMap[yearName] = (yearMap[yearName] || 0) + 1;
    });

    const branchWise = Object.entries(branchMap).map(([name, count]) => ({ name, count }));
    const yearWise = Object.entries(yearMap).map(([name, count]) => ({ name, count }));

    // Complaints breakdown by category
    const allComplaints = await Complaint.find({});
    const categoryMap = {
      'Electrical': 0,
      'Plumbing': 0,
      'Furniture': 0,
      'Cleaning': 0,
      'Internet': 0,
      'Other': 0
    };
    allComplaints.forEach(c => {
      const cat = c.category || 'Other';
      if (categoryMap[cat] !== undefined) {
        categoryMap[cat] += 1;
      } else {
        categoryMap['Other'] += 1;
      }
    });
    const categoryWise = Object.entries(categoryMap).map(([name, count]) => ({ name, count }));

    res.status(200).json({
      totalStudents,
      vacantBeds: vacantBedsCount,
      pendingGatePasses: pendingGatePassesCount,
      openComplaints: openComplaintsCount,
      paidCount,
      pendingCount,
      partialCount,
      collectedTotal,
      outstandingTotal,
      totalFees,
      occupancyStats: {
        totalBeds,
        occupiedBeds,
        vacantBeds,
        blockWise,
        floorWise
      },
      studentStats: {
        branchWise,
        yearWise
      },
      complaintStats: {
        categoryWise
      }
    });
  } catch (error) {
    console.error('Warden overview error:', error.message);
    res.status(500).json({ message: 'Error fetching overview stats' });
  }
});

// Gate Pass API
router.get('/gatepasses', async (req, res) => {
  try {
    if (!isDbConnected()) return res.status(200).json([]);
    const passes = await GatePass.find().sort({ createdAt: -1 });
    res.status(200).json(passes);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching gate passes' });
  }
});

router.put('/gatepasses/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!isDbConnected()) {
      return res.status(200).json({ id: req.params.id, status });
    }
    const updated = await GatePass.findOneAndUpdate(
      { id: req.params.id },
      { status },
      { new: true }
    );

    if (updated && updated.studentEmail) {
      const student = await User.findOne({ email: updated.studentEmail.toLowerCase() });
      if (student) {
        const newNotification = {
          id: `NT-${Math.floor(1000 + Math.random() * 9000)}`,
          title: `Gate Pass ${status}`,
          text: `Your gate pass request (${updated.reason}) has been ${status.toLowerCase()} by the Warden.`,
          time: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          read: false
        };
        student.notifications.unshift(newNotification);
        await student.save();
      }
    }

    res.status(200).json(updated);
  } catch (error) {
    console.error('Error updating gate pass status:', error);
    res.status(500).json({ message: 'Error updating gate pass status' });
  }
});

// Complaints API
router.get('/complaints', async (req, res) => {
  try {
    if (!isDbConnected()) return res.status(200).json([]);
    const complaints = await Complaint.find().sort({ createdAt: -1 });
    res.status(200).json(complaints);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching complaints' });
  }
});

router.put('/complaints/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!isDbConnected()) {
      return res.status(200).json({ id: req.params.id, status });
    }
    const updated = await Complaint.findOneAndUpdate(
      { id: req.params.id },
      { status },
      { new: true }
    );

    if (updated && updated.studentEmail) {
      const student = await User.findOne({ email: updated.studentEmail.toLowerCase() });
      if (student) {
        const newNotification = {
          id: `NT-${Math.floor(1000 + Math.random() * 9000)}`,
          title: `Complaint Updated`,
          text: `Your complaint regarding "${updated.title}" is now "${status}".`,
          time: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          read: false
        };
        student.notifications.unshift(newNotification);
        await student.save();
      }
    }

    res.status(200).json(updated);
  } catch (error) {
    console.error('Error updating complaint status:', error);
    res.status(500).json({ message: 'Error updating complaint status' });
  }
});

// Rooms API
router.get('/rooms', async (req, res) => {
  try {
    if (!isDbConnected()) return res.status(200).json([]);
    const rooms = await Room.find().sort({ roomNo: 1 });
    
    const roomsWithFeeStatus = await Promise.all(rooms.map(async (room) => {
      const roomObj = room.toObject();
      if (room.occupantEmail) {
        const student = await User.findOne({ email: room.occupantEmail.toLowerCase() });
        roomObj.occupantFeeStatus = student ? (student.feeStatus || 'Unpaid') : 'Unpaid';
      } else {
        roomObj.occupantFeeStatus = 'N/A';
      }
      return roomObj;
    }));
    
    res.status(200).json(roomsWithFeeStatus);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({ message: 'Error fetching rooms' });
  }
});

router.post('/rooms/allocate', async (req, res) => {
  try {
    const { roomId, occupantEmail, status } = req.body;
    
    if (!isDbConnected()) {
      return res.status(200).json({ id: roomId, occupantEmail, status });
    }

    const room = await Room.findOne({ id: roomId });
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    if (status === 'Occupied') {
      if (!occupantEmail) {
        return res.status(400).json({ message: 'Occupant email is required for allocation' });
      }
      
      const student = await User.findOne({ email: occupantEmail.toLowerCase() });
      if (!student) {
        return res.status(404).json({ message: 'Student email not found in database' });
      }

      // Update student details
      student.room = room.roomNo;
      student.block = room.block;
      
      const newNotification = {
        id: `NT-${Math.floor(1000 + Math.random() * 9000)}`,
        title: 'Room Allocated',
        text: `You have been allocated Room ${room.roomNo} in ${room.block}.`,
        time: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        read: false
      };
      student.notifications.unshift(newNotification);
      await student.save();

      // Update room details
      room.occupantName = student.name;
      room.occupantEmail = student.email;
      room.status = 'Occupied';
      await room.save();

      return res.status(200).json(room);
    } else {
      // Deallocate room
      if (room.occupantEmail) {
        const student = await User.findOne({ email: room.occupantEmail.toLowerCase() });
        if (student) {
          student.room = '';
          student.block = '';
          
          const newNotification = {
            id: `NT-${Math.floor(1000 + Math.random() * 9000)}`,
            title: 'Room Deallocated',
            text: `You have been deallocated from Room ${room.roomNo}.`,
            time: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            read: false
          };
          student.notifications.unshift(newNotification);
          await student.save();
        }
      }

      room.occupantName = '';
      room.occupantEmail = '';
      room.status = 'Vacant';
      await room.save();

      return res.status(200).json(room);
    }
  } catch (error) {
    console.error('Error allocating room:', error);
    res.status(500).json({ message: 'Error allocating room' });
  }
});

// Create new room
router.post('/rooms', async (req, res) => {
  try {
    const { roomNo, block, capacity, type, floor } = req.body;
    const id = `RM-${roomNo}`;
    
    if (!isDbConnected()) {
      return res.status(201).json({ id, roomNo, block, capacity, type, floor, status: 'Vacant', occupantName: '' });
    }

    const existingRoom = await Room.findOne({ id });
    if (existingRoom) {
      return res.status(400).json({ message: `Room ${roomNo} already exists in database` });
    }

    const newRoom = new Room({
      id,
      roomNo,
      block,
      capacity: Number(capacity) || 2,
      status: 'Vacant',
      type: type || '2-Sharing Non-AC',
      floor: floor || (roomNo ? (roomNo.substring(0, 1) + 'st Floor') : '1st Floor'),
      occupantName: ''
    });

    await newRoom.save();
    res.status(201).json(newRoom);
  } catch (error) {
    console.error('Error adding room:', error);
    res.status(500).json({ message: 'Error adding room', error: error.message });
  }
});

// Notices API
router.get('/notices', async (req, res) => {
  try {
    if (!isDbConnected()) return res.status(200).json([]);
    const notices = await Notice.find().sort({ createdAt: -1 });
    res.status(200).json(notices);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching notices' });
  }
});

router.post('/notices', async (req, res) => {
  try {
    const { title, content, targetBlock, isUrgent } = req.body;
    const newNoticeData = {
      id: `N-${Math.floor(100 + Math.random() * 900)}`,
      title,
      content,
      targetBlock: targetBlock || 'All Blocks',
      isUrgent: !!isUrgent,
      date: new Date().toISOString().split('T')[0]
    };

    if (!isDbConnected()) {
      return res.status(201).json(newNoticeData);
    }

    const newNotice = new Notice(newNoticeData);
    await newNotice.save();

    // Send notification alerts to students
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
    console.error('Error creating notice:', error);
    res.status(500).json({ message: 'Error creating broadcast notice' });
  }
});

// Warden Profile API
router.get('/profile', async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.status(200).json({
        wardenId: 'WDN-2026-01',
        fullName: 'Dileep',
        email: 'warden@smarthostel.com',
        phone: '+91 987654321',
        assignedBlocks: 'All Blocks',
        officeLocation: 'Shnoor Hills',
        emergencyContact: '+91 123456789'
      });
    }

    let profile = await WardenProfile.findOne();
    if (!profile) {
      profile = new WardenProfile();
      await profile.save();
    }
    
    const wardenUser = await User.findOne({ email: 'warden@smarthostel.com' });
    const profileObj = profile.toObject();
    profileObj.notifications = wardenUser ? (wardenUser.notifications || []) : [];

    res.status(200).json(profileObj);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching warden profile' });
  }
});

router.put('/profile', async (req, res) => {
  try {
    const updates = req.body;
    if (!isDbConnected()) {
      return res.status(200).json(updates);
    }
    const profile = await WardenProfile.findOneAndUpdate(
      {},
      updates,
      { new: true, upsert: true }
    );

    // Synchronize photo, name, and phone updates with the Warden's User document
    if (updates.email) {
      await User.findOneAndUpdate(
        { email: updates.email.toLowerCase() },
        {
          photo: updates.photo,
          name: updates.fullName,
          phone: updates.phone
        }
      );
    }

    res.status(200).json(profile);
  } catch (error) {
    console.error('Error updating warden profile:', error);
    res.status(500).json({ message: 'Error updating warden profile' });
  }
});

// Get all students
router.get('/students', async (req, res) => {
  try {
    if (!isDbConnected()) return res.status(200).json([]);
    const list = await User.find({ role: 'student' }).sort({ name: 1 });
    res.status(200).json(list);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching students list' });
  }
});

// Send message to one student
router.post('/notifications/individual', async (req, res) => {
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

    // Create a notice card for this student
    const personalNotice = new Notice({
      id: `N-${Math.floor(100 + Math.random() * 900)}`,
      title: isUrgent ? `Urgent Alert: ${title}` : title,
      content: content,
      author: 'Warden',
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

// Get mess menu
router.get('/mess/menu', async (req, res) => {
  try {
    if (!isDbConnected()) return res.status(200).json([]);
    const menus = await MessMenu.find();
    res.status(200).json(menus);
  } catch (error) {
    console.error('Error fetching warden mess menu:', error);
    res.status(500).json({ message: 'Error fetching mess menu' });
  }
});

// Update mess menu for a day
router.put('/mess/menu/:day', async (req, res) => {
  try {
    const { day } = req.params;
    const { breakfast, lunch, snacks, dinner } = req.body;
    
    if (!isDbConnected()) {
      return res.status(200).json({ day, breakfast, lunch, snacks, dinner });
    }

    const updated = await MessMenu.findOneAndUpdate(
      { day },
      { breakfast, lunch, snacks, dinner },
      { new: true, upsert: true }
    );
    
    // Send notification alerts to students
    try {
      const students = await User.find({ role: 'student' });
      const menuNotification = {
        id: `NT-${Math.floor(1000 + Math.random() * 9000)}`,
        title: 'Mess Menu Updated',
        text: `The mess menu for ${day} has been updated by the Warden.`,
        time: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        read: false
      };
      for (const student of students) {
        student.notifications.unshift(menuNotification);
        await student.save();
      }
    } catch (notifErr) {
      console.error('Failed to notify students of menu update:', notifErr);
    }

    res.status(200).json(updated);
  } catch (error) {
    console.error('Error updating mess menu:', error);
    res.status(500).json({ message: 'Error updating mess menu' });
  }
});

// Toggle student fee status
router.post('/students/:email/toggle-fee', async (req, res) => {
  try {
    const { email } = req.params;
    if (!isDbConnected()) {
      return res.status(200).json({ message: 'Mock toggle successful' });
    }

    const student = await User.findOne({ email: email.toLowerCase() });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const newStatus = student.feeStatus === 'Paid' ? 'Unpaid' : 'Paid';
    student.feeStatus = newStatus;
    
    if (newStatus === 'Paid') {
      student.paidFee = student.totalFee || 45000;
      student.dueFee = 0;
    } else {
      student.paidFee = 0;
      student.dueFee = student.totalFee || 45000;
    }
    
    await student.save();

    if (newStatus === 'Paid') {
      const newTxn = new Transaction({
        id: `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
        studentEmail: student.email.toLowerCase(),
        period: 'Hostel Fee',
        amount: `₹${student.totalFee || 45000}`,
        date: new Date().toISOString().split('T')[0],
        status: 'Paid'
      });
      await newTxn.save();
    } else {
      await Transaction.deleteMany({ studentEmail: student.email.toLowerCase(), period: 'Hostel Fee' });
      await Transaction.deleteMany({ studentEmail: student.email.toLowerCase(), period: 'July 2026 Room & Mess Fee' });
    }

    res.status(200).json({ message: `Fee status successfully changed to ${newStatus}`, feeStatus: newStatus });
  } catch (error) {
    console.error('Error toggling student fee status:', error);
    res.status(500).json({ message: 'Error toggling student fee status' });
  }
});

export default router;
