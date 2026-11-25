import type { CurrencyCode, LanguageCode } from '../types/finance';

export interface TranslationDict {
  appName: string;
  navOverview: string;
  navPersonal: string;
  navBusiness: string;
  navFamily: string;
  navDebts: string;
  navSettings: string;
  cloudSynced: string;
  offlineLocal: string;
  syncingNow: string;
  pendingWrites: string;
  signInGoogle: string;
  signInApple: string;
  signOut: string;
  continueOffline: string;
  installApp: string;
  installIOS: string;
  lockApp: string;
  unlockTitle: string;
  unlockSubtitle: string;
  unlockBiometric: string;
  unlockWithPin: string;
  wrongPin: string;
  totalBalance: string;
  personalExpenses: string;
  businessNetProfit: string;
  overdueDebtsCount: string;
  cashflowTrend: string;
  expenseBreakdown: string;
  incomeLabel: string;
  expenseLabel: string;
  profitLabel: string;
  quickActions: string;
  addTransaction: string;
  qrPayScan: string;
  exportPdf: string;
  exportExcel: string;
  recentTransactions: string;
  viewAll: string;
  searchPlaceholder: string;
  allFilter: string;
  allCategories: string;
  dateRangeAll: string;
  dateRangeWeek: string;
  dateRangeMonth: string;
  dateRangeToday: string;
  typeIncome: string;
  typeExpense: string;
  scopePersonal: string;
  scopeBusiness: string;
  category: string;
  amount: string;
  cogsLabel: string;
  note: string;
  date: string;
  paymentMethod: string;
  member: string;
  actions: string;
  save: string;
  cancel: string;
  delete: string;
  edit: string;
  emptyTransactions: string;
  logFirstEntry: string;
  grossRevenue: string;
  totalCogs: string;
  operatingExpenses: string;
  netProfit: string;
  profitMargin: string;
  inventoryTitle: string;
  addProduct: string;
  recordSale: string;
  restock: string;
  sku: string;
  productName: string;
  costPrice: string;
  sellPrice: string;
  stockQty: string;
  minStock: string;
  unit: string;
  lowStockLabel: string;
  inStockLabel: string;
  quantity: string;
  familyTitle: string;
  familySubtitle: string;
  addFamilyMember: string;
  relation: string;
  monthlyIncome: string;
  monthlyBudget: string;
  actualSpent: string;
  savingsRate: string;
  householdIncomeTotal: string;
  householdSpendTotal: string;
  householdSurplus: string;
  debtsTitle: string;
  debtsSubtitle: string;
  addDebt: string;
  payable: string;
  receivable: string;
  counterparty: string;
  totalAmount: string;
  paidAmount: string;
  remainingAmount: string;
  dueDate: string;
  statusPending: string;
  statusPartial: string;
  statusPaid: string;
  statusOverdue: string;
  recordPayment: string;
  reminderSettings: string;
  reminderFrequency: string;
  freqDaily: string;
  freqWeekly: string;
  freqMonthly: string;
  freqOff: string;
  triggerReminderNow: string;
  enableBrowserNotif: string;
  notifEnabled: string;
  qrModalTitle: string;
  qrGenerateTab: string;
  qrScanTab: string;
  bankLabel: string;
  accountNumber: string;
  accountHolder: string;
  qrDescription: string;
  downloadQr: string;
  startCamera: string;
  stopCamera: string;
  uploadQrImage: string;
  pasteQrText: string;
  applyQrToTransaction: string;
  qrDetected: string;
  cameraUnavailable: string;
  settingsTitle: string;
  appearanceTheme: string;
  themeLight: string;
  themeDark: string;
  themeSystem: string;
  languageLabel: string;
  currencyLabel: string;
  securityBiometric: string;
  setupBiometric: string;
  biometricReady: string;
  setPinLabel: string;
  roleLabel: string;
  roleOwner: string;
  roleManager: string;
  roleMember: string;
  roleViewer: string;
  teamAccess: string;
  addTeamMember: string;
  resetDemoData: string;
  personalBudgetLabel: string;
  budgetUsed: string;
  privacyHideAmounts: string;
  methodCash: string;
  methodBankQr: string;
  methodCard: string;
  methodEwallet: string;
  notificationsCenter: string;
  noNotifications: string;
  overdueAlertBanner: string;
  readOnlyRoleWarning: string;
  reportPeriod: string;
  syncBanksNow: string;
  syncingBanks: string;
  banksCountLabel: string;
  addCustomBank: string;
  bankShortNamePlaceholder: string;
  bankFullNamePlaceholder: string;
  banksSyncedSuccess: string;
  banksSyncError: string;
}

