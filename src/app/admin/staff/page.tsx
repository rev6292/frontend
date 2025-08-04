'use client';

import dynamic from 'next/dynamic';
import React, { useState, useEffect, useCallback } from 'react';
import { User, UserRole, TableHeader, Store } from '@/types';
import { getStaffUsers, addStaffUser, updateStaffUser, deleteStaffUser, getStores } from '@/services/apiClient';
import Modal from '@/components/Modal';
import Table from '@/components/Table';
import LoadingSpinner from '@/components/LoadingSpinner';
import { UI_TEXT } from '@/constants';
import { useAuth } from '@/contexts/AuthContext';
import { PlusCircleIcon, PencilIcon, TrashIcon, ShieldCheckIcon, UserIcon, BuildingStorefrontIcon } from '@heroicons/react/24/outline';
import ErrorMessage from '@/components/ErrorMessage';

interface StaffFormState extends Omit<User, 'id' | 'hashedPassword'> {
  password?: string;
  confirmPassword?: string;
}

const initialStaffFormState: StaffFormState = {
  name: '',
  role: UserRole.STAFF,
  storeId: '',
  password: '',
  confirmPassword: '',
};

interface StaffFormProps {
  staffMember?: User | null;
  stores: Store[];
  onSave: (staffData: StaffFormState, originalId?: string) => void;
  onCancel: () => void;
  loading?: boolean;
}

const StaffForm: React.FC<StaffFormProps> = ({ staffMember, stores, onSave, onCancel, loading = false }) => {
  const [formData, setFormData] = useState<StaffFormState>(initialStaffFormState);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    if (staffMember) {
      setFormData({
        name: staffMember.name,
        role: staffMember.role,
        storeId: staffMember.storeId || '',
        password: '', // Password fields are for changing/setting new, not displaying existing
        confirmPassword: '',
      });
    } else {
      setFormData(initialStaffFormState);
    }
    setPasswordError(null);
  }, [staffMember]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'password' || name === 'confirmPassword') {
      setPasswordError(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password || (!staffMember && !formData.password)) { // Password required for new user or if password field is touched
        if (formData.password !== formData.confirmPassword) {
            setPasswordError('パスワードが一致しません。');
            return;
        }
    }
    setPasswordError(null);
    onSave(formData, staffMember?.id);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">{UI_TEXT.STAFF_NAME}</label>
        <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
      </div>
      <div>
        <label htmlFor="role" className="block text-sm font-medium text-gray-700">{UI_TEXT.ROLE}</label>
        <select name="role" id="role" value={formData.role} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
          <option value={UserRole.STAFF}>{UserRole.STAFF}</option>
          <option value={UserRole.ADMIN}>{UserRole.ADMIN}</option>
        </select>
      </div>
      <div>
        <label htmlFor="storeId" className="block text-sm font-medium text-gray-700">{UI_TEXT.ASSIGNED_STORE}</label>
        <select name="storeId" id="storeId" value={formData.storeId} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
          <option value="">{UI_TEXT.NO_STORE_ASSIGNED}</option>
          {stores.map(store => <option key={store.id} value={store.id}>{store.name}</option>)}
        </select>
         <p className="text-sm text-gray-400 mt-1">スタッフ権限のユーザーは、所属店舗のデータのみアクセス可能になります。</p>
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          {staffMember ? '新しいパスワード (変更する場合のみ)' : UI_TEXT.PASSWORD}
        </label>
        <input type="password" name="password" id="password" value={formData.password} onChange={handleChange} placeholder={staffMember ? "変更する場合のみ入力" : ""} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
      </div>
      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
          {staffMember ? '新しいパスワード (確認)' : UI_TEXT.CONFIRM_PASSWORD}
        </label>
        <input type="password" name="confirmPassword" id="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder={staffMember ? "変更する場合のみ入力" : ""} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
      </div>
      {passwordError && (
        <div className="text-red-600 text-sm">{passwordError}</div>
      )}
      <div className="flex justify-end space-x-3 pt-4">
        <button type="button" onClick={onCancel} disabled={loading} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-md shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">{UI_TEXT.CANCEL}</button>
        <button type="submit" disabled={loading} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 border border-transparent rounded-md shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
          {loading ? '保存中...' : (staffMember ? '更新' : '追加')}
        </button>
      </div>
    </form>
  );
};

