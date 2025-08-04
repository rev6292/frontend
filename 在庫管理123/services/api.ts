import { Product, Supplier, ScheduledIntakeItem, ScheduledIntakeStatus, UserRole, AdminDashboardData, StaffDashboardData, MonthlyReportDataPoint, Category, User, SupplierMonthlyPerformance, ProcessedInvoiceItem, PurchaseOrder, PurchaseOrderStatus, PurchaseOrderItem, CompanyInfo, WatchlistItem, InventoryMovement, CategoryPerformance, Store, InventoryRecord, ProductWithStock } from '../types';

// Initial Admin User - Password is 'ukki0901'
const initialAdminUser: User = { id: 'admin', name: '管理者', role: UserRole.ADMIN, hashedPassword: 'ukki0901_hashed_mock' };

let mockUsers: User[] = [
  initialAdminUser,
  // Password is 'password'
  { id: 'staff1', name: 'デモスタッフ1', role: UserRole.STAFF, storeId: 'store1', hashedPassword: 'password_hashed_mock' },
  // Password is 'password'
  { id: 'staff2', name: '田中花子', role: UserRole.STAFF, storeId: 'store2', hashedPassword: 'password_hashed_mock' },
];

let mockStores: Store[] = [
  { id: 'store1', name: '本店', address: '東京都渋谷区道玄坂1-1-1', phone: '03-1111-2222' },
  { id: 'store2', name: '大阪支店', address: '大阪府大阪市中央区難波2-2-2', phone: '06-3333-4444' },
];

let mockCategories: Category[] = [
  { id: 'cat1', name: 'ヘアケア', parentId: null },
  { id: 'cat1_1', name: 'シャンプー', parentId: 'cat1' },
  { id: 'cat1_2', name: 'トリートメント', parentId: 'cat1' },
  { id: 'cat1_3', name: 'ヘアオイル', parentId: 'cat1' },
  { id: 'cat2', name: 'カラー剤', parentId: null },
  { id: 'cat2_1', name: 'アルカリカラー', parentId: 'cat2' },
  { id: 'cat2_2', name: '酸性カラー', parentId: 'cat2' },
  { id: 'cat3', name: 'スタイリング剤', parentId: null },
  { id: 'cat4', name: 'パーマ剤', parentId: null },
  { id: 'cat5', name: '店舗用品', parentId: null },
  { id: 'cat5_1', name: 'タオル', parentId: 'cat5' },
  { id: 'cat5_2', name: 'ブラシ', parentId: 'cat5' },
];

let mockSuppliers: Supplier[] = [
  { id: 's1', name: 'ビューティーサプライ株式会社', contactPerson: '山田太郎', phone: '03-1234-5678', email: 'yamada@beautysupply.co.jp', address: '東京都渋谷区道玄坂1-2-3', lineId: 'beautysupply_yamada' },
  { id: 's2', name: 'サロンマテリアルズ合同会社', contactPerson: '佐藤花子', phone: '06-9876-5432', email: 'sato@salonmaterials.com', address: '大阪府大阪市中央区難波4-5-6', lineId: 'salonmaterials_sato' },
  { id: 's3', name: 'ビューティーガレージ', contactPerson: '鈴木一郎', phone: '03-5775-4700', email: 'suzuki@beautygarage.jp', address: '東京都世田谷区桜新町1-1-1', lineId: 'beautygarage_suzuki'},
];

// Helper to create dates
const d = (year: number, month: number, day: number) => new Date(year, month - 1, day).toISOString();

let mockProducts: Product[] = [];
let mockInventoryRecords: InventoryRecord[] = [];
let mockScheduledIntakeItems: ScheduledIntakeItem[] = [];
interface MockOutboundLog { productId: string; storeId: string; quantity: number; date: string; }
let mockOutboundLogs: MockOutboundLog[] = [];

// Mock data generator for large scale
const generateLargeScaleMockData = (productCount = 1120) => {
    const products: Product[] = [];
    const inventoryRecords: InventoryRecord[] = [];
    const intakeItems: ScheduledIntakeItem[] = [];
    const outboundLogs: MockOutboundLog[] = [];

    const childCategories = mockCategories.filter(c => c.parentId !== null);
    if (childCategories.length === 0) {
        console.error("No child categories found for data generation");
        return { products: [], inventoryRecords: [], intakeItems: [], outboundLogs: [] };
    }

    const today = new Date();
    
    // Generate Products
    for (let i = 0; i < productCount; i++) {
        const category = childCategories[i % childCategories.length];
        const supplier = mockSuppliers[i % mockSuppliers.length];
        
        const lastUpdatedDaysAgo = Math.random() < 0.05 // 5% chance of being obsolete
            ? 365 + Math.floor(Math.random() * 365) // 1-2 years ago
            : Math.floor(Math.random() * 180); // within last 6 months

        const lastUpdated = new Date(today.getTime() - lastUpdatedDaysAgo * 24 * 60 * 60 * 1000).toISOString();
        const costPrice = 500 + Math.floor(Math.random() * 3000);
        
        const product: Product = {
            id: `p${1000 + i}`,
            name: `${category.name} モデル${String.fromCharCode(65 + (i % 26))}-${Math.floor(i / 26)}`,
            barcode: `49100000${String(1000 + i).padStart(5, '0')}`,
            category: category.name,
            categoryId: category.id,
            costPrice,
            supplierId: supplier.id,
            lastUpdated,
            description: `これは ${category.name} の製品説明です。モデル${String.fromCharCode(65 + (i % 26))}-${Math.floor(i / 26)} は、プロの要求に応える高品質なアイテムです。`,
        };
        products.push(product);

        mockStores.forEach(store => {
            const isObsolete = new Date(lastUpdated) < new Date(new Date().setMonth(new Date().getMonth() - 6));
            const popularity = Math.random();
            const minimumStock = 5 + Math.floor(Math.random() * 10);
            const currentStock = isObsolete ? minimumStock - Math.floor(Math.random() * 3)
                : minimumStock + Math.floor(Math.random() * (20 + popularity * 50));
            
            const inventoryRecord: InventoryRecord = {
                productId: product.id,
                storeId: store.id,
                currentStock: Math.max(0, currentStock),
                minimumStock,
                lastUpdated: product.lastUpdated
            };
            inventoryRecords.push(inventoryRecord);

            // Generate historical data for this product IN THIS STORE
            for (let m = 12; m >= 0; m--) { // Last 12 months
                const date = new Date(today.getFullYear(), today.getMonth() - m, 15);
                
                // Intake
                if (Math.random() < 0.7) { // 70% chance of intake in a month
                    const intakeQty = Math.floor(minimumStock * (0.5 + Math.random()));
                    intakeItems.push({
                        id: `si_${product.id}_${store.id}_${m}`,
                        productName: product.name,
                        productId: product.id,
                        quantity: intakeQty,
                        costPriceAtIntake: product.costPrice * (0.98 + Math.random() * 0.04), // slight price variation
                        status: ScheduledIntakeStatus.RECEIVED,
                        supplierId: product.supplierId,
                        supplierName: supplier.name,
                        storeId: store.id,
                        receivedDate: date.toISOString(),
                        lastUpdated: date.toISOString(),
                    });
                }

                // Outbound
                if (!isObsolete) {
                    const outboundQty = Math.floor(minimumStock * (0.2 + Math.random() * popularity * 1.5));
                    if (outboundQty > 0) {
                        outboundLogs.push({
                            productId: product.id,
                            storeId: store.id,
                            quantity: outboundQty,
                            date: date.toISOString(),
                        });
                    }
                }
            }
        });
    }

    return { products, inventoryRecords, intakeItems, outboundLogs };
};


