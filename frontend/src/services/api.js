import { auth } from '../firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail, 
  signOut,
  updateProfile
} from 'firebase/auth';

export const getToken = () => localStorage.getItem('token');
export const setToken = (token) => localStorage.setItem('token', token);
export const removeToken = () => localStorage.removeItem('token');

export const getUser = () => {
  const user = localStorage.getItem('user');
  try {
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
};
export const setUser = (user) => localStorage.setItem('user', JSON.stringify(user));
export const removeUser = () => localStorage.removeItem('user');

// Helper to determine role from email
function getRole(email) {
  const value = email?.toLowerCase() || '';
  if (value.includes('admin')) return 'administrator';
  if (value.includes('warden')) return 'warden';
  return 'student';
}

export const api = {
  signup: async (name, email, password) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update the user's displayName in Firebase
      await updateProfile(userCredential.user, { displayName: name });
      
      const token = await userCredential.user.getIdToken();
      const user = {
        id: userCredential.user.uid,
        name: name,
        email: userCredential.user.email,
        role: getRole(email)
      };

      setToken(token);
      setUser(user);
      return { token, user };
    } catch (error) {
      // Map Firebase error codes to readable messages
      let message = 'Registration failed';
      if (error.code === 'auth/email-already-in-use') {
        message = 'User with this email already exists';
      } else if (error.code === 'auth/weak-password') {
        message = 'Password should be at least 6 characters';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Invalid email address';
      } else {
        message = error.message || message;
      }
      throw new Error(message);
    }
  },

  login: async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const token = await userCredential.user.getIdToken();
      const user = {
        id: userCredential.user.uid,
        name: userCredential.user.displayName || 'User',
        email: userCredential.user.email,
        role: getRole(email)
      };

      setToken(token);
      setUser(user);
      return { token, user };
    } catch (error) {
      let message = 'Login failed';
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/invalid-email') {
        message = 'Invalid email or password';
      } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        message = 'Invalid email or password';
      } else {
        message = error.message || message;
      }
      throw new Error(message);
    }
  },

  forgotPassword: async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { message: 'Password reset instructions have been sent to your email.' };
    } catch (error) {
      let message = 'Failed to request password reset';
      if (error.code === 'auth/user-not-found') {
        message = 'User with this email was not found';
      } else {
        message = error.message || message;
      }
      throw new Error(message);
    }
  },

  getCurrentUser: async () => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      const token = await currentUser.getIdToken();
      setToken(token);
      const user = {
        id: currentUser.uid,
        name: currentUser.displayName || 'User',
        email: currentUser.email,
        role: getRole(currentUser.email)
      };
      setUser(user);
      return user;
    }
    return getUser();
  },

  logout: async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Firebase signout error:', err);
    }
    removeToken();
    removeUser();
  }
};
