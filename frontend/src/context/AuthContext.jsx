import { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  sendPasswordResetEmail, 
  signOut, 
  updateProfile,
  onAuthStateChanged,
  confirmPasswordReset,
  verifyPasswordResetCode
} from 'firebase/auth';

import { notificationService } from '../services/notificationService';

const AuthContext = createContext(null);

// warden credentials
export const PREDEFINED_WARDEN_CREDENTIALS = {
  email: 'warden@smarthostel.com',
  password: 'warden123',
  name: 'Dileep',
  role: 'warden'
};

// admin credentials
export const PREDEFINED_ADMIN_CREDENTIALS = {
  email: 'admin@smarthostel.com',
  password: 'admin123',
  name: 'System Administrator',
  role: 'administrator'
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [pendingOtpEmail, setPendingOtpEmail] = useState(() => {
    return localStorage.getItem('pending_otp_email') || null;
  });

  const [user, setUser] = useState(() => {
    const cached = localStorage.getItem('user');
    try {
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  // check if user is in local storage
  const [loading, setLoading] = useState(() => {
    return !localStorage.getItem('user');
  });

  const syncUserWithBackend = async (fbUser, customName = null, rollNo = null, password = null) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch('http://localhost:5000/api/auth/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify({
          uid: fbUser.uid,
          name: customName || fbUser.displayName || fbUser.email.split('@')[0],
          email: fbUser.email,
          photoURL: fbUser.photoURL || '',
          rollNo: rollNo || '',
          password: password,
        }),
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error('Failed to sync profile with database');
      }

      const data = await response.json();
      // get token from backend or firebase
      const token = data.token || (await fbUser.getIdToken().catch(() => 'token'));
      
      if (token) {
        localStorage.setItem('token', token);
      }
      return data.user;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  };

  const sendOtp = async (email) => {
    const response = await fetch('http://localhost:5000/api/auth/send-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to send OTP code.');
    }

    setPendingOtpEmail(email);
    localStorage.setItem('pending_otp_email', email);
    return data;
  };

  const verifyOtp = async (email, otp) => {
    const response = await fetch('http://localhost:5000/api/auth/verify-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, otp }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Invalid or expired OTP.');
    }

    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.removeItem('pending_otp_email');
    setPendingOtpEmail(null);
    setUser(data.user);
    setLoading(false);
    return data;
  };

  const resendOtp = async (email) => {
    const response = await fetch('http://localhost:5000/api/auth/resend-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to resend OTP code.');
    }

    return data;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setFirebaseUser(fbUser);
        try {
          const syncedUser = await syncUserWithBackend(fbUser);
          // Only automatically log in without OTP if user is non-student OR has already verified 2FA token
          const cachedUser = localStorage.getItem('user');
          const cachedToken = localStorage.getItem('token');

          if (syncedUser.role === 'student') {
            if (cachedUser && cachedToken) {
              setUser(JSON.parse(cachedUser));
            } else {
              // Student needs 2FA verification
              setUser(null);
            }
          } else {
            // Warden / Admin directly login
            const fbToken = await fbUser.getIdToken().catch(() => 'token');
            localStorage.setItem('token', cachedToken || fbToken);
            localStorage.setItem('user', JSON.stringify(syncedUser));
            setUser(syncedUser);
          }
        } catch (error) {
          console.error("Auth state change sync failed:", error);
          const cachedUser = localStorage.getItem('user');
          if (cachedUser) {
            setUser(JSON.parse(cachedUser));
          }
        }
        setLoading(false);
      } else {
        setFirebaseUser(null);
        const cachedUser = localStorage.getItem('user');
        const cachedToken = localStorage.getItem('token');
        if (!cachedUser || !cachedToken) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('shm_user_profile');
          setUser(null);
        }
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const handlePostAuthentication = async (syncedUser, email) => {
    const isStudent = !syncedUser.role || syncedUser.role === 'student';

    if (isStudent) {
      // Require 2FA OTP for Student Dashboard
      await sendOtp(email);
      return { requires2FA: true, email, user: syncedUser };
    } else {
      // Warden / Admin proceed without 2FA
      localStorage.setItem('user', JSON.stringify(syncedUser));
      setUser(syncedUser);
      setLoading(false);
      return { requires2FA: false, user: syncedUser };
    }
  };

  const signUpWithEmail = async (name, email, password, rollNo) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name }).catch(() => {});
      
      setFirebaseUser(userCredential.user);

      // Sync user details with backend
      const syncedUser = await syncUserWithBackend(userCredential.user, name, rollNo, password);
      return await handlePostAuthentication(syncedUser, email);
    } catch (fbErr) {
      // Fallback to backend REST API signup
      try {
        const response = await fetch('http://localhost:5000/api/auth/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name, email, password }),
        });
        if (response.ok) {
          const data = await response.json();
          return await handlePostAuthentication(data.user, email);
        }
      } catch (backendErr) {
        console.error('Backend signup fallback failed:', backendErr);
      }
      throw fbErr;
    }
  };

  const logInWithEmail = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      setFirebaseUser(userCredential.user);

      // Sync user details with backend
      const syncedUser = await syncUserWithBackend(userCredential.user, null, null, password);
      return await handlePostAuthentication(syncedUser, email);
    } catch (error) {
      // Fall back to backend REST API login
      try {
        const response = await fetch('http://localhost:5000/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });
        if (response.ok) {
          const data = await response.json();
          return await handlePostAuthentication(data.user, email);
        } else {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.message || 'Login failed');
        }
      } catch (backendErr) {
        console.error('Backend login fallback failed:', backendErr);
        throw error;
      }
    }
  };

  const logInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const userCredential = await signInWithPopup(auth, provider);
    
    setFirebaseUser(userCredential.user);

    // Sync user details with backend
    const syncedUser = await syncUserWithBackend(userCredential.user);
    return await handlePostAuthentication(syncedUser, userCredential.user.email);
  };

  const sendPasswordReset = async (email) => {
    await sendPasswordResetEmail(auth, email);
  };

  const verifyResetCode = async (code) => {
    return await verifyPasswordResetCode(auth, code);
  };

  const confirmReset = async (code, newPassword) => {
    await confirmPasswordReset(auth, code, newPassword);
  };

  const updateUserData = async (updatedData) => {
    if (auth.currentUser && updatedData.name) {
      try {
        await updateProfile(auth.currentUser, { displayName: updatedData.name });
      } catch (err) {
        console.error('Failed to update firebase display name:', err);
      }
    }
    setUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...updatedData };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  };

  const updateProfileName = async (newName) => {
    await updateUserData({ name: newName });
  };

  const logOut = async () => {
    const confirmed = window.confirm('Are you sure you want to logout?');
    if (!confirmed) return;

    const oldToken = localStorage.getItem('token');
    try {
      if (oldToken) {
        await notificationService.teardown(oldToken);
      }
      await signOut(auth);
    } catch (error) {
      console.error('Signout failed:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('shm_user_profile');
      localStorage.removeItem('pending_otp_email');
      setPendingOtpEmail(null);
      setUser(null);
      setFirebaseUser(null);
      setLoading(false);
      window.location.hash = '#home';
    }
  };

  const value = {
    user,
    firebaseUser,
    loading,
    pendingOtpEmail,
    setPendingOtpEmail,
    sendOtp,
    verifyOtp,
    resendOtp,
    signUpWithEmail,
    logInWithEmail,
    logInWithGoogle,
    sendPasswordReset,
    verifyResetCode,
    confirmReset,
    logOut,
    updateProfileName,
    updateUserData
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
