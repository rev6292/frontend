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
  // 開発用のモック認証
  console.log('Mock authentication for:', id, password);
  
  // モックユーザーデータ
  const mockUsers: Record<string, User> = {
    'admin': {
      id: 'admin1',
      name: '管理者',
      role: UserRole.ADMIN,
    },
    'staff': {
      id: 'staff1',
      name: 'スタッフ',
      role: UserRole.STAFF,
      storeId: 'store1',
    },
    'test': {
      id: 'test1',
      name: 'テストユーザー',
      role: UserRole.ADMIN,
    }
  };

  // パスワードチェック（簡易版）
  if (!password || password.length < 3) {
    throw new Error('パスワードが正しくありません。');
  }

  const user = mockUsers[id];
  if (!user) {
    throw new Error('ユーザーIDが正しくありません。');
  }

  console.log('Mock authentication successful:', user);
  return user;
};

// Products
export const getProducts = async (storeId?: string): Promise<ProductWithStock[]> => {
  // 開発用のモックデータ
  console.log('Mock getProducts called with storeId:', storeId);
  
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
      currentStock: 50,
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
      currentStock: 30,
      minimumStock: 5,
    },
  ];
  
  return mockProducts;
};

// --- 以下、未実装のAPI関数（PHPバックエンド実装時に順次修正） ---

export const getCategories = async (): Promise<Category[]> => {
  // 開発用のモックデータ
  console.log('Mock getCategories called');
  
  const mockCategories: Category[] = [
    { id: 'cat1', name: '食品', parentId: null },
    { id: 'cat2', name: '飲料', parentId: null },
    { id: 'cat3', name: '日用品', parentId: null },
  ];
  
  return mockCategories;
};
export const addCategory = async (category: Omit<Category, 'id'>): Promise<Category> => {
  // 開発用のモックデータ
  console.log('Mock addCategory called:', category);
  
  const newCategory: Category = {
    ...category,
    id: `cat_${Date.now()}`,
  };
  
  return newCategory;
};
export const updateCategory = async (updatedCategory: Category): Promise<Category> => {
  // 開発用のモックデータ
  console.log('Mock updateCategory called:', updatedCategory);
  
  return updatedCategory;
};
export const deleteCategory = async (categoryId: string): Promise<{ success: boolean }> => {
  // 開発用のモックデータ
  console.log('Mock deleteCategory called:', categoryId);
  
  return { success: true };
};

export const getProductById = async (id: string, storeId?: string): Promise<ProductWithStock | undefined> => { throw new Error('getProductById not implemented yet.'); };
export const findProductByBarcode = async (barcode: string, storeId?: string): Promise<ProductWithStock | undefined> => {
  // 開発用のモックデータ
  console.log('Mock findProductByBarcode called:', barcode, storeId);
  
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
      currentStock: 50,
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
      currentStock: 30,
      minimumStock: 5,
    },
  ];
  
  return mockProducts.find(p => p.barcode === barcode);
};
export const findProductByName = async (name: string): Promise<Product | undefined> => { throw new Error('findProductByName not implemented yet.'); };
export const addProduct = async (productData: Omit<Product, 'id' | 'lastUpdated'>, stockData: { currentStock: number, minimumStock: number, storeId: string }): Promise<Product> => {
  // 開発用のモックデータ
  console.log('Mock addProduct called:', productData, stockData);
  
  const newProduct: Product = {
    ...productData,
    id: `product_${Date.now()}`,
    lastUpdated: new Date().toISOString(),
  };
  
  return newProduct;
};
export const updateProductAndInventory = async (product: Product, stock: { currentStock: number, minimumStock: number }, storeId: string): Promise<Product> => {
  // 開発用のモックデータ
  console.log('Mock updateProductAndInventory called:', product, stock, storeId);
  
  const updatedProduct: Product = {
    ...product,
    lastUpdated: new Date().toISOString(),
  };
  
  return updatedProduct;
};
export const deleteProduct = async (id: string) => {
  // 開発用のモックデータ
  console.log('Mock deleteProduct called:', id);
  
  return { success: true };
};
export const batchUpsertProducts = async (productsData: (Partial<ProductWithStock>)[], storeId: string): Promise<{ createdCount: number; updatedCount: number; errors: string[] }> => { throw new Error('batchUpsertProducts not implemented yet.'); };

