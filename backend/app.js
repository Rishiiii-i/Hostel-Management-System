import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Smart Hostel backend server is running' });
});

export default app;
