// src/lib/firebase.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const envConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const hasAllEnvValues = Object.values(envConfig).every((v) => Boolean(v));

// Fallback to the hard-coded config in src/firebase.js if env vars are not set
const fallbackConfig = {
  apiKey: "AIzaSyCKFcMyZ5YCljZ2v_Y1oJPoVfnA_yumRiI",
  authDomain: "warranty-dashboard-469704.firebaseapp.com",
  projectId: "warranty-dashboard-469704",
  storageBucket: "warranty-dashboard-469704.firebasestorage.app",
  messagingSenderId: "902896635203",
  appId: "1:902896635203:web:e1ece064693234901d33f6",
};

const firebaseConfig = hasAllEnvValues ? envConfig : fallbackConfig;

if (!hasAllEnvValues) {
   
  console.warn(
    "Using fallback Firebase config because VITE_FIREBASE_* env vars are missing."
  );
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firestore DB
export const db = getFirestore(app);
