import { Product, Supplier, ScheduledIntakeItem, ScheduledIntakeStatus, UserRole, AdminDashboardData, StaffDashboardData, MonthlyReportDataPoint, Category, User, SupplierMonthlyPerformance, ProcessedInvoiceItem, PurchaseOrder, PurchaseOrderStatus, PurchaseOrderItem, CompanyInfo, WatchlistItem, InventoryMovement, CategoryPerformance, Store, InventoryRecord, ProductWithStock } from '../types';

// TODO: XserverにデプロイしたPHPバックエンドのURLに置き換えてください
// 例: 'https://your-domain.com/backend/api'
const BASE_URL = 'https://pandola.xsrv.jp/backend/api';

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'APIリクエストに失敗し、JSONの解析もできませんでした。' }));
    console.error('API Error Data:', errorData); // エラーデータをログに出力
    throw new Error(errorData.message || 'APIリクエストに失敗しました。');
  }
  const data = await response.json();
  console.log('API Raw Response Data:', data); // 生のレスポンスデータをログに出力
  // バックエンドが { data: [...], debug: {...} } の形式で返す場合に対応
  if (data && typeof data === 'object' && data.data !== undefined) {
    return data.data; // 実際のデータ部分を返す
  } else {
    return data; // それ以外の形式の場合はそのまま返す
  }
};

// Auth
export const authenticateUser = async (id: string, password?: string): Promise<User> => {
  const response = await fetch(`${BASE_URL}/auth.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id, password }),
  });
  
  return handleResponse(response);
};

// Products
export const getProducts = async (storeId?: string): Promise<ProductWithStock[]> => {
  const params = storeId ? `?storeId=${storeId}` : '';
  const response = await fetch(`${BASE_URL}/products.php${params}`);
  return handleResponse(response);
};

export const getCategories = async (): Promise<Category[]> => {
  const response = await fetch(`${BASE_URL}/categories.php`);
  return handleResponse(response);
};

export const addCategory = async (category: Omit<Category, 'id'>): Promise<Category> => {
  const response = await fetch(`${BASE_URL}/categories.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(category),
  });
  return handleResponse(response);
};

export const updateCategory = async (updatedCategory: Category): Promise<Category> => {
  const response = await fetch(`${BASE_URL}/categories.php`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updatedCategory),
  });
  return handleResponse(response);
};

export const deleteCategory = async (categoryId: string): Promise<{ success: boolean }> => {
  const response = await fetch(`${BASE_URL}/categories.php`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id: categoryId }),
  });
  return handleResponse(response);
};

export const getProductById = async (id: string, storeId?: string): Promise<ProductWithStock | undefined> => {
  const params = storeId ? `?storeId=${storeId}` : '';
  const response = await fetch(`${BASE_URL}/products.php/${id}${params}`);
  return handleResponse(response);
};

export const findProductByBarcode = async (barcode: string, storeId?: string): Promise<ProductWithStock | undefined> => {
  const params = new URLSearchParams({ barcode });
  if (storeId) params.append('storeId', storeId);
  const response = await fetch(`${BASE_URL}/products.php/search?${params}`);
  return handleResponse(response);
};

export const findProductByName = async (name: string): Promise<Product | undefined> => {
  const params = new URLSearchParams({ name });
  const response = await fetch(`${BASE_URL}/products.php/search?${params}`);
  return handleResponse(response);
};

export const addProduct = async (productData: Omit<Product, 'id' | 'lastUpdated'>, stockData: { currentStock: number, minimumStock: number, storeId: string }): Promise<Product> => {
  const response = await fetch(`${BASE_URL}/products.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ...productData, ...stockData }),
  });
  return handleResponse(response);
};

export const updateProductAndInventory = async (product: Product, stock: { currentStock: number, minimumStock: number }, storeId: string): Promise<Product> => {
  const response = await fetch(`${BASE_URL}/products.php`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ...product, ...stock, storeId }),
  });
  return handleResponse(response);
};

export const deleteProduct = async (id: string) => {
  const response = await fetch(`${BASE_URL}/products.php`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id }),
  });
  return handleResponse(response);
};

export const batchUpsertProducts = async (productsData: (Partial<ProductWithStock>)[], storeId: string): Promise<{ createdCount: number; updatedCount: number; errors: string[] }> => {
  const response = await fetch(`${BASE_URL}/products.php/batch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ products: productsData, storeId }),
  });
  return handleResponse(response);
};

export const getSuppliers = async () => {
  const response = await fetch(`${BASE_URL}/suppliers.php`);
  return handleResponse(response);
};

