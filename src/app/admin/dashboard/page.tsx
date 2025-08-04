'use client';

import dynamic from 'next/dynamic';
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AdminDashboardData, SupplierMonthlyPerformance, TableHeader } from '@/types';
import { getAdminDashboardData } from '@/services/apiClient';
import LoadingSpinner from '@/components/LoadingSpinner';
import Table from '@/components/Table';
import { UI_TEXT } from '@/constants';
import ErrorMessage from '@/components/ErrorMessage';
import { 
  ArrowDownTrayIcon, 
  CalendarDaysIcon, 
  BanknotesIcon, 
  ArchiveBoxIcon, 
  BellAlertIcon, 
  ExclamationTriangleIcon, 
  ShoppingCartIcon, 
  CurrencyYenIcon, 
  ChevronDownIcon, 
  InformationCircleIcon 
} from '@heroicons/react/24/outline';

const StatCard: React.FC<{ 
  title: string; 
  value: string | number; 
  icon: React.ReactElement<React.SVGProps<SVGSVGElement>>; 
  subText?: string; 
  bgColor?: string; 
  textColor?: string; 
  borderColor?: string 
}> = ({ 
  title, 
  value, 
  icon, 
  subText, 
  bgColor = 'bg-sky-100', 
  textColor = 'text-sky-800', 
  borderColor = 'border-sky-500' 
}) => (
  <div className={`bg-white shadow-lg rounded-xl p-5 border-l-4 ${borderColor}`}>
    <div className="flex items-center space-x-4">
      <div className={`p-3 rounded-full ${bgColor}`}>
        {React.cloneElement(icon, { className: `h-7 w-7 ${textColor}` })} 
      </div>
      <div>
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <p className="text-2xl font-semibold text-gray-800">{value}</p>
        {subText && <p className="text-xs text-gray-400">{subText}</p>}
      </div>
    </div>
  </div>
);

// Helper function to convert data to CSV
const convertToCSV = (data: SupplierMonthlyPerformance[], headers: { key: keyof SupplierMonthlyPerformance | string, label: string }[]): string => {
  const headerRow = headers.map(h => h.label).join(',');
  const rows = data.map(item => {
    return headers.map(header => {
      let val = item[header.key as keyof SupplierMonthlyPerformance];
      if (header.key === 'percentageChange') {
        val = (Number(val) * 100).toFixed(1) + '%';
        if (val === 'Infinity%') val = 'N/A';
      } else if (typeof val === 'number') {
        val = val.toLocaleString();
      }
      return `"${String(val ?? '').replace(/"/g, '""')}"`; // Escape double quotes
    }).join(',');
  });
  return [headerRow, ...rows].join('\r\n');
};

