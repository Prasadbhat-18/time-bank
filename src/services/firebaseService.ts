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
import { twilioService } from './twilioService';

function mapFirebaseUserToUser(uid: string, data: Record<string, unknown>): User {
  return {
    id: uid,
    email: (data.email as string) || '',
    username: (data.username as string) || '',
    bio: (data.bio as string) || '',
    avatar_url: (data.avatar_url as string) || '',
    phone: (data.phone as string) || '',
    location: (data.location as string) || '',
    skills: (data.skills as string[]) || [],
    emergency_contacts: (data.emergency_contacts as any[]) || [],
    reputation_score: (data.reputation_score as number) ?? 5.0,
    total_reviews: (data.total_reviews as number) ?? 0,
    created_at: (data.created_at as string) || new Date().toISOString(),
    // Level system fields - ensure all are present for XP/level progression
    level: (data.level as number) ?? 1,
    experience_points: (data.experience_points as number) ?? 0,
    services_completed: (data.services_completed as number) ?? 0,
    services_requested: (data.services_requested as number) ?? 0,
    custom_credits_enabled: (data.custom_credits_enabled as boolean) ?? false,
    // Admin moderation fields
    is_blocked: (data.is_blocked as boolean) ?? false,
    blocked_at: (data.blocked_at as string) || '',
    blocked_reason: (data.blocked_reason as string) || '',
    blocked_by: (data.blocked_by as string) || '',
    // Authentication provider fields
    auth_provider: (data.auth_provider as string) || '',
    google_profile_complete: (data.google_profile_complete as boolean) ?? false,
  } as User;
}



class FirebaseService {
  async sendPhoneVerificationCode(phoneNumber: string): Promise<boolean> {
    try {
      await twilioService.sendOTP(phoneNumber);
      return true;
    } catch (error) {
      console.error('Error sending verification code:', error);
      throw error;
    }
  }

  async verifyPhoneCode(phoneNumber: string, code: string): Promise<User> {
    try {
      const response = await twilioService.verifyOTP(phoneNumber, code);
      const isVerified = response.valid;
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
      
      console.log('🔵 Google login initiated for UID:', uid);
      
      // Try to fetch user doc from Firestore, create if missing
      try {
        const userDoc = await getDoc(doc(db, 'users', uid));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          console.log('👤 Existing Google user found:', userData);
          
          // Always ensure Google user has complete profile structure and fresh Google data
          const googleProfile = cred.user.providerData?.[0];
          const displayName = fbUser.displayName || googleProfile?.displayName || '';
          const photoURL = fbUser.photoURL || googleProfile?.photoURL || '';
          const phoneNumber = fbUser.phoneNumber || googleProfile?.phoneNumber || '';
          
          // Generate better username if current one is basic
          let updatedUsername = userData.username;
          if (!updatedUsername || updatedUsername.startsWith('user_') || updatedUsername === (fbUser.email || '').split('@')[0]) {
            if (displayName) {
              updatedUsername = displayName.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
            } else if (fbUser.email) {
              updatedUsername = fbUser.email.split('@')[0];
            }
          }
          
          // Auto-update bio if it's empty and we have display name
          let updatedBio = userData.bio || '';
          if (!updatedBio && displayName) {
            updatedBio = `Hello! I'm ${displayName.split(' ')[0]}.`;
          }
          
          const requiredFields = {
            level: userData.level ?? 1,
            experience_points: userData.experience_points ?? 0,
            services_completed: userData.services_completed ?? 0,
            services_requested: userData.services_requested ?? 0,
            custom_credits_enabled: userData.custom_credits_enabled ?? false,
            avatar_url: photoURL || userData.avatar_url || '', // Always use latest Google photo
            phone: phoneNumber || userData.phone || '', // Always use latest Google phone
            username: updatedUsername,
            bio: updatedBio,
            reputation_score: userData.reputation_score ?? 5.0,
            total_reviews: userData.total_reviews ?? 0,
            auth_provider: 'google',
            google_profile_complete: true,
            updated_at: serverTimestamp()
          };
          
          // Check if any required fields are missing or Google profile data needs updating
          const needsUpdate = Object.keys(requiredFields).some(key => 
            userData[key] === undefined || userData[key] === null
          ) || 
          // Always update Google profile data to keep it fresh
          userData.avatar_url !== photoURL || 
          userData.phone !== phoneNumber ||
          userData.username !== updatedUsername ||
          userData.bio !== updatedBio ||
          !userData.google_profile_complete;
          
          if (needsUpdate) {
            console.log('🔄 Updating Google user profile with latest data');
            await updateDoc(doc(db, 'users', uid), requiredFields);
            console.log('✅ Google user profile updated with fresh data');
          }
          
          // Return complete user data
          return mapFirebaseUserToUser(uid, { ...userData, ...requiredFields });
        }
      } catch (error: any) {
        console.error('❌ Error fetching Google user:', error);
        if (error.code === 'permission-denied' || /permission/i.test(error.message || '')) {
          throw new Error('Firestore permission error while fetching Google user: check your Firestore rules');
        }
      }

      // Create new Google user with complete profile
      console.log('👤 Creating new Google user profile');
      
      // Extract additional profile information from Google
      const googleProfile = cred.user.providerData?.[0];
      const displayName = fbUser.displayName || googleProfile?.displayName || '';
      const photoURL = fbUser.photoURL || googleProfile?.photoURL || '';
      const phoneNumber = fbUser.phoneNumber || googleProfile?.phoneNumber || '';
      
      // Generate a more comprehensive username from Google data
      let username = '';
      if (displayName) {
        username = displayName.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
      } else if (fbUser.email) {
        username = fbUser.email.split('@')[0];
      } else {
        username = `user_${fbUser.uid.slice(0, 6)}`;
      }
      
      // Auto-generate bio from Google display name if available
      const autoBio = displayName ? `Hello! I'm ${displayName.split(' ')[0]}.` : '';
      
      const newUserData = {
        email: fbUser.email || '',
        username: username,
        bio: autoBio,
        avatar_url: photoURL,
        phone: phoneNumber,
        reputation_score: 5.0,
        total_reviews: 0,
        created_at: new Date().toISOString(),
        updated_at: serverTimestamp(),
        // XP and Level system - critical for functionality
        level: 1,
        experience_points: 0,
        services_completed: 0,
        services_requested: 0,
        custom_credits_enabled: false,
        // Mark as Google user for future reference
        auth_provider: 'google',
        google_profile_complete: true,
      };
      
      try {
        await setDoc(doc(db, 'users', uid), newUserData, { merge: true });
        console.log('✅ New Google user created successfully');
      } catch (error: any) {
        console.error('❌ Error creating Google user:', error);
        if (error.code === 'permission-denied' || /permission/i.test(error.message || '')) {
          throw new Error('Firestore permission error while creating Google user: check your Firestore rules');
        }
        throw error;
      }
      
      return mapFirebaseUserToUser(uid, newUserData);
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
      
      // Get current user data
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) {
        throw new Error('User document not found');
      }
      
