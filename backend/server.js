import dotenv from 'dotenv';
import app from './app.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  // Server startup after DB setup and name change to hostel-management
  console.log(`Server is running on port ${PORT}`);
});
