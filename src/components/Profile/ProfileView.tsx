import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Camera, Edit, Save, X, User, Mail, Phone, MapPin, Award, Clock, Shield, Plus, Trash2, PhoneCall, Lock, Star } from 'lucide-react';
import { EmergencyContact, Review } from '../../types';
import { LevelPerkList, LevelBadge } from '../Level/LevelProgress';
import LevelProgressDetail from '../Level/LevelProgressDetail';
import { dataService } from '../../services/dataService';
import { getLevelProgress } from '../../services/levelService';
import { googleProfileService } from '../../services/googleProfileService';

export const ProfileView: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
    const [profilePicture, setProfilePicture] = useState('');
  const [uploading, setUploading] = useState(false);
  const [editData, setEditData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
    skills: user?.skills?.join(', ') || '',
    location: user?.location || ''
  });
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>(
    user?.emergency_contacts || []
  );
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContact, setNewContact] = useState({
    name: '',
    phone: '',
    relationship: '',
    isPrimary: false
  });
  // Change password UI state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwMessage, setPwMessage] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  
  // Geolocation state
  const [fetchingLocation, setFetchingLocation] = useState(false);

    // Load profile picture when user changes
    useEffect(() => {
      if (user?.id) {
        const savedPicture = localStorage.getItem(`profilePicture_${user.id}`);
        setProfilePicture(savedPicture || '');
      } else {
        setProfilePicture('');
      }
    }, [user?.id]);

    // Update edit data when user changes
    useEffect(() => {
      if (user) {
        setEditData({
          username: user.username || '',
          email: user.email || '',
          phone: user.phone || '',
          bio: user.bio || '',
          skills: user.skills?.join(', ') || '',
          location: user.location || ''
        });
        setEmergencyContacts(user.emergency_contacts || []);
        loadReviews();
      }
    }, [user]);

  // Listen for profile refresh events (when reviews are submitted)
  useEffect(() => {
    const handleRefresh = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('🔄 Profile refresh event received:', customEvent.detail);
      // Force component re-render by updating local state
      if (user?.id) {
        loadReviews();
        // Force a state update to trigger re-render
        setEditData(prev => ({ ...prev }));
        // Refresh emergency contacts from user data
        if (user.emergency_contacts) {
          setEmergencyContacts(user.emergency_contacts);
        }
      }
    };

    // Listen for level up events
    const handleLevelUp = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('🎉 Level up event received in ProfileView:', customEvent.detail);
      // Force refresh user data from AuthContext
      if (user?.id) {
        loadReviews();
        // Force a state update to trigger re-render
        setEditData(prev => ({ ...prev }));
        // Refresh emergency contacts from user data
        if (user.emergency_contacts) {
          setEmergencyContacts(user.emergency_contacts);
        }
      }
    };

    window.addEventListener('timebank:refreshProfileAndDashboard', handleRefresh);
    window.addEventListener('timebank:levelUp', handleLevelUp);
    return () => {
      window.removeEventListener('timebank:refreshProfileAndDashboard', handleRefresh);
      window.removeEventListener('timebank:levelUp', handleLevelUp);
    };
  }, [user?.id, user?.emergency_contacts]);

  // Load reviews for the current user
  const loadReviews = async () => {
    if (!user?.id) return;
    
    setReviewsLoading(true);
    try {
      const userReviews = await dataService.getReviews(user.id);
      setReviews(userReviews);
    } catch (error) {
      console.error('Failed to load reviews:', error);
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploading(true);
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target?.result as string;
        setProfilePicture(imageData);
        localStorage.setItem(`profilePicture_${user?.id}`, imageData);
        setUploading(false);
      };
      reader.onerror = () => setUploading(false);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    console.log('🔄 ProfileView.handleSave called');
    
    if (!user) {
      console.error('❌ No user found when trying to save');
      alert('❌ Error: No user session found. Please log in again.');
      return;
    }

    // Validate required fields
    if (!editData.username?.trim()) {
      alert('❌ Username is required');
      return;
    }

    if (!editData.email?.trim()) {
      alert('❌ Email is required');
      return;
    }

    console.log('📝 Starting profile save process...');
    console.log('👤 Current user:', { 
      id: user.id, 
      username: user.username, 
      email: user.email,
      level: user.level,
      xp: user.experience_points 
    });
    console.log('📋 Edit data:', editData);
    
    // Prepare updated fields with proper data types
    const updatedFields = {
      username: editData.username.trim(),
      email: editData.email.trim(),
      phone: editData.phone?.trim() || '',
      bio: editData.bio?.trim() || '',
      skills: editData.skills ? 
        editData.skills.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0) : 
        [],
      location: editData.location?.trim() || '',
      emergency_contacts: emergencyContacts || [],
      // Preserve existing level system fields
      level: user.level || 1,
      experience_points: user.experience_points || 0,
      services_completed: user.services_completed || 0,
      custom_credits_enabled: user.custom_credits_enabled || false,
      // Preserve other important fields
      reputation_score: user.reputation_score || 5.0,
      total_reviews: user.total_reviews || 0,
      created_at: user.created_at || new Date().toISOString(),
      avatar_url: user.avatar_url || ''
    };
    
    console.log('✅ Prepared fields for save:', updatedFields);
    
    try {
      console.log('💾 Step 1: Saving to localStorage first...');
      localStorage.setItem('timebank_user', JSON.stringify({ ...user, ...updatedFields }));
      console.log('✅ localStorage save successful');
      
      console.log('☁️ Step 2: Attempting to save to remote storage...');
      
      // Try multiple save methods for maximum reliability
      let saveSuccess = false;
      let savedUser = null;
      
      // Check if this is a Google user and use alternative save method
      if (googleProfileService.isGoogleUser(user)) {
        console.log('🔄 Google user detected, using enhanced GoogleProfileService...');
        try {
          // Validate profile data first
          const validation = googleProfileService.validateProfileData(updatedFields);
          if (!validation.valid) {
            alert(`❌ Validation errors:\n${validation.errors.join('\n')}`);
            return;
          }
          
          // Use enhanced Firebase error recovery method
          const result = await googleProfileService.saveWithFirebaseRecovery(user.id, updatedFields);
          
          if (result.success && result.user) {
            console.log('✅ GoogleProfileService save successful:', result.user);
            savedUser = result.user;
            saveSuccess = true;
            
            // Show success message (especially if using fallback method)
            if (result.message !== 'Profile saved successfully!') {
              console.log('ℹ️ Using fallback method:', result.message);
              // You could show a toast notification here if desired
            }
            
            // Refresh profile in context
            await googleProfileService.refreshProfileInContext(user.id);
            
            // Also update the AuthContext
            try {
              await updateUser(updatedFields);
              console.log('✅ AuthContext updated successfully');
            } catch (contextError) {
              console.warn('⚠️ Failed to update AuthContext, but profile saved:', contextError);
            }
          } else {
            console.error('❌ GoogleProfileService failed:', result.message);
            setError(result.message);
            return;
          }
          
        } catch (googleError: any) {
          console.error('❌ GoogleProfileService unexpected error:', googleError);
          setError('Failed to save profile. Please try again.');
          return;
        }
      }
      
      // Fallback methods for non-Google users or if Google service fails
      if (!saveSuccess) {
        // Method 1: Direct dataService update
        try {
          console.log('🔄 Trying dataService.updateUser...');
          savedUser = await dataService.updateUser(user.id, updatedFields);
          console.log('✅ dataService save successful:', savedUser);
          saveSuccess = true;
        } catch (dataServiceError: any) {
          console.warn('⚠️ dataService failed:', dataServiceError.message);
          
          // Method 2: AuthContext update as fallback
          try {
            console.log('🔄 Trying AuthContext.updateUser as fallback...');
            await updateUser(updatedFields);
            console.log('✅ AuthContext save successful');
            savedUser = { ...user, ...updatedFields };
            saveSuccess = true;
          } catch (authError: any) {
            console.warn('⚠️ AuthContext also failed:', authError.message);
          }
        }
      }
      
      if (saveSuccess) {
        console.log('🎉 Profile save completed successfully!');
        alert('✅ Profile updated successfully!');
        
        // Update local state with saved data
        setEditData({
          username: savedUser?.username || updatedFields.username,
          email: savedUser?.email || updatedFields.email,
          phone: savedUser?.phone || updatedFields.phone,
          bio: savedUser?.bio || updatedFields.bio,
          skills: (savedUser?.skills || updatedFields.skills).join(', '),
          location: savedUser?.location || updatedFields.location
        });
        
        setEditing(false);
        
        // Trigger a soft refresh of user data
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('timebank:profileUpdated', {
            detail: { user: savedUser || { ...user, ...updatedFields } }
          }));
        }, 100);
        
      } else {
        throw new Error('All save methods failed');
      }
      
    } catch (error: any) {
      console.error('❌ Profile save failed completely:', error);
      
      // Even if remote save fails, we have localStorage backup
      alert('⚠️ Profile saved locally but may not sync to server. Your changes are preserved.');
      setEditing(false);
    }
  };

  // Enhanced geolocation handler
  const handleGetLocation = async () => {
    console.log('🌍 handleGetLocation called');
    setFetchingLocation(true);
    
    try {
      // Check if geolocation is supported
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by this browser');
      }
      
      console.log('📍 Requesting current location...');
      
      // Get location with enhanced options
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 15000, // 15 seconds timeout
            maximumAge: 300000 // 5 minutes cache
          }
        );
      });
      
      const { latitude: lat, longitude: lng } = position.coords;
      console.log('✅ Location received:', { lat, lng, accuracy: position.coords.accuracy });
      
      // Try multiple geocoding services for the most detailed address
      let address = '';
      let bestAddress = '';
      let maxDetailLevel = 0;
      
      // Service 1: Nominatim (OpenStreetMap) - Most detailed for streets
      try {
        console.log('🔍 Attempting reverse geocoding with Nominatim...');
        address = await reverseGeocodeNominatim(lat, lng);
        const detailLevel = address.split(',').length;
        if (detailLevel > maxDetailLevel) {
          bestAddress = address;
          maxDetailLevel = detailLevel;
        }
        console.log('✅ Nominatim result:', address, `(${detailLevel} components)`);
      } catch (nominatimError: any) {
        console.warn('⚠️ Nominatim failed:', nominatimError.message || nominatimError);
      }
      
      // Service 2: BigDataCloud - Good for administrative areas
      try {
        console.log('🔍 Attempting reverse geocoding with BigDataCloud...');
        const altAddress = await reverseGeocodeAlternative(lat, lng);
        const detailLevel = altAddress.split(',').length;
        if (detailLevel > maxDetailLevel) {
          bestAddress = altAddress;
          maxDetailLevel = detailLevel;
        }
        console.log('✅ BigDataCloud result:', altAddress, `(${detailLevel} components)`);
      } catch (altError: any) {
        console.warn('⚠️ BigDataCloud failed:', altError.message || altError);
      }
      
      // Service 3: LocationIQ (if others fail or for comparison)
      try {
        console.log('🔍 Attempting reverse geocoding with LocationIQ...');
        const locationIQAddress = await reverseGeocodeLocationIQ(lat, lng);
        const detailLevel = locationIQAddress.split(',').length;
        if (detailLevel > maxDetailLevel) {
          bestAddress = locationIQAddress;
          maxDetailLevel = detailLevel;
        }
        console.log('✅ LocationIQ result:', locationIQAddress, `(${detailLevel} components)`);
      } catch (locationIQError: any) {
        console.warn('⚠️ LocationIQ failed:', locationIQError.message || locationIQError);
      }
      
      // Use the most detailed address found, or coordinates as fallback
      address = bestAddress || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      console.log('🏆 Best address selected:', address, `(${maxDetailLevel} components)`)
      
      console.log('📍 Address resolved:', address);
      setEditData({ ...editData, location: address });
      alert(`✅ Location detected: ${address}`);
      
    } catch (error: any) {
      console.error('❌ Failed to get location:', error);
      
      let errorMessage = 'Unknown error';
      if (error.code === 1) {
        errorMessage = 'Location access denied. Please enable location permissions and try again.';
      } else if (error.code === 2) {
        errorMessage = 'Location unavailable. Please check your GPS/network connection.';
      } else if (error.code === 3) {
        errorMessage = 'Location request timed out. Please try again.';
      } else {
        errorMessage = error.message || 'Failed to get location';
      }
      
      alert(`❌ ${errorMessage} You can enter your location manually.`);
    } finally {
      setFetchingLocation(false);
    }
  };

  // Enhanced reverse geocoding using Nominatim (OpenStreetMap)
  const reverseGeocodeNominatim = async (lat: number, lng: number): Promise<string> => {
    try {
      console.log('Fetching address from Nominatim API...');
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'TimeBank-App/1.0'
          }
        }
      );
      
      if (!response.ok) {
        console.error('Nominatim API error:', response.status, response.statusText);
        return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      }
      
      const data = await response.json();
      console.log('Nominatim response:', data);
      
      // Create a detailed address with street, area, pincode etc.
      const address = data.address;
      let formattedAddress = data.display_name;
      
      if (address) {
        // Build detailed address with specific components
        const parts = [];
        
        // Street level details
        if (address.house_number && address.road) {
          parts.push(`${address.house_number} ${address.road}`);
        } else if (address.road) {
          parts.push(address.road);
        }
        
        // Area/Neighborhood details
        if (address.neighbourhood) parts.push(address.neighbourhood);
        else if (address.suburb) parts.push(address.suburb);
        else if (address.residential) parts.push(address.residential);
        
        // City/Town details
        if (address.city) parts.push(address.city);
        else if (address.town) parts.push(address.town);
        else if (address.village) parts.push(address.village);
        else if (address.municipality) parts.push(address.municipality);
        
        // Postal code
        if (address.postcode) parts.push(address.postcode);
        
        // State/Region
        if (address.state) parts.push(address.state);
        else if (address.region) parts.push(address.region);
        
        // Country
        if (address.country) parts.push(address.country);
        
        if (parts.length > 0) {
          formattedAddress = parts.join(', ');
        }
        
        console.log('📍 Detailed address components:', {
          houseNumber: address.house_number,
          road: address.road,
          neighbourhood: address.neighbourhood,
          suburb: address.suburb,
          city: address.city,
          postcode: address.postcode,
          state: address.state,
          country: address.country
        });
      }
      
      return formattedAddress || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  };

  // Alternative geocoding service (fallback)
  const reverseGeocodeAlternative = async (lat: number, lng: number): Promise<string> => {
    try {
      console.log('🔍 Attempting alternative geocoding...');
      // Using a simple coordinate-based location description as fallback
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
      );
      
      if (!response.ok) {
        throw new Error('Alternative geocoding service failed');
      }
      
      const data = await response.json();
      console.log('Alternative geocoding response:', data);
      
      // Build detailed address from available data
      const parts = [];
      
      // Street and area details
      if (data.localityInfo && data.localityInfo.administrative) {
        const admin = data.localityInfo.administrative;
        // Try to get street-level information
        if (admin.find((item: any) => item.adminLevel === 10)) {
          parts.push(admin.find((item: any) => item.adminLevel === 10).name);
        }
        // Area/neighborhood level
        if (admin.find((item: any) => item.adminLevel === 9)) {
          parts.push(admin.find((item: any) => item.adminLevel === 9).name);
        }
      }
      
      // Locality and city
      if (data.locality) parts.push(data.locality);
      if (data.city && data.city !== data.locality) parts.push(data.city);
      
      // Postal code if available
      if (data.postcode) parts.push(data.postcode);
      
      // State/region
      if (data.principalSubdivision) parts.push(data.principalSubdivision);
      
      // Country
      if (data.countryName) parts.push(data.countryName);
      
      console.log('📍 Alternative geocoding components:', {
        locality: data.locality,
        city: data.city,
        postcode: data.postcode,
        principalSubdivision: data.principalSubdivision,
        countryName: data.countryName,
        localityInfo: data.localityInfo
      });
      
      return parts.length > 0 ? parts.join(', ') : `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    } catch (error) {
      console.error('Alternative geocoding failed:', error);
      throw error;
    }
  };

  // Third geocoding service using LocationIQ (free tier available)
  const reverseGeocodeLocationIQ = async (lat: number, lng: number): Promise<string> => {
    try {
      console.log('🔍 Attempting LocationIQ geocoding...');
      // Using LocationIQ's free reverse geocoding (no API key required for basic usage)
      const response = await fetch(
        `https://us1.locationiq.com/v1/reverse.php?key=demo&lat=${lat}&lon=${lng}&format=json&addressdetails=1`
      );
      
      if (!response.ok) {
        throw new Error('LocationIQ geocoding service failed');
      }
      
      const data = await response.json();
      console.log('LocationIQ geocoding response:', data);
      
      // Build detailed address similar to Nominatim format
      const address = data.address;
      const parts = [];
      
      if (address) {
        // Street level details
        if (address.house_number && address.road) {
          parts.push(`${address.house_number} ${address.road}`);
        } else if (address.road) {
          parts.push(address.road);
        }
        
        // Area/Neighborhood
        if (address.neighbourhood) parts.push(address.neighbourhood);
        else if (address.suburb) parts.push(address.suburb);
        
        // City/Town
        if (address.city) parts.push(address.city);
        else if (address.town) parts.push(address.town);
        else if (address.village) parts.push(address.village);
        
        // Postal code
        if (address.postcode) parts.push(address.postcode);
        
        // State
        if (address.state) parts.push(address.state);
        
        // Country
        if (address.country) parts.push(address.country);
      }
      
      const formattedAddress = parts.length > 0 ? parts.join(', ') : data.display_name;
      return formattedAddress || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    } catch (error) {
      console.error('LocationIQ geocoding failed:', error);
      throw error;
    }
  };

  const handleAddEmergencyContact = async () => {
    if (newContact.name && newContact.phone && validatePhoneNumber(newContact.phone)) {
      const contact: EmergencyContact = {
        id: Date.now().toString(),
        ...newContact
      };
      
      // If this is set as primary, remove primary from others
      let updatedContacts = emergencyContacts;
      if (contact.isPrimary) {
        updatedContacts = emergencyContacts.map(c => ({ ...c, isPrimary: false }));
      }
      
      const newContacts = [...updatedContacts, contact];
      setEmergencyContacts(newContacts);
      setNewContact({ name: '', phone: '', relationship: '', isPrimary: false });
      setShowAddContact(false);
      
      // Save immediately to user profile
      console.log('💾 Saving emergency contact to user profile...');
      try {
        if (!user?.id) {
          throw new Error('User ID not available');
        }
        
        const updatedFields = {
          emergency_contacts: newContacts
        };
        
        // Save to dataService
        await dataService.updateUser(user.id, updatedFields);
        console.log('✅ Emergency contact saved successfully');
        
        // Also update AuthContext
        await updateUser(updatedFields);
        console.log('✅ AuthContext updated with new emergency contact');
        
        alert('✅ Emergency contact added successfully!');
      } catch (error: any) {
        console.error('❌ Failed to save emergency contact:', error);
        alert('⚠️ Contact added locally but failed to sync. Please save your profile.');
      }
    } else {
      alert('❌ Please enter a valid name and phone number');
    }
  };

  const handleDeleteEmergencyContact = async (contactId: string) => {
    const updatedContacts = emergencyContacts.filter(c => c.id !== contactId);
    setEmergencyContacts(updatedContacts);
    
    // Save immediately to user profile
    console.log('💾 Saving emergency contact deletion...');
    try {
      if (!user?.id) {
        throw new Error('User ID not available');
      }
      
      const updatedFields = {
        emergency_contacts: updatedContacts
      };
      
      // Save to dataService
      await dataService.updateUser(user.id, updatedFields);
      console.log('✅ Emergency contact deleted successfully');
      
      // Also update AuthContext
      await updateUser(updatedFields);
      console.log('✅ AuthContext updated after contact deletion');
    } catch (error: any) {
      console.error('❌ Failed to delete emergency contact:', error);
      alert('⚠️ Contact deleted locally but failed to sync. Please save your profile.');
    }
  };

  const handleCallEmergencyContact = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const validatePhoneNumber = (phone: string) => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  };

  const handleCancel = () => {
    setEditData({
      username: user?.username || '',
      email: user?.email || '',
      phone: user?.phone || '',
      bio: user?.bio || '',
      skills: user?.skills?.join(', ') || '',
      location: user?.location || ''
    });
    setEditing(false);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(''); setPwMessage('');
    if (newPassword.length < 6) { setPwError('New password must be at least 6 characters'); return; }
    if (newPassword !== confirmPassword) { setPwError('Passwords do not match'); return; }
    try {
      setPwLoading(true);
      // In mock mode we stored credentials; we can call resetPassword from context
      // We'll import resetPassword via useAuth (extend hook return) — fallback: direct localStorage update
      const auth: any = (useAuth as any)();
      if (!user) throw new Error('No user context');
      if (auth.resetPassword) {
        await auth.resetPassword(user.email, newPassword);
      } else {
        // Fallback update local creds
        const raw = localStorage.getItem('timebank_creds');
        if (raw) {
          const creds = JSON.parse(raw);
          if (!creds[user.email.toLowerCase()]) throw new Error('Credential record missing');
          creds[user.email.toLowerCase()].password = newPassword;
          localStorage.setItem('timebank_creds', JSON.stringify(creds));
        }
      }
      setPwMessage('Password updated successfully');
      setOldPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (err: any) {
      setPwError(err.message || 'Failed to update password');
    } finally { setPwLoading(false); }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
      {/* Profile Header */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500 h-24 md:h-32"></div>
        <div className="px-4 md:px-6 pb-4 md:pb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-center -mt-12 md:-mt-16 space-y-3 md:space-y-4 sm:space-y-0 sm:space-x-6">
            {/* Profile Picture */}
            <div className="relative">
              <div className="relative w-24 h-24 md:w-32 md:h-32 bg-white rounded-full border-4 border-white shadow-lg overflow-hidden">
                {profilePicture ? (
                  <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-emerald-200 to-cyan-200 flex items-center justify-center">
                    <User className="w-12 h-12 md:w-16 md:h-16 text-emerald-600" />
                  </div>
                )}
                {/* Uploading overlay */}
                {uploading && (
                  <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                    <div className="h-6 w-6 md:h-8 md:w-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
                  </div>
                )}
                {/* Camera button inside the avatar circle */}
                <button
                  aria-label="Change profile picture"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute bottom-1 right-1 md:bottom-2 md:right-2 bg-emerald-500 hover:bg-emerald-600 text-white p-2 md:p-2.5 rounded-full shadow-lg transition-colors tap-target ring-2 ring-white focus:outline-none focus-visible:ring-4 focus-visible:ring-white/80 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Camera className="w-4 h-4 md:w-5 md:h-5" />
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading}
                className="hidden"
              />
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center sm:text-left sm:self-center">
              <div className="flex items-center justify-center sm:justify-start gap-3 mb-2">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 leading-tight">{user.username}</h1>
                <LevelBadge level={user.level || 1} size="md" showTitle={false} />
              </div>
              <p className="text-sm md:text-base text-gray-600 mb-3 md:mb-4 px-4 sm:px-0">{user.bio || 'No bio added yet'}</p>
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                {user.skills?.map((skill: string, index: number) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Edit Button */}
            <div className="sm:self-center">
              {!editing ? (
                <button
                  onClick={() => setEditing(true)}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 md:px-6 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm md:text-base tap-target"
                >
                  <Edit className="w-4 h-4" />
                  <span className="hidden sm:inline">Edit Profile</span>
                  <span className="sm:hidden">Edit</span>
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 md:px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm md:text-base tap-target"
                  >
                    <Save className="w-4 h-4" />
                    <span className="hidden sm:inline">Save</span>
                  </button>
                  <button
                    onClick={handleCancel}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-3 md:px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm md:text-base tap-target"
                  >
                    <X className="w-4 h-4" />
                    <span className="hidden sm:inline">Cancel</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Profile Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Personal Information */}
        <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-emerald-500" />
            Personal Information
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              {editing ? (
                <input
                  type="text"
                  value={editData.username}
                  onChange={(e) => setEditData({ ...editData, username: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              ) : (
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <User className="w-4 h-4 text-gray-400" />
                  <span>{user.username}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              {editing ? (
                <input
                  type="email"
                  value={editData.email}
                  onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              ) : (
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span>{user.email}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              {editing ? (
                <input
                  type="tel"
                  value={editData.phone}
                  onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Enter phone number"
                />
              ) : (
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span>{user.phone || 'No phone number'}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              {editing ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editData.location}
                    onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                    className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Enter your location"
                  />
                  <button
                    type="button"
                    onClick={handleGetLocation}
                    disabled={fetchingLocation}
                    className="px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    title="Get current location"
                  >
                    {fetchingLocation ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <MapPin className="w-5 h-5" />
                    )}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span>{user.location || 'No location set'}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Skills and Bio */}
        <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-500" />
            Skills & Bio
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
              {editing ? (
                <textarea
                  value={editData.bio}
                  onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                  rows={4}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Tell others about yourself..."
                />
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg min-h-[100px]">
                  <p className="text-gray-700">{user.bio || 'No bio added yet'}</p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Skills</label>
              {editing ? (
                <input
                  type="text"
                  value={editData.skills}
                  onChange={(e) => setEditData({ ...editData, skills: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Enter skills separated by commas"
                />
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg">
                  {user.skills && user.skills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {user.skills.map((skill: string, index: number) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No skills added yet</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Section */}
      <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Lock className="w-5 h-5 text-emerald-500" />
            Security
          </h2>
          <button
            onClick={() => setShowPasswordForm(!showPasswordForm)}
            className="text-sm px-3 py-1.5 rounded-lg border border-emerald-500 text-emerald-600 hover:bg-emerald-50"
          >
            {showPasswordForm ? 'Hide' : 'Change Password'}
          </button>
        </div>
        {showPasswordForm && (
          <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
            {pwError && <div className="p-2 text-sm bg-red-50 border border-red-200 text-red-600 rounded">{pwError}</div>}
            {pwMessage && <div className="p-2 text-sm bg-emerald-50 border border-emerald-200 text-emerald-700 rounded">{pwMessage}</div>}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Password (mock)</label>
              <input type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="(Optional in mock mode)" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={pwLoading} className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2">
                {pwLoading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                Save Password
              </button>
              <button type="button" onClick={() => { setShowPasswordForm(false); setPwError(''); setPwMessage(''); }} className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm">Cancel</button>
            </div>
            <p className="text-xs text-gray-500">In production with Firebase this will require re-auth and securely update your password.</p>
          </form>
        )}
      </div>

      {/* Emergency Contacts */}
      <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Shield className="w-5 h-5 text-red-500" />
            Emergency Contacts
          </h2>
          <button
            onClick={() => setShowAddContact(true)}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors tap-target"
          >
            <Plus className="w-4 h-4" />
            Add Contact
          </button>
        </div>

        {/* Emergency Contacts List */}
        <div className="space-y-3">
          {emergencyContacts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Shield className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p>No emergency contacts added yet</p>
              <p className="text-sm">Add contacts for quick access during emergencies</p>
            </div>
          ) : (
            emergencyContacts.map((contact) => (
              <div key={contact.id} className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-800">{contact.name}</h4>
                    {contact.isPrimary && (
                      <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium">
                        Primary
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-1">
                    <Phone className="w-3 h-3 inline mr-1" />
                    {contact.phone}
                  </p>
                  {contact.relationship && (
                    <p className="text-sm text-gray-500">{contact.relationship}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCallEmergencyContact(contact.phone)}
                    className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg transition-colors tap-target"
                    title="Call now"
                  >
                    <PhoneCall className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteEmergencyContact(contact.id)}
                    className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-colors tap-target"
                    title="Delete contact"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add Contact Modal */}
        {showAddContact && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-800">Add Emergency Contact</h3>
                <button
                  onClick={() => setShowAddContact(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    value={newContact.name}
                    onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="Enter contact name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    value={newContact.phone}
                    onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                      newContact.phone && !validatePhoneNumber(newContact.phone)
                        ? 'border-red-300 bg-red-50'
                        : 'border-gray-300'
                    }`}
                    placeholder="+1-555-123-4567"
                    required
                  />
                  {newContact.phone && !validatePhoneNumber(newContact.phone) && (
                    <p className="text-sm text-red-600 mt-1">Please enter a valid phone number</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Relationship</label>
                  <select
                    value={newContact.relationship}
                    onChange={(e) => setNewContact({ ...newContact, relationship: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="">Select relationship</option>
                    <option value="Family">Family</option>
                    <option value="Friend">Friend</option>
                    <option value="Colleague">Colleague</option>
                    <option value="Neighbor">Neighbor</option>
                    <option value="Doctor">Doctor</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isPrimary"
                    checked={newContact.isPrimary}
                    onChange={(e) => setNewContact({ ...newContact, isPrimary: e.target.checked })}
                    className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500"
                  />
                  <label htmlFor="isPrimary" className="ml-2 text-sm text-gray-700">
                    Set as primary emergency contact
                  </label>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddContact(false)}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddEmergencyContact}
                  disabled={!newContact.name || !newContact.phone || !validatePhoneNumber(newContact.phone)}
                  className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-colors"
                >
                  Add Contact
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Level Progress Section */}
      {user && (() => {
        const currentExperience = user.experience_points || 0;
        const servicesCompleted = user.services_completed || 0;
        const currentLevel = user.level || 1;

        return (
          <>
            {/* New Detailed Level Progress Component */}
            <LevelProgressDetail
              currentLevel={currentLevel}
              currentExperience={currentExperience}
              servicesCompleted={servicesCompleted}
            />

            {/* All Unlocked Perks */}
            <div className="bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 rounded-2xl shadow-lg p-6 border-2 border-cyan-500/30"
              style={{
                boxShadow: '0 0 40px rgba(34, 211, 238, 0.2)'
              }}
            >
              {(() => {
                const progress = getLevelProgress(currentExperience, servicesCompleted);
                return <LevelPerkList perks={progress.unlockedPerks} />;
              })()}
            </div>
          </>
        );
      })()}

      {/* Reviews Section */}
      <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500" />
            Reviews Received ({user?.total_reviews || 0})
          </h2>
          <div className="text-right">
            <div className="text-sm text-gray-600">Average Rating</div>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span className="font-semibold text-gray-800">
                {user?.reputation_score?.toFixed(1) || '0.0'}
              </span>
            </div>
          </div>
        </div>

        {reviewsLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Star className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p>No reviews yet</p>
            <p className="text-sm">Complete your first service to receive reviews</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                      {review.reviewer?.avatar_url ? (
                        <img
                          src={review.reviewer.avatar_url}
                          alt={review.reviewer.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">
                        {review.reviewer?.username || 'Anonymous'}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {new Date(review.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < review.rating
                            ? 'text-amber-500 fill-amber-500'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-gray-700 leading-relaxed">{review.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Activity Stats */}
      <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-emerald-500" />
          Activity Overview
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-emerald-50 rounded-lg">
            <div className="text-2xl font-bold text-emerald-600">0</div>
            <div className="text-sm text-gray-600">Services Offered</div>
          </div>
          <div className="text-center p-4 bg-cyan-50 rounded-lg">
            <div className="text-2xl font-bold text-cyan-600">0</div>
            <div className="text-sm text-gray-600">Bookings Made</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">0</div>
            <div className="text-sm text-gray-600">Reviews Given</div>
          </div>
        </div>
      </div>
    </div>
  );
};
