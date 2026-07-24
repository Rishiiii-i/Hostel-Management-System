import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { findUserByEmail } from '../db.js';

dotenv.config();

export async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Get the token from header

  if (!token) {
    return res.status(401).json({ message: 'Access token is required' });
  }


  const secret = process.env.JWT_SECRET || 'smart-hostel-secret-key-12345';

  try {
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    next();
  } catch (error) {
    // If verification fails, try to decode the token (handles Firebase ID tokens / expired tokens)
    try {
      const decoded = jwt.decode(token);
      if (decoded && decoded.email) {
        const user = await findUserByEmail(decoded.email);
        if (user) {
          req.user = { id: user.id, name: user.name, email: user.email, role: user.role };
          return next();
        }
      }
    } catch (decodeError) {
      console.error('JWT Decode fallback failed:', decodeError.message);
    }

    console.error('JWT Verification Failed:', error.message, 'Token snippet:', token ? token.substring(0, 15) + '...' : 'none');
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
}
