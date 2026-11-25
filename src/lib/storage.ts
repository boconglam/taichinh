import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import {
  SCHEMA_LIMITS,
  type AppDataState,
  type DebtRecord,
  type FamilyMember,
  type InventoryItem,
  type Transaction,
  type UserPrivateInfo,
  type UserProfile,
  type WorkspaceMember,
} from '../types/finance';

const STORAGE_KEY = 'smart_ledger_offline_state_v1';

function todayOffset(daysDelta: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysDelta);
  return d.toISOString().slice(0, 10);
}

export function createDefaultState(uid = 'local-workspace', displayName = 'Gia đình & Kinh doanh'): AppDataState {
  return {
    profile: {
      uid,
      displayName,
      role: 'owner',
      provider: 'local',
      language: 'vi',
      currency: 'VND',
      theme: 'system',
      biometricEnabled: false,
      reminderFrequency: 'daily',
      monthlyBudget: 22000000,
    },
    privateInfo: {
      uid,
      email: '',
      bankBin: '970436',
      bankName: 'Vietcombank',
      bankAccount: '0011009876543',
      accountHolder: displayName.toUpperCase(),
    },
    familyMembers: [
      {
        id: 'fam-1',
        workspaceId: uid,
        createdBy: uid,
        name: 'Minh Anh',
        relation: 'Vợ / Thu nhập chính',
        monthlyIncome: 26000000,
        monthlyBudget: 12000000,
      },
      {
        id: 'fam-2',
        workspaceId: uid,
        createdBy: uid,
        name: 'Hoàng Nam',
        relation: 'Chồng / Kinh doanh',
        monthlyIncome: 34000000,
        monthlyBudget: 10000000,
      },
    ],
    inventory: [
      {
        id: 'inv-1',
        workspaceId: uid,
        createdBy: uid,
        sku: 'CF-ARABICA-500',
        name: 'Cà phê Arabica Cầu Đất 500g',
        category: 'Đồ uống',
        costPrice: 115000,
        sellPrice: 195000,
        stock: 42,
        minStock: 10,
        unit: 'Gói',
      },
      {
        id: 'inv-2',
        workspaceId: uid,
        createdBy: uid,
        sku: 'TR-OOLONG-250',
        name: 'Trà Oolong Bảo Lộc 250g',
        category: 'Đồ uống',
        costPrice: 85000,
        sellPrice: 155000,
        stock: 7,
        minStock: 12,
        unit: 'Hộp',
      },
      {
        id: 'inv-3',
        workspaceId: uid,
        createdBy: uid,
        sku: 'LY-GOMS-01',
        name: 'Ly gốm thủ công Bát Tràng',
        category: 'Phụ kiện',
        costPrice: 65000,
        sellPrice: 145000,
        stock: 28,
        minStock: 8,
        unit: 'Cái',
      },
    ],
    transactions: [
      {
        id: 'tx-1',
        workspaceId: uid,
        createdBy: uid,
        scope: 'personal',
        type: 'income',
        category: 'Lương tháng',
        amount: 26000000,
        cogs: 0,
        note: 'Lương chuyển khoản tháng này',
        date: todayOffset(-12),
        paymentMethod: 'bank_qr',
        memberName: 'Minh Anh',
        inventoryItemId: '',
        quantity: 0,
      },
      {
        id: 'tx-2',
        workspaceId: uid,
        createdBy: uid,
        scope: 'personal',
        type: 'expense',
        category: 'Ăn uống & Siêu thị',
        amount: 4850000,
        cogs: 0,
        note: 'Thực phẩm tuần & siêu thị gia đình',
        date: todayOffset(-5),
        paymentMethod: 'bank_qr',
        memberName: 'Minh Anh',
        inventoryItemId: '',
        quantity: 0,
      },
      {
        id: 'tx-3',
        workspaceId: uid,
        createdBy: uid,
        scope: 'personal',
        type: 'expense',
        category: 'Hóa đơn & Tiện ích',
        amount: 2150000,
        cogs: 0,
        note: 'Điện, nước, internet cáp quang',
        date: todayOffset(-3),
        paymentMethod: 'ewallet',
        memberName: 'Hoàng Nam',
        inventoryItemId: '',
        quantity: 0,
      },
      {
        id: 'tx-4',
        workspaceId: uid,
        createdBy: uid,
        scope: 'personal',
        type: 'expense',
        category: 'Giáo dục & Sức khỏe',
        amount: 3400000,
        cogs: 0,
        note: 'Học phí ngoại ngữ & khám định kỳ',
        date: todayOffset(-1),
        paymentMethod: 'card',
        memberName: 'Minh Anh',
        inventoryItemId: '',
        quantity: 0,
      },
      {
        id: 'tx-5',
        workspaceId: uid,
        createdBy: uid,
        scope: 'business',
        type: 'income',
        category: 'Bán lẻ sản phẩm',
        amount: 11700000,
        cogs: 6900000,
        note: 'Đơn sỉ 60 gói Cà phê Arabica',
        date: todayOffset(-8),
        paymentMethod: 'bank_qr',
        memberName: 'Hoàng Nam',
        inventoryItemId: 'inv-1',
        quantity: 60,
      },
      {
        id: 'tx-6',
        workspaceId: uid,
        createdBy: uid,
        scope: 'business',
        type: 'income',
        category: 'Bán lẻ sản phẩm',
        amount: 4650000,
        cogs: 2550000,
        note: 'Bán 30 hộp Trà Oolong',
        date: todayOffset(-2),
        paymentMethod: 'cash',
        memberName: 'Hoàng Nam',
        inventoryItemId: 'inv-2',
        quantity: 30,
      },
      {
        id: 'tx-7',
        workspaceId: uid,
        createdBy: uid,
        scope: 'business',
        type: 'expense',
        category: 'Mặt bằng & Vận chuyển',
        amount: 2800000,
        cogs: 0,
        note: 'Phí giao hàng nhanh & bao bì đóng gói',
        date: todayOffset(-4),
        paymentMethod: 'bank_qr',
        memberName: 'Hoàng Nam',
        inventoryItemId: '',
        quantity: 0,
      },
    ],
    debts: [
      {
        id: 'debt-1',
        workspaceId: uid,
        createdBy: uid,
        direction: 'payable',
        counterparty: 'Xưởng rang xay Lâm Đồng',
        amount: 8500000,
        paidAmount: 3000000,
        dueDate: todayOffset(-3),
        status: 'partial',
        note: 'Công nợ lô cà phê nguyên liệu tháng trước (Quá hạn)',
      },
      {
        id: 'debt-2',
        workspaceId: uid,
        createdBy: uid,
        direction: 'receivable',
        counterparty: 'Quán Cà phê Góc Phố',
        amount: 4200000,
        paidAmount: 0,
        dueDate: todayOffset(4),
        status: 'pending',
        note: 'Khách sỉ thanh toán sau 15 ngày',
      },
    ],
    workspaceMembers: [
      {
        uid,
        displayName,
        role: 'owner',
      },
    ],
    lastReminderSentAt: null,
  };
}

