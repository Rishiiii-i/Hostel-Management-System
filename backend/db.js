import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';

// override default dns servers to resolve mongodb srv queries (fixes econnrefused error on windows)
dns.setServers(['8.8.8.8', '8.8.4.4']);

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || '';

// check if uri contains placeholder symbols
const hasPlaceholders = MONGODB_URI.includes('<db_username>') || MONGODB_URI.includes('<db_password>');

if (!MONGODB_URI) {
  console.warn('MONGODB_URI is not set in backend/.env.');
} else if (hasPlaceholders) {
  console.warn('MONGODB_URI contains placeholder values (<db_username> / <db_password>). Please edit your backend/.env file and enter your actual database credentials.');
} else {
  mongoose.connect(MONGODB_URI, {
    family: 4 // Force Mongoose to connect using IPv4 to match the 0.0.0.0/0 Atlas whitelist
  })
    .then(() => console.log(' Connected to MongoDB successfully.'))
    .catch((error) => {
      console.error('MongoDB connection error:', error.message);
      console.error('Please verify your connection string and credentials in backend/.env.');
    });
}

// user schema definition
const userSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  rollNo: {
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

// GatePass Schema
const gatePassSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  studentName: { type: String, required: true },
  rollNo: { type: String },
  room: { type: String },
  reason: { type: String, required: true },
  destination: { type: String },
  departure: { type: String, required: true },
  returnDate: { type: String, required: true },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  createdAt: { type: Date, default: Date.now }
});

const GatePass = mongoose.model('GatePass', gatePassSchema);

// Complaint Schema
const complaintSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  studentName: { type: String, required: true },
  room: { type: String },
  category: { type: String, required: true },
  title: { type: String, required: true },
  date: { type: String, default: () => new Date().toISOString().split('T')[0] },
  status: { type: String, enum: ['Pending', 'In Progress', 'Resolved'], default: 'Pending' },
  priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
  createdAt: { type: Date, default: Date.now }
});

const Complaint = mongoose.model('Complaint', complaintSchema);

// Room Schema
const roomSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  roomNo: { type: String, required: true },
  block: { type: String, required: true },
  capacity: { type: Number, default: 2 },
  status: { type: String, enum: ['Occupied', 'Vacant'], default: 'Vacant' },
  occupantName: { type: String, default: null }
});

const Room = mongoose.model('Room', roomSchema);

// Notice Schema
const noticeSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  author: { type: String, default: 'Chief Warden' },
  targetBlock: { type: String, default: 'All Blocks' },
  isUrgent: { type: Boolean, default: false },
  date: { type: String, default: () => new Date().toISOString().split('T')[0] },
  createdAt: { type: Date, default: Date.now }
});

const Notice = mongoose.model('Notice', noticeSchema);

// Warden Profile Schema
const wardenProfileSchema = new mongoose.Schema({
  wardenId: { type: String, required: true, unique: true, default: 'WDN-2026-01' },
  fullName: { type: String, default: 'Macha Rishi' },
  email: { type: String, default: 'warden@smarthostel.com' },
  phone: { type: String, default: '+91 987654321' },
  assignedBlocks: { type: String, default: 'All Blocks' },
  officeLocation: { type: String, default: 'Shnoor Hills' },
  emergencyContact: { type: String, default: '+91 123456789' }
});

const WardenProfile = mongoose.model('WardenProfile', wardenProfileSchema);

// Attendance Schema
const attendanceSchema = new mongoose.Schema({
  date: { type: String, required: true },
  studentId: { type: String, required: true },
  studentName: { type: String, required: true },
  room: { type: String, default: 'N/A' },
  branch: { type: String, default: 'Diploma' },
  year: { type: String, default: '3rd Year' },
  status: { type: String, enum: ['Present', 'Absent', 'Late', 'On Leave'], default: 'Absent' },
  updatedAt: { type: Date, default: Date.now }
});

const Attendance = mongoose.model('Attendance', attendanceSchema);

// find user by email
async function findUserByEmail(email) {
  try {
    if (mongoose.connection.readyState !== 1) return null;
    return await User.findOne({ email: email.toLowerCase() });
  } catch (error) {
    console.error('Error finding user by email:', error.message);
    return null;
  }
}

// create user
async function createUser(userData) {
  try {
    if (mongoose.connection.readyState !== 1) return null;
    const user = new User(userData);
    return await user.save();
  } catch (error) {
    console.error('Error creating user in database:', error.message);
    return null;
  }
}

export {
  User,
  GatePass,
  Complaint,
  Room,
  Notice,
  WardenProfile,
  Attendance,
  findUserByEmail,
  createUser
};
