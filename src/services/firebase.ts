import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "high-xerocopy-qpp0d",
  appId: "1:91733512647:web:251fdaf947155e8112c9e2",
  apiKey: "AIzaSyAKWH5nYjl1B1votcmx8FDWkNEz40lWEZ0",
  authDomain: "high-xerocopy-qpp0d.firebaseapp.com",
  storageBucket: "high-xerocopy-qpp0d.firebasestorage.app",
  messagingSenderId: "91733512647"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Firestore
export const db = getFirestore(app, "ai-studio-smarttodolist-5036ab7f-38d2-4ce5-aade-b818842c869f");