export const addSupplier = async (supplier: Omit<Supplier, 'id'>): Promise<Supplier> => {
  const response = await fetch(`${BASE_URL}/suppliers.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(supplier),
  });
  return handleResponse(response);
};

export const updateSupplier = async (updatedSupplier: Supplier): Promise<Supplier> => {
  const response = await fetch(`${BASE_URL}/suppliers.php`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updatedSupplier),
  });
  return handleResponse(response);
};

export const deleteSupplier = async (id: string): Promise<{ success: boolean }> => {
  const response = await fetch(`${BASE_URL}/suppliers.php`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id }),
  });
  return handleResponse(response);
};

export const getScheduledIntakeItems = async (storeId?: string) => {
  const params = storeId ? `?storeId=${storeId}` : '';
  const response = await fetch(`${BASE_URL}/scheduled-intake.php${params}`);
  return handleResponse(response);
};

export const addScheduledIntakeItem = async (itemData: Omit<ScheduledIntakeItem, 'id' | 'lastUpdated'>): Promise<ScheduledIntakeItem> => {
  const response = await fetch(`${BASE_URL}/scheduled-intake.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(itemData),
  });
  return handleResponse(response);
};

export const updateScheduledIntakeItem = async (item: ScheduledIntakeItem): Promise<ScheduledIntakeItem> => {
  const response = await fetch(`${BASE_URL}/scheduled-intake.php`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(item),
  });
  return handleResponse(response);
};

export const addReceivedItemsFromInvoice = async (items: ProcessedInvoiceItem[], supplierId: string, userId: string, storeId: string): Promise<{ successCount: number; errorCount: number; errors: string[] }> => {
  const response = await fetch(`${BASE_URL}/intake.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ items, supplierId, userId, storeId }),
  });
  return handleResponse(response);
};

export const addNewProductsFromAIData = async (items: ProcessedInvoiceItem[], supplierId: string, registrarId: string, storeId: string): Promise<{ successCount: number; errorCount: number; errors: string[] }> => {
  const response = await fetch(`${BASE_URL}/products.php/ai-import`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ items, supplierId, registrarId, storeId }),
  });
  return handleResponse(response);
};

export const getPurchaseOrders = async (storeId?: string): Promise<PurchaseOrder[]> => {
  const params = storeId ? `?storeId=${storeId}` : '';
  const response = await fetch(`${BASE_URL}/purchase-orders.php${params}`);
  return handleResponse(response);
};

export const getPurchaseOrderById = async (id: string): Promise<PurchaseOrder | undefined> => {
  const response = await fetch(`${BASE_URL}/purchase-orders.php/${id}`);
  return handleResponse(response);
};

export const addPurchaseOrder = async (orderData: Omit<PurchaseOrder, 'id' | 'status' | 'supplierName'>): Promise<PurchaseOrder> => {
  const response = await fetch(`${BASE_URL}/purchase-orders.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(orderData),
  });
  return handleResponse(response);
};

export const processPurchaseOrderReceipt = async (purchaseOrderId: string, receivedItems: { productId: string; quantity: number }[], userId?: string): Promise<{ success: boolean; updatedStatus: PurchaseOrderStatus }> => {
  const response = await fetch(`${BASE_URL}/purchase-orders.php/${purchaseOrderId}/receipt`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ receivedItems, userId }),
  });
  return handleResponse(response);
};

export const getAdminDashboardData = async (startDateStr: string, endDateStr: string, periodLabel: string, storeId?: string): Promise<AdminDashboardData> => {
  const params = new URLSearchParams({
    startDate: startDateStr,
    endDate: endDateStr,
    periodLabel,
  });
  if (storeId) params.append('storeId', storeId);
  
  const response = await fetch(`${BASE_URL}/admin-dashboard.php?${params}`);
  return handleResponse(response);
};

export const getStaffDashboardData = async (storeId?: string): Promise<StaffDashboardData> => {
  const params = storeId ? `?storeId=${storeId}` : '';
  const response = await fetch(`${BASE_URL}/staff-dashboard.php${params}`);
  return handleResponse(response);
};

export const getMonthlyPurchaseReport = async (month: string, storeId?: string): Promise<MonthlyReportDataPoint[]> => {
  try {
    const params = new URLSearchParams({ month });
    if (storeId) params.append('storeId', storeId);
    
    const response = await fetch(`${BASE_URL}/monthly-report.php?${params}`);
    return handleResponse(response);
  } catch (error) {
    console.error('Monthly report API error:', error);
    // エラーが発生した場合は空の配列を返す
    return [];
  }
};

