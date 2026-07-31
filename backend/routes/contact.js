import express from 'express';
import { ContactMessage } from '../db.js';

const router = express.Router();

// POST /api/contact/send
// Saves homepage contact form submission to MongoDB database
router.post('/send', async (req, res) => {
  try {
    const { name, email, message } = req.body;

    // Validate fields are not empty
    if (!name || !name.trim() || !email || !email.trim() || !message || !message.trim()) {
      return res.status(400).json({ message: 'All fields (Name, Email, and Message) are required' });
    }

    const newMessage = new ContactMessage({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      message: message.trim()
    });

    await newMessage.save();
    console.log(`[ContactAPI] New message stored in database from: ${email}`);

    res.status(200).json({ message: 'Your message has been saved successfully!' });
  } catch (err) {
    console.error('[ContactAPI] Error saving contact message:', err);
    res.status(500).json({ message: 'Internal server error saving your message' });
  }
});

export default router;