      const userData = userDoc.data() || {};
      console.log('📊 Current user data:', userData);
      
      // Ensure all required fields exist (migration for existing users)
      const ensureFields: any = {};
      if (userData.level === undefined) ensureFields.level = 1;
      if (userData.experience_points === undefined) ensureFields.experience_points = 0;
      if (userData.services_completed === undefined) ensureFields.services_completed = 0;
      if (userData.services_requested === undefined) ensureFields.services_requested = 0;
      if (userData.custom_credits_enabled === undefined) ensureFields.custom_credits_enabled = false;
      if (userData.reputation_score === undefined) ensureFields.reputation_score = 5.0;
      if (userData.total_reviews === undefined) ensureFields.total_reviews = 0;
      
      // Handle XP and level calculation if services_completed is being updated
      let calculatedUpdates = { ...updates };
      if (updates.services_completed !== undefined) {
        const newServicesCompleted = updates.services_completed;
        const newXP = newServicesCompleted * 50; // 50 XP per service
        const newLevel = Math.floor(newXP / 100) + 1; // Level up every 100 XP
        
        calculatedUpdates = {
          ...updates,
          experience_points: newXP,
          level: newLevel
        };
        
        console.log('🎯 XP/Level calculation:', {
          servicesCompleted: newServicesCompleted,
          newXP,
          newLevel
        });
      }
      
      const updatePayload = { 
        ...ensureFields, 
        ...calculatedUpdates, 
        updated_at: serverTimestamp() 
      };
      
      console.log('📝 Updating Firestore with payload:', updatePayload);
      
      // Use merge: true to ensure we don't overwrite existing data
      await updateDoc(userRef, updatePayload);
      console.log('✅ Successfully updated user in Firestore');
      
      // Fetch updated user data
      const updatedDoc = await getDoc(userRef);
      const result = mapFirebaseUserToUser(userId, updatedDoc.data() || {});
      
      console.log('✅ Updated user profile result:', {
        id: result.id,
        level: result.level,
        xp: result.experience_points,
        servicesCompleted: result.services_completed,
        username: result.username
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

  /**
   * Block a user (admin only)
   */
  async blockUser(userId: string, reason: string, adminId: string): Promise<void> {
    try {
      if (!db) throw new Error('Firebase not initialized');
      
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        is_blocked: true,
        blocked_at: new Date().toISOString(),
        blocked_reason: reason,
        blocked_by: adminId,
        updated_at: serverTimestamp(),
      });
      
      console.log('✅ User blocked in Firestore:', userId);
    } catch (error: any) {
      console.error('❌ Failed to block user:', error);
      throw error;
    }
  }

  /**
   * Unblock a user (admin only)
   */
  async unblockUser(userId: string, adminId: string): Promise<void> {
    try {
      if (!db) throw new Error('Firebase not initialized');
      
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        is_blocked: false,
        blocked_at: null,
        blocked_reason: null,
        blocked_by: null,
        unblocked_by: adminId,
        unblocked_at: new Date().toISOString(),
        updated_at: serverTimestamp(),
      });
      
      console.log('✅ User unblocked in Firestore:', userId, 'by admin:', adminId);
    } catch (error: any) {
      console.error('❌ Failed to unblock user:', error);
      throw error;
    }
  }
}

export const firebaseService = new FirebaseService();
