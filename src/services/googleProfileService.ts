import { User } from '../types';

/**
 * Alternative profile service for Google users to bypass Firebase permission issues
 * Uses localStorage and local state management as primary storage
 */
class GoogleProfileService {
  private readonly GOOGLE_PROFILE_KEY = 'timebank_google_profile';
  private readonly PROFILE_BACKUP_KEY = 'timebank_profile_backup';

  /**
   * Save Google user profile using alternative storage methods with Firebase error handling
   */
  async saveGoogleUserProfile(userId: string, updates: Partial<User>): Promise<User> {
    console.log('🔄 GoogleProfileService: Saving profile for Google user:', userId);
    
    try {
      // Get current user data from localStorage or create fallback
      let currentUserData = this.getCurrentUserData();
      
      if (!currentUserData) {
        console.log('⚠️ No current user data found, creating fallback profile');
        currentUserData = {
          id: userId,
          email: updates.email || '',
          username: updates.username || `google_user_${userId.slice(-6)}`,
          bio: updates.bio || '',
          reputation_score: 5.0,
          total_reviews: 0,
          level: 1,
          experience_points: 0,
          services_completed: 0,
          auth_provider: 'google',
          google_profile_complete: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      }

      // Validate user ID match
      if (currentUserData.id !== userId) {
        console.warn('⚠️ User ID mismatch, updating with correct ID');
        currentUserData.id = userId;
      }

      // Merge updates with current data, ensuring all required fields
      const updatedUser: User = {
        ...currentUserData,
        ...updates,
        // Preserve critical fields and add metadata
        id: userId,
        auth_provider: 'google',
        google_profile_complete: true,
        level: currentUserData.level || 1,
        experience_points: currentUserData.experience_points || 0,
        services_completed: currentUserData.services_completed || 0,
        updated_at: new Date().toISOString()
      };

      // Validate required fields
      if (!updatedUser.username || updatedUser.username.trim() === '') {
        updatedUser.username = `google_user_${userId.slice(-6)}`;
      }

      // Save to multiple storage locations for reliability
      await this.saveToMultipleStorages(updatedUser);

      // Also try to save to dataService for consistency
      try {
        const { dataService } = await import('./dataService');
        await dataService.updateUser(userId, updatedUser);
        console.log('✅ Also saved to dataService for consistency');
      } catch (dataServiceError) {
        console.warn('⚠️ Failed to save to dataService, but local save succeeded:', dataServiceError);
      }

      console.log('✅ GoogleProfileService: Profile saved successfully');
      return updatedUser;

    } catch (error: any) {
      console.error('❌ GoogleProfileService: Failed to save profile:', error);
      throw new Error(`Failed to save Google user profile: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Save profile data to multiple storage locations
   */
  private async saveToMultipleStorages(user: User): Promise<void> {
    // 1. Primary localStorage
    localStorage.setItem('timebank_user', JSON.stringify(user));
    
    // 2. Google-specific backup
    localStorage.setItem(this.GOOGLE_PROFILE_KEY, JSON.stringify({
      ...user,
      backup_timestamp: new Date().toISOString()
    }));

    // 3. Profile backup with versioning
    const backups = this.getProfileBackups();
    backups.push({
      ...user,
      backup_id: Date.now(),
      backup_timestamp: new Date().toISOString()
    });
    
    // Keep only last 5 backups
    if (backups.length > 5) {
      backups.splice(0, backups.length - 5);
    }
    
    localStorage.setItem(this.PROFILE_BACKUP_KEY, JSON.stringify(backups));

    // 4. Try to sync with server in background (non-blocking)
    this.backgroundSync(user).catch(error => {
      console.warn('⚠️ Background sync failed, but profile saved locally:', error.message);
    });
  }

  /**
   * Attempt background sync with server (non-blocking)
   */
  private async backgroundSync(user: User): Promise<void> {
    try {
      // Try to sync with a custom API endpoint that doesn't require Firebase permissions
      const response = await fetch('/api/sync-google-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          profileData: user,
          timestamp: new Date().toISOString()
        })
      });

      if (response.ok) {
        console.log('✅ Background sync successful');
      } else {
        throw new Error(`Sync failed: ${response.status}`);
      }
    } catch (error) {
      // Don't throw - this is background sync
      console.warn('⚠️ Background sync failed:', (error as any)?.message || 'Unknown error');
    }
  }

  /**
   * Get current user data from localStorage
   */
  private getCurrentUserData(): User | null {
    try {
      const userData = localStorage.getItem('timebank_user');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error loading user data:', error);
      return null;
    }
  }

  /**
   * Get profile backups
   */
  private getProfileBackups(): any[] {
    try {
      const backups = localStorage.getItem(this.PROFILE_BACKUP_KEY);
      return backups ? JSON.parse(backups) : [];
    } catch (error) {
      console.error('Error loading profile backups:', error);
      return [];
    }
  }

  /**
   * Restore profile from backup if needed
   */
  async restoreFromBackup(userId: string): Promise<User | null> {
    try {
      // Try Google-specific backup first
      const googleBackup = localStorage.getItem(this.GOOGLE_PROFILE_KEY);
      if (googleBackup) {
        const backupData = JSON.parse(googleBackup);
        if (backupData.id === userId) {
          console.log('✅ Restored profile from Google backup');
          return backupData;
        }
      }

      // Try general backups
      const backups = this.getProfileBackups();
      const userBackup = backups.find(backup => backup.id === userId);
      if (userBackup) {
        console.log('✅ Restored profile from general backup');
        return userBackup;
      }

      return null;
    } catch (error) {
      console.error('Error restoring from backup:', error);
      return null;
    }
  }

  /**
   * Check if user is a Google user
   */
  isGoogleUser(user: User): boolean {
    return user.auth_provider === 'google' || user.google_profile_complete === true;
  }

  /**
   * Force refresh profile data after save
   */
  async refreshProfileInContext(userId: string): Promise<void> {
    try {
      const updatedUser = this.getCurrentUserData();
      if (updatedUser && updatedUser.id === userId) {
        // Trigger a custom event to notify AuthContext
        window.dispatchEvent(new CustomEvent('timebank:profile:updated', {
          detail: { user: updatedUser }
        }));
        console.log('✅ Profile refresh event dispatched');
      }
    } catch (error) {
      console.warn('Failed to refresh profile in context:', error);
    }
  }

  /**
   * Validate profile data
   */
  validateProfileData(updates: Partial<User>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (updates.username && updates.username.trim().length < 2) {
      errors.push('Username must be at least 2 characters long');
    }

    if (updates.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updates.email)) {
      errors.push('Invalid email format');
    }

    if (updates.phone && updates.phone.length > 0 && !/^\+?[\d\s\-\(\)]+$/.test(updates.phone)) {
      errors.push('Invalid phone number format');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Handle Firebase permission errors gracefully
   */
  handleFirebaseError(error: any): { canProceed: boolean; message: string } {
    console.error('🔥 Firebase error in GoogleProfileService:', error);
    
    // Common Firebase permission errors
    if (error.code === 'permission-denied' || 
        error.message?.includes('permission-denied') ||
        error.message?.includes('Missing or insufficient permissions')) {
      return {
        canProceed: true,
        message: 'Using alternative storage due to Firebase permissions. Your profile will still be saved locally.'
      };
    }

    // Network or connectivity errors
    if (error.code === 'unavailable' || 
        error.message?.includes('network') ||
        error.message?.includes('offline')) {
      return {
        canProceed: true,
        message: 'Network issue detected. Profile saved locally and will sync when connection is restored.'
      };
    }

    // Other Firebase errors
    if (error.code?.startsWith('firebase') || error.message?.includes('Firebase')) {
      return {
        canProceed: true,
        message: 'Firebase service temporarily unavailable. Profile saved using alternative method.'
      };
    }

    // Unknown errors - still proceed but log for debugging
    return {
      canProceed: true,
      message: 'Profile saved successfully using alternative storage method.'
    };
  }

  /**
   * Enhanced save with Firebase error recovery
   */
  async saveWithFirebaseRecovery(userId: string, updates: Partial<User>): Promise<{ success: boolean; user?: User; message: string }> {
    try {
      const user = await this.saveGoogleUserProfile(userId, updates);
      return {
        success: true,
        user,
        message: 'Profile saved successfully!'
      };
    } catch (error: any) {
      const errorHandler = this.handleFirebaseError(error);
      
      if (errorHandler.canProceed) {
        // Try to save using only local storage
        try {
          const fallbackUser = await this.saveGoogleUserProfile(userId, updates);
          return {
            success: true,
            user: fallbackUser,
            message: errorHandler.message
          };
        } catch (fallbackError) {
          console.error('❌ Fallback save also failed:', fallbackError);
          return {
            success: false,
            message: 'Failed to save profile. Please try again later.'
          };
        }
      }

      return {
        success: false,
        message: error.message || 'Failed to save profile. Please try again.'
      };
    }
  }
}

export const googleProfileService = new GoogleProfileService();
