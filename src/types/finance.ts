export type LanguageCode = 'vi' | 'en' | 'ja' | 'ko';
export type CurrencyCode = 'VND' | 'USD' | 'JPY' | 'KRW';
export type ThemeMode = 'light' | 'dark' | 'system';
export type UserRole = 'owner' | 'manager' | 'member' | 'viewer';
export type AuthProviderType = 'google.com' | 'apple.com' | 'local';
export type ReminderFrequency = 'daily' | 'weekly' | 'monthly' | 'off';
export type TransactionScope = 'personal' | 'business';
export type TransactionType = 'income' | 'expense';
export type PaymentMethod = 'cash' | 'bank_qr' | 'card' | 'ewallet';
export type DebtDirection = 'payable' | 'receivable';
export type DebtStatus = 'pending' | 'partial' | 'paid';

export type NavTab =
  | 'overview'
  | 'personal'
  | 'business'
  | 'family'
  | 'debts'
  | 'settings';

export const SCHEMA_LIMITS = {
  ID_REGEX: /^[a-zA-Z0-9_-]+$/,
  DATE_REGEX: /^\d{4}-\d{2}-\d{2}$/,
  MAX_ID: 128,
  MAX_DISPLAY_NAME: 100,
  MAX_CATEGORY: 60,
  MAX_NOTE: 300,
  MAX_SKU: 40,
  MAX_PRODUCT_NAME: 120,
  MAX_UNIT: 24,
  MAX_COUNTERPARTY: 120,
  MAX_RELATION: 60,
  MAX_AMOUNT: 1_000_000_000_000,
} as const;

export interface UserProfile {
  uid: string;
  displayName: string;
  role: UserRole;
  provider: AuthProviderType;
  language: LanguageCode;
  currency: CurrencyCode;
  theme: ThemeMode;
  biometricEnabled: boolean;
  reminderFrequency: ReminderFrequency;
  monthlyBudget: number;
}

export interface UserPrivateInfo {
  uid: string;
  email: string;
  bankBin: string;
  bankName: string;
  bankAccount: string;
  accountHolder: string;
}

export interface Transaction {
  id: string;
  workspaceId: string;
  createdBy: string;
  scope: TransactionScope;
  type: TransactionType;
  category: string;
  amount: number;
  cogs: number;
  note: string;
  date: string;
  paymentMethod: PaymentMethod;
  memberName: string;
  inventoryItemId: string;
  quantity: number;
}

export interface InventoryItem {
  id: string;
  workspaceId: string;
  createdBy: string;
  sku: string;
  name: string;
  category: string;
  costPrice: number;
  sellPrice: number;
  stock: number;
  minStock: number;
  unit: string;
}

export interface DebtRecord {
  id: string;
  workspaceId: string;
  createdBy: string;
  direction: DebtDirection;
  counterparty: string;
  amount: number;
  paidAmount: number;
  dueDate: string;
  status: DebtStatus;
  note: string;
}

export interface FamilyMember {
  id: string;
  workspaceId: string;
  createdBy: string;
  name: string;
  relation: string;
  monthlyIncome: number;
  monthlyBudget: number;
}

export interface WorkspaceMember {
  uid: string;
  displayName: string;
  role: UserRole;
}

export interface AppDataState {
  profile: UserProfile;
  privateInfo: UserPrivateInfo;
  transactions: Transaction[];
  inventory: InventoryItem[];
  debts: DebtRecord[];
  familyMembers: FamilyMember[];
  workspaceMembers: WorkspaceMember[];
  lastReminderSentAt: string | null;
}

export interface AppNotification {
  id: string;
  kind: 'overdue_debt' | 'low_stock' | 'budget_warning' | 'periodic_reminder';
  title: string;
  message: string;
  severity: 'danger' | 'warning' | 'info';
  date: string;
}