export const getSuppliers = async () => {
  // 開発用のモックデータ
  console.log('Mock getSuppliers called');
  
  const mockSuppliers: Supplier[] = [
    { id: 'supplier1', name: 'サプライヤーA', contactPerson: '田中太郎', phone: '03-1234-5678', email: 'tanaka@supplier-a.com' },
    { id: 'supplier2', name: 'サプライヤーB', contactPerson: '佐藤花子', phone: '03-8765-4321', email: 'sato@supplier-b.com' },
  ];
  
  return mockSuppliers;
};
export const addSupplier = async (supplier: Omit<Supplier, 'id'>): Promise<Supplier> => {
  // 開発用のモックデータ
  console.log('Mock addSupplier called:', supplier);
  
  const newSupplier: Supplier = {
    ...supplier,
    id: `supplier_${Date.now()}`,
  };
  
  return newSupplier;
};

export const updateSupplier = async (updatedSupplier: Supplier): Promise<Supplier> => {
  // 開発用のモックデータ
  console.log('Mock updateSupplier called:', updatedSupplier);
  
  return updatedSupplier;
};

export const deleteSupplier = async (id: string): Promise<{ success: boolean }> => {
  // 開発用のモックデータ
  console.log('Mock deleteSupplier called:', id);
  
  return { success: true };
};

export const getScheduledIntakeItems = async (storeId?: string) => { throw new Error('getScheduledIntakeItems not implemented yet.'); };
export const addScheduledIntakeItem = async (itemData: Omit<ScheduledIntakeItem, 'id' | 'lastUpdated'>): Promise<ScheduledIntakeItem> => { throw new Error('addScheduledIntakeItem not implemented yet.'); };
export const updateScheduledIntakeItem = async (item: ScheduledIntakeItem): Promise<ScheduledIntakeItem> => { throw new Error('updateScheduledIntakeItem not implemented yet.'); };
export const addReceivedItemsFromInvoice = async (items: ProcessedInvoiceItem[], supplierId: string, userId: string, storeId: string): Promise<{ successCount: number; errorCount: number; errors: string[] }> => { throw new Error('addReceivedItemsFromInvoice not implemented yet.'); };
export const addNewProductsFromAIData = async (items: ProcessedInvoiceItem[], supplierId: string, registrarId: string, storeId: string): Promise<{ successCount: number; errorCount: number; errors: string[] }> => { throw new Error('addNewProductsFromAIData not implemented yet.'); };

export const getPurchaseOrders = async (storeId?: string): Promise<PurchaseOrder[]> => {
  // CORS問題を回避するためにモックデータを使用
  console.log('Mock getPurchaseOrders called with storeId:', storeId);
  
  const mockPurchaseOrders: PurchaseOrder[] = [
    {
      id: 'po1',
      orderDate: new Date().toISOString().split('T')[0],
      supplierId: 'supplier1',
      supplierName: 'サプライヤーA',
      storeId: 'store1',
      status: PurchaseOrderStatus.ORDERED,
      createdById: 'admin1',
      items: [
        { productId: '1', productName: '商品A', barcode: '123456789', quantity: 10, costPriceAtOrder: 100, isReceived: false },
        { productId: '2', productName: '商品B', barcode: '987654321', quantity: 5, costPriceAtOrder: 80, isReceived: false },
      ],
    },
  ];
  
  return mockPurchaseOrders;
};

export const getPurchaseOrderById = async (id: string): Promise<PurchaseOrder | undefined> => {
  // CORS問題を回避するためにモックデータを使用
  console.log('Mock getPurchaseOrderById called with id:', id);
  
  const mockPurchaseOrder: PurchaseOrder = {
    id: 'po1',
    orderDate: new Date().toISOString().split('T')[0],
    supplierId: 'supplier1',
    supplierName: 'サプライヤーA',
    storeId: 'store1',
    status: PurchaseOrderStatus.ORDERED,
    createdById: 'admin1',
    items: [
      { productId: '1', productName: '商品A', barcode: '123456789', quantity: 10, costPriceAtOrder: 100, isReceived: false },
      { productId: '2', productName: '商品B', barcode: '987654321', quantity: 5, costPriceAtOrder: 80, isReceived: false },
    ],
  };
  
  return mockPurchaseOrder;
};

export const addPurchaseOrder = async (orderData: Omit<PurchaseOrder, 'id' | 'status' | 'supplierName'>): Promise<PurchaseOrder> => {
  // CORS問題を回避するためにモックデータを使用
  console.log('Mock addPurchaseOrder called');
  
  const mockPurchaseOrder: PurchaseOrder = {
    id: 'po2',
    orderDate: orderData.orderDate,
    supplierId: orderData.supplierId,
    supplierName: 'サプライヤーB',
    storeId: orderData.storeId,
    status: PurchaseOrderStatus.ORDERED,
    createdById: orderData.createdById,
    items: orderData.items,
  };
  
  return mockPurchaseOrder;
};

