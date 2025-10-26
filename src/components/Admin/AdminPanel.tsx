import React, { useEffect, useState } from 'react';
import { dataService } from '../../services/dataService';
import { useAuth } from '../../contexts/AuthContext';
import { adminAnalyticsService } from '../../services/adminAnalyticsService';
import { User } from '../../types';
import { Shield, Users, Briefcase, Calendar, Trash2, Ban, CheckCircle, RefreshCw, AlertTriangle, Crown, TrendingUp, Activity, LogIn, MessageSquare } from 'lucide-react';

export const AdminPanel: React.FC = () => {
  const { user } = useAuth();
  const [services, setServices] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState('');
  const [blockingUser, setBlockingUser] = useState<string | null>(null);
  const [blockReason, setBlockReason] = useState('');
  const [deletingService, setDeletingService] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Analytics states
  const [totalLogins, setTotalLogins] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  const [totalInteractions, setTotalInteractions] = useState(0);
  const [loginStats, setLoginStats] = useState<any>(null);
  const [userActivities, setUserActivities] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'services' | 'bookings' | 'users'>('overview');

  const loadAll = async () => {
    try {
      const [s, b, u] = await Promise.all([
        dataService.getAllRawServices(),
        dataService.getAllRawBookings(),
        dataService.getAllRawUsers(),
      ]);
      setServices(s || []);
      setBookings(b || []);
      setUsers(u || []);
      
      // Load analytics data
      setTotalLogins(adminAnalyticsService.getTotalLogins());
      setActiveUsers(adminAnalyticsService.getActiveUsers());
      setTotalInteractions(adminAnalyticsService.getTotalInteractions());
      setLoginStats(adminAnalyticsService.getLoginStatistics());
      setUserActivities(adminAnalyticsService.getAllUserActivities());
    } catch (err: any) {
      setError(err.message || 'Failed to load admin data');
    } 
  };

  const handleBlockUser = async (userId: string) => {
    if (!user || !blockReason.trim()) return;
    
    try {
      await dataService.blockUser(userId, blockReason, user.id);
      setBlockingUser(null);
      setBlockReason('');
      loadAll();
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to block user');
    }
  };

  const handleUnblockUser = async (userId: string) => {
    if (!user) return;
    
    try {
      await dataService.unblockUser(userId, user.id);
      loadAll();
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to unblock user');
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!user || user.id !== 'official-account') {
      setError('Only admin can delete services');
      return;
    }
    
    setLoading(true);
    try {
      console.log('🔐 Admin deleting service:', serviceId);
      
      // Use dataService.deleteService which handles all storage locations
      await dataService.deleteService(serviceId, user.id);
      
      console.log('✅ Service deleted by admin:', serviceId);
      setDeletingService(null);
      loadAll();
      setError('');
    } catch (err: any) {
      console.error('❌ Failed to delete service:', err);
      setError(err.message || 'Failed to delete service');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  if (!user || user.id !== 'official-account') {
    return (
      <div className="p-8">
        <h2 className="text-xl font-semibold">Admin Panel</h2>
        <p className="text-sm text-gray-600 mt-2">You must be the official admin account to access this page.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Enhanced Admin Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-800 dark:to-indigo-800 rounded-2xl p-8 text-white shadow-xl glow-emerald">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <Crown className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-purple-100 dark:text-purple-200">Complete system management and oversight</p>
            </div>
          </div>
          <button 
            onClick={loadAll} 
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-white/20 hover:bg-white/30 rounded-xl backdrop-blur-sm transition-all duration-300 transform hover:scale-105 disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            <span className="font-medium">Refresh Data</span>
          </button>
        </div>
      </div>

      {/* Analytics Overview - Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Logins */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-blue-200 dark:border-blue-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-500/20 rounded-xl">
              <LogIn className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50 px-2 py-1 rounded">Total</span>
          </div>
          <h3 className="text-3xl font-bold text-gray-800 dark:text-white">{totalLogins}</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Total Logins</p>
          {loginStats && (
            <div className="mt-3 text-xs text-gray-600 dark:text-gray-400 space-y-1">
              <p>Today: {loginStats.todayLogins}</p>
              <p>This Week: {loginStats.weekLogins}</p>
            </div>
          )}
        </div>

        {/* Active Users */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-green-200 dark:border-green-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-500/20 rounded-xl">
              <Activity className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <span className="text-xs font-bold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/50 px-2 py-1 rounded">Live</span>
          </div>
          <h3 className="text-3xl font-bold text-gray-800 dark:text-white">{activeUsers}</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Active Users (30 min)</p>
          <div className="mt-3 text-xs text-gray-600 dark:text-gray-400">
            <p className="font-semibold text-green-600 dark:text-green-400">Currently Online</p>
          </div>
        </div>

        {/* Total Interactions */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-purple-200 dark:border-purple-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-500/20 rounded-xl">
              <MessageSquare className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/50 px-2 py-1 rounded">Total</span>
          </div>
          <h3 className="text-3xl font-bold text-gray-800 dark:text-white">{totalInteractions}</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Total Interactions</p>
          <div className="mt-3 text-xs text-gray-600 dark:text-gray-400">
            <p>Services, Bookings, Messages</p>
          </div>
        </div>

        {/* Platform Health */}
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/30 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-amber-200 dark:border-amber-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-amber-500/20 rounded-xl">
              <TrendingUp className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/50 px-2 py-1 rounded">Health</span>
          </div>
          <h3 className="text-3xl font-bold text-gray-800 dark:text-white">{users.length}</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Total Users</p>
          <div className="mt-3 text-xs text-gray-600 dark:text-gray-400">
            <p className="font-semibold text-amber-600 dark:text-amber-400">Platform Active</p>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:dark-card rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <Briefcase className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-emerald-400">{services.length}</h3>
              <p className="text-gray-600 dark:text-emerald-400/80">Total Services</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:dark-card rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
              <Calendar className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-emerald-400">{bookings.length}</h3>
              <p className="text-gray-600 dark:text-emerald-400/80">Total Bookings</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:dark-card rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
              <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-emerald-400">{users.length}</h3>
              <p className="text-gray-600 dark:text-emerald-400/80">Total Users</p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
          <p className="text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Demo/Auto-Generated Services Section */}
      {services.filter(s => s.is_demo || s.is_auto_generated).length > 0 && (
        <section className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-2xl shadow-2xl p-8 border-2 border-orange-200 dark:border-orange-800/50">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-500/20 rounded-xl">
                <AlertTriangle className="w-7 h-7 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Demo & Auto-Generated Services</h2>
                <p className="text-orange-600 dark:text-orange-400 text-sm mt-1">These are test/demo services that can be safely deleted</p>
              </div>
            </div>
            <div className="px-4 py-2 bg-orange-500 text-white rounded-lg font-bold text-lg">
              {services.filter(s => s.is_demo || s.is_auto_generated).length}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-orange-300 dark:border-orange-700 bg-orange-100/50 dark:bg-orange-900/30">
                  <th className="text-left py-4 px-6 font-bold text-gray-800 dark:text-orange-300">Service Title</th>
                  <th className="text-left py-4 px-6 font-bold text-gray-800 dark:text-orange-300">Provider</th>
                  <th className="text-left py-4 px-6 font-bold text-gray-800 dark:text-orange-300">Type</th>
                  <th className="text-left py-4 px-6 font-bold text-gray-800 dark:text-orange-300">Status</th>
                  <th className="text-left py-4 px-6 font-bold text-gray-800 dark:text-orange-300">Admin Actions</th>
                </tr>
              </thead>
              <tbody>
                {services.filter(s => s.is_demo || s.is_auto_generated).map(s => (
                  <tr key={s.id} className="border-b border-orange-100 dark:border-orange-800/30 hover:bg-orange-100/50 dark:hover:bg-orange-900/20 transition-all duration-200">
                    <td className="py-5 px-6">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white text-base">{s.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">ID: {s.id}</p>
                      </div>
                    </td>
                    <td className="py-5 px-6">
                      <p className="text-gray-700 dark:text-gray-300 font-medium">{s.provider_id}</p>
                    </td>
                    <td className="py-5 px-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        s.type === 'offer' 
                          ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400' 
                          : 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400'
                      }`}>
                        {s.type === 'offer' ? '✅ Offer' : '❓ Request'}
                      </span>
                    </td>
                    <td className="py-5 px-6">
                      <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400 rounded-full text-xs font-bold">
                        {s.is_demo ? '🎭 Demo' : '🤖 Auto-Gen'}
                      </span>
                    </td>
                    <td className="py-5 px-6">
                      <button 
                        onClick={() => setDeletingService(s.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl font-semibold"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="text-sm">Delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Enhanced Services Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl shadow-2xl p-8 border-2 border-blue-200 dark:border-blue-800/50">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/20 rounded-xl">
              <Briefcase className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Services Management</h2>
              <p className="text-blue-600 dark:text-blue-400 text-sm mt-1">Total: {services.length} services</p>
            </div>
          </div>
          <div className="px-4 py-2 bg-blue-500 text-white rounded-lg font-bold text-lg">
            {services.length}
          </div>
        </div>
        {services.length === 0 ? (
          <div className="text-center py-12">
            <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 text-lg">No services found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-blue-300 dark:border-blue-700 bg-blue-100/50 dark:bg-blue-900/30">
                  <th className="text-left py-4 px-6 font-bold text-gray-800 dark:text-blue-300">Service Title</th>
                  <th className="text-left py-4 px-6 font-bold text-gray-800 dark:text-blue-300">Provider</th>
                  <th className="text-left py-4 px-6 font-bold text-gray-800 dark:text-blue-300">Type</th>
                  <th className="text-left py-4 px-6 font-bold text-gray-800 dark:text-blue-300">Credits</th>
                  <th className="text-left py-4 px-6 font-bold text-gray-800 dark:text-blue-300">Admin Actions</th>
                </tr>
              </thead>
              <tbody>
                {services.map(s => (
                  <tr key={s.id} className="border-b border-blue-100 dark:border-blue-800/30 hover:bg-blue-100/50 dark:hover:bg-blue-900/20 transition-all duration-200">
                    <td className="py-5 px-6">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white text-base">{s.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">ID: {s.id}</p>
                      </div>
                    </td>
                    <td className="py-5 px-6">
                      <p className="text-gray-700 dark:text-gray-300 font-medium">{s.provider_id}</p>
                    </td>
                    <td className="py-5 px-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        s.type === 'offer' 
                          ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400' 
                          : 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400'
                      }`}>
                        {s.type === 'offer' ? '✅ Offer' : '❓ Request'}
                      </span>
                    </td>
                    <td className="py-5 px-6">
                      <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 rounded-full text-sm font-bold">
                        {s.credits_per_hour || 1} cr/hr
                      </span>
                    </td>
                    <td className="py-5 px-6">
                      <button 
                        onClick={() => setDeletingService(s.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl font-semibold"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="text-sm">Delete Service</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="bg-white p-4 rounded shadow">
        <h3 className="font-semibold mb-2">Bookings ({bookings.length})</h3>
        <div className="overflow-x-auto">
          <table className="w-full table-auto text-sm">
            <thead>
              <tr className="text-left">
                <th className="p-2">ID</th>
                <th className="p-2">Service</th>
                <th className="p-2">Provider</th>
                <th className="p-2">Requester</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map(b => (
                <tr key={b.id} className="border-t">
                  <td className="p-2">{b.id}</td>
                  <td className="p-2">{b.service_id}</td>
                  <td className="p-2">{b.provider_id}</td>
                  <td className="p-2">{b.requester_id}</td>
                  <td className="p-2">
                    <button className="px-2 py-1 bg-green-500 text-white rounded mr-2" onClick={async () => { try { await dataService.confirmBooking(b.id, b.provider_id); loadAll(); } catch {} }}>Confirm</button>
                    <button className="px-2 py-1 bg-red-500 text-white rounded" onClick={async () => { await dataService.declineBooking(b.id, b.provider_id, 'admin decline'); loadAll(); }}>Decline</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="bg-white p-4 rounded shadow">
        <h3 className="font-semibold mb-2">Users ({users.length})</h3>
        <div className="overflow-x-auto">
          <table className="w-full table-auto text-sm">
            <thead>
              <tr className="text-left">
                <th className="p-2">ID</th>
                <th className="p-2">Email</th>
                <th className="p-2">Username</th>
                <th className="p-2">Status</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className={`border-t ${u.is_blocked ? 'bg-red-50' : ''}`}>
                  <td className="p-2">{u.id}</td>
                  <td className="p-2">{u.email}</td>
                  <td className="p-2">{u.username}</td>
                  <td className="p-2">
                    {u.is_blocked ? (
                      <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">
                        Blocked
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="p-2">
                    {u.id !== 'official-account' && (
                      <>
                        {u.is_blocked ? (
                          <button 
                            className="px-2 py-1 bg-green-500 text-white rounded text-xs"
                            onClick={() => handleUnblockUser(u.id)}
                          >
                            Unblock
                          </button>
                        ) : (
                          <button 
                            className="px-2 py-1 bg-red-500 text-white rounded text-xs"
                            onClick={() => setBlockingUser(u.id)}
                          >
                            Block
                          </button>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Block User Modal */}
      {blockingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Block User</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to block this user? They will not be able to log in or use the platform.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for blocking (required):
              </label>
              <textarea
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
                rows={3}
                placeholder="Enter reason for blocking this user..."
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setBlockingUser(null);
                  setBlockReason('');
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleBlockUser(blockingUser)}
                disabled={!blockReason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Block User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Service Deletion Confirmation Modal */}
      {deletingService && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full mx-4 shadow-2xl">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-xl">
                  <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-emerald-400">Delete Service</h3>
              </div>
              
              <p className="text-gray-600 dark:text-emerald-400/80 mb-6">
                Are you sure you want to delete this service? This action cannot be undone and will remove the service permanently from the platform.
              </p>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setDeletingService(null)}
                  className="px-4 py-2 text-gray-600 dark:text-emerald-400 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteService(deletingService)}
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete Service
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
