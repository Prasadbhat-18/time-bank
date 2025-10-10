import { auth, db } from '../firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
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
  async login(email: string, password: string): Promise<User | null> {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const uid = cred.user.uid;
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return mapFirebaseUserToUser(uid, userDoc.data());
    }
    return null;
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
    await setDoc(userRef, data);
    return mapFirebaseUserToUser(uid, data);
  }

  async logout(): Promise<void> {
    await signOut(auth);
  }

  async getCurrentUser(userId: string): Promise<User | null> {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return mapFirebaseUserToUser(userId, userDoc.data());
    }
    return null;
  }

  async updateProfile(userId: string, updates: Partial<User>): Promise<User> {
    const userRef = doc(db, 'users', userId);
    const updatePayload = { ...updates, updated_at: serverTimestamp() };
    await updateDoc(userRef, updatePayload);
    const updated = await getDoc(userRef);
    return mapFirebaseUserToUser(userId, updated.data() || {});
  }
}

export const firebaseService = new FirebaseService();