const vi: TranslationDict = {
  appName: 'Sổ Quỹ Thông Minh',
  navOverview: 'Tổng quan',
  navPersonal: 'Chi tiêu cá nhân',
  navBusiness: 'Kinh doanh & Kho',
  navFamily: 'Thu nhập gia đình',
  navDebts: 'Công nợ & Nhắc nhở',
  navSettings: 'Cài đặt & Bảo mật',
  cloudSynced: 'Đã đồng bộ Cloud',
  offlineLocal: 'Chế độ ngoại tuyến',
  syncingNow: 'Đang đồng bộ...',
  pendingWrites: 'Chờ đồng bộ',
  signInGoogle: 'Đăng nhập Google',
  signInApple: 'Đăng nhập Apple',
  signOut: 'Đăng xuất',
  continueOffline: 'Dùng ngoại tuyến',
  installApp: 'Cài đặt ứng dụng',
  installIOS: 'Cài đặt trên iPhone',
  lockApp: 'Khóa bảo mật',
  unlockTitle: 'Xác thực truy cập',
  unlockSubtitle: 'Sử dụng Face ID, vân tay hoặc mã PIN để mở khóa dữ liệu tài chính.',
  unlockBiometric: 'Mở khóa Face ID / Vân tay',
  unlockWithPin: 'Mở bằng mã PIN',
  wrongPin: 'Mã PIN không đúng',
  totalBalance: 'Số dư ròng hiện tại',
  personalExpenses: 'Chi tiêu cá nhân (tháng)',
  businessNetProfit: 'Lợi nhuận kinh doanh',
  overdueDebtsCount: 'Khoản nợ quá hạn',
  cashflowTrend: 'Biểu đồ thu chi & lợi nhuận',
  expenseBreakdown: 'Cơ cấu chi tiêu theo danh mục',
  incomeLabel: 'Thu nhập',
  expenseLabel: 'Chi tiêu',
  profitLabel: 'Lợi nhuận',
  quickActions: 'Thao tác nhanh',
  addTransaction: 'Ghi thu / chi',
  qrPayScan: 'QR Thanh toán',
  exportPdf: 'Xuất báo cáo PDF',
  exportExcel: 'Xuất file Excel',
  recentTransactions: 'Giao dịch gần đây',
  viewAll: 'Xem tất cả',
  searchPlaceholder: 'Tìm kiếm ghi chú, danh mục, thành viên...',
  allFilter: 'Tất cả',
  allCategories: 'Mọi danh mục',
  dateRangeAll: 'Toàn thời gian',
  dateRangeWeek: '7 ngày qua',
  dateRangeMonth: 'Tháng này',
  dateRangeToday: 'Hôm nay',
  typeIncome: 'Khoản thu',
  typeExpense: 'Khoản chi',
  scopePersonal: 'Cá nhân & Gia đình',
  scopeBusiness: 'Kinh doanh nhỏ',
  category: 'Danh mục',
  amount: 'Số tiền',
  cogsLabel: 'Giá vốn hàng bán',
  note: 'Ghi chú',
  date: 'Ngày',
  paymentMethod: 'Phương thức',
  member: 'Thành viên',
  actions: 'Thao tác',
  save: 'Lưu lại',
  cancel: 'Hủy bỏ',
  delete: 'Xóa',
  edit: 'Sửa',
  emptyTransactions: 'Chưa có giao dịch nào phù hợp với bộ lọc.',
  logFirstEntry: 'Ghi giao dịch đầu tiên',
  grossRevenue: 'Tổng doanh thu',
  totalCogs: 'Tổng giá vốn',
  operatingExpenses: 'Chi phí vận hành',
  netProfit: 'Lợi nhuận ròng',
  profitMargin: 'Biên lợi nhuận',
  inventoryTitle: 'Quản lý tồn kho sản phẩm',
  addProduct: 'Thêm sản phẩm',
  recordSale: 'Bán hàng',
  restock: 'Nhập kho',
  sku: 'Mã SKU',
  productName: 'Tên sản phẩm',
  costPrice: 'Giá nhập',
  sellPrice: 'Giá bán',
  stockQty: 'Tồn kho',
  minStock: 'Mức tối thiểu',
  unit: 'Đơn vị',
  lowStockLabel: 'Sắp hết hàng',
  inStockLabel: 'Đủ hàng',
  quantity: 'Số lượng',
  familyTitle: 'So sánh thu nhập & chi tiêu gia đình',
  familySubtitle: 'Theo dõi thu nhập từng thành viên, hạn mức chi tiêu và tỷ lệ tiết kiệm hộ gia đình.',
  addFamilyMember: 'Thêm thành viên',
  relation: 'Vai trò gia đình',
  monthlyIncome: 'Thu nhập / tháng',
  monthlyBudget: 'Hạn mức chi / tháng',
  actualSpent: 'Thực chi tháng này',
  savingsRate: 'Tỷ lệ tiết kiệm',
  householdIncomeTotal: 'Tổng thu nhập gia đình',
  householdSpendTotal: 'Tổng chi tiêu gia đình',
  householdSurplus: 'Tích lũy ròng gia đình',
  debtsTitle: 'Quản lý công nợ & Nhắc nhở tự động',
  debtsSubtitle: 'Theo dõi khoản phải thu, phải trả và tự động cảnh báo các khoản nợ quá hạn.',
  addDebt: 'Thêm khoản nợ',
  payable: 'Phải trả',
  receivable: 'Phải thu',
  counterparty: 'Đối tác / Người vay',
  totalAmount: 'Tổng giá trị',
  paidAmount: 'Đã thanh toán',
  remainingAmount: 'Còn lại',
  dueDate: 'Hạn thanh toán',
  statusPending: 'Chưa thanh toán',
  statusPartial: 'Trả một phần',
  statusPaid: 'Đã tất toán',
  statusOverdue: 'Quá hạn',
  recordPayment: 'Thanh toán',
  reminderSettings: 'Lịch nhắc nhở định kỳ',
  reminderFrequency: 'Tần suất nhắc nhở',
  freqDaily: 'Hàng ngày',
  freqWeekly: 'Hàng tuần',
  freqMonthly: 'Hàng tháng',
  freqOff: 'Tắt nhắc nhở',
  triggerReminderNow: 'Kiểm tra nhắc nhở ngay',
  enableBrowserNotif: 'Bật thông báo trình duyệt',
  notifEnabled: 'Đã bật thông báo',
  qrModalTitle: 'Xuất & Quét mã QR thanh toán',
  qrGenerateTab: 'Xuất mã QR nhận tiền',
  qrScanTab: 'Quét mã QR thanh toán',
  bankLabel: 'Ngân hàng',
  accountNumber: 'Số tài khoản',
  accountHolder: 'Chủ tài khoản',
  qrDescription: 'Nội dung chuyển khoản',
  downloadQr: 'Tải ảnh QR',
  startCamera: 'Bật camera quét QR',
  stopCamera: 'Tắt camera',
  uploadQrImage: 'Chọn ảnh QR từ máy',
  pasteQrText: 'Hoặc dán chuỗi QR / VietQR',
  applyQrToTransaction: 'Tạo giao dịch từ mã QR',
  qrDetected: 'Đã đọc thành công mã QR',
  cameraUnavailable: 'Không thể truy cập camera. Hãy dùng tính năng tải ảnh QR lên.',
  settingsTitle: 'Cài đặt hệ thống & Phân quyền',
  appearanceTheme: 'Giao diện Sáng / Tối (Tiết kiệm pin)',
  themeLight: 'Sáng',
  themeDark: 'Tối (AMOLED)',
  themeSystem: 'Theo thiết bị',
  languageLabel: 'Ngôn ngữ hiển thị',
  currencyLabel: 'Đơn vị tiền tệ',
  securityBiometric: 'Bảo mật Vân tay / Face ID & PIN',
  setupBiometric: 'Đăng ký Face ID / Vân tay',
  biometricReady: 'Đã kích hoạt sinh trắc học',
  setPinLabel: 'Đặt mã PIN dự phòng (4-6 số)',
  roleLabel: 'Quyền hạn hiện tại',
  roleOwner: 'Chủ sở hữu',
  roleManager: 'Quản lý',
  roleMember: 'Thành viên',
  roleViewer: 'Chỉ xem',
  teamAccess: 'Phân quyền người dùng trong nhóm',
  addTeamMember: 'Cấp quyền thành viên',
  resetDemoData: 'Khôi phục dữ liệu mẫu',
  personalBudgetLabel: 'Ngân sách chi tiêu tháng',
  budgetUsed: 'Đã dùng ngân sách',
  privacyHideAmounts: 'Ẩn số tiền nhạy cảm',
  methodCash: 'Tiền mặt',
  methodBankQr: 'Chuyển khoản QR',
  methodCard: 'Thẻ ngân hàng',
  methodEwallet: 'Ví điện tử',
  notificationsCenter: 'Thông báo & Nhắc nhở',
  noNotifications: 'Không có cảnh báo quá hạn hay tồn kho thấp.',
  overdueAlertBanner: 'Cảnh báo: Có khoản nợ đã quá hạn thanh toán cần xử lý.',
  readOnlyRoleWarning: 'Tài khoản đang ở quyền Chỉ xem nên không thể chỉnh sửa dữ liệu.',
  reportPeriod: 'Kỳ báo cáo',
  syncBanksNow: 'Cập nhật ngân hàng thực tế',
  syncingBanks: 'Đang cập nhật...',
  banksCountLabel: 'ngân hàng khả dụng',
  addCustomBank: 'Thêm ngân hàng thủ công',
  bankShortNamePlaceholder: 'Tên viết tắt (VD: Agribank)',
  bankFullNamePlaceholder: 'Tên đầy đủ ngân hàng',
  banksSyncedSuccess: 'Đã cập nhật danh sách ngân hàng mới nhất.',
  banksSyncError: 'Không thể kết nối máy chủ ngân hàng. Đang dùng danh sách ngoại tuyến.',
};

