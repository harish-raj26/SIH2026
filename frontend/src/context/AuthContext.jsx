import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { USER_ROLES } from '../utils/constants';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const currentUser = authService.getCurrentUser();
      const storedToken = localStorage.getItem('bizclear_auth_token');
      if (currentUser && storedToken) {
        setUser(currentUser);
        setToken(storedToken);
      } else {
        setUser(null);
        setToken(null);
      }
    } catch (e) {
      console.error('Auth initialization error:', e);
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (credentials) => {
    setLoading(true);
    try {
      const result = await authService.login(credentials);
      setUser(result.user);
      setToken(result.token);
      return result;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      const result = await authService.register(userData);
      setUser(result.user);
      setToken(result.token);
      return result;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setToken(null);
  };

  const switchRole = (newRole) => {
    if (!user) return;
    const updatedUser = {
      ...user,
      role: newRole,
    };
    const updated = authService.switchUser(updatedUser);
    setUser(updated);
  };

  const updateProfile = (updates) => {
    if (!user) return null;
    const updated = authService.updateProfile(updates);
    setUser(updated);
    return updated;
  };

  const isApplicant = user?.role === USER_ROLES.APPLICANT;
  const isOfficer = user?.role === USER_ROLES.OFFICER;
  const isAdmin = user?.role === USER_ROLES.ADMIN;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user && !!token,
        role: user?.role || USER_ROLES.APPLICANT,
        isApplicant,
        isOfficer,
        isAdmin,
        login,
        register,
        logout,
        switchRole,
        updateProfile,
      }}
    >
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
