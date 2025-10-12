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
      let resolved = false;
      const timeout = window.setTimeout(() => {
        if (!resolved) {
          console.warn('Auth state took too long; proceeding in guest mode');
          setLoading(false);
        }
      }, 5000);

      const unsub = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
        resolved = true;
        window.clearTimeout(timeout);
        setFirebaseUser(fbUser);
        if (fbUser) {
          try {
            const u = await firebaseService.getCurrentUser(fbUser.uid);
            if (u) {
              setUser(u);
              saveUserToStorage(u);
            } else {
              // If Firestore doc missing or unreadable, fall back to minimal profile from auth
              const minimal: User = {
                id: fbUser.uid,
                email: fbUser.email || '',
                username: fbUser.displayName || (fbUser.email ? fbUser.email.split('@')[0] : 'user'),
                bio: '',
                reputation_score: 5.0,
                total_reviews: 0,
                created_at: new Date().toISOString(),
              };
              setUser(minimal);
              saveUserToStorage(minimal);
            }
          } catch (e) {
            console.warn('Failed to load Firebase user profile, continuing with auth user only', e);
            const minimal: User = {
              id: fbUser.uid,
              email: fbUser.email || '',
              username: fbUser.displayName || (fbUser.email ? fbUser.email.split('@')[0] : 'user'),
              bio: '',
              reputation_score: 5.0,
              total_reviews: 0,
              created_at: new Date().toISOString(),
            };
            setUser(minimal);
            saveUserToStorage(minimal);
          }
        } else {
          setUser(null);
          saveUserToStorage(null);
        }
        setLoading(false);
      });
      return () => {
        window.clearTimeout(timeout);
        unsub();
      };
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
    // Always support demo accounts locally, even if Firebase is configured
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

    if (isFirebaseConfigured() && auth) {
      // Use Firebase authentication for non-demo accounts
      const u = await firebaseService.login(email, password);
      if (!u) throw new Error('Invalid credentials');
      setUser(u);
      saveUserToStorage(u);
    } else {
      // Mock authentication - support Gmail addresses
      if (email.endsWith('@gmail.com') && password.length >= 6) {
        // Create consistent user ID for Gmail accounts
        const cleanEmail = email.toLowerCase().replace('@gmail.com', '');
        const userId = `gmail-${cleanEmail.replace(/[^a-zA-Z0-9]/g, '-')}`;
        
        let gmailUser = await dataService.getUserById(userId);
        if (!gmailUser) {
          gmailUser = {
            id: userId,
            email: email.toLowerCase(),
            username: cleanEmail.replace(/[^a-zA-Z0-9]/g, '_'),
            bio: `Gmail user registered with ${email}`,
            avatar_url: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=200',
            reputation_score: 5.0,
            total_reviews: 0,
            created_at: new Date().toISOString(),
          };
          await dataService.createUser(gmailUser);
          console.log('Created new Gmail user:', gmailUser);
        } else {
          console.log('Found existing Gmail user:', gmailUser);
        }
        setUser(gmailUser);
        saveUserToStorage(gmailUser);
      } else {
        throw new Error('Invalid credentials. Use demo@timebank.com / demo123, official@timebank.com / official123, or any Gmail account with a password of at least 6 characters');
      }
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
          const phoneId = `phone-${phone.replace(/[^0-9]/g, '')}`;
          let existingPhoneUser = await dataService.getUserById(phoneId);
          if (!existingPhoneUser) {
            const newUser: User = {
              id: phoneId,
              email: `${phone.replace(/[^0-9]/g, '')}@phone.timebank.com`,
              phone,
              username: `user_${phone.slice(-4)}`,
              bio: `User registered with phone ${phone}`,
              reputation_score: 5.0,
              total_reviews: 0,
              created_at: new Date().toISOString()
            };
            await dataService.createUser(newUser);
            setUser(newUser);
            saveUserToStorage(newUser);
          } else {
            setUser(existingPhoneUser);
            saveUserToStorage(existingPhoneUser);
          }
        }
      } else {
        throw new Error('Invalid verification code. Please enter a 6-digit code.');
      }
    }
  };

  const register = async (email: string, password: string, username: string) => {
    if (isFirebaseConfigured() && auth) {
      // Use Firebase registration
      await firebaseService.register(email, password, username);
    } else {
      // Mock registration - create consistent user ID
      const userId = email.endsWith('@gmail.com') 
        ? `gmail-${email.toLowerCase().replace('@gmail.com', '').replace(/[^a-zA-Z0-9]/g, '-')}`
        : `user-${Date.now()}`;
        
      const newUser: User = {
        id: userId,
        email: email.toLowerCase(),
        username,
        bio: 'New TimeBank user',
        reputation_score: 5.0,
        total_reviews: 0,
        created_at: new Date().toISOString()
      };
      await dataService.createUser(newUser);
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
        const phoneId = `phone-${phone.replace(/[^0-9]/g, '')}`;
        const newUser: User = {
          id: phoneId,
          email: `${phone.replace(/[^0-9]/g, '')}@phone.timebank.com`,
          phone,
          username,
          bio: 'New TimeBank user registered with phone',
          reputation_score: 5.0,
          total_reviews: 0,
          created_at: new Date().toISOString()
        };
        await dataService.createUser(newUser);
        setUser(newUser);
        saveUserToStorage(newUser);
      } else {
        throw new Error('Invalid verification code. Please enter a 6-digit code.');
      }
    }
  };

  const loginWithGoogle = async () => {
    if (isFirebaseConfigured() && auth) {
      // Use Firebase Google authentication
      const u = await firebaseService.loginWithGoogle();
      setUser(u);
      saveUserToStorage(u);
    } else {
      // Mock Google authentication - simulate OAuth flow
      return new Promise<void>((resolve, reject) => {
        // Simulate OAuth popup window
        const popup = window.open('', 'google-auth', 'width=500,height=600,scrollbars=yes,resizable=yes');
        
        if (!popup) {
          reject(new Error('Popup blocked. Please allow popups for this site.'));
          return;
        }

        // Simulate Google OAuth flow
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

        // Listen for auth result
        const handleMessage = async (event: MessageEvent) => {
          if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
            const { user: googleUser } = event.data;
            
            // Create TimeBank user from Google account
            const cleanEmail = googleUser.email.toLowerCase().replace('@gmail.com', '');
            const googleUserId = `google-${cleanEmail.replace(/[^a-zA-Z0-9]/g, '-')}`;
            
            let existingGoogleUser = await dataService.getUserById(googleUserId);
            if (!existingGoogleUser) {
              const newUser: User = {
                id: googleUserId,
                email: googleUser.email.toLowerCase(),
                username: googleUser.name.replace(/\s+/g, '_').toLowerCase(),
                bio: `TimeBank user authenticated with Google account`,
                avatar_url: googleUser.picture,
                reputation_score: 5.0,
                total_reviews: 0,
                created_at: new Date().toISOString()
              };
              await dataService.createUser(newUser);
              setUser(newUser);
              saveUserToStorage(newUser);
            } else {
              setUser(existingGoogleUser);
              saveUserToStorage(existingGoogleUser);
            }
            window.removeEventListener('message', handleMessage);
            resolve();
          }
        };

        window.addEventListener('message', handleMessage);

        // Handle popup close without auth
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

  const logout = () => {
    if (isFirebaseConfigured() && auth) {
      firebaseService.logout().catch(() => {});
    }
    setUser(null);
    saveUserToStorage(null);
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
    <AuthContext.Provider value={{ user, firebaseUser, loading, login, loginWithPhone, loginWithGoogle, register, registerWithPhone, logout, updateUser }}>
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