import { auth, db } from '../firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  signInAnonymously,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  addDoc,
  Unsubscribe,
  orderBy,
  limit,
} from 'firebase/firestore';
import { User } from '../types';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { twilioAuthService } from './twilioAuthService';

function mapFirebaseUserToUser(uid: string, data: Record<string, unknown>): User {
  return {
    id: uid,
    email: (data.email as string) || '',
    username: (data.username as string) || '',
    bio: (data.bio as string) || '',
    avatar_url: (data.avatar_url as string) || '',
    phone: (data.phone as string) || '',
    reputation_score: (data.reputation_score as number) ?? 5.0,
    total_reviews: (data.total_reviews as number) ?? 0,
    created_at: (data.created_at as string) || new Date().toISOString(),
    // Level system fields - ensure all are present for XP/level progression
    level: (data.level as number) ?? 1,
    experience_points: (data.experience_points as number) ?? 0,
    services_completed: (data.services_completed as number) ?? 0,
    services_requested: (data.services_requested as number) ?? 0,
    custom_credits_enabled: (data.custom_credits_enabled as boolean) ?? false,
  } as User;
}



class FirebaseService {
  async sendPhoneVerificationCode(phoneNumber: string): Promise<boolean> {
    try {
      return await twilioAuthService.sendVerificationCode(phoneNumber);
    } catch (error) {
      console.error('Error sending verification code:', error);
      throw error;
    }
  }

  async verifyPhoneCode(phoneNumber: string, code: string): Promise<User> {
    try {
      const isVerified = await twilioAuthService.verifyCode(phoneNumber, code);
      if (isVerified) {
        // Create an anonymous user and link the phone
        const userCredential = await signInAnonymously(auth);
        const uid = userCredential.user.uid;
        
        // Create a user profile
        const userData = {
          id: uid,
          email: '',
          username: `user_${uid.slice(0, 6)}`,
          phoneNumber,
          bio: '',
          reputation_score: 5.0,
          total_reviews: 0,
          created_at: new Date().toISOString(),
          level: 1,
          experience_points: 0,
          services_completed: 0,
          services_requested: 0,
          custom_credits_enabled: false,
        };

        await this.createUserProfile(userData);
        return userData;
      }
      throw new Error('Verification failed');
    } catch (error) {
      console.error('Error verifying code:', error);
      throw error;
    }
  }

  async createUserProfile(user: User): Promise<void> {
    const userRef = doc(db, 'users', user.id);
    await setDoc(userRef, {
      ...user,
      created_at: new Date().toISOString(),
      updated_at: serverTimestamp(),
    });
  }

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
        throw new Error('Firestore permission error while creating user: check your Firestore rules (Missing or insufficient permissions)');
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
          const userData = userDoc.data();
          
          // Check if existing Google user needs migration (missing level fields)
          const needsMigration = 
            userData.services_requested === undefined ||
            userData.level === undefined ||
            userData.experience_points === undefined ||
            userData.services_completed === undefined;
            
          if (needsMigration) {
            console.log('🔄 Migrating existing Google user:', uid);
            const migrationData = {
              level: userData.level ?? 1,
              experience_points: userData.experience_points ?? 0,
              services_completed: userData.services_completed ?? 0,
              services_requested: userData.services_requested ?? 0,
              custom_credits_enabled: userData.custom_credits_enabled ?? false,
              avatar_url: userData.avatar_url || fbUser.photoURL || '',
              phone: userData.phone || fbUser.phoneNumber || '',
            };
            
            await updateDoc(doc(db, 'users', uid), migrationData);
            console.log('✅ Google user migration completed');
            
            // Return updated user data
            return mapFirebaseUserToUser(uid, { ...userData, ...migrationData });
          }
          
