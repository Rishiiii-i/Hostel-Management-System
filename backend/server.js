import dotenv from 'dotenv';
import './db.js';
import app from './app.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  // Start the server on the selected port
  console.log(`Server is running on port ${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Stop the existing process or change PORT in backend/.env.`);
    process.exit(1);
  }
  console.error('Server error:', err);
});

// Handle graceful shutdown for nodemon restarts on Windows
const handleShutdown = () => {
  server.close(() => {
    process.exit(0);
  });
  setTimeout(() => process.exit(0), 500).unref();
};

process.once('SIGUSR2', handleShutdown);
process.on('SIGINT', handleShutdown);
process.on('SIGTERM', handleShutdown);
