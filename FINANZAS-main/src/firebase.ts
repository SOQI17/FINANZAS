import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// User's Firebase configuration
export const activeFirebaseConfig = {
  apiKey: "AIzaSyAq4YI2Koz3FAX8-NKS6MWV3jYhQslNRGo",
  authDomain: "ingresos-75841.firebaseapp.com",
  projectId: "ingresos-75841",
  storageBucket: "ingresos-75841.firebasestorage.app",
  messagingSenderId: "837860132825",
  appId: "1:837860132825:web:b845b138c416323257bbc8",
  ...firebaseConfig
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(activeFirebaseConfig) : getApp();

// Get Auth
export const auth = getAuth(app);

// Get Firestore
const dbId = (activeFirebaseConfig as { firestoreDatabaseId?: string }).firestoreDatabaseId;
export const db = (dbId && dbId !== '(default)')
  ? getFirestore(app, dbId)
  : getFirestore(app);

export default app;
