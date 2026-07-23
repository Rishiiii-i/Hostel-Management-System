import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';

// Google DNS to fix connection errors on Windows
dns.setServers(['8.8.8.8', '8.8.4.4']);

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || '';

// Check if the URI has placeholder values
const hasPlaceholders = MONGODB_URI.includes('<db_username>') || MONGODB_URI.includes('<db_password>');

if (!MONGODB_URI) {
  console.warn('MONGODB_URI is not set in backend/.env.');
} else if (hasPlaceholders) {
  console.warn('MONGODB_URI contains placeholder values (<db_username> / <db_password>). Please edit your backend/.env file and enter your actual database credentials.');
} else {
  mongoose.connect(MONGODB_URI, {
    family: 4 // Connect using IPv4
  })
    .then(() => {
      console.log(' Connected to MongoDB successfully.');
      initDefaultMessMenu();
      initDefaultRooms();
      initDefaultWardenProfile();
    })
    .catch((error) => {
      console.error('MongoDB connection error:', error.message);
      console.error('Please verify your connection string and credentials in backend/.env.');
    });
}

// User Schema
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
  phone: {
    type: String
  },
  emergencyContact: {
    type: String
  },
  room: {
    type: String
  },
  block: {
    type: String
  },
  photo: {
    type: String
  },
  branch: {
    type: String,
    default: 'N/A'
  },
  year: {
    type: String,
    default: '1st Year'
  },
  totalFee: {
    type: Number,
    default: 45000
  },
  paidFee: {
    type: Number,
    default: 0
  },
  dueFee: {
    type: Number,
    default: 45000
  },
  feeStatus: {
    type: String,
    enum: ['Paid', 'Unpaid', 'Pending', 'Partial'],
    default: 'Unpaid'
  },
  notifications: {
    type: [{
      id: String,
      title: String,
      text: String,
      time: String,
      read: { type: Boolean, default: false }
    }],
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const User = mongoose.model('User', userSchema);

// Gate Pass Schema
const gatePassSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  studentName: { type: String, required: true },
  studentEmail: { type: String },
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
  studentEmail: { type: String },
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
  occupantName: { type: String, default: null },
  occupantEmail: { type: String, default: null },
  floor: { type: String, default: '1st Floor' },
  type: { type: String, default: '2-Sharing' }
});

const Room = mongoose.model('Room', roomSchema);

// Notice Schema
const noticeSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  author: { type: String, default: 'Chief Warden' },
  targetBlock: { type: String, default: 'All Blocks' },
  targetStudentEmail: { type: String, default: null },
  isUrgent: { type: Boolean, default: false },
  date: { type: String, default: () => new Date().toISOString().split('T')[0] },
  createdAt: { type: Date, default: Date.now }
});

const Notice = mongoose.model('Notice', noticeSchema);

// Warden Profile Schema
const wardenProfileSchema = new mongoose.Schema({
  wardenId: { type: String, required: true, unique: true, default: 'WDN-2026-01' },
  fullName: { type: String, default: 'Dileep' },
  email: { type: String, default: 'warden@smarthostel.com' },
  phone: { type: String, default: '+91 987654321' },
  assignedBlocks: { type: String, default: 'All Blocks' },
  officeLocation: { type: String, default: 'Shnoor Hills' },
  emergencyContact: { type: String, default: '+91 123456789' },
  photo: { type: String }
});

const WardenProfile = mongoose.model('WardenProfile', wardenProfileSchema);

// Attendance Schema
const attendanceSchema = new mongoose.Schema({
  date: { type: String, required: true },
  studentId: { type: String, required: true },
  studentName: { type: String, required: true },
  room: { type: String, default: 'N/A' },
  status: { type: String, enum: ['Present', 'Absent', 'Late', 'On Leave'], default: 'Absent' },
  updatedAt: { type: Date, default: Date.now }
});

const Attendance = mongoose.model('Attendance', attendanceSchema);

// Transaction Schema
const transactionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  studentEmail: { type: String, required: true },
  period: { type: String, required: true },
  amount: { type: String, required: true },
  date: { type: String, required: true },
  status: { type: String, enum: ['Paid', 'Pending', 'Failed'], default: 'Paid' },
  createdAt: { type: Date, default: Date.now }
});

const Transaction = mongoose.model('Transaction', transactionSchema);

// Mess Menu Schema
const messMenuSchema = new mongoose.Schema({
  day: { type: String, required: true, unique: true },
  breakfast: { type: String, default: 'Tea, Coffee & Idli with Chutney' },
  lunch: { type: String, default: 'Rice, Dal, Veg Curry & Curd' },
  snacks: { type: String, default: 'Tea & Samosa / Biscuits' },
  dinner: { type: String, default: 'Roti, Mixed Veg Sabji & Rice' }
});

const MessMenu = mongoose.model('MessMenu', messMenuSchema);

