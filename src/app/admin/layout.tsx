'use client';

import dynamic from 'next/dynamic';
import React from 'react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

// 動的インポートでSSRを無効化
const AdminLayout = dynamic(() => Promise.resolve(AdminLayoutComponent), {
  ssr: false,
});

const AdminLayoutComponent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex">
        {/* サイドバー */}
        <aside className="w-64 bg-white shadow-lg min-h-screen">
          <div className="p-6">
            <h1 className="text-xl font-bold text-gray-800">管理者メニュー</h1>
          </div>
          
          {/* スタッフメニューに戻るボタン */}
          <div className="px-6 py-3 border-b border-gray-200">
            <a 
              href="/dashboard" 
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 font-medium"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              <span>スタッフメニューに戻る</span>
            </a>
          </div>
          
          <nav className="mt-6">
            <a href="/admin/dashboard" className="block px-6 py-3 text-gray-700 hover:bg-gray-100">
              管理ダッシュボード
            </a>
            <a href="/admin/stores" className="block px-6 py-3 text-gray-700 hover:bg-gray-100">
              店舗管理
            </a>
            <a href="/admin/categories" className="block px-6 py-3 text-gray-700 hover:bg-gray-100">
              カテゴリ管理
            </a>
            <a href="/admin/staff" className="block px-6 py-3 text-gray-700 hover:bg-gray-100">
              スタッフ管理
            </a>
            <a href="/admin/new-product-registration" className="block px-6 py-3 text-gray-700 hover:bg-gray-100">
              新規商品登録
            </a>
            <a href="/admin/company" className="block px-6 py-3 text-gray-700 hover:bg-gray-100">
              会社情報管理
            </a>
            <a href="/admin/csv" className="block px-6 py-3 text-gray-700 hover:bg-gray-100">
              CSVインポート/エクスポート
            </a>
            <a href="/admin/profile" className="block px-6 py-3 text-gray-700 hover:bg-gray-100">
              管理者情報変更
            </a>
          </nav>
        </aside>
        
        {/* メインコンテンツ */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout; 