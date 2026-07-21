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
  onAuthStateChanged 
} from 'firebase/auth';

const AuthContext = createContext(null);

// Predefined Warden Credentials
export const PREDEFINED_WARDEN_CREDENTIALS = {
  email: 'warden@smarthostel.com',
  password: 'warden123',
  name: 'Macha Rishi',
  role: 'warden'
};

// Predefined Admin Credentials
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
  const [user, setUser] = useState(() => {
    const cached = localStorage.getItem('user');
    try {
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  // If user is already cached in localStorage, start with loading = false immediately
  const [loading, setLoading] = useState(() => {
    return !localStorage.getItem('user');
  });

  const syncUserWithBackend = async (fbUser, customName = null, rollNo = null, password = null) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1000);

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
      const token = await fbUser.getIdToken().catch(() => 'token');
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      setUser(data.user);
      return data.user;
    } catch (error) {
      clearTimeout(timeoutId);
      
      const token = await fbUser.getIdToken().catch(() => 'token');
      const fallbackUser = {
        id: fbUser.uid,
        name: customName || fbUser.displayName || (fbUser.email ? fbUser.email.split('@')[0] : 'User'),
        email: fbUser.email || 'user@smarthostel.com',
        role: fbUser.email && fbUser.email.toLowerCase().includes('admin') ? 'administrator' : fbUser.email && fbUser.email.toLowerCase().includes('warden') ? 'warden' : 'student',
        photoURL: fbUser.photoURL || '',
        rollNo: rollNo || '',
        isFallback: true
      };
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(fallbackUser));
      setUser(fallbackUser);
      return fallbackUser;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        setFirebaseUser(fbUser);
        // Create user object instantly from Firebase auth token
        const fastUser = {
          id: fbUser.uid,
          name: fbUser.displayName || (fbUser.email ? fbUser.email.split('@')[0] : 'User'),
          email: fbUser.email,
          role: fbUser.email && fbUser.email.toLowerCase().includes('admin') ? 'administrator' : fbUser.email && fbUser.email.toLowerCase().includes('warden') ? 'warden' : 'student',
          photoURL: fbUser.photoURL || '',
          rollNo: ''
        };
        setUser(prev => prev || fastUser);
        setLoading(false);
        // Sync in background non-blocking
        syncUserWithBackend(fbUser).catch(() => {});
      } else {
        setFirebaseUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const signUpWithEmail = async (name, email, password, rollNo) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName: name }).catch(() => {});
    
    const fastUser = {
      id: userCredential.user.uid,
      name: name || email.split('@')[0],
      email: email,
      role: email.toLowerCase().includes('admin') ? 'administrator' : email.toLowerCase().includes('warden') ? 'warden' : 'student',
      photoURL: '',
      rollNo: rollNo || ''
    };

    localStorage.setItem('token', 'token');
    localStorage.setItem('user', JSON.stringify(fastUser));
    setUser(fastUser);
    setFirebaseUser(userCredential.user);
    setLoading(false);

    // Non-blocking background sync
    syncUserWithBackend(userCredential.user, name, rollNo, password).catch(() => {});
    return { firebaseUser: userCredential.user, user: fastUser };
  };

  const logInWithEmail = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const fastUser = {
        id: userCredential.user.uid,
        name: userCredential.user.displayName || email.split('@')[0],
        email: email,
        role: email.toLowerCase().includes('admin') ? 'administrator' : email.toLowerCase().includes('warden') ? 'warden' : 'student',
        photoURL: userCredential.user.photoURL || '',
        rollNo: ''
      };

      localStorage.setItem('token', 'token');
      localStorage.setItem('user', JSON.stringify(fastUser));
      setUser(fastUser);
      setFirebaseUser(userCredential.user);
      setLoading(false);

      // Non-blocking background sync
      syncUserWithBackend(userCredential.user, null, null, password).catch(() => {});
      return { firebaseUser: userCredential.user, user: fastUser };
    } catch (error) {
      // If user does not exist yet or credential mismatch occurs, auto-create account or fallback for demo access
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const fastUser = {
          id: userCredential.user.uid,
          name: email.split('@')[0],
          email: email,
          role: email.toLowerCase().includes('admin') ? 'administrator' : email.toLowerCase().includes('warden') ? 'warden' : 'student',
          photoURL: '',
          rollNo: ''
        };
        localStorage.setItem('token', 'token');
        localStorage.setItem('user', JSON.stringify(fastUser));
        setUser(fastUser);
        setFirebaseUser(userCredential.user);
        setLoading(false);
        syncUserWithBackend(userCredential.user, null, null, password).catch(() => {});
        return { firebaseUser: userCredential.user, user: fastUser };
      } catch (signupErr) {
        // Fallback demo user sign-in if Firebase restricts creation or password mismatch occurs
        const fallbackUser = {
          id: `usr-${Date.now()}`,
          name: email.split('@')[0],
          email: email,
          role: email.toLowerCase().includes('admin') ? 'administrator' : email.toLowerCase().includes('warden') ? 'warden' : 'student',
          photoURL: '',
          rollNo: ''
        };
        localStorage.setItem('token', 'demo-token');
        localStorage.setItem('user', JSON.stringify(fallbackUser));
        setUser(fallbackUser);
        setLoading(false);
        return { firebaseUser: null, user: fallbackUser };
      }
    }
  };

  const logInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const userCredential = await signInWithPopup(auth, provider);
    
    const fastUser = {
      id: userCredential.user.uid,
      name: userCredential.user.displayName || userCredential.user.email.split('@')[0],
      email: userCredential.user.email,
      role: userCredential.user.email.toLowerCase().includes('admin') ? 'administrator' : userCredential.user.email.toLowerCase().includes('warden') ? 'warden' : 'student',
      photoURL: userCredential.user.photoURL || '',
      rollNo: ''
    };

    localStorage.setItem('token', 'token');
    localStorage.setItem('user', JSON.stringify(fastUser));
    setUser(fastUser);
    setFirebaseUser(userCredential.user);
    setLoading(false);

    // Non-blocking background sync
    syncUserWithBackend(userCredential.user).catch(() => {});
    return { firebaseUser: userCredential.user, user: fastUser };
  };

  const sendPasswordReset = async (email) => {
    await sendPasswordResetEmail(auth, email);
  };

  const logOut = async () => {
    const confirmed = window.confirm('Are you sure you want to logout?')
    if (!confirmed) return

    try {
      await signOut(auth)
    } catch (error) {
      console.error('Signout failed:', error)
    } finally {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      setUser(null)
      setFirebaseUser(null)
      setLoading(false)
      window.location.hash = '#home'
    }
  }

  const value = {
    user,
    firebaseUser,
    loading,
    signUpWithEmail,
    logInWithEmail,
    logInWithGoogle,
    sendPasswordReset,
    logOut
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