export function loadOfflineState(): AppDataState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = createDefaultState();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw) as AppDataState;
  } catch {
    return createDefaultState();
  }
}

export function saveOfflineState(state: AppDataState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.warn('Could not persist offline state to localStorage:', err);
  }
}

export function sanitizeId(raw: string): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, SCHEMA_LIMITS.MAX_ID);
  return cleaned || `id-${Date.now()}`;
}

export function sanitizeText(raw: string, maxLen: number): string {
  return raw.trim().slice(0, maxLen);
}

export async function ensureCloudWorkspace(
  uid: string,
  displayName: string,
  email: string,
  provider: 'google.com' | 'apple.com',
  localState: AppDataState
): Promise<void> {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    const batch = writeBatch(db);
    const cleanName = sanitizeText(displayName || email.split('@')[0] || 'User', SCHEMA_LIMITS.MAX_DISPLAY_NAME);
    batch.set(userRef, {
      uid,
      displayName: cleanName,
      role: 'owner',
      provider,
      language: localState.profile.language,
      currency: localState.profile.currency,
      theme: localState.profile.theme,
      biometricEnabled: localState.profile.biometricEnabled,
      reminderFrequency: localState.profile.reminderFrequency,
      monthlyBudget: Math.max(0, localState.profile.monthlyBudget),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const privateRef = doc(db, 'users', uid, 'private', 'info');
    batch.set(privateRef, {
      uid,
      email: sanitizeText(email, 200),
      bankBin: sanitizeText(localState.privateInfo.bankBin, 20),
      bankName: sanitizeText(localState.privateInfo.bankName, 80),
      bankAccount: sanitizeText(localState.privateInfo.bankAccount, 40),
      accountHolder: sanitizeText(localState.privateInfo.accountHolder || cleanName, 100),
      updatedAt: serverTimestamp(),
    });

    const wsRef = doc(db, 'workspaces', uid);
    batch.set(wsRef, {
      id: uid,
      name: cleanName,
      ownerId: uid,
      currency: localState.profile.currency,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const memberRef = doc(db, 'workspaces', uid, 'members', uid);
    batch.set(memberRef, {
      uid,
      displayName: cleanName,
      role: 'owner',
      joinedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    try {
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `workspaces/${uid}`);
    }

    // Seed initial local items to user's newly provisioned cloud workspace
    const seedBatch = writeBatch(db);
    localState.familyMembers.forEach((fm) => {
      const id = sanitizeId(fm.id);
      seedBatch.set(doc(db, 'workspaces', uid, 'familyMembers', id), {
        id,
        workspaceId: uid,
        createdBy: uid,
        name: sanitizeText(fm.name, 100),
        relation: sanitizeText(fm.relation, 60),
        monthlyIncome: Math.max(0, fm.monthlyIncome),
        monthlyBudget: Math.max(0, fm.monthlyBudget),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
    localState.inventory.forEach((inv) => {
      const id = sanitizeId(inv.id);
      seedBatch.set(doc(db, 'workspaces', uid, 'inventory', id), {
        id,
        workspaceId: uid,
        createdBy: uid,
        sku: sanitizeText(inv.sku, 40),
        name: sanitizeText(inv.name, 120),
        category: sanitizeText(inv.category, 60),
        costPrice: Math.max(0, inv.costPrice),
        sellPrice: Math.max(0, inv.sellPrice),
        stock: Math.max(0, inv.stock),
        minStock: Math.max(0, inv.minStock),
        unit: sanitizeText(inv.unit, 24),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
    localState.transactions.forEach((tx) => {
      const id = sanitizeId(tx.id);
      seedBatch.set(doc(db, 'workspaces', uid, 'transactions', id), {
        id,
        workspaceId: uid,
        createdBy: uid,
        scope: tx.scope,
        type: tx.type,
        category: sanitizeText(tx.category, 60),
        amount: Math.max(1, tx.amount),
        cogs: Math.max(0, tx.cogs),
        note: sanitizeText(tx.note, 300),
        date: tx.date,
        paymentMethod: tx.paymentMethod,
        memberName: sanitizeText(tx.memberName, 100),
        inventoryItemId: sanitizeText(tx.inventoryItemId, 128),
        quantity: Math.max(0, tx.quantity),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
    localState.debts.forEach((d) => {
      const id = sanitizeId(d.id);
      seedBatch.set(doc(db, 'workspaces', uid, 'debts', id), {
        id,
        workspaceId: uid,
        createdBy: uid,
        direction: d.direction,
        counterparty: sanitizeText(d.counterparty, 120),
        amount: Math.max(1, d.amount),
        paidAmount: Math.min(Math.max(0, d.paidAmount), Math.max(1, d.amount)),
        dueDate: d.dueDate,
        status: d.status,
        note: sanitizeText(d.note, 300),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
    try {
      await seedBatch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `workspaces/${uid}/seed`);
    }
  }
}

export function subscribeWorkspaceData(
  uid: string,
  callbacks: {
    onProfile: (profile: Partial<UserProfile>) => void;
    onPrivateInfo: (info: Partial<UserPrivateInfo>) => void;
    onTransactions: (items: Transaction[]) => void;
    onInventory: (items: InventoryItem[]) => void;
    onDebts: (items: DebtRecord[]) => void;
    onFamilyMembers: (items: FamilyMember[]) => void;
    onMembers: (items: WorkspaceMember[]) => void;
  }
): () => void {
  const unsubs: Unsubscribe[] = [];

  unsubs.push(
    onSnapshot(
      doc(db, 'users', uid),
      (snap) => {
        if (snap.exists()) {
          callbacks.onProfile(snap.data() as Partial<UserProfile>);
        }
      },
      (err) => handleFirestoreError(err, OperationType.GET, `users/${uid}`)
    )
  );

  unsubs.push(
    onSnapshot(
      doc(db, 'users', uid, 'private', 'info'),
      (snap) => {
        if (snap.exists()) {
          callbacks.onPrivateInfo(snap.data() as Partial<UserPrivateInfo>);
        }
      },
      (err) => handleFirestoreError(err, OperationType.GET, `users/${uid}/private/info`)
    )
  );

  unsubs.push(
    onSnapshot(
      query(collection(db, 'workspaces', uid, 'transactions'), where('workspaceId', '==', uid)),
      (snap) => {
        const list = snap.docs.map((d) => d.data() as Transaction);
        list.sort((a, b) => b.date.localeCompare(a.date));
        callbacks.onTransactions(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, `workspaces/${uid}/transactions`)
    )
  );

  unsubs.push(
    onSnapshot(
      query(collection(db, 'workspaces', uid, 'inventory'), where('workspaceId', '==', uid)),
      (snap) => {
        callbacks.onInventory(snap.docs.map((d) => d.data() as InventoryItem));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, `workspaces/${uid}/inventory`)
    )
  );

  unsubs.push(
    onSnapshot(
      query(collection(db, 'workspaces', uid, 'debts'), where('workspaceId', '==', uid)),
      (snap) => {
        const list = snap.docs.map((d) => d.data() as DebtRecord);
        list.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
        callbacks.onDebts(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, `workspaces/${uid}/debts`)
    )
  );

  unsubs.push(
    onSnapshot(
      query(collection(db, 'workspaces', uid, 'familyMembers'), where('workspaceId', '==', uid)),
      (snap) => {
        callbacks.onFamilyMembers(snap.docs.map((d) => d.data() as FamilyMember));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, `workspaces/${uid}/familyMembers`)
    )
  );

  unsubs.push(
    onSnapshot(
      query(collection(db, 'workspaces', uid, 'members'), where('uid', '==', uid)),
      (snap) => {
        callbacks.onMembers(snap.docs.map((d) => d.data() as WorkspaceMember));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, `workspaces/${uid}/members`)
    )
  );

  return () => {
    unsubs.forEach((u) => u());
  };
}

export async function cloudUpsertTransaction(uid: string, tx: Transaction, isNew: boolean): Promise<void> {
  const path = `workspaces/${uid}/transactions/${tx.id}`;
  const ref = doc(db, 'workspaces', uid, 'transactions', tx.id);
  const payload = {
    id: sanitizeId(tx.id),
    workspaceId: uid,
    createdBy: uid,
    scope: tx.scope,
    type: tx.type,
    category: sanitizeText(tx.category, SCHEMA_LIMITS.MAX_CATEGORY) || 'General',
    amount: Math.max(1, Math.min(SCHEMA_LIMITS.MAX_AMOUNT, Number(tx.amount) || 1)),
    cogs: Math.max(0, Math.min(SCHEMA_LIMITS.MAX_AMOUNT, Number(tx.cogs) || 0)),
    note: sanitizeText(tx.note, SCHEMA_LIMITS.MAX_NOTE),
    date: SCHEMA_LIMITS.DATE_REGEX.test(tx.date) ? tx.date : new Date().toISOString().slice(0, 10),
    paymentMethod: tx.paymentMethod,
    memberName: sanitizeText(tx.memberName, SCHEMA_LIMITS.MAX_DISPLAY_NAME),
    inventoryItemId: sanitizeText(tx.inventoryItemId, SCHEMA_LIMITS.MAX_ID),
    quantity: Math.max(0, Number(tx.quantity) || 0),
    updatedAt: serverTimestamp(),
  };

  try {
    if (isNew) {
      await setDoc(ref, { ...payload, createdAt: serverTimestamp() });
    } else {
      await updateDoc(ref, {
        scope: payload.scope,
        type: payload.type,
        category: payload.category,
        amount: payload.amount,
        cogs: payload.cogs,
        note: payload.note,
        date: payload.date,
        paymentMethod: payload.paymentMethod,
        memberName: payload.memberName,
        inventoryItemId: payload.inventoryItemId,
        quantity: payload.quantity,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (err) {
    handleFirestoreError(err, isNew ? OperationType.CREATE : OperationType.UPDATE, path);
  }
}

export async function cloudDeleteDoc(uid: string, col: string, id: string): Promise<void> {
  const path = `workspaces/${uid}/${col}/${id}`;
  try {
    await deleteDoc(doc(db, 'workspaces', uid, col, id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function cloudUpsertInventory(uid: string, item: InventoryItem, isNew: boolean): Promise<void> {
  const path = `workspaces/${uid}/inventory/${item.id}`;
  const ref = doc(db, 'workspaces', uid, 'inventory', item.id);
  const payload = {
    id: sanitizeId(item.id),
    workspaceId: uid,
    createdBy: uid,
    sku: sanitizeText(item.sku, SCHEMA_LIMITS.MAX_SKU) || 'SKU-01',
    name: sanitizeText(item.name, SCHEMA_LIMITS.MAX_PRODUCT_NAME) || 'Product',
    category: sanitizeText(item.category, SCHEMA_LIMITS.MAX_CATEGORY) || 'General',
    costPrice: Math.max(0, Number(item.costPrice) || 0),
    sellPrice: Math.max(0, Number(item.sellPrice) || 0),
    stock: Math.max(0, Number(item.stock) || 0),
    minStock: Math.max(0, Number(item.minStock) || 0),
    unit: sanitizeText(item.unit, SCHEMA_LIMITS.MAX_UNIT) || 'pcs',
    updatedAt: serverTimestamp(),
  };
  try {
    if (isNew) {
      await setDoc(ref, { ...payload, createdAt: serverTimestamp() });
    } else {
      await updateDoc(ref, {
        sku: payload.sku,
        name: payload.name,
        category: payload.category,
        costPrice: payload.costPrice,
        sellPrice: payload.sellPrice,
        stock: payload.stock,
        minStock: payload.minStock,
        unit: payload.unit,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (err) {
    handleFirestoreError(err, isNew ? OperationType.CREATE : OperationType.UPDATE, path);
  }
}

export async function cloudUpsertDebt(uid: string, debt: DebtRecord, isNew: boolean): Promise<void> {
  const path = `workspaces/${uid}/debts/${debt.id}`;
  const ref = doc(db, 'workspaces', uid, 'debts', debt.id);
  const cleanAmount = Math.max(1, Number(debt.amount) || 1);
  const cleanPaid = Math.min(cleanAmount, Math.max(0, Number(debt.paidAmount) || 0));
  const payload = {
    id: sanitizeId(debt.id),
    workspaceId: uid,
    createdBy: uid,
    direction: debt.direction,
    counterparty: sanitizeText(debt.counterparty, SCHEMA_LIMITS.MAX_COUNTERPARTY) || 'Partner',
    amount: cleanAmount,
    paidAmount: cleanPaid,
    dueDate: SCHEMA_LIMITS.DATE_REGEX.test(debt.dueDate) ? debt.dueDate : new Date().toISOString().slice(0, 10),
    status: debt.status,
    note: sanitizeText(debt.note, SCHEMA_LIMITS.MAX_NOTE),
    updatedAt: serverTimestamp(),
  };
  try {
    if (isNew) {
      await setDoc(ref, { ...payload, createdAt: serverTimestamp() });
    } else {
      await updateDoc(ref, {
        direction: payload.direction,
        counterparty: payload.counterparty,
        amount: payload.amount,
        paidAmount: payload.paidAmount,
        dueDate: payload.dueDate,
        status: payload.status,
        note: payload.note,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (err) {
    handleFirestoreError(err, isNew ? OperationType.CREATE : OperationType.UPDATE, path);
  }
}

export async function cloudUpsertFamilyMember(uid: string, member: FamilyMember, isNew: boolean): Promise<void> {
  const path = `workspaces/${uid}/familyMembers/${member.id}`;
  const ref = doc(db, 'workspaces', uid, 'familyMembers', member.id);
  const payload = {
    id: sanitizeId(member.id),
    workspaceId: uid,
    createdBy: uid,
    name: sanitizeText(member.name, SCHEMA_LIMITS.MAX_DISPLAY_NAME) || 'Member',
    relation: sanitizeText(member.relation, SCHEMA_LIMITS.MAX_RELATION) || 'Family',
    monthlyIncome: Math.max(0, Number(member.monthlyIncome) || 0),
    monthlyBudget: Math.max(0, Number(member.monthlyBudget) || 0),
    updatedAt: serverTimestamp(),
  };
  try {
    if (isNew) {
      await setDoc(ref, { ...payload, createdAt: serverTimestamp() });
    } else {
      await updateDoc(ref, {
        name: payload.name,
        relation: payload.relation,
        monthlyIncome: payload.monthlyIncome,
        monthlyBudget: payload.monthlyBudget,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (err) {
    handleFirestoreError(err, isNew ? OperationType.CREATE : OperationType.UPDATE, path);
  }
}

export async function cloudUpdateProfile(uid: string, profile: UserProfile): Promise<void> {
  const path = `users/${uid}`;
  try {
    await updateDoc(doc(db, 'users', uid), {
      displayName: sanitizeText(profile.displayName, SCHEMA_LIMITS.MAX_DISPLAY_NAME),
      provider: profile.provider,
      language: profile.language,
      currency: profile.currency,
      theme: profile.theme,
      biometricEnabled: profile.biometricEnabled,
      reminderFrequency: profile.reminderFrequency,
      monthlyBudget: Math.max(0, Number(profile.monthlyBudget) || 0),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function cloudUpdatePrivateInfo(uid: string, info: UserPrivateInfo): Promise<void> {
  const path = `users/${uid}/private/info`;
  try {
    await updateDoc(doc(db, 'users', uid, 'private', 'info'), {
      email: sanitizeText(info.email, 200),
      bankBin: sanitizeText(info.bankBin, 20),
      bankName: sanitizeText(info.bankName, 80),
      bankAccount: sanitizeText(info.bankAccount, 40),
      accountHolder: sanitizeText(info.accountHolder, 100),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}
