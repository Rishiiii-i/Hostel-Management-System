import dotenv from 'dotenv';
import app from './app.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  // Start the server on the selected port
  console.log(`Server is running on port ${PORT}`);
});