export const processPurchaseOrderReceipt = async (purchaseOrderId: string, receivedItems: { productId: string; quantity: number }[], userId?: string): Promise<{ success: boolean; updatedStatus: PurchaseOrderStatus }> => {
  // CORS問題を回避するためにモックデータを使用
  console.log('Mock processPurchaseOrderReceipt called');
  
  return { success: true, updatedStatus: PurchaseOrderStatus.COMPLETED };
};

export const getAdminDashboardData = async (startDateStr: string, endDateStr: string, periodLabel: string, storeId?: string): Promise<AdminDashboardData> => {
  // 開発用のモックデータ
  console.log('Mock getAdminDashboardData called');
  
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
  
  return mockAdminData;
};

export const getStaffDashboardData = async (storeId?: string): Promise<StaffDashboardData> => {
  // 開発用のモックデータ
  console.log('Mock getStaffDashboardData called');
  
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
  
  return mockStaffData;
};

export const getMonthlyPurchaseReport = async (month: string, storeId?: string): Promise<MonthlyReportDataPoint[]> => {
  // 開発用のモックデータ
  console.log('Mock getMonthlyPurchaseReport called:', month, storeId);
  
  const mockReportData: MonthlyReportDataPoint[] = [
    {
      month: month,
      supplierName: 'サプライヤーA',
      totalAmount: 450000,
    },
    {
      month: month,
      supplierName: 'サプライヤーB',
      totalAmount: 320000,
    },
    {
      month: month,
      supplierName: 'サプライヤーC',
      totalAmount: 280000,
    },
    {
      month: month,
      supplierName: 'サプライヤーD',
      totalAmount: 200000,
    },
  ];
  
  return mockReportData;
};

export const getStaffUsers = async (): Promise<User[]> => { throw new Error('getStaffUsers not implemented yet.'); };
export const addStaffUser = async (userData: Omit<User, 'id' | 'hashedPassword'> & { password?: string }): Promise<User> => { throw new Error('addStaffUser not implemented yet.'); };
export const updateStaffUser = async (updatedUser: User & { newPassword?: string }): Promise<User> => { throw new Error('updateStaffUser not implemented yet.'); };
export const deleteStaffUser = async (userId: string): Promise<{ success: boolean }> => { throw new Error('deleteStaffUser not implemented yet.'); };

export const updateAdminPassword = async (adminId: string, currentPassword?: string, newPassword?: string): Promise<{ success: boolean; message?: string }> => { throw new Error('updateAdminPassword not implemented yet.'); };

export const getCompanyInfo = async (): Promise<CompanyInfo> => { throw new Error('getCompanyInfo not implemented yet.'); };
export const updateCompanyInfo = async (info: CompanyInfo): Promise<CompanyInfo> => { throw new Error('updateCompanyInfo not implemented yet.'); };

export const addChangeLog = async (action: string, userId: string = 'system') => { throw new Error('addChangeLog not implemented yet.'); };

// モックデータ
const mockProductsWithStock: ProductWithStock[] = [
  {
    id: '1',
    name: '商品A',
    barcode: '123456789',
    category: '食品',
    categoryId: '1',
    costPrice: 1000,
    supplierId: '1',
    lastUpdated: '2024-01-01',
    description: '商品Aの説明',
    currentStock: 50,
    minimumStock: 10,
  },
  {
    id: '2',
    name: '商品B',
    barcode: '987654321',
    category: '飲料',
    categoryId: '2',
    costPrice: 500,
    supplierId: '2',
    lastUpdated: '2024-01-01',
    description: '商品Bの説明',
    currentStock: 30,
    minimumStock: 5,
  },
  {
    id: '3',
    name: '商品C',
    barcode: '456789123',
    category: '雑貨',
    categoryId: '3',
    costPrice: 2000,
    supplierId: '1',
    lastUpdated: '2024-01-01',
    description: '商品Cの説明',
    currentStock: 20,
    minimumStock: 3,
  },
];

