'use client';

import dynamic from 'next/dynamic';
import React, { useState, useMemo } from 'react';
import { usePathname } from 'next/navigation'; // useLocation の代わりに usePathname
import Link from 'next/link'; // Link のインポート元を変更
import { UserRole, NavigationItem } from '@/types'; // @/types を使用
import { APP_TITLE, ROUTE_PATHS, NAVIGATION_ITEMS } from '@/constants'; // @/constants を使用
import { usePurchaseList } from '@/contexts/PurchaseListContext'; // @/contexts を使用
import { useAuth } from '@/contexts/AuthContext'; // @/contexts を使用
import { ArrowLeftOnRectangleIcon, Bars3Icon } from '@heroicons/react/24/outline';

// 動的インポートでSSRを無効化
const MainLayout = dynamic(() => Promise.resolve(MainLayoutComponent), {
  ssr: false,
});

const MainLayoutComponent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const { getTotalItems: getTotalPurchaseListItems } = usePurchaseList();
  const pathname = usePathname(); // useLocation().pathname の代わりに usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // デバッグ用：currentUserの状態をログ出力
  console.log('MainLayout: currentUser:', currentUser);
  console.log('MainLayout: pathname:', pathname);

  const availableNavItems = useMemo(() => {
    if (!currentUser) return [];
    return NAVIGATION_ITEMS.map(item => ({
      ...item,
      actualNotificationCount: item.path === ROUTE_PATHS.INTAKE ? getTotalPurchaseListItems() : (item.notificationCount ? item.notificationCount() : 0)
    })).filter(item =>
      !item.roles || item.roles.includes(currentUser.role)
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, getTotalPurchaseListItems]);

  // ログインしていない場合は、ログインページへリダイレクト
  if (!currentUser) {
    console.log('MainLayout: currentUser is null, redirecting to login');
    // ログインページにリダイレクト
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
    return null;
  }

  console.log('MainLayout: Rendering layout with currentUser:', currentUser);

  // 管理者ページの場合は、AdminLayoutが適用されるため、このチェックは不要になる可能性が高い
  // if (pathname.startsWith('/admin')) {
  //   return <>{children}</>;
  // }

  const getPageTitle = () => {
    const currentNavItem = NAVIGATION_ITEMS.find(item => item.path === pathname);
    if(currentNavItem) return currentNavItem.name;
    if(pathname === ROUTE_PATHS.INTAKE) return '入荷処理'; // Fallback for the combined page
    return APP_TITLE;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className={`bg-white text-gray-800 w-64 space-y-6 py-7 px-2 absolute inset-y-0 left-0 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition duration-200 ease-in-out z-30 border-r border-gray-200`}>
        <div className="px-4 flex items-center justify-between">
          <Link href={ROUTE_PATHS.DASHBOARD} className="text-2xl font-semibold text-gray-900 hover:text-indigo-600">{APP_TITLE}</Link>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-gray-500 hover:text-gray-800">
            <ArrowLeftOnRectangleIcon className="h-6 w-6" />
          </button>
        </div>
        <nav>
          {availableNavItems.map((item: NavigationItem & { actualNotificationCount?: number }) => (
            <Link
              key={item.name}
              href={item.path} // to の代わりに href
              onClick={() => setSidebarOpen(false)}
              className={`relative flex items-center space-x-3 px-4 py-3 rounded-md text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors
                ${pathname === item.path ? 'bg-indigo-50 text-indigo-600 font-semibold' : ''}`}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
               {item.path === ROUTE_PATHS.INTAKE && getTotalPurchaseListItems() > 0 && (
                 <span className="absolute right-3 top-1/2 -translate-y-1/2 bg-red-500 text-white text-sm font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {getTotalPurchaseListItems() > 99 ? '99+' : getTotalPurchaseListItems()}
                </span>
              )}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm p-4 flex justify-between items-center">
          <button onClick={() => setSidebarOpen(true)} className="md:hidden text-gray-600 hover:text-gray-800">
            <Bars3Icon className="h-6 w-6" />
          </button>
          <h1 className="text-xl font-semibold text-gray-700">{getPageTitle()}</h1>
          <div className="flex items-center space-x-3">
             <span className="text-sm text-gray-600 hidden sm:block">こんにちは、{currentUser.name} さん ({currentUser.role})</span>
          </div>
        </header>
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
