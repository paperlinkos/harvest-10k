import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { auth, googleProvider } from '../services/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  loginWithGoogle: () => Promise<User | null>;
  loginWithEmail: (email: string, pass: string) => Promise<User | null>;
  signupWithEmail: (email: string, pass: string, name?: string) => Promise<User | null>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  loginWithGoogle: async () => null,
  loginWithEmail: async () => null,
  signupWithEmail: async () => null,
  logout: async () => {},
  isAdmin: false,
  clearError: () => {},
});

// Admin emails with designated system authority
const ADMIN_EMAILS = [
  'dutiarukbackups@gmail.com',
];

interface CachedUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

const USER_CACHE_KEY = 'harvest_auth_user_cache';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(USER_CACHE_KEY);
        if (cached) {
          return JSON.parse(cached) as User;
        }
      } catch (e) {
        console.warn('Failed to read cached auth session:', e);
      }
    }
    return null;
  });
  const [loading, setLoading] = useState<boolean>(() => {
    // If we already have a cached session, we are immediately ready offline
    if (typeof window !== 'undefined' && localStorage.getItem(USER_CACHE_KEY)) {
      return false;
    }
    return true;
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        if (currentUser) {
          setUser(currentUser);
          try {
            const cachePayload: CachedUser = {
              uid: currentUser.uid,
              email: currentUser.email,
              displayName: currentUser.displayName,
              photoURL: currentUser.photoURL,
            };
            localStorage.setItem(USER_CACHE_KEY, JSON.stringify(cachePayload));
          } catch (e) {
            console.warn('Failed to cache auth user:', e);
          }
        } else {
          // Only clear if we are genuinely unauthenticated online
          if (navigator.onLine) {
            setUser(null);
            localStorage.removeItem(USER_CACHE_KEY);
          }
        }
        setLoading(false);
      },
      (err) => {
        console.error('Firebase Auth state error:', err);
        // Do not kick user out in offline/network failure
        if (navigator.onLine) {
          setError(err.message);
        }
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async (): Promise<User | null> => {
    try {
      setError(null);
      const result = await signInWithPopup(auth, googleProvider);
      setUser(result.user);
      if (result.user) {
        const cachePayload: CachedUser = {
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName,
          photoURL: result.user.photoURL,
        };
        localStorage.setItem(USER_CACHE_KEY, JSON.stringify(cachePayload));
      }
      return result.user;
    } catch (err: unknown) {
      console.error('Firebase Google Sign-In error:', err);
      let errorMsg = 'Failed to sign in with Google.';
      if (err instanceof Error) {
        if (err.message.includes('popup-blocked')) {
          errorMsg = 'Sign-in popup was blocked by your browser. Please allow popups for this site and try again.';
        } else if (err.message.includes('popup-closed-by-user')) {
          errorMsg = 'Sign-in popup was closed before completion. Please try again.';
        } else if (err.message.includes('cancelled-popup-request')) {
          errorMsg = 'Another authentication request was already pending.';
        } else {
          errorMsg = err.message;
        }
      }
      setError(errorMsg);
      return null;
    }
  };

  const loginWithEmail = async (email: string, pass: string): Promise<User | null> => {
    try {
      setError(null);
      const result = await signInWithEmailAndPassword(auth, email, pass);
      setUser(result.user);
      if (result.user) {
        const cachePayload: CachedUser = {
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName,
          photoURL: result.user.photoURL,
        };
        localStorage.setItem(USER_CACHE_KEY, JSON.stringify(cachePayload));
      }
      return result.user;
    } catch (err: unknown) {
      console.error('Firebase Email Sign-In error:', err);
      const errorMsg = err instanceof Error ? err.message : 'Invalid email or password.';
      setError(errorMsg);
      return null;
    }
  };

  const signupWithEmail = async (email: string, pass: string, name?: string): Promise<User | null> => {
    try {
      setError(null);
      const result = await createUserWithEmailAndPassword(auth, email, pass);
      if (name && result.user) {
        await updateProfile(result.user, { displayName: name });
      }
      setUser(result.user);
      if (result.user) {
        const cachePayload: CachedUser = {
          uid: result.user.uid,
          email: result.user.email,
          displayName: name || result.user.displayName,
          photoURL: result.user.photoURL,
        };
        localStorage.setItem(USER_CACHE_KEY, JSON.stringify(cachePayload));
      }
      return result.user;
    } catch (err: unknown) {
      console.error('Firebase Email Sign-Up error:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to create Firebase user.';
      setError(errorMsg);
      return null;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await signOut(auth);
      setUser(null);
      setError(null);
      localStorage.removeItem(USER_CACHE_KEY);
    } catch (err: unknown) {
      console.error('Firebase Sign-Out error:', err);
      setUser(null);
      localStorage.removeItem(USER_CACHE_KEY);
      if (err instanceof Error) {
        setError(err.message);
      }
    }
  };

  const clearError = () => setError(null);

  const isAdmin = Boolean(
    user && user.email && ADMIN_EMAILS.includes(user.email.toLowerCase())
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        loginWithGoogle,
        loginWithEmail,
        signupWithEmail,
        logout,
        isAdmin,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
