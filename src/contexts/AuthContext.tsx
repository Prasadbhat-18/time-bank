import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { firebaseService } from '../services/firebaseService';
import { dataService } from '../services/dataService';
import { twilioService } from '../services/twilioService';
import { auth, isFirebaseConfigured } from '../firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithPhone: (phone: string, code: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (email: string, password: string, username: string) => Promise<void>;
  registerWithPhone: (phone: string, username: string, code: string) => Promise<void>;
  resetPassword: (email: string, newPassword?: string) => Promise<void>;
  changePassword?: (currentPassword: string, newPassword: string) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user for testing when Firebase is not configured
const mockUser: User = {
  id: 'current-user',
  email: 'demo@timebank.com',
  username: 'demo',
  bio: 'Demo user for testing TimeBank application',
  reputation_score: 4.8,
  total_reviews: 25,
  created_at: new Date().toISOString()
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper function to save user to localStorage
  const saveUserToStorage = (user: User | null) => {
    if (user) {
      localStorage.setItem('timebank_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('timebank_user');
    }
  };

  // Credentials helper (mock mode) - stores mapping by email -> { userId, password }
  const loadCredentials = () => {
    try {
      const raw = localStorage.getItem('timebank_creds');
      return raw ? JSON.parse(raw) as Record<string, { userId: string; password: string }> : {};
    } catch {
      return {} as Record<string, { userId: string; password: string }>;
    }
  };

  const saveCredentials = (creds: Record<string, { userId: string; password: string }>) => {
    try {
      localStorage.setItem('timebank_creds', JSON.stringify(creds));
    } catch {}
  };

  // Helper function to load user from localStorage
  const loadUserFromStorage = (): User | null => {
    try {
      const savedUser = localStorage.getItem('timebank_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (error) {
      console.error('Error loading user from storage:', error);
      return null;
    }
  };

  useEffect(() => {
    if (isFirebaseConfigured() && auth) {
      // Use Firebase authentication
      const unsub = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
        console.log(' Auth state changed:', { 
          hasUser: !!fbUser, 
          uid: fbUser?.uid,
          email: fbUser?.email 
        });
        setFirebaseUser(fbUser);
        try {
          if (fbUser) {
            console.log(' Loading user profile from Firestore...');
            // Attempt to load user profile from Firestore
            const u = await firebaseService.getCurrentUser(fbUser.uid);
            if (u) {
              console.log(' User profile loaded successfully:', { id: u.id, username: u.username });
              setUser(u);
              saveUserToStorage(u);
            } else {
              console.log(' No profile found in Firestore, creating fallback...');
              // If no profile exists in Firestore, construct a minimal fallback profile
              const fallbackUser: User = {
                id: fbUser.uid,
                email: fbUser.email || '',
                username: fbUser.displayName || (fbUser.email ? fbUser.email.split('@')[0] : 'user'),
                bio: '',
                reputation_score: 5.0,
                total_reviews: 0,
                created_at: new Date().toISOString(),
              };
              setUser(fallbackUser);
              saveUserToStorage(fallbackUser);
            }
          } else {
            setUser(null);
            saveUserToStorage(null);
          }
        } catch (error: any) {
          // Handle permission or other Firestore errors gracefully.
          console.error('Error while loading Firebase user profile:', error);
          // If we have an authenticated Firebase user but Firestore access is denied,
          // create a safe fallback user so the UI remains usable.
          if (fbUser) {
            const fallbackUser: User = {
              id: fbUser.uid,
              email: fbUser.email || '',
              username: fbUser.displayName || (fbUser.email ? fbUser.email.split('@')[0] : 'user'),
              bio: '',
              reputation_score: 5.0,
              total_reviews: 0,
              created_at: new Date().toISOString(),
            };
            setUser(fallbackUser);
            saveUserToStorage(fallbackUser);
          } else {
            setUser(null);
            saveUserToStorage(null);
          }
        } finally {
          setLoading(false);
          console.log('🎯 Authentication setup complete, loading state set to false');
        }
      });
      return () => unsub();
    } else {
      // Use mock authentication - check localStorage first
      console.log('Firebase not configured, using mock authentication mode');
      const savedUser = loadUserFromStorage();
      if (savedUser) {
        setUser(savedUser);
      }
      setLoading(false);
    }
  }, []);

  // Grant initial credits on first login (mock or firebase)
  useEffect(() => {
    const provision = async () => {
      if (user?.id) {
        try {
          await dataService.ensureInitialCredits(user.id, 10);
        } catch {}
      }
    };
    provision();
  }, [user?.id]);

  // Listen for profile updates and level changes
  useEffect(() => {
    const handleProfileUpdate = (event: CustomEvent) => {
      console.log('🔄 AuthContext received profile update event:', event.detail);
      if (event.detail?.user) {
        setUser(event.detail.user);
        saveUserToStorage(event.detail.user);
      }
    };

    const handleLevelUp = (event: CustomEvent) => {
      console.log('🎉 AuthContext received level up event:', event.detail);
      if (event.detail?.user) {
        setUser(event.detail.user);
        saveUserToStorage(event.detail.user);
      }
    };

    window.addEventListener('timebank:profileUpdated', handleProfileUpdate as EventListener);
    window.addEventListener('timebank:levelUp', handleLevelUp as EventListener);

    return () => {
      window.removeEventListener('timebank:profileUpdated', handleProfileUpdate as EventListener);
      window.removeEventListener('timebank:levelUp', handleLevelUp as EventListener);
    };
  }, []);

  const login = async (email: string, password: string) => {
    if (isFirebaseConfigured() && auth) {
      try {
        // Try Firebase authentication first
        const u = await firebaseService.login(email, password);
        if (!u) throw new Error('Invalid credentials');
        setUser(u);
        saveUserToStorage(u);
        return;
      } catch (err: any) {
        // If Firebase auth fails, allow known mock fallback accounts (demo & official)
        const e = email.toLowerCase();
        if (e === 'demo@timebank.com' && password === 'demo123') {
          setUser(mockUser);
          saveUserToStorage(mockUser);
          return;
        }
        if (e === 'official@timebank.com' && password === 'official123') {
          const officialUser: User = {
            id: 'official-account',
            email: 'official@timebank.com',
            username: 'timebank_official',
            bio: 'Official TimeBank account offering verified professional services.',
            avatar_url: 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=200',
            reputation_score: 5.0,
            total_reviews: 25,
            created_at: new Date('2024-01-01').toISOString(),
            phone: '+1-555-0100',
            level: 7,
            experience_points: 5500,
            services_completed: 100,
            custom_credits_enabled: true,
          };
          setUser(officialUser);
          saveUserToStorage(officialUser);
          return;
        }
        if (e === 'level5@timebank.com' && password === 'level5demo') {
          const level5User: User = {
            id: 'level5-demo',
            email: 'level5@timebank.com',
            username: 'time_master_demo',
            bio: 'Level 5 Time Master - I have unlocked custom pricing! Offering premium services with competitive rates.',
            avatar_url: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=200',
            phone: '+1-555-LEVEL5',
            reputation_score: 4.8,
            total_reviews: 28,
            created_at: new Date('2024-01-10').toISOString(),
            level: 5,
            experience_points: 1250,
            services_completed: 25,
            custom_credits_enabled: true,
          };
          setUser(level5User);
          saveUserToStorage(level5User);
          return;
        }
        if (e === 'level7@timebank.com' && password === 'level7demo') {
          const level7User: User = {
            id: 'level7-demo',
            email: 'level7@timebank.com',
            username: 'time_immortal_demo',
            bio: 'Level 7 Time Immortal - Elite provider with maximum perks and legendary status. Mentoring available!',
            avatar_url: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=200',
            phone: '+1-555-LEVEL7',
            reputation_score: 5.0,
            total_reviews: 82,
            created_at: new Date('2023-12-01').toISOString(),
            level: 7,
            experience_points: 6500,
            services_completed: 95,
            custom_credits_enabled: true,
          };
          setUser(level7User);
          saveUserToStorage(level7User);
          return;
        }
        // Re-throw original error if not a mock credential
        throw err;
      }
    } else {
      // Use mock authentication - support demo accounts and Gmail addresses
      // First, handle demo and official quick-access (predefined)
      if (email === 'demo@timebank.com' && password === 'demo123') {
        setUser(mockUser);
        saveUserToStorage(mockUser);
        return;
      }

      if (email === 'official@timebank.com' && password === 'official123') {
        const officialUser: User = {
          id: 'official-account',
          email: 'official@timebank.com',
          username: 'timebank_official',
          bio: 'Official TimeBank account offering verified professional services.',
          avatar_url: 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=200',
          reputation_score: 5.0,
          total_reviews: 25,
          created_at: new Date('2024-01-01').toISOString(),
          phone: '+1-555-0100',
          level: 7,
          experience_points: 5500,
          services_completed: 100,
          custom_credits_enabled: true,
        };
        setUser(officialUser);
        saveUserToStorage(officialUser);
        return;
      }

      // Level 5 demo account
      if (email === 'level5@timebank.com' && password === 'level5demo') {
        const level5User: User = {
          id: 'level5-demo',
          email: 'level5@timebank.com',
          username: 'time_master_demo',
          bio: 'Level 5 Time Master - I have unlocked custom pricing! Offering premium services with competitive rates.',
          avatar_url: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=200',
          phone: '+1-555-LEVEL5',
          reputation_score: 4.8,
          total_reviews: 28,
          created_at: new Date('2024-01-10').toISOString(),
          level: 5,
          experience_points: 1250,
          services_completed: 25,
          custom_credits_enabled: true,
        };
        setUser(level5User);
        saveUserToStorage(level5User);
        return;
      }

      // Level 7 demo account
      if (email === 'level7@timebank.com' && password === 'level7demo') {
        const level7User: User = {
          id: 'level7-demo',
          email: 'level7@timebank.com',
          username: 'time_immortal_demo',
          bio: 'Level 7 Time Immortal - Elite provider with maximum perks and legendary status. Mentoring available!',
          avatar_url: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=200',
          phone: '+1-555-LEVEL7',
          reputation_score: 5.0,
          total_reviews: 82,
          created_at: new Date('2023-12-01').toISOString(),
          level: 7,
          experience_points: 6500,
          services_completed: 95,
          custom_credits_enabled: true,
        };
        setUser(level7User);
        saveUserToStorage(level7User);
        return;
      }

      // Load stored mock credentials
      const creds = loadCredentials();
      const saved = creds[email.toLowerCase()];
      if (saved) {
        // Enforce exact password match for registered accounts
        if (saved.password !== password) {
          throw new Error('Incorrect password');
        }
        // Load user by id
        let storedUser = await dataService.getUserById(saved.userId);
        if (!storedUser) {
          // If user not found, create a minimal user record to match creds
          storedUser = await dataService.createUser({
            id: saved.userId,
            email,
            username: email.split('@')[0],
            bio: '',
            reputation_score: 5.0,
            total_reviews: 0,
            created_at: new Date().toISOString(),
          } as any);
        }
        setUser(storedUser);
        saveUserToStorage(storedUser);
        return;
      }

      // Fallback: allow ephemeral Gmail sign-in if no cred record exists (existing behavior)
      if (email.endsWith('@gmail.com') && password.length >= 6) {
        const userId = `gmail-${email.replace('@gmail.com', '').replace(/[^a-zA-Z0-9]/g, '')}`;
        let gmailUser = await dataService.getUserById(userId);
        if (!gmailUser) {
          gmailUser = {
            id: userId,
            email: email,
            username: email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '_'),
            bio: `Gmail user registered with ${email}`,
            avatar_url: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=200',
            reputation_score: 5.0,
            total_reviews: 0,
            created_at: new Date().toISOString(),
          };
          await dataService.createUser(gmailUser);
        }
        setUser(gmailUser);
        saveUserToStorage(gmailUser);
        return;
      }

      throw new Error('Invalid credentials. Use demo@timebank.com / demo123, official@timebank.com / official123, or register an account first');
    }
  };

  const loginWithPhone = async (phone: string, code: string) => {
    try {
      if (!code) {
        // Send OTP
        console.log('📱 Sending OTP to:', phone);
        const response = await twilioService.sendOTP(phone);
        console.log('✅ OTP sent successfully:', response.message);
        return;
      }

      // Verify OTP
      console.log('🔐 Verifying OTP for:', phone, 'with code:', code);
      const response = await twilioService.verifyOTP(phone, code);
      console.log('✅ OTP verified successfully:', response.message);

      // If verification successful, create or fetch user
      let phoneUser = await dataService.getUserByPhone(phone);
      
      if (!phoneUser) {
        // Create new user if doesn't exist
        console.log('👤 Creating new user for phone:', phone);
        phoneUser = {
          id: `phone-${Date.now()}`,
          email: `${phone.replace(/[^0-9]/g, '')}@phone.timebank.com`,
          phone,
          username: `user_${phone.slice(-4)}`,
          bio: 'TimeBank user verified via phone',
          reputation_score: 5.0,
          total_reviews: 0,
          level: 1,
          experience_points: 0,
          services_completed: 0,
          custom_credits_enabled: false,
          created_at: new Date().toISOString()
        };
        await dataService.createUser(phoneUser);
        console.log('✅ New phone user created:', phoneUser.id);
      } else {
        console.log('👤 Existing phone user found:', phoneUser.id);
      }

      setUser(phoneUser);
      saveUserToStorage(phoneUser);
      console.log('🎉 Phone login successful for:', phoneUser.username);
    } catch (error: any) {
      console.error('❌ Phone login failed:', error);
      throw error;
    }
  };

  const register = async (email: string, password: string, username: string) => {
    if (isFirebaseConfigured() && auth) {
      // Use Firebase registration
      const newUser = await firebaseService.register(email, password, username);
      // set context user and persist
      setUser(newUser);
      saveUserToStorage(newUser);
    } else {
      // Mock registration - just log the user in
      const newUser: User = {
        id: `user-${Date.now()}`,
        email,
        username,
        bio: 'New TimeBank user',
        reputation_score: 0,
        total_reviews: 0,
        created_at: new Date().toISOString()
      };
      // Persist user through dataService
      await dataService.createUser(newUser as any);
      // Save credential mapping for mock login
      const creds = loadCredentials();
      creds[email.toLowerCase()] = { userId: newUser.id, password };
      saveCredentials(creds);
      setUser(newUser);
      saveUserToStorage(newUser);
    }
  };

  const registerWithPhone = async (phone: string, username: string, code: string) => {
    try {
      if (!code) {
        // Send OTP for registration
        console.log('📱 Sending registration OTP to:', phone);
        const response = await twilioService.sendOTP(phone);
        console.log('✅ Registration OTP sent successfully:', response.message);
        return;
      }

      // Verify OTP for registration
      console.log('🔐 Verifying registration OTP for:', phone, 'with code:', code);
      const response = await twilioService.verifyOTP(phone, code);
      console.log('✅ Registration OTP verified successfully:', response.message);

      // Check if user already exists
      const existingUser = await dataService.getUserByPhone(phone);
      if (existingUser) {
        throw new Error('Phone number already registered. Please use login instead.');
      }

      // Create new user after successful verification
      console.log('👤 Creating new registered user for phone:', phone);
      const newUser: User = {
        id: `phone-${Date.now()}`,
        email: `${phone.replace(/[^0-9]/g, '')}@phone.timebank.com`,
        phone,
        username: username.trim(),
        bio: 'New TimeBank user registered with phone',
        reputation_score: 5.0,
        total_reviews: 0,
        level: 1,
        experience_points: 0,
        services_completed: 0,
        custom_credits_enabled: false,
        created_at: new Date().toISOString()
      };
      
      await dataService.createUser(newUser as any);
      console.log('✅ New registered user created:', newUser.id);
      
      // Save credential mapping for future logins
      const creds = loadCredentials();
      creds[newUser.email.toLowerCase()] = { userId: newUser.id, password: 'phone-verified' };
      saveCredentials(creds);
      
      setUser(newUser);
      saveUserToStorage(newUser);
      console.log('🎉 Phone registration successful for:', newUser.username);
    } catch (error: any) {
      console.error('❌ Phone registration failed:', error);
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    // Check Firebase is configured
    if (!isFirebaseConfigured()) {
      throw new Error('Firebase is not configured. Please check your .env.local file has valid Firebase credentials.');
    }
    
    try {
      const user = await firebaseService.loginWithGoogle();
      if (user) {
        setUser(user);
        saveUserToStorage(user);
      } else {
        // If null, a redirect flow was likely initiated; no action needed here.
        return;
      }
    } catch (error: any) {
      console.error('Google login error:', error);
      // Provide more helpful error messages
      if (error.code === 'auth/popup-blocked') {
        throw new Error('Google login popup was blocked. Please allow popups for this site.');
      }
      if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Google login was cancelled.');
      }
      if (error.message?.includes('Firebase')) {
        throw error;
      }
      throw new Error(`Google login failed: ${error.message || 'Unknown error'}`);
    }
  };

  const resetPassword = async (email: string, newPassword?: string) => {
    if (isFirebaseConfigured() && auth) {
      // Send password reset email only (Firebase handles the flow)
      await firebaseService.sendResetEmail(email);
    } else {
      const creds = loadCredentials();
      const entry = creds[email.toLowerCase()];
      if (!entry) {
        throw new Error('No account found for that email');
      }
      if (!newPassword) {
        // In demo mode, we allow reset without verification for convenience
        // but require at least 6 chars
        throw new Error('Please provide a new password (at least 6 characters)');
      }
      if (newPassword.length < 6) throw new Error('Password must be at least 6 characters');
      entry.password = newPassword;
      saveCredentials(creds);
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (isFirebaseConfigured() && auth) {
      await firebaseService.changePassword(currentPassword, newPassword);
    } else {
      // Mock: verify current password matches stored one
      const creds = loadCredentials();
      const entry = creds[user?.email?.toLowerCase() || ''];
      if (!entry) throw new Error('No stored credentials for user');
      if (currentPassword && entry.password !== currentPassword) throw new Error('Current password incorrect');
      if (newPassword.length < 6) throw new Error('New password must be at least 6 characters');
      entry.password = newPassword;
      saveCredentials(creds);
    }
  };

  const logout = () => {
    if (isFirebaseConfigured() && auth) {
      firebaseService.logout().catch(() => {});
      setUser(null);
      setFirebaseUser(null);
      saveUserToStorage(null);
    } else {
      setUser(null);
      saveUserToStorage(null);
    }
  };

  const updateUser = async (updates: Partial<User>) => {
    if (user) {
      console.log('🔄 AuthContext.updateUser called with:', updates);
      console.log('📊 Current user state:', { 
        level: user.level, 
        xp: user.experience_points, 
        services: user.services_completed 
      });
      
      if (isFirebaseConfigured() && auth) {
        const updatedUser = await firebaseService.updateProfile(user.id, updates);
        console.log('✅ Updated user from Firebase:', {
          level: updatedUser.level,
          xp: updatedUser.experience_points,
          services: updatedUser.services_completed
        });
        setUser(updatedUser);
        saveUserToStorage(updatedUser);
        
        // Dispatch event AFTER state update
        setTimeout(() => {
          console.log('📡 Dispatching refresh event from AuthContext');
          window.dispatchEvent(new CustomEvent('timebank:refreshProfileAndDashboard', {
            detail: { user: updatedUser }
          }));
        }, 100);
      } else {
        // Mock update with persistence
        const updatedUser = await dataService.updateUser(user.id, updates);
        console.log('✅ Updated user from dataService:', {
          level: updatedUser.level,
          xp: updatedUser.experience_points,
          services: updatedUser.services_completed
        });
        setUser(updatedUser);
        saveUserToStorage(updatedUser);
        
        // Dispatch event AFTER state update
        setTimeout(() => {
          console.log('📡 Dispatching refresh event from AuthContext');
          window.dispatchEvent(new CustomEvent('timebank:refreshProfileAndDashboard', {
            detail: { user: updatedUser }
          }));
        }, 100);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, login, loginWithPhone, loginWithGoogle, register, registerWithPhone, resetPassword, changePassword, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};