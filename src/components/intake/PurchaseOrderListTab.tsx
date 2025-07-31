'use client';

import React, { useState, useEffect } from 'react';
import apiClient from '@/services/apiClient';
import { PurchaseOrder, PurchaseOrderItem, Supplier, PurchaseOrderStatus } from '@/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import { UI_TEXT } from '@/constants';
import Modal from '@/components/Modal';
import { EyeIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import { useStore } from '@/contexts/StoreContext';

const PurchaseOrderListTab: React.FC = () => {
  const { currentUser } = useAuth();
  const { selectedStoreId } = useStore();
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isReceiveConfirmModalOpen, setIsReceiveConfirmModalOpen] = useState(false);
  const [itemsToReceive, setItemsToReceive] = useState<PurchaseOrderItem[]>([]);

  useEffect(() => {
    // selectedStoreIdが有効な値（空文字やundefinedでない）の場合のみ実行
    if (selectedStoreId) {
      fetchPurchaseOrders();
    }
  }, [selectedStoreId]);

  const fetchPurchaseOrders = async () => {
    console.log('fetchPurchaseOrders called. selectedStoreId:', selectedStoreId);
    setLoading(true);
    setError(null);
    try {
      if (selectedStoreId) {
        const data = await apiClient.get('/purchase_orders', { storeId: selectedStoreId });
        setPurchaseOrders(data);
      }
    } catch (err) {
      console.error('Failed to fetch purchase orders:', err);
      setError(UI_TEXT.ERROR_LOADING_DATA);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (order: PurchaseOrder) => {
    setLoading(true);
    setError(null);
    try {
      // 詳細取得APIを呼び出す（アイテム情報も含む）
      const fullOrder = await apiClient.get('/purchase_orders', { id: order.id, storeId: selectedStoreId });
      setSelectedOrder(fullOrder);
      setIsDetailModalOpen(true);
    } catch (err) {
      console.error('Failed to fetch purchase order details:', err);
      setError(UI_TEXT.ERROR_LOADING_DATA);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReceiveConfirm = (order: PurchaseOrder) => {
    setSelectedOrder(order);
    // 未受領のアイテムのみを対象にする
    setItemsToReceive(order.items.filter(item => !item.isReceived));
    setIsReceiveConfirmModalOpen(true);
  };

  const handleProcessReceive = async () => {
    if (!selectedOrder || itemsToReceive.length === 0 || !currentUser) return;

    setLoading(true);
    setError(null);
    try {
      const payload = {
        purchaseOrderId: selectedOrder.id,
        receivedItems: itemsToReceive.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        userId: currentUser.id,
      };
      await apiClient.put('/purchase_orders', payload);
      setIsReceiveConfirmModalOpen(false);
      setIsDetailModalOpen(false); // 詳細モーダルも閉じる
      fetchPurchaseOrders(); // リストを更新
    } catch (err) {
      console.error('Failed to process receive:', err);
      setError(UI_TEXT.ERROR_PREFIX + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner message={UI_TEXT.LOADING} />;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-700">発注書一覧</h2>

      {purchaseOrders.length === 0 ? (
        <p className="text-gray-500">発注書がありません。</p>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">発注ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">発注日</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">仕入先</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">店舗</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ステータス</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {purchaseOrders.map((order) => (
                <tr key={order.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.orderDate}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.supplierName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.storeId}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.status}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleViewDetails(order)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                    >
                      <EyeIcon className="h-5 w-5" />
                    </button>
                    {order.status !== PurchaseOrderStatus.COMPLETED && (
                      <button
                        onClick={() => handleOpenReceiveConfirm(order)}
                        className="text-green-600 hover:text-green-900"
                      >
                        <CheckCircleIcon className="h-5 w-5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 発注書詳細モーダル */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={selectedOrder ? `発注書 #${selectedOrder.id} 詳細` : '発注書詳細'}
      >
        {selectedOrder && (
          <div className="space-y-4">
            <p><strong>発注日:</strong> {selectedOrder.orderDate}</p>
            <p><strong>仕入先:</strong> {selectedOrder.supplierName}</p>
            <p><strong>店舗:</strong> {selectedOrder.storeId}</p>
            <p><strong>ステータス:</strong> {selectedOrder.status}</p>
            <p><strong>作成者:</strong> {selectedOrder.createdById}</p>
            {selectedOrder.notes && <p><strong>備考:</strong> {selectedOrder.notes}</p>}
            {selectedOrder.completedDate && <p><strong>完了日:</strong> {selectedOrder.completedDate}</p>}

            <h3 className="text-lg font-semibold mt-4">商品明細</h3>
            {selectedOrder.items && selectedOrder.items.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {selectedOrder.items.map((item, index) => (
                  <li key={index} className="py-2 flex justify-between items-center">
                    <div>
                      <p className="font-medium">{item.productName} ({item.barcode})</p>
                      <p className="text-sm text-gray-600">数量: {item.quantity} / 原価: ¥{item.costPriceAtOrder.toLocaleString()}</p>
                    </div>
                    {item.isReceived ? (
                      <span className="text-green-500 text-sm font-semibold">入荷済み</span>
                    ) : (
                      <span className="text-orange-500 text-sm font-semibold">未入荷</span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">商品明細がありません。</p>
            )}
          </div>
        )}
      </Modal>

      {/* 入荷確認モーダル */}
      <Modal
        isOpen={isReceiveConfirmModalOpen}
        onClose={() => setIsReceiveConfirmModalOpen(false)}
        title="発注商品の入荷確認"
      >
        {selectedOrder && itemsToReceive.length > 0 ? (
          <div className="space-y-4">
            <p>発注書 #{selectedOrder.id} の以下の商品をすべて入荷済みにしますか？</p>
            <ul className="list-disc list-inside">
              {itemsToReceive.map((item, index) => (
                <li key={index}>{item.productName} ({item.barcode}): {item.quantity}個</li>
              ))}
            </ul>
            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={() => setIsReceiveConfirmModalOpen(false)}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400"
              >
                キャンセル
              </button>
              <button
                onClick={handleProcessReceive}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                入荷処理を実行
              </button>
            </div>
          </div>
        ) : (
          <p className="text-gray-500">入荷待ちの商品はありません。</p>
        )}
      </Modal>
    </div>
  );
};

export default PurchaseOrderListTab;