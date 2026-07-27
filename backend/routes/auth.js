import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { User, Otp, findUserByEmail, createUser } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import { sendOtpEmail } from '../services/emailService.js';
import { firebaseAdminApp, getAuth } from '../config/firebaseAdmin.js';


const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'smart-hostel-secret-key-12345';

// get user role from email
function getRole(email) {
  const value = email.toLowerCase();
  if (value.includes('admin')) return 'administrator';
  if (value.includes('warden')) return 'warden';
  return 'student';
}

// sync user from firebase to mongodb
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

    // search for user by email
    let user = await User.findOne({ email: email.toLowerCase() });

    if (user) {
      // update user details if user exists
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
      // create new user if not found
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

    // create a login token
    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const userObj = user.toObject();
    delete userObj.password;
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

// signup api
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

    // find the role
    const role = getRole(email);

    // Save the new user (userSchema pre-save hook automatically hashes password with bcrypt if not already hashed)
    const newUser = {
      id: `USR-${Math.floor(1000 + Math.random() * 9000)}`,
      name,
      email,
      password: password,
      role,
      createdAt: new Date().toISOString()
    };

    await createUser(newUser);

    // create token
    const token = jwt.sign(
      { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // send back token and user details
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

// login api
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

    // Verify password (supports bcrypt and plain text fallback)
    let isMatch = false;
    if (user.password) {
      if (/^\$2[aby]\$\d+\$/.test(user.password)) {
        isMatch = await bcrypt.compare(password, user.password);
      } else {
        isMatch = (user.password === password);
      }
    }

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // create token
    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const userObj = typeof user.toObject === 'function' ? user.toObject() : { ...user };
    delete userObj.password;

    res.status(200).json({
      message: 'Login successful',
      token,
      user: userObj
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error during login' });
  }
});

// forgot password api
// verifies if user exists in the mongodb database 
// the actual reset email is sent by the frontend via the firebase client sdk
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

// Send OTP for 2FA Verification
router.post('/send-otp', async (req, res) => {
  try {
    const { email, firebaseUid, userId } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email address is required.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ message: 'Please enter a valid email address.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check rate limit: 60 seconds cooldown between OTP generation requests
    const latestOtp = await Otp.findOne({ email: normalizedEmail }).sort({ createdAt: -1 });
    if (latestOtp && (Date.now() - new Date(latestOtp.createdAt).getTime()) < 60000) {
      const remaining = Math.ceil((60000 - (Date.now() - new Date(latestOtp.createdAt).getTime())) / 1000);
      return res.status(429).json({
        message: `Please wait ${remaining} seconds before requesting a new OTP.`,
        remainingSeconds: remaining
      });
    }

    // Invalidate previous unverified OTPs for this email
    await Otp.deleteMany({ email: normalizedEmail, verified: false });

    // Generate secure random 6-digit numeric OTP
    const rawOtp = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash OTP before saving to database
    const otpHash = await bcrypt.hash(rawOtp, 10);

    // 5 minutes expiry
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    const newOtp = new Otp({
      userId: userId || null,
      firebaseUid: firebaseUid || null,
      email: normalizedEmail,
      otpHash,
      attempts: 0,
      verified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      expiresAt
    });

    await newOtp.save();

    // Send OTP via email service
    await sendOtpEmail(normalizedEmail, rawOtp);

    console.log(`[2FA] OTP generated and sent to: ${normalizedEmail}`);

    res.status(200).json({
      message: 'OTP code sent to your registered email address.',
      email: normalizedEmail,
      expiresInSeconds: 300,
      cooldownSeconds: 60
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ message: 'Failed to send OTP code. Please try again.' });
  }
});

// Verify OTP for 2FA Authentication
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email address and 6-digit OTP code are required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const cleanOtp = otp.toString().trim();

    if (cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
      return res.status(400).json({ message: 'OTP must be a 6-digit numeric code.' });
    }

    // Find latest active unverified OTP for email
    const otpRecord = await Otp.findOne({ email: normalizedEmail, verified: false }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid or expired OTP code. Please request a new one.' });
    }

    // Check if OTP has expired
    if (new Date() > new Date(otpRecord.expiresAt)) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ message: 'OTP code has expired. Please request a new code.' });
    }

    // Check maximum attempts limit (max 3 attempts)
    if (otpRecord.attempts >= 3) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ message: 'Maximum verification attempts exceeded. Please request a new OTP.' });
    }

    // Compare provided OTP code with bcrypt hash
    const isMatch = await bcrypt.compare(cleanOtp, otpRecord.otpHash);

    if (!isMatch) {
      otpRecord.attempts += 1;
      otpRecord.updatedAt = new Date();
      await otpRecord.save();

      const remainingAttempts = 3 - otpRecord.attempts;
      if (remainingAttempts <= 0) {
        await Otp.deleteOne({ _id: otpRecord._id });
        return res.status(400).json({ message: 'Maximum verification attempts exceeded. Please request a new OTP.' });
      }

      return res.status(400).json({
        message: `Invalid OTP code. ${remainingAttempts} attempt(s) remaining.`
      });
    }

    // Mark OTP as verified and delete to prevent replay attacks
    otpRecord.verified = true;
    otpRecord.updatedAt = new Date();
    await otpRecord.save();
    await Otp.deleteMany({ email: normalizedEmail });

    // Fetch user details from MongoDB
    let user = await findUserByEmail(normalizedEmail);
    if (!user) {
      user = new User({
        id: `USR-${Math.floor(1000 + Math.random() * 9000)}`,
        name: normalizedEmail.split('@')[0],
        email: normalizedEmail,
        role: getRole(normalizedEmail),
        createdAt: new Date()
      });
      await user.save();
    }

    // Firebase Admin SDK User Identity Verification & Custom Claims Update
    let fbUser = null;
    try {
      if (firebaseAdminApp) {
        const authAdmin = getAuth(firebaseAdminApp);
        fbUser = await authAdmin.getUserByEmail(normalizedEmail).catch(() => null);
        if (fbUser) {
          await authAdmin.setCustomUserClaims(fbUser.uid, { is2FAVerified: true, role: user.role });
          console.log(`[FirebaseAdmin] 2FA verified custom claim set for UID ${fbUser.uid} (${normalizedEmail})`);
        }
      }
    } catch (fbAdminError) {
      console.warn('[FirebaseAdmin] Identity verification notice:', fbAdminError.message);
    }

    // Generate session JWT token containing user & 2FA claims
    const token = jwt.sign(
      { 
        userId: user.id,
        id: user.id, 
        firebaseUid: fbUser ? fbUser.uid : (otpRecord.firebaseUid || user.id),
        name: user.name, 
        email: user.email, 
        role: user.role, 
        is2FAVerified: true,
        issuedAt: Date.now(),
        expiration: '7d'
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const userObj = typeof user.toObject === 'function' ? user.toObject() : { ...user };
    delete userObj.password;

    console.log(`[2FA] OTP successfully verified for student: ${normalizedEmail}`);

    res.status(200).json({
      message: 'OTP verification successful. Welcome to Student Dashboard.',
      token,
      user: userObj
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ message: 'Server error during OTP verification. Please try again.' });
  }
});