// --- Use the generator ---
const { 
    products: generatedProducts, 
    inventoryRecords: generatedInventoryRecords,
    intakeItems: generatedIntakeItems, 
    outboundLogs: generatedOutboundLogs 
} = generateLargeScaleMockData();

mockProducts = generatedProducts;
mockInventoryRecords = generatedInventoryRecords;
mockScheduledIntakeItems = generatedIntakeItems;
mockOutboundLogs = generatedOutboundLogs;

let mockCompanyInfo: CompanyInfo = {
  id: 'main',
  name: 'Salon Stock Intelligence',
  address: '〒123-4567 東京都架空区架空1-2-3',
  phone: '03-9876-5432',
  fax: '03-9876-5433',
  website: 'https://example.com',
  representativeName: '代表取締役 架空 太郎',
};


let mockPurchaseOrders: PurchaseOrder[] = [
    {
        id: 'po1',
        orderDate: d(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate() - 5).split('T')[0], // 5 days ago
        supplierId: 's1',
        supplierName: 'ビューティーサプライ株式会社',
        storeId: 'store1',
        items: [
            { productId: mockProducts[0].id, productName: mockProducts[0].name, barcode: mockProducts[0].barcode, quantity: 10, costPriceAtOrder: mockProducts[0].costPrice, isReceived: false },
            { productId: mockProducts[1].id, productName: mockProducts[1].name, barcode: mockProducts[1].barcode, quantity: 20, costPriceAtOrder: mockProducts[1].costPrice, isReceived: false },
        ],
        status: PurchaseOrderStatus.ORDERED,
        createdById: 'admin',
    },
    {
        id: 'po2',
        orderDate: d(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate() - 10).split('T')[0], // 10 days ago
        supplierId: 's2',
        supplierName: 'サロンマテリアルズ合同会社',
        storeId: 'store2',
        items: [
             { productId: mockProducts[2].id, productName: mockProducts[2].name, barcode: mockProducts[2].barcode, quantity: 5, costPriceAtOrder: mockProducts[2].costPrice, isReceived: true },
             { productId: mockProducts[3].id, productName: mockProducts[3].name, barcode: mockProducts[3].barcode, quantity: 10, costPriceAtOrder: mockProducts[3].costPrice, isReceived: false },
        ],
        status: PurchaseOrderStatus.PARTIALLY_RECEIVED,
        createdById: 'admin',
    },
];

const simulateApiCall = <T,>(data: T, delay = 300): Promise<T> => {
  return new Promise(resolve => setTimeout(() => {
    if (data === undefined) {
      resolve(data);
      return;
    }
    resolve(JSON.parse(JSON.stringify(data)));
  }, delay));
};

// Auth
export const authenticateUser = (id: string, password?: string): Promise<User> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const user = mockUsers.find(u => u.id === id);
      const mockHashedPassword = `${password}_hashed_mock`;
      if (user && user.hashedPassword && user.hashedPassword === mockHashedPassword) {
        const { hashedPassword, ...userWithoutPassword } = user;
        resolve(userWithoutPassword);
      } else {
        reject(new Error("ユーザーIDまたはパスワードが正しくありません。"));
      }
    }, 500);
  });
};


// Categories
export const getCategories = (): Promise<Category[]> => simulateApiCall(mockCategories);
export const addCategory = (category: Omit<Category, 'id'>): Promise<Category> => {
  const newCategory: Category = { ...category, id: `cat${Date.now()}` };
  mockCategories.push(newCategory);
  return simulateApiCall(newCategory);
};
export const updateCategory = (updatedCategory: Category): Promise<Category> => {
  mockCategories = mockCategories.map(c => c.id === updatedCategory.id ? updatedCategory : c);
  return simulateApiCall(updatedCategory);
};
export const deleteCategory = (categoryId: string): Promise<{ success: boolean }> => {
  const isParent = mockCategories.some(c => c.parentId === categoryId);
  if (isParent) return Promise.reject(new Error("このカテゴリは他のカテゴリの親として使用されているため削除できません。"));
  const isInUseByProduct = mockProducts.some(p => p.categoryId === categoryId);
  if (isInUseByProduct) return Promise.reject(new Error("このカテゴリは商品に紐付けられているため削除できません。"));
  mockCategories = mockCategories.filter(c => c.id !== categoryId);
  return simulateApiCall({ success: true });
};


