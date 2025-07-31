'use client';

import React, { useState, useEffect } from 'react';
import apiClient from '@/services/apiClient';
import { ProductWithStock, Supplier, PurchaseOrderItem, Store } from '@/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import { UI_TEXT } from '@/constants';
import Modal from '@/components/Modal';
import { MagnifyingGlassIcon, PlusIcon, TrashIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import { useStore } from '@/contexts/StoreContext';

interface OrderItem extends PurchaseOrderItem {
  productName: string;
  barcode: string;
}

const PurchaseOrderManagementTab: React.FC = () => {
  const { currentUser } = useAuth();
  const { selectedStoreId } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<ProductWithStock[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductWithStock | null>(null);
  const [orderQuantity, setOrderQuantity] = useState<number>(1);
  const [orderCostPrice, setOrderCostPrice] = useState<number>(0);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [stores, setStores] = useState<Store[]>([]); // ★追加: 店舗リスト
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null);
  const [selectedOrderStoreId, setSelectedOrderStoreId] = useState<string | null>(null); // ★追加: 発注対象店舗
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchSuppliersAndStores = async () => { // 関数名を変更
      try {
        const supplierData = await apiClient.get('/suppliers');
        setSuppliers(supplierData);
        const storeData = await apiClient.get('/stores'); // ★追加: 店舗リスト取得
        setStores(storeData);
      } catch (err) {
        console.error('Failed to fetch suppliers or stores:', err); // エラーメッセージ変更
        setError(UI_TEXT.ERROR_LOADING_DATA);
      }
    };
    fetchSuppliersAndStores(); // 関数呼び出しを変更
  }, []);

  const handleSearch = async () => {
    if (!searchTerm) {
      setSearchResults([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const products = await apiClient.get('/products', { storeId: selectedStoreId });
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
    setOrderQuantity(1);
    setOrderCostPrice(product.costPrice || 0); // 既存の原価を初期値に
    setIsProductModalOpen(true);
  };

  const handleAddItem = () => {
    if (selectedProduct && orderQuantity > 0 && orderCostPrice >= 0) {
      const newItem: OrderItem = {
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        barcode: selectedProduct.barcode,
        quantity: orderQuantity,
        costPriceAtOrder: orderCostPrice,
        isReceived: false, // 新規発注時は未受領
      };
      setOrderItems((prev) => [...prev, newItem]);
      setIsProductModalOpen(false);
      setSelectedProduct(null);
      setSearchTerm('');
      setSearchResults([]);
    }
  };

  const handleRemoveItem = (index: number) => {
    setOrderItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreatePurchaseOrder = async () => {
    console.log('selectedStoreId:', selectedStoreId); // ★追加
    if (orderItems.length === 0 || !selectedSupplier || !currentUser || !selectedOrderStoreId) { // 条件にselectedOrderStoreIdを追加
      setError('発注する商品、仕入先、発注店舗、またはユーザー情報が不足しています。'); // エラーメッセージ変更
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const payload = {
        orderDate: new Date().toISOString().split('T')[0], // 今日の日付
        supplierId: selectedSupplier,
        storeId: selectedOrderStoreId, // selectedOrderStoreId を使用
        items: orderItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          costPriceAtOrder: item.costPriceAtOrder,
        })),
        createdById: currentUser.id, // 現在のユーザーIDを使用
      };
      
      const result = await apiClient.post('/purchase_orders', payload);

      if (result.id) {
        setSuccessMessage(`発注書 #${result.id} が正常に作成されました。`);
        setOrderItems([]); // カートをクリア
        setSelectedSupplier(null);
      } else {
        setError(result.message || '発注書の作成に失敗しました。');
      }
    } catch (err) {
      console.error('Purchase order creation failed:', err);
      setError(UI_TEXT.ERROR_PREFIX + (err as Error).message);
    } finally {
      setLoading(false);
      setIsConfirmModalOpen(false);
    }
  };

  if (loading) return <LoadingSpinner message={UI_TEXT.LOADING} />;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="space-y-6">
      {successMessage && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4" role="alert">
          <p className="font-bold">成功</p>
          <p>{successMessage}</p>
        </div>
      )}

      {/* ★追加: デバッグ情報表示エリア */}
      <div className="bg-gray-100 p-4 rounded-lg mt-8">
        <h2 className="text-lg font-semibold text-gray-700 mb-2">デバッグ情報</h2>
        <p className="text-sm text-gray-800">
          selectedStoreId: {selectedStoreId || '未選択'}
        </p>
        <p className="text-sm text-gray-800">
          currentUser.storeId: {currentUser?.storeId || '未設定'}
        </p>
      </div>

      {/* 商品検索と追加 */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">発注商品を追加</h2>
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
                  <p className="text-sm text-gray-500">{product.barcode} - 現在庫: {product.currentStock}</p>
                </div>
                <PlusIcon className="h-5 w-5 text-green-500" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 発注リスト */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">発注リスト ({orderItems.length}件)</h2>
        {orderItems.length === 0 ? (
          <p className="text-gray-500">発注する商品がありません。</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {orderItems.map((item, index) => (
              <li key={index} className="py-4 flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-800">{item.productName} ({item.barcode})</p>
                  <p className="text-sm text-gray-500">数量: {item.quantity} / 発注時原価: ¥{item.costPriceAtOrder.toLocaleString()}</p>
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

      {/* 仕入先選択と発注ボタン */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">発注店舗を選択</h2>
        <select
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-sky-500 focus:border-sky-500 mb-4"
          value={selectedOrderStoreId || ''}
          onChange={(e) => setSelectedOrderStoreId(e.target.value)}
        >
          <option value="" disabled>発注店舗を選択してください</option>
          {stores.map((store) => (
            <option key={store.id} value={store.id}>
              {store.name}
            </option>
          ))}
        </select>

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
          disabled={orderItems.length === 0 || !selectedSupplier || !selectedOrderStoreId || loading} // disabled条件にselectedOrderStoreIdを追加
          className="w-full px-4 py-3 bg-indigo-600 text-white rounded-md text-lg font-semibold hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          <ShoppingBagIcon className="h-6 w-6" />
          <span>発注書を作成</span>
        </button>
      </div>

      {/* 商品詳細モーダル */}
      <Modal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        title={selectedProduct ? `${selectedProduct.name} の発注` : '商品発注'}
      >
        {selectedProduct && (
          <div className="space-y-4">
            <p>バーコード: {selectedProduct.barcode}</p>
            <p>現在の在庫: {selectedProduct.currentStock}</p>
            <div>
              <label htmlFor="orderQuantity" className="block text-sm font-medium text-gray-700">数量</label>
              <input
                type="number"
                id="orderQuantity"
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                value={orderQuantity}
                onChange={(e) => setOrderQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                min="1"
              />
            </div>
            <div>
              <label htmlFor="orderCostPrice" className="block text-sm font-medium text-gray-700">発注時原価</label>
              <input
                type="number"
                id="orderCostPrice"
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                value={orderCostPrice}
                onChange={(e) => setOrderCostPrice(Math.max(0, parseFloat(e.target.value) || 0))}
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
        title="発注書の作成確認"
      >
        <div className="space-y-4">
          <p>以下の内容で発注書を作成しますか？</p>
          <ul className="list-disc list-inside">
            {orderItems.map((item, index) => (
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
              onClick={handleCreatePurchaseOrder}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              作成
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PurchaseOrderManagementTab;