'use client';

import dynamic from 'next/dynamic';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AdminDashboardData } from '@/types';
import { getAdminDashboardData } from '@/services/apiClient';
import LoadingSpinner from '@/components/LoadingSpinner';
import { UI_TEXT } from '@/constants';
import { ArrowDownTrayIcon, ArrowUpTrayIcon, FireIcon, ExclamationTriangleIcon, ChartBarIcon, ArchiveBoxIcon, BellAlertIcon, CurrencyYenIcon, ArchiveBoxXMarkIcon, ArrowPathIcon, BanknotesIcon, InformationCircleIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { QuestionMarkCircleIcon } from '@heroicons/react/24/solid';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import HelpModal from '@/components/HelpModal';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactElement<React.SVGProps<SVGSVGElement>>;
  color: string;
  subText?: string;
  tooltip?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, subText, tooltip }) => (
  <div className="relative group">
    <div className={`bg-white shadow-lg rounded-xl p-6 flex items-center space-x-4 border-l-4 ${color}`}>
        <div className={`p-3 rounded-full ${color.replace('border-l-', 'bg-').replace('-500', '-100')}`}>
          {React.cloneElement(icon, { className: `h-8 w-8 ${color.replace('border-l-', 'text-')}` })}
        </div>
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-2xl font-semibold text-gray-800">{value}</p>
          {subText && <p className="text-sm text-gray-400">{subText}</p>}
        </div>
    </div>
    {tooltip && (
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 text-sm text-white bg-gray-800 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
        {tooltip}
      </div>
    )}
  </div>
);

const AdminDashboardPageComponent: React.FC = () => {
  const { currentUser } = useAuth();
  const [adminData, setAdminData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const currentDate = new Date();
        const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString().split('T')[0];
        const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString().split('T')[0];
        const periodLabel = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
        
        const data = await getAdminDashboardData(startDate, endDate, periodLabel);
        setAdminData(data);
      } catch (err) {
        console.error('Failed to fetch admin dashboard data:', err);
        setError('ダッシュボードデータの取得に失敗しました。');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  if (!adminData) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <p className="text-yellow-800">データが利用できません。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">管理ダッシュボード</h1>
        <div className="flex items-center space-x-4">
          <a
            href="/dashboard"
            className="flex items-center space-x-2 px-4 py-2 text-blue-600 hover:text-blue-800 font-medium"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            <span>スタッフメニューに戻る</span>
          </a>
          <button
            onClick={() => setShowHelp(true)}
            className="p-2 text-gray-400 hover:text-gray-600"
          >
            <QuestionMarkCircleIcon className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title={UI_TEXT.TOTAL_INVENTORY_VALUE}
          value={`¥${adminData.totalInventoryValue.toLocaleString()}`}
          icon={<CurrencyYenIcon />}
          color="border-l-blue-500"
          tooltip="現在の総在庫評価額"
        />
        <StatCard
          title={UI_TEXT.LOW_STOCK_ITEMS_COUNT}
          value={adminData.lowStockItemsCount}
          icon={<ExclamationTriangleIcon />}
          color="border-l-red-500"
          tooltip="在庫が最低在庫数を下回っている商品数"
        />
        <StatCard
          title={UI_TEXT.PENDING_INTAKE_APPROVALS}
          value={adminData.pendingIntakeApprovals}
          icon={<BellAlertIcon />}
          color="border-l-yellow-500"
          tooltip="承認待ちの入荷処理数"
        />
        <StatCard
          title={UI_TEXT.OBSOLETE_STOCK_ITEMS_COUNT}
          value={adminData.obsoleteStockItemsCount}
          icon={<ArchiveBoxXMarkIcon />}
          color="border-l-orange-500"
          tooltip="不良在庫として分類されている商品数"
        />
      </div>

      {/* 期間別サマリー */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">期間別サマリー ({adminData.selectedPeriodSummary.periodLabel})</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-sm text-gray-500">期間合計</p>
            <p className="text-2xl font-bold text-blue-600">¥{adminData.selectedPeriodSummary.totalForPeriod.toLocaleString()}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">前年同期</p>
            <p className="text-2xl font-bold text-gray-600">¥{adminData.selectedPeriodSummary.totalForPreviousPeriod.toLocaleString()}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">増減</p>
            <p className={`text-2xl font-bold ${adminData.selectedPeriodSummary.totalForPeriod > adminData.selectedPeriodSummary.totalForPreviousPeriod ? 'text-green-600' : 'text-red-600'}`}>
              {adminData.selectedPeriodSummary.totalForPeriod > adminData.selectedPeriodSummary.totalForPreviousPeriod ? '+' : ''}
              ¥{(adminData.selectedPeriodSummary.totalForPeriod - adminData.selectedPeriodSummary.totalForPreviousPeriod).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* 仕入先別パフォーマンス */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">仕入先別パフォーマンス</h2>
        <div className="space-y-4">
          {adminData.selectedPeriodSummary.supplierPerformances.map((supplier) => (
            <div key={supplier.supplierId} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">{supplier.supplierName}</p>
                <p className="text-sm text-gray-500">
                  期間合計: ¥{supplier.currentPeriodTotal.toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className={`font-medium ${supplier.percentageChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {supplier.percentageChange >= 0 ? '+' : ''}{(supplier.percentageChange * 100).toFixed(1)}%
                </p>
                <p className="text-sm text-gray-500">
                  前年同期: ¥{supplier.previousPeriodTotal.toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 在庫推移グラフ */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">在庫推移</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={adminData.inventoryMovement}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value) => [`¥${value.toLocaleString()}`, '']} />
            <Legend />
            <Line type="monotone" dataKey="intake" stroke="#3B82F6" name="入荷" />
            <Line type="monotone" dataKey="outbound" stroke="#EF4444" name="出庫" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* カテゴリ別パフォーマンス */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">カテゴリ別パフォーマンス</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={adminData.categoryPerformance}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="categoryName" />
            <YAxis />
            <Tooltip formatter={(value) => [`¥${value.toLocaleString()}`, '']} />
            <Legend />
            <Bar dataKey="inventoryValue" fill="#3B82F6" name="在庫評価額" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
    </div>
  );
};

// 動的インポートでSSRを無効化
const AdminDashboardPage = dynamic(() => Promise.resolve(AdminDashboardPageComponent), {
  ssr: false,
});

export default AdminDashboardPage; 