import {
  User,
  Skill,
  Service,
  TimeCredit,
  Booking,
  Transaction,
  Review,
  UserSkill,
} from '../types';
import {
  mockUsers,
  mockSkills,
  mockServices,
  mockTimeCredits,
  mockBookings,
  mockTransactions,
  mockReviews,
  mockUserSkills,
} from './mockData';

class DataService {
  private users: User[] = [...mockUsers];
  private skills: Skill[] = [...mockSkills];
  private services: Service[] = [...mockServices];
  private timeCredits: TimeCredit[] = [...mockTimeCredits];
  private bookings: Booking[] = [...mockBookings];
  private transactions: Transaction[] = [...mockTransactions];
  private reviews: Review[] = [...mockReviews];
  private userSkills: UserSkill[] = [...mockUserSkills];

  async login(email: string, password: string): Promise<User | null> {
    await this.delay();
    const user = this.users.find((u) => u.email === email);
    return user || null;
  }

  async register(email: string, password: string, username: string): Promise<User> {
    await this.delay();

    const newUser: User = {
      id: `user-${Date.now()}`,
      email,
      username,
      bio: '',
      reputation_score: 5.0,
      total_reviews: 0,
      created_at: new Date().toISOString(),
    };

    this.users.push(newUser);

    const newCredit: TimeCredit = {
      id: `tc-${Date.now()}`,
      user_id: newUser.id,
      balance: 10.0,
      total_earned: 10.0,
      total_spent: 0,
      updated_at: new Date().toISOString(),
    };
    this.timeCredits.push(newCredit);

    const transaction: Transaction = {
      id: `t-${Date.now()}`,
      to_user_id: newUser.id,
      amount: 10.0,
      transaction_type: 'signup_bonus',
      description: 'Welcome bonus for joining TimeBank',
      created_at: new Date().toISOString(),
    };
    this.transactions.push(transaction);

    return newUser;
  }

  async getCurrentUser(userId: string): Promise<User | null> {
    await this.delay();
    return this.users.find((u) => u.id === userId) || null;
  }

  async updateProfile(userId: string, updates: Partial<User>): Promise<User> {
    await this.delay();
    const index = this.users.findIndex((u) => u.id === userId);
    if (index !== -1) {
      this.users[index] = { ...this.users[index], ...updates };
      return this.users[index];
    }
    throw new Error('User not found');
  }

  async getUserById(userId: string): Promise<User | null> {
    await this.delay();
    return this.users.find((u) => u.id === userId) || null;
  }

  async getTimeCredits(userId: string): Promise<TimeCredit | null> {
    await this.delay();
    return this.timeCredits.find((tc) => tc.user_id === userId) || null;
  }

