/**
 * Startup Service - Initializes permanent storage and loads services on app start
 * Ensures services are never lost and always available
 */

import { permanentStorage } from './permanentStorage';

export class StartupService {
  private static initialized = false;

  /**
   * Initialize the app with permanent storage
   */
  static async initialize(): Promise<void> {
    if (this.initialized) {
      console.log('⚡ Startup service already initialized');
      return;
    }

    console.log('🚀 Initializing TimeBank with permanent storage...');

    try {
      // Load services from permanent storage
      const services = permanentStorage.loadServices();
      console.log(`🔒 Loaded ${services.length} services from permanent storage`);

      // Get storage statistics
      const stats = permanentStorage.getStorageStats();
      console.log('📊 Storage Statistics:', stats);

      // Create initial backup if services exist
      if (services.length > 0) {
        permanentStorage.createBackup();
        console.log('💿 Initial backup created');
      }

      // Sync with regular localStorage
      this.syncWithLocalStorage(services);

      this.initialized = true;
      console.log('✅ TimeBank startup complete - services are permanently stored');

    } catch (error) {
      console.error('❌ Failed to initialize startup service:', error);
    }
  }

  /**
   * Sync permanent storage with regular localStorage
   */
  private static syncWithLocalStorage(permanentServices: any[]): void {
    try {
      // Get services from regular localStorage
      const localStorageData = localStorage.getItem('timebank_services');
      let localServices: any[] = [];
      
      if (localStorageData) {
        localServices = JSON.parse(localStorageData);
      }

      // Merge services (permanent storage takes priority)
      const serviceMap = new Map();
      
      // Add local services first
      localServices.forEach(service => serviceMap.set(service.id, service));
      
      // Add/override with permanent services
      permanentServices.forEach(service => serviceMap.set(service.id, service));
      
      const mergedServices = Array.from(serviceMap.values());

      // Update regular localStorage with merged data
      localStorage.setItem('timebank_services', JSON.stringify(mergedServices));
      
      // Update permanent storage with any new services from localStorage
      permanentStorage.saveServices(mergedServices);

      console.log(`🔄 Synced ${mergedServices.length} services between storage systems`);

    } catch (error) {
      console.warn('⚠️ Failed to sync storage systems:', error);
    }
  }

  /**
   * Save a service to permanent storage
   */
  static saveServicePermanently(service: any): void {
    try {
      permanentStorage.addService(service);
      console.log('🔒 Service saved permanently:', service.title);
    } catch (error) {
      console.error('❌ Failed to save service permanently:', error);
    }
  }

  /**
   * Get services for current user
   */
  static getUserServices(userId: string): any[] {
    try {
      return permanentStorage.getUserServices(userId);
    } catch (error) {
      console.error('❌ Failed to get user services:', error);
      return [];
    }
  }

  /**
   * Create a manual backup
   */
  static createBackup(): void {
    try {
      permanentStorage.createBackup();
      console.log('💿 Manual backup created successfully');
    } catch (error) {
      console.error('❌ Failed to create backup:', error);
    }
  }

  /**
   * Get storage health information
   */
  static getStorageHealth(): any {
    try {
      const stats = permanentStorage.getStorageStats();
      return {
        ...stats,
        healthy: stats.storageLocations >= 3, // At least 3 storage locations
        lastBackup: this.getLastBackupTime()
      };
    } catch (error) {
      console.error('❌ Failed to get storage health:', error);
      return { healthy: false, error: (error as any).message || 'Unknown error' };
    }
  }

  /**
   * Get last backup timestamp
   */
  private static getLastBackupTime(): string | null {
    try {
      const backupKeys = Object.keys(localStorage)
        .filter(key => key.startsWith('timebank_backup_'))
        .sort()
        .reverse();

      if (backupKeys.length > 0) {
        const latestBackup = localStorage.getItem(backupKeys[0]);
        if (latestBackup) {
          const parsed = JSON.parse(latestBackup);
          return parsed.backup_timestamp || null;
        }
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Emergency recovery - restore from any available backup
   */
  static emergencyRecover(): boolean {
    console.log('🚨 Emergency recovery initiated...');
    
    try {
      // Try to load from permanent storage
      const services = permanentStorage.loadServices();
      if (services.length > 0) {
        console.log(`✅ Recovered ${services.length} services from permanent storage`);
        return true;
      }

      // Try to load from backups
      const backupKeys = Object.keys(localStorage)
        .filter(key => key.startsWith('timebank_backup_'))
        .sort()
        .reverse();

      for (const key of backupKeys) {
        try {
          const backup = localStorage.getItem(key);
          if (backup) {
            const parsed = JSON.parse(backup);
            if (parsed.services && parsed.services.length > 0) {
              permanentStorage.saveServices(parsed.services);
              console.log(`✅ Recovered ${parsed.services.length} services from backup: ${key}`);
              return true;
            }
          }
        } catch (error) {
          console.warn(`⚠️ Failed to recover from backup ${key}:`, error);
        }
      }

      console.log('❌ No recoverable data found');
      return false;

    } catch (error) {
      console.error('❌ Emergency recovery failed:', error);
      return false;
    }
  }
}

// Auto-initialize on import
StartupService.initialize();
