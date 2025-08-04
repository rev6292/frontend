import React, { useState, useMemo } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { UserRole, NavigationItem } from './types';
import { APP_TITLE, ROUTE_PATHS, NAVIGATION_ITEMS } from './constants';
import { PurchaseListProvider, usePurchaseList } from './contexts/PurchaseListContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { StoreProvider } from './contexts/StoreContext';

import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import InventoryPage from './pages/InventoryPage';
import IntakePage from './pages/IntakePage';
import OutboundPage from './pages/OutboundPage'; 
import ReportsPage from './pages/ReportsPage';
import PurchaseOrderPreviewPage from './pages/PurchaseOrderPreviewPage';
import { ArrowLeftOnRectangleIcon, Bars3Icon } from '@heroicons/react/24/outline';

// Admin Pages
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import CategoryManagementPage from './pages/admin/CategoryManagementPage';
import StaffManagementPage from './pages/admin/StaffManagementPage'; 
import AdminProfilePage from './pages/admin/AdminProfilePage'; 
import CompanyInfoPage from './pages/admin/CompanyInfoPage';
import NewProductRegistrationPage from './pages/admin/NewProductRegistrationPage'; 
import AdminCsvPage from './pages/admin/AdminCsvPage';
import StoreManagementPage from './pages/admin/StoreManagementPage';


// Main Layout Component
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth(); 
  const { getTotalItems: getTotalPurchaseListItems } = usePurchaseList();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const availableNavItems = useMemo(() => {
    if (!currentUser) return [];
    return NAVIGATION_ITEMS.map(item => ({
      ...item,
      // Special handling for purchase list item count on the new integrated page
      actualNotificationCount: item.path === ROUTE_PATHS.INTAKE ? getTotalPurchaseListItems() : (item.notificationCount ? item.notificationCount() : 0)
    })).filter(item => 
      !item.roles || item.roles.includes(currentUser.role)
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, getTotalPurchaseListItems]);

  if (!currentUser) {
     return <Navigate to="/" />; // Should be handled by AppWithAuthCheck, but as a fallback
  }

  if (location.pathname.startsWith('/admin')) {
    return <>{children}</>;
  }

  const getPageTitle = () => {
    const currentNavItem = NAVIGATION_ITEMS.find(item => item.path === location.pathname);
    if(currentNavItem) return currentNavItem.name;
    if(location.pathname === ROUTE_PATHS.INTAKE) return '入荷処理'; // Fallback for the combined page
    return APP_TITLE;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className={`bg-white text-gray-800 w-64 space-y-6 py-7 px-2 absolute inset-y-0 left-0 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition duration-200 ease-in-out z-30 border-r border-gray-200`}>
        <div className="px-4 flex items-center justify-between">
          <Link to={ROUTE_PATHS.DASHBOARD} className="text-2xl font-semibold text-gray-900 hover:text-indigo-600">{APP_TITLE}</Link>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-gray-500 hover:text-gray-800">
            <ArrowLeftOnRectangleIcon className="h-6 w-6" />
          </button>
        </div>
        <nav>
          {availableNavItems.map((item: NavigationItem & { actualNotificationCount?: number }) => (
            <Link
              key={item.name}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`relative flex items-center space-x-3 px-4 py-3 rounded-md text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors
                ${location.pathname === item.path ? 'bg-indigo-50 text-indigo-600 font-semibold' : ''}`}
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

const ProtectedAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  if (!currentUser || currentUser.role !== UserRole.ADMIN) {
    return <Navigate to={ROUTE_PATHS.DASHBOARD} replace />;
  }
  return <>{children}</>;
};

const AppWithAuthCheck: React.FC = () => {
  const { currentUser } = useAuth();
  
  if (!currentUser) {
    return <LoginPage />;
  }

  return (
    <PurchaseListProvider>
      <HashRouter>
        <Routes>
          {/* Admin Routes */}
          <Route 
            path="/admin"
            element={
              <ProtectedAdminRoute>
                <AdminLayout />
              </ProtectedAdminRoute>
            }
          >
            <Route index element={<Navigate to={ROUTE_PATHS.ADMIN_DASHBOARD} replace />} />
            <Route path={ROUTE_PATHS.ADMIN_DASHBOARD.substring('/admin/'.length)} element={<AdminDashboardPage />} />
            <Route path={ROUTE_PATHS.ADMIN_STORES.substring('/admin/'.length)} element={<StoreManagementPage />} />
            <Route path={ROUTE_PATHS.ADMIN_CATEGORIES.substring('/admin/'.length)} element={<CategoryManagementPage />} />
            <Route path={ROUTE_PATHS.ADMIN_STAFF.substring('/admin/'.length)} element={<StaffManagementPage />} />
            <Route path={ROUTE_PATHS.ADMIN_PROFILE.substring('/admin/'.length)} element={<AdminProfilePage />} />
            <Route path={ROUTE_PATHS.ADMIN_COMPANY_INFO.substring('/admin/'.length)} element={<CompanyInfoPage />} />
            <Route path={ROUTE_PATHS.ADMIN_NEW_PRODUCT_REGISTRATION.substring('/admin/'.length)} element={<NewProductRegistrationPage />} />
            <Route path={ROUTE_PATHS.ADMIN_CSV_IMPORT_EXPORT.substring('/admin/'.length)} element={<AdminCsvPage />} />
          </Route>
          
          {/* Specific route for preview page (no layout) */}
          <Route path={ROUTE_PATHS.PURCHASE_ORDER + "/:orderId"} element={<PurchaseOrderPreviewPage />} />

          {/* Main App Routes with Layout */}
          <Route path="/*" element={
            <Layout>
                <Routes>
                  <Route path={ROUTE_PATHS.DASHBOARD} element={<DashboardPage />} />
                  <Route path={ROUTE_PATHS.INVENTORY} element={<InventoryPage />} />
                  <Route path={ROUTE_PATHS.INTAKE} element={<IntakePage />} />
                  <Route path={ROUTE_PATHS.OUTBOUND} element={<OutboundPage />} />
                  <Route path={ROUTE_PATHS.REPORTS} element={<ReportsPage />} />
                  <Route path="*" element={<Navigate to={ROUTE_PATHS.DASHBOARD} replace />} />
                </Routes>
            </Layout>
          } />
        </Routes>
      </HashRouter>
    </PurchaseListProvider>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <StoreProvider>
        <AppWithAuthCheck />
      </StoreProvider>
    </AuthProvider>
  );
};

export default App;