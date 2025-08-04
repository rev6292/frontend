import * as api from './api';
import * as geminiApi from './gemini';

const apiClient = {
  async get(path: string, params?: any): Promise<any> {
    const poMatch = path.match(/^\/purchase-orders\/(.+)$/);
    if (poMatch) {
      return api.getPurchaseOrderById(poMatch[1]);
    }
    
    const productMatch = path.match(/^\/products\/(.+)$/);
    if (productMatch) {
      return api.getProductById(productMatch[1], params?.storeId);
    }

    switch (path) {
      case '/products':
        if (params?.barcode) return api.findProductByBarcode(params.barcode, params?.storeId);
        return api.getProducts(params?.storeId);
      case '/suppliers':
        return api.getSuppliers();
      case '/stores':
        return api.getStores();
      case '/categories':
        return api.getCategories();
      case '/intake-items':
        return api.getScheduledIntakeItems(params?.storeId);
      case '/dashboard/admin':
        return api.getAdminDashboardData(params.startDate, params.endDate, params.periodLabel, params.storeId);
      case '/dashboard/staff':
        return api.getStaffDashboardData(params?.storeId);
      case '/reports/monthly-purchase':
        return api.getMonthlyPurchaseReport(params.month, params?.storeId);
      case '/users/staff':
        return api.getStaffUsers();
      case '/company-info':
        return api.getCompanyInfo();
      case '/purchase-orders':
        return api.getPurchaseOrders(params?.storeId);
      default:
        throw new Error(`GET path not found: ${path}`);
    }
  },

  async post(path: string, data?: any): Promise<any> {
    const poReceiptMatch = path.match(/^\/purchase-orders\/(.+)\/receipt$/);
    if (poReceiptMatch) {
      const poId = poReceiptMatch[1];
      return api.processPurchaseOrderReceipt(poId, data.receivedItems, data.userId);
    }

    switch (path) {
      case '/products':
        return api.addProduct(data.product, { ...data.stock, storeId: data.storeId });
      case '/products/batch-upsert':
        return api.batchUpsertProducts(data.products, data.storeId);
      case '/suppliers':
        return api.addSupplier(data);
      case '/stores':
        return api.addStore(data);
      case '/categories':
        return api.addCategory(data);
      case '/intake/from-invoice':
        return api.addReceivedItemsFromInvoice(data.items, data.supplierId, data.userId, data.storeId);
      case '/intake/new-products':
         return api.addNewProductsFromAIData(data.items, data.supplierId, data.registrarId, data.storeId);
      case '/purchase-orders':
          return api.addPurchaseOrder(data);
      case '/users/staff':
        return api.addStaffUser(data);
      case '/outbound':
        return api.processOutboundBatch(data.items, data.operatorId, data.storeId);
      case '/intake/batch':
        return api.processIntakeBatch(data.items, data.supplierId, data.operatorId, data.storeId);
      case '/logs':
          return api.addChangeLog(data.action, data.userId);
      // Gemini calls
      case '/gemini/description':
        return geminiApi.generateProductDescription(data.productName, data.category);
      case '/gemini/invoice':
        return geminiApi.parseInvoiceImage(data.imageBase64);
      default:
        throw new Error(`POST path not found: ${path}`);
    }
  },

  async put(path: string, data: any): Promise<any> {
    const adminPasswordMatch = path.match(/^\/users\/admin\/(.+)\/password$/);
    if (adminPasswordMatch) {
        const adminId = adminPasswordMatch[1];
        return api.updateAdminPassword(adminId, data.currentPassword, data.newPassword);
    }

    const parts = path.substring(1).split('/');
    const resource = parts[0];
    const id = parts[1];
    
    if (resource === 'company-info') {
        return api.updateCompanyInfo(data);
    }
    
    if (!id) {
        throw new Error(`PUT path requires an ID: ${path}`);
    }

    switch (resource) {
      case 'products':
        return api.updateProductAndInventory(data.product, data.stock, data.storeId);
      case 'suppliers':
        return api.updateSupplier({ ...data, id });
      case 'stores':
        return api.updateStore({ ...data, id });
      case 'categories':
        return api.updateCategory({ ...data, id });
      case 'intake-items':
          return api.updateScheduledIntakeItem({ ...data, id });
      case 'users':
        if (parts.length > 2 && parts[1] === 'staff') {
           return api.updateStaffUser({ ...data, id: parts[2] });
        }
        break;
      default:
        throw new Error(`PUT path not found: ${path}`);
    }
  },
  
  async delete(path: string): Promise<any> {
    const parts = path.substring(1).split('/');
    const resource = parts[0];
    const id = parts[1];

    if (!id) throw new Error(`DELETE path requires an ID: ${path}`);

    switch (resource) {
        case 'products':
            return api.deleteProduct(id);
        case 'suppliers':
            return api.deleteSupplier(id);
        case 'stores':
            return api.deleteStore(id);
        case 'categories':
            return api.deleteCategory(id);
        case 'users':
            if (parts.length > 2 && parts[1] === 'staff') {
                return api.deleteStaffUser(parts[2]);
            }
            break;
        default:
            throw new Error(`DELETE path not found: ${path}`);
    }
  },
};

export default apiClient;