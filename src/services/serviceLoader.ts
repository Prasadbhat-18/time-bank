import { Service } from '../types';
import { mockServices, mockUsers, mockSkills } from './mockData';
import { permanentStorage } from './permanentStorage';

/**
 * Fast, reliable service loader that works instantly
 * Bypasses complex Firebase logic for immediate loading
 */
export class ServiceLoader {
  private static instance: ServiceLoader;
  private cachedServices: Service[] | null = null;
  private cacheTime: number = 0;
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours - services should persist

  static getInstance(): ServiceLoader {
    if (!ServiceLoader.instance) {
      ServiceLoader.instance = new ServiceLoader();
    }
    return ServiceLoader.instance;
  }

  /**
   * Get services instantly with caching
   */
  async getServices(filters?: { category?: string; type?: string; search?: string }): Promise<Service[]> {
    console.log('🚀 ServiceLoader: Loading services instantly from local storage');
    
    // Check cache first for instant loading
    if (this.cachedServices && (Date.now() - this.cacheTime) < this.CACHE_DURATION) {
      console.log('⚡ Using cached services for instant load');
      return this.applyFilters(this.cachedServices, filters);
    }

    // Load services from permanent storage (survives logout) + localStorage + mock
    let allServices = [...mockServices];
    
    // First, load from permanent storage (most reliable)
    try {
      const permanentServices = permanentStorage.loadServices();
      if (permanentServices.length > 0) {
        console.log(`🔒 Loaded ${permanentServices.length} services from permanent storage`);
        
        // Merge with mock services, prioritizing permanent storage
        const serviceMap = new Map();
        
        // Add mock services first
        mockServices.forEach(service => serviceMap.set(service.id, service));
        
        // Add/override with permanent services (includes uploaded ones)
        permanentServices.forEach(service => serviceMap.set(service.id, service));
        
        allServices = Array.from(serviceMap.values());
      }
    } catch (error) {
      console.warn('⚠️ Failed to load from permanent storage:', error);
    }
    
    // Also check regular localStorage as fallback
    try {
      const storedServices = localStorage.getItem('timebank_services');
      if (storedServices) {
        const parsedServices = JSON.parse(storedServices);
        if (Array.isArray(parsedServices)) {
          // Merge any additional services from regular localStorage
          const serviceMap = new Map();
          allServices.forEach(service => serviceMap.set(service.id, service));
          parsedServices.forEach(service => serviceMap.set(service.id, service));
          allServices = Array.from(serviceMap.values());
          console.log(`📦 Also loaded services from localStorage, ${allServices.length} total`);
        }
      }
    } catch (error) {
      console.warn('⚠️ Failed to load from localStorage:', error);
    }

    // Load and enrich services
    const enrichedServices = this.enrichServices(allServices);
    
    // Cache for next time
    this.cachedServices = enrichedServices;
    this.cacheTime = Date.now();
    
    console.log(`✅ Services loaded instantly (${enrichedServices.length} services)`);
    return this.applyFilters(enrichedServices, filters);
  }

  /**
   * Enrich services with provider and skill data
   */
  private enrichServices(services: Service[]): Service[] {
    return services.map(service => {
      // Try to find provider in mockUsers first
      let provider = mockUsers.find(user => user.id === service.provider_id);
      
      // If not found in mockUsers, try to load from localStorage
      if (!provider) {
        try {
          const storedUsers = localStorage.getItem('timebank_users');
          if (storedUsers) {
            const users = JSON.parse(storedUsers);
            provider = users.find((u: any) => u.id === service.provider_id);
          }
        } catch (error) {
          console.warn('Failed to load provider from localStorage:', error);
        }
      }
      
      // Use service.provider as fallback if available
      if (!provider && service.provider) {
        provider = service.provider;
      }
      
      return {
        ...service,
        provider: provider || { id: service.provider_id, username: service.provider_id },
        skill: mockSkills.find(skill => skill.id === service.skill_id)
      };
    }) as Service[];
  }

  /**
   * Apply filters to services
   */
  private applyFilters(services: Service[], filters?: { category?: string; type?: string; search?: string }): Service[] {
    let filtered = [...services];

    if (filters?.type) {
      filtered = filtered.filter(s => s.type === filters.type);
    }

    if (filters?.search) {
      const term = filters.search.toLowerCase();
      filtered = filtered.filter(s =>
        s.title?.toLowerCase().includes(term) ||
        s.description?.toLowerCase().includes(term) ||
        s.provider?.username?.toLowerCase().includes(term)
      );
    }

    if (filters?.category) {
      const categorySkills = mockSkills.filter(sk => sk.category === filters.category);
      const skillIds = categorySkills.map(sk => sk.id);
      filtered = filtered.filter(s => skillIds.includes(s.skill_id));
    }

    return filtered;
  }

  /**
   * Clear cache to force refresh
   */
  clearCache(): void {
    this.cachedServices = null;
    this.cacheTime = 0;
    console.log('🗑️ Service cache cleared');
  }

  /**
   * Preload services for even faster access
   */
  async preloadServices(): Promise<void> {
    await this.getServices();
    console.log('🔄 Services preloaded for instant access');
  }
}

// Export singleton instance
export const serviceLoader = ServiceLoader.getInstance();
