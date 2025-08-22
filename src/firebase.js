// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCKFcMyZ5YCljZ2v_Y1oJPoVfnA_yumRiI",
  authDomain: "warranty-dashboard-469704.firebaseapp.com",
  projectId: "warranty-dashboard-469704",
  storageBucket: "warranty-dashboard-469704.firebasestorage.app",
  messagingSenderId: "902896635203",
  appId: "1:902896635203:web:e1ece064693234901d33f6",
  measurementId: "G-T5HZ12JJ30"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firestore instance
export const db = getFirestore(app);
