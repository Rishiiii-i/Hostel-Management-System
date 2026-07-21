import express from 'express';
import mongoose from 'mongoose';
import { User, Room, Complaint, WardenProfile } from '../db.js';

const router = express.Router();

function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

// GET Admin Overview Metrics
router.get('/overview', async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.status(200).json({
        totalStudents: 0,
        pendingFees: 0,
        activeComplaints: 0,
        occupiedRooms: 0,
        totalRooms: 0
      });
    }

    const [totalStudents, activeComplaintsCount, occupiedRoomsCount, totalRoomsCount] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      Complaint.countDocuments({ status: { $ne: 'Resolved' } }),
      Room.countDocuments({ status: 'Occupied' }),
      Room.countDocuments({})
    ]);

    res.status(200).json({
      totalStudents,
      pendingFees: 0,
      activeComplaints: activeComplaintsCount,
      occupiedRooms: occupiedRoomsCount,
      totalRooms: totalRoomsCount
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching admin overview metrics' });
  }
});

// GET All Students for Admin
router.get('/students', async (req, res) => {
  try {
    if (!isDbConnected()) return res.status(200).json([]);
    const students = await User.find({ role: 'student' }).select('-password');
    res.status(200).json(students);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching students list' });
  }
});

// GET All Rooms for Admin
router.get('/rooms', async (req, res) => {
  try {
    if (!isDbConnected()) return res.status(200).json([]);
    const rooms = await Room.find({});
    res.status(200).json(rooms);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching rooms list' });
  }
});

export default router;
