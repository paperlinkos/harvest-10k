import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, Firestore, enableIndexedDbPersistence } from 'firebase/firestore';

// Firebase configuration for Harvest 10K
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyD1c-WSS4ZxDW_60sEytc_2soxkKiBf3Y0",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "radio-over-lw-a7008.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "radio-over-lw-a7008",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "radio-over-lw-a7008.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "201441769052",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:201441769052:web:e5e09fb9c69ba5f2c4d899",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-GWMG2NPKQT"
};

// Initialize Firebase App singleton
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Cloud Firestore
export const db: Firestore = getFirestore(app);

export default app;
