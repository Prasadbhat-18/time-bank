import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Search, Filter, Clock, Star, User, Plus } from 'lucide-react';
import { Service, Skill } from '../../types';
import { dataService } from '../../services/dataService';
import { ServiceModal } from './ServiceModal';
import { BookingModal } from './BookingModal';

export const ServiceList: React.FC = () => {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'offer' | 'request'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  // Reset demo data: clear localStorage and reload
  const handleResetDemoData = () => {
    localStorage.clear();
    window.location.reload();
  };

  useEffect(() => {
    loadData();
  }, [filterType, filterCategory, searchTerm]);

  const loadData = async () => {
    setLoading(true);
    const [servicesData, skillsData] = await Promise.all([
      dataService.getServices({
        type: filterType === 'all' ? undefined : filterType,
        category: filterCategory || undefined,
        search: searchTerm || undefined,
      }),
      dataService.getSkills(),
    ]);
    
    // Debug log for cross-user booking
    console.log('=== SERVICE LIST DEBUG ===');
    console.log('Current user:', { id: user?.id, email: user?.email, username: user?.username });
    console.log('Total services loaded:', servicesData.length);
    console.log('All services:', servicesData.map(s => ({ 
      id: s.id, 
      title: s.title, 
      provider_id: s.provider_id, 
      provider_email: s.provider?.email,
      provider_username: s.provider?.username,
      isOwnService: s.provider_id === user?.id
    })));
    console.log('Services you can book (not your own):', servicesData.filter(s => s.provider_id !== user?.id).length);
    console.log('Your own services:', servicesData.filter(s => s.provider_id === user?.id).length);
    
    setServices(servicesData);
    setSkills(skillsData);
    setLoading(false);
  };

  const categories = Array.from(new Set(skills.map((s) => s.category)));

  const handleBookService = (service: Service) => {
    setSelectedService(service);
    setShowBookingModal(true);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <button
        onClick={handleResetDemoData}
        style={{ marginBottom: 16, background: '#f87171', color: 'white', padding: '8px 16px', borderRadius: 6 }}
      >
        Reset Demo Data
      </button>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Service Marketplace</h1>
          <p className="text-gray-600 mt-1">Discover and exchange skills with the community</p>
        </div>
        <button
          onClick={() => setShowServiceModal(true)}
          className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition flex items-center gap-2 shadow-lg"
        >
          <Plus className="w-5 h-5" />
          Post Service
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
          </div>

          <div className="flex gap-3">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as 'all' | 'offer' | 'request')}
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            >
              <option value="all">All Types</option>
              <option value="offer">Offers</option>
              <option value="request">Requests</option>
            </select>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500">
              <Filter className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No services found matching your criteria</p>
            </div>
          ) : (
            services.map((service) => {
              const isOwnService = service.provider_id === user?.id;
              return (
                <div
                  key={service.id}
                  className={`bg-white rounded-2xl shadow-lg border overflow-hidden transition group ${
                    isOwnService 
                      ? 'border-gray-200 opacity-60 hover:opacity-75' 
                      : 'border-gray-100 hover:shadow-xl hover:border-emerald-200'
                  }`}
                >
                  <div
                    className={`h-2 ${
                      service.type === 'offer'
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-600'
                        : 'bg-gradient-to-r from-blue-500 to-cyan-600'
                    } ${isOwnService ? 'opacity-50' : ''}`}
                  ></div>

                  <div className="p-6 relative">
                    {isOwnService && (
                      <div className="absolute top-4 right-4 bg-gray-100 text-gray-500 px-2 py-1 rounded text-xs font-medium">
                        Your Service
                      </div>
                    )}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 pr-16">
                        <span
                          className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                            service.type === 'offer'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {service.type === 'offer' ? 'Service Offered' : 'Service Needed'}
                        </span>
                        <h3 className={`text-lg font-semibold mt-2 transition ${
                          isOwnService 
                            ? 'text-gray-500' 
                            : 'text-gray-800 group-hover:text-emerald-600'
                        }`}>
                          {service.title}
                        </h3>
                      </div>
                  <button
                    onClick={handleResetDemoData}
                    style={{ marginBottom: 16, background: '#f87171', color: 'white', padding: '8px 16px', borderRadius: 6 }}
                  >
                    Reset Demo Data
                  </button>
                    </div>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">{service.description}</p>

                  <div className="flex items-center gap-4 mb-4 text-sm">
                    <div className="flex items-center gap-1 text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>{service.credits_per_hour} credit/hr</span>
                    </div>
                    {service.skill && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                        {service.skill.name}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                        {service.provider?.avatar_url ? (
                          <img
                            src={service.provider.avatar_url}
                            alt={service.provider?.username || 'Provider'}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{service.provider?.username || 'Community Member'}</p>
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                          <span className="text-xs text-gray-600">
                            {(service.provider?.reputation_score ?? 5.0).toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {service.provider_id !== user?.id ? (
                      <button
                        onClick={() => handleBookService(service)}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm rounded-lg transition focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                      >
                        Book Now
                      </button>
                    ) : (
                      <div className="flex flex-col items-end">
                        <span className="px-4 py-2 bg-gray-100 text-gray-400 text-sm rounded-lg cursor-not-allowed border border-gray-200">
                          Your Service
                        </span>
                        <span className="text-xs text-gray-400 mt-1">Cannot book own service</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              );
            })
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
    </div>
  );
};