import { User } from '../types';
import { firebaseService } from './firebaseService';
import { dataService } from './dataService';
import { isFirebaseConfigured } from '../firebase';

/**
 * XP and Level Management Service
 * Handles XP calculation, level progression, and user updates
 */

export interface XPGainResult {
  previousLevel: number;
  newLevel: number;
  xpGained: number;
  totalXP: number;
  leveledUp: boolean;
  nextLevelXP: number;
}

export class XPLevelService {
  // XP Constants
  static readonly XP_PER_SERVICE = 50;
  static readonly XP_PER_LEVEL = 100;
  
  /**
   * Calculate level from total XP
   */
  static calculateLevel(totalXP: number): number {
    return Math.floor(totalXP / this.XP_PER_LEVEL) + 1;
  }
  
  /**
   * Calculate XP needed for next level
   */
  static getXPForNextLevel(currentLevel: number): number {
    return currentLevel * this.XP_PER_LEVEL;
  }
  
  /**
   * Calculate XP progress within current level
   */
  static getXPProgress(totalXP: number): { current: number; needed: number; percentage: number } {
    const currentLevel = this.calculateLevel(totalXP);
    const xpForCurrentLevel = (currentLevel - 1) * this.XP_PER_LEVEL;
    const xpInCurrentLevel = totalXP - xpForCurrentLevel;
    const xpNeededForNext = this.XP_PER_LEVEL;
    
    return {
      current: xpInCurrentLevel,
      needed: xpNeededForNext,
      percentage: Math.round((xpInCurrentLevel / xpNeededForNext) * 100)
    };
  }
  
  /**
   * Award XP for completing a service and update user
   */
  static async awardServiceXP(userId: string, servicesCompleted: number): Promise<XPGainResult> {
    try {
      console.log('🎯 Awarding XP for user:', userId, 'Services completed:', servicesCompleted);
      
      // Calculate new XP and level
      const totalXP = servicesCompleted * this.XP_PER_SERVICE;
      const newLevel = this.calculateLevel(totalXP);
      
      // Get current user data
      const currentUser = await dataService.getUserById(userId);
      
      if (!currentUser) {
        throw new Error('User not found for XP award');
      }
      
      const previousLevel = currentUser.level || 1;
      const previousXP = currentUser.experience_points || 0;
      const xpGained = totalXP - previousXP;
      const leveledUp = newLevel > previousLevel;
      
      console.log('📊 XP Calculation:', {
        previousLevel,
        newLevel,
        previousXP,
        totalXP,
        xpGained,
        leveledUp
      });
      
      // Update user with new XP and level
      const updates: Partial<User> = {
        experience_points: totalXP,
        level: newLevel,
        services_completed: servicesCompleted
      };
      
      // Update user in database
      if (isFirebaseConfigured()) {
        await firebaseService.updateProfile(userId, updates);
      } else {
        await dataService.updateUser(userId, updates);
      }
      
      console.log('✅ XP awarded successfully:', updates);
      
      return {
        previousLevel,
        newLevel,
        xpGained,
        totalXP,
        leveledUp,
        nextLevelXP: this.getXPForNextLevel(newLevel)
      };
      
    } catch (error) {
      console.error('❌ Error awarding XP:', error);
      throw error;
    }
  }
  
  /**
   * Recalculate and sync user XP based on services completed
   */
  static async syncUserXP(userId: string): Promise<XPGainResult | null> {
    try {
      console.log('🔄 Syncing XP for user:', userId);
      
      // Get current user data
      const currentUser = await dataService.getUserById(userId);
      
      if (!currentUser) {
        console.error('❌ User not found for XP sync:', userId);
        return null;
      }
      
      const servicesCompleted = currentUser.services_completed || 0;
      
      // Award XP based on services completed
      return await this.awardServiceXP(userId, servicesCompleted);
      
    } catch (error) {
      console.error('❌ Error syncing user XP:', error);
      throw error;
    }
  }
  
  /**
   * Get user level information
   */
  static getUserLevelInfo(user: User): {
    level: number;
    totalXP: number;
    progress: { current: number; needed: number; percentage: number };
    nextLevelXP: number;
  } {
    const totalXP = user.experience_points || 0;
    const level = user.level || this.calculateLevel(totalXP);
    const progress = this.getXPProgress(totalXP);
    const nextLevelXP = this.getXPForNextLevel(level);
    
    return {
      level,
      totalXP,
      progress,
      nextLevelXP
    };
  }
}

export const xpLevelService = new XPLevelService();
