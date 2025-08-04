'use client';

import dynamic from 'next/dynamic';
import React, { useState, useEffect, useCallback } from 'react';
import { Store, TableHeader } from '@/types';
import { getStores, addStore, updateStore, deleteStore } from '@/services/apiClient';
import Modal from '@/components/Modal';
import Table from '@/components/Table';
import LoadingSpinner from '@/components/LoadingSpinner';
import { UI_TEXT } from '@/constants';
import { useAuth } from '@/contexts/AuthContext';
import { PlusCircleIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

const initialStoreFormState: Omit<Store, 'id'> = {
  name: '',
  address: '',
  phone: '',
};

interface StoreFormProps {
  store?: Store | null;
  onSave: (storeData: Store | Omit<Store, 'id'>) => void;
  onCancel: () => void;
}

const StoreForm: React.FC<StoreFormProps> = ({ store, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Store | Omit<Store, 'id'>>(
    store ? { ...initialStoreFormState, ...store } : initialStoreFormState
  );

  useEffect(() => {
    setFormData(store ? { ...initialStoreFormState, ...store } : initialStoreFormState);
  }, [store]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">{UI_TEXT.STORE_NAME}</label>
        <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
      </div>
      <div>
        <label htmlFor="address" className="block text-sm font-medium text-gray-700">{UI_TEXT.STORE_ADDRESS}</label>
        <input type="text" name="address" id="address" value={formData.address || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
      </div>
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">{UI_TEXT.STORE_PHONE}</label>
        <input type="tel" name="phone" id="phone" value={formData.phone || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
      </div>
      <div className="flex justify-end space-x-3 pt-4">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-md shadow-sm">{UI_TEXT.CANCEL}</button>
        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 border border-transparent rounded-md shadow-sm">{UI_TEXT.SAVE}</button>
      </div>
    </form>
  );
};

const StoreManagementPageComponent: React.FC = () => {
  const { currentUser } = useAuth();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState<Store | null>(null);

  const fetchStores = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getStores();
      setStores(data);
    } catch (err) {
      console.error('Error loading stores:', err);
      setError('店舗データの読み込みに失敗しました。');
      setStores([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  const handleOpenModal = (store?: Store) => {
    setEditingStore(store || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingStore(null);
  };

  const handleSaveStore = async (storeData: Store | Omit<Store, 'id'>) => {
    try {
      if ('id' in storeData) {
        // 更新
        await updateStore(storeData as Store);
      } else {
        // 新規作成
        await addStore(storeData as Omit<Store, 'id'>);
      }
      await fetchStores();
      handleCloseModal();
    } catch (err) {
      console.error('Error saving store:', err);
      setError('店舗の保存に失敗しました。');
    }
  };

  const handleDeleteStore = async (store: Store) => {
    try {
      await deleteStore(store.id);
      await fetchStores();
      setShowConfirmDelete(null);
    } catch (err) {
      console.error('Error deleting store:', err);
      setError('店舗の削除に失敗しました。');
    }
  };

  const tableHeaders: TableHeader<Store>[] = [
    { key: 'name', label: UI_TEXT.STORE_NAME },
    { key: 'address', label: UI_TEXT.STORE_ADDRESS },
    { key: 'phone', label: UI_TEXT.STORE_PHONE },
    { key: 'actions', label: '操作', render: (store) => (
      <div className="flex space-x-2">
        <button onClick={() => handleOpenModal(store)} className="text-blue-600 hover:text-blue-800">
          <PencilIcon className="h-4 w-4" />
        </button>
        <button onClick={() => setShowConfirmDelete(store)} className="text-red-600 hover:text-red-800">
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>
    ) },
  ];

  if (loading) return <LoadingSpinner message="店舗データを読み込み中..." />;

  return (
    <div className="space-y-8">
      {/* ヘッダー */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">店舗管理</h1>
            <p className="text-gray-600 mt-2">店舗情報の登録・編集・削除を行います</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-sm hover:bg-blue-700 transition-colors flex items-center"
          >
            <PlusCircleIcon className="h-5 w-5 mr-2" />
            新規店舗追加
          </button>
        </div>
      </div>

      {/* エラーメッセージ */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* 店舗一覧 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">店舗一覧</h2>
        {stores.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>店舗が登録されていません</p>
            <p className="text-sm mt-2">「新規店舗追加」ボタンから店舗を追加してください</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table headers={tableHeaders} data={stores} itemKey="id" />
          </div>
        )}
      </div>

      {/* モーダル */}
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingStore ? '店舗編集' : '新規店舗追加'}>
        <StoreForm store={editingStore} onSave={handleSaveStore} onCancel={handleCloseModal} />
      </Modal>

      {/* 削除確認モーダル */}
      <Modal isOpen={!!showConfirmDelete} onClose={() => setShowConfirmDelete(null)} title="店舗削除確認">
        <div className="space-y-4">
          <p>「{showConfirmDelete?.name}」を削除しますか？</p>
          <p className="text-sm text-gray-600">この操作は取り消せません。</p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowConfirmDelete(null)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-md"
            >
              キャンセル
            </button>
            <button
              onClick={() => showConfirmDelete && handleDeleteStore(showConfirmDelete)}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 border border-transparent rounded-md"
            >
              削除
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// 動的インポートでSSRを無効化
const StoreManagementPage = dynamic(() => Promise.resolve(StoreManagementPageComponent), {
  ssr: false,
});

export default StoreManagementPage; 