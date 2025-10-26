/**
 * Admin Analytics Service
 * Tracks user logins, active users, interactions, and platform metrics
 */

import { User, Service, Booking } from '../types';

interface LoginRecord {
  userId: string;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
}

interface UserActivity {
  userId: string;
  lastActive: string;
  loginCount: number;
  totalInteractions: number;
}

interface PlatformMetrics {
  totalUsers: number;
  activeUsers: number;
  totalServices: number;
  totalBookings: number;
  totalInteractions: number;
  averageRating: number;
  totalCreditsExchanged: number;
}

const STORAGE_KEY = 'timebank_admin_analytics';
const LOGIN_RECORDS_KEY = 'timebank_login_records';
const USER_ACTIVITY_KEY = 'timebank_user_activity';

export const adminAnalyticsService = {
  /**
   * Record a user login
   */
  recordLogin(userId: string): void {
    try {
      const records: LoginRecord[] = JSON.parse(
        localStorage.getItem(LOGIN_RECORDS_KEY) || '[]'
      );

      const newRecord: LoginRecord = {
        userId,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
      };

      records.push(newRecord);

      // Keep only last 10000 records to avoid storage issues
      if (records.length > 10000) {
        records.splice(0, records.length - 10000);
      }

      localStorage.setItem(LOGIN_RECORDS_KEY, JSON.stringify(records));
      console.log('✅ Login recorded for user:', userId);

      // Update user activity
      this.updateUserActivity(userId);
    } catch (error) {
      console.error('Failed to record login:', error);
    }
  },

  /**
   * Update user activity tracking
   */
  updateUserActivity(userId: string): void {
    try {
      const activities: Record<string, UserActivity> = JSON.parse(
        localStorage.getItem(USER_ACTIVITY_KEY) || '{}'
      );

      if (!activities[userId]) {
        activities[userId] = {
          userId,
          lastActive: new Date().toISOString(),
          loginCount: 0,
          totalInteractions: 0,
        };
      }

      activities[userId].lastActive = new Date().toISOString();
      activities[userId].loginCount += 1;
      activities[userId].totalInteractions += 1;

      localStorage.setItem(USER_ACTIVITY_KEY, JSON.stringify(activities));
    } catch (error) {
      console.error('Failed to update user activity:', error);
    }
  },

  /**
   * Record an interaction (service posted, booking made, etc.)
   */
  recordInteraction(userId: string, type: 'service_posted' | 'booking_made' | 'message_sent' | 'review_posted'): void {
    try {
      const activities: Record<string, UserActivity> = JSON.parse(
        localStorage.getItem(USER_ACTIVITY_KEY) || '{}'
      );

      if (!activities[userId]) {
        activities[userId] = {
          userId,
          lastActive: new Date().toISOString(),
          loginCount: 0,
          totalInteractions: 0,
        };
      }

      activities[userId].totalInteractions += 1;
      activities[userId].lastActive = new Date().toISOString();

      localStorage.setItem(USER_ACTIVITY_KEY, JSON.stringify(activities));
      console.log(`✅ Interaction recorded: ${type} by user ${userId}`);
    } catch (error) {
      console.error('Failed to record interaction:', error);
    }
  },

  /**
   * Get total login count
   */
  getTotalLogins(): number {
    try {
      const records: LoginRecord[] = JSON.parse(
        localStorage.getItem(LOGIN_RECORDS_KEY) || '[]'
      );
      return records.length;
    } catch (error) {
      console.error('Failed to get total logins:', error);
      return 0;
    }
  },

  /**
   * Get login count for a specific user
   */
  getUserLoginCount(userId: string): number {
    try {
      const records: LoginRecord[] = JSON.parse(
        localStorage.getItem(LOGIN_RECORDS_KEY) || '[]'
      );
      return records.filter(r => r.userId === userId).length;
    } catch (error) {
      console.error('Failed to get user login count:', error);
      return 0;
    }
  },

  /**
   * Get currently active users (logged in within last 30 minutes)
   */
  getActiveUsers(): number {
    try {
      const activities: Record<string, UserActivity> = JSON.parse(
        localStorage.getItem(USER_ACTIVITY_KEY) || '{}'
      );

      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

      let activeCount = 0;
      for (const userId in activities) {
        const lastActive = new Date(activities[userId].lastActive);
        if (lastActive > thirtyMinutesAgo) {
          activeCount++;
        }
      }

      return activeCount;
    } catch (error) {
      console.error('Failed to get active users:', error);
      return 0;
    }
  },

  /**
   * Get total interactions count
   */
  getTotalInteractions(): number {
    try {
      const activities: Record<string, UserActivity> = JSON.parse(
        localStorage.getItem(USER_ACTIVITY_KEY) || '{}'
      );

      let total = 0;
      for (const userId in activities) {
        total += activities[userId].totalInteractions;
      }

      return total;
    } catch (error) {
      console.error('Failed to get total interactions:', error);
      return 0;
    }
  },

  /**
   * Get user activity details
   */
  getUserActivityDetails(userId: string): UserActivity | null {
    try {
      const activities: Record<string, UserActivity> = JSON.parse(
        localStorage.getItem(USER_ACTIVITY_KEY) || '{}'
      );

      return activities[userId] || null;
    } catch (error) {
      console.error('Failed to get user activity details:', error);
      return null;
    }
  },

  /**
   * Get all user activities (for admin dashboard)
   */
  getAllUserActivities(): UserActivity[] {
    try {
      const activities: Record<string, UserActivity> = JSON.parse(
        localStorage.getItem(USER_ACTIVITY_KEY) || '{}'
      );

      return Object.values(activities).sort((a, b) => {
        return new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime();
      });
    } catch (error) {
      console.error('Failed to get all user activities:', error);
      return [];
    }
  },

  /**
   * Get login history (last N records)
   */
  getLoginHistory(limit: number = 100): LoginRecord[] {
    try {
      const records: LoginRecord[] = JSON.parse(
        localStorage.getItem(LOGIN_RECORDS_KEY) || '[]'
      );

      return records.slice(-limit).reverse();
    } catch (error) {
      console.error('Failed to get login history:', error);
      return [];
    }
  },

  /**
   * Get platform metrics
   */
  getPlatformMetrics(
    users: User[],
    services: Service[],
    bookings: Booking[]
  ): PlatformMetrics {
    try {
      const activeUsers = this.getActiveUsers();
      const totalInteractions = this.getTotalInteractions();

      // Calculate average rating
      const ratingsSum = services.reduce((sum, s) => sum + (s.rating || 0), 0);
      const averageRating = services.length > 0 ? ratingsSum / services.length : 0;

      // Calculate total credits exchanged (from completed bookings)
      const completedBookings = bookings.filter((b: any) => b.status === 'completed');
      const totalCreditsExchanged = completedBookings.reduce(
        (sum, b: any) => sum + (b.credits_spent || 0),
        0
      );

      return {
        totalUsers: users.length,
        activeUsers,
        totalServices: services.length,
        totalBookings: bookings.length,
        totalInteractions,
        averageRating: parseFloat(averageRating.toFixed(2)),
        totalCreditsExchanged,
      };
    } catch (error) {
      console.error('Failed to get platform metrics:', error);
      return {
        totalUsers: 0,
        activeUsers: 0,
        totalServices: 0,
        totalBookings: 0,
        totalInteractions: 0,
        averageRating: 0,
        totalCreditsExchanged: 0,
      };
    }
  },

  /**
   * Get login statistics
   */
  getLoginStatistics() {
    try {
      const records: LoginRecord[] = JSON.parse(
        localStorage.getItem(LOGIN_RECORDS_KEY) || '[]'
      );

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const thisWeekStart = new Date(today);
      thisWeekStart.setDate(today.getDate() - today.getDay());

      const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);

      const todayLogins = records.filter(
        r => new Date(r.timestamp) >= today
      ).length;

      const weekLogins = records.filter(
        r => new Date(r.timestamp) >= thisWeekStart
      ).length;

      const monthLogins = records.filter(
        r => new Date(r.timestamp) >= thisMonthStart
      ).length;

      const totalLogins = records.length;

      return {
        todayLogins,
        weekLogins,
        monthLogins,
        totalLogins,
        averageLoginsPerDay: totalLogins > 0 ? (totalLogins / 30).toFixed(2) : '0',
      };
    } catch (error) {
      console.error('Failed to get login statistics:', error);
      return {
        todayLogins: 0,
        weekLogins: 0,
        monthLogins: 0,
        totalLogins: 0,
        averageLoginsPerDay: '0',
      };
    }
  },

  /**
   * Clear all analytics data (use with caution)
   */
  clearAnalyticsData(): void {
    try {
      localStorage.removeItem(LOGIN_RECORDS_KEY);
      localStorage.removeItem(USER_ACTIVITY_KEY);
      console.log('✅ Analytics data cleared');
    } catch (error) {
      console.error('Failed to clear analytics data:', error);
    }
  },

  /**
   * Export analytics data as JSON
   */
  exportAnalyticsData() {
    try {
      const loginRecords = JSON.parse(
        localStorage.getItem(LOGIN_RECORDS_KEY) || '[]'
      );
      const userActivities = JSON.parse(
        localStorage.getItem(USER_ACTIVITY_KEY) || '{}'
      );

      return {
        exportDate: new Date().toISOString(),
        loginRecords,
        userActivities,
      };
    } catch (error) {
      console.error('Failed to export analytics data:', error);
      return null;
    }
  },
};