// Products
const getProductWithStock = (product: Product, storeId?: string): ProductWithStock => {
    let currentStock = 0;
    let minimumStock = 0;
    
    if (storeId && storeId !== 'all') {
        const record = mockInventoryRecords.find(inv => inv.productId === product.id && inv.storeId === storeId);
        if (record) {
            currentStock = record.currentStock;
            minimumStock = record.minimumStock;
        }
    } else { // 'all' or undefined, aggregate across all stores
        const records = mockInventoryRecords.filter(inv => inv.productId === product.id);
        currentStock = records.reduce((sum, r) => sum + r.currentStock, 0);
        minimumStock = records.reduce((sum, r) => sum + r.minimumStock, 0);
    }

    return { ...product, currentStock, minimumStock };
};

export const getProducts = (storeId?: string): Promise<ProductWithStock[]> => {
    const productsWithStock = mockProducts.map(p => getProductWithStock(p, storeId));
    return simulateApiCall(productsWithStock);
};

export const getProductById = (id: string, storeId?: string): Promise<ProductWithStock | undefined> => {
    const product = mockProducts.find(p => p.id === id);
    if (!product) return simulateApiCall(undefined);
    return simulateApiCall(getProductWithStock(product, storeId));
};

export const findProductByBarcode = (barcode: string, storeId?: string): Promise<ProductWithStock | undefined> => {
  const product = mockProducts.find(p => p.barcode === barcode);
  if (!product) return simulateApiCall(undefined);
  return simulateApiCall(getProductWithStock(product, storeId));
};

export const findProductByName = (name: string): Promise<Product | undefined> => {
  const searchTerm = name.toLowerCase();
  return simulateApiCall(mockProducts.find(p => p.name.toLowerCase() === searchTerm));
};

export const addProduct = (
  productData: Omit<Product, 'id' | 'lastUpdated'>,
  stockData: { currentStock: number, minimumStock: number, storeId: string }
): Promise<Product> => {
  const existingByBarcode = mockProducts.find(p => p.barcode === productData.barcode);
  if (existingByBarcode) return Promise.reject(new Error(`バーコード '${productData.barcode}' は既に商品 '${existingByBarcode.name}' で使用されています。`));

  const newProduct: Product = { 
    ...productData, 
    id: `p${Date.now()}`, 
    category: mockCategories.find(c => c.id === productData.categoryId)?.name || productData.category,
    lastUpdated: new Date().toISOString(), 
    description: productData.description || '',
  };
  mockProducts.push(newProduct);
  
  mockStores.forEach(store => {
      mockInventoryRecords.push({
        productId: newProduct.id,
        storeId: store.id,
        currentStock: store.id === stockData.storeId ? stockData.currentStock : 0,
        minimumStock: store.id === stockData.storeId ? stockData.minimumStock : 0,
        lastUpdated: new Date().toISOString()
      });
  });

  return simulateApiCall(newProduct);
};

export const updateProductAndInventory = (product: Product, stock: { currentStock: number, minimumStock: number }, storeId: string): Promise<Product> => {
  const productWithCategoryName = {
    ...product,
    category: mockCategories.find(c => c.id === product.categoryId)?.name || product.category,
    lastUpdated: new Date().toISOString()
  };
  mockProducts = mockProducts.map(p => p.id === productWithCategoryName.id ? productWithCategoryName : p);
  
  const invIndex = mockInventoryRecords.findIndex(inv => inv.productId === product.id && inv.storeId === storeId);
  if(invIndex > -1) {
    mockInventoryRecords[invIndex].currentStock = stock.currentStock;
    mockInventoryRecords[invIndex].minimumStock = stock.minimumStock;
    mockInventoryRecords[invIndex].lastUpdated = new Date().toISOString();
  }

  return simulateApiCall(productWithCategoryName);
};

export const deleteProduct = (id: string) => {
  mockProducts = mockProducts.filter(p => p.id !== id);
  mockInventoryRecords = mockInventoryRecords.filter(inv => inv.productId !== id);
  return simulateApiCall({ success: true });
};

