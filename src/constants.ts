import { HomeIcon, ArchiveBoxIcon, TruckIcon, UsersIcon, ChartBarIcon, ClipboardDocumentListIcon, Cog6ToothIcon, FolderIcon, UserGroupIcon, ArrowDownOnSquareStackIcon, BuildingStorefrontIcon, UserCircleIcon, QrCodeIcon, ArrowUpOnSquareIcon, DocumentPlusIcon, ShoppingBagIcon, ArchiveBoxXMarkIcon, BuildingOffice2Icon } from '@heroicons/react/24/outline';
import { NavigationItem, UserRole } from './types';

export const APP_TITLE = "Salon Stock Intelligence";

export const ROUTE_PATHS = {
  DASHBOARD: '/dashboard',
  INVENTORY: '/inventory',
  INTAKE: '/intake',
  OUTBOUND: '/outbound', 
  PURCHASE_ORDER: '/purchase-order', // This path is now part of /intake, but might be kept for context
  REPORTS: '/reports',
  STAFF: '/staff', 
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_STORES: '/admin/stores',
  ADMIN_CATEGORIES: '/admin/categories',
  ADMIN_STAFF: '/admin/staff',
  ADMIN_SUPPLIERS: '/admin/suppliers', // This path is now part of /intake for admins
  ADMIN_COMPANY_INFO: '/admin/company',
  ADMIN_CSV_IMPORT_EXPORT: '/admin/csv',
  ADMIN_PROFILE: '/admin/profile', 
  ADMIN_NEW_PRODUCT_REGISTRATION: '/admin/new-product-registration', 
};

export const NAVIGATION_ITEMS: NavigationItem[] = [
  { name: 'ダッシュボード', path: ROUTE_PATHS.DASHBOARD, icon: HomeIcon },
  { name: '在庫管理', path: ROUTE_PATHS.INVENTORY, icon: ArchiveBoxIcon },
  { name: '入荷処理', path: ROUTE_PATHS.INTAKE, icon: TruckIcon }, 
  { name: '出庫処理', path: ROUTE_PATHS.OUTBOUND, icon: ArrowUpOnSquareIcon }, 
  // { name: '仕入れリスト', path: ROUTE_PATHS.PURCHASE_ORDER, icon: ShoppingBagIcon }, // Integrated into IntakePage
  // { name: '仕入先管理', path: ROUTE_PATHS.ADMIN_SUPPLIERS, icon: BuildingStorefrontIcon, roles: [UserRole.ADMIN] }, // Integrated into IntakePage for Admins
  { name: '月次レポート', path: ROUTE_PATHS.REPORTS, icon: ChartBarIcon },
  { name: '管理者設定', path: ROUTE_PATHS.ADMIN_DASHBOARD, icon: Cog6ToothIcon, roles: [UserRole.ADMIN] }, 
];

export const ADMIN_NAVIGATION_ITEMS: NavigationItem[] = [
  { name: '管理ダッシュボード', path: ROUTE_PATHS.ADMIN_DASHBOARD, icon: HomeIcon },
  { name: '店舗管理', path: ROUTE_PATHS.ADMIN_STORES, icon: BuildingStorefrontIcon },
  { name: 'カテゴリ管理', path: ROUTE_PATHS.ADMIN_CATEGORIES, icon: FolderIcon },
  { name: 'スタッフ管理', path: ROUTE_PATHS.ADMIN_STAFF, icon: UserGroupIcon },
  // { name: '仕入先管理', path: ROUTE_PATHS.ADMIN_SUPPLIERS, icon: BuildingStorefrontIcon }, // Integrated into IntakePage
  { name: '新規商品登録', path: ROUTE_PATHS.ADMIN_NEW_PRODUCT_REGISTRATION, icon: DocumentPlusIcon },
  { name: '会社情報管理', path: ROUTE_PATHS.ADMIN_COMPANY_INFO, icon: BuildingOffice2Icon },
  { name: 'CSVインポート/エクスポート', path: ROUTE_PATHS.ADMIN_CSV_IMPORT_EXPORT, icon: ArrowDownOnSquareStackIcon },
  { name: '管理者情報変更', path: ROUTE_PATHS.ADMIN_PROFILE, icon: UserCircleIcon },
];


