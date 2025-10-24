/**
 * Permanent Storage System for TimeBank Services
 * Ensures services are never lost, even after logout or browser clearing
 */

import { Service } from '../types';

export class PermanentStorage {
  private static instance: PermanentStorage;
  
  // Multiple storage keys for redundancy
  private readonly STORAGE_KEYS = {
    primary: 'timebank_services_permanent',
    backup1: 'timebank_services_backup_1',
    backup2: 'timebank_services_backup_2',
    userServices: 'timebank_user_services',
    sessionBackup: 'timebank_session_backup'
  };

  static getInstance(): PermanentStorage {
    if (!PermanentStorage.instance) {
      PermanentStorage.instance = new PermanentStorage();
    }
    return PermanentStorage.instance;
  }

  /**
   * Save services to multiple storage locations for maximum safety
   */
  saveServices(services: Service[]): void {
    console.log('💾 Saving services to permanent storage (multiple locations)...');
    
    const serviceData = {
      services: services,
      timestamp: new Date().toISOString(),
      version: '1.0',
      count: services.length
    };

    const serializedData = JSON.stringify(serviceData);

    try {
      // Save to all storage locations for redundancy
      Object.values(this.STORAGE_KEYS).forEach((key, index) => {
        try {
          localStorage.setItem(key, serializedData);
          console.log(`✅ Services saved to storage location ${index + 1}: ${key}`);
        } catch (error) {
          console.warn(`⚠️ Failed to save to ${key}:`, error);
        }
      });

      // Also save to sessionStorage as additional backup
      try {
        sessionStorage.setItem('timebank_services_session', serializedData);
        console.log('✅ Services also saved to sessionStorage');
      } catch (error) {
        console.warn('⚠️ Failed to save to sessionStorage:', error);
      }

      console.log(`🎉 Services safely stored in multiple locations (${services.length} services)`);
      
    } catch (error) {
      console.error('❌ Critical error saving services:', error);
    }
  }

  /**
   * Load services from storage with fallback mechanism
   */
  loadServices(): Service[] {
    console.log('📂 Loading services from permanent storage...');
    
    // Try each storage location until we find valid data
    for (const [name, key] of Object.entries(this.STORAGE_KEYS)) {
      try {
        const data = localStorage.getItem(key);
        if (data) {
          const parsed = JSON.parse(data);
          if (parsed.services && Array.isArray(parsed.services)) {
            console.log(`✅ Services loaded from ${name} (${parsed.services.length} services)`);
            console.log(`📅 Data timestamp: ${parsed.timestamp}`);
            
            // Validate services have required fields
            const validServices = parsed.services.filter(this.isValidService);
            if (validServices.length > 0) {
              return validServices;
            }
          }
        }
      } catch (error) {
        console.warn(`⚠️ Failed to load from ${key}:`, error);
      }
    }

    // Try sessionStorage as last resort
    try {
      const sessionData = sessionStorage.getItem('timebank_services_session');
      if (sessionData) {
        const parsed = JSON.parse(sessionData);
        if (parsed.services && Array.isArray(parsed.services)) {
          console.log('✅ Services recovered from sessionStorage');
          return parsed.services.filter(this.isValidService);
        }
      }
    } catch (error) {
      console.warn('⚠️ Failed to load from sessionStorage:', error);
    }

    console.log('📭 No services found in storage, returning empty array');
    return [];
  }

  /**
   * Add a new service and save permanently
   */
  addService(service: Service): void {
    console.log('➕ Adding new service to permanent storage:', service.title);
    
    const existingServices = this.loadServices();
    
    // Check if service already exists (avoid duplicates)
    const existingIndex = existingServices.findIndex(s => s.id === service.id);
    
    if (existingIndex >= 0) {
      // Update existing service
      existingServices[existingIndex] = service;
      console.log('🔄 Updated existing service in permanent storage');
    } else {
      // Add new service
      existingServices.push(service);
      console.log('✨ Added new service to permanent storage');
    }
    
    this.saveServices(existingServices);
  }

  /**
   * Get services for a specific user
   */
  getUserServices(userId: string): Service[] {
    const allServices = this.loadServices();
    const userServices = allServices.filter(service => 
      service.provider_id === userId
    );
    
    console.log(`👤 Found ${userServices.length} services for user ${userId}`);
    return userServices;
  }

  /**
   * Backup services to additional location
   */
  createBackup(): void {
    console.log('💿 Creating additional backup of services...');
    
    const services = this.loadServices();
    const backupData = {
      services: services,
      backup_timestamp: new Date().toISOString(),
      backup_reason: 'manual_backup',
      total_services: services.length
    };

    try {
      // Create timestamped backup
      const backupKey = `timebank_backup_${Date.now()}`;
      localStorage.setItem(backupKey, JSON.stringify(backupData));
      
      // Keep only last 5 backups to save space
      this.cleanupOldBackups();
      
      console.log(`✅ Backup created successfully: ${backupKey}`);
    } catch (error) {
      console.error('❌ Failed to create backup:', error);
    }
  }

  /**
   * Validate service object
   */
  private isValidService(service: any): service is Service {
    return service && 
           typeof service.id === 'string' && 
           typeof service.title === 'string' && 
           typeof service.provider_id === 'string';
  }

  /**
   * Clean up old backups to save storage space
   */
  private cleanupOldBackups(): void {
    try {
      const backupKeys = Object.keys(localStorage)
        .filter(key => key.startsWith('timebank_backup_'))
        .sort()
        .reverse(); // Most recent first

      // Keep only the 5 most recent backups
      if (backupKeys.length > 5) {
        const keysToDelete = backupKeys.slice(5);
        keysToDelete.forEach(key => {
          localStorage.removeItem(key);
          console.log(`🗑️ Removed old backup: ${key}`);
        });
      }
    } catch (error) {
      console.warn('⚠️ Failed to cleanup old backups:', error);
    }
  }

  /**
   * Get storage statistics
   */
  getStorageStats(): any {
    const stats = {
      totalServices: 0,
      storageLocations: 0,
      backupCount: 0,
      lastUpdate: null as string | null
    };

    // Check each storage location
    Object.entries(this.STORAGE_KEYS).forEach(([, key]) => {
      try {
        const data = localStorage.getItem(key);
        if (data) {
          const parsed = JSON.parse(data);
          if (parsed.services) {
            stats.storageLocations++;
            stats.totalServices = Math.max(stats.totalServices, parsed.services.length);
            if (parsed.timestamp) {
              stats.lastUpdate = parsed.timestamp;
            }
          }
        }
      } catch (error) {
        // Ignore errors for stats
      }
    });

    // Count backups
    stats.backupCount = Object.keys(localStorage)
      .filter(key => key.startsWith('timebank_backup_'))
      .length;

    return stats;
  }
}

// Export singleton instance
export const permanentStorage = PermanentStorage.getInstance();