export const batchUpsertProducts = async (
  productsData: (Partial<ProductWithStock>)[],
  storeId: string
): Promise<{ createdCount: number; updatedCount: number; errors: string[] }> => {
  let createdCount = 0;
  let updatedCount = 0;
  const errors: string[] = [];

  for (const productData of productsData) {
    if (!productData.barcode) {
      errors.push(`バーコードがありません: ${productData.name || '名前不明の商品'}`);
      continue;
    }

    const existingProductIndex = mockProducts.findIndex(p => p.barcode === productData.barcode);

    if (existingProductIndex > -1) {
      const originalProduct = mockProducts[existingProductIndex];
      const updatedProduct = { ...originalProduct, ...productData, lastUpdated: new Date().toISOString() };
      mockProducts[existingProductIndex] = updatedProduct;

      if (productData.currentStock !== undefined || productData.minimumStock !== undefined) {
          const invIndex = mockInventoryRecords.findIndex(inv => inv.productId === originalProduct.id && inv.storeId === storeId);
          if (invIndex > -1) {
              if (productData.currentStock !== undefined) mockInventoryRecords[invIndex].currentStock = productData.currentStock;
              if (productData.minimumStock !== undefined) mockInventoryRecords[invIndex].minimumStock = productData.minimumStock;
              mockInventoryRecords[invIndex].lastUpdated = new Date().toISOString();
          }
      }
      updatedCount++;
    } else {
      if (!productData.name || !productData.categoryId || !productData.supplierId) {
        errors.push(`新規商品の必須フィールド(商品名, カテゴリID, 仕入先ID)が不足しています: ${productData.barcode}`);
        continue;
      }
      const { currentStock, minimumStock, ...newProdData } = productData;
      const newProduct: Product = {
        id: `p${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: newProdData.name!,
        barcode: newProdData.barcode,
        categoryId: newProdData.categoryId!,
        category: mockCategories.find(c => c.id === newProdData.categoryId)?.name || '未分類',
        supplierId: newProdData.supplierId!,
        costPrice: newProdData.costPrice || 0,
        description: newProdData.description || '',
        lastUpdated: new Date().toISOString(),
      };
      mockProducts.push(newProduct);
      
      mockStores.forEach(store => {
          mockInventoryRecords.push({
              productId: newProduct.id,
              storeId: store.id,
              currentStock: store.id === storeId ? (currentStock || 0) : 0,
              minimumStock: store.id === storeId ? (minimumStock || 0) : 0,
              lastUpdated: new Date().toISOString()
          });
      });
      createdCount++;
    }
  }

  return simulateApiCall({ createdCount, updatedCount, errors });
};


// Suppliers
export const getSuppliers = () => simulateApiCall(mockSuppliers);
export const addSupplier = (supplier: Omit<Supplier, 'id'>) => {
  const newSupplier: Supplier = { ...supplier, id: `s${Date.now()}` };
  mockSuppliers.push(newSupplier);
  return simulateApiCall(newSupplier);
};
export const updateSupplier = (updatedSupplier: Supplier) => {
  mockSuppliers = mockSuppliers.map(s => s.id === updatedSupplier.id ? updatedSupplier : s);
  return simulateApiCall(updatedSupplier);
};
export const deleteSupplier = (id: string) => {
  mockSuppliers = mockSuppliers.filter(s => s.id !== id);
  return simulateApiCall({ success: true });
};

// Scheduled Intake
export const getScheduledIntakeItems = (storeId?: string) => {
    if (storeId && storeId !== 'all') {
        return simulateApiCall(mockScheduledIntakeItems.filter(item => item.storeId === storeId));
    }
    return simulateApiCall(mockScheduledIntakeItems);
};

export const addScheduledIntakeItem = (itemData: Omit<ScheduledIntakeItem, 'id' | 'lastUpdated'>): Promise<ScheduledIntakeItem> => {
  const newItem: ScheduledIntakeItem = { 
    ...itemData, 
    id: `si${Date.now()}`, 
    lastUpdated: new Date().toISOString() 
  };
  mockScheduledIntakeItems.push(newItem);

  if (newItem.status === ScheduledIntakeStatus.RECEIVED && newItem.productId && newItem.quantity > 0) {
    const invIndex = mockInventoryRecords.findIndex(inv => inv.productId === newItem.productId && inv.storeId === newItem.storeId);
    if (invIndex > -1) {
      mockInventoryRecords[invIndex].currentStock += newItem.quantity;
      mockInventoryRecords[invIndex].lastUpdated = new Date().toISOString();
      const productIndex = mockProducts.findIndex(p => p.id === newItem.productId);
      if(productIndex > -1 && newItem.costPriceAtIntake !== undefined) {
         mockProducts[productIndex].costPrice = newItem.costPriceAtIntake;
         mockProducts[productIndex].lastUpdated = new Date().toISOString();
      }
    }
  }
  return simulateApiCall(newItem);
};

export const updateScheduledIntakeItem = (item: ScheduledIntakeItem): Promise<ScheduledIntakeItem> => {
  const oldItem = mockScheduledIntakeItems.find(si => si.id === item.id);
  const updatedItem = {...item, lastUpdated: new Date().toISOString()};
  mockScheduledIntakeItems = mockScheduledIntakeItems.map(si => si.id === item.id ? updatedItem : si);

  if (updatedItem.status === ScheduledIntakeStatus.RECEIVED && 
      oldItem?.status !== ScheduledIntakeStatus.RECEIVED &&
      updatedItem.productId && updatedItem.quantity > 0) {
    const invIndex = mockInventoryRecords.findIndex(inv => inv.productId === updatedItem.productId && inv.storeId === updatedItem.storeId);
    if (invIndex > -1) {
      mockInventoryRecords[invIndex].currentStock += updatedItem.quantity;
      mockInventoryRecords[invIndex].lastUpdated = new Date().toISOString();
      const productIndex = mockProducts.findIndex(p => p.id === updatedItem.productId);
      if(productIndex > -1 && updatedItem.costPriceAtIntake !== undefined) {
         mockProducts[productIndex].costPrice = updatedItem.costPriceAtIntake;
         mockProducts[productIndex].lastUpdated = new Date().toISOString();
      }
    }
  }
  return simulateApiCall(updatedItem);
};

export const addReceivedItemsFromInvoice = async (
  items: ProcessedInvoiceItem[], 
  supplierId: string, 
  userId: string,
  storeId: string
): Promise<{ successCount: number; errorCount: number; errors: string[] }> => {
  let successCount = 0;
  let errorCount = 0;
  const errors: string[] = [];

  for (const processedItem of items) {
    try {
      let productIdToUse = processedItem.matchedProductId;
      
      if (processedItem.isNewProduct) {
        if (!processedItem.barcode || !processedItem.categoryId || processedItem.minimumStock === undefined || processedItem.pricePerUnit === undefined) throw new Error(`新規商品「${processedItem.productName}」の必須情報が不足。`);
        
        const { isNewProduct, matchedProductId, _tempId, rawItem, status, error, quantity, minimumStock, pricePerUnit, ...productFields } = processedItem;
        const newProductData: Omit<Product, 'id' | 'lastUpdated'> = {
            name: productFields.productName,
            barcode: productFields.barcode,
            categoryId: productFields.categoryId,
            category: mockCategories.find(c => c.id === productFields.categoryId)?.name || '未分類',
            supplierId,
            costPrice: pricePerUnit
        };
        const stockData = { currentStock: 0, minimumStock: minimumStock, storeId: storeId };
        const addedProduct = await addProduct(newProductData, stockData);
        productIdToUse = addedProduct.id;
        addChangeLog(`新規商品 ${addedProduct.name} を納品書(入荷処理)から登録`, userId);
      }
      if (!productIdToUse) throw new Error(`商品「${processedItem.productName}」のIDが見つかりません。`);

      await addScheduledIntakeItem({
        productName: processedItem.productName, productId: productIdToUse, quantity: processedItem.quantity,
        costPriceAtIntake: processedItem.pricePerUnit, status: ScheduledIntakeStatus.RECEIVED,
        supplierId: supplierId, supplierName: mockSuppliers.find(s => s.id === supplierId)?.name || '不明',
        storeId, receivedDate: new Date().toISOString(), notes: `納品書画像から自動登録 (${new Date().toLocaleDateString()})`,
      });
      successCount++;
    } catch (e) {
      errorCount++; errors.push(`商品「${processedItem.productName}」の入荷記録エラー: ${(e as Error).message}`);
    }
  }
  return simulateApiCall({ successCount, errorCount, errors });
};

export const addNewProductsFromAIData = async (
  items: ProcessedInvoiceItem[], supplierId: string, registrarId: string, storeId: string
): Promise<{ successCount: number; errorCount: number; errors: string[] }> => {
  let successCount = 0; let errorCount = 0; const errors: string[] = [];
  for (const item of items) {
    try {
      if (!item.isNewProduct) { errors.push(`商品「${item.productName}」は新規商品ではありません。`); errorCount++; continue; }
      if (!item.barcode || !item.categoryId || item.minimumStock === undefined || item.pricePerUnit === undefined || !item.productName) throw new Error(`必須情報が不足。`);

      const { isNewProduct, matchedProductId, _tempId, rawItem, status, error, quantity, minimumStock, pricePerUnit, ...productFields } = item;
      const newProductData: Omit<Product, 'id' | 'lastUpdated'> = {
            name: productFields.productName,
            barcode: productFields.barcode,
            categoryId: productFields.categoryId,
            category: mockCategories.find(c => c.id === productFields.categoryId)?.name || '未分類',
            supplierId,
            costPrice: pricePerUnit,
      };
      const stockData = { currentStock: 0, minimumStock, storeId, };
      const addedProduct = await addProduct(newProductData, stockData);
      addChangeLog(`新規商品 ${addedProduct.name} を登録 (担当: ${registrarId || '不明'})`, registrarId);

      if (item.quantity > 0) {
        await addScheduledIntakeItem({
            productName: addedProduct.name, productId: addedProduct.id, quantity: item.quantity,
            costPriceAtIntake: item.pricePerUnit, status: ScheduledIntakeStatus.RECEIVED, supplierId: supplierId,
            supplierName: mockSuppliers.find(s => s.id === supplierId)?.name || '不明', storeId,
            receivedDate: new Date().toISOString(), notes: `新規商品登録時の初期在庫 (${new Date().toLocaleDateString()})`,
        });
      }
      successCount++;
    } catch (e) {
      errorCount++; errors.push(`新規商品「${item.productName}」の登録エラー: ${(e as Error).message}`);
    }
  }
  return simulateApiCall({ successCount, errorCount, errors });
};

// Purchase Orders
export const getPurchaseOrders = (storeId?: string): Promise<PurchaseOrder[]> => {
    if(storeId && storeId !== 'all') {
        return simulateApiCall(mockPurchaseOrders.filter(po => po.storeId === storeId));
    }
    return simulateApiCall(mockPurchaseOrders);
};
export const getPurchaseOrderById = (id: string): Promise<PurchaseOrder | undefined> => {
    return simulateApiCall(mockPurchaseOrders.find(po => po.id === id));
};
export const addPurchaseOrder = (orderData: Omit<PurchaseOrder, 'id' | 'status' | 'supplierName'>): Promise<PurchaseOrder> => {
  const supplier = mockSuppliers.find(s => s.id === orderData.supplierId);
  if (!supplier) return Promise.reject(new Error("Supplier not found"));
  const newOrder: PurchaseOrder = { ...orderData, id: `po${Date.now()}`, supplierName: supplier.name, status: PurchaseOrderStatus.ORDERED, };
  mockPurchaseOrders.unshift(newOrder);
  return simulateApiCall(newOrder);
};
export const processPurchaseOrderReceipt = async (purchaseOrderId: string, receivedItems: { productId: string; quantity: number }[], userId?: string): Promise<{ success: boolean; updatedStatus: PurchaseOrderStatus }> => {
  const poIndex = mockPurchaseOrders.findIndex(po => po.id === purchaseOrderId);
  if (poIndex === -1) return Promise.reject(new Error("Purchase Order not found."));

  const purchaseOrder = mockPurchaseOrders[poIndex];
  const today = new Date().toISOString();

  for (const receivedItem of receivedItems) {
    const poItem = purchaseOrder.items.find(i => i.productId === receivedItem.productId && !i.isReceived);
    if (!poItem) continue;
    await addScheduledIntakeItem({
      productName: poItem.productName, productId: poItem.productId, quantity: receivedItem.quantity,
      costPriceAtIntake: poItem.costPriceAtOrder, status: ScheduledIntakeStatus.RECEIVED,
      supplierId: purchaseOrder.supplierId, supplierName: purchaseOrder.supplierName,
      storeId: purchaseOrder.storeId, receivedDate: today, notes: `発注書 #${purchaseOrder.id} より入荷`,
    });
    poItem.isReceived = true;
  }
  const allItemsReceived = purchaseOrder.items.every(item => item.isReceived);
  purchaseOrder.status = allItemsReceived ? PurchaseOrderStatus.COMPLETED : PurchaseOrderStatus.PARTIALLY_RECEIVED;
  if (allItemsReceived) purchaseOrder.completedDate = today.split('T')[0];
  
  mockPurchaseOrders[poIndex] = purchaseOrder;
  addChangeLog(`発注書 #${purchaseOrder.id} の入荷処理を実行`, userId);
  return simulateApiCall({ success: true, updatedStatus: purchaseOrder.status });
};

