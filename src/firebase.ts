import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';

// Firebase config is read from Vite env vars. Create a .env.local with VITE_FIREBASE_... values.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Check if Firebase config is properly set and valid
export const isFirebaseConfigured = () => {
  const hasConfig = !!(
    import.meta.env.VITE_FIREBASE_API_KEY &&
    import.meta.env.VITE_FIREBASE_PROJECT_ID &&
    import.meta.env.VITE_FIREBASE_API_KEY !== 'your_api_key_here' &&
    import.meta.env.VITE_FIREBASE_PROJECT_ID !== 'your_project_id'
  );
  
  // Additional check for demo/fake credentials
  const isDemo = import.meta.env.VITE_FIREBASE_API_KEY?.includes('Demo') ||
                 import.meta.env.VITE_FIREBASE_PROJECT_ID?.includes('demo');
  
  return hasConfig && !isDemo;
};

let app: any = null;
let auth: any = null;
let db: any = null;

// Only initialize Firebase if we have valid configuration
if (isFirebaseConfigured()) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    // Use initializeFirestore with auto-detected long polling to avoid 400 errors in some networks
    try {
      db = initializeFirestore(app, {
        experimentalAutoDetectLongPolling: true,
        useFetchStreams: false,
      } as any);
    } catch {
      // Fallback to default Firestore if initializeFirestore options not supported
      db = getFirestore(app);
    }
    console.log('✅ Firebase initialized successfully', {
      projectId: firebaseConfig.projectId,
      authDomain: firebaseConfig.authDomain,
    });
  } catch (error) {
    console.warn('⚠️ Firebase initialization failed, using mock mode:', error);
    app = null;
    auth = null;
    db = null;
  }
} else {
  console.log('🏪 Firebase not configured, using local storage mode');
}

export { auth, db };
export default app;
