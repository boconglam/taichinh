import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import {
  AlertCircle,
  BarChart3,
  Bell,
  Cloud,
  CloudOff,
  Download,
  Eye,
  EyeOff,
  LayoutDashboard,
  Lock,
  Menu,
  Moon,
  Package,
  QrCode,
  Receipt,
  Settings,
  Sun,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { BiometricLockScreen } from './components/BiometricLockScreen';
import { BusinessInventoryView } from './components/BusinessInventoryView';
import { DebtsRemindersView } from './components/DebtsRemindersView';
import { ErrorBoundary } from './components/ErrorBoundary';
import { FamilyCompareView } from './components/FamilyCompareView';
import { OverviewView } from './components/OverviewView';
import { QRModal } from './components/QRModal';
import { SettingsView } from './components/SettingsView';
import { TransactionModal } from './components/TransactionModal';
import { TransactionsView } from './components/TransactionsView';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { usePWAInstall } from './hooks/usePWAInstall';
import { TRANSLATIONS } from './i18n/translations';
import { auth, appleProvider, googleProvider, testConnection } from './lib/firebase';
import {
  loadCachedBanks,
  saveCachedBanks,
  syncLiveBanksFromVietQR,
  type BankOption,
  type ParsedQrPayment,
} from './lib/qrUtils';
import {
  cloudDeleteDoc,
  cloudUpdatePrivateInfo,
  cloudUpdateProfile,
  cloudUpsertDebt,
  cloudUpsertFamilyMember,
  cloudUpsertInventory,
  cloudUpsertTransaction,
  createDefaultState,
  ensureCloudWorkspace,
  loadOfflineState,
  saveOfflineState,
  subscribeWorkspaceData,
} from './lib/storage';
import type {
  AppDataState,
  AppNotification,
  DebtRecord,
  FamilyMember,
  InventoryItem,
  NavTab,
  ReminderFrequency,
  Transaction,
  UserPrivateInfo,
  UserProfile,
} from './types/finance';

function MainApp() {
  const [data, setData] = useState<AppDataState>(() => loadOfflineState());
  const [activeTab, setActiveTab] = useState<NavTab>('overview');
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [authNotice, setAuthNotice] = useState('');

  const [isLocked, setIsLocked] = useState<boolean>(() => loadOfflineState().profile.biometricEnabled);
  const [hideAmounts, setHideAmounts] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const [txModalOpen, setTxModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [txPrefill, setTxPrefill] = useState<{
    amount?: number | null;
    note?: string;
    scope?: 'personal' | 'business';
  } | null>(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);

  const [banks, setBanks] = useState<BankOption[]>(() => loadCachedBanks());
  const [syncingBanks, setSyncingBanks] = useState(false);
  const [bankSyncMessage, setBankSyncMessage] = useState('');

  const isOnline = useOnlineStatus();
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const t = TRANSLATIONS[data.profile.language] || TRANSLATIONS.vi;
  const canEdit = data.profile.role !== 'viewer';

  // Persist offline mirror whenever state updates
  useEffect(() => {
    saveOfflineState(data);
  }, [data]);

  // Apply Light / Dark / System theme to <html>
  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const dark =
        data.profile.theme === 'dark' ||
        (data.profile.theme === 'system' && media.matches);
      root.classList.toggle('dark', dark);
    };
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [data.profile.theme]);

  // Startup Firestore connection check & Auth state + live bank list sync
  useEffect(() => {
    testConnection();
    if (navigator.onLine) {
      syncLiveBanksFromVietQR(loadCachedBanks()).then((res) => {
        if (res.ok) setBanks(res.banks);
      });
    }
    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  const handleSyncBanks = useCallback(async () => {
    setSyncingBanks(true);
    setBankSyncMessage('');
    const res = await syncLiveBanksFromVietQR(banks);
    setSyncingBanks(false);
    if (res.ok) {
      setBanks(res.banks);
      setBankSyncMessage(`${t.banksSyncedSuccess} (${res.count})`);
    } else {
      setBankSyncMessage(t.banksSyncError);
    }
  }, [banks, t.banksSyncedSuccess, t.banksSyncError]);

  const handleAddCustomBank = (bank: BankOption) => {
    setBanks((prev) => {
      const next = [...prev.filter((b) => b.bin !== bank.bin), bank].sort((a, b) =>
        a.shortName.localeCompare(b.shortName)
      );
      saveCachedBanks(next);
      return next;
    });
  };

  const handleRemoveCustomBank = (bin: string) => {
    setBanks((prev) => {
      const next = prev.filter((b) => b.bin !== bin);
      saveCachedBanks(next);
      return next;
    });
  };

  // Real-time Firestore cloud subscription when signed in
  useEffect(() => {
    if (!authReady || !firebaseUser) return;
    let active = true;
    let unsubCloud: (() => void) | undefined;

    const initCloud = async () => {
      setIsSyncing(true);
      const providerId =
        firebaseUser.providerData[0]?.providerId === 'apple.com' ? 'apple.com' : 'google.com';
      await ensureCloudWorkspace(
        firebaseUser.uid,
        firebaseUser.displayName || 'Owner',
        firebaseUser.email || '',
        providerId,
        data
      );
      if (!active) return;

      unsubCloud = subscribeWorkspaceData(firebaseUser.uid, {
        onProfile: (p) =>
          setData((prev) => ({
            ...prev,
            profile: { ...prev.profile, ...p },
          })),
        onPrivateInfo: (info) =>
          setData((prev) => ({
            ...prev,
            privateInfo: { ...prev.privateInfo, ...info },
          })),
        onTransactions: (items) =>
          setData((prev) => ({ ...prev, transactions: items })),
        onInventory: (items) =>
          setData((prev) => ({ ...prev, inventory: items })),
        onDebts: (items) =>
          setData((prev) => ({ ...prev, debts: items })),
        onFamilyMembers: (items) =>
          setData((prev) => ({ ...prev, familyMembers: items })),
        onMembers: (items) =>
          setData((prev) => ({ ...prev, workspaceMembers: items })),
      });
      setIsSyncing(false);
    };

    initCloud();
    return () => {
      active = false;
      if (unsubCloud) unsubCloud();
    };
  }, [authReady, firebaseUser]);

  // Compute smart notifications (overdue debts, low stock, budget warning, periodic reminder)
  const notifications = useMemo<AppNotification[]>(() => {
    const today = new Date().toISOString().slice(0, 10);
    const list: AppNotification[] = [];

    data.debts
      .filter((d) => d.status !== 'paid' && d.dueDate < today)
      .forEach((d) => {
        list.push({
          id: `overdue-${d.id}`,
          kind: 'overdue_debt',
          title: `${t.statusOverdue}: ${d.counterparty}`,
          message: `${d.dueDate} · ${(d.amount - d.paidAmount).toLocaleString()} ${data.profile.currency}`,
          severity: 'danger',
          date: d.dueDate,
        });
      });

    data.inventory
      .filter((i) => i.stock <= i.minStock)
      .forEach((i) => {
        list.push({
          id: `stock-${i.id}`,
          kind: 'low_stock',
          title: `${t.lowStockLabel}: ${i.name}`,
          message: `${i.stock} / ${i.minStock} ${i.unit}`,
          severity: 'warning',
          date: today,
        });
      });

    const monthPrefix = today.slice(0, 7);
    const monthSpend = data.transactions
      .filter((tx) => tx.scope === 'personal' && tx.type === 'expense' && tx.date.startsWith(monthPrefix))
      .reduce((s, tx) => s + tx.amount, 0);
    if (data.profile.monthlyBudget > 0 && monthSpend > data.profile.monthlyBudget * 0.85) {
      list.push({
        id: 'budget-warn',
        kind: 'budget_warning',
        title: t.personalBudgetLabel,
        message: `${Math.round((monthSpend / data.profile.monthlyBudget) * 100)}% ${t.budgetUsed}`,
        severity: 'warning',
        date: today,
      });
    }

    return list;
  }, [data.debts, data.inventory, data.transactions, data.profile, t]);

  const triggerReminderCheck = useCallback(() => {
    const today = new Date().toISOString().slice(0, 10);
    const overdueCount = data.debts.filter((d) => d.status !== 'paid' && d.dueDate < today).length;
    const totalFamilyInc = data.familyMembers.reduce((s, m) => s + m.monthlyIncome, 0);
    const body =
      overdueCount > 0
        ? `${t.overdueAlertBanner} (${overdueCount})`
        : `${t.householdIncomeTotal}: ${totalFamilyInc.toLocaleString()} ${data.profile.currency}`;

    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification(t.appName, { body });
    }
    setAuthNotice(body);
    setTimeout(() => setAuthNotice(''), 5000);
  }, [data.debts, data.familyMembers, data.profile.currency, t]);

  // Periodic reminder scheduler (daily / weekly / monthly)
  useEffect(() => {
    if (data.profile.reminderFrequency === 'off') return;
    const now = Date.now();
    const last = data.lastReminderSentAt ? new Date(data.lastReminderSentAt).getTime() : 0;
    const intervalMs =
      data.profile.reminderFrequency === 'daily'
        ? 86_400_000
        : data.profile.reminderFrequency === 'weekly'
        ? 604_800_000
        : 2_592_000_000;

    if (now - last >= intervalMs && notifications.length > 0) {
      setData((prev) => ({ ...prev, lastReminderSentAt: new Date().toISOString() }));
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        new Notification(t.appName, { body: notifications[0].title });
      }
    }
  }, [data.profile.reminderFrequency, data.lastReminderSentAt, notifications, t.appName]);

  // Auth handlers
  const handleSignInGoogle = async () => {
    setAuthNotice('');
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setAuthNotice(err instanceof Error ? err.message : 'Google Sign-In failed');
    }
  };

  const handleSignInApple = async () => {
    setAuthNotice('');
    try {
      await signInWithPopup(auth, appleProvider);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setAuthNotice(
        msg.includes('operation-not-allowed') || msg.includes('configuration-not-found')
          ? 'Để bật đăng nhập Apple, hãy kích hoạt Apple Provider trong Firebase Console -> Authentication -> Sign-in method.'
          : msg
      );
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setData((prev) => ({
      ...prev,
      profile: { ...prev.profile, provider: 'local' },
    }));
  };

  // CRUD handlers (update offline state immediately + sync to Firestore if signed in)
  const uid = firebaseUser?.uid || data.profile.uid;

  const handleSaveTransaction = async (
    txInput: Omit<Transaction, 'id' | 'workspaceId' | 'createdBy'>,
    existingId?: string
  ) => {
    if (!canEdit) return;
    const id = existingId || `tx-${Date.now()}`;
    const nextTx: Transaction = {
      ...txInput,
      id,
      workspaceId: uid,
      createdBy: uid,
    };
    setData((prev) => ({
      ...prev,
      transactions: existingId
        ? prev.transactions.map((item) => (item.id === existingId ? nextTx : item))
        : [nextTx, ...prev.transactions],
    }));
    if (firebaseUser) {
      await cloudUpsertTransaction(firebaseUser.uid, nextTx, !existingId);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!canEdit) return;
    setData((prev) => ({
      ...prev,
      transactions: prev.transactions.filter((tx) => tx.id !== id),
    }));
    if (firebaseUser) {
      await cloudDeleteDoc(firebaseUser.uid, 'transactions', id);
    }
  };

  const handleSaveInventory = async (
    itemInput: Omit<InventoryItem, 'id' | 'workspaceId' | 'createdBy'>,
    existingId?: string
  ) => {
    if (!canEdit) return;
    const id = existingId || `inv-${Date.now()}`;
    const nextItem: InventoryItem = {
      ...itemInput,
      id,
      workspaceId: uid,
      createdBy: uid,
    };
    setData((prev) => ({
      ...prev,
      inventory: existingId
        ? prev.inventory.map((i) => (i.id === existingId ? nextItem : i))
        : [nextItem, ...prev.inventory],
    }));
    if (firebaseUser) {
      await cloudUpsertInventory(firebaseUser.uid, nextItem, !existingId);
    }
  };

  const handleDeleteInventory = async (id: string) => {
    if (!canEdit) return;
    setData((prev) => ({
      ...prev,
      inventory: prev.inventory.filter((i) => i.id !== id),
    }));
    if (firebaseUser) {
      await cloudDeleteDoc(firebaseUser.uid, 'inventory', id);
    }
  };

  const handleRecordSale = async (item: InventoryItem, qty: number, note: string) => {
    if (!canEdit) return;
    const updatedItem: InventoryItem = {
      ...item,
      stock: Math.max(0, item.stock - qty),
    };
    const saleTx: Transaction = {
      id: `tx-${Date.now()}`,
      workspaceId: uid,
      createdBy: uid,
      scope: 'business',
      type: 'income',
      category: 'Bán lẻ sản phẩm',
      amount: item.sellPrice * qty,
      cogs: item.costPrice * qty,
      note: note || `Bán ${qty} ${item.unit} ${item.name}`,
      date: new Date().toISOString().slice(0, 10),
      paymentMethod: 'cash',
      memberName: data.profile.displayName,
      inventoryItemId: item.id,
      quantity: qty,
    };

    setData((prev) => ({
      ...prev,
      inventory: prev.inventory.map((i) => (i.id === item.id ? updatedItem : i)),
      transactions: [saleTx, ...prev.transactions],
    }));

    if (firebaseUser) {
      await cloudUpsertInventory(firebaseUser.uid, updatedItem, false);
      await cloudUpsertTransaction(firebaseUser.uid, saleTx, true);
    }
  };

  const handleRestock = async (item: InventoryItem, qty: number) => {
    if (!canEdit) return;
    const updatedItem: InventoryItem = {
      ...item,
      stock: item.stock + qty,
    };
    setData((prev) => ({
      ...prev,
      inventory: prev.inventory.map((i) => (i.id === item.id ? updatedItem : i)),
    }));
    if (firebaseUser) {
      await cloudUpsertInventory(firebaseUser.uid, updatedItem, false);
    }
  };

  const handleAddDebt = async (debtInput: Omit<DebtRecord, 'id' | 'workspaceId' | 'createdBy'>) => {
    if (!canEdit) return;
    const id = `debt-${Date.now()}`;
    const nextDebt: DebtRecord = {
      ...debtInput,
      id,
      workspaceId: uid,
      createdBy: uid,
    };
    setData((prev) => ({ ...prev, debts: [...prev.debts, nextDebt] }));
    if (firebaseUser) {
      await cloudUpsertDebt(firebaseUser.uid, nextDebt, true);
    }
  };

  const handlePayDebt = async (debt: DebtRecord, paymentAmount: number) => {
    if (!canEdit || debt.status === 'paid') return;
    const nextPaid = Math.min(debt.amount, debt.paidAmount + paymentAmount);
    const nextStatus = nextPaid >= debt.amount ? 'paid' : 'partial';
    const updated: DebtRecord = { ...debt, paidAmount: nextPaid, status: nextStatus };

    setData((prev) => ({
      ...prev,
      debts: prev.debts.map((d) => (d.id === debt.id ? updated : d)),
    }));
    if (firebaseUser) {
      await cloudUpsertDebt(firebaseUser.uid, updated, false);
    }
  };

  const handleDeleteDebt = async (id: string) => {
    if (!canEdit) return;
    setData((prev) => ({ ...prev, debts: prev.debts.filter((d) => d.id !== id) }));
    if (firebaseUser) {
      await cloudDeleteDoc(firebaseUser.uid, 'debts', id);
    }
  };

  const handleSaveFamilyMember = async (
    memberInput: Omit<FamilyMember, 'id' | 'workspaceId' | 'createdBy'>
  ) => {
    if (!canEdit) return;
    const id = `fam-${Date.now()}`;
    const nextMember: FamilyMember = {
      ...memberInput,
      id,
      workspaceId: uid,
      createdBy: uid,
    };
    setData((prev) => ({ ...prev, familyMembers: [...prev.familyMembers, nextMember] }));
    if (firebaseUser) {
      await cloudUpsertFamilyMember(firebaseUser.uid, nextMember, true);
    }
  };

  const handleDeleteFamilyMember = async (id: string) => {
    if (!canEdit) return;
    setData((prev) => ({
      ...prev,
      familyMembers: prev.familyMembers.filter((m) => m.id !== id),
    }));
    if (firebaseUser) {
      await cloudDeleteDoc(firebaseUser.uid, 'familyMembers', id);
    }
  };

  const handleUpdateProfile = async (patch: Partial<UserProfile>) => {
    const next = { ...data.profile, ...patch };
    setData((prev) => ({ ...prev, profile: next }));
    if (firebaseUser) {
      // Role changes stay local for preview unless admin, avoiding client privilege escalation error
      const { role: _omitRole, ...safeProfile } = next;
      await cloudUpdateProfile(firebaseUser.uid, { ...data.profile, ...safeProfile });
    }
  };

  const handleUpdatePrivateInfo = async (patch: Partial<UserPrivateInfo>) => {
    const next = { ...data.privateInfo, ...patch };
    setData((prev) => ({ ...prev, privateInfo: next }));
    if (firebaseUser) {
      await cloudUpdatePrivateInfo(firebaseUser.uid, next);
    }
  };

  const handleCreateTransactionFromQr = (parsed: ParsedQrPayment) => {
    setEditingTx(null);
    setTxPrefill({
      amount: parsed.amount,
      note: parsed.note,
      scope: 'personal',
    });
    setTxModalOpen(true);
  };

  const navItems: { id: NavTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'overview', label: t.navOverview, icon: LayoutDashboard },
    { id: 'personal', label: t.navPersonal, icon: Receipt },
    { id: 'business', label: t.navBusiness, icon: Package },
    { id: 'family', label: t.navFamily, icon: Users },
    { id: 'debts', label: t.navDebts, icon: BarChart3 },
    { id: 'settings', label: t.navSettings, icon: Settings },
  ];

  if (isLocked) {
    return <BiometricLockScreen t={t} onUnlock={() => setIsLocked(false)} />;
  }

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100">
      {/* Desktop Sidebar (240px) */}
      <aside className="hidden lg:flex w-60 shrink-0 flex-col border-r border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="h-16 px-5 flex items-center gap-2.5 border-b border-slate-200 dark:border-zinc-800">
          <Wallet className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0" />
          <span className="font-semibold text-sm tracking-tight whitespace-nowrap truncate">
            {t.appName}
          </span>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300'
                    : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-zinc-100'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-zinc-800 space-y-2.5">
          {!isInstalled && isInstallable && (
            <button
              type="button"
              onClick={install}
              className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t.installApp}</span>
            </button>
          )}

          <div className="text-xs text-slate-500 dark:text-zinc-400 flex items-center gap-2">
            {firebaseUser && isOnline ? (
              <>
                <Cloud className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="truncate">{isSyncing ? t.syncingNow : t.cloudSynced}</span>
              </>
            ) : (
              <>
                <CloudOff className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                <span className="truncate">{t.offlineLocal}</span>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="w-64 bg-white dark:bg-zinc-900 border-r border-slate-200 dark:border-zinc-800 p-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                  <span className="font-semibold text-sm">{t.appName}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileNavOpen(false)}
                  className="p-1.5 rounded-lg text-slate-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setActiveTab(item.id);
                        setMobileNavOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium ${
                        active
                          ? 'bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300'
                          : 'text-slate-600 dark:text-zinc-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
          <div className="flex-1 bg-black/40" onClick={() => setMobileNavOpen(false)} />
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-16 px-4 sm:px-6 border-b border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800"
              aria-label="Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-zinc-100 truncate">
              {navItems.find((n) => n.id === activeTab)?.label}
            </h1>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setQrModalOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 text-xs font-medium text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 whitespace-nowrap"
            >
              <QrCode className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>{t.qrPayScan}</span>
            </button>

            <button
              type="button"
              onClick={() => setHideAmounts((v) => !v)}
              className="p-2 rounded-lg text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800"
              title={t.privacyHideAmounts}
              aria-label={t.privacyHideAmounts}
            >
              {hideAmounts ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={() =>
                handleUpdateProfile({
                  theme: data.profile.theme === 'dark' ? 'light' : 'dark',
                })
              }
              className="p-2 rounded-lg text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800"
              title={t.appearanceTheme}
              aria-label={t.appearanceTheme}
            >
              {data.profile.theme === 'dark' ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>

            {data.profile.biometricEnabled && (
              <button
                type="button"
                onClick={() => setIsLocked(true)}
                className="p-2 rounded-lg text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800"
                title={t.lockApp}
                aria-label={t.lockApp}
              >
                <Lock className="w-4 h-4" />
              </button>
            )}

            {/* Notifications Popover */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotifOpen((v) => !v)}
                className="p-2 rounded-lg text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 relative"
                aria-label={t.notificationsCenter}
              >
                <Bell className="w-4 h-4" />
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 text-[10px] font-mono font-bold text-rose-600 dark:text-rose-400">
                    {notifications.length}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-lg p-4 z-40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-900 dark:text-zinc-100">
                      {t.notificationsCenter}
                    </span>
                    <button
                      type="button"
                      onClick={() => setNotifOpen(false)}
                      className="text-xs text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {notifications.length === 0 ? (
                    <p className="text-xs text-slate-500 dark:text-zinc-400 py-2">
                      {t.noNotifications}
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {notifications.map((n) => (
                        <div
                          key={n.id}
                          className="p-2.5 rounded-lg border border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 space-y-0.5"
                        >
                          <div
                            className={`text-xs font-medium ${
                              n.severity === 'danger'
                                ? 'text-rose-600 dark:text-rose-400'
                                : 'text-amber-600 dark:text-amber-400'
                            }`}
                          >
                            {n.title}
                          </div>
                          <div className="text-xs font-mono text-slate-500 dark:text-zinc-400">
                            {n.message}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {!firebaseUser ? (
              <button
                type="button"
                onClick={handleSignInGoogle}
                className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium whitespace-nowrap"
              >
                {t.signInGoogle}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 text-xs font-medium text-slate-700 dark:text-zinc-200 max-w-[140px] truncate"
              >
                {firebaseUser.displayName || firebaseUser.email}
              </button>
            )}
          </div>
        </header>

        {/* Notices */}
        {(!isOnline || authNotice || !canEdit) && (
          <div className="px-4 sm:px-6 pt-4 space-y-2">
            {!isOnline && (
              <div className="px-4 py-2.5 rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2">
                <CloudOff className="w-4 h-4 shrink-0" />
                <span>{t.offlineLocal}</span>
              </div>
            )}
            {!canEdit && (
              <div className="px-4 py-2.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-slate-600 dark:text-zinc-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{t.readOnlyRoleWarning}</span>
              </div>
            )}
            {authNotice && (
              <div className="px-4 py-2.5 rounded-lg border border-teal-200 dark:border-teal-900/50 bg-teal-50 dark:bg-teal-950/30 text-xs text-teal-800 dark:text-teal-200 flex items-center justify-between gap-2">
                <span>{authNotice}</span>
                <button type="button" onClick={() => setAuthNotice('')}>
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Active Viewport */}
        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
          {activeTab === 'overview' && (
            <OverviewView
              transactions={data.transactions}
              inventory={data.inventory}
              debts={data.debts}
              familyMembers={data.familyMembers}
              currency={data.profile.currency}
              hideAmounts={hideAmounts}
              canEdit={canEdit}
              t={t}
              onAddTransaction={() => {
                setEditingTx(null);
                setTxPrefill(null);
                setTxModalOpen(true);
              }}
              onOpenQr={() => setQrModalOpen(true)}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === 'personal' && (
            <TransactionsView
              transactions={data.transactions}
              monthlyBudget={data.profile.monthlyBudget}
              currency={data.profile.currency}
              hideAmounts={hideAmounts}
              canEdit={canEdit}
              t={t}
              onAdd={() => {
                setEditingTx(null);
                setTxPrefill({ scope: 'personal' });
                setTxModalOpen(true);
              }}
              onEdit={(tx) => {
                setEditingTx(tx);
                setTxPrefill(null);
                setTxModalOpen(true);
              }}
              onDelete={handleDeleteTransaction}
            />
          )}

          {activeTab === 'business' && (
            <BusinessInventoryView
              transactions={data.transactions}
              inventory={data.inventory}
              currency={data.profile.currency}
              hideAmounts={hideAmounts}
              canEdit={canEdit}
              t={t}
              onSaveInventory={handleSaveInventory}
              onDeleteInventory={handleDeleteInventory}
              onRecordSale={handleRecordSale}
              onRestock={handleRestock}
            />
          )}

          {activeTab === 'family' && (
            <FamilyCompareView
              members={data.familyMembers}
              transactions={data.transactions}
              currency={data.profile.currency}
              hideAmounts={hideAmounts}
              canEdit={canEdit}
              t={t}
              onSaveMember={handleSaveFamilyMember}
              onDeleteMember={handleDeleteFamilyMember}
            />
          )}

          {activeTab === 'debts' && (
            <DebtsRemindersView
              debts={data.debts}
              reminderFrequency={data.profile.reminderFrequency}
              currency={data.profile.currency}
              hideAmounts={hideAmounts}
              canEdit={canEdit}
              t={t}
              onAddDebt={handleAddDebt}
              onPayDebt={handlePayDebt}
              onDeleteDebt={handleDeleteDebt}
              onChangeFrequency={(freq: ReminderFrequency) =>
                handleUpdateProfile({ reminderFrequency: freq })
              }
              onTriggerReminder={triggerReminderCheck}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              profile={data.profile}
              privateInfo={data.privateInfo}
              banks={banks}
              syncingBanks={syncingBanks}
              bankSyncMessage={bankSyncMessage}
              isAuthenticated={Boolean(firebaseUser)}
              t={t}
              onUpdateProfile={handleUpdateProfile}
              onUpdatePrivateInfo={handleUpdatePrivateInfo}
              onSyncBanks={handleSyncBanks}
              onAddCustomBank={handleAddCustomBank}
              onRemoveCustomBank={handleRemoveCustomBank}
              onSignInGoogle={handleSignInGoogle}
              onSignInApple={handleSignInApple}
              onSignOut={handleSignOut}
              onResetDemo={() => setData(createDefaultState(uid, data.profile.displayName))}
            />
          )}
        </main>
      </div>

      <TransactionModal
        isOpen={txModalOpen}
        onClose={() => setTxModalOpen(false)}
        onSave={handleSaveTransaction}
        editingTx={editingTx}
        prefill={txPrefill}
        familyMembers={data.familyMembers}
        t={t}
      />

      <QRModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        privateInfo={data.privateInfo}
        banks={banks}
        syncingBanks={syncingBanks}
        onSyncBanks={handleSyncBanks}
        t={t}
        onCreateTransactionFromQr={handleCreateTransactionFromQr}
      />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <MainApp />
    </ErrorBoundary>
  );
}
