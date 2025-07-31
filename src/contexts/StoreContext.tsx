'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { Store, UserRole } from '../types';
import { getStores } from '../services/apiClient';
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
    
    const fetchStores = async () => {
      try {
        console.log('StoreProvider: Fetching stores...');
        const fetchedStores = await getStores();
        console.log('StoreProvider: Stores fetched successfully:', fetchedStores);
        setStores(fetchedStores);
      } catch (err) {
        console.error('StoreProvider: Error fetching stores:', err);
        setError('店舗情報の取得に失敗しました。');
      } finally {
        setLoading(false);
      }
    };
    
    fetchStores();
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