const downloadCSV = (csvStr: string, filename: string) => {
  const blob = new Blob([`\uFEFF${csvStr}`], { type: 'text/csv;charset=utf-8;' }); // Add BOM for Excel
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

type PeriodSelectionType = 'specific_month' | 'last_1_month' | 'last_3_months' | 'last_6_months' | 'last_12_months';

const periodOptions: { value: PeriodSelectionType; label: string }[] = [
  { value: 'specific_month', label: '特定月' },
  { value: 'last_1_month', label: '過去1ヶ月' },
  { value: 'last_3_months', label: '過去3ヶ月' },
  { value: 'last_6_months', label: '過去6ヶ月' },
  { value: 'last_12_months', label: '過去1年間' },
];

const AdminDashboardPageComponent: React.FC = () => {
  const { currentUser } = useAuth();
  const [dashboardData, setDashboardData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [periodType, setPeriodType] = useState<PeriodSelectionType>('specific_month');
  const [specificMonthValue, setSpecificMonthValue] = useState<string>(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });

  const fetchDashboardData = useCallback(async (startDate: string, endDate: string, displayLabel: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminDashboardData(startDate, endDate, displayLabel);
      setDashboardData(data);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('ダッシュボードデータの読み込みに失敗しました。');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let startDate: Date;
    let endDate: Date;
    let displayLabel: string;
    const today = new Date();

    switch (periodType) {
      case 'last_1_month':
        endDate = new Date(today.getFullYear(), today.getMonth(), 0); // End of last month
        startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1); // Start of last month
        displayLabel = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}`;
        break;
      case 'last_3_months':
        endDate = new Date(today.getFullYear(), today.getMonth(), 0);
        startDate = new Date(endDate.getFullYear(), endDate.getMonth() - 2, 1);
        displayLabel = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')} 〜 ${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}`;
        break;
      case 'last_6_months':
        endDate = new Date(today.getFullYear(), today.getMonth(), 0);
        startDate = new Date(endDate.getFullYear(), endDate.getMonth() - 5, 1);
        displayLabel = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')} 〜 ${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}`;
        break;
      case 'last_12_months':
        endDate = new Date(today.getFullYear(), today.getMonth(), 0);
        startDate = new Date(endDate.getFullYear(), endDate.getMonth() - 11, 1);
        displayLabel = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')} 〜 ${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}`;
        break;
      default: // specific_month
        const [year, month] = specificMonthValue.split('-').map(Number);
        startDate = new Date(year, month - 1, 1);
        endDate = new Date(year, month, 0);
        displayLabel = specificMonthValue;
    }

    fetchDashboardData(
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0],
      displayLabel
    );
  }, [periodType, specificMonthValue, fetchDashboardData]);

  const handleExportCSV = () => {
    if (!dashboardData?.selectedPeriodSummary?.supplierPerformances) return;
    
    const headers = [
      { key: 'supplierName', label: '仕入先名' },
      { key: 'currentPeriodTotal', label: '当期合計' },
      { key: 'previousPeriodTotal', label: '前期合計' },
      { key: 'difference', label: '差額' },
      { key: 'percentageChange', label: '変化率' },
    ];
    
    const csvContent = convertToCSV(dashboardData.selectedPeriodSummary.supplierPerformances, headers);
    downloadCSV(csvContent, `supplier_performance_${dashboardData.selectedPeriodSummary.periodLabel}.csv`);
  };

  const tableHeaders: TableHeader<SupplierMonthlyPerformance>[] = [
    { key: 'supplierName', label: '仕入先名' },
    { key: 'currentPeriodTotal', label: '当期合計', render: (item) => `¥${item.currentPeriodTotal.toLocaleString()}` },
    { key: 'previousPeriodTotal', label: '前期合計', render: (item) => `¥${item.previousPeriodTotal.toLocaleString()}` },
    { key: 'difference', label: '差額', render: (item) => `¥${item.difference.toLocaleString()}` },
    { key: 'percentageChange', label: '変化率', render: (item) => `${(item.percentageChange * 100).toFixed(1)}%` },
  ];

  if (loading) return <LoadingSpinner message="ダッシュボードデータを読み込み中..." />;

  return (
    <div className="space-y-8">
      {/* ヘッダー */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">管理ダッシュボード</h1>
            <p className="text-gray-600 mt-2">システム全体の統計情報を確認できます</p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={periodType}
              onChange={(e) => setPeriodType(e.target.value as PeriodSelectionType)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {periodOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            {periodType === 'specific_month' && (
              <input
                type="month"
                value={specificMonthValue}
                onChange={(e) => setSpecificMonthValue(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}
            <button
              onClick={handleExportCSV}
              disabled={!dashboardData?.selectedPeriodSummary?.supplierPerformances}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              <span>CSV出力</span>
            </button>
          </div>
        </div>
      </div>

      {/* エラーメッセージ */}
      {error && <ErrorMessage message={error} />}

      {/* 統計カード */}
      {dashboardData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="総在庫価値"
            value={`¥${dashboardData.totalInventoryValue.toLocaleString()}`}
            icon={<CurrencyYenIcon />}
            bgColor="bg-green-100"
            textColor="text-green-800"
            borderColor="border-green-500"
          />
          <StatCard
            title="低在庫商品数"
            value={dashboardData.lowStockItemsCount}
            icon={<ExclamationTriangleIcon />}
            bgColor="bg-yellow-100"
            textColor="text-yellow-800"
            borderColor="border-yellow-500"
          />
          <StatCard
            title="入荷承認待ち"
            value={dashboardData.pendingIntakeApprovals}
            icon={<BellAlertIcon />}
            bgColor="bg-blue-100"
            textColor="text-blue-800"
            borderColor="border-blue-500"
          />
          <StatCard
            title="廃番在庫数"
            value={dashboardData.obsoleteStockItemsCount}
            icon={<ArchiveBoxIcon />}
            bgColor="bg-red-100"
            textColor="text-red-800"
            borderColor="border-red-500"
          />
        </div>
      )}

      {/* 仕入先パフォーマンス */}
      {dashboardData?.selectedPeriodSummary && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">仕入先パフォーマンス</h2>
            <div className="text-sm text-gray-600">
              期間: {dashboardData.selectedPeriodSummary.periodLabel}
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table headers={tableHeaders} data={dashboardData.selectedPeriodSummary.supplierPerformances} itemKey="supplierId" />
          </div>
        </div>
      )}

      {/* 在庫ウォッチリスト */}
      {dashboardData?.inventoryWatchlist && dashboardData.inventoryWatchlist.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">在庫ウォッチリスト</h2>
          <div className="space-y-3">
            {dashboardData.inventoryWatchlist.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{item.product.name}</p>
                  <p className="text-sm text-gray-600">現在在庫: {item.product.currentStock}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">理由: {item.reason}</p>
                  <p className="text-xs text-gray-500">{item.daysSinceLastUpdate}日前の更新</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const AdminDashboardPage = dynamic(() => Promise.resolve(AdminDashboardPageComponent), { ssr: false });
export default AdminDashboardPage; 