  async getTransactions(userId: string): Promise<Transaction[]> {
    await this.delay();
    const userTransactions = this.transactions
      .filter((t) => t.from_user_id === userId || t.to_user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return userTransactions.map((t) => ({
      ...t,
      from_user: t.from_user_id ? this.users.find((u) => u.id === t.from_user_id) : undefined,
      to_user: t.to_user_id ? this.users.find((u) => u.id === t.to_user_id) : undefined,
    }));
  }

  async getSkills(): Promise<Skill[]> {
    await this.delay();
    return [...this.skills];
  }

  async getUserSkills(userId: string): Promise<UserSkill[]> {
    await this.delay();
    return this.userSkills
      .filter((us) => us.user_id === userId)
      .map((us) => ({
        ...us,
        skill: this.skills.find((s) => s.id === us.skill_id),
      }));
  }

  async addUserSkill(userId: string, skillId: string, type: 'offered' | 'needed', proficiencyLevel: string): Promise<UserSkill> {
    await this.delay();
    const newUserSkill: UserSkill = {
      id: `us-${Date.now()}`,
      user_id: userId,
      skill_id: skillId,
      type,
      proficiency_level: proficiencyLevel as 'beginner' | 'intermediate' | 'expert',
    };
    this.userSkills.push(newUserSkill);
    return newUserSkill;
  }

  async removeUserSkill(userSkillId: string): Promise<void> {
    await this.delay();
    this.userSkills = this.userSkills.filter((us) => us.id !== userSkillId);
  }

  async getServices(filters?: { category?: string; type?: string; search?: string }): Promise<Service[]> {
    await this.delay();
    let filteredServices = this.services.filter((s) => s.status === 'active');

    if (filters?.type) {
      filteredServices = filteredServices.filter((s) => s.type === filters.type);
    }

    if (filters?.search) {
      const search = filters.search.toLowerCase();
      filteredServices = filteredServices.filter(
        (s) =>
          s.title.toLowerCase().includes(search) ||
          s.description.toLowerCase().includes(search)
      );
    }

    if (filters?.category) {
      filteredServices = filteredServices.filter((s) => {
        const skill = this.skills.find((sk) => sk.id === s.skill_id);
        return skill?.category === filters.category;
      });
    }

    return filteredServices
      .map((s) => ({
        ...s,
        provider: this.users.find((u) => u.id === s.provider_id),
        skill: this.skills.find((sk) => sk.id === s.skill_id),
      }))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  async getUserServices(userId: string): Promise<Service[]> {
    await this.delay();
    return this.services
      .filter((s) => s.provider_id === userId)
      .map((s) => ({
        ...s,
        skill: this.skills.find((sk) => sk.id === s.skill_id),
      }))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  async createService(service: Omit<Service, 'id' | 'created_at'>): Promise<Service> {
    await this.delay();
    const newService: Service = {
      ...service,
      id: `s-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    this.services.push(newService);
    return newService;
  }

  async updateService(serviceId: string, updates: Partial<Service>): Promise<Service> {
    await this.delay();
    const index = this.services.findIndex((s) => s.id === serviceId);
    if (index !== -1) {
      this.services[index] = { ...this.services[index], ...updates };
      return this.services[index];
    }
    throw new Error('Service not found');
  }

  async deleteService(serviceId: string): Promise<void> {
    await this.delay();
    this.services = this.services.filter((s) => s.id !== serviceId);
  }

  async getBookings(userId: string): Promise<Booking[]> {
    await this.delay();
    return this.bookings
      .filter((b) => b.provider_id === userId || b.requester_id === userId)
      .map((b) => ({
        ...b,
        provider: this.users.find((u) => u.id === b.provider_id),
        requester: this.users.find((u) => u.id === b.requester_id),
        service: this.services.find((s) => s.id === b.service_id),
      }))
      .sort((a, b) => new Date(b.scheduled_start).getTime() - new Date(a.scheduled_start).getTime());
  }

  async createBooking(booking: Omit<Booking, 'id' | 'created_at' | 'status'>): Promise<Booking> {
    await this.delay();
    const newBooking: Booking = {
      ...booking,
      id: `b-${Date.now()}`,
      status: 'pending',
      created_at: new Date().toISOString(),
    };
    this.bookings.push(newBooking);
    return newBooking;
  }

  async updateBooking(bookingId: string, updates: Partial<Booking>): Promise<Booking> {
    await this.delay();
    const index = this.bookings.findIndex((b) => b.id === bookingId);
    if (index !== -1) {
      this.bookings[index] = { ...this.bookings[index], ...updates };

      if (updates.status === 'completed') {
        const booking = this.bookings[index];
        const providerCredits = this.timeCredits.find((tc) => tc.user_id === booking.provider_id);
        const requesterCredits = this.timeCredits.find((tc) => tc.user_id === booking.requester_id);

        if (providerCredits && requesterCredits) {
          providerCredits.balance += booking.duration_hours;
          providerCredits.total_earned += booking.duration_hours;
          requesterCredits.balance -= booking.duration_hours;
          requesterCredits.total_spent += booking.duration_hours;

          const transaction: Transaction = {
            id: `t-${Date.now()}`,
            from_user_id: booking.requester_id,
            to_user_id: booking.provider_id,
            booking_id: booking.id,
            amount: booking.duration_hours,
            transaction_type: 'service_completed',
            description: `Payment for ${this.services.find((s) => s.id === booking.service_id)?.title || 'service'}`,
            created_at: new Date().toISOString(),
          };
          this.transactions.push(transaction);
        }
      }

      return this.bookings[index];
    }
    throw new Error('Booking not found');
  }

  async getReviews(userId: string): Promise<Review[]> {
    await this.delay();
    return this.reviews
      .filter((r) => r.reviewee_id === userId)
      .map((r) => ({
        ...r,
        reviewer: this.users.find((u) => u.id === r.reviewer_id),
      }))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  async createReview(review: Omit<Review, 'id' | 'created_at'>): Promise<Review> {
    await this.delay();
    const newReview: Review = {
      ...review,
      id: `r-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    this.reviews.push(newReview);

    const userReviews = this.reviews.filter((r) => r.reviewee_id === review.reviewee_id);
    const avgRating = userReviews.reduce((acc, r) => acc + r.rating, 0) / userReviews.length;

    const userIndex = this.users.findIndex((u) => u.id === review.reviewee_id);
    if (userIndex !== -1) {
      this.users[userIndex].reputation_score = Number(avgRating.toFixed(1));
      this.users[userIndex].total_reviews = userReviews.length;
    }

    return newReview;
  }

  private delay(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 300));
  }
}

export const dataService = new DataService();