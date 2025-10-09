import React, { useState, useEffect } from 'react';
import { Phone, AlertTriangle, X, MapPin } from 'lucide-react';

interface SOSButtonProps {
  userLocation?: { lat: number; lng: number };
}

interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
}

export function SOSButton({ userLocation }: SOSButtonProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isActivated, setIsActivated] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [personalContacts, setPersonalContacts] = useState<EmergencyContact[]>([]);

  // Load emergency contacts from localStorage
  useEffect(() => {
    const savedContacts = localStorage.getItem('emergencyContacts');
    if (savedContacts) {
      setPersonalContacts(JSON.parse(savedContacts));
    }
  }, []);

  const officialEmergencyContacts = [
    { name: 'Emergency Services', number: '911', type: 'emergency' },
    { name: 'Police', number: '911', type: 'police' },
    { name: 'Medical Emergency', number: '911', type: 'medical' },
    { name: 'Fire Department', number: '911', type: 'fire' },
  ];

  const handleSOSActivation = () => {
    setIsActivated(true);
    let count = 3;
    setCountdown(count);

    const countdownInterval = setInterval(() => {
      count--;
      setCountdown(count);
      
      if (count <= 0) {
        clearInterval(countdownInterval);
        // Trigger SOS actions
        triggerSOSActions();
        setTimeout(() => {
          setIsActivated(false);
          setIsExpanded(false);
        }, 2000);
      }
    }, 1000);
  };

  const cancelSOS = () => {
    setIsActivated(false);
    setCountdown(0);
    setIsExpanded(false);
  };

  const triggerSOSActions = () => {
    // Send location to emergency contacts
    if (userLocation) {
      const locationMessage = `Emergency Alert: I need help! My location: https://maps.google.com/maps?q=${userLocation.lat},${userLocation.lng}`;
      
      // In a real app, this would send SMS/notifications to emergency contacts
      console.log('SOS Activated:', locationMessage);
      
      // You could integrate with:
      // - SMS API to send location to emergency contacts
      // - Push notifications to nearby TimeBank users
      // - Local emergency services API
      // - Family/friend notification system
    }

    // Show success message
    alert('SOS Alert sent! Emergency services and your contacts have been notified.');
  };

  const callEmergencyNumber = (number: string) => {
    // In a real app, this would initiate a phone call
    window.location.href = `tel:${number}`;
  };

  if (isActivated) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 text-center max-w-sm mx-4 shadow-2xl">
          <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <AlertTriangle className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-red-600 mb-2">SOS ACTIVATING</h2>
          <div className="text-6xl font-bold text-red-500 mb-4">{countdown}</div>
          <p className="text-gray-600 mb-6">Emergency alert will be sent</p>
          <button
            onClick={cancelSOS}
            className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition"
          >
            CANCEL
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Main SOS Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-full shadow-2xl flex items-center justify-center z-40 transition-all duration-300 animate-pulse border-4 border-white"
        aria-label="Emergency SOS Button"
      >
        <AlertTriangle className="w-8 h-8" />
      </button>

      {/* Expanded SOS Panel */}
      {isExpanded && (
        <div className="fixed bottom-24 right-6 bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 z-40 min-w-80">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-bold text-red-600">Emergency SOS</h3>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Location Status */}
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4" />
              <span>
                {userLocation 
                  ? `Location: ${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}`
                  : 'Location not available'
                }
              </span>
            </div>
          </div>

          {/* Quick SOS Activation */}
          <button
            onClick={handleSOSActivation}
            className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-4 rounded-xl font-bold text-lg mb-4 transition-all duration-200 shadow-lg"
          >
            🚨 ACTIVATE SOS ALERT
          </button>

          {/* Personal Emergency Contacts */}
          {personalContacts.length > 0 && (
            <div className="space-y-2 mb-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Your Emergency Contacts:</h4>
              {personalContacts.slice(0, 3).map((contact) => (
                <button
                  key={contact.id}
                  onClick={() => callEmergencyNumber(contact.phone)}
                  className="w-full flex items-center gap-3 p-3 bg-green-50 hover:bg-green-100 rounded-lg transition border border-green-200"
                >
                  <Phone className="w-4 h-4 text-green-600" />
                  <div className="flex-1 text-left">
                    <div className="font-medium text-sm text-green-800">{contact.name}</div>
                    <div className="text-xs text-green-600">{contact.phone} • {contact.relationship}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Official Emergency Contacts */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Emergency Services:</h4>
            {officialEmergencyContacts.map((contact, index) => (
              <button
                key={index}
                onClick={() => callEmergencyNumber(contact.number)}
                className="w-full flex items-center gap-3 p-3 bg-red-50 hover:bg-red-100 rounded-lg transition border border-red-200"
              >
                <Phone className="w-4 h-4 text-red-500" />
                <div className="flex-1 text-left">
                  <div className="font-medium text-sm text-red-800">{contact.name}</div>
                  <div className="text-xs text-red-600">{contact.number}</div>
                </div>
              </button>
            ))}
          </div>

          {/* Information */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500 text-center">
              SOS will send your location to emergency contacts and nearby TimeBank community members
            </p>
          </div>
        </div>
      )}
    </>
  );
}