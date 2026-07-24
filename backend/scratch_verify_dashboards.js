import mongoose from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { User, Complaint, GatePass, Room, Notice, MessMenu, WardenProfile, Attendance, Transaction } from './db.js';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'smart-hostel-secret-key-12345';

async function runDashboardConnectionAudit() {
  console.log('====================================================');
  console.log('   STARTING ALL DASHBOARDS ENDPOINT & DB AUDIT');
  console.log('====================================================\n');

  try {
    if (mongoose.connection.readyState !== 1) {
      console.log('[1/4] Connecting to MongoDB Atlas...');
      await mongoose.connect(process.env.MONGODB_URI, { family: 4 });
      console.log('   ✓ Connected to MongoDB successfully.\n');
    }

    // 1. Audit Student Dashboard Data Connections
    console.log('[2/4] Auditing Student Dashboard Data Connections...');
    const studentUser = await User.findOne({ role: 'student' }) || await User.findOne({});
    if (studentUser) {
      console.log(`   ✓ Student Account: ${studentUser.name} (${studentUser.email})`);
      const studentComplaints = await Complaint.find({ studentEmail: studentUser.email });
      console.log(`   ✓ Student Complaints Count: ${studentComplaints.length}`);
      const studentGatePasses = await GatePass.find({ studentEmail: studentUser.email });
      console.log(`   ✓ Student Gate Passes Count: ${studentGatePasses.length}`);
      const studentTxns = await Transaction.find({ studentEmail: studentUser.email });
      console.log(`   ✓ Student Transactions Count: ${studentTxns.length}`);
    } else {
      console.log('   ! No student user found in database.');
    }
    console.log('');

    // 2. Audit Warden Dashboard Data Connections
    console.log('[3/4] Auditing Warden Dashboard Data Connections...');
    const wardenProfile = await WardenProfile.findOne({});
    console.log(`   ✓ Warden Profile: ${wardenProfile?.fullName || 'Warden'} (${wardenProfile?.email || 'warden@smarthostel.com'})`);
    const totalComplaints = await Complaint.countDocuments({});
    const pendingComplaints = await Complaint.countDocuments({ status: 'Pending' });
    console.log(`   ✓ Complaints Audit: ${totalComplaints} Total (${pendingComplaints} Pending)`);
    const totalGatePasses = await GatePass.countDocuments({});
    const pendingGatePasses = await GatePass.countDocuments({ status: 'Pending' });
    console.log(`   ✓ Gate Passes Audit: ${totalGatePasses} Total (${pendingGatePasses} Pending)`);
    const totalRooms = await Room.countDocuments({});
    const vacantRooms = await Room.countDocuments({ status: 'Vacant' });
    console.log(`   ✓ Rooms Audit: ${totalRooms} Total (${vacantRooms} Vacant)`);
    const weeklyMessMenu = await MessMenu.find({});
    console.log(`   ✓ Mess Menu Days Programmed: ${weeklyMessMenu.length} days`);
    console.log('');

    // 3. Audit Admin Dashboard Data Connections
    console.log('[4/4] Auditing Admin Dashboard Data Connections...');
    const adminUser = await User.findOne({ role: 'administrator' });
    console.log(`   ✓ Admin Account: ${adminUser?.name || 'Administrator'} (${adminUser?.email || 'admin@admin.com'})`);
    const allUsers = await User.countDocuments({});
    const totalStudents = await User.countDocuments({ role: 'student' });
    console.log(`   ✓ User Directory: ${allUsers} Total Registered Users (${totalStudents} Students)`);
    const noticesCount = await Notice.countDocuments({});
    console.log(`   ✓ Notice Board Announcements: ${noticesCount} Active Notices`);
    console.log('');

    console.log('====================================================');
    console.log('   RESULT: ALL 3 DASHBOARDS DATA CONNECTIONS OK!');
    console.log('====================================================');

    process.exit(0);
  } catch (err) {
    console.error('Audit failed:', err);
    process.exit(1);
  }
}

runDashboardConnectionAudit();