// Dashboard Data
export const getAdminDashboardData = async (startDateStr: string, endDateStr: string, periodLabel: string, storeId?: string): Promise<AdminDashboardData> => {
    const allProductsWithStock = await getProducts(storeId);

    const totalInventoryValue = allProductsWithStock.reduce((sum, p) => sum + (p.costPrice * p.currentStock), 0);
    const lowStockItemsCount = allProductsWithStock.filter(p => p.currentStock < p.minimumStock).length;
    
    const relevantIntakeItems = storeId && storeId !== 'all'
        ? mockScheduledIntakeItems.filter(si => si.storeId === storeId)
        : mockScheduledIntakeItems;
    const pendingIntakeApprovals = relevantIntakeItems.filter(si => si.status === ScheduledIntakeStatus.PENDING_APPROVAL || si.status === ScheduledIntakeStatus.MANUAL_CHECK_NEEDED).length;
    
    const sixMonthsAgo = new Date(); sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const obsoleteProducts = allProductsWithStock.filter(p => new Date(p.lastUpdated) < sixMonthsAgo);
    const obsoleteStockItemsCount = obsoleteProducts.length;
    const obsoleteStockValue = obsoleteProducts.reduce((sum, p) => sum + (p.currentStock * p.costPrice), 0);

    const startDate = new Date(startDateStr); startDate.setHours(0,0,0,0);
    const endDate = new Date(endDateStr); endDate.setHours(23,59,59,999);
    const prevPeriodStartDate = new Date(startDate); prevPeriodStartDate.setFullYear(prevPeriodStartDate.getFullYear() - 1);
    const prevPeriodEndDate = new Date(endDate); prevPeriodEndDate.setFullYear(prevPeriodEndDate.getFullYear() - 1);

    let supplierPerformances: SupplierMonthlyPerformance[] = [];
    let totalForPeriod = 0, totalForPreviousPeriod = 0;
    mockSuppliers.forEach(supplier => {
        let currentPeriodTotal = 0, previousPeriodTotal = 0;
        relevantIntakeItems.forEach(item => {
            if (item.supplierId === supplier.id && item.status === ScheduledIntakeStatus.RECEIVED && item.costPriceAtIntake && item.receivedDate) {
                const itemReceivedDate = new Date(item.receivedDate);
                if (itemReceivedDate >= startDate && itemReceivedDate <= endDate) currentPeriodTotal += item.quantity * item.costPriceAtIntake;
                if (itemReceivedDate >= prevPeriodStartDate && itemReceivedDate <= prevPeriodEndDate) previousPeriodTotal += item.quantity * item.costPriceAtIntake;
            }
        });
        if (currentPeriodTotal > 0 || previousPeriodTotal > 0) {
            const difference = currentPeriodTotal - previousPeriodTotal;
            const percentageChange = previousPeriodTotal !== 0 ? (difference / previousPeriodTotal) : (currentPeriodTotal > 0 ? Infinity : 0);
            supplierPerformances.push({ supplierId: supplier.id, supplierName: supplier.name, currentPeriodTotal, previousPeriodTotal, difference, percentageChange });
            totalForPeriod += currentPeriodTotal; totalForPreviousPeriod += previousPeriodTotal;
        }
    });
    
    const today = new Date();
    const currentCalendarMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    let currentMonthTotalMaterialCost = 0;
    relevantIntakeItems.forEach(item => {
        if ((item.status === ScheduledIntakeStatus.RECEIVED) && item.costPriceAtIntake && item.receivedDate) {
            const itemReceivedDate = new Date(item.receivedDate);
            if (itemReceivedDate.getFullYear() === today.getFullYear() && itemReceivedDate.getMonth() === today.getMonth()) currentMonthTotalMaterialCost += item.quantity * item.costPriceAtIntake;
        }
    });
    const currentMonthStartDate = new Date(today.getFullYear(), today.getMonth(), 1);
    const currentMonthEndDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const totalIntakeItemsThisMonth = relevantIntakeItems.filter(item => item.status === ScheduledIntakeStatus.RECEIVED && item.receivedDate && new Date(item.receivedDate) >= currentMonthStartDate && new Date(item.receivedDate) <= currentMonthEndDate).reduce((sum, item) => sum + item.quantity, 0);
    
    const relevantOutboundLogs = storeId && storeId !== 'all' ? mockOutboundLogs.filter(log => log.storeId === storeId) : mockOutboundLogs;
    const outboundThisMonth: { [key: string]: number } = {};
    relevantOutboundLogs.forEach(log => {
        const logDate = new Date(log.date);
        if (logDate >= currentMonthStartDate && logDate <= currentMonthEndDate) outboundThisMonth[log.productId] = (outboundThisMonth[log.productId] || 0) + log.quantity;
    });

    const totalOutboundItemsThisMonth = Object.values(outboundThisMonth).reduce((sum, qty) => sum + qty, 0);
    const topOutboundProductsThisMonth = Object.entries(outboundThisMonth).map(([productId, totalQuantity]) => ({ productId, productName: mockProducts.find(p => p.id === productId)?.name || '不明', totalQuantity })).sort((a, b) => b.totalQuantity - a.totalQuantity).slice(0, 5);

    const inventoryWatchlist: WatchlistItem[] = [];
    allProductsWithStock.forEach(product => {
        const lastUpdatedDate = new Date(product.lastUpdated);
        const daysSinceLastUpdate = Math.floor((new Date().getTime() - lastUpdatedDate.getTime()) / (1000 * 3600 * 24));
        if (lastUpdatedDate < sixMonthsAgo) inventoryWatchlist.push({ product, reason: 'obsolete', daysSinceLastUpdate });
        else if (product.minimumStock > 0 && product.currentStock > product.minimumStock * 5 && product.currentStock > 20) inventoryWatchlist.push({ product, reason: 'excess', daysSinceLastUpdate });
    });
    inventoryWatchlist.sort((a, b) => b.daysSinceLastUpdate - a.daysSinceLastUpdate);

    const inventoryMovement: InventoryMovement[] = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
        const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);
        const intake = relevantIntakeItems.filter(item => item.status === ScheduledIntakeStatus.RECEIVED && item.receivedDate && new Date(item.receivedDate) >= monthStart && new Date(item.receivedDate) <= monthEnd).reduce((sum, item) => sum + item.quantity, 0);
        const outbound = relevantOutboundLogs.filter(log => new Date(log.date) >= monthStart && new Date(log.date) <= monthEnd).reduce((sum, log) => sum + log.quantity, 0);
        inventoryMovement.push({ month: monthKey, intake, outbound });
    }
    
    const threeMonthsAgo = new Date(); threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    const categoryPerformance: CategoryPerformance[] = mockCategories.filter(c => c.parentId === null).map(parentCat => {
        const allCatIds = [parentCat.id, ...mockCategories.filter(c => c.parentId === parentCat.id).map(c => c.id)];
        const productsInCategory = allProductsWithStock.filter(p => allCatIds.includes(p.categoryId));
        const inventoryValue = productsInCategory.reduce((sum, p) => sum + (p.currentStock * p.costPrice), 0);
        const outboundQtyLast3Months = relevantOutboundLogs.filter(log => new Date(log.date) >= threeMonthsAgo && productsInCategory.some(p => p.id === log.productId)).reduce((sum, log) => sum + log.quantity, 0);
        const currentStockInCategory = productsInCategory.reduce((sum, p) => sum + p.currentStock, 0);
        const turnoverRate = currentStockInCategory > 0 ? outboundQtyLast3Months / currentStockInCategory : 0;
        return { categoryId: parentCat.id, categoryName: parentCat.name, inventoryValue, turnoverRate };
    }).filter(cat => cat.inventoryValue > 0).sort((a,b) => b.inventoryValue - a.inventoryValue);

    const outboundValueLast3Months = relevantOutboundLogs.filter(log => new Date(log.date) >= threeMonthsAgo).reduce((sum, log) => { const product = mockProducts.find(p => p.id === log.productId); return sum + (log.quantity * (product?.costPrice || 0)); }, 0);
    const inventoryTurnoverRate = totalInventoryValue > 0 ? (outboundValueLast3Months * 4) / totalInventoryValue : 0;
    
    return simulateApiCall({
        totalInventoryValue, lowStockItemsCount, pendingIntakeApprovals, obsoleteStockItemsCount,
        selectedPeriodSummary: { periodLabel, supplierPerformances, totalForPeriod, totalForPreviousPeriod },
        currentCalendarMonthStats: { month: currentCalendarMonthStr, totalMaterialCost: currentMonthTotalMaterialCost },
        totalIntakeItemsThisMonth, totalOutboundItemsThisMonth, topOutboundProductsThisMonth, inventoryWatchlist,
        obsoleteStockValue, inventoryTurnoverRate, inventoryMovement, categoryPerformance,
    });
};