const en: TranslationDict = {
  appName: 'Smart Ledger',
  navOverview: 'Overview',
  navPersonal: 'Personal Expenses',
  navBusiness: 'Business & Stock',
  navFamily: 'Family Income',
  navDebts: 'Debts & Alerts',
  navSettings: 'Settings & Security',
  cloudSynced: 'Cloud Synced',
  offlineLocal: 'Offline Mode',
  syncingNow: 'Syncing...',
  pendingWrites: 'Pending Sync',
  signInGoogle: 'Sign in with Google',
  signInApple: 'Sign in with Apple',
  signOut: 'Sign Out',
  continueOffline: 'Use Offline',
  installApp: 'Install App',
  installIOS: 'Install on iPhone',
  lockApp: 'Lock Vault',
  unlockTitle: 'Security Verification',
  unlockSubtitle: 'Use Face ID, fingerprint, or your PIN code to unlock financial records.',
  unlockBiometric: 'Unlock with Face ID / Fingerprint',
  unlockWithPin: 'Unlock with PIN',
  wrongPin: 'Incorrect PIN code',
  totalBalance: 'Net Balance',
  personalExpenses: 'Personal Spend (Month)',
  businessNetProfit: 'Business Net Profit',
  overdueDebtsCount: 'Overdue Debts',
  cashflowTrend: 'Cashflow & Profit Trend',
  expenseBreakdown: 'Expense Breakdown by Category',
  incomeLabel: 'Income',
  expenseLabel: 'Expense',
  profitLabel: 'Profit',
  quickActions: 'Quick Actions',
  addTransaction: 'Add Entry',
  qrPayScan: 'QR Payment',
  exportPdf: 'Export PDF Report',
  exportExcel: 'Export Excel (.xlsx)',
  recentTransactions: 'Recent Transactions',
  viewAll: 'View All',
  searchPlaceholder: 'Search notes, categories, members...',
  allFilter: 'All',
  allCategories: 'All Categories',
  dateRangeAll: 'All Time',
  dateRangeWeek: 'Last 7 Days',
  dateRangeMonth: 'This Month',
  dateRangeToday: 'Today',
  typeIncome: 'Income',
  typeExpense: 'Expense',
  scopePersonal: 'Personal & Family',
  scopeBusiness: 'Small Business',
  category: 'Category',
  amount: 'Amount',
  cogsLabel: 'Cost of Goods (COGS)',
  note: 'Note',
  date: 'Date',
  paymentMethod: 'Method',
  member: 'Member',
  actions: 'Actions',
  save: 'Save',
  cancel: 'Cancel',
  delete: 'Delete',
  edit: 'Edit',
  emptyTransactions: 'No transactions match your current filter.',
  logFirstEntry: 'Log First Entry',
  grossRevenue: 'Gross Revenue',
  totalCogs: 'Total COGS',
  operatingExpenses: 'Operating Expenses',
  netProfit: 'Net Profit',
  profitMargin: 'Profit Margin',
  inventoryTitle: 'Product Inventory',
  addProduct: 'Add Product',
  recordSale: 'Record Sale',
  restock: 'Restock',
  sku: 'SKU',
  productName: 'Product Name',
  costPrice: 'Cost Price',
  sellPrice: 'Sell Price',
  stockQty: 'In Stock',
  minStock: 'Min Stock',
  unit: 'Unit',
  lowStockLabel: 'Low Stock',
  inStockLabel: 'Healthy',
  quantity: 'Quantity',
  familyTitle: 'Family Income vs. Spending Comparison',
  familySubtitle: 'Compare household member earnings, monthly budgets, and net savings rate.',
  addFamilyMember: 'Add Member',
  relation: 'Household Role',
  monthlyIncome: 'Monthly Income',
  monthlyBudget: 'Monthly Budget',
  actualSpent: 'Actual Spent',
  savingsRate: 'Savings Rate',
  householdIncomeTotal: 'Total Family Income',
  householdSpendTotal: 'Total Family Spend',
  householdSurplus: 'Household Net Savings',
  debtsTitle: 'Debts & Automated Overdue Reminders',
  debtsSubtitle: 'Track payables, receivables, and automatic alerts for overdue obligations.',
  addDebt: 'Add Debt Record',
  payable: 'Payable',
  receivable: 'Receivable',
  counterparty: 'Counterparty',
  totalAmount: 'Total Amount',
  paidAmount: 'Paid',
  remainingAmount: 'Remaining',
  dueDate: 'Due Date',
  statusPending: 'Pending',
  statusPartial: 'Partial',
  statusPaid: 'Paid',
  statusOverdue: 'Overdue',
  recordPayment: 'Pay',
  reminderSettings: 'Periodic Reminder Schedule',
  reminderFrequency: 'Frequency',
  freqDaily: 'Daily',
  freqWeekly: 'Weekly',
  freqMonthly: 'Monthly',
  freqOff: 'Disabled',
  triggerReminderNow: 'Run Reminder Check',
  enableBrowserNotif: 'Enable Browser Alerts',
  notifEnabled: 'Alerts Enabled',
  qrModalTitle: 'Payment QR Generator & Scanner',
  qrGenerateTab: 'Generate Payment QR',
  qrScanTab: 'Scan Payment QR',
  bankLabel: 'Bank',
  accountNumber: 'Account Number',
  accountHolder: 'Account Holder',
  qrDescription: 'Payment Note',
  downloadQr: 'Download QR PNG',
  startCamera: 'Start Camera Scan',
  stopCamera: 'Stop Camera',
  uploadQrImage: 'Upload QR Image',
  pasteQrText: 'Or paste QR / VietQR payload',
  applyQrToTransaction: 'Create Transaction from QR',
  qrDetected: 'QR Code Detected',
  cameraUnavailable: 'Camera unavailable. Please upload a QR image instead.',
  settingsTitle: 'System Settings & Access Control',
  appearanceTheme: 'Light / Dark Theme (Battery Saver)',
  themeLight: 'Light',
  themeDark: 'Dark (AMOLED)',
  themeSystem: 'System',
  languageLabel: 'Display Language',
  currencyLabel: 'Currency',
  securityBiometric: 'Fingerprint / Face ID & PIN Security',
  setupBiometric: 'Register Face ID / Fingerprint',
  biometricReady: 'Biometric Lock Active',
  setPinLabel: 'Backup PIN Code (4-6 digits)',
  roleLabel: 'Current Access Role',
  roleOwner: 'Owner',
  roleManager: 'Manager',
  roleMember: 'Member',
  roleViewer: 'Viewer',
  teamAccess: 'Workspace Role Permissions',
  addTeamMember: 'Add Member Role',
  resetDemoData: 'Reset Sample Data',
  personalBudgetLabel: 'Monthly Spending Budget',
  budgetUsed: 'Budget Used',
  privacyHideAmounts: 'Mask Sensitive Figures',
  methodCash: 'Cash',
  methodBankQr: 'Bank QR',
  methodCard: 'Card',
  methodEwallet: 'E-Wallet',
  notificationsCenter: 'Alerts & Reminders',
  noNotifications: 'No overdue debts or low stock warnings.',
  overdueAlertBanner: 'Alert: You have overdue debt obligations requiring attention.',
  readOnlyRoleWarning: 'Your role is set to Viewer (read-only). Editing is disabled.',
  reportPeriod: 'Report Period',
  syncBanksNow: 'Sync Live Bank List',
  syncingBanks: 'Syncing...',
  banksCountLabel: 'banks available',
  addCustomBank: 'Add Custom Bank',
  bankShortNamePlaceholder: 'Short name (e.g. Agribank)',
  bankFullNamePlaceholder: 'Full bank name',
  banksSyncedSuccess: 'Updated live bank directory.',
  banksSyncError: 'Could not reach bank directory. Using offline cached list.',
};

