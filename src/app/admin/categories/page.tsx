'use client';

import dynamic from 'next/dynamic';
import React, { useState, useEffect, useCallback } from 'react';
import { Category } from '@/types';
import { getCategories, addCategory, updateCategory, deleteCategory } from '@/services/apiClient';
import Modal from '@/components/Modal';
import LoadingSpinner from '@/components/LoadingSpinner';
import { UI_TEXT } from '@/constants';
import { useAuth } from '@/contexts/AuthContext';
import { PlusCircleIcon, PencilIcon, TrashIcon, FolderIcon, FolderOpenIcon, ChevronRightIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import ErrorMessage from '@/components/ErrorMessage';

// 動的インポートでSSRを無効化
const CategoryManagementPage = dynamic(() => Promise.resolve(CategoryManagementPageComponent), {
  ssr: false,
});

// --- Category Form Component ---
const initialCategoryFormState: Omit<Category, 'id'> = {
  name: '',
  parentId: null,
};

interface CategoryFormProps {
  category?: Category | null;
  categories: Category[]; // All categories for parent selection
  onSave: (category: Category | Omit<Category, 'id'>) => void;
  onCancel: () => void;
  loading?: boolean;
}

const CategoryForm: React.FC<CategoryFormProps> = ({ category, categories, onSave, onCancel, loading = false }) => {
  const [formData, setFormData] = useState<Category | Omit<Category, 'id'>>(
    category ? { ...initialCategoryFormState, ...category } : initialCategoryFormState
  );

  useEffect(() => {
    setFormData(category ? { ...initialCategoryFormState, ...category } : initialCategoryFormState);
  }, [category]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value === '' ? null : value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };
  
  const hierarchicalParentOptions = React.useMemo(() => {
    // Filter out the current category and its descendants from being a possible parent
    let availableCategories = categories;
    if (category?.id) {
        const descendantIds = new Set<string>();
        const findDescendants = (parentId: string) => {
            categories.filter(c => c.parentId === parentId).forEach(child => {
                descendantIds.add(child.id);
                findDescendants(child.id);
            });
        };
        findDescendants(category.id);
        descendantIds.add(category.id); // Add itself
        availableCategories = categories.filter(c => !descendantIds.has(c.id));
    }

    const buildHierarchy = (items: Category[], parentId: string | null, level: number): { id: string, name: string, level: number }[] => {
      return items
        .filter(c => c.parentId === parentId)
        .sort((a,b) => a.name.localeCompare(b.name))
        .flatMap(child => [
          { id: child.id, name: child.name, level },
          ...buildHierarchy(items, child.id, level + 1)
        ]);
    };
    
    return buildHierarchy(availableCategories, null, 0);

  }, [categories, category]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">{UI_TEXT.CATEGORY_NAME}</label>
        <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
      </div>
      <div>
        <label htmlFor="parentId" className="block text-sm font-medium text-gray-700">{UI_TEXT.PARENT_CATEGORY}</label>
        <select name="parentId" id="parentId" value={formData.parentId || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
          <option value="">{UI_TEXT.NO_PARENT_CATEGORY}</option>
          {hierarchicalParentOptions.map(c => (
             <option key={c.id} value={c.id}>
              {''.padStart(c.level * 2, '\u00A0\u00A0')}{c.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex justify-end space-x-3 pt-4">
        <button type="button" onClick={onCancel} disabled={loading} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-md shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">{UI_TEXT.CANCEL}</button>
        <button type="submit" disabled={loading} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 border border-transparent rounded-md shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
          {loading ? '保存中...' : (category ? '更新' : '追加')}
        </button>
      </div>
    </form>
  );
};

const CategoryManagementPageComponent: React.FC = () => {
  const { currentUser } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchCategories = async () => {
      if (!currentUser) return;
      setLoading(true);
      setError(null);
      try {
        const data = await getCategories();
        
                  // データが空の場合はモックデータを追加
          if (!data || data.length === 0) {
          const mockCategories: Category[] = [
            { id: '1', name: '食品', parentId: null },
            { id: '2', name: '飲料', parentId: null },
            { id: '3', name: '菓子', parentId: '1' },
            { id: '4', name: '調味料', parentId: '1' },
            { id: '5', name: '清涼飲料', parentId: '2' },
            { id: '6', name: 'アルコール', parentId: '2' },
          ];
          setCategories(mockCategories);
        } else {
          setCategories(data);
        }
      } catch (err) {
        console.error('Error loading categories:', err);
        setError('カテゴリデータの読み込みに失敗しました。');
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, [currentUser]);

  

  const handleOpenModal = (category?: Category | null) => {
    setEditingCategory(category || null);
    setShowModal(true);
    setError(null);
    setSuccess(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setError(null);
    setSuccess(null);
  };

  const handleSaveCategory = async (categoryData: Category | Omit<Category, 'id'>) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      if (editingCategory) {
        // Update existing category
        const updatedCategory = await updateCategory({ ...categoryData, id: editingCategory.id } as Category);
        setCategories(prev => prev.map(c => c.id === editingCategory.id ? updatedCategory : c));
        setSuccess('カテゴリが正常に更新されました。');
      } else {
        // Add new category
        const newCategory = await addCategory(categoryData as Omit<Category, 'id'>);
        setCategories(prev => [...prev, newCategory]);
        setSuccess('カテゴリが正常に追加されました。');
      }
      handleCloseModal();
    } catch (err) {
      console.error('Error saving category:', err);
      setError('カテゴリの保存に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (category: Category) => {
    if (!confirm(`カテゴリ「${category.name}」を削除しますか？`)) return;
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      await deleteCategory(category.id);
      setCategories(prev => prev.filter(c => c.id !== category.id));
      setSuccess('カテゴリが正常に削除されました。');
    } catch (err) {
      console.error('Error deleting category:', err);
      setError('カテゴリの削除に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  const toggleRow = (categoryId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const renderCategoryRow = (category: Category, level: number) => {
    const hasChildren = categories.some(c => c.parentId === category.id);
    const isExpanded = expandedRows.has(category.id);
    
    return (
      <div key={category.id} className="border-b border-gray-200">
        <div className={`flex items-center justify-between p-4 ${level > 0 ? 'bg-gray-50' : 'bg-white'}`}>
          <div className="flex items-center space-x-3">
            <div style={{ marginLeft: `${level * 20}px` }} className="flex items-center space-x-2">
              {hasChildren && (
                <button
                  onClick={() => toggleRow(category.id)}
                  className="p-1 hover:bg-gray-200 rounded"
                >
                  {isExpanded ? (
                    <ChevronDownIcon className="h-4 w-4" />
                  ) : (
                    <ChevronRightIcon className="h-4 w-4" />
                  )}
                </button>
              )}
              {hasChildren ? (
                isExpanded ? <FolderOpenIcon className="h-5 w-5 text-blue-500" /> : <FolderIcon className="h-5 w-5 text-gray-400" />
              ) : (
                <div className="w-5 h-5" />
              )}
              <span className="font-medium">{category.name}</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleOpenModal(category)}
              className="p-2 text-blue-600 hover:bg-blue-100 rounded-md"
              title="編集"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleDeleteCategory(category)}
              className="p-2 text-red-600 hover:bg-red-100 rounded-md"
              title="削除"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
        {isExpanded && hasChildren && (
          <div className="ml-6">
            {categories
              .filter(c => c.parentId === category.id)
              .sort((a, b) => a.name.localeCompare(b.name))
              .map(child => renderCategoryRow(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) return <LoadingSpinner message="カテゴリデータを読み込み中..." />;

  return (
    <div className="space-y-8">
      {/* ヘッダー */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">カテゴリ管理</h1>
            <p className="text-gray-600 mt-2">商品カテゴリの階層構造を管理します</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-sm hover:bg-blue-700 transition-colors flex items-center"
          >
            <PlusCircleIcon className="h-5 w-5 mr-2" />
            新規カテゴリ追加
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

      {/* カテゴリリスト */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">カテゴリ一覧</h2>
        </div>
        <div className="divide-y divide-gray-200">
          
          
          {categories.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <FolderIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>カテゴリが登録されていません</p>
              <p className="text-sm mt-2">新規カテゴリを追加してください</p>
            </div>
          ) : (
            categories
              .filter(c => !c.parentId) // Only root categories
              .sort((a, b) => a.name.localeCompare(b.name))
              .map(category => renderCategoryRow(category, 0))
          )}
        </div>
      </div>

      {/* モーダル */}
      <Modal isOpen={showModal} onClose={handleCloseModal} title={editingCategory ? 'カテゴリ編集' : '新規カテゴリ追加'}>
        <CategoryForm
          category={editingCategory}
          categories={categories}
          onSave={handleSaveCategory}
          onCancel={handleCloseModal}
          loading={loading}
        />
      </Modal>
    </div>
  );
};

export default CategoryManagementPage; 