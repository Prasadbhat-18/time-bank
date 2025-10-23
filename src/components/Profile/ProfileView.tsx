import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Camera, Edit, Save, X, User, Mail, Phone, MapPin, Award, Clock, Shield, Plus, Trash2, PhoneCall, Lock, Star } from 'lucide-react';
import { EmergencyContact, Review } from '../../types';
import { LevelPerkList, LevelBadge } from '../Level/LevelProgress';
import LevelProgressDetail from '../Level/LevelProgressDetail';
import { getLevelProgress } from '../../services/levelService';
import { useGeolocation } from '../../hooks/useGeolocation';
import { dataService } from '../../services/dataService';

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  
  // Geolocation hook
  const { getCurrentLocation } = useGeolocation();
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
    const handleRefresh = () => {
      if (user?.id) {
        loadReviews();
      }
    };

    window.addEventListener('timebank:refreshProfileAndDashboard', handleRefresh);
    return () => window.removeEventListener('timebank:refreshProfileAndDashboard', handleRefresh);
  }, [user?.id]);

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
    console.log('handleSave called');
    if (user) {
      console.log('Current user:', user);
      console.log('Edit data:', editData);
      
      // First try to update just basic fields
      try {
        const basicFields = {
          username: editData.username,
          bio: editData.bio,
          location: editData.location
        };
        
        console.log('Attempting to save basic fields first:', basicFields);
        await updateUser(basicFields);
        
        // If basic update succeeds, try updating contact info
        const contactFields = {
          email: editData.email,
          phone: editData.phone
        };
        
        console.log('Attempting to save contact fields:', contactFields);
        await updateUser(contactFields);
        
        // If both succeed, update skills and emergency contacts
        const additionalFields = {
          skills: editData.skills.split(',').map((s: string) => s.trim()).filter((s: string) => s),
          emergency_contacts: emergencyContacts
        };
        
        console.log('Attempting to save additional fields:', additionalFields);
        await updateUser(additionalFields);
        
        console.log('Profile updated successfully in AuthContext');
        alert('Profile updated successfully!');
        setEditing(false);
      } catch (error: any) {
        console.error('Failed to update profile:', error);
        // Try to provide more specific error message
        const errorMsg = error.message || 'Unknown error';
        if (errorMsg.includes('permission')) {
          alert('Permission error: Make sure you are properly logged in and try again. If the problem persists, try logging out and back in.');
        } else {
          alert(`Failed to update profile: ${errorMsg}. Please try again.`);
        }
      }
    } else {
      console.error('No user found when trying to save');
      alert('Error: No user session found. Please log in again.');
    }
  };

  // Rest of the component...