export const getStaffDashboardData = async (storeId?: string): Promise<StaffDashboardData> => {
    if (!storeId || storeId === 'all') storeId = mockStores[0].id;
    const productsWithStock = await getProducts(storeId);
    const totalInventoryValue = productsWithStock.reduce((sum, p) => sum + (p.costPrice * p.currentStock), 0);
    const approxTotalInventoryValue = `約 ¥${(Math.floor(totalInventoryValue / 10000) * 10000).toLocaleString()}`; 
    const lowStockItemsCount = productsWithStock.filter(p => p.currentStock < p.minimumStock).length;
    
    const today = new Date();
    const currentMonthStartDate = new Date(today.getFullYear(), today.getMonth(), 1);
    const currentMonthEndDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const relevantIntakeItems = mockScheduledIntakeItems.filter(item => item.storeId === storeId);
    const totalIntakeItemsThisMonth = relevantIntakeItems.filter(item => item.status === ScheduledIntakeStatus.RECEIVED && item.receivedDate && new Date(item.receivedDate) >= currentMonthStartDate && new Date(item.receivedDate) <= currentMonthEndDate).reduce((sum, item) => sum + item.quantity, 0);
    
    const relevantOutboundLogs = mockOutboundLogs.filter(log => log.storeId === storeId);
    const outboundThisMonth: { [key: string]: number } = {};
    relevantOutboundLogs.forEach(log => {
        const logDate = new Date(log.date);
        if (logDate >= currentMonthStartDate && logDate <= currentMonthEndDate) outboundThisMonth[log.productId] = (outboundThisMonth[log.productId] || 0) + log.quantity;
    });

    const totalOutboundItemsThisMonth = Object.values(outboundThisMonth).reduce((sum, qty) => sum + qty, 0);
    const topOutboundProductsThisMonth = Object.entries(outboundThisMonth).map(([productId, totalQuantity]) => ({ productId, productName: mockProducts.find(p => p.id === productId)?.name || '不明', totalQuantity })).sort((a, b) => b.totalQuantity - a.totalQuantity).slice(0, 5);

    return simulateApiCall({ approxTotalInventoryValue, lowStockItemsCount, totalIntakeItemsThisMonth, totalOutboundItemsThisMonth, topOutboundProductsThisMonth });
};

