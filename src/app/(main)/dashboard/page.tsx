'use client';

import dynamic from 'next/dynamic';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useStore } from '@/contexts/StoreContext';
import { UserRole, AdminDashboardData, StaffDashboardData, ProductWithStock, CategoryPerformance } from '@/types';
import apiClient from '@/services/apiClient';
import LoadingSpinner from '@/components/LoadingSpinner';
import { UI_TEXT } from '@/constants';
import { ArrowDownTrayIcon, ArrowUpTrayIcon, FireIcon, ExclamationTriangleIcon, ChartBarIcon, ArchiveBoxIcon, BellAlertIcon, CurrencyYenIcon, ArchiveBoxXMarkIcon, ArrowPathIcon, BanknotesIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { QuestionMarkCircleIcon } from '@heroicons/react/24/solid';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, Treemap } from 'recharts';
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

// --- Custom Treemap Content Renderer ---
const getTurnoverColor = (rate: number, minRate: number, maxRate: number): string => {
  if (maxRate <= minRate) return '#a7f3d0'; // emerald-200
  const normalized = (rate - minRate) / (maxRate - minRate);
  const colors = [
    '#fecaca', // red-200
    '#fed7aa', // orange-200
    '#fef08a', // yellow-200
    '#d9f99d', // lime-200
    '#a7f3d0', // emerald-200
    '#6ee7b7', // emerald-300
    '#34d399', // emerald-400
    '#10b981', // emerald-500
  ];
  const index = Math.min(colors.length - 1, Math.floor(normalized * colors.length));
  return colors[index];
};

const CustomizedTreemapContent: React.FC<any> = (props) => {
  const { root, depth, x, y, width, height, index, name, inventoryValue, turnoverRate, minRate, maxRate } = props;

  if (inventoryValue === undefined) return null;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          fill: turnoverRate !== undefined ? getTurnoverColor(turnoverRate, minRate, maxRate) : '#f3f4f6',
          stroke: '#fff',
          strokeWidth: 2 / (depth + 1e-10),
          strokeOpacity: 1 / (depth + 1e-10),
        }}
      />
      {width > 100 && height > 60 ? (
        <text x={x + width / 2} y={y + height / 2 + 7} textAnchor="middle" fill="#1f2937" fontSize={14} fontWeight="bold">
          {name}
        </text>
      ) : null}
      {width > 100 && height > 80 && typeof inventoryValue === 'number' ? (
        <text x={x + width / 2} y={y + height / 2 + 25} textAnchor="middle" fill="#4b5563" fontSize={14}>
          ¥{inventoryValue.toLocaleString()}
        </text>
      ) : null}
    </g>
  );
};


