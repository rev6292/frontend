'use client';

import dynamic from 'next/dynamic';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { MonthlyReportDataPoint } from '@/types';
import { getMonthlyPurchaseReport } from '@/services/apiClient';
import LoadingSpinner from '@/components/LoadingSpinner';
import { UI_TEXT } from '@/constants';
import { ChartBarIcon, CalendarIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const ReportsPageComponent: React.FC = () => {
  const { currentUser } = useAuth();
  const [reportData, setReportData] = useState<MonthlyReportDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const currentDate = new Date();
        const month = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
        setSelectedMonth(month);
        
        const data = await getMonthlyPurchaseReport(month);
        setReportData(data);
      } catch (err) {
        console.error('Failed to fetch monthly report data:', err);
        setError('月次レポートデータの取得に失敗しました。');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser]);

  const handleMonthChange = async (month: string) => {
    setSelectedMonth(month);
    setLoading(true);
    setError(null);
    
    try {
      const data = await getMonthlyPurchaseReport(month);
      setReportData(data);
    } catch (err) {
      console.error('Failed to fetch monthly report data:', err);
      setError('月次レポートデータの取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!reportData.length) return;
    
    const headers = ['仕入先', '月次合計'];
    const csvContent = [
      headers.join(','),
      ...reportData.map(item => `${item.supplierName},${item.totalAmount}`)
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `monthly_report_${selectedMonth}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">月次レポート</h1>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <CalendarIcon className="h-5 w-5 text-gray-500" />
            <select
              value={selectedMonth}
              onChange={(e) => handleMonthChange(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Array.from({ length: 12 }, (_, i) => {
                const date = new Date();
                date.setMonth(date.getMonth() - i);
                const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                return (
                  <option key={month} value={month}>
                    {date.getFullYear()}年{date.getMonth() + 1}月
                  </option>
                );
              })}
            </select>
          </div>
          <button
            onClick={exportToCSV}
            disabled={!reportData.length}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowDownTrayIcon className="h-5 w-5" />
            <span>CSVダウンロード</span>
          </button>
        </div>
      </div>

      {reportData.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center">
            <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">選択された月のデータがありません。</p>
          </div>
        </div>
      ) : (
        <>
          {/* サマリー統計 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">総仕入額</h3>
              <p className="text-3xl font-bold text-blue-600">
                ¥{reportData.reduce((sum, item) => sum + item.totalAmount, 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">仕入先数</h3>
              <p className="text-3xl font-bold text-green-600">
                {reportData.length}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">平均仕入額</h3>
              <p className="text-3xl font-bold text-purple-600">
                ¥{Math.round(reportData.reduce((sum, item) => sum + item.totalAmount, 0) / reportData.length).toLocaleString()}
              </p>
            </div>
          </div>

          {/* 仕入先別グラフ */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">仕入先別月次仕入額</h2>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={reportData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="supplierName" />
                <YAxis />
                <Tooltip formatter={(value) => [`¥${value.toLocaleString()}`, '仕入額']} />
                <Legend />
                <Bar dataKey="totalAmount" fill="#3B82F6" name="仕入額" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 円グラフ */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">仕入先別構成比</h2>
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={reportData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent || 0 * 100).toFixed(0)}%`}
                  outerRadius={150}
                  fill="#8884d8"
                  dataKey="totalAmount"
                >
                  {reportData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`¥${value.toLocaleString()}`, '仕入額']} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* 詳細テーブル */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">詳細データ</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      仕入先
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      月次仕入額
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      構成比
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reportData.map((item, index) => {
                    const total = reportData.reduce((sum, i) => sum + i.totalAmount, 0);
                    const percentage = ((item.totalAmount / total) * 100).toFixed(1);
                    return (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.supplierName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ¥{item.totalAmount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {percentage}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// 動的インポートでSSRを無効化
const ReportsPage = dynamic(() => Promise.resolve(ReportsPageComponent), {
  ssr: false,
});

export default ReportsPage; 