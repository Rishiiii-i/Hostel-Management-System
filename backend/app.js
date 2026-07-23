import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import wardenRoutes from './routes/warden.js';
import adminRoutes from './routes/admin.js';
import studentRoutes from './routes/student.js';

const app = express();

// Enable CORS and JSON parsing with increased payload limits for base64 photo uploads
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Define URL paths for the routes
app.use('/api/auth', authRoutes);
app.use('/api/warden', wardenRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/student', studentRoutes);

// Check if the backend is running
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Smart Hostel backend server is running' });
});

export default app;
