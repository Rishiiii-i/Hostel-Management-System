import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import wardenRoutes from './routes/warden.js';
import adminRoutes from './routes/admin.js';
import studentRoutes from './routes/student.js';
import notificationRoutes from './routes/notifications.js';

const app = express();

// Enable CORS and JSON parsing with increased payload limits for base64 photo uploads
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Define URL paths for the routes
app.use('/api/auth', authRoutes);
app.use('/api/warden', wardenRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/notifications', notificationRoutes);

// Check if the backend is running
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Smart Hostel backend server is running' });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ message: 'Request payload too large. Please upload a smaller image.' });
  }
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

export default app;
