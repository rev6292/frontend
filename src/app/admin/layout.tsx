'use client';

import dynamic from 'next/dynamic';
import React, { useState } from 'react';
import { 
  ArrowLeftIcon, 
  ChartBarIcon, 
  BuildingStorefrontIcon, 
  TagIcon, 
  UserGroupIcon, 
  PlusCircleIcon, 
  BuildingOfficeIcon, 
  DocumentArrowDownIcon, 
  UserCircleIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowLeftOnRectangleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import { useStore } from '@/contexts/StoreContext';

// 動的インポートでSSRを無効化
const AdminLayout = dynamic(() => Promise.resolve(AdminLayoutComponent), {
  ssr: false,
});

const AdminStoreSelector: React.FC = () => {
  const { stores, selectedStoreId, setSelectedStoreId, loading } = useStore();

  if (loading) {
    return <div className="text-sm text-gray-500">店舗読み込み中...</div>;
  }

  return (
    <div className="relative">
      <select
        value={selectedStoreId}
        onChange={(e) => setSelectedStoreId(e.target.value)}
        className="appearance-none w-full md:w-48 bg-slate-900 border border-slate-700 text-white py-2 pl-3 pr-8 rounded-md leading-tight focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white text-sm"
        aria-label="店舗選択"
      >
        <option value="all">全店舗</option>
        {stores.map(store => (
          <option key={store.id} value={store.id}>{store.name}</option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-300">
        <ArrowLeftIcon className="h-4 w-4" />
      </div>
    </div>
  );
};

const AdminLayoutComponent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigationItems = [
    { name: '管理ダッシュボード', path: '/admin/dashboard', icon: ChartBarIcon },
    { name: '店舗管理', path: '/admin/stores', icon: BuildingStorefrontIcon },
    { name: 'カテゴリ管理', path: '/admin/categories', icon: TagIcon },
    { name: 'スタッフ管理', path: '/admin/staff', icon: UserGroupIcon },
    { name: '新規商品登録', path: '/admin/new-product-registration', icon: PlusCircleIcon },
    { name: '会社情報管理', path: '/admin/company', icon: BuildingOfficeIcon },
    { name: 'CSVインポート/エクスポート', path: '/admin/csv', icon: DocumentArrowDownIcon },
    { name: '管理者情報変更', path: '/admin/profile', icon: UserCircleIcon },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className={`bg-white text-gray-800 w-72 space-y-6 py-7 px-2 absolute inset-y-0 left-0 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition duration-200 ease-in-out z-30 shadow-lg border-r border-gray-200`}>
        <div className="px-4 flex items-center justify-between">
          <div className="text-2xl font-semibold text-gray-900 hover:text-indigo-600">
            在庫管理システム
            <span className="block text-sm text-gray-500 -mt-1">管理者メニュー</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-gray-500 hover:text-gray-800">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        
        <nav className="mt-10">
          {navigationItems.map((item) => (
            <a
              key={item.name}
              href={item.path}
              onClick={() => setSidebarOpen(false)}
              className="flex items-center space-x-3 px-4 py-3 rounded-md text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
            </a>
          ))}
        </nav>
        
        <div className="absolute bottom-6 left-0 right-0 px-4">
          <a
            href="/dashboard"
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-md text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            <span>スタッフメニューに戻る</span>
          </a>
          <button
            onClick={logout}
            className="mt-2 w-full flex items-center space-x-3 px-4 py-3 rounded-md text-red-600 bg-red-100 hover:bg-red-200 hover:text-red-800 transition-colors"
          >
            <ArrowLeftOnRectangleIcon className="h-5 w-5" />
            <span>ログアウト</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-md p-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden text-gray-600 hover:text-gray-800">
              <Bars3Icon className="h-6 w-6" />
            </button>
            <h1 className="text-xl font-semibold text-gray-800">管理者メニュー</h1>
          </div>
          <div className="flex items-center space-x-4">
            <AdminStoreSelector />
            <span className="text-sm text-gray-700 hidden sm:block">
              {currentUser?.name} ({currentUser?.role})
            </span>
          </div>
        </header>
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout; 