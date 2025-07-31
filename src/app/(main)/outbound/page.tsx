'use client';

import dynamic from 'next/dynamic';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Product, OutboundCartItem, ProductWithStock } from '@/types';
import { getProducts, processOutboundBatch } from '@/services/apiClient';
import LoadingSpinner from '@/components/LoadingSpinner';
import { UI_TEXT } from '@/constants';
import { MagnifyingGlassIcon, PlusIcon, TrashIcon, ArrowDownTrayIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { QuestionMarkCircleIcon } from '@heroicons/react/24/solid';
import HelpModal from '@/components/HelpModal';

interface OutboundItemWithProduct extends OutboundCartItem {
  reason: string;
}

const OutboundPageComponent: React.FC = () => {
  const { currentUser } = useAuth();
  const [products, setProducts] = useState<ProductWithStock[]>([]);
  const [outboundItems, setOutboundItems] = useState<OutboundItemWithProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductWithStock | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState<string>('');

  useEffect(() => {
    const fetchProducts = async () => {
      if (!currentUser) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const data = await getProducts();
        setProducts(data);
      } catch (err) {
        console.error('Failed to fetch products:', err);
        setError('商品データの取得に失敗しました。');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [currentUser]);

  const handleAddItem = () => {
    if (!selectedProduct || quantity <= 0) {
      setError('商品と数量を正しく入力してください。');
      return;
    }

    const existingItem = outboundItems.find(item => item.product.id === selectedProduct.id);
    if (existingItem) {
      setError('この商品は既にリストに追加されています。');
      return;
    }

    const newItem: OutboundItemWithProduct = {
      product: selectedProduct,
      quantity: quantity,
      reason: reason || '出庫処理',
    };

    setOutboundItems([...outboundItems, newItem]);
    setSelectedProduct(null);
    setQuantity(1);
    setReason('');
    setError(null);
  };

  const handleRemoveItem = (productId: string) => {
    setOutboundItems(outboundItems.filter(item => item.product.id !== productId));
  };

  const handleProcessOutbound = async () => {
    if (outboundItems.length === 0) {
      setError('出庫する商品を追加してください。');
      return;
    }

    setProcessing(true);
    setError(null);
    setSuccess(null);

    try {
      const items = outboundItems.map(item => ({
        productId: item.product.id,
        quantity: item.quantity
      }));

      await processOutboundBatch(items, currentUser?.id || '', currentUser?.storeId || '');
      setSuccess('出庫処理が完了しました。');
      setOutboundItems([]);
    } catch (err) {
      console.error('Failed to process outbound:', err);
      setError('出庫処理に失敗しました。');
    } finally {
      setProcessing(false);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.barcode?.includes(searchTerm) ||
    product.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">出庫処理</h1>
        <button
          onClick={() => setShowHelp(true)}
          className="p-2 text-gray-400 hover:text-gray-600"
        >
          <QuestionMarkCircleIcon className="h-6 w-6" />
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <p className="text-green-800">{success}</p>
        </div>
      )}

      {/* 商品検索・追加 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">商品追加</h2>
        
        {/* 検索 */}
        <div className="mb-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="商品名、バーコード、説明で検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* 商品選択 */}
        {searchTerm && (
          <div className="mb-4 max-h-60 overflow-y-auto border border-gray-200 rounded-md">
            {filteredProducts.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => setSelectedProduct(product)}
                    className={`p-3 cursor-pointer hover:bg-gray-50 ${
                      selectedProduct?.id === product.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">{product.name}</p>
                        <p className="text-sm text-gray-500">{product.description}</p>
                        {product.barcode && (
                          <p className="text-xs text-gray-400">バーコード: {product.barcode}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          在庫: {product.currentStock}
                        </p>
                        <p className="text-xs text-gray-500">
                          最低在庫: {product.minimumStock}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500">
                該当する商品が見つかりません。
              </div>
            )}
          </div>
        )}

        {/* 数量・理由入力 */}
        {selectedProduct && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                選択商品
              </label>
              <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                {selectedProduct.name}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                出庫数量
              </label>
              <input
                type="number"
                min="1"
                max={selectedProduct.currentStock}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                出庫理由
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="出庫理由を入力..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {/* 追加ボタン */}
        {selectedProduct && (
          <button
            onClick={handleAddItem}
            disabled={quantity <= 0 || quantity > selectedProduct.currentStock}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PlusIcon className="h-5 w-5" />
            <span>リストに追加</span>
          </button>
        )}
      </div>

      {/* 出庫リスト */}
      {outboundItems.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">出庫リスト</h2>
          <div className="space-y-4">
            {outboundItems.map((item) => (
              <div key={item.product.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{item.product.name}</p>
                  <p className="text-sm text-gray-500">
                    数量: {item.quantity} / 在庫: {item.product.currentStock}
                  </p>
                  <p className="text-sm text-gray-500">理由: {item.reason}</p>
                </div>
                <button
                  onClick={() => handleRemoveItem(item.product.id)}
                  className="p-2 text-red-600 hover:text-red-800"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>

          {/* 出庫処理ボタン */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleProcessOutbound}
              disabled={processing}
              className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? (
                <LoadingSpinner />
              ) : (
                <ArrowDownTrayIcon className="h-5 w-5" />
              )}
              <span>{processing ? '処理中...' : '出庫処理を実行'}</span>
            </button>
          </div>
        </div>
      )}

      {/* 出庫履歴 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">出庫履歴</h2>
        <div className="text-center py-8">
          <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">出庫履歴機能は今後実装予定です。</p>
        </div>
      </div>

      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
    </div>
  );
};

// 動的インポートでSSRを無効化
const OutboundPage = dynamic(() => Promise.resolve(OutboundPageComponent), {
  ssr: false,
});

export default OutboundPage; 