import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import wardenRoutes from './routes/warden.js';
import adminRoutes from './routes/admin.js';
import studentRoutes from './routes/student.js';
import notificationRoutes from './routes/notifications.js';
import chatRoutes from './routes/chat.js';
import chatbotRoutes from './routes/chatbot.js';

const app = express();

// enable cors and json parsing with increased payload limits for base64 photo uploads
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// define url paths for the routes
app.use('/api/auth', authRoutes);
app.use('/api/warden', wardenRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/chatbot', chatbotRoutes);

// check if the backend is running
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Smart Hostel backend server is running' });
});

// get razorpay public key
app.get('/api/payment/key', (req, res) => {
  res.status(200).json({ key: process.env.RAZORPAY_KEY_ID || 'rzp_test_HILw76iG5K3s2f' });
});

// global error handling middleware
app.use((err, req, res, next) => {
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ message: 'Request payload too large. Please upload a smaller image.' });
  }
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

export default app;