// Reports
export const getMonthlyPurchaseReport = (month: string, storeId?: string): Promise<MonthlyReportDataPoint[]> => {
  const reportData: MonthlyReportDataPoint[] = [];
  const relevantIntake = storeId && storeId !== 'all' ? mockScheduledIntakeItems.filter(i => i.storeId === storeId) : mockScheduledIntakeItems;
  const uniqueSuppliers = Array.from(new Set(relevantIntake.map(item => item.supplierId).filter(Boolean))) as string[];

  uniqueSuppliers.forEach(supplierId => {
    const supplier = mockSuppliers.find(s => s.id === supplierId);
    if (!supplier) return;
    const totalAmount = relevantIntake.filter(item => (item.status === ScheduledIntakeStatus.RECEIVED) && item.supplierId === supplierId && item.receivedDate && item.receivedDate.startsWith(month) && item.costPriceAtIntake).reduce((sum, item) => sum + (item.quantity * (item.costPriceAtIntake || 0)), 0);
    if (totalAmount > 0) reportData.push({ month, supplierName: supplier.name, totalAmount });
  });
  return simulateApiCall(reportData);
};

// User Management (Staff)
export const getStaffUsers = (): Promise<User[]> => simulateApiCall(mockUsers);
export const addStaffUser = (userData: Omit<User, 'id' | 'hashedPassword'> & { password?: string }): Promise<User> => {
  const newUser: User = { ...userData, id: `user${Date.now()}`, hashedPassword: userData.password ? `${userData.password}_hashed_mock` : undefined };
  mockUsers.push(newUser); return simulateApiCall(newUser);
};
export const updateStaffUser = (updatedUser: User & { newPassword?: string }): Promise<User> => {
  let userToUpdate = { ...updatedUser };
  if (updatedUser.newPassword) userToUpdate.hashedPassword = `${updatedUser.newPassword}_hashed_mock`;
  const { newPassword, ...finalUserObject } = userToUpdate;
  mockUsers = mockUsers.map(u => u.id === finalUserObject.id ? finalUserObject : u);
  return simulateApiCall(finalUserObject);
};
export const deleteStaffUser = (userId: string): Promise<{ success: boolean }> => {
  if (userId === initialAdminUser.id) return Promise.reject(new Error("メイン管理者は削除できません。"));
  mockUsers = mockUsers.filter(u => u.id !== userId);
  return simulateApiCall({ success: true });
};

