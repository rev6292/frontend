import { Product, Supplier, ScheduledIntakeItem, ScheduledIntakeStatus, UserRole, AdminDashboardData, StaffDashboardData, MonthlyReportDataPoint, Category, User, SupplierMonthlyPerformance, ProcessedInvoiceItem, PurchaseOrder, PurchaseOrderStatus, PurchaseOrderItem, CompanyInfo, WatchlistItem, InventoryMovement, CategoryPerformance, Store, InventoryRecord, ProductWithStock } from '../types';

// TODO: XserverにデプロイしたPHPバックエンドのURLに置き換えてください
// 例: 'https://your-domain.com/backend/api'
const BASE_URL = 'https://pandola.xsrv.jp/backend/api';

// フィールド名変換関数
const convertFromDatabaseFormat = (data: any): any => {
  if (Array.isArray(data)) {
    return data.map(convertFromDatabaseFormat);
  }
  if (data && typeof data === 'object') {
    const converted: any = {};
    for (const [key, value] of Object.entries(data)) {
      let newKey = key;
      let newValue = value;
      
      // フィールド名変換
      switch (key) {
        case 'parent_id':
          newKey = 'parentId';
          break;
        case 'category_id':
          newKey = 'categoryId';
          break;
        case 'supplier_id':
          newKey = 'supplierId';
          break;
        case 'store_id':
          newKey = 'storeId';
          break;
        case 'product_id':
          newKey = 'productId';
          break;
        case 'cost_price':
          newKey = 'costPrice';
          break;
        case 'current_stock':
          newKey = 'currentStock';
          break;
        case 'minimum_stock':
          newKey = 'minimumStock';
          break;
        case 'contact_person':
          newKey = 'contactPerson';
          break;
        case 'line_id':
          newKey = 'lineId';
          break;
        case 'hashed_password':
          newKey = 'hashedPassword';
          break;
        case 'last_updated':
          newKey = 'lastUpdated';
          break;
        case 'created_at':
          newKey = 'createdAt';
          break;
        case 'updated_at':
          newKey = 'updatedAt';
          break;
      }
      
      // ネストしたオブジェクトも変換
      if (typeof newValue === 'object' && newValue !== null) {
        newValue = convertFromDatabaseFormat(newValue);
      }
      
      converted[newKey] = newValue;
    }
    return converted;
  }
  return data;
};

const convertToDatabaseFormat = (data: any): any => {
  if (Array.isArray(data)) {
    return data.map(convertToDatabaseFormat);
  }
  if (data && typeof data === 'object') {
    const converted: any = {};
    for (const [key, value] of Object.entries(data)) {
      let newKey = key;
      let newValue = value;
      
      // フィールド名変換（逆変換）
      switch (key) {
        case 'parentId':
          newKey = 'parent_id';
          break;
        case 'categoryId':
          newKey = 'category_id';
          break;
        case 'supplierId':
          newKey = 'supplier_id';
          break;
        case 'storeId':
          newKey = 'store_id';
          break;
        case 'productId':
          newKey = 'product_id';
          break;
        case 'costPrice':
          newKey = 'cost_price';
          break;
        case 'currentStock':
          newKey = 'current_stock';
          break;
        case 'minimumStock':
          newKey = 'minimum_stock';
          break;
        case 'contactPerson':
          newKey = 'contact_person';
          break;
        case 'lineId':
          newKey = 'line_id';
          break;
        case 'hashedPassword':
          newKey = 'hashed_password';
          break;
        case 'lastUpdated':
          newKey = 'last_updated';
          break;
        case 'createdAt':
          newKey = 'created_at';
          break;
        case 'updatedAt':
          newKey = 'updated_at';
          break;
      }
      
      // ネストしたオブジェクトも変換
      if (typeof newValue === 'object' && newValue !== null) {
        newValue = convertToDatabaseFormat(newValue);
      }
      
      converted[newKey] = newValue;
    }
    return converted;
  }
  return data;
};

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    let errorMessage = 'APIリクエストに失敗しました。';
    
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || `HTTP ${response.status}: ${response.statusText}`;
    } catch (parseError) {
      errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    }
    
    console.error('API Error:', {
      status: response.status,
      statusText: response.statusText,
      url: response.url,
      message: errorMessage
    });
    
    throw new Error(errorMessage);
  }
  
  const data = await response.json();
  console.log('API Raw Response Data:', data); // 生のレスポンスデータをログに出力
  // バックエンドが { data: [...], debug: {...} } の形式で返す場合に対応
  if (data && typeof data === 'object' && data.data !== undefined) {
    return convertFromDatabaseFormat(data.data); // 実際のデータ部分を返す
  } else {
    return convertFromDatabaseFormat(data); // それ以外の形式の場合はそのまま返す
  }
};