export const getStaffUsers = async (): Promise<User[]> => {
  const response = await fetch(`${BASE_URL}/staff-users.php`);
  return handleResponse(response);
};

export const addStaffUser = async (userData: Omit<User, 'id' | 'hashedPassword'> & { password?: string }): Promise<User> => {
  const response = await fetch(`${BASE_URL}/staff-users.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });
  return handleResponse(response);
};

export const updateStaffUser = async (updatedUser: User & { newPassword?: string }): Promise<User> => {
  const response = await fetch(`${BASE_URL}/staff-users.php`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updatedUser),
  });
  return handleResponse(response);
};

export const deleteStaffUser = async (userId: string): Promise<{ success: boolean }> => {
  const response = await fetch(`${BASE_URL}/staff-users.php`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id: userId }),
  });
  return handleResponse(response);
};

export const updateAdminPassword = async (adminId: string, currentPassword?: string, newPassword?: string): Promise<{ success: boolean; message?: string }> => {
  const response = await fetch(`${BASE_URL}/admin-password.php`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ adminId, currentPassword, newPassword }),
  });
  return handleResponse(response);
};

export const getCompanyInfo = async (): Promise<CompanyInfo> => {
  const response = await fetch(`${BASE_URL}/company-info.php`);
  return handleResponse(response);
};

export const updateCompanyInfo = async (info: CompanyInfo): Promise<CompanyInfo> => {
  const response = await fetch(`${BASE_URL}/company-info.php`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(info),
  });
  return handleResponse(response);
};

export const addChangeLog = async (action: string, userId: string = 'system') => {
  const response = await fetch(`${BASE_URL}/change-log.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action, userId }),
  });
  return handleResponse(response);
};

export const processOutboundBatch = async (items: { productId: string, quantity: number }[], operatorId: string, storeId: string): Promise<{ success: boolean; errors: string[] }> => {
  const response = await fetch(`${BASE_URL}/outbound.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ items, operatorId, storeId }),
  });
  return handleResponse(response);
};

export const processIntakeBatch = async (items: { productId: string, quantity: number, costPrice: number }[], supplierId: string, operatorId: string, storeId: string): Promise<{ success: boolean; errors: string[] }> => {
  const response = await fetch(`${BASE_URL}/intake.php/batch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ items, supplierId, operatorId, storeId }),
  });
  return handleResponse(response);
};

export const getStores = async (): Promise<Store[]> => {
  const response = await fetch(`${BASE_URL}/stores.php`);
  return handleResponse(response);
};

export const addStore = async (store: Omit<Store, 'id'>): Promise<Store> => {
  const response = await fetch(`${BASE_URL}/stores.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(store),
  });
  return handleResponse(response);
};

export const updateStore = async (updatedStore: Store): Promise<Store> => {
  const response = await fetch(`${BASE_URL}/stores.php`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updatedStore),
  });
  return handleResponse(response);
};

export const deleteStore = async (storeId: string): Promise<{ success: boolean }> => {
  const response = await fetch(`${BASE_URL}/stores.php`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id: storeId }),
  });
  return handleResponse(response);
};

// Gemini API functions
export const generateDescriptionMock = async (productName: string, category: string): Promise<string> => {
  const response = await fetch(`${BASE_URL}/ai/description.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ productName, category }),
  });
  return handleResponse(response);
};

export const parseInvoiceMock = async (base64Image: string): Promise<ProcessedInvoiceItem[]> => {
  const response = await fetch(`${BASE_URL}/ai/parse-invoice.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ image: base64Image }),
  });
  return handleResponse(response);
};

export const uploadPdf = async (pdfFile: File): Promise<{ message: string; filePath: string; fileName: string }> => {
  const formData = new FormData();
  formData.append('pdf', pdfFile);
  
  const response = await fetch(`${BASE_URL}/upload.php`, {
    method: 'POST',
    body: formData,
  });
  return handleResponse(response);
};

// API Client object
const apiClient = {
  get: async (endpoint: string, params?: Record<string, any>): Promise<any> => {
    const url = new URL(`${BASE_URL}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }
    const response = await fetch(url.toString());
    return handleResponse(response);
  },
  post: async (endpoint: string, data: any): Promise<any> => {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },
  put: async (endpoint: string, data: any): Promise<any> => {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },
  delete: async (endpoint: string): Promise<any> => {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },
};

export default apiClient;
