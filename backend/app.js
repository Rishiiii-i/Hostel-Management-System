import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import wardenRoutes from './routes/warden.js';
import adminRoutes from './routes/admin.js';
import studentRoutes from './routes/student.js';

const app = express();

// middlewares
app.use(cors());
app.use(express.json());

// routes
app.use('/api/auth', authRoutes);
app.use('/api/warden', wardenRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/student', studentRoutes);

// health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Smart Hostel backend server is running' });
});

export default app;