const StaffManagementPageComponent: React.FC = () => {
  const { currentUser } = useAuth();
  const [staffUsers, setStaffUsers] = useState<User[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<User | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;
      setLoading(true);
      setError(null);
      try {
        const [staffData, storesData] = await Promise.all([
          getStaffUsers(),
          getStores()
        ]);
        setStaffUsers(staffData);
        setStores(storesData);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('データの読み込みに失敗しました。');
        setStaffUsers([]);
        setStores([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentUser]);

  const handleOpenModal = (staff?: User) => {
    setEditingStaff(staff || null);
    setShowModal(true);
    setError(null);
    setSuccess(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingStaff(null);
    setError(null);
    setSuccess(null);
  };

  const handleSaveStaff = async (staffData: StaffFormState, originalId?: string) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      if (originalId) {
        // Update existing staff
        const updatedStaff = await updateStaffUser({ ...staffData, id: originalId });
        setStaffUsers(prev => prev.map(s => s.id === originalId ? updatedStaff : s));
        setSuccess('スタッフが正常に更新されました。');
      } else {
        // Add new staff
        const newStaff = await addStaffUser(staffData);
        setStaffUsers(prev => [...prev, newStaff]);
        setSuccess('スタッフが正常に追加されました。');
      }
      handleCloseModal();
    } catch (err) {
      console.error('Error saving staff:', err);
      setError('スタッフの保存に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStaff = async (staff: User) => {
    if (!confirm(`スタッフ「${staff.name}」を削除しますか？`)) return;
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      await deleteStaffUser(staff.id);
      setStaffUsers(prev => prev.filter(s => s.id !== staff.id));
      setSuccess('スタッフが正常に削除されました。');
    } catch (err) {
      console.error('Error deleting staff:', err);
      setError('スタッフの削除に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  const tableHeaders: TableHeader<User>[] = [
    { key: 'name', label: '名前' },
    { key: 'role', label: '権限', render: (item) => (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        item.role === UserRole.ADMIN 
          ? 'bg-purple-100 text-purple-800' 
          : 'bg-blue-100 text-blue-800'
      }`}>
        {item.role === UserRole.ADMIN ? (
          <ShieldCheckIcon className="h-3 w-3 mr-1" />
        ) : (
          <UserIcon className="h-3 w-3 mr-1" />
        )}
        {item.role}
      </span>
    )},
    { key: 'storeId', label: '所属店舗', render: (item) => {
      const store = stores.find(s => s.id === item.storeId);
      return store ? (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          <BuildingStorefrontIcon className="h-3 w-3 mr-1" />
          {store.name}
        </span>
      ) : (
        <span className="text-gray-400 text-sm">未設定</span>
      );
    }},
    { key: 'id', label: '操作', render: (item) => (
      <div className="flex items-center space-x-2">
        <button
          onClick={() => handleOpenModal(item)}
          className="p-2 text-blue-600 hover:bg-blue-100 rounded-md"
          title="編集"
        >
          <PencilIcon className="h-4 w-4" />
        </button>
        <button
          onClick={() => handleDeleteStaff(item)}
          className="p-2 text-red-600 hover:bg-red-100 rounded-md"
          title="削除"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>
    )},
  ];

  if (loading) return <LoadingSpinner message="スタッフデータを読み込み中..." />;

  return (
    <div className="space-y-8">
      {/* ヘッダー */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">スタッフ管理</h1>
            <p className="text-gray-600 mt-2">システムユーザーの登録・編集・削除を行います</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-sm hover:bg-blue-700 transition-colors flex items-center"
          >
            <PlusCircleIcon className="h-5 w-5 mr-2" />
            新規スタッフ追加
          </button>
        </div>
      </div>

      {/* エラーメッセージ */}
      {error && <ErrorMessage message={error} />}

      {/* 成功メッセージ */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-700">{success}</p>
        </div>
      )}

      {/* スタッフリスト */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">スタッフ一覧</h2>
        </div>
        <div className="overflow-x-auto">
          {staffUsers.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <UserIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>スタッフが登録されていません</p>
              <p className="text-sm mt-2">新規スタッフを追加してください</p>
            </div>
          ) : (
            <Table headers={tableHeaders} data={staffUsers} itemKey="id" />
          )}
        </div>
      </div>

      {/* モーダル */}
      <Modal isOpen={showModal} onClose={handleCloseModal} title={editingStaff ? 'スタッフ編集' : '新規スタッフ追加'}>
        <StaffForm
          staffMember={editingStaff}
          stores={stores}
          onSave={handleSaveStaff}
          onCancel={handleCloseModal}
          loading={loading}
        />
      </Modal>
    </div>
  );
};

const StaffManagementPage = dynamic(() => Promise.resolve(StaffManagementPageComponent), { ssr: false });
export default StaffManagementPage; 