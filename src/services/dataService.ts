import { User, Skill, Service, TimeCredit, Booking, Transaction, Review, UserSkill, EmergencyContact } from '../types';
import { 
  mockUsers as initialMockUsers, 
  mockSkills, 
  mockServices as initialMockServices, 
  mockBookings as initialMockBookings, 
  mockTransactions as initialMockTransactions, 
  mockReviews as initialMockReviews,
  mockTimeCredits as initialMockTimeCredits,
  mockUserSkills as initialMockUserSkills 
} from './mockData';
import {
  calculateLevel,
  calculateServiceExperience,
  getLevelUpBonusCredits
} from './levelService';

// Firebase imports  
import { firebaseService } from './firebaseService';
import { permanentStorage } from './permanentStorage';
import { db, auth } from '../firebase';
import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';

import { deleteDoc } from 'firebase/firestore';

// Temporarily disable Firebase to fix compilation errors and get website loading
const useFirebase = false;

// Load data from Firebase or localStorage or use initial data
const loadFromStorage = <T>(key: string, fallback: T[]): T[] => {
  try {
    const stored = localStorage.getItem(`timebank_${key}`);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
};

const saveToStorage = <T>(key: string, data: T[]) => {
  try {
    localStorage.setItem(`timebank_${key}`, JSON.stringify(data));
  } catch {
    // Ignore storage errors
  }
};

// Shared localStorage (cross-login in same browser) fallback for dev when Firestore is unavailable
const sharedKey = (key: string) => `timebank_shared_${key}`;
const loadShared = <T>(key: string, fallback: T[] = []): T[] => {
  try {
    const stored = localStorage.getItem(sharedKey(key));
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
};

const saveShared = <T>(key: string, data: T[]) => {
  try {
    localStorage.setItem(sharedKey(key), JSON.stringify(data));
  } catch {}
};

// Helper function to wait for authentication
const waitForAuth = async (maxWaitMs: number = 5000): Promise<boolean> => {
  if (!useFirebase) return true; // Skip auth check if not using Firebase
  
  const startTime = Date.now();
  while (Date.now() - startTime < maxWaitMs) {
    if (auth.currentUser) {
      console.log('✅ User authenticated:', auth.currentUser.uid);
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.warn('⏰ Authentication timeout after', maxWaitMs, 'ms');
  return false;
};

// Firebase helper functions
const saveToFirestore = async <T>(collectionName: string, id: string, data: T) => {
  if (!useFirebase) return;
  
  // Wait for authentication before proceeding
  const isAuthenticated = await waitForAuth(3000);
  if (!isAuthenticated) {
    console.warn(`Cannot save to Firestore ${collectionName}: Authentication timeout`);
    return;
  }
  
  try {
    await setDoc(doc(db, collectionName, id), {
      ...data,
      updated_at: serverTimestamp()
    });
    console.log(`✅ Successfully saved to Firestore ${collectionName}/${id}`);
  } catch (error) {
    console.error(`❌ Error saving to Firestore ${collectionName}/${id}:`, error);
    throw error; // Re-throw to let caller handle the error
  }
};

const loadFromFirestore = async <T>(collectionName: string): Promise<T[]> => {
  if (!useFirebase) return [];
  
  try {
    // Wait for authentication before proceeding
    await waitForAuth();
    
    const querySnapshot = await getDocs(collection(db, collectionName));
    console.log(`✅ Successfully loaded ${querySnapshot.docs.length} documents from Firestore ${collectionName}`);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      created_at: doc.data().created_at?.toDate?.()?.toISOString() || doc.data().created_at,
      updated_at: doc.data().updated_at?.toDate?.()?.toISOString() || doc.data().updated_at
    })) as T[];
  } catch (error: any) {
    // Handle Firebase permission errors gracefully
    if (error?.code === 'permission-denied' || error?.message?.includes('permissions')) {
      console.warn(`⚠️ Firebase permissions denied for ${collectionName}, falling back to local data`);
    } else {
      console.error(`❌ Error loading from Firestore ${collectionName}:`, error);
    }
    return [];
  }
};

// Initialize persistent arrays
let mockUsers = loadFromStorage('users', initialMockUsers);
// Ensure demo accounts always exist in mockUsers
const ensureDemoAccounts = () => {
  const demoAccountIds = ['current-user', 'official-account', 'level5-demo', 'level7-demo'];
  demoAccountIds.forEach(accountId => {
    const existsInMock = mockUsers.some(u => u.id === accountId);
    if (!existsInMock) {
      const initialUser = initialMockUsers.find(u => u.id === accountId);
      if (initialUser) {
        mockUsers.push(initialUser);
      }
    }
  });
  saveToStorage('users', mockUsers);
};
ensureDemoAccounts();

let mockServices = loadFromStorage('services', initialMockServices);
let mockBookings = loadFromStorage('bookings', initialMockBookings);
let mockTransactions = loadFromStorage('transactions', initialMockTransactions);
let mockReviews = loadFromStorage('reviews', initialMockReviews);
let mockTimeCredits = loadFromStorage('time_credits', initialMockTimeCredits);
let mockUserSkills = loadFromStorage('user_skills', initialMockUserSkills);

// Helper function to add test services for cross-user booking
const addTestServices = () => {
  const testServices = [
    {
      id: 'test-service-1',
      provider_id: 'demo-user-1',
      skill_id: '1',
      title: 'React Tutorial Session',
      description: 'Learn React fundamentals with hands-on coding examples.',
      credits_per_hour: 1.0,
      status: 'active' as const,
      type: 'offer' as const,
      created_at: new Date().toISOString()
    },
    {
      id: 'test-service-2', 
      provider_id: 'demo-user-2',
      skill_id: '3',
      title: 'Home Cooking Basics',
      description: 'Learn to cook simple, healthy meals at home.',
      credits_per_hour: 1.0,
      status: 'active' as const,
      type: 'offer' as const,
      created_at: new Date().toISOString()
    }
  ];

  // Add test users if they don't exist
  const testUsers = [
    {
      id: 'demo-user-1',
      email: 'testuser1@example.com',
      username: 'test_user_1',
      bio: 'Experienced React developer',
      reputation_score: 4.5,
      total_reviews: 8,
      created_at: new Date().toISOString()
    },
    {
      id: 'demo-user-2',
      email: 'testuser2@example.com', 
      username: 'test_user_2',
      bio: 'Home cooking enthusiast',
      reputation_score: 4.7,
      total_reviews: 12,
      created_at: new Date().toISOString()
    }
  ];

  // Add test users if not already present
  testUsers.forEach(testUser => {
    if (!mockUsers.find(u => u.id === testUser.id)) {
      mockUsers.push(testUser);
    }
  });

  // Add test services if not already present
  testServices.forEach(testService => {
    if (!mockServices.find(s => s.id === testService.id)) {
      mockServices.push(testService);
    }
  });

  // Save to localStorage
  saveToStorage('users', mockUsers);
  saveToStorage('services', mockServices);
};

// Initialize test services
addTestServices();

// Add test bookings so cross-user booking UI can be tested
const addTestBookings = () => {
  const testBookings = [
    {
      id: 'test-booking-1',
      service_id: 'test-service-1',
      provider_id: 'demo-user-1',
      requester_id: 'demo-user-2',
      scheduled_start: new Date().toISOString(),
      scheduled_end: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      duration_hours: 1,
      status: 'completed',
      confirmation_status: 'provider_confirmed',
      credits_held: 1,
      credits_transferred: true,
      created_at: new Date().toISOString(),
    }
  ];

  testBookings.forEach(tb => {
    if (!mockBookings.find(b => b.id === tb.id)) mockBookings.push(tb as any);
  });

  saveToStorage('bookings', mockBookings);
  // Save to shared storage for cross-login visibility
  const shared = loadShared<Booking>('bookings', mockBookings);
  testBookings.forEach(tb => {
    if (!shared.find(b => b.id === tb.id)) shared.push(tb as any);
  });
  saveShared('bookings', shared);
};

addTestBookings();

export const dataService = {
  async getUserById(userId: string): Promise<User | null> {
    return mockUsers.find(user => user.id === userId) || null;
  },

  async getUserByPhone(phone: string): Promise<User | null> {
    return mockUsers.find(user => user.phone === phone) || null;
  },

  async createUser(user: User): Promise<User> {
    // Check if user already exists
    const existingUser = mockUsers.find(u => u.id === user.id);
    if (existingUser) {
      return existingUser;
    }
    
    // Add new user
    mockUsers.push(user);
    saveToStorage('users', mockUsers);
    
    // Save to Firestore if available
    if (useFirebase) {
      await saveToFirestore('users', user.id, user);
    }
    
    return user;
  },

  async getTimeCredits(userId: string): Promise<TimeCredit | null> {
    // First try to load from Firebase for most up-to-date balance
    if (useFirebase) {
      try {
        const creditsFromFs = await loadFromFirestore<TimeCredit>('time_credits');
        const firebaseCredit = creditsFromFs.find(tc => tc.user_id === userId);
        if (firebaseCredit) {
          // Update local cache with Firebase data
          const localIndex = mockTimeCredits.findIndex(tc => tc.user_id === userId);
          if (localIndex !== -1) {
            mockTimeCredits[localIndex] = firebaseCredit;
          } else {
            mockTimeCredits.push(firebaseCredit);
          }
          saveToStorage('time_credits', mockTimeCredits);
          return firebaseCredit;
        }
      } catch (error) {
        console.warn('Failed to load time credits from Firebase, using local data:', error);
      }
    }
    
    return mockTimeCredits.find(tc => tc.user_id === userId) || null;
  },

  async ensureInitialCredits(userId: string, amount: number = 10): Promise<TimeCredit> {
    let tc = await this.getTimeCredits(userId);
    if (!tc) {
      tc = {
        id: `credits_${userId}_${Date.now()}`,
        user_id: userId,
        balance: amount,
        total_earned: amount,
        total_spent: 0,
        updated_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };
      
      console.log('🪙 Creating initial credits for user:', userId, 'Amount:', amount);
      
      // Save to Firebase first for persistence
      if (useFirebase) {
        try {
          await saveToFirestore('time_credits', tc.id, tc);
          console.log('✅ Initial credits saved to Firebase:', tc.id);
        } catch (error) {
          console.error('❌ Failed to save initial credits to Firebase:', error);
        }
      }
      
      // Update local storage
      mockTimeCredits.push(tc);
      saveToStorage('time_credits', mockTimeCredits);
    }
    return tc;
  },

  async updateTimeCredits(userId: string, updates: Partial<TimeCredit>): Promise<TimeCredit> {
    let tc = await this.getTimeCredits(userId);
    if (!tc) {
      tc = await this.ensureInitialCredits(userId);
    }
    
    const updatedCredits = {
      ...tc,
      ...updates,
      updated_at: new Date().toISOString(),
    };
    
    console.log('💰 Updating credits for user:', userId, 'New balance:', updatedCredits.balance);
    
    // Save to Firebase first for persistence
    if (useFirebase) {
      try {
        await saveToFirestore('time_credits', updatedCredits.id, updatedCredits);
        console.log('✅ Credits updated in Firebase:', updatedCredits.id);
      } catch (error) {
        console.error('❌ Failed to update credits in Firebase:', error);
      }
    }
    
    // Update local storage
    const localIndex = mockTimeCredits.findIndex(tc => tc.user_id === userId);
    if (localIndex !== -1) {
      mockTimeCredits[localIndex] = updatedCredits;
    } else {
      mockTimeCredits.push(updatedCredits);
    }
    saveToStorage('time_credits', mockTimeCredits);
    
    return updatedCredits;
  },

  async getTransactions(userId: string): Promise<Transaction[]> {
    return mockTransactions.filter(t => t.from_user_id === userId || t.to_user_id === userId);
  },

  async getSkills(): Promise<Skill[]> {
    return mockSkills;
  },

  async getUserSkills(userId: string): Promise<UserSkill[]> {
    return mockUserSkills.filter(us => us.user_id === userId);
  },

  async addUserSkill(userId: string, skillId: string, type: 'offered' | 'needed', proficiencyLevel: string): Promise<UserSkill> {
    const newUserSkill: UserSkill = {
      id: Date.now().toString(),
      user_id: userId,
      skill_id: skillId,
      type,
      proficiency_level: proficiencyLevel as 'beginner' | 'intermediate' | 'expert',
      skill: mockSkills.find(s => s.id === skillId)
    };
    // Persist in-memory and localStorage
    mockUserSkills.push(newUserSkill);
    saveToStorage('user_skills', mockUserSkills);
    return newUserSkill;
  },

  async removeUserSkill(userSkillId: string): Promise<void> {
    const idx = mockUserSkills.findIndex(us => us.id === userSkillId);
    if (idx !== -1) {
      mockUserSkills.splice(idx, 1);
      saveToStorage('user_skills', mockUserSkills);
    }
  },

  async getServices(filters?: { category?: string; type?: string; search?: string }): Promise<Service[]> {
    console.log('🔄 Loading services with filters:', filters);
    const startTime = Date.now();

    // Use cached services if available and recent (within 24 hours)
    const cacheKey = 'services_cache';
    const cacheTimeKey = 'services_cache_time';
    const cached = localStorage.getItem(cacheKey);
    const cacheTime = localStorage.getItem(cacheTimeKey);
    
    if (cached && cacheTime && (Date.now() - parseInt(cacheTime)) < 24 * 60 * 60 * 1000) {
      console.log('✅ Using cached services (24-hour cache)');
      const cachedServices = JSON.parse(cached) as Service[];
      return this.applyFilters(cachedServices, filters);
    }

    // If Firebase is enabled, load services from Firestore so they are shared across users
    if (useFirebase) {
      try {
        console.log('☁️ Loading services from Firebase...');
        const servicesFromFs = await loadFromFirestore<Service>('services');

        // Merge services from Firestore with local mock and shared fallback so local posts are visible
        const sharedServices = loadShared<Service>('services', []);
        const allCandidates = [...servicesFromFs, ...sharedServices, ...mockServices];
        
        // Optimized deduplication
        const byId = new Map<string, Service>();
        const firebaseIds = new Set(servicesFromFs.map(s => s.id));
        
        for (const s of allCandidates) {
          if (!s || !s.id) continue;
          if (!byId.has(s.id) || firebaseIds.has(s.id)) {
            byId.set(s.id, s);
          }
        }
        let services = Array.from(byId.values());

        // Enrich with provider and skill data
        services = await this.enrichServicesWithProviders(services);

        // Cache the enriched services
        localStorage.setItem(cacheKey, JSON.stringify(services));
        localStorage.setItem(cacheTimeKey, Date.now().toString());

        const loadTime = Date.now() - startTime;
        console.log(`✅ Services loaded in ${loadTime}ms (${services.length} services)`);

        return this.applyFilters(services, filters);
      } catch (error) {
        console.error('Failed to load services from Firestore, falling back to local services', error);
        // Fallback to permanent + shared + mock services
        let allServices = [...mockServices];
        try {
          const permanentServices = permanentStorage.loadServices();
          if (permanentServices.length > 0) {
            const serviceMap = new Map();
            mockServices.forEach(s => serviceMap.set(s.id, s));
            permanentServices.forEach(s => serviceMap.set(s.id, s));
            allServices = Array.from(serviceMap.values());
          }
        } catch (e) {
          console.warn('Failed to load from permanent storage:', e);
        }
        try {
          const sharedServices = loadShared<Service>('services', []);
          if (sharedServices.length > 0) {
            const serviceMap = new Map();
            allServices.forEach(s => serviceMap.set(s.id, s));
            sharedServices.forEach(s => serviceMap.set(s.id, s));
            allServices = Array.from(serviceMap.values());
          }
        } catch (e) {
          console.warn('Failed to load from shared storage:', e);
        }
        const localServices = allServices;
        return this.applyFilters(localServices, filters);
      }
    }

    // Fallback to local services - merge from all sources to ensure cross-user visibility
    let allServices = [...mockServices];
    
    // Load from permanent storage (survives logout and is shared across users)
    try {
      const permanentServices = permanentStorage.loadServices();
      if (permanentServices.length > 0) {
        console.log(`🔒 Loaded ${permanentServices.length} services from permanent storage`);
        // Merge, prioritizing permanent storage
        const serviceMap = new Map();
        mockServices.forEach(s => serviceMap.set(s.id, s));
        permanentServices.forEach(s => serviceMap.set(s.id, s));
        allServices = Array.from(serviceMap.values());
      }
    } catch (error) {
      console.warn('⚠️ Failed to load from permanent storage:', error);
    }
    
    // Also load from shared storage
    try {
      const sharedServices = loadShared<Service>('services', []);
      if (sharedServices.length > 0) {
        console.log(`📦 Loaded ${sharedServices.length} services from shared storage`);
        const serviceMap = new Map();
        allServices.forEach(s => serviceMap.set(s.id, s));
        sharedServices.forEach(s => serviceMap.set(s.id, s));
        allServices = Array.from(serviceMap.values());
      }
    } catch (error) {
      console.warn('⚠️ Failed to load from shared storage:', error);
    }
    
    const localServices = allServices.map(s => ({
      ...s,
      provider: s.provider || mockUsers.find(u => u.id === s.provider_id),
      skill: mockSkills.find(sk => sk.id === s.skill_id),
    })) as Service[];

    return this.applyFilters(localServices, filters);
  },

  async getUserServices(userId: string): Promise<Service[]> {
    if (useFirebase) {
      try {
        const servicesFromFs = await loadFromFirestore<Service>('services');
        // Merge Firestore + shared + mock, then filter by provider
        const sharedServices = loadShared<Service>('services', []);
        const allCandidates = [...servicesFromFs, ...sharedServices, ...mockServices];
        const byId = new Map<string, Service>();
        for (const s of allCandidates) {
          if (!s || !s.id) continue;
          if (!byId.has(s.id) || servicesFromFs.find(sf => sf.id === s.id)) {
            byId.set(s.id, s);
          }
        }
        const services = Array.from(byId.values()).filter(s => s.provider_id === userId);
        return services.map(s => ({
          ...s,
          provider: s.provider || mockUsers.find(u => u.id === s.provider_id) || undefined,
          skill: mockSkills.find(sk => sk.id === s.skill_id) || undefined,
        })) as Service[];
      } catch (error) {
        console.error('Failed to load user services from Firestore, falling back to local services', error);
      }
    }

    const services = mockServices.filter(service => service.provider_id === userId);
    return services.map(s => ({
      ...s,
      provider: s.provider || mockUsers.find(u => u.id === s.provider_id),
      skill: mockSkills.find(sk => sk.id === s.skill_id),
    })) as Service[];
  },

  async createService(service: Omit<Service, 'id' | 'created_at'> & { imageFiles?: File[] }): Promise<Service> {
    // Resolve provider object early so we store it with the service (prevents fallback random IDs in UI)
    const providerId = service.provider_id;
    let providerObj: any = mockUsers.find(u => u.id === providerId);
    if (!providerObj) {
      try {
        const saved = localStorage.getItem('timebank_user');
        if (saved) {
          const savedUser = JSON.parse(saved);
          if (savedUser?.id === providerId) providerObj = savedUser;
        }
      } catch {}
    }
    if (!providerObj && useFirebase) {
      try {
        const p = await firebaseService.getCurrentUser(providerId);
        if (p) providerObj = p as any;
      } catch {}
    }
    if (!providerObj) {
      providerObj = {
        id: providerId,
        username: providerId, // last resort; should rarely show now
        email: '',
        reputation_score: 0,
        total_reviews: 0,
        created_at: new Date().toISOString(),
      };
    }

    // Only use imageUrls (Cloudinary)
    const imageUrls: string[] = service.imageUrls && service.imageUrls.length > 0 ? service.imageUrls : [];

    // Generate unique ID with timestamp and random component
    const serviceId = `service_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newService: Service = {
      ...service,
      id: serviceId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      provider: providerObj,
      imageUrls,
      // Add metadata for tracking
      created_by: providerId,
      is_persistent: true,
    } as Service;

    console.log('🔄 Creating service with ID:', serviceId, 'for provider:', providerId);

    // PRIMARY: Save to local storage for instant access and reliability
    mockServices.push(newService);
    saveToStorage('services', mockServices);
    console.log('✅ Service saved to local storage instantly:', serviceId);

    // PERMANENT: Save to permanent storage system (survives logout)
    try {
      permanentStorage.addService(newService);
      console.log('🔒 Service saved to permanent storage - will never be lost');
    } catch (error) {
      console.warn('⚠️ Failed to save to permanent storage:', error);
    }

    // SKIP Firebase for faster, more reliable service creation
    console.log('⚡ Skipping Firebase - using local storage only for instant upload');

    // TERTIARY: Update shared storage for cross-session visibility
    try {
      const shared = loadShared<Service>('services', []);
      const exists = shared.find(s => s.id === serviceId);
      if (!exists) {
        shared.push(newService);
        saveShared('services', shared);
      }
    } catch (error) {
      console.warn('Failed to save to shared storage:', error);
    }

    console.log('🎉 Service created successfully:', newService.title);
    
    // Clear service cache to force refresh
    try {
      const { serviceLoader } = await import('./serviceLoader');
      serviceLoader.clearCache();
      console.log('🔄 Service cache cleared for immediate refresh');
    } catch (error) {
      console.warn('Failed to clear service cache:', error);
    }
    
    // Trigger immediate refresh events for instant UI updates
    window.dispatchEvent(new CustomEvent('timebank:services:refresh'));
    window.dispatchEvent(new CustomEvent('timebank:services:created', { detail: newService }));
    console.log('📢 Service refresh events dispatched immediately');
    
    return newService;
  },

  async updateService(serviceId: string, updates: Partial<Service>): Promise<Service> {
    const idx = mockServices.findIndex(s => s.id === serviceId);
    if (idx === -1) throw new Error('Service not found');
    const updated = { ...mockServices[idx], ...updates } as Service;
    mockServices[idx] = updated;
    saveToStorage('services', mockServices);
    if (useFirebase) {
      try {
        await firebaseService.updateService(serviceId, updated);
        console.log('✅ Service updated in Firestore:', serviceId);
      } catch (error) {
        console.error('Failed to update service in Firestore:', error);
      }
    }
    // Write-through to shared fallback so updates persist across sessions without Firebase
    try {
      const shared = loadShared<Service>('services', mockServices);
      const i = shared.findIndex(s => s.id === serviceId);
      if (i !== -1) {
        shared[i] = { ...shared[i], ...updates } as Service;
      } else {
        shared.push(updated);
      }
      saveShared('services', shared);
    } catch {}
    return {
      ...updated,
      provider: mockUsers.find(u => u.id === updated.provider_id),
      skill: mockSkills.find(sk => sk.id === updated.skill_id),
    } as Service;
  },

  async deleteService(serviceId: string, currentUserId?: string): Promise<void> {
    // Find the service first - check all storage locations
    let service = mockServices.find(s => s.id === serviceId);
    
    // If not found locally, try permanent storage
    if (!service) {
      try {
        const permanentServices = permanentStorage.loadServices();
        service = permanentServices.find(s => s.id === serviceId);
      } catch (error) {
        console.warn('Failed to load service from permanent storage:', error);
      }
    }
    
    // If not found, try shared storage
    if (!service) {
      try {
        const sharedServices = loadShared<Service>('services', []);
        service = sharedServices.find(s => s.id === serviceId);
      } catch (error) {
        console.warn('Failed to load service from shared storage:', error);
      }
    }
    
    // If still not found, try Firebase
    if (!service && useFirebase) {
      try {
        const servicesFromFs = await loadFromFirestore<Service>('services');
        service = servicesFromFs.find(s => s.id === serviceId);
      } catch (error) {
        console.warn('Failed to load service from Firebase for deletion check:', error);
      }
    }
    
    if (!service) {
      throw new Error('Service not found');
    }
    
    // Authorization check: Only service owner or admin can delete
    if (currentUserId && currentUserId !== 'official-account' && service.provider_id !== currentUserId) {
      throw new Error('Unauthorized: You can only delete your own services');
    }
    
    console.log('🗑️ Deleting service:', serviceId, 'by user:', currentUserId);
    
    // Remove from Firebase first
    if (useFirebase) {
      try {
        await deleteDoc(doc(db, 'services', serviceId));
        console.log('✅ Service deleted from Firebase:', serviceId);
      } catch (error) {
        console.error('❌ Failed to delete service from Firebase:', error);
      }
    }
    
    // Remove from local storage
    const idx = mockServices.findIndex(s => s.id === serviceId);
    if (idx !== -1) {
      mockServices.splice(idx, 1);
      saveToStorage('services', mockServices);
      console.log('✅ Service removed from local storage');
    }
    
    // Remove from permanent storage
    try {
      const permanentServices = permanentStorage.loadServices();
      const filtered = permanentServices.filter(s => s.id !== serviceId);
      permanentStorage.saveServices(filtered);
      console.log('✅ Service removed from permanent storage');
    } catch (error) {
      console.warn('Failed to remove from permanent storage:', error);
    }
    
    // Remove from shared storage
    try {
      const shared = loadShared<Service>('services', []);
      const filtered = shared.filter(s => s.id !== serviceId);
      saveShared('services', filtered);
      console.log('✅ Service removed from shared storage');
    } catch (error) {
      console.warn('Failed to remove from shared storage:', error);
    }
    
    console.log('🎉 Service deleted successfully:', serviceId);
    
    // Dispatch deletion event for UI refresh
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('timebank:services:deleted', { detail: { serviceId } }));
      console.log('📢 Service deletion event dispatched');
    }
  },

  async getBookings(userId: string): Promise<Booking[]> {
    // Prefer Firestore when available so both participants see bookings across accounts
    if (useFirebase) {
      try {
        const fromFs = await loadFromFirestore<Booking>('bookings');
        const shared = loadShared<Booking>('bookings', []);
        const allCandidates = [...fromFs, ...shared, ...mockBookings];
        const byId = new Map<string, Booking>();
        for (const b of allCandidates) {
          if (!b || !b.id) continue;
          if (!byId.has(b.id) || fromFs.find((fb: any) => fb.id === b.id)) {
            byId.set(b.id, b);
          }
        }
        const mine = Array.from(byId.values()).filter(b => b.provider_id === userId || b.requester_id === userId);

        // Enrich with provider, requester and service
        const userIds = Array.from(new Set(mine.flatMap(b => [b.provider_id, b.requester_id]).filter(Boolean)));
        const userMap = new Map<string, any>();
        await Promise.all(userIds.map(async (uid) => {
          try {
            const u = await firebaseService.getCurrentUser(uid);
            if (u) userMap.set(uid, u);
          } catch {}
        }));

        return mine.map(b => ({
          ...b,
          provider: b.provider || userMap.get(b.provider_id) || mockUsers.find(u => u.id === b.provider_id) || undefined,
          requester: b.requester || userMap.get(b.requester_id) || mockUsers.find(u => u.id === b.requester_id) || undefined,
          service: b.service || mockServices.find(s => s.id === b.service_id) || undefined,
        })) as Booking[];
      } catch (err) {
        console.error('Failed to load bookings from Firestore, falling back to shared/local', err);
      }
    }

    // Fallback: use shared localStorage so cross-login in same browser works
    const sharedBookings = loadShared<Booking>('bookings', mockBookings);
    const bookings = sharedBookings.filter(booking => booking.provider_id === userId || booking.requester_id === userId);
    return bookings.map(b => ({
      ...b,
      provider: mockUsers.find(u => u.id === b.provider_id),
      requester: mockUsers.find(u => u.id === b.requester_id),
      service: mockServices.find(s => s.id === b.service_id),
    })) as Booking[];
  },

  async createBooking(booking: Omit<Booking, 'id' | 'created_at' | 'status'>): Promise<Booking> {
    const newBooking: Booking = {
      ...booking,
      id: Date.now().toString(),
      status: 'pending',
      confirmation_status: 'awaiting_provider',
      credits_transferred: false,
      created_at: new Date().toISOString()
    };

    // Check if requester has enough credits
    const requesterCredits = mockTimeCredits.find(tc => tc.user_id === booking.requester_id);
    const service = mockServices.find(s => s.id === booking.service_id);
    
    if (requesterCredits && service) {
      const requiredCredits = booking.duration_hours * service.credits_per_hour;
      if (requesterCredits.balance < requiredCredits) {
        throw new Error('Insufficient credits to book this service');
      }
      
      // Hold credits (reserve but don't transfer yet)
      newBooking.credits_held = requiredCredits;
      requesterCredits.balance -= requiredCredits; // Reserve the credits
      requesterCredits.updated_at = new Date().toISOString();
      
      // Note: credits_transferred remains false until provider confirms
    }

    // Update services_requested count for the requester
    const requesterUser = mockUsers.find(u => u.id === booking.requester_id);
    if (requesterUser) {
      requesterUser.services_requested = (requesterUser.services_requested || 0) + 1;
    }

    // Persist in-memory and localStorage
    mockBookings.push(newBooking);
    saveToStorage('bookings', mockBookings);
    saveToStorage('time_credits', mockTimeCredits);
    saveToStorage('users', mockUsers);
    
    // Try to persist to Firestore when available; on failure, persist to shared fallback
    if (useFirebase) {
      try {
        await saveToFirestore('bookings', newBooking.id, newBooking);
        if (requesterCredits) {
          await saveToFirestore('time_credits', booking.requester_id, requesterCredits);
        }
        if (requesterUser) {
          await saveToFirestore('users', booking.requester_id, requesterUser);
        }
      } catch (error) {
        console.error('Failed to save booking to Firestore, falling back to shared storage:', error);
        const shared = loadShared<Booking>('bookings', mockBookings);
        shared.push(newBooking);
        saveShared('bookings', shared);
        saveShared('time_credits', mockTimeCredits);
        saveShared('users', mockUsers);
      }
    } else {
      const shared = loadShared<Booking>('bookings', mockBookings);
      shared.push(newBooking);
      saveShared('bookings', shared);
      saveShared('time_credits', mockTimeCredits);
      saveShared('users', mockUsers);
    }
    return {
      ...newBooking,
      provider: mockUsers.find(u => u.id === newBooking.provider_id),
      requester: mockUsers.find(u => u.id === newBooking.requester_id),
      service: mockServices.find(s => s.id === newBooking.service_id),
    } as Booking;
  },

  async updateBooking(bookingId: string, updates: Partial<Booking>): Promise<Booking> {
    let idx = mockBookings.findIndex(b => b.id === bookingId);
    let originalBooking = mockBookings[idx];
    // If not found locally, try shared storage or Firestore
    if (!originalBooking) {
      const shared = loadShared<Booking>('bookings', []);
      const found = shared.find(b => b.id === bookingId);
      if (found) originalBooking = found as Booking;
    }
    if (!originalBooking && useFirebase) {
      try {
        const snap = await getDoc(doc(db, 'bookings', bookingId));
        if (snap.exists()) {
          const data: any = snap.data();
          originalBooking = {
            id: bookingId,
            ...data,
            created_at: data.created_at?.toDate?.()?.toISOString?.() || data.created_at || new Date().toISOString(),
          } as Booking;
          mockBookings.push(originalBooking);
          saveToStorage('bookings', mockBookings);
          idx = mockBookings.findIndex(b => b.id === bookingId);
        }
      } catch (err) {
        console.error('Failed to load booking from Firestore for update', err);
      }
    }
    if (!originalBooking) throw new Error('Booking not found');
    if (idx === -1) { mockBookings.push(originalBooking); idx = mockBookings.length - 1; }
    const updated = { ...originalBooking, ...updates } as Booking;
    
    // If booking is being marked as completed, award XP and (if not already done) credits to provider
    if (updates.status === 'completed' && originalBooking.status !== 'completed') {
      const providerCredits = mockTimeCredits.find(tc => tc.user_id === updated.provider_id);
      const requesterCredits = mockTimeCredits.find(tc => tc.user_id === updated.requester_id);
      let service = mockServices.find(s => s.id === updated.service_id);
      if (!service && useFirebase && updated.service_id) {
        try {
          const sSnap = await getDoc(doc(db, 'services', updated.service_id));
          if (sSnap.exists()) {
            const sd: any = sSnap.data();
            service = { id: updated.service_id, ...sd } as any;
          }
        } catch (err) {
          console.warn('Could not fetch service from Firestore for booking completion', err);
        }
      }
      const provider = mockUsers.find(u => u.id === updated.provider_id);

      if (service && updated.duration_hours && provider) {
        const baseCredits = updated.duration_hours * (service.credits_per_hour ?? 1);

        if (providerCredits) {
          // If base credits weren't transferred yet (no confirm), transfer base now
          if (!updated.credits_transferred) {
            providerCredits.balance += baseCredits;
            providerCredits.total_earned += baseCredits;
            providerCredits.updated_at = new Date().toISOString();
            updated.credits_transferred = true;

            // Burn base from requester as spent (it was already reserved at booking time)
            if (requesterCredits) {
              requesterCredits.total_spent = (requesterCredits.total_spent || 0) + baseCredits;
              requesterCredits.updated_at = new Date().toISOString();
            }

            // Base payment transaction only
            mockTransactions.push({
              id: Date.now().toString(),
              from_user_id: updated.requester_id,
              to_user_id: updated.provider_id,
              booking_id: bookingId,
              amount: baseCredits,
              transaction_type: 'service_completed' as const,
              description: `Payment for: ${service.title}`,
              created_at: new Date().toISOString(),
            });
          }
        }

        // Award XP and update provider level regardless of credit transfer state
        const currentExperience = provider.experience_points || 0;
        const currentServicesCompleted = provider.services_completed || 0;
        const previousLevel = provider.level || 1;
        const isFirstService = currentServicesCompleted === 0;
        
        // Check if there's already a review for this booking to get actual rating
        const existingReview = mockReviews.find(r => r.booking_id === bookingId);
        const reviewRating = existingReview ? existingReview.rating : 0; // No bonus if no review yet
        
        const experienceGained = calculateServiceExperience(reviewRating, isFirstService, 1);
        provider.experience_points = currentExperience + experienceGained;
        provider.services_completed = currentServicesCompleted + 1;
        provider.level = calculateLevel(provider.experience_points);
        if (provider.level >= 5 && !provider.custom_credits_enabled) {
          provider.custom_credits_enabled = true;
        }
        
        console.log(`🎯 Service completed! Provider ${provider.username} gained ${experienceGained} XP (rating: ${reviewRating || 'none yet'}). Total XP: ${provider.experience_points}, Level: ${provider.level}`);
        
        if (provider.level > previousLevel) {
          // Mint a one-time level-up credit bonus
          const levelBonus = getLevelUpBonusCredits(provider.level);
          const providerTc = mockTimeCredits.find(tc => tc.user_id === updated.provider_id);
          if (levelBonus > 0 && providerTc) {
            providerTc.balance += levelBonus;
            providerTc.total_earned += levelBonus;
            providerTc.updated_at = new Date().toISOString();
            mockTransactions.push({
              id: (Date.now() + 2).toString(),
              to_user_id: updated.provider_id,
              amount: levelBonus,
              transaction_type: 'adjustment' as const,
              description: `🎉 Level Up Bonus! Reached Level ${provider.level}`,
              created_at: new Date().toISOString(),
            } as any);
          } else {
            // Still record a level-up note for history if no credits
            mockTransactions.push({
              id: (Date.now() + 2).toString(),
              to_user_id: updated.provider_id,
              amount: 0,
              transaction_type: 'adjustment' as const,
              description: `🎉 Level Up! You reached Level ${provider.level}!`,
              created_at: new Date().toISOString(),
            } as any);
          }
        }
        saveToStorage('users', mockUsers);
        if (useFirebase) {
          try {
            await saveToFirestore('users', provider.id, provider as any);
          } catch (e) {
            console.warn('Failed to persist provider user update to Firestore', e);
          }
        }
      }
    }
    
    mockBookings[idx] = updated;
    saveToStorage('bookings', mockBookings);
    saveToStorage('time_credits', mockTimeCredits);
    saveToStorage('transactions', mockTransactions);

    // Write-through to Firestore and shared fallback so both users see updates
    if (useFirebase) {
      try {
        await saveToFirestore('bookings', bookingId, updated);
        // Persist credit and transactions if applicable
        const providerTc = mockTimeCredits.find(tc => tc.user_id === updated.provider_id);
        if (providerTc) await saveToFirestore('time_credits', providerTc.user_id, providerTc);
        const requesterTc = mockTimeCredits.find(tc => tc.user_id === updated.requester_id);
        if (requesterTc) await saveToFirestore('time_credits', requesterTc.user_id, requesterTc);
        // Persist latest transaction record (id is timestamp-based; save all for simplicity)
        const tx = mockTransactions[mockTransactions.length - 1];
        if (tx) await saveToFirestore('transactions', tx.id, tx as any);
      } catch (err) {
        console.error('Failed to update booking in Firestore, falling back to shared', err);
        const shared = loadShared<Booking>('bookings', mockBookings);
        const i = shared.findIndex(b => b.id === bookingId);
        if (i !== -1) {
          shared[i] = updated;
          saveShared('bookings', shared);
        }
      }
    } else {
      const shared = loadShared<Booking>('bookings', mockBookings);
      const i = shared.findIndex(b => b.id === bookingId);
      if (i !== -1) {
        shared[i] = updated;
        saveShared('bookings', shared);
      }
    }
    return {
      ...updated,
      provider: mockUsers.find(u => u.id === updated.provider_id),
      requester: mockUsers.find(u => u.id === updated.requester_id),
      service: mockServices.find(s => s.id === updated.service_id),
    } as Booking;
  },

  // Admin helper: return all services (raw, merged from Firestore/shared/mock)
  async getAllRawServices(): Promise<any[]> {
    if (useFirebase) {
      try {
        const servicesFromFs = await loadFromFirestore<any>('services');
        const sharedServices = loadShared<any>('services', []);
        const allCandidates = [...servicesFromFs, ...sharedServices, ...mockServices];
        const byId = new Map<string, any>();
        for (const s of allCandidates) {
          if (!s || !s.id) continue;
          if (!byId.has(s.id) || servicesFromFs.find((sf: any) => sf.id === s.id)) {
            byId.set(s.id, s);
          }
        }
        return Array.from(byId.values());
      } catch (err) {
        console.error('Failed to load all raw services from Firestore, falling back to shared/mock', err);
        return loadShared<any>('services', mockServices);
      }
    }
    return loadShared<any>('services', mockServices);
  },

  // Admin helper: return all bookings (raw)
  async getAllRawBookings(): Promise<any[]> {
    if (useFirebase) {
      try {
        const bookingsFromFs = await loadFromFirestore<any>('bookings');
        const shared = loadShared<any>('bookings', mockBookings);
        const byId = new Map<string, any>();
        for (const b of [...bookingsFromFs, ...shared, ...mockBookings]) {
          if (!b || !b.id) continue;
          if (!byId.has(b.id) || bookingsFromFs.find((bf: any) => bf.id === b.id)) {
            byId.set(b.id, b);
          }
        }
        return Array.from(byId.values());
      } catch (err) {
        console.error('Failed to load bookings from Firestore, falling back to shared/mock', err);
        return loadShared<any>('bookings', mockBookings);
      }
    }
    return loadShared<any>('bookings', mockBookings);
  },

  // Admin helper: return all users (raw)
  async getAllRawUsers(): Promise<any[]> {
    if (useFirebase) {
      try {
        const usersFromFs = await loadFromFirestore<any>('users');
        // Merge with mock users
        const byId = new Map<string, any>();
        for (const u of [...usersFromFs, ...mockUsers]) {
          if (!u || !u.id) continue;
          if (!byId.has(u.id) || usersFromFs.find((uf: any) => uf.id === u.id)) {
            byId.set(u.id, u);
          }
        }
        return Array.from(byId.values());
      } catch (err) {
        console.error('Failed to load users from Firestore, falling back to mock', err);
        return mockUsers;
      }
    }
    return mockUsers;
  },

  async getReviews(userId: string): Promise<Review[]> {
    const reviews = mockReviews.filter(review => review.reviewee_id === userId);
    return reviews.map(r => ({
      ...r,
      reviewer: mockUsers.find(u => u.id === r.reviewer_id),
      reviewee: mockUsers.find(u => u.id === r.reviewee_id),
    })) as Review[];
  },

  async getReviewsByUser(userId: string): Promise<Review[]> {
    const reviews = mockReviews.filter(review => review.reviewer_id === userId);
    console.log(`Found ${reviews.length} reviews by user ${userId}:`, reviews.map(r => ({ id: r.id, booking_id: r.booking_id, rating: r.rating })));
    return reviews.map(r => ({
      ...r,
      reviewer: mockUsers.find(u => u.id === r.reviewer_id),
      reviewee: mockUsers.find(u => u.id === r.reviewee_id),
    })) as Review[];
  },

  async createReview(review: Omit<Review, 'id' | 'created_at'>): Promise<Review> {
    console.log('Creating review:', review);
    
    const newReview: Review = {
      ...review,
      id: Date.now().toString(),
      created_at: new Date().toISOString()
    };
    
    mockReviews.push(newReview);
    saveToStorage('reviews', mockReviews);
    
    console.log('Review created and saved:', newReview);

    // Award XP to the reviewer (requester) for submitting a review
    const reviewerIdx = mockUsers.findIndex(u => u.id === review.reviewer_id);
    if (reviewerIdx !== -1) {
      const reviewer = mockUsers[reviewerIdx];
      const currentExperience = reviewer.experience_points || 0;
      const previousLevel = reviewer.level || 1;
      
      // Award XP for submitting a review (10 XP base + 10 bonus for 5-star)
      const baseReviewXP = 10;
      const fiveStarBonus = review.rating === 5 ? 10 : 0;
      const totalReviewXP = baseReviewXP + fiveStarBonus;
      
      reviewer.experience_points = currentExperience + totalReviewXP;
      reviewer.level = calculateLevel(reviewer.experience_points);
      
      console.log(`📝 Reviewer ${reviewer.username} earned ${totalReviewXP} XP for submitting review! Total XP: ${reviewer.experience_points}, Level: ${reviewer.level}`);
      
      // Check for level up and award bonus credits
      if (reviewer.level > previousLevel) {
        reviewer.custom_credits_enabled = reviewer.level >= 5;
        
        // Award level-up bonus credits to reviewer
        const levelBonus = getLevelUpBonusCredits(reviewer.level);
        if (levelBonus > 0) {
          const reviewerTc = mockTimeCredits.find(tc => tc.user_id === reviewer.id);
          if (reviewerTc) {
            reviewerTc.balance += levelBonus;
            reviewerTc.total_earned += levelBonus;
            reviewerTc.updated_at = new Date().toISOString();
            
            mockTransactions.push({
              id: (Date.now()).toString(),
              to_user_id: reviewer.id,
              amount: levelBonus,
              transaction_type: 'adjustment' as const,
              description: `🎉 Level Up Bonus! Reached Level ${reviewer.level} (from review submission)`,
              created_at: new Date().toISOString(),
            } as any);
            
            saveToStorage('time_credits', mockTimeCredits);
            saveToStorage('transactions', mockTransactions);
          }
        }
        
        // Dispatch level up event for UI updates
        window.dispatchEvent(new CustomEvent('timebank:levelUp', {
          detail: {
            userId: reviewer.id,
            newLevel: reviewer.level,
            previousLevel,
            xpGained: totalReviewXP,
            reason: 'review_submission'
          }
        }));
        
        console.log(`🎉 Reviewer ${reviewer.username} leveled up to Level ${reviewer.level}!`);
      }
      
      mockUsers[reviewerIdx] = reviewer;
      saveToStorage('users', mockUsers);
    }

    // Update reviewee's reputation score and total reviews count
    const revieweeIdx = mockUsers.findIndex(u => u.id === review.reviewee_id);
    if (revieweeIdx !== -1) {
      const reviewee = mockUsers[revieweeIdx];
      
      // Get all reviews for this user to calculate new average
      const userReviews = mockReviews.filter(r => r.reviewee_id === review.reviewee_id);
      const totalRating = userReviews.reduce((sum, r) => sum + r.rating, 0);
      const averageRating = totalRating / userReviews.length;
      
      // Update user's reputation and review count
      reviewee.reputation_score = Number(averageRating.toFixed(1));
      reviewee.total_reviews = userReviews.length;

      // Award bonus XP for 5-star reviews
      if (review.rating === 5) {
        const currentExperience = reviewee.experience_points || 0;
        const previousLevel = reviewee.level || 1;
        
        // Award high rating bonus XP
        const bonusXP = 20;
        reviewee.experience_points = currentExperience + bonusXP;
        reviewee.level = calculateLevel(reviewee.experience_points);
        
        // Check for level up and award bonus credits
        if (reviewee.level > previousLevel) {
          reviewee.custom_credits_enabled = reviewee.level >= 5;
          
          // Award level-up bonus credits
          const levelBonus = getLevelUpBonusCredits(reviewee.level);
          if (levelBonus > 0) {
            const revieweeTc = mockTimeCredits.find(tc => tc.user_id === reviewee.id);
            if (revieweeTc) {
              revieweeTc.balance += levelBonus;
              revieweeTc.total_earned += levelBonus;
              revieweeTc.updated_at = new Date().toISOString();
              
              mockTransactions.push({
                id: (Date.now() + 1).toString(),
                to_user_id: reviewee.id,
                amount: levelBonus,
                transaction_type: 'adjustment' as const,
                description: `🎉 Level Up Bonus! Reached Level ${reviewee.level} (from 5-star review)`,
                created_at: new Date().toISOString(),
              } as any);
              
              saveToStorage('time_credits', mockTimeCredits);
              saveToStorage('transactions', mockTransactions);
            }
          }
        }
        
        console.log(`🌟 Awarded ${bonusXP} bonus XP to ${reviewee.username} for 5-star review! Total XP: ${reviewee.experience_points}, Level: ${reviewee.level}`);
      }
      
      mockUsers[revieweeIdx] = reviewee;
      saveToStorage('users', mockUsers);
      
      // Save to Firebase if available
      if (useFirebase) {
        try {
          await saveToFirestore('users', reviewee.id, reviewee);
        } catch (error) {
          console.error('Failed to update user reputation in Firestore:', error);
        }
      }
    }

    // Save review to Firebase if available
    if (useFirebase) {
      try {
        await saveToFirestore('reviews', newReview.id, newReview);
      } catch (error) {
        console.error('Failed to save review to Firestore:', error);
      }
    }

    return {
      ...newReview,
      reviewer: mockUsers.find(u => u.id === newReview.reviewer_id),
      reviewee: mockUsers.find(u => u.id === newReview.reviewee_id),
    } as Review;
  },

  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    console.log('🔄 dataService.updateUser called with userId:', userId, 'updates:', updates);
    console.log('🔐 Current auth state:', { 
      isAuthenticated: !!auth.currentUser, 
      authUserId: auth.currentUser?.uid,
      matchesUserId: auth.currentUser?.uid === userId 
    });
    
    const idx = mockUsers.findIndex(u => u.id === userId);
    if (idx === -1) {
      console.error('❌ User not found in mockUsers:', userId);
      console.log('📋 Available users:', mockUsers.map(u => ({ id: u.id, username: u.username })));
      throw new Error(`User not found: ${userId}`);
    }
    
    const currentUser = mockUsers[idx];
    console.log('👤 Current user data:', {
      id: currentUser.id,
      level: currentUser.level,
      xp: currentUser.experience_points,
      servicesCompleted: currentUser.services_completed
    });
    
    // Merge updates with current user data
    const updated = { ...currentUser, ...updates };
    
    // Ensure level system fields are properly initialized
    updated.level = updated.level || 1;
    updated.experience_points = updated.experience_points || 0;
    updated.services_completed = updated.services_completed || 0;
    updated.custom_credits_enabled = updated.custom_credits_enabled || false;
    
    // Recalculate level based on experience points if XP changed
    if (updates.experience_points !== undefined && updates.experience_points !== currentUser.experience_points) {
      const newLevel = calculateLevel(updated.experience_points);
      const oldLevel = currentUser.level || 1;
      
      console.log('📊 Level calculation:', {
        oldXP: currentUser.experience_points,
        newXP: updated.experience_points,
        oldLevel: oldLevel,
        calculatedLevel: newLevel
      });
      
      if (newLevel > oldLevel) {
        updated.level = newLevel;
        console.log('🎉 Level up detected!', { from: oldLevel, to: newLevel });
      }
    }
    
    // Update the user in memory
    mockUsers[idx] = updated;
    
    console.log('✅ User updated successfully in memory:', {
      id: updated.id,
      username: updated.username,
      level: updated.level,
      xp: updated.experience_points,
      servicesCompleted: updated.services_completed,
      customCreditsEnabled: updated.custom_credits_enabled
    });
    
    // Save to localStorage immediately
    try {
      saveToStorage('users', mockUsers);
      console.log('💾 Saved to localStorage successfully');
    } catch (localError) {
      console.error('❌ Failed to save to localStorage:', localError);
    }
    
    // Also save to Firebase if available
    if (useFirebase) {
      try {
        await saveToFirestore('users', userId, updated);
        console.log('☁️ Saved to Firestore successfully');
      } catch (error) {
        console.error('❌ Failed to save user to Firebase:', error);
        // Don't throw here - allow the operation to continue with local storage
      }
    }
    
    // Trigger level system events if level changed
    if (updated.level > (currentUser.level || 1)) {
      console.log('🎯 Triggering level up event');
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('timebank:levelUp', {
          detail: { 
            user: updated, 
            oldLevel: currentUser.level || 1, 
            newLevel: updated.level 
          }
        }));
      }, 100);
    }
    
    return updated;
  },

  async blockUser(userId: string, reason: string, adminId: string): Promise<void> {
    console.log('🚫 Blocking user:', userId, 'Reason:', reason, 'Admin:', adminId);
    
    const idx = mockUsers.findIndex(u => u.id === userId);
    if (idx === -1) {
      throw new Error(`User not found: ${userId}`);
    }
    
    // Update user with blocked status
    mockUsers[idx] = {
      ...mockUsers[idx],
      is_blocked: true,
      blocked_at: new Date().toISOString(),
      blocked_reason: reason,
      blocked_by: adminId,
    };
    
    // Save to localStorage
    saveToStorage('users', mockUsers);
    
    // Save to Firebase if available
    if (useFirebase) {
      try {
        await firebaseService.blockUser(userId, reason, adminId);
        console.log('☁️ User blocked in Firestore successfully');
      } catch (error) {
        console.error('❌ Failed to block user in Firebase:', error);
        // Don't throw here - allow the operation to continue with local storage
      }
    }
    
    console.log('✅ User blocked successfully:', userId);
  },

  async unblockUser(userId: string, adminId: string): Promise<void> {
    console.log('✅ Unblocking user:', userId, 'Admin:', adminId);
    
    const idx = mockUsers.findIndex(u => u.id === userId);
    if (idx === -1) {
      throw new Error(`User not found: ${userId}`);
    }
    
    // Update user to remove blocked status
    mockUsers[idx] = {
      ...mockUsers[idx],
      is_blocked: false,
      blocked_at: undefined,
      blocked_reason: undefined,
      blocked_by: undefined,
    };
    
    // Save to localStorage
    saveToStorage('users', mockUsers);
    
    // Save to Firebase if available
    if (useFirebase) {
      try {
        await firebaseService.unblockUser(userId, adminId);
        console.log('☁️ User unblocked in Firestore successfully');
      } catch (error) {
        console.error('❌ Failed to unblock user in Firebase:', error);
        // Don't throw here - allow the operation to continue with local storage
      }
    }
    
    console.log('✅ User unblocked successfully:', userId);
  },

  async confirmBooking(bookingId: string, providerId: string, notes?: string): Promise<Booking> {
    let idx = mockBookings.findIndex(b => b.id === bookingId);
    let booking = mockBookings[idx];
    if (!booking) {
      const shared = loadShared<Booking>('bookings', []);
      const found = shared.find(b => b.id === bookingId);
      if (found) booking = found as Booking;
    }
    if (!booking && useFirebase) {
      try {
        const snap = await getDoc(doc(db, 'bookings', bookingId));
        if (snap.exists()) {
          const data: any = snap.data();
          booking = { id: bookingId, ...data, created_at: data.created_at?.toDate?.()?.toISOString?.() || data.created_at || new Date().toISOString() } as Booking;
          mockBookings.push(booking);
          saveToStorage('bookings', mockBookings);
          idx = mockBookings.findIndex(b => b.id === bookingId);
        }
      } catch (err) {
        console.error('Failed to fetch booking for confirm', err);
      }
    }
    if (!booking) throw new Error('Booking not found');
    if (idx === -1) { mockBookings.push(booking); idx = mockBookings.length - 1; }
    if (booking.provider_id !== providerId) {
      throw new Error('Only the service provider can confirm this booking');
    }
    
    if (booking.confirmation_status !== 'awaiting_provider') {
      throw new Error('Booking is not in a confirmable state');
    }

    // Update booking status
    const updatedBooking = {
      ...booking,
      confirmation_status: 'provider_confirmed' as const,
      status: 'confirmed' as const,
      provider_notes: notes,
      confirmed_at: new Date().toISOString(),
      credits_transferred: true
    };

    // Transfer credits from held to provider
    if (booking.credits_held && !booking.credits_transferred) {
      const providerCredits = mockTimeCredits.find(tc => tc.user_id === booking.provider_id);
      if (providerCredits) {
        providerCredits.balance += booking.credits_held;
        providerCredits.total_earned += booking.credits_held;
        providerCredits.updated_at = new Date().toISOString();

        // Create transaction record
        const transaction = {
          id: Date.now().toString(),
          from_user_id: booking.requester_id,
          to_user_id: booking.provider_id,
          booking_id: booking.id,
          amount: booking.credits_held,
          transaction_type: 'service_completed' as const,
          description: `Payment for confirmed service booking`,
          created_at: new Date().toISOString()
        };
        mockTransactions.push(transaction);
        saveToStorage('transactions', mockTransactions);
      }

      // Update requester's spent credits
      const requesterCredits = mockTimeCredits.find(tc => tc.user_id === booking.requester_id);
      if (requesterCredits) {
        requesterCredits.total_spent += booking.credits_held;
        requesterCredits.updated_at = new Date().toISOString();
      }
    }

    mockBookings[idx] = updatedBooking;
    saveToStorage('bookings', mockBookings);
    saveToStorage('time_credits', mockTimeCredits);

    // Persist to Firestore/shared for cross-user visibility
    if (useFirebase) {
      try {
        await saveToFirestore('bookings', updatedBooking.id, updatedBooking);
        const providerCredits = mockTimeCredits.find(tc => tc.user_id === updatedBooking.provider_id);
        if (providerCredits) await saveToFirestore('time_credits', providerCredits.user_id, providerCredits);
        const requesterCredits = mockTimeCredits.find(tc => tc.user_id === updatedBooking.requester_id);
        if (requesterCredits) await saveToFirestore('time_credits', requesterCredits.user_id, requesterCredits);
        const lastTx = mockTransactions[mockTransactions.length - 1];
        if (lastTx) await saveToFirestore('transactions', lastTx.id, lastTx as any);
      } catch (err) {
        console.error('Failed to persist confirmed booking to Firestore, saving to shared fallback', err);
        const shared = loadShared<Booking>('bookings', mockBookings);
        const i = shared.findIndex(b => b.id === updatedBooking.id);
        if (i === -1) shared.push(updatedBooking); else shared[i] = updatedBooking;
        saveShared('bookings', shared);
      }
    } else {
      const shared = loadShared<Booking>('bookings', mockBookings);
      const i = shared.findIndex(b => b.id === updatedBooking.id);
      if (i === -1) shared.push(updatedBooking); else shared[i] = updatedBooking;
      saveShared('bookings', shared);
    }

    return {
      ...updatedBooking,
      provider: mockUsers.find(u => u.id === updatedBooking.provider_id),
      requester: mockUsers.find(u => u.id === updatedBooking.requester_id),
      service: mockServices.find(s => s.id === updatedBooking.service_id),
    } as Booking;
  },

  async declineBooking(bookingId: string, providerId: string, reason?: string): Promise<Booking> {
    let idx = mockBookings.findIndex(b => b.id === bookingId);
    let booking = mockBookings[idx];
    if (!booking) {
      const shared = loadShared<Booking>('bookings', []);
      const found = shared.find(b => b.id === bookingId);
      if (found) booking = found as Booking;
    }
    if (!booking && useFirebase) {
      try {
        const snap = await getDoc(doc(db, 'bookings', bookingId));
        if (snap.exists()) {
          const data: any = snap.data();
          booking = { id: bookingId, ...data, created_at: data.created_at?.toDate?.()?.toISOString?.() || data.created_at || new Date().toISOString() } as Booking;
          mockBookings.push(booking);
          saveToStorage('bookings', mockBookings);
          idx = mockBookings.findIndex(b => b.id === bookingId);
        }
      } catch (err) {
        console.error('Failed to fetch booking for decline', err);
      }
    }
    if (!booking) throw new Error('Booking not found');
    if (idx === -1) { mockBookings.push(booking); idx = mockBookings.length - 1; }
    if (booking.provider_id !== providerId) {
      throw new Error('Only the service provider can decline this booking');
    }
    
    if (booking.confirmation_status !== 'awaiting_provider') {
      throw new Error('Booking is not in a declinable state');
    }

    // Update booking status
    const updatedBooking = {
      ...booking,
      confirmation_status: 'declined' as const,
      status: 'cancelled' as const,
      provider_notes: reason,
      credits_transferred: false
    };

    // Return held credits to requester
    if (booking.credits_held && !booking.credits_transferred) {
      const requesterCredits = mockTimeCredits.find(tc => tc.user_id === booking.requester_id);
      if (requesterCredits) {
        requesterCredits.balance += booking.credits_held; // Return the held credits
        requesterCredits.updated_at = new Date().toISOString();
      }
    }

    mockBookings[idx] = updatedBooking;
    saveToStorage('bookings', mockBookings);
    saveToStorage('time_credits', mockTimeCredits);

    // Persist to Firestore/shared for cross-user visibility
    if (useFirebase) {
      try {
        await saveToFirestore('bookings', updatedBooking.id, updatedBooking);
        const requesterCredits = mockTimeCredits.find(tc => tc.user_id === updatedBooking.requester_id);
        if (requesterCredits) await saveToFirestore('time_credits', requesterCredits.user_id, requesterCredits);
      } catch (err) {
        console.error('Failed to persist declined booking to Firestore, saving to shared fallback', err);
        const shared = loadShared<Booking>('bookings', mockBookings);
        const i = shared.findIndex(b => b.id === updatedBooking.id);
        if (i === -1) shared.push(updatedBooking); else shared[i] = updatedBooking;
        saveShared('bookings', shared);
      }
    } else {
      const shared = loadShared<Booking>('bookings', mockBookings);
      const i = shared.findIndex(b => b.id === updatedBooking.id);
      if (i === -1) shared.push(updatedBooking); else shared[i] = updatedBooking;
      saveShared('bookings', shared);
    }

    return {
      ...updatedBooking,
      provider: mockUsers.find(u => u.id === updatedBooking.provider_id),
      requester: mockUsers.find(u => u.id === updatedBooking.requester_id),
      service: mockServices.find(s => s.id === updatedBooking.service_id),
    } as Booking;
  },

  // Emergency contacts methods
  async addEmergencyContact(userId: string, contact: Omit<EmergencyContact, 'id'>): Promise<EmergencyContact> {
    const user = mockUsers.find(u => u.id === userId);
    if (!user) throw new Error('User not found');

    const newContact: EmergencyContact = {
      ...contact,
      id: Date.now().toString()
    };

    user.emergency_contacts = user.emergency_contacts || [];
    user.emergency_contacts.push(newContact);
    
    saveToStorage('users', mockUsers);
    
    // Also save to Firebase if available
    if (useFirebase) {
      try {
        await saveToFirestore('users', userId, user);
      } catch (error) {
        console.error('Failed to save emergency contact to Firebase:', error);
      }
    }

    return newContact;
  },

  async deleteEmergencyContact(userId: string, contactId: string): Promise<void> {
    const user = mockUsers.find(u => u.id === userId);
    if (!user) throw new Error('User not found');

    user.emergency_contacts = user.emergency_contacts?.filter(c => c.id !== contactId) || [];
    
    saveToStorage('users', mockUsers);
    
    // Also save to Firebase if available
    if (useFirebase) {
      try {
        await saveToFirestore('users', userId, user);
      } catch (error) {
        console.error('Failed to delete emergency contact from Firebase:', error);
      }
    }
  },
};
