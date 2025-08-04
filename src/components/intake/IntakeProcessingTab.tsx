'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useStore } from '@/contexts/StoreContext';
import { getSuppliers, getProducts, processIntakeBatch } from '@/services/apiClient';
import { ProductWithStock, Supplier } from '@/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import { UI_TEXT } from '@/constants';
import { MagnifyingGlassIcon, PlusIcon, TrashIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import Modal from '@/components/Modal';
import ErrorMessage from '@/components/ErrorMessage';

interface IntakeItem {
  productId: string;
  productName: string;
  barcode: string;
  quantity: number;
  costPrice: number;
}

const IntakeProcessingTab: React.FC = () => {
  const { currentUser } = useAuth();
  const { selectedStoreId } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<ProductWithStock[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductWithStock | null>(null);
  const [intakeQuantity, setIntakeQuantity] = useState<number>(1);
  const [intakeCostPrice, setIntakeCostPrice] = useState<number>(0);
  const [intakeItems, setIntakeItems] = useState<IntakeItem[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const data = await getSuppliers();
        setSuppliers(data);
      } catch (err) {
        console.error('Failed to fetch suppliers:', err);
        setError(UI_TEXT.ERROR_LOADING_DATA);
      }
    };
    fetchSuppliers();
  }, []);

  const handleSearch = async () => {
    if (!searchTerm) {
      setSearchResults([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const products = await getProducts(selectedStoreId);
      const filtered = products.filter((p: ProductWithStock) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.barcode.includes(searchTerm)
      );
      setSearchResults(filtered);
    } catch (err) {
      console.error('Failed to search products:', err);
      setError(UI_TEXT.ERROR_SEARCHING_PRODUCTS);
    } finally {
      setLoading(false);
    }
  };

  const handleProductSelect = (product: ProductWithStock) => {
    setSelectedProduct(product);
    setIntakeQuantity(1);
    setIntakeCostPrice(product.costPrice || 0); // 既存の原価を初期値に
    setIsProductModalOpen(true);
  };

  const handleAddItem = () => {
    if (selectedProduct && intakeQuantity > 0 && intakeCostPrice >= 0) {
      const newItem: IntakeItem = {
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        barcode: selectedProduct.barcode,
        quantity: intakeQuantity,
        costPrice: intakeCostPrice,
      };
      setIntakeItems((prev) => [...prev, newItem]);
      setIsProductModalOpen(false);
      setSelectedProduct(null);
      setSearchTerm('');
      setSearchResults([]);
    }
  };

  const handleRemoveItem = (index: number) => {
    setIntakeItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleProcessIntake = async () => {
    if (intakeItems.length === 0 || !selectedSupplier || !currentUser || !selectedStoreId) {
      setError('入荷する商品、仕入先、またはユーザー情報が不足しています。');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const payload = {
        items: intakeItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          costPrice: item.costPrice,
        })),
        supplierId: selectedSupplier,
        operatorId: currentUser.id, // 現在のユーザーIDを使用
        storeId: selectedStoreId,
      };
      
      const result = await processIntakeBatch(payload.items, payload.supplierId, payload.operatorId, payload.storeId);

      if (result.success) {
        setSuccessMessage(`入荷処理が完了しました。${intakeItems.length}件の商品が更新されました。`);
        setIntakeItems([]); // カートをクリア
        setSelectedSupplier(null);
      } else {
        setError(result.errors?.join(', ') || UI_TEXT.ERROR_PROCESSING_INTAKE);
      }
    } catch (err) {
      console.error('Intake processing failed:', err);
      setError(UI_TEXT.ERROR_PROCESSING_INTAKE);
    } finally {
      setLoading(false);
      setIsConfirmModalOpen(false);
    }
  };

  if (loading) return <LoadingSpinner message={UI_TEXT.LOADING} />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold text-gray-800">入荷処理</h1>

      {successMessage && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4" role="alert">
          <p className="font-bold">成功</p>
          <p>{successMessage}</p>
        </div>
      )}

      {/* 商品検索と追加 */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">商品を追加</h2>
        <div className="flex space-x-2 mb-4">
          <input
            type="text"
            placeholder="商品名またはバーコードで検索..."
            className="flex-grow p-2 border border-gray-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
          />
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
          >
            <MagnifyingGlassIcon className="h-5 w-5" />
          </button>
        </div>

        {searchResults.length > 0 && (
          <div className="border border-gray-200 rounded-md max-h-60 overflow-y-auto">
            {searchResults.map((product) => (
              <div
                key={product.id}
                className="flex justify-between items-center p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                onClick={() => handleProductSelect(product)}
              >
                <div>
                  <p className="font-medium text-gray-800">{product.name}</p>
                  <p className="text-sm text-gray-500">{product.barcode} - 在庫: {product.currentStock}</p>
                </div>
                <PlusIcon className="h-5 w-5 text-green-500" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 入荷予定リスト */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">入荷リスト ({intakeItems.length}件)</h2>
        {intakeItems.length === 0 ? (
          <p className="text-gray-500">入荷する商品がありません。</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {intakeItems.map((item, index) => (
              <li key={index} className="py-4 flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-800">{item.productName} ({item.barcode})</p>
                  <p className="text-sm text-gray-500">数量: {item.quantity} / 原価: ¥{item.costPrice.toLocaleString()}</p>
                </div>
                <button
                  onClick={() => handleRemoveItem(index)}
                  className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 仕入先選択と入荷処理ボタン */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">仕入先を選択</h2>
        <select
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-sky-500 focus:border-sky-500 mb-4"
          value={selectedSupplier || ''}
          onChange={(e) => setSelectedSupplier(e.target.value)}
        >
          <option value="" disabled>仕入先を選択してください</option>
          {suppliers.map((supplier) => (
            <option key={supplier.id} value={supplier.id}>
              {supplier.name}
            </option>
          ))}
        </select>

        <button
          onClick={() => setIsConfirmModalOpen(true)}
          disabled={intakeItems.length === 0 || !selectedSupplier || loading}
          className="w-full px-4 py-3 bg-green-600 text-white rounded-md text-lg font-semibold hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          <ArrowDownTrayIcon className="h-6 w-6" />
          <span>入荷処理を実行</span>
        </button>
      </div>

      {/* 商品詳細モーダル */}
      <Modal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        title={selectedProduct ? `${selectedProduct.name} の入荷` : '商品入荷'}
      >
        {selectedProduct && (
          <div className="space-y-4">
            <p>バーコード: {selectedProduct.barcode}</p>
            <p>現在の在庫: {selectedProduct.currentStock}</p>
            <div>
              <label htmlFor="intakeQuantity" className="block text-sm font-medium text-gray-700">数量</label>
              <input
                type="number"
                id="intakeQuantity"
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                value={intakeQuantity}
                onChange={(e) => setIntakeQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                min="1"
              />
            </div>
            <div>
              <label htmlFor="intakeCostPrice" className="block text-sm font-medium text-gray-700">原価</label>
              <input
                type="number"
                id="intakeCostPrice"
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                value={intakeCostPrice}
                onChange={(e) => setIntakeCostPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                min="0"
                step="0.01"
              />
            </div>
            <button
              onClick={handleAddItem}
              className="w-full px-4 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700"
            >
              リストに追加
            </button>
          </div>
        )}
      </Modal>

      {/* 確認モーダル */}
      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        title="入荷処理の確認"
      >
        <div className="space-y-4">
          <p>以下の内容で入荷処理を実行しますか？</p>
          <ul className="list-disc list-inside">
            {intakeItems.map((item, index) => (
              <li key={index}>{item.productName} ({item.barcode}): {item.quantity}個</li>
            ))}
          </ul>
          <p>仕入先: {suppliers.find(s => s.id === selectedSupplier)?.name}</p>
          <div className="flex justify-end space-x-2 mt-4">
            <button
              onClick={() => setIsConfirmModalOpen(false)}
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400"
            >
              キャンセル
            </button>
            <button
              onClick={handleProcessIntake}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              実行
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default IntakeProcessingTab;