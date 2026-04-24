import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '@/lib/api';
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '@/config/roleGovernance';

const AuthContext = createContext(null);

export { DEMO_ACCOUNTS, DEMO_PASSWORD };

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const normalizedEmail = email.trim().toLowerCase();
    const demoUser = DEMO_ACCOUNTS[normalizedEmail];
    const isDemoLogin = Boolean(demoUser) && password === DEMO_PASSWORD;

    // Allow demo login on ANY domain (localhost, Vercel preview, etc.)
    // This lets stakeholders/team review the system without a live backend.
    if (isDemoLogin) {
      localStorage.setItem('token', 'demo-token-' + normalizedEmail);
      localStorage.setItem('user', JSON.stringify(demoUser));
      setUser(demoUser);
      return demoUser;
    }

    try {
      const response = await authAPI.login({ email, password });
      const { access_token, user: userData } = response.data;
      
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      
      return userData;
    } catch (error) {
      throw error;
    }
  };

  const register = async (data) => {
    const response = await authAPI.register(data);
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const isAuthenticated = !!user;

  const hasRole = (roles) => {
    if (!user) return false;
    if (typeof roles === 'string') return user.role === roles;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAuthenticated, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
