import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';

// Override default DNS servers to resolve MongoDB SRV queries (fixes ECONNREFUSED error)
dns.setServers(['8.8.8.8', '8.8.4.4']);

dotenv.config();

// Disable buffering so queries fail immediately when not connected instead of waiting 30 seconds
mongoose.set('bufferCommands', false);

const MONGODB_URI = process.env.MONGODB_URI || '';

// Check if URI contains placeholder symbols
const hasPlaceholders = MONGODB_URI.includes('<db_username>') || MONGODB_URI.includes('<db_password>');

if (!MONGODB_URI) {
  console.warn('⚠️ MONGODB_URI is not set in backend/.env.');
} else if (hasPlaceholders) {
  console.warn('⚠️ MONGODB_URI contains placeholder values (<db_username> / <db_password>). Please edit your backend/.env file and enter your actual database credentials.');
} else {
  mongoose.connect(MONGODB_URI)
    .then(() => console.log('✅ Connected to MongoDB successfully.'))
    .catch((error) => {
      console.error('❌ MongoDB connection error:', error.message);
      console.error('Please verify your connection string and credentials in backend/.env.');
    });
}

// User Schema definition
const userSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  firebaseUid: {
    type: String,
    unique: true,
    sparse: true
  },
  photoURL: {
    type: String
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: false
  },
  role: {
    type: String,
    required: true,
    enum: ['administrator', 'warden', 'student']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const User = mongoose.model('User', userSchema);

// Find user by email
async function findUserByEmail(email) {
  try {
    return await User.findOne({ email: email.toLowerCase() });
  } catch (error) {
    console.error('Error finding user by email:', error);
    throw error;
  }
}

// Create user
async function createUser(userData) {
  try {
    const user = new User(userData);
    return await user.save();
  } catch (error) {
    console.error('Error creating user in database:', error);
    throw error;
  }
}

export {
  User,
  findUserByEmail,
  createUser
};
