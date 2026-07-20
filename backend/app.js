import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';

const app = express();

// middlewares
app.use(cors());
app.use(express.json());

// routes
app.use('/api/auth', authRoutes);

// health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Smart Hostel backend server is running' });
});

export default app;