// Auth
export const authenticateUser = async (id: string, password?: string): Promise<User> => {
  try {
    const response = await fetch(`${BASE_URL}/auth.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id, password }),
    });
    
    return handleResponse(response);
  } catch (error) {
    console.error('Authentication API error:', error);
    throw new Error('認証に失敗しました。サーバーに接続できません。');
  }
};

// Products
export const getProducts = async (storeId?: string): Promise<ProductWithStock[]> => {
  try {
    const params = storeId ? `?storeId=${storeId}` : '';
    const response = await fetch(`${BASE_URL}/products.php${params}`);
    return handleResponse(response);
  } catch (error) {
    console.error('Products API error:', error);
    // エラーが発生した場合は空の配列を返す
    return [];
  }
};

export const getCategories = async (): Promise<Category[]> => {
  try {
    const response = await fetch(`${BASE_URL}/categories.php`);
    return handleResponse(response);
  } catch (error) {
    console.error('Categories API error:', error);
    // エラーが発生した場合は空の配列を返す
    return [];
  }
};

export const addCategory = async (category: Omit<Category, 'id'>): Promise<Category> => {
  const response = await fetch(`${BASE_URL}/categories.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(convertToDatabaseFormat(category)),
  });
  return handleResponse(response);
};

export const updateCategory = async (updatedCategory: Category): Promise<Category> => {
  const response = await fetch(`${BASE_URL}/categories.php`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(convertToDatabaseFormat(updatedCategory)),
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
  try {
    // 商品データと在庫データを分離して送信
    const productPayload = {
      name: productData.name,
      barcode: productData.barcode,
      category_id: productData.categoryId,
      cost_price: productData.costPrice || 0,
      supplier_id: productData.supplierId,
      description: productData.description || '',
      store_id: stockData.storeId,
      current_stock: stockData.currentStock,
      minimum_stock: stockData.minimumStock
    };

    console.log('Sending product data:', productPayload);

    const response = await fetch(`${BASE_URL}/products.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(productPayload),
    });
    return handleResponse(response);
  } catch (error) {
    console.error('Add product API error:', error);
    throw new Error('商品の追加に失敗しました。サーバーに接続できません。');
  }
};

export const updateProductAndInventory = async (product: Product, stock: { currentStock: number, minimumStock: number }, storeId: string): Promise<Product> => {
  try {
    // 商品データと在庫データを分離して送信
    const productPayload = {
      id: product.id,
      name: product.name,
      barcode: product.barcode,
      category_id: product.categoryId,
      cost_price: product.costPrice || 0,
      supplier_id: product.supplierId,
      description: product.description || '',
      store_id: storeId,
      current_stock: stock.currentStock,
      minimum_stock: stock.minimumStock
    };

    console.log('Updating product data:', productPayload);

    const response = await fetch(`${BASE_URL}/products.php`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(productPayload),
    });
    return handleResponse(response);
  } catch (error) {
    console.error('Update product API error:', error);
    throw new Error('商品の更新に失敗しました。サーバーに接続できません。');
  }
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
  try {
    const response = await fetch(`${BASE_URL}/suppliers.php`);
    return handleResponse(response);
  } catch (error) {
    console.error('Suppliers API error:', error);
    // エラーが発生した場合は空の配列を返す
    return [];
  }
};

export const addSupplier = async (supplier: Omit<Supplier, 'id'>): Promise<Supplier> => {
  const response = await fetch(`${BASE_URL}/suppliers.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(convertToDatabaseFormat(supplier)),
  });
  return handleResponse(response);
};

export const updateSupplier = async (updatedSupplier: Supplier): Promise<Supplier> => {
  const response = await fetch(`${BASE_URL}/suppliers.php`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(convertToDatabaseFormat(updatedSupplier)),
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
  try {
    const params = new URLSearchParams({
      startDate: startDateStr,
      endDate: endDateStr,
      periodLabel,
    });
    if (storeId) params.append('storeId', storeId);
    
    const response = await fetch(`${BASE_URL}/admin-dashboard.php?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return handleResponse(response);
  } catch (error) {
    console.error('Admin dashboard API error:', error);
    // エラーが発生した場合はデフォルトのダッシュボードデータを返す
    return {
      totalInventoryValue: 0,
      lowStockItemsCount: 0,
      pendingIntakeApprovals: 0,
      obsoleteStockItemsCount: 0,
      selectedPeriodSummary: {
        periodLabel: periodLabel,
        supplierPerformances: [],
        totalForPeriod: 0,
        totalForPreviousPeriod: 0,
      },
      currentCalendarMonthStats: {
        month: periodLabel,
        totalMaterialCost: 0,
      },
      totalIntakeItemsThisMonth: 0,
      totalOutboundItemsThisMonth: 0,
      topOutboundProductsThisMonth: [],
      inventoryWatchlist: [],
      obsoleteStockValue: 0,
      inventoryTurnoverRate: 0,
      inventoryMovement: [],
      categoryPerformance: [],
    };
  }
};

export const getStaffDashboardData = async (storeId?: string): Promise<StaffDashboardData> => {
  try {
    const params = storeId ? `?storeId=${storeId}` : '';
    const response = await fetch(`${BASE_URL}/staff-dashboard.php${params}`);
    return handleResponse(response);
  } catch (error) {
    console.error('Staff dashboard API error:', error);
    // エラーが発生した場合はデフォルトのダッシュボードデータを返す
    return {
      approxTotalInventoryValue: '約 ¥0',
      lowStockItemsCount: 0,
      totalIntakeItemsThisMonth: 0,
      totalOutboundItemsThisMonth: 0,
      topOutboundProductsThisMonth: [],
    };
  }
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
  try {
    const response = await fetch(`${BASE_URL}/staff-users.php`);
    return handleResponse(response);
  } catch (error) {
    console.error('Staff users API error:', error);
    // エラーが発生した場合は空の配列を返す
    return [];
  }
};

export const addStaffUser = async (userData: Omit<User, 'id' | 'hashedPassword'> & { password?: string }): Promise<User> => {
  const response = await fetch(`${BASE_URL}/staff-users.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(convertToDatabaseFormat(userData)),
  });
  return handleResponse(response);
};

export const updateStaffUser = async (updatedUser: User & { newPassword?: string }): Promise<User> => {
  const response = await fetch(`${BASE_URL}/staff-users.php`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(convertToDatabaseFormat(updatedUser)),
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
  try {
    const response = await fetch(`${BASE_URL}/stores.php`);
    return handleResponse(response);
  } catch (error) {
    console.error('Stores API error:', error);
    // エラーが発生した場合は空の配列を返す
    return [];
  }
};

export const addStore = async (store: Omit<Store, 'id'>): Promise<Store> => {
  const response = await fetch(`${BASE_URL}/stores.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(convertToDatabaseFormat(store)),
  });
  return handleResponse(response);
};

export const updateStore = async (updatedStore: Store): Promise<Store> => {
  const response = await fetch(`${BASE_URL}/stores.php`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(convertToDatabaseFormat(updatedStore)),
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
