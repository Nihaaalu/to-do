import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "smart-to-do-ca979",
  appId: "1:54005926303:web:0b10ed4f6542b8d12a15aa",
  apiKey: "AIzaSyDqE7R4fpNdxd-27mcxiONSwfcr5wIK48M",
  authDomain: "smart-to-do-ca979.firebaseapp.com",
  storageBucket: "smart-to-do-ca979.firebasestorage.app",
  messagingSenderId: "54005926303"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Firestore
export const db = getFirestore(app, "ai-studio-smarttodolist-5036ab7f-38d2-4ce5-aade-b818842c869f");
