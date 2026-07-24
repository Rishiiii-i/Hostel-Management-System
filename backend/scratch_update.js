import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

const userSchema = new mongoose.Schema({
  email: String,
  password: { type: String }
});

const User = mongoose.model('User', userSchema, 'users');

async function run() {
  if (!MONGODB_URI) {
    console.error('MONGODB_URI not found in env');
    process.exit(1);
  }
  
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to DB successfully.');

  const user = await User.findOne({ email: 'baledileep1611@gmail.com' });
  if (!user) {
    console.log('User baledileep1611@gmail.com not found in database.');
    process.exit(1);
  }

  console.log('Found user:', user.email, 'Current password hash:', user.password);

  const candidatePasswords = ['123456', '12345678', 'password', 'dileep', 'baledileep1611'];
  let plainTextPassword = null;

  for (const pwd of candidatePasswords) {
    try {
      const isMatch = await bcrypt.compare(pwd, user.password);
      if (isMatch) {
        plainTextPassword = pwd;
        break;
      }
    } catch (e) {
      // Ignore
    }
  }

  if (plainTextPassword) {
    console.log('Determined plain text password is:', plainTextPassword);
    user.password = plainTextPassword;
    await user.save();
    console.log('Updated user password to plain text in MongoDB Atlas successfully!');
  } else {
    console.log('Could not find matching plain text password in candidates list. Defaulting to updating it to "123456".');
    user.password = '123456';
    await user.save();
    console.log('Updated user password to "123456" plain text in MongoDB Atlas successfully!');
  }

  await mongoose.disconnect();
}

run().catch(console.error);
