'use client';

import React, { useState, useEffect } from 'react';
import apiClient from '@/services/apiClient';
import { Supplier } from '@/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import { UI_TEXT } from '@/constants';
import Modal from '@/components/Modal';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

const SupplierManagementTab: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newContactPerson, setNewContactPerson] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newLineId, setNewLineId] = useState('');
  const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.get('/suppliers');
      setSuppliers(data);
    } catch (err) {
      console.error('Failed to fetch suppliers:', err);
      setError(UI_TEXT.ERROR_LOADING_DATA);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEditSupplier = async () => {
    setError(null);
    setLoading(true);
    try {
      const supplierData = {
        name: newSupplierName,
        contactPerson: newContactPerson,
        phone: newPhone,
        email: newEmail,
        address: newAddress,
        lineId: newLineId,
      };

      if (editingSupplier) {
        // Update existing supplier
        await apiClient.put('/suppliers', { ...supplierData, id: editingSupplier.id });
      } else {
        // Add new supplier
        await apiClient.post('/suppliers', supplierData);
      }
      setIsModalOpen(false);
      resetForm();
      fetchSuppliers(); // Refresh list
    } catch (err) {
      console.error('Failed to save supplier:', err);
      setError(UI_TEXT.ERROR_PREFIX + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSupplier = async () => {
    if (!supplierToDelete) return;
    setLoading(true);
    setError(null);
    try {
      await apiClient.delete(`/suppliers?id=${supplierToDelete.id}`);
      setIsConfirmDeleteModalOpen(false);
      setSupplierToDelete(null);
      fetchSuppliers(); // Refresh list
    } catch (err) {
      console.error('Failed to delete supplier:', err);
      setError(UI_TEXT.ERROR_PREFIX + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingSupplier(null);
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setNewSupplierName(supplier.name);
    setNewContactPerson(supplier.contactPerson || '');
    setNewPhone(supplier.phone || '');
    setNewEmail(supplier.email || '');
    setNewAddress(supplier.address || '');
    setNewLineId(supplier.lineId || '');
    setIsModalOpen(true);
  };

  const openConfirmDeleteModal = (supplier: Supplier) => {
    setSupplierToDelete(supplier);
    setIsConfirmDeleteModalOpen(true);
  };

  const resetForm = () => {
    setNewSupplierName('');
    setNewContactPerson('');
    setNewPhone('');
    setNewEmail('');
    setNewAddress('');
    setNewLineId('');
  };

  if (loading) return <LoadingSpinner message={UI_TEXT.LOADING} />;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-700">仕入先管理</h2>
        <button
          onClick={openAddModal}
          className="px-4 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700 flex items-center space-x-2"
        >
          <PlusIcon className="h-5 w-5" />
          <span>新規追加</span>
        </button>
      </div>

      {suppliers.length === 0 ? (
        <p className="text-gray-500">仕入先が登録されていません。</p>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">仕入先名</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">担当者</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">電話番号</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">メール</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">住所</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">LINE ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {suppliers.map((supplier) => (
                <tr key={supplier.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{supplier.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{supplier.contactPerson || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{supplier.phone || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{supplier.email || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{supplier.address || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{supplier.lineId || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => openEditModal(supplier)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => openConfirmDeleteModal(supplier)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Supplier Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSupplier ? '仕入先を編集' : '新しい仕入先を追加'}
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">仕入先名 <span className="text-red-500">*</span></label>
            <input
              type="text"
              id="name"
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
              value={newSupplierName}
              onChange={(e) => setNewSupplierName(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="contactPerson" className="block text-sm font-medium text-gray-700">担当者名</label>
            <input
              type="text"
              id="contactPerson"
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
              value={newContactPerson}
              onChange={(e) => setNewContactPerson(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">電話番号</label>
            <input
              type="text"
              id="phone"
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">メールアドレス</label>
            <input
              type="email"
              id="email"
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700">住所</label>
            <input
              type="text"
              id="address"
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="lineId" className="block text-sm font-medium text-gray-700">LINE ID</label>
            <input
              type="text"
              id="lineId"
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
              value={newLineId}
              onChange={(e) => setNewLineId(e.target.value)}
            />
          </div>
          <div className="flex justify-end space-x-2 mt-4">
            <button
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400"
            >
              キャンセル
            </button>
            <button
              onClick={handleAddEditSupplier}
              className="px-4 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700"
            >
              {editingSupplier ? '更新' : '追加'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Confirm Delete Modal */}
      <Modal
        isOpen={isConfirmDeleteModalOpen}
        onClose={() => setIsConfirmDeleteModalOpen(false)}
        title="仕入先の削除確認"
      >
        <div className="space-y-4">
          <p>仕入先「{supplierToDelete?.name}」を本当に削除しますか？この操作は元に戻せません。</p>
          <div className="flex justify-end space-x-2 mt-4">
            <button
              onClick={() => setIsConfirmDeleteModalOpen(false)}
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400"
            >
              キャンセル
            </button>
            <button
              onClick={handleDeleteSupplier}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              削除
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SupplierManagementTab;