          return mapFirebaseUserToUser(uid, userData);
        }
      } catch (error: any) {
        if (error.code === 'permission-denied' || /permission/i.test(error.message || '')) {
          throw new Error('Firestore permission error while fetching Google user: check your Firestore rules (Missing or insufficient permissions)');
        }
      }

      // If user doc doesn't exist, create a complete user record
      const data = {
        email: fbUser.email || '',
        username: fbUser.displayName || (fbUser.email || '').split('@')[0],
        bio: '',
        avatar_url: fbUser.photoURL || '',
        phone: fbUser.phoneNumber || '',
        reputation_score: 5.0,
        total_reviews: 0,
        created_at: new Date().toISOString(),
        // Level system fields - essential for XP and progression
        level: 1,
        experience_points: 0,
        services_completed: 0,
        services_requested: 0,
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
    console.log('🔄 firebaseService.updateProfile called with userId:', userId, 'updates:', updates);
    
    // Check authentication
    if (!auth.currentUser) {
      console.error('❌ Cannot update profile: User not authenticated');
      throw new Error('User not authenticated');
    }
    
    if (auth.currentUser.uid !== userId) {
      console.error('❌ Cannot update profile: User ID mismatch', {
        authUserId: auth.currentUser.uid,
        requestedUserId: userId
      });
      throw new Error('Permission denied: Cannot update another user\'s profile');
    }
    
    try {
      const userRef = doc(db, 'users', userId);
      
      // First, check if user has level system fields, add if missing (migration for old users)
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data() || {};
      
      const ensureLevelFields: any = {};
      if (userData.level === undefined) ensureLevelFields.level = 1;
      if (userData.experience_points === undefined) ensureLevelFields.experience_points = 0;
      if (userData.services_completed === undefined) ensureLevelFields.services_completed = 0;
      if (userData.services_requested === undefined) ensureLevelFields.services_requested = 0;
      if (userData.custom_credits_enabled === undefined) ensureLevelFields.custom_credits_enabled = false;
      
      const updatePayload = { ...ensureLevelFields, ...updates, updated_at: serverTimestamp() };
      console.log('📝 Updating Firestore with payload:', updatePayload);
      
      await updateDoc(userRef, updatePayload);
      console.log('✅ Successfully updated user in Firestore');
      
      const updated = await getDoc(userRef);
      const result = mapFirebaseUserToUser(userId, updated.data() || {});
      
      console.log('✅ Updated user profile:', {
        id: result.id,
        level: result.level,
        xp: result.experience_points,
        servicesCompleted: result.services_completed
      });
      
      return result;
    } catch (error) {
      console.error('❌ Error updating profile in Firebase:', error);
      throw error;
    }
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

  /**
   * Save a service to Firestore
   */
  async saveService(service: any): Promise<string> {
    try {
      if (!db) throw new Error('Firebase not initialized');
      
      const servicesCollection = collection(db, 'services');
      const docRef = await addDoc(servicesCollection, {
        ...service,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });
      
      console.log('✅ Service saved to Firestore:', docRef.id);
      return docRef.id;
    } catch (error: any) {
      console.error('❌ Failed to save service to Firestore:', error);
      throw error;
    }
  }

  /**
   * Save a service to Firestore with a specific document ID (keeps IDs consistent across local and Firestore)
   */
  async saveServiceWithId(id: string, service: any): Promise<void> {
    try {
      if (!db) throw new Error('Firebase not initialized');

      const serviceRef = doc(db, 'services', id);
      await setDoc(serviceRef, {
        ...service,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });
      console.log('✅ Service saved to Firestore with fixed ID:', id);
    } catch (error: any) {
      console.error('❌ Failed to save service with fixed ID to Firestore:', error);
      throw error;
    }
  }

  /**
   * Get all services from Firestore
   */
  async getServices(): Promise<any[]> {
    try {
      if (!db) throw new Error('Firebase not initialized');
      
      const servicesCollection = collection(db, 'services');
      const q = query(servicesCollection, orderBy('created_at', 'desc'), limit(100));
      const snapshot = await getDocs(q);
      
      const services = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      
      console.log('✅ Retrieved services from Firestore:', services.length);
      return services;
    } catch (error: any) {
      console.error('❌ Failed to get services from Firestore:', error);
      return [];
    }
  }

  /**
   * Subscribe to real-time service updates
   */
  subscribeToServices(callback: (services: any[]) => void): Unsubscribe | null {
    try {
      if (!db) throw new Error('Firebase not initialized');
      
      const servicesCollection = collection(db, 'services');
      const q = query(servicesCollection, orderBy('created_at', 'desc'), limit(100));
      
      const unsubscribe = onSnapshot(q, snapshot => {
        const services = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        callback(services);
        console.log('🔄 Real-time services updated:', services.length);
      });
      
      return unsubscribe;
    } catch (error: any) {
      console.error('❌ Failed to subscribe to services:', error);
      return null;
    }
  }

  /**
   * Get services by provider
   */
  async getProviderServices(providerId: string): Promise<any[]> {
    try {
      if (!db) throw new Error('Firebase not initialized');
      
      const servicesCollection = collection(db, 'services');
      const q = query(servicesCollection, where('provider_id', '==', providerId));
      const snapshot = await getDocs(q);
      
      const services = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      
      console.log(`✅ Retrieved ${services.length} services for provider ${providerId}`);
      return services;
    } catch (error: any) {
      console.error('❌ Failed to get provider services:', error);
      return [];
    }
  }

  /**
   * Update a service in Firestore
   */
  async updateService(serviceId: string, updates: any): Promise<void> {
    try {
      if (!db) throw new Error('Firebase not initialized');
      
      const serviceRef = doc(db, 'services', serviceId);
      await updateDoc(serviceRef, {
        ...updates,
        updated_at: serverTimestamp(),
      });
      
      console.log('✅ Service updated in Firestore:', serviceId);
    } catch (error: any) {
      console.error('❌ Failed to update service:', error);
      throw error;
    }
  }
}

export const firebaseService = new FirebaseService();
