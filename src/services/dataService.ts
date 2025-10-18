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
  applyLevelBonus,
  EXPERIENCE_REWARDS
} from './levelService';

// Firebase imports
import { db, isFirebaseConfigured } from '../firebase';
import { firebaseService } from './firebaseService';
import {
  doc,
  setDoc,
  collection,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';

import { deleteDoc } from 'firebase/firestore';

// Check if Firebase is available
const useFirebase = isFirebaseConfigured() && !!db;

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

// Firebase helper functions
const saveToFirestore = async <T>(collectionName: string, id: string, data: T) => {
  if (!useFirebase) return;
  try {
    await setDoc(doc(db, collectionName, id), {
      ...data,
      updated_at: serverTimestamp()
    });
  } catch (error) {
    console.error(`Error saving to Firestore ${collectionName}:`, error);
  }
};

const loadFromFirestore = async <T>(collectionName: string): Promise<T[]> => {
  if (!useFirebase) return [];
  try {
    const querySnapshot = await getDocs(collection(db, collectionName));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      created_at: doc.data().created_at?.toDate?.()?.toISOString() || doc.data().created_at,
      updated_at: doc.data().updated_at?.toDate?.()?.toISOString() || doc.data().updated_at
    })) as T[];
  } catch (error) {
    console.error(`Error loading from Firestore ${collectionName}:`, error);
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
    return mockTimeCredits.find(tc => tc.user_id === userId) || null;
  },

  async ensureInitialCredits(userId: string, amount: number = 10): Promise<TimeCredit> {
    let tc = mockTimeCredits.find(t => t.user_id === userId);
    if (!tc) {
      tc = {
        id: Date.now().toString(),
        user_id: userId,
        balance: amount,
        total_earned: amount,
        total_spent: 0,
        updated_at: new Date().toISOString(),
      };
      mockTimeCredits.push(tc);
      saveToStorage('time_credits', mockTimeCredits);
    }
    return tc;
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
  // If Firebase is enabled, load services from Firestore so they are shared across users
  if (useFirebase) {
      try {
        const servicesFromFs = await loadFromFirestore<Service>('services');

        // Merge services from Firestore with local mock and shared fallback so local posts are visible
        const sharedServices = loadShared<Service>('services', []);
        const allCandidates = [...servicesFromFs, ...sharedServices, ...mockServices];
        // Deduplicate by id, prefer Firestore entry when present
        const byId = new Map<string, Service>();
        for (const s of allCandidates) {
          if (!s || !s.id) continue;
          if (!byId.has(s.id) || servicesFromFs.find(sf => sf.id === s.id)) {
            byId.set(s.id, s);
          }
        }
        let filtered = Array.from(byId.values());

        if (filters?.type) {
          filtered = filtered.filter(s => s.type === filters.type);
        }

        if (filters?.search) {
          const term = filters.search.toLowerCase();
          filtered = filtered.filter(s =>
            (s.title as string)?.toLowerCase().includes(term) ||
            (s.description as string)?.toLowerCase().includes(term)
          );
        }

        if (filters?.category) {
          const categorySkills = mockSkills.filter(sk => sk.category === filters.category);
          const skillIds = categorySkills.map(sk => sk.id);
          filtered = filtered.filter(s => skillIds.includes(s.skill_id));
        }

        // Enrich with provider (load provider from Firestore when available) and local skill data
        const providerIds = Array.from(new Set(filtered.map(s => s.provider_id).filter(Boolean)));
        const providerMap = new Map<string, any>();
        await Promise.all(
          providerIds.map(async (pid) => {
            try {
              const p = await firebaseService.getCurrentUser(pid);
              if (p) providerMap.set(pid, p);
            } catch (err) {
              // ignore per-user fetch errors
            }
          })
        );

        const enriched = filtered.map(s => ({
          ...s,
          // Preserve existing embedded provider snapshot first, then try Firebase user, then mock
          provider: s.provider || providerMap.get(s.provider_id) || mockUsers.find(u => u.id === s.provider_id) || undefined,
          skill: mockSkills.find(sk => sk.id === s.skill_id) || undefined,
        })) as Service[];

        return enriched;
      } catch (error) {
        console.error('Failed to load services from Firestore, will try shared local fallback', error);
        // Try shared local fallback
        const shared = loadShared<Service>('services', mockServices);
        let filteredShared = [...shared];
        if (filters?.type) filteredShared = filteredShared.filter(s => s.type === filters.type);
        if (filters?.search) {
          const term = filters.search.toLowerCase();
          filteredShared = filteredShared.filter(s => (s.title as string)?.toLowerCase().includes(term) || (s.description as string)?.toLowerCase().includes(term));
        }
        if (filters?.category) {
          const categorySkills = mockSkills.filter(sk => sk.category === filters.category);
          const skillIds = categorySkills.map(sk => sk.id);
          filteredShared = filteredShared.filter(s => skillIds.includes(s.skill_id));
        }

        const enrichedShared = filteredShared.map(s => ({
          ...s,
          provider: s.provider || mockUsers.find(u => u.id === s.provider_id) || undefined,
          skill: mockSkills.find(sk => sk.id === s.skill_id) || undefined,
        })) as Service[];
        return enrichedShared;
      }
    }
    // If Firebase is not available, try shared localStorage (cross-login in same browser)
    if (!useFirebase) {
      const shared = loadShared<Service>('services', mockServices);
      let filteredShared = [...shared];
      if (filters?.type) filteredShared = filteredShared.filter(s => s.type === filters.type);
      if (filters?.search) {
        const term = filters.search.toLowerCase();
        filteredShared = filteredShared.filter(s => s.title.toLowerCase().includes(term) || s.description.toLowerCase().includes(term));
      }
      if (filters?.category) {
        const skillIds = mockSkills.filter(sk => sk.category === filters.category).map(sk => sk.id);
        filteredShared = filteredShared.filter(s => skillIds.includes(s.skill_id));
      }
      const enrichedShared = filteredShared.map(s => ({
        ...s,
        provider: s.provider || mockUsers.find(u => u.id === s.provider_id),
        skill: mockSkills.find(sk => sk.id === s.skill_id),
      })) as Service[];
      return enrichedShared;
    }

    let filtered = [...mockServices];

    if (filters?.type) {
      filtered = filtered.filter(s => s.type === filters.type);
    }

    if (filters?.search) {
      const term = filters.search.toLowerCase();
      filtered = filtered.filter(s => 
        s.title.toLowerCase().includes(term) || 
        s.description.toLowerCase().includes(term)
      );
    }

    if (filters?.category) {
      const categorySkills = mockSkills.filter(s => s.category === filters.category);
      const skillIds = categorySkills.map(s => s.id);
      filtered = filtered.filter(s => skillIds.includes(s.skill_id));
    }

    // Enrich with provider and skill so UI can render footer and booking button
    const enriched = filtered.map(s => ({
      ...s,
      provider: s.provider || mockUsers.find(u => u.id === s.provider_id),
      skill: mockSkills.find(sk => sk.id === s.skill_id),
    })) as Service[];
    return enriched;
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

    const newService: Service = {
      ...service,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
      provider: providerObj,
      imageUrls,
    } as Service;

    // Persist in-memory and localStorage with provider snapshot
    mockServices.push(newService);
    saveToStorage('services', mockServices);

    // Persist to Firestore when available
    if (useFirebase) {
      try {
        await firebaseService.saveService(newService);
        console.log('🎉 Service successfully saved to Firestore:', newService.id);
      } catch (error) {
        console.error('Failed to save service to Firestore, saving to shared fallback:', error);
        const sharedFs = loadShared<Service>('services', mockServices.filter(s => !s.id.startsWith('test-')));
        sharedFs.push(newService);
        saveShared('services', sharedFs);
      }
    } else {
      const shared = loadShared<Service>('services', mockServices.filter(s => !s.id.startsWith('test-')));
      shared.push(newService);
      saveShared('services', shared);
    }

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
    return {
      ...updated,
      provider: mockUsers.find(u => u.id === updated.provider_id),
      skill: mockSkills.find(sk => sk.id === updated.skill_id),
    } as Service;
  },

  async deleteService(serviceId: string): Promise<void> {
    const idx = mockServices.findIndex(s => s.id === serviceId);
    if (idx !== -1) {
      mockServices.splice(idx, 1);
      saveToStorage('services', mockServices);
      if (useFirebase) {
        try {
          await deleteDoc(doc(db, 'services', serviceId));
        } catch (error) {
          console.error('Failed to delete service from Firestore:', error);
        }
      }
    }
  },

  async getBookings(userId: string): Promise<Booking[]> {
    // If Firebase available we would load shared bookings; otherwise, use shared localStorage fallback
    if (!useFirebase) {
      const sharedBookings = loadShared<Booking>('bookings', mockBookings);
      const bookings = sharedBookings.filter(booking => booking.provider_id === userId || booking.requester_id === userId);
      return bookings.map(b => ({
        ...b,
        provider: mockUsers.find(u => u.id === b.provider_id),
        requester: mockUsers.find(u => u.id === b.requester_id),
        service: mockServices.find(s => s.id === b.service_id),
      })) as Booking[];
    }

    const bookings = mockBookings.filter(booking => 
      booking.provider_id === userId || booking.requester_id === userId
    );
    // Enrich bookings with related entities
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

    // Persist in-memory and localStorage
    mockBookings.push(newBooking);
    saveToStorage('bookings', mockBookings);
    saveToStorage('time_credits', mockTimeCredits);
    // Try to persist to Firestore when available; on failure, persist to shared fallback
    if (useFirebase) {
      try {
        await saveToFirestore('bookings', newBooking.id, newBooking);
        if (requesterCredits) {
          await saveToFirestore('time_credits', booking.requester_id, requesterCredits);
        }
      } catch (error) {
        console.error('Failed to save booking to Firestore, falling back to shared storage:', error);
        const shared = loadShared<Booking>('bookings', mockBookings);
        shared.push(newBooking);
        saveShared('bookings', shared);
        saveShared('time_credits', mockTimeCredits);
      }
    } else {
      const shared = loadShared<Booking>('bookings', mockBookings);
      shared.push(newBooking);
      saveShared('bookings', shared);
      saveShared('time_credits', mockTimeCredits);
    }
    return {
      ...newBooking,
      provider: mockUsers.find(u => u.id === newBooking.provider_id),
      requester: mockUsers.find(u => u.id === newBooking.requester_id),
      service: mockServices.find(s => s.id === newBooking.service_id),
    } as Booking;
  },

  async updateBooking(bookingId: string, updates: Partial<Booking>): Promise<Booking> {
    const idx = mockBookings.findIndex(b => b.id === bookingId);
    if (idx === -1) throw new Error('Booking not found');
    const originalBooking = mockBookings[idx];
    const updated = { ...originalBooking, ...updates } as Booking;
    
    // If booking is being marked as completed, award credits to provider
    if (updates.status === 'completed' && originalBooking.status !== 'completed') {
      const providerCredits = mockTimeCredits.find(tc => tc.user_id === updated.provider_id);
      const service = mockServices.find(s => s.id === updated.service_id);
      const provider = mockUsers.find(u => u.id === updated.provider_id);
      
      if (providerCredits && service && updated.duration_hours && provider) {
        const baseCredits = updated.duration_hours * service.credits_per_hour;
        
        // Apply level bonus to earned credits
        const currentLevel = provider.level || 1;
        const earnedCredits = applyLevelBonus(baseCredits, currentLevel);
        
        providerCredits.balance += earnedCredits;
        providerCredits.total_earned += earnedCredits;
        providerCredits.updated_at = new Date().toISOString();
        
        // Update provider's level system
        const currentExperience = provider.experience_points || 0;
        const currentServicesCompleted = provider.services_completed || 0;
        const previousLevel = provider.level || 1;
        
        // Calculate experience reward (assuming 5-star rating for now, can be updated with actual rating later)
        const isFirstService = currentServicesCompleted === 0;
        const experienceGained = calculateServiceExperience(5, isFirstService, 1);
        
        // Update provider stats
        provider.experience_points = currentExperience + experienceGained;
        provider.services_completed = currentServicesCompleted + 1;
        provider.level = calculateLevel(provider.experience_points);
        
        // Check if level 5 reached for custom pricing
        if (provider.level >= 5 && !provider.custom_credits_enabled) {
          provider.custom_credits_enabled = true;
        }
        
        // Create transaction record with level bonus notation
        const transaction = {
          id: Date.now().toString(),
          from_user_id: updated.requester_id,
          to_user_id: updated.provider_id,
          booking_id: bookingId,
          amount: earnedCredits,
          transaction_type: 'service_completed' as const,
          description: `Payment for: ${service.title}${earnedCredits > baseCredits ? ` (Level ${currentLevel} Bonus: +${earnedCredits - baseCredits} credits)` : ''}`,
          created_at: new Date().toISOString(),
        };
        mockTransactions.push(transaction);
        
        // Create level-up notification transaction if level increased
        if (provider.level > previousLevel) {
          const levelUpTransaction = {
            id: (Date.now() + 1).toString(),
            to_user_id: updated.provider_id,
            amount: 0,
            transaction_type: 'adjustment' as const,
            description: `🎉 Level Up! You reached Level ${provider.level}! ${EXPERIENCE_REWARDS.SERVICE_COMPLETED} XP earned.`,
            created_at: new Date().toISOString(),
          };
          mockTransactions.push(levelUpTransaction);
        }
        
        saveToStorage('users', mockUsers);
      }
    }
    
    mockBookings[idx] = updated;
    saveToStorage('bookings', mockBookings);
    saveToStorage('time_credits', mockTimeCredits);
    saveToStorage('transactions', mockTransactions);
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

  async createReview(review: Omit<Review, 'id' | 'created_at'>): Promise<Review> {
    const newReview: Review = {
      ...review,
      id: Date.now().toString(),
      created_at: new Date().toISOString()
    };
    mockReviews.push(newReview);
    saveToStorage('reviews', mockReviews);
    return {
      ...newReview,
      reviewer: mockUsers.find(u => u.id === newReview.reviewer_id),
      reviewee: mockUsers.find(u => u.id === newReview.reviewee_id),
    } as Review;
  },

  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    console.log('updateUser called with userId:', userId, 'updates:', updates);
    
    const idx = mockUsers.findIndex(u => u.id === userId);
    if (idx === -1) {
      console.error('User not found in mockUsers:', userId);
      console.log('Available users:', mockUsers.map(u => ({ id: u.id, username: u.username })));
      throw new Error(`User not found: ${userId}`);
    }
    
    const updated = { ...mockUsers[idx], ...updates };
    mockUsers[idx] = updated;
    
    console.log('User updated successfully:', updated);
    
    // Save to localStorage
    saveToStorage('users', mockUsers);
    console.log('Saved to localStorage');
    
    // Also save to Firebase if available
    if (useFirebase) {
      try {
        await saveToFirestore('users', userId, updated);
        console.log('Saved to Firestore');
      } catch (error) {
        console.error('Failed to save user to Firebase:', error);
      }
    }
    
    return updated;
  },

  async confirmBooking(bookingId: string, providerId: string, notes?: string): Promise<Booking> {
    const idx = mockBookings.findIndex(b => b.id === bookingId);
    if (idx === -1) throw new Error('Booking not found');
    
    const booking = mockBookings[idx];
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

    return {
      ...updatedBooking,
      provider: mockUsers.find(u => u.id === updatedBooking.provider_id),
      requester: mockUsers.find(u => u.id === updatedBooking.requester_id),
      service: mockServices.find(s => s.id === updatedBooking.service_id),
    } as Booking;
  },

  async declineBooking(bookingId: string, providerId: string, reason?: string): Promise<Booking> {
    const idx = mockBookings.findIndex(b => b.id === bookingId);
    if (idx === -1) throw new Error('Booking not found');
    
    const booking = mockBookings[idx];
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