const ja: TranslationDict = {
  ...en,
  appName: 'スマート家計・事業帳',
  navOverview: '概要',
  navPersonal: '個人支出',
  navBusiness: '事業・在庫',
  navFamily: '世帯収入比較',
  navDebts: '債権・通知',
  navSettings: '設定・セキュリティ',
  cloudSynced: 'クラウド同期済み',
  offlineLocal: 'オフラインモード',
  signInGoogle: 'Googleでログイン',
  signInApple: 'Appleでログイン',
  signOut: 'ログアウト',
  installApp: 'アプリをインストール',
  lockApp: 'ロックする',
  unlockTitle: '生体認証ロック',
  unlockSubtitle: 'Face ID、指紋、またはPINで解除してください。',
  unlockBiometric: 'Face ID / 指紋で解除',
  totalBalance: '純残高',
  personalExpenses: '今月の個人支出',
  businessNetProfit: '事業純利益',
  overdueDebtsCount: '期限超過の債務',
  exportPdf: 'PDF出力',
  exportExcel: 'Excel出力',
  addTransaction: '収支を追加',
  qrPayScan: 'QR決済',
  themeLight: 'ライト',
  themeDark: 'ダーク',
  themeSystem: 'システム',
  languageLabel: '言語',
  currencyLabel: '通貨',
  save: '保存',
  cancel: 'キャンセル',
  delete: '削除',
};

