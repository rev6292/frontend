
import React, { useState, useCallback } from 'react';
import apiClient from '../../services/apiClient';
import { Product } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';
import { ArrowDownOnSquareIcon, ArrowUpOnSquareIcon, DocumentTextIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const CSV_HEADERS = [
  { key: 'barcode', label: 'barcode (必須/ユニーク)' },
  { key: 'name', label: 'name (新規登録時必須)' },
  { key: 'categoryId', label: 'categoryId (新規登録時必須)' },
  { key: 'supplierId', label: 'supplierId (新規登録時必須)' },
  { key: 'currentStock', label: 'currentStock (現在庫)' },
  { key: 'minimumStock', label: 'minimumStock (最低在庫)' },
  { key: 'costPrice', label: 'costPrice (原価)' },
  { key: 'description', label: 'description (商品説明)' },
];

const AdminCsvPage: React.FC = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      const products = await apiClient.get('/products');
      
      const headerRow = CSV_HEADERS.map(h => h.label).join(',');
      const rows = products.map((p: Product) => {
        return CSV_HEADERS.map(header => {
          let val = p[header.key as keyof Product];
          // Escape quotes and wrap in quotes
          return `"${String(val ?? '').replace(/"/g, '""')}"`;
        }).join(',');
      });
      
      const csvContent = [headerRow, ...rows].join('\r\n');
      const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', `products_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("CSVエクスポートエラー:", error);
      alert("エクスポート中にエラーが発生しました。");
    } finally {
      setIsExporting(false);
    }
  }, []);

  const handleDownloadTemplate = () => {
    const headerRow = CSV_HEADERS.map(h => h.label).join(',');
    const blob = new Blob([`\uFEFF${headerRow}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'products_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportFile(e.target.files ? e.target.files[0] : null);
    setImportResult(null);
  };

  const handleImport = useCallback(async () => {
    if (!importFile) {
      setImportResult({ success: false, message: 'ファイルが選択されていません。' });
      return;
    }

    setIsImporting(true);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
        if (lines.length < 2) {
          throw new Error('ヘッダー行と少なくとも1つのデータ行が必要です。');
        }

        const headerLine = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const headerKeyMap = new Map<string, string>();
        CSV_HEADERS.forEach(h => headerKeyMap.set(h.label, h.key));
        
        const productsToUpsert: Partial<Product>[] = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim().replace(/(^"|"$)/g, ''));
            const productData: Partial<Product> = {};
            for(let j=0; j < headerLine.length; j++) {
                const headerLabel = headerLine[j];
                const key = headerKeyMap.get(headerLabel);
                if(key) {
                    const value = values[j];
                    if (['currentStock', 'minimumStock', 'costPrice'].includes(key)) {
                        (productData as any)[key] = parseFloat(value) || 0;
                    } else if (value) {
                         (productData as any)[key] = value;
                    }
                }
            }
            if (Object.keys(productData).length > 0 && productData.barcode) {
                productsToUpsert.push(productData);
            }
        }

        if (productsToUpsert.length === 0) {
          throw new Error("処理対象となる有効なデータ行が見つかりませんでした。");
        }

        const result = await apiClient.post('/products/batch-upsert', productsToUpsert);
        
        let message = `${result.createdCount}件の新規商品を追加し、${result.updatedCount}件の既存商品を更新しました。`;
        if (result.errors.length > 0) {
          message += ` エラー: ${result.errors.length}件 - ${result.errors.join(', ')}`;
          setImportResult({ success: false, message });
        } else {
          setImportResult({ success: true, message });
        }
      } catch (error) {
        console.error("CSVインポートエラー:", error);
        setImportResult({ success: false, message: `インポート処理中にエラーが発生しました: ${(error as Error).message}` });
      } finally {
        setIsImporting(false);
        setImportFile(null); 
        const fileInput = document.getElementById('csv-file-input') as HTMLInputElement;
        if(fileInput) fileInput.value = '';
      }
    };
    reader.readAsText(importFile);
  }, [importFile]);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-semibold text-gray-800">CSVインポート/エクスポート</h1>

      {/* Export Section */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-700 mb-3 flex items-center">
          <ArrowDownOnSquareIcon className="h-6 w-6 mr-2 text-sky-600" />
          商品データのエクスポート
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          現在のすべての商品データをCSVファイルとしてダウンロードします。棚卸しやバックアップに利用できます。
        </p>
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-sky-600 hover:bg-sky-700 disabled:opacity-50"
        >
          {isExporting ? <LoadingSpinner size="sm" /> : 'エクスポート実行'}
        </button>
      </div>

      {/* Import Section */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-700 mb-3 flex items-center">
          <ArrowUpOnSquareIcon className="h-6 w-6 mr-2 text-green-600" />
          商品データのインポート
        </h2>
        <div className="p-4 bg-yellow-50 text-yellow-800 rounded-lg text-sm mb-4 space-y-2 border border-yellow-200">
            <p className="font-bold text-base">重要: インポートの前に必ずお読みください</p>
            <ul className="list-disc list-inside space-y-1">
                <li><strong className="font-semibold">バックアップ:</strong> インポート処理は元に戻せません。実行前に必ず現在のデータをエクスポートしてバックアップしてください。</li>
                <li><strong className="font-semibold">ヘッダー行:</strong> CSVファイルの1行目は、テンプレートと同じヘッダー行である必要があります。</li>
                <li><strong className="font-semibold">更新/新規の判定:</strong> <code>barcode</code>列の値でシステム内の商品と照合します。
                    <ul className="list-['-_'] list-inside pl-4">
                        <li>一致するバーコードが存在する場合、その商品の情報がCSVの内容で<strong className="text-blue-700">更新</strong>されます。</li>
                        <li>一致するバーコードが存在しない場合、<strong className="text-green-700">新規商品</strong>として登録されます。</li>
                    </ul>
                </li>
                 <li><strong className="font-semibold">新規登録時の必須項目:</strong> 新規登録の場合、<code>name</code>, <code>categoryId</code>, <code>supplierId</code> は必須です。これらが空欄の行は無視されます。</li>
                 <li><strong className="font-semibold">空欄の扱い:</strong> 更新時、CSVファイルのセルが空欄の場合、その項目は更新されず元のデータが維持されます。値を空にしたい場合は、半角スペースなどを入力してください。（在庫数などを0にしたい場合は`0`と入力）</li>
            </ul>
        </div>

        <div className="mb-4">
          <button
            onClick={handleDownloadTemplate}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
          >
            <DocumentTextIcon className="h-5 w-5 mr-2 text-gray-500" />
            テンプレートをダウンロード
          </button>
        </div>
        
        <div className="flex items-center space-x-4">
          <input
            id="csv-file-input"
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
          />
          <button
            onClick={handleImport}
            disabled={isImporting || !importFile}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
          >
            {isImporting ? <LoadingSpinner size="sm" /> : 'インポート実行'}
          </button>
        </div>

        {importResult && (
          <div className={`mt-4 p-3 rounded-md text-sm flex items-start gap-2 ${importResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {importResult.success ? <CheckCircleIcon className="h-5 w-5 flex-shrink-0"/> : <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0"/>}
            <p>{importResult.message}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCsvPage;