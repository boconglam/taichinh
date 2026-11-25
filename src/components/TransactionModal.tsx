import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { TranslationDict } from '../i18n/translations';
import {
  SCHEMA_LIMITS,
  type FamilyMember,
  type PaymentMethod,
  type Transaction,
  type TransactionScope,
  type TransactionType,
} from '../types/finance';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tx: Omit<Transaction, 'id' | 'workspaceId' | 'createdBy'>, existingId?: string) => void;
  editingTx: Transaction | null;
  prefill?: { amount?: number | null; note?: string; scope?: TransactionScope } | null;
  familyMembers: FamilyMember[];
  t: TranslationDict;
}

const PERSONAL_CATEGORIES = [
  'Ăn uống & Siêu thị',
  'Hóa đơn & Tiện ích',
  'Di chuyển',
  'Giáo dục & Sức khỏe',
  'Giải trí & Mua sắm',
  'Lương tháng',
  'Thu nhập phụ',
];

const BUSINESS_CATEGORIES = [
  'Bán lẻ sản phẩm',
  'Đơn hàng sỉ',
  'Nhập hàng & Nguyên liệu',
  'Mặt bằng & Vận chuyển',
  'Marketing & Quảng cáo',
  'Thuế & Phí',
];

export const TransactionModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSave,
  editingTx,
  prefill,
  familyMembers,
  t,
}) => {
  const [scope, setScope] = useState<TransactionScope>('personal');
  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState(PERSONAL_CATEGORIES[0]);
  const [amount, setAmount] = useState('');
  const [cogs, setCogs] = useState('0');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank_qr');
  const [memberName, setMemberName] = useState(familyMembers[0]?.name || 'Owner');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    if (editingTx) {
      setScope(editingTx.scope);
      setType(editingTx.type);
      setCategory(editingTx.category);
      setAmount(String(editingTx.amount));
      setCogs(String(editingTx.cogs));
      setDate(editingTx.date);
      setPaymentMethod(editingTx.paymentMethod);
      setMemberName(editingTx.memberName);
      setNote(editingTx.note);
    } else {
      const nextScope = prefill?.scope || 'personal';
      setScope(nextScope);
      setType('expense');
      setCategory(nextScope === 'business' ? BUSINESS_CATEGORIES[0] : PERSONAL_CATEGORIES[0]);
      setAmount(prefill?.amount ? String(prefill.amount) : '');
      setCogs('0');
      setDate(new Date().toISOString().slice(0, 10));
      setPaymentMethod(prefill ? 'bank_qr' : 'cash');
      setMemberName(familyMembers[0]?.name || 'Owner');
      setNote(prefill?.note || '');
    }
  }, [isOpen, editingTx, prefill, familyMembers]);

  if (!isOpen) return null;

  const categories = scope === 'business' ? BUSINESS_CATEGORIES : PERSONAL_CATEGORIES;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) return;

    onSave(
      {
        scope,
        type,
        category: category.slice(0, SCHEMA_LIMITS.MAX_CATEGORY),
        amount: Math.min(SCHEMA_LIMITS.MAX_AMOUNT, numericAmount),
        cogs: scope === 'business' ? Math.max(0, Number(cogs) || 0) : 0,
        note: note.slice(0, SCHEMA_LIMITS.MAX_NOTE),
        date,
        paymentMethod,
        memberName: memberName.slice(0, SCHEMA_LIMITS.MAX_DISPLAY_NAME),
        inventoryItemId: editingTx?.inventoryItemId || '',
        quantity: editingTx?.quantity || 0,
      },
      editingTx?.id
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900 dark:text-zinc-100">
            {editingTx ? t.edit : t.addTransaction}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800"
            aria-label={t.cancel}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-2 p-1 rounded-lg bg-slate-100 dark:bg-zinc-800">
            <button
              type="button"
              onClick={() => {
                setScope('personal');
                setCategory(PERSONAL_CATEGORIES[0]);
              }}
              className={`py-1.5 text-xs font-medium rounded-md transition-colors ${
                scope === 'personal'
                  ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400'
              }`}
            >
              {t.scopePersonal}
            </button>
            <button
              type="button"
              onClick={() => {
                setScope('business');
                setCategory(BUSINESS_CATEGORIES[0]);
              }}
              className={`py-1.5 text-xs font-medium rounded-md transition-colors ${
                scope === 'business'
                  ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400'
              }`}
            >
              {t.scopeBusiness}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 p-1 rounded-lg bg-slate-100 dark:bg-zinc-800">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`py-1.5 text-xs font-medium rounded-md transition-colors ${
                type === 'expense'
                  ? 'bg-rose-600 text-white'
                  : 'text-slate-600 dark:text-zinc-400'
              }`}
            >
              {t.typeExpense}
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`py-1.5 text-xs font-medium rounded-md transition-colors ${
                type === 'income'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-600 dark:text-zinc-400'
              }`}
            >
              {t.typeIncome}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">
                {t.amount}
              </label>
              <input
                type="number"
                required
                min={1}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm font-mono text-slate-900 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">
                {t.date}
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm font-mono text-slate-900 dark:text-zinc-100"
              />
            </div>
          </div>

          {scope === 'business' && type === 'income' && (
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">
                {t.cogsLabel}
              </label>
              <input
                type="number"
                min={0}
                value={cogs}
                onChange={(e) => setCogs(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm font-mono text-slate-900 dark:text-zinc-100"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">
                {t.category}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm text-slate-900 dark:text-zinc-100"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">
                {t.paymentMethod}
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm text-slate-900 dark:text-zinc-100"
              >
                <option value="bank_qr">{t.methodBankQr}</option>
                <option value="cash">{t.methodCash}</option>
                <option value="card">{t.methodCard}</option>
                <option value="ewallet">{t.methodEwallet}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">
              {t.member}
            </label>
            <select
              value={memberName}
              onChange={(e) => setMemberName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm text-slate-900 dark:text-zinc-100"
            >
              {familyMembers.map((m) => (
                <option key={m.id} value={m.name}>
                  {m.name}
                </option>
              ))}
              {familyMembers.length === 0 && <option value="Owner">Owner</option>}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">
              {t.note}
            </label>
            <input
              type="text"
              maxLength={SCHEMA_LIMITS.MAX_NOTE}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm text-slate-900 dark:text-zinc-100"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 text-xs font-medium text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium transition-colors"
            >
              {t.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