const ko: TranslationDict = {
  ...en,
  appName: '스마트 가계·사업부',
  navOverview: '대시보드',
  navPersonal: '개인 지출',
  navBusiness: '사업 및 재고',
  navFamily: '가족 소득 비교',
  navDebts: '미수금·알림',
  navSettings: '설정 및 보안',
  cloudSynced: '클라우드 동기화됨',
  offlineLocal: '오프라인 모드',
  signInGoogle: 'Google 로그인',
  signInApple: 'Apple 로그인',
  signOut: '로그아웃',
  installApp: '앱 설치',
  lockApp: '잠금',
  unlockTitle: '보안 인증',
  unlockSubtitle: 'Face ID, 지문 또는 PIN으로 잠금을 해제하세요.',
  unlockBiometric: 'Face ID / 지문으로 해제',
  totalBalance: '순 잔액',
  personalExpenses: '이번 달 개인 지출',
  businessNetProfit: '사업 순이익',
  overdueDebtsCount: '연체된 채무',
  exportPdf: 'PDF 내보내기',
  exportExcel: 'Excel 내보내기',
  addTransaction: '내역 추가',
  qrPayScan: 'QR 결제',
  themeLight: '라이트',
  themeDark: '다크',
  themeSystem: '시스템',
  languageLabel: '언어',
  currencyLabel: '통화',
  save: '저장',
  cancel: '취소',
  delete: '삭제',
};

export const TRANSLATIONS: Record<LanguageCode, TranslationDict> = {
  vi,
  en,
  ja,
  ko,
};

export function formatCurrency(
  amount: number,
  currency: CurrencyCode,
  hideAmounts = false
): string {
  if (hideAmounts) return '••••••••';
  const localeMap: Record<CurrencyCode, string> = {
    VND: 'vi-VN',
    USD: 'en-US',
    JPY: 'ja-JP',
    KRW: 'ko-KR',
  };
  return new Intl.NumberFormat(localeMap[currency], {
    style: 'currency',
    currency,
    maximumFractionDigits: currency === 'USD' ? 2 : 0,
  }).format(amount);
}
