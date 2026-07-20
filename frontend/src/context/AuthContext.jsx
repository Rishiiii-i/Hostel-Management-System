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
  const [loading, setLoading] = useState(true);

  const syncUserWithBackend = async (fbUser, customName = null) => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid: fbUser.uid,
          name: customName || fbUser.displayName || fbUser.email.split('@')[0],
          email: fbUser.email,
          photoURL: fbUser.photoURL || '',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to sync profile with database');
      }

      const data = await response.json();
      const token = await fbUser.getIdToken();
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      setUser(data.user);
      return data.user;
    } catch (error) {
      console.error('Error syncing user with backend, falling back to client-side session:', error);
      
      // Resilient Fallback: Construct user metadata from client session
      const token = await fbUser.getIdToken();
      const fallbackUser = {
        id: fbUser.uid,
        name: customName || fbUser.displayName || fbUser.email.split('@')[0],
        email: fbUser.email,
        role: fbUser.email.toLowerCase().includes('admin') ? 'administrator' : fbUser.email.toLowerCase().includes('warden') ? 'warden' : 'student',
        photoURL: fbUser.photoURL || '',
        isFallback: true
      };
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(fallbackUser));
      setUser(fallbackUser);
      return fallbackUser;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        try {
          await syncUserWithBackend(fbUser);
        } catch (err) {
          console.error('Could not sync user profile on session refresh:', err);
        }
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signUpWithEmail = async (name, email, password) => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Update profile display name immediately
      await updateProfile(userCredential.user, { displayName: name });
      // Sync user profile to backend MongoDB
      const syncedUser = await syncUserWithBackend(userCredential.user, name);
      setFirebaseUser(userCredential.user);
      setLoading(false);
      return { firebaseUser: userCredential.user, user: syncedUser };
    } catch (error) {
      console.error('Firebase signUpWithEmail error details:', error);
      setLoading(false);
      throw error;
    }
  };

  const logInWithEmail = async (email, password) => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const syncedUser = await syncUserWithBackend(userCredential.user);
      setFirebaseUser(userCredential.user);
      setLoading(false);
      return { firebaseUser: userCredential.user, user: syncedUser };
    } catch (error) {
      console.error('Firebase logInWithEmail error details:', error);
      setLoading(false);
      throw error;
    }
  };

  const logInWithGoogle = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      // Configure popup provider
      const userCredential = await signInWithPopup(auth, provider);
      const syncedUser = await syncUserWithBackend(userCredential.user);
      setFirebaseUser(userCredential.user);
      setLoading(false);
      return { firebaseUser: userCredential.user, user: syncedUser };
    } catch (error) {
      console.error('Firebase logInWithGoogle error details:', error);
      setLoading(false);
      throw error;
    }
  };

  const sendPasswordReset = async (email) => {
    await sendPasswordResetEmail(auth, email);
  };

  const logOut = async () => {
    setLoading(true);
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Signout failed:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      setFirebaseUser(null);
      setLoading(false);
    }
  };

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