export const processOutboundBatch = async (items: { productId: string, quantity: number }[], operatorId: string, storeId: string): Promise<{ success: boolean; errors: string[] }> => {
  // 開発用のモック処理
  console.log('Mock processOutboundBatch called:', items, operatorId, storeId);
  
  // モック処理のシミュレーション
  const errors: string[] = [];
  
  for (const item of items) {
    // 在庫チェック（実際の実装ではデータベースで確認）
    const product = mockProductsWithStock.find((p: ProductWithStock) => p.id === item.productId);
    if (!product) {
      errors.push(`商品ID ${item.productId} が見つかりません。`);
      continue;
    }
    
    // 在庫不足チェック
    if (item.quantity > product.currentStock) {
      errors.push(`${product.name} の在庫が不足しています。`);
      continue;
    }
  }
  
  if (errors.length > 0) {
    return { success: false, errors };
  }
  
  // 成功時の処理
  console.log('Outbound processing completed successfully');
  return { success: true, errors: [] };
};
export const processIntakeBatch = async (items: { productId: string, quantity: number, costPrice: number }[], supplierId: string, operatorId: string, storeId: string): Promise<{ success: boolean; errors: string[] }> => {
  // 開発用のモックデータ
  console.log('Mock processIntakeBatch called:', items, supplierId, operatorId, storeId);
  
  return { success: true, errors: [] };
};

export const getStores = async (): Promise<Store[]> => {
  // 開発用のモックデータ
  console.log('Mock getStores called');
  
  const mockStores: Store[] = [
    { id: 'store1', name: '店舗A', address: '東京都新宿区', phone: '03-1234-5678' },
    { id: 'store2', name: '店舗B', address: '大阪府大阪市', phone: '06-1234-5678' },
  ];
  
  return mockStores;
};
export const addStore = async (store: Omit<Store, 'id'>): Promise<Store> => {
  // 開発用のモックデータ
  console.log('Mock addStore called:', store);
  
  const newStore: Store = {
    ...store,
    id: `store_${Date.now()}`,
  };
  
  return newStore;
};

export const updateStore = async (updatedStore: Store): Promise<Store> => {
  // 開発用のモックデータ
  console.log('Mock updateStore called:', updatedStore);
  
  return updatedStore;
};

export const deleteStore = async (storeId: string): Promise<{ success: boolean }> => {
  // 開発用のモックデータ
  console.log('Mock deleteStore called:', storeId);
  
  return { success: true };
};

// Gemini API Mock (これらはPHPバックエンドで実装されるべき)
export const generateDescriptionMock = async (productName: string, category: string): Promise<string> => {
  // 開発用のモックデータ
  console.log('Mock generateDescriptionMock called:', productName, category);
  
  return `${productName}は${category}カテゴリに属する商品です。高品質で使いやすく、お客様に満足いただける商品です。`;
};
export const parseInvoiceMock = async (base64Image: string): Promise<ProcessedInvoiceItem[]> => {
  // 開発用のモックデータ
  console.log('Mock parseInvoiceMock called');
  
  const mockItems: ProcessedInvoiceItem[] = [
    {
      _tempId: '1',
      rawItem: { itemName: '商品A', quantity: '10', unitPrice: '100' },
      matchedProductId: null,
      isNewProduct: true,
      productName: '商品A',
      barcode: '123456789',
      categoryId: 'cat1',
      minimumStock: 10,
      quantity: 10,
      pricePerUnit: 100,
      status: 'ready',
    },
    {
      _tempId: '2',
      rawItem: { itemName: '商品B', quantity: '5', unitPrice: '80' },
      matchedProductId: null,
      isNewProduct: true,
      productName: '商品B',
      barcode: '987654321',
      categoryId: 'cat2',
      minimumStock: 5,
      quantity: 5,
      pricePerUnit: 80,
      status: 'ready',
    },
  ];
  
  return mockItems;
};

export const uploadPdf = async (pdfFile: File): Promise<{ message: string; filePath: string; fileName: string }> => {
  // 開発用のモックデータ
  console.log('Mock uploadPdf called');
  
  return {
    message: 'PDFファイルが正常にアップロードされました。',
    filePath: '/uploads/mock-pdf.pdf',
    fileName: 'mock-invoice.pdf'
  };
};

// モックapiClientオブジェクト
const apiClient = {
  get: async (endpoint: string, params?: Record<string, any>): Promise<any> => {
    console.log('Mock apiClient.get called:', endpoint, params);
    return [];
  },
  post: async (endpoint: string, data: any): Promise<any> => {
    console.log('Mock apiClient.post called:', endpoint, data);
    return { success: true };
  },
  put: async (endpoint: string, data: any): Promise<any> => {
    console.log('Mock apiClient.put called:', endpoint, data);
    return { success: true };
  },
  delete: async (endpoint: string): Promise<any> => {
    console.log('Mock apiClient.delete called:', endpoint);
    return { success: true };
  },
};

export default apiClient;
