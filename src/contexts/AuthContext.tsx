import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { firebaseService } from '../services/firebaseService';
import { dataService } from '../services/dataService';
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
        setFirebaseUser(fbUser);
        try {
          if (fbUser) {
            // Attempt to load user profile from Firestore
            const u = await firebaseService.getCurrentUser(fbUser.uid);
            if (u) {
              setUser(u);
              saveUserToStorage(u);
            } else {
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
          };
          setUser(officialUser);
          saveUserToStorage(officialUser);
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
        };
        setUser(officialUser);
        saveUserToStorage(officialUser);
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
    if (isFirebaseConfigured() && auth) {
      // Firebase phone authentication would go here
      throw new Error('Phone authentication not implemented for Firebase yet');
    } else {
      // Mock phone authentication - accept any 6-digit code
      if (code.length === 6 && /^\d{6}$/.test(code)) {
        // Check if it's a predefined user
        const mockUsers = [
          { phone: '+1-555-0101', user: { id: 'user-1', email: 'sarah@example.com', username: 'sarah_dev', bio: 'Full-stack developer', reputation_score: 4.8, total_reviews: 12, created_at: new Date('2024-01-15').toISOString() } },
          { phone: '+1-555-DEMO', user: mockUser },
          { phone: '+1-555-0100', user: { id: 'official-account', email: 'official@timebank.com', username: 'timebank_official', bio: 'Official TimeBank account', reputation_score: 5.0, total_reviews: 25, created_at: new Date('2024-01-01').toISOString() } }
        ];
        
        const foundUser = mockUsers.find(u => u.phone === phone);
        if (foundUser) {
          setUser(foundUser.user);
          saveUserToStorage(foundUser.user);
        } else {
          // Create a new user for any other phone number
          const newUser: User = {
            id: `phone-${Date.now()}`,
            email: `${phone.replace(/[^0-9]/g, '')}@phone.timebank.com`,
            phone,
            username: `user_${phone.slice(-4)}`,
            bio: `User registered with phone ${phone}`,
            reputation_score: 5.0,
            total_reviews: 0,
            created_at: new Date().toISOString()
          };
          setUser(newUser);
          saveUserToStorage(newUser);
        }
      } else {
        throw new Error('Invalid verification code. Please enter a 6-digit code.');
      }
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
    if (isFirebaseConfigured() && auth) {
      // Firebase phone registration would go here
      throw new Error('Phone registration not implemented for Firebase yet');
    } else {
      // Mock phone registration - accept any 6-digit code
      if (code.length === 6 && /^\d{6}$/.test(code)) {
        const newUser: User = {
          id: `phone-${Date.now()}`,
          email: `${phone.replace(/[^0-9]/g, '')}@phone.timebank.com`,
          phone,
          username,
          bio: 'New TimeBank user registered with phone',
          reputation_score: 5.0,
          total_reviews: 0,
          created_at: new Date().toISOString()
        };
        await dataService.createUser(newUser as any);
        // Save a simple credential mapping (phone as key)
        const creds = loadCredentials();
        creds[newUser.email.toLowerCase()] = { userId: newUser.id, password: code };
        saveCredentials(creds);
        setUser(newUser);
        saveUserToStorage(newUser);
      } else {
        throw new Error('Invalid verification code. Please enter a 6-digit code.');
      }
    }
  };

  const loginWithGoogle = async () => {
    if (isFirebaseConfigured() && auth) {
      try {
        const user = await firebaseService.loginWithGoogle();
        if (user) {
          setUser(user);
          saveUserToStorage(user);
        }
      } catch (error: any) {
        throw error;
      }
    } else {
      // Fallback: keep existing mock popup flow
      return new Promise<void>((resolve, reject) => {
        // existing mock popup implementation left intact for offline/demo mode
        const popup = window.open('', 'google-auth', 'width=500,height=600,scrollbars=yes,resizable=yes');
        
        if (!popup) {
          reject(new Error('Popup blocked. Please allow popups for this site.'));
          return;
        }

        popup.document.write(`
          <html>
            <head>
              <title>Sign in with Google</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 40px; text-align: center; background: #f8f9fa; }
                .container { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); max-width: 400px; margin: 0 auto; }
                .google-logo { width: 20px; height: 20px; margin-right: 10px; }
                .btn { background: #4285f4; color: white; border: none; padding: 12px 24px; border-radius: 4px; cursor: pointer; font-size: 16px; margin: 10px; }
                .btn:hover { background: #3367d6; }
                .demo-accounts { margin-top: 20px; }
                .demo-btn { background: #34a853; margin: 5px; padding: 8px 16px; font-size: 14px; }
              </style>
            </head>
            <body>
              <div class="container">
                <h2>Sign in with Google</h2>
                <p>Choose a demo Google account or enter your own:</p>
                
                <div class="demo-accounts">
                  <button class="btn demo-btn" onclick="selectAccount('demo.google@gmail.com', 'Demo Google User')">demo.google@gmail.com</button>
                </div>
                
                <div style="margin: 20px 0; padding: 20px; border: 1px solid #ddd; border-radius: 4px;">
                  <h3>Or create custom account:</h3>
                  <input type="email" id="customEmail" placeholder="Enter Gmail address" style="width: 100%; padding: 10px; margin: 5px 0; border: 1px solid #ddd; border-radius: 4px;">
                  <input type="text" id="customName" placeholder="Enter your name" style="width: 100%; padding: 10px; margin: 5px 0; border: 1px solid #ddd; border-radius: 4px;">
                  <button class="btn" onclick="createCustomAccount()">Create Account</button>
                </div>
                
                <button onclick="window.close()" style="background: #ea4335; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Cancel</button>
              </div>
              
              <script>
                function selectAccount(email, name) {
                  window.opener.postMessage({
                    type: 'GOOGLE_AUTH_SUCCESS',
                    user: {
                      email: email,
                      name: name,
                      picture: 'https://lh3.googleusercontent.com/a/default-user=s96-c'
                    }
                  }, '*');
                  window.close();
                }
                
                function createCustomAccount() {
                  const email = document.getElementById('customEmail').value;
                  const name = document.getElementById('customName').value;
                  
                  if (!email || !name) {
                    alert('Please enter both email and name');
                    return;
                  }
                  
                  if (!email.includes('@gmail.com')) {
                    alert('Please enter a valid Gmail address');
                    return;
                  }
                  
                  selectAccount(email, name);
                }
              </script>
            </body>
          </html>
        `);

        const handleMessage = (event: MessageEvent) => {
          if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
            const { user: googleUser } = event.data;
            const newUser: User = {
              id: `google-${Date.now()}`,
              email: googleUser.email,
              username: googleUser.name.replace(/\s+/g, '_').toLowerCase(),
              bio: `TimeBank user authenticated with Google account`,
              avatar_url: googleUser.picture,
              reputation_score: 5.0,
              total_reviews: 0,
              created_at: new Date().toISOString()
            };
            setUser(newUser);
            saveUserToStorage(newUser);
            window.removeEventListener('message', handleMessage);
            resolve();
          }
        };

        window.addEventListener('message', handleMessage);

        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed);
            window.removeEventListener('message', handleMessage);
            reject(new Error('Authentication cancelled'));
          }
        }, 1000);
      });
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
    } else {
      setUser(null);
      saveUserToStorage(null);
    }
  };

  const updateUser = async (updates: Partial<User>) => {
    if (user) {
      if (isFirebaseConfigured() && auth) {
        const updatedUser = await firebaseService.updateProfile(user.id, updates);
        setUser(updatedUser);
        saveUserToStorage(updatedUser);
      } else {
        // Mock update with persistence
        const updatedUser = await dataService.updateUser(user.id, updates);
        setUser(updatedUser);
        saveUserToStorage(updatedUser);
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