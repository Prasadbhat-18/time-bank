import { auth, db } from '../firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { User } from '../types';

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
  async ensureUserDocument(uid: string, defaults?: Partial<User>): Promise<User> {
    try {
      const userRef = doc(db, 'users', uid);
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        const base: Partial<User> = {
          bio: '',
          reputation_score: 5.0,
          total_reviews: 0,
          created_at: new Date().toISOString(),
        };
        const data = { ...base, ...defaults } as Record<string, unknown>;
        await setDoc(userRef, data);
        return mapFirebaseUserToUser(uid, data);
      }
      return mapFirebaseUserToUser(uid, snap.data());
    } catch (err: any) {
      // Graceful fallback if Firestore permissions/rules block access
      console.warn('Firestore access failed in ensureUserDocument; falling back to in-memory user', err?.code || err);
      const email = (defaults?.email as string) || '';
      const username = (defaults?.username as string) || (email ? email.split('@')[0] : 'user');
      const fallback: User = {
        id: uid,
        email,
        username,
        bio: '',
        reputation_score: 5.0,
        total_reviews: 0,
        created_at: new Date().toISOString(),
      };
      return fallback;
    }
  }

  async login(email: string, password: string): Promise<User | null> {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const uid = cred.user.uid;
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return mapFirebaseUserToUser(uid, userDoc.data());
    }
    // If auth succeeded but user doc missing, create it with minimal info
    return this.ensureUserDocument(uid, { email, username: email.split('@')[0] });
  }

  async register(email: string, password: string, username: string): Promise<User> {
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
    };
    try {
      await setDoc(userRef, data);
      return mapFirebaseUserToUser(uid, data);
    } catch (err: any) {
      console.warn('Failed to create user doc during register; returning minimal profile', err?.code || err);
      return {
        id: uid,
        email,
        username,
        bio: '',
        reputation_score: 5.0,
        total_reviews: 0,
        created_at: new Date().toISOString(),
      };
    }
  }

  async loginWithGoogle(): Promise<User> {
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);
    const uid = cred.user.uid;
    const email = cred.user.email || '';
    const username = cred.user.displayName || (email ? email.split('@')[0] : 'user');
    // Ensure user document exists (create if missing)
    try {
      const user = await this.ensureUserDocument(uid, { email, username });
      return user;
    } catch (err: any) {
      // Fallback to minimal user if rules prevent Firestore writes/reads
      console.warn('Failed to ensure user document after Google login; using minimal user profile', err?.code || err);
      return {
        id: uid,
        email,
        username,
        bio: '',
        reputation_score: 5.0,
        total_reviews: 0,
        created_at: new Date().toISOString(),
      } as User;
    }
  }

  async logout(): Promise<void> {
    await signOut(auth);
  }

  async getCurrentUser(userId: string): Promise<User | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        return mapFirebaseUserToUser(userId, userDoc.data());
      }
      return null;
    } catch (err) {
      console.warn('Failed to load user from Firestore (getCurrentUser)', err);
      return null;
    }
  }

  async updateProfile(userId: string, updates: Partial<User>): Promise<User> {
    const userRef = doc(db, 'users', userId);
    const updatePayload = { ...updates, updated_at: serverTimestamp() };
    try {
      await updateDoc(userRef, updatePayload);
      const updated = await getDoc(userRef);
      return mapFirebaseUserToUser(userId, updated.data() || {});
    } catch (err: any) {
      console.warn('Failed to update Firestore profile; returning optimistic merged profile', err?.code || err);
      // Optimistic merge fallback
      return {
        id: userId,
        email: (updates.email as string) || '',
        username: (updates.username as string) || '',
        bio: (updates.bio as string) || '',
        reputation_score: (updates.reputation_score as number) ?? 5.0,
        total_reviews: (updates.total_reviews as number) ?? 0,
        created_at: new Date().toISOString(),
      };
    }
  }
}

export const firebaseService = new FirebaseService();
