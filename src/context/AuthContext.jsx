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
    try {
      const storedUser = localStorage.getItem('currentUser');
      const accessToken = localStorage.getItem('accessToken');
      if (storedUser && accessToken) {
        const parsedUser = JSON.parse(storedUser);
        apiService.setToken(accessToken);
        console.log('Restored user from localStorage:', parsedUser?.name);
        setCurrentUser(parsedUser);
      }
    } catch (error) {
      console.error('Error parsing stored user:', error);
      localStorage.removeItem('currentUser');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    console.log('Login attempt:', email, password);

    try {
      const user = await apiService.login(email, password);
      setCurrentUser(user);
      localStorage.setItem('currentUser', JSON.stringify(user));
      console.log('Login successful for user:', user.name);
      return user;
    } catch (error) {
      console.error('Login failed:', error);
      throw new Error('Noto\'g\'ri email yoki parol');
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

      // Add student-specific fields
      if (userData.role === 'student') {
        apiData.grade = userData.grade;
        apiData.direction = userData.direction;
      }

      const savedUser = await apiService.register(apiData);

      // Update state
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

  const value = {
    currentUser,
    isLoading,
    login,
    logout,
    register,
    updateProfile,
    isAuthenticated: !!currentUser,
    isAdmin: currentUser?.role === 'admin',
    isTeacher: currentUser?.role === 'teacher',
    isStudent: currentUser?.role === 'student'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};