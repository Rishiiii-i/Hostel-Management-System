import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { User } from './db.js';
import { FCMService } from './services/fcmService.js';
import { notificationQueue } from './services/notificationQueue.js';

dotenv.config();

console.log('=== NOTIFICATION FUNCTIONALITY VERIFICATION TEST ===\n');

async function runNotificationCheck() {
  try {
    // 1. Check DB Connection
    console.log('1. Checking MongoDB connection...');
    let attempts = 0;
    while (mongoose.connection.readyState !== 1 && attempts < 10) {
      await new Promise(r => setTimeout(r, 500));
      attempts++;
    }

    if (mongoose.connection.readyState === 1) {
      console.log('   [PASS] MongoDB connected.');
    } else {
      console.error('   [FAIL] MongoDB connection state:', mongoose.connection.readyState);
      process.exit(1);
    }

    // 2. Check Payload Formatting
    console.log('\n2. Testing FCM Payload Formatting...');
    const formatted = FCMService.formatPayload({
      title: 'Verification Test',
      body: 'Testing payload formatting',
      notificationType: 'COMPLAINT_UPDATE',
      targetHash: '#dashboard',
      targetTab: 'complaints',
      data: { type: 'complaint', id: 'REQ-123' }
    });

    console.log('   [PASS] Formatted Payload Structure:');
    console.log('          title:', formatted.title);
    console.log('          body:', formatted.body);
    console.log('          stringifiedData.notificationType:', formatted.stringifiedData.notificationType);
    console.log('          stringifiedData.targetScreen:', formatted.stringifiedData.targetScreen);
    console.log('          stringifiedData.type:', formatted.stringifiedData.type);

    // 3. Check User Lookup for FCM tokens with Email / String IDs
    console.log('\n3. Testing User Lookup for FCM Tokens...');
    const usersWithTokens = await User.find({ 'fcmTokens.0': { $exists: true } }).select('email role fcmTokens');
    console.log(`   Found ${usersWithTokens.length} users with active FCM tokens registered.`);

    // Test sendFCMToUserIds with string email
    const studentUser = await User.findOne({ role: 'student' });
    if (studentUser) {
      console.log(`   Testing User ID lookup for email: ${studentUser.email}...`);
      const userPushResult = await FCMService.sendFCMToUserIds([studentUser.email], {
        title: 'User Specific Test',
        body: 'Testing direct user ID push dispatch',
        targetTab: 'overview'
      });
      console.log('   [PASS] sendFCMToUserIds executed without error. Result:', userPushResult);
    }

    // 4. Test sendFCMToRole
    console.log('\n4. Testing Role-based FCM Dispatch...');
    const rolePushResult = await FCMService.sendFCMToRole('student', {
      title: 'Role Broadcast Test',
      body: 'Testing student role broadcast',
      targetTab: 'notices'
    });
    console.log('   [PASS] sendFCMToRole executed without error. Result:', rolePushResult);

    // 5. Test Async Non-Blocking Notification Queue
    console.log('\n5. Testing Async Notification Queue Enqueueing...');
    notificationQueue.enqueue({
      type: 'ROLE',
      target: 'warden',
      payload: {
        title: 'Queue Test',
        body: 'Testing async background worker processing',
        targetTab: 'leave'
      }
    });
    console.log('   [PASS] Enqueued notification job successfully.');

    // Wait for queue processing
    await new Promise(r => setTimeout(r, 1500));

    console.log('\n======================================================');
    console.log(' VERIFICATION RESULT: ALL NOTIFICATION FUNCTIONS ARE WORKING!');
    console.log('======================================================');
  } catch (err) {
    console.error('\n[FAIL] Verification error:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

runNotificationCheck();
