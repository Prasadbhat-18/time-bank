import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Search, Filter, Clock, Star, User, Plus } from 'lucide-react';
import { Service, Skill } from '../../types';
import { dataService } from '../../services/dataService';
import { serviceLoader } from '../../services/serviceLoader';
import { ServiceModal } from './ServiceModal';
import { BookingModal } from './BookingModal';
import { ProfileModal } from '../Profile/ProfileModal';
import { LevelBadge } from '../Level/LevelProgress';
// Chat entry is available only from BookingModal to avoid duplicates
import { InfiniteCarousel } from './InfiniteCarousel';

export const ServiceList: React.FC = () => {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'offer' | 'request'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [hideMine, setHideMine] = useState<boolean>(false);
  const [minCredits, setMinCredits] = useState<string>('');
  const [maxCredits, setMaxCredits] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'credits_high' | 'credits_low'>('newest');
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [profileToShow, setProfileToShow] = useState<{ id?: string; user?: any } | null>(null);
  // Removed chatPeer; chat is opened from BookingModal only

  useEffect(() => {
    loadData();
    // Also subscribe to global service refresh events
    const refresh = () => {
      console.log('🔄 Service refresh event received, reloading data...');
      loadData();
    };
    const handleCreated = (event: any) => {
      console.log('🎉 New service created event received:', event.detail);
      loadData();
    };
    
    window.addEventListener('timebank:services:refresh', refresh);
    window.addEventListener('timebank:services:created', handleCreated);
    
    return () => {
      window.removeEventListener('timebank:services:refresh', refresh);
      window.removeEventListener('timebank:services:created', handleCreated);
    };
  }, [filterType, filterCategory, searchTerm, hideMine, minCredits, maxCredits, sortBy, user?.id]);

  const loadData = async () => {
    setLoading(true);
    console.log('🚀 Loading services with fast loader...');
    
    try {
      let [servicesData, skillsData] = await Promise.all([
        serviceLoader.getServices({
          type: filterType === 'all' ? undefined : filterType,
          category: filterCategory || undefined,
          search: searchTerm || undefined,
        }),
        dataService.getSkills(),
      ]);
      
      console.log(`✅ Fast loader returned ${servicesData.length} services`);

    // Fallback: if a service has no provider object yet (e.g. immediate reload after creation
    // before Firestore roundtrip enriches it), inject the currently logged in user for their own services.
    if (user?.id) {
      servicesData = servicesData.map(s => {
        if (!s.provider && s.provider_id === user.id) {
          return { ...s, provider: user } as Service;
        }
        return s;
      });
    }
    
    // Debug log for cross-user booking
    console.log('Current user:', user?.id, user?.email);
  console.log('All services:', servicesData.map(s => ({ id: s.id, title: s.title, provider_id: s.provider_id, provider_username: s.provider?.username })));
    console.log('Services you can book:', servicesData.filter(s => s.provider_id !== user?.id));
  // expose debug counts
  const total = servicesData.length;
  const mine = servicesData.filter(s => s.provider_id === user?.id).length;
  const others = total - mine;
  console.log(`services: total=${total}, mine=${mine}, others=${others}`);
    
    // Apply client-side additional filters
    let filtered = [...servicesData];
    if (hideMine && user?.id) {
      filtered = filtered.filter(s => s.provider_id !== user.id);
    }
    const min = parseFloat(minCredits);
    const max = parseFloat(maxCredits);
    if (!isNaN(min)) filtered = filtered.filter(s => (s.credits_per_hour ?? 0) >= min);
    if (!isNaN(max)) filtered = filtered.filter(s => (s.credits_per_hour ?? 0) <= max);

    // Apply client-side sorting
    const sorted = [...filtered];
    if (sortBy === 'newest') {
      sorted.sort((a, b) => {
        const ta = new Date(a.created_at || 0).getTime();
        const tb = new Date(b.created_at || 0).getTime();
        return tb - ta; // newest first
      });
    } else if (sortBy === 'credits_high') {
      sorted.sort((a, b) => (b.credits_per_hour ?? 0) - (a.credits_per_hour ?? 0));
    } else if (sortBy === 'credits_low') {
      sorted.sort((a, b) => (a.credits_per_hour ?? 0) - (b.credits_per_hour ?? 0));
    }

      setServices(sorted);
      setSkills(skillsData);
      setLoading(false);
    } catch (error) {
      console.error('❌ Failed to load services:', error);
      setLoading(false);
    }
  };

  const categories = Array.from(new Set(skills.map((s) => s.category)));

  const timeAgo = (iso?: string) => {
    if (!iso) return '';
    const d = new Date(iso).getTime();
    const diff = Date.now() - d;
    const sec = Math.floor(diff / 1000);
    if (sec < 10) return 'just now';
    if (sec < 60) return `${sec}s ago`;
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    const day = Math.floor(hr / 24);
    if (day === 1) return '1 day ago';
    return `${day} days ago`;
  };

  const formatDateTime = (iso?: string) => {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  };

  const handleBookService = (service: Service) => {
    setSelectedService(service);
    setShowBookingModal(true);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4 px-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Service Marketplace</h1>
          <p className="text-gray-600 mt-1 text-sm">Discover and exchange skills with the community</p>
            <div className="text-sm text-gray-500 mt-1">Debug: services total {services.length}</div>
        </div>
        <button
          onClick={() => setShowServiceModal(true)}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition flex items-center gap-2 shadow-lg text-sm"
        >
          <Plus className="w-4 h-4" />
          Post Service
        </button>
      </div>

      <div className="bg-gradient-to-r from-white to-gray-50 rounded-xl shadow-lg border border-gray-200 p-5 backdrop-blur-sm">
        <div className="flex flex-col gap-4">
          <div className="flex-1 w-full relative flex items-center">
            <input
              type="text"
              placeholder="🔍 Search services by title, description, or provider..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-10 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white text-gray-900 transition-all hover:border-gray-300"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none flex items-center justify-center">
              <Search className="w-5 h-5 text-emerald-500" />
            </div>
          </div>

          <div className="flex gap-3 items-center justify-start w-full flex-wrap">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'credits_high' | 'credits_low')}
              className="px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white text-gray-700 font-medium transition-all hover:border-gray-300 cursor-pointer"
            >
              <option value="newest">📅 Sort: Newest first</option>
              <option value="credits_high">⬇️ Credits: High → Low</option>
              <option value="credits_low">⬆️ Credits: Low → High</option>
            </select>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as 'all' | 'offer' | 'request')}
              className="px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white text-gray-700 font-medium transition-all hover:border-gray-300 cursor-pointer"
            >
              <option value="all">📋 All Types</option>
              <option value="offer">✅ Offers</option>
              <option value="request">❓ Requests</option>
            </select>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white text-gray-700 font-medium transition-all hover:border-gray-300 cursor-pointer"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <label className="inline-flex items-center gap-2 text-sm text-gray-700 px-3 py-2 border border-gray-300 rounded-lg">
              <input type="checkbox" checked={hideMine} onChange={(e) => setHideMine(e.target.checked)} />
              Hide my services
            </label>

            <div className="flex items-center gap-2">
              <input
                type="number"
                inputMode="decimal"
                placeholder="Min credits"
                value={minCredits}
                onChange={(e) => setMinCredits(e.target.value)}
                className="w-28 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
              <span className="text-gray-500">-</span>
              <input
                type="number"
                inputMode="decimal"
                placeholder="Max credits"
                value={maxCredits}
                onChange={(e) => setMaxCredits(e.target.value)}
                className="w-28 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
            </div>

            <button
              type="button"
              onClick={() => { setFilterType('all'); setFilterCategory(''); setSearchTerm(''); setHideMine(false); setMinCredits(''); setMaxCredits(''); }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
        </div>
      ) : (
        <div className="service-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500">
              <Filter className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No services found matching your criteria</p>
            </div>
          ) : (
            services.map((service) => (
              <div
                key={service.id}
                className="service-card bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200 group flex flex-col h-full"
              >
                <div
                  className={`h-1 ${
                    service.type === 'offer'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600'
                      : 'bg-gradient-to-r from-blue-500 to-cyan-600'
                  }`}
                ></div>

                {/* Carousel for service images */}
                {service.imageUrls && service.imageUrls.length > 0 && (
                  <div className="mb-2">
                    <InfiniteCarousel images={service.imageUrls} />
                  </div>
                )}

                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          service.type === 'offer'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {service.type === 'offer' ? 'Offered' : 'Needed'}
                      </span>
                      <div className="mt-1">
                        <h3 className="text-base font-semibold text-gray-800 group-hover:text-emerald-600 transition line-clamp-2">
                          {service.title}
                        </h3>
                        <span
                          className="text-xs text-gray-500"
                          title={`Posted ${formatDateTime(service.created_at)}`}
                        >
                          {timeAgo(service.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{service.description}</p>

                  <div className="flex items-center gap-2 mb-2 text-xs">
                    <div className="flex items-center gap-1 text-gray-600">
                      <Clock className="w-3 h-3" />
                      <span>{service.credits_per_hour} cr/hr</span>
                    </div>
                    {service.skill && (
                      <span className="px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                        {service.skill.name}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setProfileToShow({ id: service.provider_id, user: service.provider })}
                        className="flex items-center gap-1 text-left hover:opacity-80 transition"
                      >
                        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {service.provider?.avatar_url ? (
                            <img
                              src={service.provider.avatar_url}
                              alt={service.provider?.username || service.provider_id}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-3 h-3 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-1">
                            <p className="text-xs font-medium text-gray-800 truncate">{service.provider?.username || service.provider_id}</p>
                            <LevelBadge level={service.provider?.level || 1} size="sm" showTitle={false} />
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="w-2 h-2 text-amber-500 fill-amber-500" />
                            <span className="text-xs text-gray-600">
                              {(service.provider?.reputation_score ?? 0).toFixed(1)}
                            </span>
                          </div>
                        </div>
                      </button>
                    </div>

                    {service.provider_id !== user?.id ? (
                      <button
                        onClick={() => handleBookService(service)}
                        className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm rounded transition"
                      >
                        Book Now
                      </button>
                    ) : (
                      <button
                        onClick={async () => {
                          if (window.confirm('Are you sure you want to delete this service?')) {
                            try {
                              await dataService.deleteService(service.id, user.id);
                              loadData();
                            } catch (error: any) {
                              alert('Failed to delete service: ' + (error.message || 'Unknown error'));
                            }
                          }
                        }}
                        className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-sm rounded transition flex items-center gap-1"
                      >
                        <span>×</span> Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {showServiceModal && (
        <ServiceModal
          onClose={() => {
            setShowServiceModal(false);
            loadData();
          }}
        />
      )}

      {showBookingModal && selectedService && (
        <BookingModal
          service={selectedService}
          onClose={() => {
            setShowBookingModal(false);
            setSelectedService(null);
          }}
          onBooked={() => {
            setShowBookingModal(false);
            setSelectedService(null);
          }}
        />
      )}

      {profileToShow && (
        <ProfileModal
          userId={profileToShow.id}
          userObj={profileToShow.user}
          onClose={() => setProfileToShow(null)}
        />
      )}

      {/* Chat modal intentionally removed here; use BookingModal -> Chat before booking */}
    </div>
  );
};