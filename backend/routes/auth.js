import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, findUserByEmail, createUser } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'smart-hostel-secret-key-12345';

// helper to determine role from email
function getRole(email) {
  const value = email.toLowerCase();
  if (value.includes('admin')) return 'administrator';
  if (value.includes('warden')) return 'warden';
  return 'student';
}

// sync firebase auth details to mongodb user schema
router.post('/sync', async (req, res) => {
  try {
    const { uid, name, email, role, password, rollNo } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required to sync' });
    }

    // find user strictly by email
    let user = await User.findOne({ email: email.toLowerCase() });

    if (user) {
      // user exists update password and rollno if provided
      let updated = false;
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
      // user doesn't exist create a new record in mongodb (without firebaseuid/photourl)
      user = new User({
        id: `USR-${Math.floor(1000 + Math.random() * 9000)}`,
        name: name || email.split('@')[0],
        email: email.toLowerCase(),
        role: role || getRole(email),
        password: password || '', // save plaintext password directly
        rollNo: rollNo || '',      // save rollno directly
        createdAt: new Date()
      });
      await user.save();
    }

    const userObj = user.toObject();
    res.status(200).json({
      message: 'User sync successful',
      user: userObj
    });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ message: 'Internal server error during profile sync' });
  }
});

// signup route
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

    // hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // determine role
    const role = getRole(email);

    // create user
    const newUser = {
      id: `USR-${Math.floor(1000 + Math.random() * 9000)}`,
      name,
      email,
      password: hashedPassword,
      role,
      createdAt: new Date().toISOString()
    };

    await createUser(newUser);

    // generate token
    const token = jwt.sign(
      { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // return token and user details (omitting password)
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

// login route
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

    // verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // generate token
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

// forgot password route
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

    // mock sending reset link
    res.status(200).json({
      message: 'Password reset instructions have been sent to your email.'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Internal server error during password reset request' });
  }
});

// get current user profile route
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
