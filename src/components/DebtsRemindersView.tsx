import React, { useState } from 'react';
import {
  AlertCircle,
  Bell,
  BellRing,
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
} from 'lucide-react';
import { formatCurrency, type TranslationDict } from '../i18n/translations';
import {
  SCHEMA_LIMITS,
  type CurrencyCode,
  type DebtDirection,
  type DebtRecord,
  type ReminderFrequency,
} from '../types/finance';

interface Props {
  debts: DebtRecord[];
  reminderFrequency: ReminderFrequency;
  currency: CurrencyCode;
  hideAmounts: boolean;
  canEdit: boolean;
  t: TranslationDict;
  onAddDebt: (debt: Omit<DebtRecord, 'id' | 'workspaceId' | 'createdBy'>) => void;
  onPayDebt: (debt: DebtRecord, paymentAmount: number) => void;
  onDeleteDebt: (id: string) => void;
  onChangeFrequency: (freq: ReminderFrequency) => void;
  onTriggerReminder: () => void;
}

export const DebtsRemindersView: React.FC<Props> = ({
  debts,
  reminderFrequency,
  currency,
  hideAmounts,
  canEdit,
  t,
  onAddDebt,
  onPayDebt,
  onDeleteDebt,
  onChangeFrequency,
  onTriggerReminder,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [direction, setDirection] = useState<DebtDirection>('payable');
  const [counterparty, setCounterparty] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState('');

  const [payingDebt, setPayingDebt] = useState<DebtRecord | null>(null);
  const [payInput, setPayInput] = useState('');
  const [notifPerm, setNotifPerm] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  const today = new Date().toISOString().slice(0, 10);

  const handleRequestNotification = async () => {
    if (typeof Notification === 'undefined') return;
    const perm = await Notification.requestPermission();
    setNotifPerm(perm);
    if (perm === 'granted') {
      onTriggerReminder();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numeric = Number(amount);
    if (!counterparty.trim() || !numeric || numeric <= 0) return;
    onAddDebt({
      direction,
      counterparty: counterparty.trim().slice(0, SCHEMA_LIMITS.MAX_COUNTERPARTY),
      amount: Math.min(SCHEMA_LIMITS.MAX_AMOUNT, numeric),
      paidAmount: 0,
      dueDate,
      status: 'pending',
      note: note.trim().slice(0, SCHEMA_LIMITS.MAX_NOTE),
    });
    setCounterparty('');
    setAmount('');
    setNote('');
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-zinc-100">
            {t.debtsTitle}
          </h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">{t.debtsSubtitle}</p>
        </div>
        {canEdit && (
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.addDebt}</span>
          </button>
        )}
      </div>

      {/* Periodic Reminder Controls */}
      <div className="p-5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
            <BellRing className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
              {t.reminderSettings}
            </div>
            <div className="text-xs text-slate-500 dark:text-zinc-400">
              {t.reminderFrequency}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-zinc-800">
            {(['daily', 'weekly', 'monthly', 'off'] as const).map((freq) => (
              <button
                key={freq}
                type="button"
                onClick={() => onChangeFrequency(freq)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  reminderFrequency === freq
                    ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 shadow-xs'
                    : 'text-slate-600 dark:text-zinc-400'
                }`}
              >
                {freq === 'daily'
                  ? t.freqDaily
                  : freq === 'weekly'
                  ? t.freqWeekly
                  : freq === 'monthly'
                  ? t.freqMonthly
                  : t.freqOff}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleRequestNotification}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 text-xs font-medium text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>{notifPerm === 'granted' ? t.notifEnabled : t.enableBrowserNotif}</span>
          </button>

          <button
            type="button"
            onClick={onTriggerReminder}
            className="px-3 py-2 rounded-lg bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-medium hover:opacity-90"
          >
            {t.triggerReminderNow}
          </button>
        </div>
      </div>

      {/* Add Debt Form */}
      {showForm && canEdit && (
        <form
          onSubmit={handleSubmit}
          className="p-5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3"
        >
          <select
            value={direction}
            onChange={(e) => setDirection(e.target.value as DebtDirection)}
            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-xs"
          >
            <option value="payable">{t.payable}</option>
            <option value="receivable">{t.receivable}</option>
          </select>
          <input
            type="text"
            required
            placeholder={t.counterparty}
            value={counterparty}
            onChange={(e) => setCounterparty(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-xs"
          />
          <input
            type="number"
            required
            min={1}
            placeholder={t.totalAmount}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-xs font-mono"
          />
          <input
            type="date"
            required
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-xs font-mono"
          />
          <input
            type="text"
            placeholder={t.note}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-xs"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 px-3 py-2 rounded-lg bg-teal-600 text-white text-xs font-medium hover:bg-teal-700"
            >
              {t.save}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 text-xs"
            >
              {t.cancel}
            </button>
          </div>
        </form>
      )}

      {/* Debts Table */}
      <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-zinc-800 text-left text-xs font-medium text-slate-500 dark:text-zinc-400">
                <th className="py-3 px-5">{t.counterparty}</th>
                <th className="py-3 px-4">{t.dueDate}</th>
                <th className="py-3 px-4 text-right">{t.totalAmount}</th>
                <th className="py-3 px-4 text-right">{t.remainingAmount}</th>
                <th className="py-3 px-4">Trạng thái</th>
                {canEdit && <th className="py-3 px-5 text-right">{t.actions}</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
              {debts.map((d) => {
                const remaining = Math.max(0, d.amount - d.paidAmount);
                const isOverdue = d.status !== 'paid' && d.dueDate < today;
                return (
                  <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/50">
                    <td className="py-3 px-5">
                      <div className="font-medium text-slate-900 dark:text-zinc-100">
                        {d.counterparty}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-zinc-400">
                        {d.direction === 'payable' ? t.payable : t.receivable}
                        {d.note ? ` · ${d.note}` : ''}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-xs text-slate-600 dark:text-zinc-300 whitespace-nowrap">
                      {d.dueDate}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700 dark:text-zinc-300">
                      {formatCurrency(d.amount, currency, hideAmounts)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-slate-900 dark:text-zinc-100">
                      {formatCurrency(remaining, currency, hideAmounts)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {d.status === 'paid' ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {t.statusPaid}
                        </span>
                      ) : isOverdue ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400">
                          <AlertCircle className="w-3.5 h-3.5" />
                          {t.statusOverdue}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                          <Clock className="w-3.5 h-3.5" />
                          {d.status === 'partial' ? t.statusPartial : t.statusPending}
                        </span>
                      )}
                    </td>
                    {canEdit && (
                      <td className="py-3 px-5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          {d.status !== 'paid' && (
                            <button
                              type="button"
                              onClick={() => {
                                setPayingDebt(d);
                                setPayInput(String(remaining));
                              }}
                              className="px-2.5 py-1.5 rounded-md bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium"
                            >
                              {t.recordPayment}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onDeleteDebt(d.id)}
                            className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
                            aria-label={t.delete}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      {payingDebt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const val = Math.max(1, Number(payInput) || 0);
              onPayDebt(payingDebt, val);
              setPayingDebt(null);
            }}
            className="w-full max-w-sm rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-4"
          >
            <h3 className="text-base font-semibold text-slate-900 dark:text-zinc-100">
              {t.recordPayment} · {payingDebt.counterparty}
            </h3>
            <div>
              <label className="block text-xs text-slate-500 mb-1">{t.amount}</label>
              <input
                type="number"
                required
                min={1}
                max={Math.max(1, payingDebt.amount - payingDebt.paidAmount)}
                value={payInput}
                onChange={(e) => setPayInput(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 font-mono text-sm"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPayingDebt(null)}
                className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 text-xs"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-teal-600 text-white text-xs font-medium hover:bg-teal-700"
              >
                {t.save}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
