import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBZt0JQZGsyCksOrdN0m0gbcp8DM5mlhTk",
  authDomain: "firm-antenna-ns9cr.firebaseapp.com",
  projectId: "firm-antenna-ns9cr",
  storageBucket: "firm-antenna-ns9cr.firebasestorage.app",
  messagingSenderId: "918604974219",
  appId: "1:918604974219:web:64f2b03740d4ffc7fd6c8e"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Since there's a specific databaseId, we initialize firestore with it
const firestoreDatabaseId = "ai-studio-4a245081-7d56-41c1-8a5d-3fc23b6b6f6a";
const db = getFirestore(app, firestoreDatabaseId);

export { app, auth, googleProvider, db };
