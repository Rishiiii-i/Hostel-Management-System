import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { User, findUserByEmail, createUser } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import nodemailer from 'nodemailer';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import fs from 'fs';
import path from 'path';

// Check if Firebase Service Account key file exists
let firebaseAdminApp = null;
const serviceAccountPath = path.resolve('serviceAccountKey.json');

if (fs.existsSync(serviceAccountPath)) {
  try {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    firebaseAdminApp = initializeApp({
      credential: cert(serviceAccount)
    });
    console.log('Firebase Admin SDK initialized successfully using serviceAccountKey.json');
  } catch (err) {
    console.error('Error parsing serviceAccountKey.json:', err.message);
  }
} else {
  // Warn if the Firebase key file is missing
  console.warn('serviceAccountKey.json not found. Firebase Admin SDK features (like generating reset links) will fail. Please drop this file in your backend folder.');
}

// Setup email sender
const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
const smtpPort = parseInt(process.env.SMTP_PORT || '465');
const smtpUser = process.env.SMTP_USER || '';
const smtpPass = process.env.SMTP_PASS || '';

let transporter = null;

if (smtpUser && smtpPass && smtpUser !== 'your_email@gmail.com') {
  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465, // Use SSL for port 465
    auth: {
      user: smtpUser,
      pass: smtpPass
    }
  });
  console.log('Nodemailer SMTP transporter configured.');
} else {
  console.warn('SMTP credentials not set or contain defaults. Using console fallback log transporter. Emails will not actually be sent. Please update backend/.env.');
  transporter = {
    sendMail: async (mailOptions) => {
      console.log('[EMAIL FALLBACK LOG]');
      console.log('--------------------------------------------------');
      console.log(`From: ${mailOptions.from}`);
      console.log(`To: ${mailOptions.to}`);
      console.log(`Subject: ${mailOptions.subject}`);
      console.log('HTML Body snippet:');
      console.log(mailOptions.html ? mailOptions.html.substring(0, 500) + '...' : mailOptions.text);
      console.log('--------------------------------------------------');
      return { messageId: 'console-mock-msg-id-' + Math.random() };
    }
  };
}

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
      user = new User({
        id: `USR-${Math.floor(1000 + Math.random() * 9000)}`,
        name: name || email.split('@')[0],
        email: email.toLowerCase(),
        role: role || getRole(email),
        password: password || '', // Save password
        rollNo: rollNo || '',      // Save roll number
        createdAt: new Date()
      });
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
    res.status(200).json({ message: 'Sync fallback active', user: { email: req.body.email } });
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

    // Encrypt password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Find the role
    const role = getRole(email);

    // Save the new user
    const newUser = {
      id: `USR-${Math.floor(1000 + Math.random() * 9000)}`,
      name,
      email,
      password: hashedPassword,
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

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
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

    // 1. Make reset link
    if (!firebaseAdminApp || !getApps().length) {
      return res.status(500).json({ 
        message: 'Firebase Admin SDK is not initialized. Please ensure backend/serviceAccountKey.json is configured.' 
      });
    }

    // Point link to our page
    // Client needs reset params
    const actionCodeSettings = {
      url: 'http://localhost:5173/', 
    };

    const resetLink = await getAuth().generatePasswordResetLink(email.toLowerCase(), actionCodeSettings);

    // 2. Make HTML email
    const mailOptions = {
      from: `"Smart Hostel" <${process.env.SMTP_USER || 'noreply@smarthostel.com'}>`,
      to: email.toLowerCase(),
      subject: 'Reset your Smart Hostel Password',
      html: `
        <div style="font-family: 'Inter', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #10b981; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">Smart Hostel</h1>
            <p style="color: #64748b; font-size: 14px; margin-top: 4px; font-weight: 500;">Hostel Management System</p>
          </div>
          <div style="padding: 24px; border-radius: 8px; background-color: #f8fafc; border: 1px solid #f1f5f9;">
            <h2 style="color: #0f172a; margin-top: 0; font-size: 18px; font-weight: 700;">Password Reset Request</h2>
            <p style="color: #475569; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
              Hello ${user.name || 'Resident'},<br><br>
              We received a request to reset the password for your Smart Hostel account associated with <strong>${email}</strong>. 
              Click the button below to set a new password:
            </p>
            <div style="text-align: center; margin-bottom: 24px;">
              <a href="${resetLink}" target="_blank" style="display: inline-block; padding: 14px 28px; background-color: #10b981; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.2);">
                Reset Password
              </a>
            </div>
            <p style="color: #64748b; font-size: 13px; line-height: 1.6; margin-bottom: 0;">
              If you didn't request a password reset, you can safely ignore this email. This link will expire shortly.
            </p>
          </div>
          <div style="text-align: center; margin-top: 24px; font-size: 12px; color: #94a3b8;">
            <p style="margin: 0;">&copy; ${new Date().getFullYear()} Smart Hostel. All rights reserved.</p>
            <p style="margin: 4px 0 0 0;">If you're having trouble clicking the button, copy and paste the link below into your browser:</p>
            <p style="margin: 8px 0 0 0; word-break: break-all; color: #3b82f6;"><a href="${resetLink}" style="color: #3b82f6;">${resetLink}</a></p>
          </div>
        </div>
      `
    };

    // 3. Send the email
    await transporter.sendMail(mailOptions);

    res.status(200).json({
      message: 'Password reset instructions have been sent to your email.'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: error.message || 'Internal server error during password reset request' });
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
