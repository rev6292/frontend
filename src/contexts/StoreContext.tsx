'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { Store, UserRole } from '../types';
import apiClient from '../services/apiClient';
import { useAuth } from './AuthContext';

interface StoreContextType {
  stores: Store[];
  selectedStoreId: string; // 'all' or a specific store ID
  setSelectedStoreId: (storeId: string) => void;
  loading: boolean;
  error: string | null;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const useStore = (): StoreContextType => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};

// モック店舗データ（開発用）
const mockStores: Store[] = [
  { id: 'store1', name: 'メイン店舗', address: '東京都渋谷区...', phone: '03-1234-5678' },
  { id: 'store2', name: 'サブ店舗', address: '東京都新宿区...', phone: '03-8765-4321' },
];

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // ログインしていない場合は店舗情報を設定しない
    if (!currentUser) {
      setLoading(false);
      setStores([]);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('StoreProvider: Fetching stores...');
      const fetchStores = async () => {
        try {
          const fetchedStores = await apiClient.get('/stores');
          console.log('StoreProvider: Stores fetched successfully:', fetchedStores);
          setStores(fetchedStores);
        } catch (err) {
          console.error('StoreProvider: Error fetching stores:', err);
          console.log('StoreProvider: Using mock stores as fallback');
          setStores(mockStores);
          setError(null);
        } finally {
          setLoading(false);
        }
      };
      
      fetchStores();
    } catch (err) {
      console.error('StoreProvider: Error in useEffect:', err);
      setStores(mockStores);
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser?.role === UserRole.STAFF && currentUser.storeId) {
      setSelectedStoreId(currentUser.storeId);
    } else if (currentUser?.role === UserRole.ADMIN) {
      // Admin can default to 'all' or persist selection. 'all' is safer.
      setSelectedStoreId('all');
    }
  }, [currentUser]);

  const handleSetSelectedStoreId = (storeId: string) => {
    if (currentUser?.role === UserRole.ADMIN) {
      setSelectedStoreId(storeId);
    }
    // Staff cannot change their store
  };

  const value = useMemo(
    () => ({
      stores,
      selectedStoreId,
      setSelectedStoreId: handleSetSelectedStoreId,
      loading,
      error,
    }),
    [stores, selectedStoreId, loading, error, currentUser]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
};
