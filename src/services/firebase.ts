import { initializeApp } from 'firebase/app';
import { getAuth, browserLocalPersistence, setPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "smart-to-do-ca979",
  appId: "1:54005926303:web:0b10ed4f6542b8d12a15aa",
  apiKey: "AIzaSyDqE7R4fpNdxd-27mcxiONSwfcr5wIK48M",
  authDomain: "smart-to-do1.vercel.app",
  storageBucket: "smart-to-do-ca979.firebasestorage.app",
  messagingSenderId: "54005926303"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
console.log('[AUTH] Firebase initialized');

// Initialize Firebase Auth with persistent storage
export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn('[AUTH] Persistence setup warning:', err);
});

// Initialize Firestore
export const db = getFirestore(app, "ai-studio-smarttodolist-5036ab7f-38d2-4ce5-aade-b818842c869f");
