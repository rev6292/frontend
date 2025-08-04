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

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStores = async () => {
      setLoading(true);
      setError(null);
      try {
        const fetchedStores = await apiClient.get('/stores');
        setStores(fetchedStores);
      } catch (err) {
        setError('店舗情報の読み込みに失敗しました。');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStores();
  }, []);

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
