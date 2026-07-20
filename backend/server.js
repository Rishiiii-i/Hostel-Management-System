import dotenv from 'dotenv';
import app from './app.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  // server startup after db setup and name change to hostel-m-s (buffercommands off)
  console.log(`Server is running on port ${PORT}`);
});
