import express from 'express';
import mongoose from 'mongoose';
import { GatePass, Complaint, Room, Notice, WardenProfile, User, Attendance } from '../db.js';

const router = express.Router();

// Helper: check if MongoDB is connected
function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

// 0. Attendance Routes
router.get('/attendance', async (req, res) => {
  try {
    const { date } = req.query;
    const searchDate = date || new Date().toISOString().split('T')[0];
    if (!isDbConnected()) return res.status(200).json([]);
    const records = await Attendance.find({ date: searchDate });
    res.status(200).json(records);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching attendance records' });
  }
});

router.post('/attendance/mark', async (req, res) => {
  try {
    const { date, records } = req.body;
    if (!isDbConnected()) return res.status(200).json({ message: 'Saved' });

    const bulkOps = records.map(r => ({
      updateOne: {
        filter: { date, studentId: r.studentId },
        update: {
          $set: {
            studentName: r.studentName,
            room: r.room,
            branch: r.branch,
            year: r.year,
            status: r.status,
            updatedAt: new Date()
          }
        },
        upsert: true
      }
    }));

    await Attendance.bulkWrite(bulkOps);
    res.status(200).json({ message: 'Attendance records updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating attendance records' });
  }
});

// 1. GET Warden Overview Stats
router.get('/overview', async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.status(200).json({
        totalStudents: 0,
        vacantBeds: 0,
        pendingGatePasses: 0,
        openComplaints: 0
      });
    }

    const [totalStudents, vacantBeds, pendingGatePassesCount, openComplaintsCount] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      Room.countDocuments({ status: 'Vacant' }),
      GatePass.countDocuments({ status: 'Pending' }),
      Complaint.countDocuments({ status: { $ne: 'Resolved' } })
    ]);

    res.status(200).json({
      totalStudents,
      vacantBeds,
      pendingGatePasses: pendingGatePassesCount,
      openComplaints: openComplaintsCount
    });
  } catch (error) {
    console.error('Warden overview error:', error.message);
    res.status(500).json({ message: 'Error fetching overview stats' });
  }
});

// 2. GET / POST / PUT Gate Passes
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
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Error updating gate pass status' });
  }
});

// 3. GET / PUT Complaints
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
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Error updating complaint status' });
  }
});

// 4. GET / POST Rooms & Allocation
router.get('/rooms', async (req, res) => {
  try {
    if (!isDbConnected()) return res.status(200).json([]);
    const rooms = await Room.find().sort({ roomNo: 1 });
    res.status(200).json(rooms);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching rooms' });
  }
});

router.post('/rooms/allocate', async (req, res) => {
  try {
    const { roomId, occupantName, status } = req.body;
    if (!isDbConnected()) {
      return res.status(200).json({ id: roomId, occupantName, status });
    }
    const updated = await Room.findOneAndUpdate(
      { id: roomId },
      { occupantName, status },
      { new: true, upsert: true }
    );
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Error allocating room' });
  }
});

// 5. GET / POST Notices
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
    res.status(201).json(newNotice);
  } catch (error) {
    res.status(500).json({ message: 'Error creating broadcast notice' });
  }
});

// 6. GET / PUT Warden Profile
router.get('/profile', async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.status(200).json({
        wardenId: 'WDN-2026-01',
        fullName: 'Macha Rishi',
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
    res.status(200).json(profile);
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
    res.status(200).json(profile);
  } catch (error) {
    res.status(500).json({ message: 'Error updating warden profile' });
  }
});

export default router;