// Resend OTP API
router.post('/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email address is required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Enforce 60-second cooldown limit
    const latestOtp = await Otp.findOne({ email: normalizedEmail }).sort({ createdAt: -1 });
    if (latestOtp && (Date.now() - new Date(latestOtp.createdAt).getTime()) < 60000) {
      const remaining = Math.ceil((60000 - (Date.now() - new Date(latestOtp.createdAt).getTime())) / 1000);
      return res.status(429).json({
        message: `Please wait ${remaining} seconds before requesting a new OTP code.`,
        remainingSeconds: remaining
      });
    }

    // Invalidate previous unverified OTPs
    await Otp.deleteMany({ email: normalizedEmail, verified: false });

    // Generate new 6-digit OTP
    const rawOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(rawOtp, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    const newOtp = new Otp({
      email: normalizedEmail,
      otpHash,
      attempts: 0,
      verified: false,
      createdAt: new Date(),
      expiresAt
    });

    await newOtp.save();
    await sendOtpEmail(normalizedEmail, rawOtp);

    console.log(`[2FA] New OTP generated and resent to: ${normalizedEmail}`);

    res.status(200).json({
      message: 'A new OTP verification code has been sent to your email.',
      email: normalizedEmail,
      expiresInSeconds: 300,
      cooldownSeconds: 60
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ message: 'Failed to resend OTP. Please try again.' });
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
