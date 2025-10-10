import { User, Skill, Service, TimeCredit, Booking, Transaction, Review, UserSkill } from '../types';
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

// Load data from localStorage or use initial data
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

// Initialize persistent arrays
let mockUsers = loadFromStorage('users', initialMockUsers);
let mockServices = loadFromStorage('services', initialMockServices);
let mockBookings = loadFromStorage('bookings', initialMockBookings);
let mockTransactions = loadFromStorage('transactions', initialMockTransactions);
let mockReviews = loadFromStorage('reviews', initialMockReviews);
let mockTimeCredits = loadFromStorage('time_credits', initialMockTimeCredits);
let mockUserSkills = loadFromStorage('user_skills', initialMockUserSkills);

export const dataService = {
  async getUserById(userId: string): Promise<User | null> {
    return mockUsers.find(user => user.id === userId) || null;
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
      provider: mockUsers.find(u => u.id === s.provider_id),
      skill: mockSkills.find(sk => sk.id === s.skill_id),
    })) as Service[];
    return enriched;
  },

  async getUserServices(userId: string): Promise<Service[]> {
    const services = mockServices.filter(service => service.provider_id === userId);
    return services.map(s => ({
      ...s,
      provider: mockUsers.find(u => u.id === s.provider_id),
      skill: mockSkills.find(sk => sk.id === s.skill_id),
    })) as Service[];
  },

  async createService(service: Omit<Service, 'id' | 'created_at'>): Promise<Service> {
    const newService: Service = {
      ...service,
      id: Date.now().toString(),
      created_at: new Date().toISOString()
    };
    // Persist in-memory and localStorage
    mockServices.push(newService);
    saveToStorage('services', mockServices);
    // Return enriched
    return {
      ...newService,
      provider: mockUsers.find(u => u.id === newService.provider_id),
      skill: mockSkills.find(sk => sk.id === newService.skill_id),
    } as Service;
  },

  async updateService(serviceId: string, updates: Partial<Service>): Promise<Service> {
    const idx = mockServices.findIndex(s => s.id === serviceId);
    if (idx === -1) throw new Error('Service not found');
    const updated = { ...mockServices[idx], ...updates } as Service;
    mockServices[idx] = updated;
    saveToStorage('services', mockServices);
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
    }
  },

  async getBookings(userId: string): Promise<Booking[]> {
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
      
      // Deduct credits immediately upon booking
      requesterCredits.balance -= requiredCredits;
      requesterCredits.total_spent += requiredCredits;
      requesterCredits.updated_at = new Date().toISOString();
    }

    // Persist in-memory and localStorage
    mockBookings.push(newBooking);
    saveToStorage('bookings', mockBookings);
    saveToStorage('time_credits', mockTimeCredits);
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
      
      if (providerCredits && service && updated.duration_hours) {
        const earnedCredits = updated.duration_hours * service.credits_per_hour;
        providerCredits.balance += earnedCredits;
        providerCredits.total_earned += earnedCredits;
        providerCredits.updated_at = new Date().toISOString();
        
        // Create transaction record
        const transaction = {
          id: Date.now().toString(),
          from_user_id: updated.requester_id,
          to_user_id: updated.provider_id,
          booking_id: bookingId,
          amount: earnedCredits,
          transaction_type: 'service_completed' as const,
          description: `Payment for: ${service.title}`,
          created_at: new Date().toISOString(),
        };
        mockTransactions.push(transaction);
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
    const idx = mockUsers.findIndex(u => u.id === userId);
    if (idx === -1) throw new Error('User not found');
    const updated = { ...mockUsers[idx], ...updates };
    mockUsers[idx] = updated;
    saveToStorage('users', mockUsers);
    return updated;
  },
};
