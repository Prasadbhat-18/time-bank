import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { dataService } from '../services/dataService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username: string) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUserId = localStorage.getItem('timebank_user_id');
    if (storedUserId) {
      dataService.getCurrentUser(storedUserId).then((user) => {
        setUser(user);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const user = await dataService.login(email, password);
    if (user) {
      setUser(user);
      localStorage.setItem('timebank_user_id', user.id);
    } else {
      throw new Error('Invalid credentials');
    }
  };

  const register = async (email: string, password: string, username: string) => {
    const user = await dataService.register(email, password, username);
    setUser(user);
    localStorage.setItem('timebank_user_id', user.id);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('timebank_user_id');
  };

  const updateUser = async (updates: Partial<User>) => {
    if (user) {
      const updatedUser = await dataService.updateProfile(user.id, updates);
      setUser(updatedUser);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};