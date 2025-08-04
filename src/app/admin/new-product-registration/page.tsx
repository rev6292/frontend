'use client';

import dynamic from 'next/dynamic';
import React, { useState, useEffect, useCallback, ChangeEvent } from 'react';
import { Supplier, User, Category, ProcessedInvoiceItem, TableHeader } from '@/types';
import { getSuppliers, getStaffUsers, getCategories, parseInvoiceMock, addNewProductsFromAIData } from '@/services/apiClient';
import Table from '@/components/Table';
import LoadingSpinner from '@/components/LoadingSpinner';
import { UI_TEXT } from '@/constants';
import { useAuth } from '@/contexts/AuthContext';
import { CheckCircleIcon, ExclamationTriangleIcon, SparklesIcon, DocumentArrowUpIcon, UserCircleIcon, BuildingStorefrontIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import ErrorMessage from '@/components/ErrorMessage';

const getStatusText = (status: ProcessedInvoiceItem['status']): string => {
  const statusMap: Record<ProcessedInvoiceItem['status'], string> = {
    pending: '保留',
    matched: '一致',
    new_details_required: '詳細入力待ち',
    ready: '登録準備完了',
    importing: '登録中',
    imported: '登録済み',
    error_importing: '登録エラー',
  };
  return statusMap[status] || status;
};

const NewProductRegistrationPageComponent: React.FC = () => {
  const { currentUser } = useAuth();

  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [staffUsers, setStaffUsers] = useState<User[]>([]);
  
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [selectedRegistrarId, setSelectedRegistrarId] = useState<string>('');
  const [invoiceImageFile, setInvoiceImageFile] = useState<File | null>(null);
  const [invoiceImageBase64, setInvoiceImageBase64] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [isParsing, setIsParsing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [parsedItems, setParsedItems] = useState<ProcessedInvoiceItem[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [supps, users, cats] = await Promise.all([
        getSuppliers(),
        getStaffUsers(),
        getCategories()
      ]);
      setSuppliers(supps);
      setStaffUsers(users);
      setAllCategories(cats);

      if (currentUser) setSelectedRegistrarId(currentUser.id);
      if (supps.length > 0) setSelectedSupplierId(supps[0].id);

    } catch (err) {
      console.error('Error loading data:', err);
      // エラーが発生してもページは表示する（空のデータで）
      setSuppliers([]);
      setStaffUsers([]);
      setAllCategories([]);
      if (currentUser) setSelectedRegistrarId(currentUser.id);
      setError('データの読み込みに失敗しました。一部の機能が利用できません。');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const clearMessages = () => {
    setError(null);
    setSuccessMessage(null);
  };
  
  const handleImageFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    clearMessages();
    const file = e.target.files?.[0];
    if (file) {
      setInvoiceImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setInvoiceImageBase64(reader.result as string);
      reader.readAsDataURL(file);
      setParsedItems([]);
    } else {
      setInvoiceImageFile(null);
      setInvoiceImageBase64(null);
    }
  };

  const handleParseImage = async () => {
    if (!invoiceImageBase64 || !selectedSupplierId) {
      setError("仕入先を選択し、画像ファイルをアップロードしてください。");
      return;
    }
    clearMessages();
    setIsParsing(true);
    try {
      const base64Data = invoiceImageBase64.split(',')[1];
      const rawItems = await parseInvoiceMock(base64Data);

      const processed: ProcessedInvoiceItem[] = rawItems.map((raw: any, index: number) => {
        const qty = parseInt(raw.quantity) || 0;
        let price = parseFloat(raw.unitPrice || raw.totalPrice || '0');
        if (raw.totalPrice && !raw.unitPrice && qty > 0) price = parseFloat(raw.totalPrice) / qty;

        return {
          _tempId: `new_item_${Date.now()}_${index}`,
          rawItem: raw,
          matchedProductId: null,
          isNewProduct: true,
          productName: raw.itemName.trim(),
          barcode: '',
          categoryId: '',
          minimumStock: 1,
          quantity: qty,
          pricePerUnit: isNaN(price) ? 0 : parseFloat(price.toFixed(2)),
          status: 'new_details_required',
        };
      });
      setParsedItems(processed);
      setSuccessMessage(`${processed.length} 件の新規商品候補を抽出しました。`);
    } catch (err) {
      console.error('Image parsing error:', err);
      setError(`画像の解析に失敗しました。APIサーバーに接続できません。`);
      // エラーが発生した場合は空の配列を設定
      setParsedItems([]);
    } finally {
      setIsParsing(false);
    }
  };

  const handleItemChange = (tempId: string, field: keyof ProcessedInvoiceItem, value: any) => {
    setParsedItems(prev => prev.map(item => {
      if (item._tempId !== tempId) return item;
      
      const updatedItem = { ...item, [field]: value };
      
      if (updatedItem.productName && updatedItem.barcode && updatedItem.categoryId && updatedItem.pricePerUnit >= 0 && updatedItem.minimumStock >= 0) {
        updatedItem.status = 'ready';
      } else {
        updatedItem.status = 'new_details_required';
      }

      return updatedItem;
    }));
  };
  
  const handleSubmitNewProducts = async () => {
    clearMessages();
    const itemsToSubmit = parsedItems.filter(item => item.status === 'ready');
    if (itemsToSubmit.length === 0) {
      setError("登録準備が完了している商品がありません。");
      return;
    }
    if (!selectedSupplierId || !selectedRegistrarId) {
      setError("仕入先と担当者が選択されていません。");
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await addNewProductsFromAIData(itemsToSubmit, selectedSupplierId, selectedRegistrarId, currentUser?.storeId || '');
      
      let message = '';
      if(result.successCount > 0) {
          message += `${result.successCount}件の新規商品を登録しました。`;
      }
      if(result.errorCount > 0) {
          message += ` ${result.errorCount}件はエラーのため登録できませんでした: ${result.errors.join(', ')}`;
      }

      if(result.successCount > 0 && result.errorCount === 0) {
        setSuccessMessage(message);
        setParsedItems([]);
        setInvoiceImageFile(null);
        setInvoiceImageBase64(null);
      } else {
        setError(message);
      }
    } catch (err) {
      setError(`登録処理中にエラーが発生しました: ${(err as Error).message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: ProcessedInvoiceItem['status']) => {
    switch (status) {
      case 'new_details_required': return 'bg-yellow-100 text-yellow-800';
      case 'ready': return 'bg-sky-100 text-sky-800';
      case 'importing': return 'bg-blue-100 text-blue-800';
      case 'imported': return 'bg-green-100 text-green-800';
      case 'error_importing': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const tableHeaders: TableHeader<ProcessedInvoiceItem>[] = [
    { key: 'productName', label: UI_TEXT.PRODUCT_NAME, render: (item) => <input type="text" value={item.productName} onChange={(e) => handleItemChange(item._tempId, 'productName', e.target.value)} className="w-full min-w-[200px] p-1 border rounded-md text-sm border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"/> },
    { key: 'barcode', label: UI_TEXT.BARCODE, render: (item) => <input type="text" value={item.barcode} onChange={(e) => handleItemChange(item._tempId, 'barcode', e.target.value)} className="w-full min-w-[160px] p-1 border rounded-md text-sm border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"/> },
    { key: 'categoryId', label: UI_TEXT.CATEGORY, render: (item) => (
      <select value={item.categoryId} onChange={(e) => handleItemChange(item._tempId, 'categoryId', e.target.value)} className="w-full min-w-[240px] p-1 border rounded-md text-sm border-gray-300 focus:ring-indigo-500 focus:border-indigo-500">
        <option value="">選択...</option>
        {allCategories.filter(c => c.parentId !== null).map(c => {
            const parent = allCategories.find(p => p.id === c.parentId);
            return <option key={c.id} value={c.id}>{parent ? `${parent.name} > ` : ''}{c.name}</option>;
        })}
      </select>
    )},
    { key: 'costPrice', label: UI_TEXT.COST_PRICE_FOR_NEW_PRODUCT, render: (item) => <input type="number" value={item.pricePerUnit} onChange={(e) => handleItemChange(item._tempId, 'pricePerUnit', parseFloat(e.target.value))} className="w-24 p-1 border rounded-md text-sm border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"/> },
    { key: 'initialStock', label: UI_TEXT.INITIAL_STOCK_QUANTITY, render: (item) => <input type="number" value={item.quantity} onChange={(e) => handleItemChange(item._tempId, 'quantity', parseInt(e.target.value))} className="w-20 p-1 border rounded-md text-sm border-gray-300 focus:ring-indigo-500 focus:border-indigo-500" /> },
    { key: 'minimumStock', label: UI_TEXT.MINIMUM_STOCK, render: (item) => <input type="number" value={item.minimumStock} onChange={(e) => handleItemChange(item._tempId, 'minimumStock', parseInt(e.target.value))} className="w-20 p-1 border rounded-md text-sm border-gray-300 focus:ring-indigo-500 focus:border-indigo-500" /> },
    { key: 'status', label: '状態', render: (item) => <span className={`px-2 py-0.5 inline-flex text-sm font-semibold rounded-full ${getStatusColor(item.status)}`}>{getStatusText(item.status)}</span> },
  ];

  if (loading) return <div className="p-8"><LoadingSpinner message="基本データを読み込み中..." /></div>;
  
  return (
    <div className="space-y-8">
      {/* ヘッダー */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{UI_TEXT.NEW_PRODUCT_REGISTRATION_TITLE}</h1>
        <p className="text-gray-600">AIを活用して画像から新規商品を一括登録できます</p>
      </div>

      {/* エラーメッセージ */}
      {error && <ErrorMessage message={error} />}

      {/* 成功メッセージ */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
          <CheckCircleIcon className="h-6 w-6 text-green-500 mt-0.5 flex-shrink-0"/>
          <div>
            <h3 className="text-green-800 font-medium">処理が完了しました</h3>
            <p className="text-green-700 text-sm mt-1">{successMessage}</p>
          </div>
        </div>
      )}
      
      {/* 基本設定 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">基本設定</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="registrar-select" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <UserCircleIcon className="h-5 w-5 mr-2 text-gray-500"/>
              登録者
            </label>
            <select 
              id="registrar-select" 
              value={selectedRegistrarId} 
              onChange={e => setSelectedRegistrarId(e.target.value)} 
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">登録者を選択...</option>
              {staffUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="supplier-select" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <BuildingStorefrontIcon className="h-5 w-5 mr-2 text-gray-500"/>
              仕入先
            </label>
            <select 
              id="supplier-select" 
              value={selectedSupplierId} 
              onChange={e => setSelectedSupplierId(e.target.value)} 
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">仕入先を選択...</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>
      </div>
      
      {/* 画像アップロード */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <SparklesIcon className="h-6 w-6 mr-2 text-blue-600"/>
          AI画像解析
        </h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="invoice-image" className="block text-sm font-medium text-gray-700 mb-2">
              納品書・商品リスト等の画像:
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
              <input 
                type="file" 
                id="invoice-image" 
                accept="image/*" 
                onChange={handleImageFileChange} 
                className="hidden"
              />
              <label htmlFor="invoice-image" className="cursor-pointer">
                <div className="space-y-2">
                  <DocumentArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto"/>
                  <div>
                    <p className="text-sm text-gray-600">クリックして画像を選択</p>
                    <p className="text-xs text-gray-500">JPG, PNG, GIF 形式をサポート</p>
                  </div>
                </div>
              </label>
            </div>
          </div>
          
          {invoiceImageBase64 && (
            <div className="border rounded-lg p-4">
              <p className="text-sm font-medium text-gray-700 mb-2">プレビュー:</p>
              <img src={invoiceImageBase64} alt="Preview" className="max-h-40 border rounded-md"/>
            </div>
          )}
          
          <button 
            onClick={handleParseImage} 
            disabled={!selectedSupplierId || !invoiceImageBase64 || isParsing || isSubmitting} 
            className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            {isParsing ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <SparklesIcon className="h-5 w-5 mr-2" />
                画像を解析 (AI)
              </>
            )}
          </button>
        </div>
      </div>

      {/* 商品一覧 */}
      {parsedItems.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <CheckCircleIcon className="h-6 w-6 mr-2 text-green-600"/>
            商品確認・登録
          </h2>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <InformationCircleIcon className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0"/>
              <div>
                <p className="text-blue-800 font-medium">登録準備完了: {parsedItems.filter(p => p.status === 'ready').length} 件</p>
                <p className="text-blue-700 text-sm mt-1">
                  必須項目を全て埋めると状態が「登録準備完了」に変わります。準備完了した商品のみ登録できます。
                </p>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <Table headers={tableHeaders} data={parsedItems} itemKey="_tempId" />
          </div>

          <div className="mt-6 flex justify-end">
            <button 
              onClick={handleSubmitNewProducts} 
              disabled={isSubmitting || isParsing || parsedItems.filter(p => p.status === 'ready').length === 0} 
              className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg shadow-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {isSubmitting ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <DocumentArrowUpIcon className="h-5 w-5 mr-2" />
                  商品を登録 ({parsedItems.filter(p => p.status === 'ready').length} 件)
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// 動的インポートでSSRを無効化
const NewProductRegistrationPage = dynamic(() => Promise.resolve(NewProductRegistrationPageComponent), {
  ssr: false,
});

export default NewProductRegistrationPage;