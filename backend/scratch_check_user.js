import mongoose from 'mongoose';
import { User } from './db.js';

async function checkUser() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hostel-management');
  const user = await User.findOne({ email: 'rishimacha00@gmail.com' });
  console.log('User Record:', JSON.stringify(user, null, 2));
  await mongoose.disconnect();
}

checkUser();
