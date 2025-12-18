import React, { createContext, useContext, useState, useEffect } from 'react';
import apiService from '../data/apiService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for stored user on app load
  useEffect(() => {
    const checkStoredUser = async () => {
      try {
        const storedUser = localStorage.getItem('currentUser');
        const accessToken = localStorage.getItem('accessToken');
        if (storedUser && accessToken) {
          const parsedUser = JSON.parse(storedUser);
          apiService.setToken(accessToken);

          // Check if user is still valid and not banned
          try {
            // You could add a user validation endpoint here if needed
            // For now, we'll trust the stored data but check ban status
            if (parsedUser.is_banned) {
              console.log('Stored user is banned, clearing data');
              localStorage.removeItem('currentUser');
              localStorage.removeItem('accessToken');
              localStorage.removeItem('refreshToken');
              setCurrentUser(null);
            } else {
              console.log('Restored user from localStorage:', parsedUser?.name);
              setCurrentUser(parsedUser);
            }
          } catch (validationError) {
            console.log('User validation failed, clearing stored data');
            localStorage.removeItem('currentUser');
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            setCurrentUser(null);
          }
        }
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('currentUser');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      } finally {
        setIsLoading(false);
      }
    };

    checkStoredUser();
  }, []);

  const login = async (email, password) => {
    console.log('Login attempt:', email, password);

    try {
      const user = await apiService.login(email, password);

      // Check if user is banned
      if (user.is_banned) {
        console.log('User is banned, login blocked');
        // Don't set currentUser for banned users
        // The LoginPage will handle showing the UnbanModal
        return user; // Still return user so LoginPage can check ban status
      }

      setCurrentUser(user);
      localStorage.setItem('currentUser', JSON.stringify(user));
      console.log('Login successful for user:', user.name);
      return user;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = () => {
    apiService.logout();
    setCurrentUser(null);
  };

  const register = async (userData) => {
    try {
      // Prepare data for API
      const apiData = {
        username: userData.email, // Django uses username, we'll use email
        email: userData.email,
        password: userData.password,
        name: `${userData.first_name} ${userData.last_name}`,
        first_name: userData.first_name,
        last_name: userData.last_name,
        role: userData.role,
      };

      // Add organization for admin registration
      if (userData.role === 'admin' && userData.organization) {
        apiData.organization = userData.organization;
      }

      // Add student-specific fields
      if (userData.role === 'student') {
        apiData.grade = userData.grade;
        apiData.direction = userData.direction;
      }

      const savedUser = await apiService.register(apiData);

      // For admin registration, don't auto-login - they need to choose a plan first
      if (userData.role === 'admin') {
        return savedUser; // Return user data without setting current user
      }

      // Update state for other roles
      setCurrentUser(savedUser);
      localStorage.setItem('currentUser', JSON.stringify(savedUser));
      return savedUser;
    } catch (error) {
      console.error('Registration failed:', error);
      throw new Error('Ro\'yxatdan o\'tishda xatolik yuz berdi');
    }
  };

  const updateProfile = async (updates) => {
    if (!currentUser) return;

    try {
      const updatedUser = await apiService.updateUser(currentUser.id, updates);
      setCurrentUser(updatedUser);
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    } catch (error) {
      console.error('Profile update failed:', error);
      throw error;
    }
  };

  const setCurrentUserData = (userData) => {
    setCurrentUser(userData);
    localStorage.setItem('currentUser', JSON.stringify(userData));
  };

  const unbanWithCode = async (code) => {
    try {
      const updatedUser = await apiService.unbanWithCode(code);
      setCurrentUser(updatedUser);
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      return updatedUser;
    } catch (error) {
      console.error('Unban failed:', error);
      throw error;
    }
  };

  const banCurrentUser = async (reason) => {
    try {
      const updatedUser = await apiService.banCurrentUser(reason);
      setCurrentUser(updatedUser);
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      return updatedUser;
    } catch (error) {
      console.error('Ban failed:', error);
      throw error;
    }
  };

  const value = {
    currentUser,
    isLoading,
    login,
    logout,
    register,
    updateProfile,
    setCurrentUserData,
    unbanWithCode,
    banCurrentUser,
    isAuthenticated: !!currentUser,
    isHeadAdmin: currentUser?.role === 'head_admin',
    isAdmin: currentUser?.role === 'admin',
    isTeacher: currentUser?.role === 'teacher',
    isStudent: currentUser?.role === 'student',
    isBanned: currentUser?.is_banned || false
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};