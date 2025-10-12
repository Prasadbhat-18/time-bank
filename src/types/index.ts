export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  isPrimary?: boolean;
}

export interface User {
  id: string;
  email: string;
  username: string;
  bio: string;
  avatar_url?: string;
  phone?: string;
  location?: string;
  skills?: string[];
  emergency_contacts?: EmergencyContact[];
  reputation_score: number;
  total_reviews: number;
  created_at: string;
}

export interface TimeCredit {
  id: string;
  user_id: string;
  balance: number;
  total_earned: number;
  total_spent: number;
  updated_at: string;
}

export interface Skill {
  id: string;
  name: string;
  category: string;
}

export interface UserSkill {
  id: string;
  user_id: string;
  skill_id: string;
  skill?: Skill;
  type: 'offered' | 'needed';
  proficiency_level: 'beginner' | 'intermediate' | 'expert';
}

export interface Service {
  id: string;
  provider_id: string;
  provider?: User;
  skill_id: string;
  skill?: Skill;
  title: string;
  description: string;
  credits_per_hour: number;
  status: 'active' | 'inactive' | 'completed';
  type: 'offer' | 'request';
  created_at: string;
}

export interface Booking {
  id: string;
  service_id: string;
  service?: Service;
  provider_id: string;
  provider?: User;
  requester_id: string;
  requester?: User;
  scheduled_start: string;
  scheduled_end: string;
  duration_hours: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  confirmation_status: 'pending' | 'awaiting_provider' | 'provider_confirmed' | 'both_confirmed' | 'confirmed' | 'declined';
  credits_held?: number; // Credits reserved but not yet transferred
  credits_transferred?: boolean; // Whether credits have been moved
  provider_notes?: string; // Notes from provider when confirming/declining
  confirmed_at?: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  from_user_id?: string;
  from_user?: User;
  to_user_id?: string;
  to_user?: User;
  booking_id?: string;
  amount: number;
  transaction_type: 'service_completed' | 'signup_bonus' | 'adjustment';
  description: string;
  created_at: string;
}

export interface Review {
  id: string;
  booking_id: string;
  reviewer_id: string;
  reviewer?: User;
  reviewee_id: string;
  reviewee?: User;
  rating: number;
  comment: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender?: User;
  content: string;
  message_type: 'text' | 'terms_proposal' | 'terms_agreement' | 'system';
  is_ai_generated?: boolean;
  created_at: string;
}

export interface ChatConversation {
  id: string;
  service_id?: string;
  service?: Service;
  booking_id?: string;
  booking?: Booking;
  participants: string[]; // Array of user IDs
  title: string;
  last_message?: ChatMessage;
  terms_agreed?: boolean;
  terms_content?: string;
  created_at: string;
  updated_at: string;
}