// Set default mess menu if it is empty
async function initDefaultMessMenu() {
  try {
    if (mongoose.connection.readyState !== 1) return;

    const defaultMenu = [
      { day: 'Monday', breakfast: 'Idli, Peanut Chutney, Sambar, Coffee/Tea', lunch: 'Rice, Kandipappu, Bendakaya Fry, Curd', snacks: 'Tea & Punugulu', dinner: 'Roti, Tomato Dal, Rice' },
      { day: 'Tuesday', breakfast: 'Pesarattu, Ginger Chutney, Coffee/Tea', lunch: 'Rice, Sambar, Potato Fry, Papad', snacks: 'Tea & Mirchi Bajji', dinner: 'Roti, Egg Curry / Egg Bhurji, Rice' },
      { day: 'Wednesday', breakfast: 'Dosa, Coconut Chutney, Sambar, Coffee/Tea', lunch: 'Rice, Chicken Curry / Mushroom Curry, Beans Fry, Curd', snacks: 'Tea & Mysore Bonda', dinner: 'Roti, Dal Fry, Rice' },
      { day: 'Thursday', breakfast: 'Upma, Coconut Chutney, Coffee/Tea', lunch: 'Rice, Tomato Pappu, Cabbage Fry, Curd', snacks: 'Tea & Samosa', dinner: 'Roti, Sorakaya Curry, Rice' },
      { day: 'Friday', breakfast: 'Poori, Potato Kurma, Coffee/Tea', lunch: 'Rice, Rasam, Vankaya Fry, Papad', snacks: 'Tea & Punugulu', dinner: 'Roti, Veg Kurma, Jeera Rice' },
      { day: 'Saturday', breakfast: 'Pongal, Coconut Chutney, Sambar, Tea', lunch: 'Rice, Palakura Pappu, Dondakaya Fry, Curd', snacks: 'Tea & Onion Pakoda', dinner: 'Roti, Mixed Vegetable Curry, Rice' },
      { day: 'Sunday', breakfast: 'Aloo Paratha, Curd, Pickle, Tea', lunch: 'Special Meals: Chicken Biryani / Paneer Biryani, Raita', snacks: 'Tea & Veg Puff', dinner: 'Roti, Butter Chicken / Butter Paneer, Rice' }
    ];

    for (const item of defaultMenu) {
      await MessMenu.findOneAndUpdate(
        { day: item.day },
        { breakfast: item.breakfast, lunch: item.lunch, snacks: item.snacks, dinner: item.dinner },
        { upsert: true, new: true }
      );
    }
    console.log('Default mess menu initialized/updated successfully!');
  } catch (err) {
    console.error('Failed to initialize default mess menu:', err);
  }
}

// Set default rooms if it is empty
async function initDefaultRooms() {
  try {
    if (mongoose.connection.readyState !== 1) return;
    const count = await Room.countDocuments({});
    if (count === 0) {
      console.log('Room collection is empty. Seeding default rooms...');
      const defaultRooms = [
        { id: 'RM-101', roomNo: '101', block: 'Block A', floor: '1st Floor', type: 'Double Sharing', status: 'Vacant', occupantName: null, occupantEmail: null },
        { id: 'RM-102', roomNo: '102', block: 'Block A', floor: '1st Floor', type: 'Double Sharing', status: 'Vacant', occupantName: null, occupantEmail: null },
        { id: 'RM-103', roomNo: '103', block: 'Block B', floor: '1st Floor', type: 'Single Room', status: 'Vacant', occupantName: null, occupantEmail: null },
        { id: 'RM-104', roomNo: '104', block: 'Block B', floor: '1st Floor', type: 'Single Room', status: 'Vacant', occupantName: null, occupantEmail: null },
        { id: 'RM-201', roomNo: '201', block: 'Block A', floor: '2nd Floor', type: 'Double Sharing', status: 'Vacant', occupantName: null, occupantEmail: null },
        { id: 'RM-202', roomNo: '202', block: 'Block A', floor: '2nd Floor', type: 'Double Sharing', status: 'Vacant', occupantName: null, occupantEmail: null },
        { id: 'RM-203', roomNo: '203', block: 'Block B', floor: '2nd Floor', type: 'Single Room', status: 'Vacant', occupantName: null, occupantEmail: null },
        { id: 'RM-204', roomNo: '204', block: 'Block B', floor: '2nd Floor', type: 'Single Room', status: 'Vacant', occupantName: null, occupantEmail: null }
      ];
      await Room.insertMany(defaultRooms);
      console.log('Default rooms seeded successfully!');
    }
  } catch (err) {
    console.error('Failed to seed default rooms:', err);
  }
}

// Set default warden profile if it is empty
async function initDefaultWardenProfile() {
  try {
    if (mongoose.connection.readyState !== 1) return;
    const count = await WardenProfile.countDocuments({});
    if (count === 0) {
      console.log('WardenProfile collection is empty. Seeding default profile...');
      const defaultWarden = new WardenProfile({
        wardenId: 'WDN-2026-01',
        fullName: 'Dileep',
        email: 'warden@smarthostel.com',
        phone: '+91 987654321',
        assignedBlocks: 'All Blocks',
        officeLocation: 'Shnoor Hills',
        emergencyContact: '+91 123456789'
      });
      await defaultWarden.save();
      console.log('Default WardenProfile seeded successfully!');
    }
  } catch (err) {
    console.error('Failed to seed default warden profile:', err);
  }
}

// Find user by email
async function findUserByEmail(email) {
  try {
    if (mongoose.connection.readyState !== 1) return null;
    return await User.findOne({ email: email.toLowerCase() });
  } catch (error) {
    console.error('Error finding user by email:', error.message);
    return null;
  }
}

// Create new user
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
  Transaction,
  MessMenu,
  findUserByEmail,
  createUser
};
