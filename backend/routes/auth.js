import express from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { User, findUserByEmail, createUser } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import bcrypt from 'bcryptjs';


const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'smart-hostel-secret-key-12345';

// Get user role from email
function getRole(email) {
  const value = email.toLowerCase();
  if (value.includes('admin')) return 'administrator';
  if (value.includes('warden')) return 'warden';
  return 'student';
}

// Sync user from Firebase to MongoDB
router.post('/sync', async (req, res) => {
  try {
    const { uid, name, email, role, password, rollNo } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required to sync' });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json({
        message: 'Decoupled sync mode (MongoDB disconnected)',
        user: { email, name: name || email.split('@')[0], role: role || getRole(email) }
      });
    }

    // Search for user by email
    let user = await User.findOne({ email: email.toLowerCase() });

    if (user) {
      // Update user details if user exists
      let updated = false;
      if (!user.name || user.name.trim() === '') {
        user.name = name || email.split('@')[0];
        updated = true;
      }
      if (password && user.password !== password) {
        user.password = password;
        updated = true;
      }
      if (rollNo && user.rollNo !== rollNo) {
        user.rollNo = rollNo;
        updated = true;
      }
      if (updated) {
        await user.save();
      }
    } else {
      // Create new user if not found
      const newUserData = {
        id: `USR-${Math.floor(1000 + Math.random() * 9000)}`,
        name: name || email.split('@')[0],
        email: email.toLowerCase(),
        role: role || getRole(email),
        password: password || '',
        rollNo: rollNo || '',
        createdAt: new Date()
      };
      user = new User(newUserData);
      await user.save();
    }

    // Create a login token
    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const userObj = user.toObject();
    res.status(200).json({
      message: 'User sync successful',
      user: userObj,
      token
    });
  } catch (error) {
    console.error('Sync error:', error.message);
    const fallbackEmail = req.body.email || '';
    res.status(200).json({ 
      message: 'Sync fallback active', 
      user: { 
        email: fallbackEmail,
        name: fallbackEmail.split('@')[0] || 'User',
        role: getRole(fallbackEmail)
      } 
    });
  }
});

// Signup API
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields (name, email, password) are required' });
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Find the role
    const role = getRole(email);

    // Save the new user
    const newUser = {
      id: `USR-${Math.floor(1000 + Math.random() * 9000)}`,
      name,
      email,
      password: password,
      role,
      createdAt: new Date().toISOString()
    };

    await createUser(newUser);

    // Create token
    const token = jwt.sign(
      { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Send back token and user details
    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Internal server error during registration' });
  }
});

// Login API
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check password (supports bcrypt and plain text fallback)
    let isMatch = false;
    if (user.password === password) {
      isMatch = true;
    } else {
      try {
        isMatch = await bcrypt.compare(password, user.password);
      } catch (e) {
        isMatch = false;
      }
    }

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Create token
    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { password: _, ...userWithoutPassword } = user;
    res.status(200).json({
      message: 'Login successful',
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error during login' });
  }
});

// Forgot password API
// Verifies if user exists in the MongoDB database. 
// The actual reset email is sent by the frontend via the Firebase Client SDK.
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ message: 'User with this email was not found' });
    }
    res.status(200).json({
      message: 'User verified successfully. Password reset process initiated.'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Internal server error during password reset request' });
  }
});

// Get user profile
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await findUserByEmail(req.user.email);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { password: _, ...userWithoutPassword } = user;
    res.status(200).json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
