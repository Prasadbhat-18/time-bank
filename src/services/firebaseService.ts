import { auth, db } from '../firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { User } from '../types';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

function mapFirebaseUserToUser(uid: string, data: Record<string, unknown>): User {
  return {
    id: uid,
    email: (data.email as string) || '',
    username: (data.username as string) || '',
    bio: (data.bio as string) || '',
    reputation_score: (data.reputation_score as number) ?? 5.0,
    total_reviews: (data.total_reviews as number) ?? 0,
    created_at: (data.created_at as string) || new Date().toISOString(),
  };
}

class FirebaseService {
  async login(email: string, password: string): Promise<User | null> {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const uid = cred.user.uid;
      try {
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (userDoc.exists()) {
          return mapFirebaseUserToUser(uid, userDoc.data());
        }
        // Firestore user doc missing – build a fallback user object from auth profile
        return {
          id: uid,
          email: cred.user.email || email,
            username: cred.user.displayName || (cred.user.email ? cred.user.email.split('@')[0] : email.split('@')[0]),
          bio: '',
          reputation_score: 5.0,
          total_reviews: 0,
          created_at: new Date().toISOString(),
          // Level system fields
          level: 1,
          experience_points: 0,
          services_completed: 0,
          custom_credits_enabled: false,
        } as User;
      } catch (error: any) {
        if (error.code === 'permission-denied' || /permission/i.test(error.message || '')) {
          // Return a safe fallback rather than blocking login entirely
          return {
            id: uid,
            email: cred.user.email || email,
            username: cred.user.displayName || (cred.user.email ? cred.user.email.split('@')[0] : email.split('@')[0]),
            bio: '',
            reputation_score: 5.0,
            total_reviews: 0,
            created_at: new Date().toISOString(),
            // Level system fields
            level: 1,
            experience_points: 0,
            services_completed: 0,
            custom_credits_enabled: false,
          } as User;
        }
        throw error;
      }
    } catch (error: any) {
      // Map common auth errors to clearer, user-friendly messages
      const code = error.code || '';
      let friendly = '';
      switch (code) {
        case 'auth/invalid-email':
          friendly = 'That email address is not valid.'; break;
        case 'auth/user-disabled':
          friendly = 'This account has been disabled.'; break;
        case 'auth/user-not-found':
          friendly = 'No account found with that email.'; break;
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
        case 'auth/invalid-login-credentials':
          friendly = 'Email or password is incorrect. Try again or use “Forgot password”.'; break;
        case 'auth/too-many-requests':
          friendly = 'Too many failed attempts. Please wait a moment and try again.'; break;
        case 'auth/network-request-failed':
          friendly = 'Network error contacting authentication server. Check your connection.'; break;
        case 'auth/operation-not-allowed':
          friendly = 'Email/password sign-in is not enabled in Firebase Console.'; break;
        case 'auth/configuration-not-found':
        case 'auth/invalid-api-key':
          friendly = 'Firebase configuration appears invalid. Verify your VITE_FIREBASE_* env values.'; break;
        default:
          friendly = error.message || 'Authentication failed.';
      }
      throw new Error(friendly);
    }
  }

  async register(email: string, password: string, username: string): Promise<User> {
    if (!auth) {
      throw new Error('❌ Firebase is not configured. Please check your VITE_FIREBASE_* environment variables in .env file. See FIREBASE_AUTH_FIX.md for help.');
    }
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const uid = cred.user.uid;
      const userRef = doc(db, 'users', uid);
      const data = {
        email,
        username,
        bio: '',
        reputation_score: 5.0,
        total_reviews: 0,
        created_at: new Date().toISOString(),
        signup_bonus: 10,
        // Level system fields
        level: 1,
        experience_points: 0,
        services_completed: 0,
        custom_credits_enabled: false,
      };
      try {
        await setDoc(userRef, data);
        return mapFirebaseUserToUser(uid, data);
      } catch (error: any) {
        if (error.code === 'permission-denied' || /permission/i.test(error.message || '')) {
          throw new Error('❌ Firestore permission error: Your Firestore rules may not allow writes. Check FIREBASE_AUTH_FIX.md for the correct rules to use.');
        }
        throw error;
      }
    } catch (error: any) {
      const code = error.code || '';
      if (code === 'auth/email-already-in-use') {
        throw new Error('This email is already registered. Try logging in or use a different email.');
      }
      if (code === 'auth/weak-password') {
        throw new Error('Password is too weak. Use at least 6 characters.');
      }
      if (code === 'auth/invalid-email') {
        throw new Error('Email address is not valid.');
      }
      if (code === 'auth/operation-not-allowed') {
        throw new Error('❌ Email/password sign-up is not enabled in Firebase Console. Enable it in Authentication → Sign-in method.');
      }
      throw error;
    }
  }

  async logout(): Promise<void> {
    await signOut(auth);
  }

  async loginWithGoogle(): Promise<User | null> {
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      const fbUser = cred.user;
      const uid = fbUser.uid;
      // Try to fetch user doc from Firestore, create if missing
      try {
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (userDoc.exists()) {
          return mapFirebaseUserToUser(uid, userDoc.data());
        }
      } catch (error: any) {
        if (error.code === 'permission-denied' || /permission/i.test(error.message || '')) {
          throw new Error('Firestore permission error while fetching Google user: check your Firestore rules (Missing or insufficient permissions)');
        }
      }

      // If user doc doesn't exist, create a simple user record
      const data = {
        email: fbUser.email || '',
        username: fbUser.displayName || (fbUser.email || '').split('@')[0],
        bio: '',
        reputation_score: 5.0,
        total_reviews: 0,
        created_at: new Date().toISOString(),
        // Level system fields
        level: 1,
        experience_points: 0,
        services_completed: 0,
        custom_credits_enabled: false,
      };
      try {
        await setDoc(doc(db, 'users', uid), data);
      } catch (error: any) {
        if (error.code === 'permission-denied' || /permission/i.test(error.message || '')) {
          throw new Error('Firestore permission error while creating Google user: check your Firestore rules (Missing or insufficient permissions)');
        }
      }
      return mapFirebaseUserToUser(uid, data);
    } catch (error: any) {
      // Map common Firebase auth errors to clearer messages
      if (error.code === 'auth/popup-blocked') {
        throw new Error('Popup blocked. Please allow popups and try again.');
      }
      if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Authentication popup closed before completing sign in.');
      }
      if (error.code === 'auth/operation-not-allowed') {
        throw new Error('Google sign-in is not enabled in your Firebase project. Enable it in Firebase Console → Authentication → Sign-in method → Google.');
      }
      throw error;
    }
  }

  async getCurrentUser(userId: string): Promise<User | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        return mapFirebaseUserToUser(userId, userDoc.data());
      }
      return null;
    } catch (error: any) {
      if (error.code === 'permission-denied' || /permission/i.test(error.message || '')) {
        throw new Error('Firestore permission error while fetching user: check your Firestore rules (Missing or insufficient permissions)');
      }
      throw error;
    }
  }

  async updateProfile(userId: string, updates: Partial<User>): Promise<User> {
    const userRef = doc(db, 'users', userId);
    
    // First, check if user has level system fields, add if missing (migration for old users)
    const userDoc = await getDoc(userRef);
    const userData = userDoc.data() || {};
    
    const ensureLevelFields: any = {};
    if (userData.level === undefined) ensureLevelFields.level = 1;
    if (userData.experience_points === undefined) ensureLevelFields.experience_points = 0;
    if (userData.services_completed === undefined) ensureLevelFields.services_completed = 0;
    if (userData.custom_credits_enabled === undefined) ensureLevelFields.custom_credits_enabled = false;
    
    const updatePayload = { ...ensureLevelFields, ...updates, updated_at: serverTimestamp() };
    await updateDoc(userRef, updatePayload);
    const updated = await getDoc(userRef);
    return mapFirebaseUserToUser(userId, updated.data() || {});
  }

  async sendResetEmail(email: string) {
    await sendPasswordResetEmail(auth, email);
  }

  async changePassword(currentPassword: string, newPassword: string) {
    if (!auth.currentUser || !auth.currentUser.email) throw new Error('No authenticated user');
    const cred = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
    await reauthenticateWithCredential(auth.currentUser, cred);
    await updatePassword(auth.currentUser, newPassword);
  }
}

export const firebaseService = new FirebaseService();
