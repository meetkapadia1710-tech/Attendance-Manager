// ─────────────────────────────────────────────────────────────
//  🔥 PASTE YOUR FIREBASE CONFIG HERE
//
//  Steps:
//  1. Go to https://console.firebase.google.com
//  2. Project Settings → General → Your apps → </> Web
//  3. Register app → copy the firebaseConfig object below
//  4. Enable Firestore: Firestore Database → Create database
//     → choose region → Start in test mode
// ─────────────────────────────────────────────────────────────

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY            ?? 'REPLACE_ME',
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN        ?? 'REPLACE_ME',
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID         ?? 'REPLACE_ME',
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET     ?? 'REPLACE_ME',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? 'REPLACE_ME',
  appId:             import.meta.env.VITE_FIREBASE_APP_ID              ?? 'REPLACE_ME',
};

const app = initializeApp(firebaseConfig);

/** Firestore instance shared across the app */
export const firestore = getFirestore(app);


/** Firebase Auth instance */
export const auth = getAuth(app);

export default app;
