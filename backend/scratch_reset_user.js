import mongoose from 'mongoose';
import { User } from './db.js';

async function resetTestUser() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hostel-management');
  const result = await User.updateOne(
    { email: 'rishimacha00@gmail.com' },
    { 
      $set: { 
        totalFee: 45000,
        paidFee: 0,
        dueFee: 45000,
        feeStatus: 'Unpaid'
      } 
    }
  );
  console.log('Reset result:', result);
  await mongoose.disconnect();
}

resetTestUser();