export const UI_TEXT = {
  SAVE: '保存',
  CANCEL: 'キャンセル',
  ADD_NEW: '新規追加',
  EDIT: '編集',
  DELETE: '削除',
  APPROVE: '承認',
  REJECT: '却下',
  MARK_RECEIVED: '入荷済みにする',
  MANUAL_CHECK: '手動確認へ',
  PRODUCT_NAME: '商品名',
  BARCODE: 'バーコード',
  CURRENT_STOCK: '現在庫数',
  MINIMUM_STOCK: '最低在庫数',
  CATEGORY: 'カテゴリ',
  COST_PRICE: '仕入単価',
  SUPPLIER: '仕入先',
  ACTIONS: '操作',
  NO_DATA_AVAILABLE: 'データがありません',
  LOADING: '読み込み中...',
  ERROR_LOADING_DATA: 'データの読み込みに失敗しました。',
  ERROR_SEARCHING_PRODUCTS: '商品の検索に失敗しました。',
  ERROR_PROCESSING_INTAKE: '入荷処理に失敗しました。',
  SUCCESS_PREFIX: '成功: ',
  ERROR_PREFIX: 'エラー: ',
  CONFIRM_DELETE_TITLE: '削除の確認',
  CONFIRM_DELETE_MESSAGE: (itemName: string) => `${itemName}を本当に削除しますか？この操作は元に戻せません。`,
  
  // Dashboard specific
  TOTAL_INVENTORY_VALUE: '総在庫評価額',
  CURRENT_MONTH_TOTAL_COST: '当月仕入総額',
  LOW_STOCK_ITEMS_COUNT: '在庫僅少品目数',
  OBSOLETE_STOCK_ITEMS_COUNT: '不良在庫品目数',
  PENDING_INTAKE_APPROVALS: '要承認入荷数',
  LOW_STOCK_ALERT: '在庫僅少アラート',
  LOADING_DASHBOARD_DATA: 'ダッシュボードデータを読み込み中...',
  PREVIOUS_YEAR_MONTH_TOTAL: '前年同期間合計', 
  DIFFERENCE: '差異',
  PERCENTAGE_CHANGE: '増減率',
  DOWNLOAD_CSV: 'CSVダウンロード',
  
  // Category
  CATEGORY_NAME: 'カテゴリ名',
  PARENT_CATEGORY: '親カテゴリ',
  NO_PARENT_CATEGORY: '（ルートカテゴリ）',

  // Staff
  STAFF_NAME: 'スタッフ名',
  ROLE: '権限',
  PASSWORD: 'パスワード',
  CONFIRM_PASSWORD: 'パスワード (確認用)',
  CURRENT_PASSWORD: '現在のパスワード',
  NEW_PASSWORD: '新しいパスワード',
  PASSWORD_CHANGE_SUCCESS: 'パスワードが正常に変更されました。',
  PASSWORD_MISMATCH: '新しいパスワードが一致しません。',
  INCORRECT_CURRENT_PASSWORD: '現在のパスワードが正しくありません。',
  STAFF_MANAGEMENT: 'スタッフ管理',
  ADMIN_PROFILE_EDIT: '管理者情報変更',

  // Outbound Page
  OUTBOUND_PROCESSING: '出庫処理',
  SELECT_OPERATOR: '出庫担当者を選択してください',
  OPERATOR: '担当者',
  SCAN_BARCODE_FOR_OUTBOUND: '出庫する商品のバーコードをスキャン',
  LAST_SCANNED_ITEM: '最終スキャン商品',
  QUANTITY: '数量',
  OUTBOUND_LIST: '出庫リスト (現在のセッション)',
  PRODUCT_NOT_FOUND_FOR_BARCODE: (barcode: string) => `バーコード '${barcode}' に一致する商品が見つかりません。`,
  SCAN_ERROR_MESSAGE: 'スキャン処理中にエラーが発生しました',
  ITEM_LOGGED_SUCCESS: (name: string) => `${name} を記録しました。次の商品をスキャンしてください。`,
  ITEM_DETECTED_LOGGING: (name: string) => `${name} (数量: 1) を検出しました。記録しています...`,
  COMPLETE_OUTBOUND: '出庫を完了する (仮)',
  BARCODE_PROMPT: 'バーコードを入力しEnterキーを押してください',

  // Intake Page (New)
  INTAKE_PROCESSING: '入荷処理',
  SELECT_SUPPLIER_FOR_INTAKE: '入荷処理を行う仕入先を選択してください',
  INVOICE_IMAGE_UPLOAD: '納品書画像アップロード (AI解析用)',
  UPLOAD_INVOICE_IMAGE: '納品書画像ファイル',
  PARSE_IMAGE_WITH_AI: '画像を解析して登録候補を作成 (AI)',
  AI_PARSED_ITEMS: 'AIによる解析結果',
  EDIT_AND_CONFIRM_ITEMS: '内容を確認・編集し、入荷を記録してください',
  REGISTER_PROCESSED_ITEMS: '確認済みのアイテムを入荷記録する',
  NEW_PRODUCT_DETAILS: '新規商品詳細',
  LINK_EXISTING_PRODUCT: '既存商品と紐付け',
  MARK_AS_NEW_PRODUCT: '新規商品として登録',
  PENDING_INTAKE_FOR_SUPPLIER: (supplierName: string) => `${supplierName}からの入荷待ちリスト (本日以前の予定)`,
  OTHER_PENDING_INTAKES: 'その他の入荷予定',
  NO_ITEMS_TO_REGISTER: '登録準備が完了している商品がありません。',

  // New Product Registration Page
  NEW_PRODUCT_REGISTRATION_TITLE: '新規商品一括登録',
  SELECT_REGISTRAR: '登録担当者を選択してください',
  REGISTRAR: '登録担当者',
  CREATE_CANDIDATES_FROM_IMAGE_AI: '画像を解析して新規登録候補を作成 (AI)',
  CONFIRM_AND_REGISTER_NEW_PRODUCTS: '内容を確認し、新規商品を一括登録',
  REGISTER_CONFIRMED_NEW_PRODUCTS: '確認済みの新商品を一括登録する',
  ALL_ITEMS_MUST_BE_NEW_PRODUCTS: 'このページでは、すべてのアイテムが新規商品として扱われます。',
  COST_PRICE_FOR_NEW_PRODUCT: '原価 (仕入単価)',
  INITIAL_STOCK_QUANTITY: '初回入荷数量',

  // Inventory Page Enhancements
  ADD_TO_PURCHASE_LIST: '仕入れリストに追加',
  PURCHASE_LIST_SUMMARY: (count: number) => `仕入れリスト (${count}件)`,
  VIEW_PURCHASE_LIST: 'リストを確認・発注する',
  FILTER_BY_CATEGORY: 'カテゴリで絞り込み',
  FILTER_BY_SUPPLIER: '仕入先で絞り込み',
  PARENT_CATEGORY_FILTER: '親カテゴリ',
  CHILD_CATEGORY_FILTER: '子カテゴリ',
  ALL_CATEGORIES: 'すべてのカテゴリ',
  ALL_SUPPLIERS: 'すべての仕入先',
  DEAD_STOCK_ALERT: '動きのない不良在庫',
  DEAD_STOCK_PERIOD: '非稼働期間を選択',
  PERIOD_OPTION: (value: string, unit: string) => `過去${value}${unit}動きなし`,
  ITEM_ADDED_TO_PURCHASE_LIST: (name: string) => `${name} を仕入れリストに追加しました。`,
  SUPPLIER_CONTACT: '仕入先担当者',
  
  // Store Management
  STORE_MANAGEMENT: '店舗管理',
  STORE_NAME: '店舗名',
  STORE_ADDRESS: '住所',
  STORE_PHONE: '電話番号',
  ASSIGNED_STORE: '所属店舗',
  NO_STORE_ASSIGNED: '未所属',
  ALL_STORES: '全店舗',
};

export const BARCODE_SCANNER_PLACEHOLDER = "カメラでバーコードをスキャン または JANコード入力";
