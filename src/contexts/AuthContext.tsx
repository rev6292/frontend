'use client';

import React, { useState, createContext, useContext, useMemo, useCallback, ReactNode } from 'react';
import { User } from '../types';
import { authenticateUser } from '../services/apiClient'; // apiClientを使用

interface AuthContextType {
  currentUser: User | null;
  login: (id: string, password?: string) => Promise<void>;
  logout: () => void;
  setCurrentUser: (user: User | null) => void; // Keep for profile updates
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    // 初期化時にlocalStorageからユーザー情報を取得
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('currentUser');
      if (savedUser) {
        try {
          return JSON.parse(savedUser);
        } catch (error) {
          console.error('Error parsing saved user:', error);
          localStorage.removeItem('currentUser');
        }
      }
    }
    return null;
  });

  const login = useCallback(async (id: string, password?: string) => {
    try {
      console.log('AuthContext: Starting login process for user:', id);
      // PHPバックエンドの認証APIを呼び出す
      const user = await authenticateUser(id, password);
      console.log('AuthContext: User authenticated successfully:', user);
      setCurrentUser(user);
      // localStorageにユーザー情報を保存
      if (typeof window !== 'undefined') {
        localStorage.setItem('currentUser', JSON.stringify(user));
      }
      console.log('AuthContext: currentUser set to:', user);
    } catch (error) {
      console.error("Login failed:", error);
      throw error; // Re-throw to be handled by the caller (e.g., LoginPage)
    }
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
    // localStorageからユーザー情報を削除
    if (typeof window !== 'undefined') {
      localStorage.removeItem('currentUser');
    }
  }, []);
  
  const updateUserInContext = (updatedUser: User | null) => {
    setCurrentUser(prevUser => {
      let newUser: User | null;
      
      // Handles logout
      if (updatedUser === null) {
        newUser = null;
      }
      // Handles profile updates by merging properties
      else if (prevUser && prevUser.id === updatedUser.id) {
        newUser = { ...prevUser, ...updatedUser };
      }
      // Handles login and role switching by replacing the user object
      else {
        newUser = updatedUser;
      }
      
      // localStorageを更新
      if (typeof window !== 'undefined') {
        if (newUser) {
          localStorage.setItem('currentUser', JSON.stringify(newUser));
        } else {
          localStorage.removeItem('currentUser');
        }
      }
      
      return newUser;
    });
  };

  const value = useMemo(() => ({ currentUser, login, logout, setCurrentUser: updateUserInContext }), [currentUser, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