// Admin Profile
export const updateAdminPassword = (adminId: string, currentPassword?: string, newPassword?: string): Promise<{ success: boolean; message?: string }> => {
  const adminUser = mockUsers.find(u => u.id === adminId && u.role === UserRole.ADMIN);
  if (!adminUser) return Promise.reject(new Error("管理者アカウントが見つかりません。"));
  if (adminUser.hashedPassword !== `${currentPassword}_hashed_mock`) return simulateApiCall({ success: false, message: "現在のパスワードが正しくありません。" });
  adminUser.hashedPassword = `${newPassword}_hashed_mock`;
  mockUsers = mockUsers.map(u => u.id === adminId ? adminUser : u);
  return simulateApiCall({ success: true, message: "パスワードが正常に変更されました。" });
};

// Company Info
export const getCompanyInfo = (): Promise<CompanyInfo> => simulateApiCall(mockCompanyInfo);
export const updateCompanyInfo = (info: CompanyInfo): Promise<CompanyInfo> => {
  mockCompanyInfo = { ...info }; return simulateApiCall(mockCompanyInfo);
};

// Simulate Change Log
export const addChangeLog = (action: string, userId: string = 'system') => {
  console.log(`[Change Log - ${userId}]: ${action} at ${new Date().toISOString()}`);
  return simulateApiCall({success: true});
};

// Outbound Processing
export const processOutboundBatch = async (items: { productId: string, quantity: number }[], operatorId: string, storeId: string): Promise<{ success: boolean; errors: string[] }> => {
  const errors: string[] = [];
  const operator = mockUsers.find(u => u.id === operatorId);

  for (const item of items) {
    const inv = mockInventoryRecords.find(i => i.productId === item.productId && i.storeId === storeId);
    if (!inv) errors.push(`商品ID '${item.productId}' が店舗 '${storeId}' に見つかりません。`);
    else if (inv.currentStock < item.quantity) errors.push(`在庫不足: 「${mockProducts.find(p=>p.id===item.productId)?.name}」(必要数: ${item.quantity}, 現在庫: ${inv.currentStock})`);
  }
  if (errors.length > 0) return simulateApiCall({ success: false, errors }, 50);

  for (const item of items) {
    const invIndex = mockInventoryRecords.findIndex(i => i.productId === item.productId && i.storeId === storeId);
    if (invIndex > -1) {
      mockInventoryRecords[invIndex].currentStock -= item.quantity;
      mockInventoryRecords[invIndex].lastUpdated = new Date().toISOString();
      mockOutboundLogs.push({ productId: item.productId, storeId, quantity: item.quantity, date: new Date().toISOString() });
    }
  }
  addChangeLog(`${items.length}品目、合計${items.reduce((acc, i) => acc + i.quantity, 0)}点の出庫を完了 (担当: ${operator?.name || operatorId}, 店舗: ${storeId})`, operatorId);
  return simulateApiCall({ success: true, errors: [] });
};

// Barcode Intake Processing
export const processIntakeBatch = async (items: { productId: string, quantity: number, costPrice: number }[], supplierId: string, operatorId: string, storeId: string): Promise<{ success: boolean; errors: string[] }> => {
  const errors: string[] = [];
  const supplier = mockSuppliers.find(s => s.id === supplierId);
  if (!supplier) { errors.push(`仕入先ID '${supplierId}' が見つかりません。`); return simulateApiCall({ success: false, errors }); }

  for (const item of items) {
    const invIndex = mockInventoryRecords.findIndex(inv => inv.productId === item.productId && inv.storeId === storeId);
    if (invIndex > -1) {
      mockInventoryRecords[invIndex].currentStock += item.quantity;
      mockInventoryRecords[invIndex].lastUpdated = new Date().toISOString();
      const prodIndex = mockProducts.findIndex(p => p.id === item.productId);
      if (prodIndex > -1) {
          mockProducts[prodIndex].costPrice = item.costPrice;
          mockProducts[prodIndex].lastUpdated = new Date().toISOString();
      }
      
      mockScheduledIntakeItems.push({
        id: `si_batch_${Date.now()}_${Math.random()}`, productId: item.productId,
        productName: mockProducts[prodIndex].name, quantity: item.quantity,
        costPriceAtIntake: item.costPrice, status: ScheduledIntakeStatus.RECEIVED,
        supplierId: supplierId, supplierName: supplier.name, storeId: storeId,
        receivedDate: new Date().toISOString(), lastUpdated: new Date().toISOString(),
        notes: `バーコード一括入荷 (担当: ${operatorId})`
      });
    } else { errors.push(`商品ID '${item.productId}' が店舗 '${storeId}' に見つかりません。`); }
  }
  
  if (errors.length > 0) return simulateApiCall({ success: false, errors }, 50);
  addChangeLog(`${items.length}品目の一括入荷処理を完了 (担当: ${operatorId}, 店舗: ${storeId})`, operatorId);
  return simulateApiCall({ success: true, errors: [] });
};

// Store Management
export const getStores = (): Promise<Store[]> => simulateApiCall(mockStores);

export const addStore = (store: Omit<Store, 'id'>): Promise<Store> => {
  const newStore: Store = { ...store, id: `store${Date.now()}` };
  mockStores.push(newStore);
  mockProducts.forEach(p => {
    mockInventoryRecords.push({
      productId: p.id, storeId: newStore.id, currentStock: 0, minimumStock: 0,
      lastUpdated: new Date().toISOString(),
    });
  });
  return simulateApiCall(newStore);
};

export const updateStore = (updatedStore: Store): Promise<Store> => {
  mockStores = mockStores.map(s => s.id === updatedStore.id ? updatedStore : s);
  return simulateApiCall(updatedStore);
};

export const deleteStore = (storeId: string): Promise<{ success: boolean }> => {
  const staffInStore = mockUsers.some(u => u.storeId === storeId);
  if (staffInStore) return Promise.reject(new Error("この店舗にはスタッフが所属しているため削除できません。"));
  const inventoryInStore = mockInventoryRecords.some(i => i.storeId === storeId && i.currentStock > 0);
  if (inventoryInStore) return Promise.reject(new Error("この店舗には在庫が存在するため削除できません。"));

  mockStores = mockStores.filter(s => s.id !== storeId);
  mockInventoryRecords = mockInventoryRecords.filter(i => i.storeId !== storeId);
  return simulateApiCall({ success: true });
};