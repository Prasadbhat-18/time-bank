export interface User {
  id: string;
  email: string;
  username: string;
  bio: string;
  avatar_url?: string;
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