const DashboardPageComponent: React.FC = () => {
  const { currentUser } = useAuth();
  const { selectedStoreId } = useStore();
  const [adminData, setAdminData] = useState<AdminDashboardData | null>(null);
  const [staffData, setStaffData] = useState<StaffDashboardData | null>(null);
  const [lowStockProducts, setLowStockProducts] = useState<ProductWithStock[]>([]);
  const [loading, setLoading] = useState(true); // 初期値をtrueに
  const [error, setError] = useState<string | null>(null);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  // デバッグ用：コンポーネントのマウントと状態をログ出力
  useEffect(() => {
    console.log('Dashboard: Component mounted');
    console.log('Dashboard: currentUser:', currentUser);
    console.log('Dashboard: selectedStoreId:', selectedStoreId);
  }, []);

  useEffect(() => {
    console.log('Dashboard useEffect triggered. currentUser:', currentUser, 'selectedStoreId:', selectedStoreId);

    const fetchData = async () => {
      if (!currentUser) {
        console.log('fetchData: currentUser is null/undefined. Returning.');
        setLoading(false); // ここでローディングを解除
        return;
      }

      setLoading(true); // API呼び出し開始時にローディングを設定
      setError(null);
      console.log('fetchData: Using mock data for development');

      try {
        // 開発中はモックデータを使用
        const mockAdminData: AdminDashboardData = {
          totalInventoryValue: 1250000,
          lowStockItemsCount: 8,
          pendingIntakeApprovals: 3,
          obsoleteStockItemsCount: 2,
          selectedPeriodSummary: {
            periodLabel: '2024-01',
            supplierPerformances: [
              {
                supplierId: 'supplier1',
                supplierName: 'サプライヤーA',
                currentPeriodTotal: 450000,
                previousPeriodTotal: 420000,
                difference: 30000,
                percentageChange: 0.07,
              },
            ],
            totalForPeriod: 450000,
            totalForPreviousPeriod: 420000,
          },
          currentCalendarMonthStats: {
            month: '2024-01',
            totalMaterialCost: 450000,
          },
          totalIntakeItemsThisMonth: 25,
          totalOutboundItemsThisMonth: 30,
          topOutboundProductsThisMonth: [
            { productId: '1', productName: '商品A', totalQuantity: 50 },
            { productId: '2', productName: '商品B', totalQuantity: 30 },
          ],
          inventoryWatchlist: [
            {
              product: {
                id: '1',
                name: '商品A',
                barcode: '123456789',
                category: '食品',
                categoryId: 'cat1',
                costPrice: 100,
                supplierId: 'supplier1',
                lastUpdated: new Date().toISOString(),
                currentStock: 5,
                minimumStock: 10,
              },
              reason: 'obsolete',
              daysSinceLastUpdate: 30,
            },
          ],
          obsoleteStockValue: 50000,
          inventoryTurnoverRate: 0.85,
          inventoryMovement: [
            { month: '2024-01', intake: 450000, outbound: 380000 },
            { month: '2024-02', intake: 480000, outbound: 410000 },
          ],
          categoryPerformance: [
            { categoryId: 'cat1', categoryName: '食品', inventoryValue: 450000, turnoverRate: 0.85 },
            { categoryId: 'cat2', categoryName: '飲料', inventoryValue: 320000, turnoverRate: 0.92 },
            { categoryId: 'cat3', categoryName: '日用品', inventoryValue: 280000, turnoverRate: 0.78 },
            { categoryId: 'cat4', categoryName: '雑貨', inventoryValue: 200000, turnoverRate: 0.65 },
          ],
        };

        const mockStaffData: StaffDashboardData = {
          approxTotalInventoryValue: '約 ¥1,250,000',
          lowStockItemsCount: 3,
          totalIntakeItemsThisMonth: 25,
          totalOutboundItemsThisMonth: 30,
          topOutboundProductsThisMonth: [
            { productId: '1', productName: '商品A', totalQuantity: 50 },
            { productId: '2', productName: '商品B', totalQuantity: 30 },
          ],
        };

        const mockProducts: ProductWithStock[] = [
          {
            id: '1',
            name: '商品A',
            category: '食品',
            categoryId: 'cat1',
            barcode: '123456789',
            costPrice: 100,
            supplierId: 'supplier1',
            lastUpdated: new Date().toISOString(),
            currentStock: 5,
            minimumStock: 10,
          },
          {
            id: '2',
            name: '商品B',
            category: '飲料',
            categoryId: 'cat2',
            barcode: '987654321',
            costPrice: 80,
            supplierId: 'supplier2',
            lastUpdated: new Date().toISOString(),
            currentStock: 15,
            minimumStock: 5,
          },
        ];

        // モックデータを設定
        if (currentUser.role === UserRole.ADMIN) {
          setAdminData(mockAdminData);
          console.log('Admin Data set:', mockAdminData);
        } else if (currentUser.role === UserRole.STAFF) {
          setStaffData(mockStaffData);
          console.log('Staff Data set:', mockStaffData);
        }

        setLowStockProducts(mockProducts.filter(p => p.currentStock <= p.minimumStock));
        
      } catch (err) {
        console.log('Error fetching dashboard data:', err);
        setError(UI_TEXT.ERROR_LOADING_DATA);
        console.error(err);
      } finally {
        setLoading(false); // API呼び出し完了時にローディングを解除
      }
    };

    fetchData();
  }, [currentUser, selectedStoreId]);

  console.log('Dashboard rendering. loading:', loading, 'error:', error, 'adminData:', adminData, 'staffData:', staffData); // ログの順番を調整
  if (loading) return <LoadingSpinner message={UI_TEXT.LOADING} />;
  if (error) return <p className="text-red-500">{error}</p>;

  console.log('Dashboard rendering. adminData:', adminData); // ★追加

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-semibold text-gray-800">ダッシュボード</h1>
        <button
          onClick={() => setIsHelpModalOpen(true)}
          className="flex items-center gap-2 text-sm text-white bg-sky-600 hover:bg-sky-700 font-semibold py-2 px-4 rounded-lg shadow-sm transition-colors"
        >
          <QuestionMarkCircleIcon className="h-5 w-5" />
          ヘルプ / ガイド
        </button>
      </div>
      
      {/* テスト表示 */}
      <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
        <p>✅ ダッシュボードページが正常に表示されています</p>
        <p>ユーザー: {currentUser?.name} ({currentUser?.role})</p>
        <p>選択店舗: {selectedStoreId}</p>
      </div>
      
      {currentUser?.role === UserRole.ADMIN && adminData && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard title="総在庫評価額" value={`¥${adminData.totalInventoryValue.toLocaleString()}`} icon={<BanknotesIcon />} color="border-l-blue-500" tooltip="(各商品の原価 × 現在庫数) の合計です。会社の資産価値の重要な指標です。" />
            <StatCard title="不良在庫金額" value={`¥${adminData.obsoleteStockValue.toLocaleString()}`} icon={<ArchiveBoxXMarkIcon />} color="border-l-red-500" subText="6ヶ月以上動きなし" tooltip="長期間、入出庫の動きがない商品の在庫金額の合計です。この金額が高いほどキャッシュフローが悪化している可能性があります。" />
            <StatCard title="在庫回転率" value={adminData.inventoryTurnoverRate.toFixed(2)} icon={<ArrowPathIcon />} color="border-l-green-500" subText="年間換算 (直近3ヶ月)" tooltip="在庫がどれだけ効率的に出庫(売上)に変わっているかを示す指標。数値が高いほど効率的に資本が使われていることを意味します。" />
            <StatCard title="当月入庫アイテム数" value={adminData.totalIntakeItemsThisMonth.toLocaleString()} icon={<ArrowDownTrayIcon />} color="border-l-sky-500" tooltip="今月、入荷処理が完了した商品の総数です。" />
            <StatCard title="当月出庫アイテム数" value={adminData.totalOutboundItemsThisMonth.toLocaleString()} icon={<ArrowUpTrayIcon />} color="border-l-rose-500" tooltip="今月、出庫処理された商品の総数です。" />
            <StatCard title="在庫僅少品目数" value={adminData.lowStockItemsCount} icon={<BellAlertIcon />} color="border-l-yellow-500" tooltip="現在庫数が最低在庫数を下回っている商品の数です。発注の目安となります。" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white shadow-lg rounded-xl p-6">
               <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center">
                <ChartBarIcon className="h-6 w-6 mr-2 text-indigo-500" />
                在庫推移 (過去6ヶ月)
                <div className="relative group ml-2" role="tooltip" aria-describedby="inventory-movement-tooltip">
                    <InformationCircleIcon className="h-5 w-5 text-gray-400 cursor-help" />
                    <div id="inventory-movement-tooltip" className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 text-sm text-white bg-gray-800 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
                        過去6ヶ月間の総入庫数と総出庫数の推移です。季節的な需要の波や仕入れの傾向を把握できます。
                    </div>
                </div>
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={adminData.inventoryMovement} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="intake" name="総入庫数" stroke="#38bdf8" strokeWidth={2} />
                  <Line type="monotone" dataKey="outbound" name="総出庫数" stroke="#f43f5e" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white shadow-lg rounded-xl p-6">
               <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center">
                <ArchiveBoxIcon className="h-6 w-6 mr-2 text-teal-500" />
                カテゴリ別 ポートフォリオ分析
                 <div className="relative group ml-2" role="tooltip" aria-describedby="category-portfolio-tooltip">
                    <InformationCircleIcon className="h-5 w-5 text-gray-400 cursor-help" />
                    <div id="category-portfolio-tooltip" className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-3 text-sm text-white bg-gray-800 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
                        <p><strong className="font-semibold">ブロックの大きさ:</strong> 在庫金額の大きさ</p>
                        <p><strong className="font-semibold">ブロックの色:</strong> 在庫回転率の高さ (緑が濃いほど高い)</p>
                        <p className="mt-1 pt-1 border-t border-gray-600">「大きくて色が薄い(赤系)」カテゴリは過剰在庫の可能性があります。</p>
                    </div>
                </div>
              </h2>
              {adminData.categoryPerformance.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <Treemap
                    data={adminData.categoryPerformance}
                    dataKey="inventoryValue"
                    nameKey="categoryName"
                    aspectRatio={4 / 3}
                    stroke="#fff"
                    content={<CustomizedTreemapContent minRate={Math.min(...adminData.categoryPerformance.map(c => c.turnoverRate))} maxRate={Math.max(...adminData.categoryPerformance.map(c => c.turnoverRate))}/>}
                  >
                    <Tooltip formatter={(value: number, name: string, props: {payload?: CategoryPerformance}) => props.payload ? [`¥${(props.payload.inventoryValue || 0).toLocaleString()}`, `回転率: ${props.payload.turnoverRate.toFixed(2)}`] : [name, `回転率: N/A`]}/>
                  </Treemap>
                </ResponsiveContainer>
              ) : (
                 <p className="text-gray-500 text-center py-10">カテゴリ分析データがありません。</p>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white shadow-lg rounded-xl p-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center">
                <FireIcon className="h-6 w-6 mr-2 text-red-500" />
                当月 人気商品ランキング (出庫数)
              </h2>
              {adminData.topOutboundProductsThisMonth.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={adminData.topOutboundProductsThisMonth.map(p=>({...p, productName: p.productName.substring(0,15)}))} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="productName" width={120} tick={{ fontSize: 14 }} />
                    <Tooltip formatter={(value) => `${value} 点`} />
                    <Legend />
                    <Bar dataKey="totalQuantity" fill="#f43f5e" name="出庫数" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500 text-center py-10">今月の出庫データはありません。</p>
              )}
            </div>

            <div className="bg-white shadow-lg rounded-xl p-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center">
                <ExclamationTriangleIcon className="h-6 w-6 mr-2 text-orange-500" />
                要注意在庫リスト
              </h2>
              {adminData.inventoryWatchlist.length > 0 ? (
                  <ul className="divide-y divide-gray-200 max-h-[300px] overflow-y-auto pr-2">
                    {adminData.inventoryWatchlist.slice(0, 10).map(item => ( // Limit to top 10 for display
                        <li key={item.product.id} className="py-3 flex justify-between items-center">
                            <div>
                                <p className="font-medium text-gray-800">{item.product.name}</p>
                                <p className="text-sm text-gray-500">
                                    {item.reason === 'obsolete' 
                                        ? <span className="text-red-600 font-semibold">不良在庫</span>
                                        : <span className="text-yellow-600 font-semibold">過剰在庫</span>
                                    }
                                    <span className="ml-2"> - 最終変動から {item.daysSinceLastUpdate}日経過</span>
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="font-semibold">{item.product.currentStock}点</p>
                                <p className="text-sm text-gray-500">最低: {item.product.minimumStock}</p>
                            </div>
                        </li>
                    ))}
                </ul>
              ) : (
                  <p className="text-gray-500 text-center py-10">現在、注意が必要な在庫はありません。</p>
              )}
            </div>
          </div>
        </>
      )}

      {currentUser?.role === UserRole.STAFF && staffData && (
        <>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="総在庫評価額 (概算)" value={staffData.approxTotalInventoryValue} icon={<CurrencyYenIcon />} color="border-l-blue-500" />
            <StatCard title="当月入庫アイテム数" value={staffData.totalIntakeItemsThisMonth.toLocaleString()} icon={<ArrowDownTrayIcon />} color="border-l-sky-500" />
            <StatCard title="当月出庫アイテム数" value={staffData.totalOutboundItemsThisMonth.toLocaleString()} icon={<ArrowUpTrayIcon />} color="border-l-rose-500" />
            <StatCard title="在庫僅少品目数" value={staffData.lowStockItemsCount} icon={<BellAlertIcon />} color="border-l-yellow-500" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white shadow-lg rounded-xl p-6">
                <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center">
                    <FireIcon className="h-6 w-6 mr-2 text-red-500" />
                    当月 人気商品ランキング (出庫数)
                </h2>
                {staffData.topOutboundProductsThisMonth.length > 0 ? (
                   <ResponsiveContainer width="100%" height={300}>
                     <BarChart data={staffData.topOutboundProductsThisMonth.map(p=>({...p, productName: p.productName.substring(0,15)}))} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="productName" width={120} tick={{ fontSize: 14 }} />
                        <Tooltip formatter={(value) => `${value} 点`} />
                        <Legend />
                        <Bar dataKey="totalQuantity" fill="#f43f5e" name="出庫数" />
                      </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <p className="text-gray-500 text-center py-10">今月の出庫データはありません。</p>
                )}
            </div>
             {lowStockProducts.length > 0 && (
              <div className="bg-white shadow-lg rounded-xl p-6">
                <h2 className="text-xl font-semibold text-yellow-600 mb-4 flex items-center">
                  <BellAlertIcon className="h-6 w-6 mr-2 text-yellow-500" />
                  {UI_TEXT.LOW_STOCK_ALERT} ({lowStockProducts.length}件)
                </h2>
                <ul className="divide-y divide-gray-200 max-h-[300px] overflow-y-auto pr-2">
                  {lowStockProducts.map(p => (
                    <li key={p.id} className="py-3 flex justify-between items-center">
                      <span className="text-gray-700">{p.name} ({p.barcode})</span>
                      <span className="text-red-600 font-medium">残: {p.currentStock} (最低: {p.minimumStock})</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
        </div>
        </>
      )}
      
      <HelpModal isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} />
    </div>
  );
};

// 動的インポートでSSRを無効化
const DashboardPage = dynamic(() => Promise.resolve(DashboardPageComponent), {
  ssr: false,
});

export default DashboardPage;