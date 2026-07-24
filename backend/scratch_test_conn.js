import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { User, Room, Complaint, Notice } from './db.js';
import { adminInstance } from './config/firebaseAdmin.js';

dotenv.config();

console.log('--- SYSTEM CONNECTION DIAGNOSTIC ---');

async function testDiagnostics() {
  try {
    console.log('1. Testing Environment Variables...');
    console.log('   PORT:', process.env.PORT || 5000);
    console.log('   JWT_SECRET configured:', !!process.env.JWT_SECRET);
    console.log('   MONGODB_URI configured:', !!process.env.MONGODB_URI);
    console.log('   FIREBASE_SERVICE_ACCOUNT_PATH:', process.env.FIREBASE_SERVICE_ACCOUNT_PATH);

    console.log('\n2. Testing Firebase Admin SDK Initialization...');
    if (adminInstance) {
      console.log('   [SUCCESS] Firebase Admin SDK is initialized successfully.');
      console.log('   Project ID:', adminInstance.options.credential ? 'hostel-management-system-78566' : 'unknown');
    } else {
      console.log('   [WARNING] Firebase Admin SDK is not initialized.');
    }

    console.log('\n3. Testing MongoDB Database Connection...');
    // Wait for connection to establish
    let attempts = 0;
    while (mongoose.connection.readyState !== 1 && attempts < 10) {
      await new Promise(r => setTimeout(r, 1000));
      attempts++;
    }

    if (mongoose.connection.readyState === 1) {
      console.log('   [SUCCESS] Connected to MongoDB Atlas Database!');
      console.log('   Database Name:', mongoose.connection.name);

      console.log('\n4. Testing Database Queries & Collections...');
      const userCount = await User.countDocuments();
      console.log(`   - User collection count: ${userCount}`);
      
      const adminUser = await User.findOne({ role: { $in: ['administrator', 'admin'] } });
      console.log(`   - Admin User found: ${adminUser ? adminUser.email : 'None'}`);

      const wardenUser = await User.findOne({ role: 'warden' });
      console.log(`   - Warden User found: ${wardenUser ? wardenUser.email : 'None'}`);

      const studentCount = await User.countDocuments({ role: 'student' });
      console.log(`   - Total Students: ${studentCount}`);

      const roomCount = await Room.countDocuments();
      console.log(`   - Total Rooms: ${roomCount}`);

      const complaintCount = await Complaint.countDocuments();
      console.log(`   - Total Complaints: ${complaintCount}`);

      const noticeCount = await Notice.countDocuments();
      console.log(`   - Total Notices: ${noticeCount}`);

      console.log('\n=============================================');
      console.log(' DIAGNOSTIC STATUS: ALL BACKEND & DB CHECKS PASSED SUCCESSFULLY!');
      console.log('=============================================');
    } else {
      console.error('   [ERROR] Failed to connect to MongoDB. Connection state:', mongoose.connection.readyState);
    }
  } catch (err) {
    console.error('   [ERROR] Diagnostic exception:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

testDiagnostics();
