import React, { useMemo, useState } from 'react';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { formatCurrency, type TranslationDict } from '../i18n/translations';
import type { CurrencyCode, Transaction } from '../types/finance';

interface Props {
  transactions: Transaction[];
  monthlyBudget: number;
  currency: CurrencyCode;
  hideAmounts: boolean;
  canEdit: boolean;
  t: TranslationDict;
  onAdd: () => void;
  onEdit: (tx: Transaction) => void;
  onDelete: (id: string) => void;
}

export const TransactionsView: React.FC<Props> = ({
  transactions,
  monthlyBudget,
  currency,
  hideAmounts,
  canEdit,
  t,
  onAdd,
  onEdit,
  onDelete,
}) => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [scopeFilter, setScopeFilter] = useState<'all' | 'personal' | 'business'>('personal');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return transactions.filter((tx) => {
      if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
      if (scopeFilter !== 'all' && tx.scope !== scopeFilter) return false;
      if (!q) return true;
      return (
        tx.category.toLowerCase().includes(q) ||
        tx.note.toLowerCase().includes(q) ||
        tx.memberName.toLowerCase().includes(q)
      );
    });
  }, [transactions, search, typeFilter, scopeFilter]);

  const currentMonthSpend = useMemo(() => {
    const monthPrefix = new Date().toISOString().slice(0, 7);
    return transactions
      .filter((tx) => tx.scope === 'personal' && tx.type === 'expense' && tx.date.startsWith(monthPrefix))
      .reduce((s, tx) => s + tx.amount, 0);
  }, [transactions]);

  const budgetPct = monthlyBudget > 0 ? Math.min(100, (currentMonthSpend / monthlyBudget) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Monthly Personal Budget Progress */}
      <div className="p-5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
              {t.personalBudgetLabel}
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              {t.budgetUsed}: {budgetPct.toFixed(1)}%
            </p>
          </div>
          <div className="text-sm font-mono tabular-nums text-slate-900 dark:text-zinc-100">
            <span>{formatCurrency(currentMonthSpend, currency, hideAmounts)}</span>
            <span className="mx-1.5 text-slate-400">/</span>
            <span className="text-slate-500 dark:text-zinc-400">
              {formatCurrency(monthlyBudget, currency, hideAmounts)}
            </span>
          </div>
        </div>
        <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              budgetPct >= 90 ? 'bg-rose-500' : budgetPct >= 70 ? 'bg-amber-500' : 'bg-teal-500'
            }`}
            style={{ width: `${budgetPct}%` }}
          />
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
            {(['personal', 'business', 'all'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setScopeFilter(s)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  scopeFilter === s
                    ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 shadow-xs'
                    : 'text-slate-600 dark:text-zinc-400'
                }`}
              >
                {s === 'personal' ? t.scopePersonal : s === 'business' ? t.scopeBusiness : t.allFilter}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
            {(['all', 'expense', 'income'] as const).map((tp) => (
              <button
                key={tp}
                type="button"
                onClick={() => setTypeFilter(tp)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  typeFilter === tp
                    ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 shadow-xs'
                    : 'text-slate-600 dark:text-zinc-400'
                }`}
              >
                {tp === 'all' ? t.allFilter : tp === 'income' ? t.typeIncome : t.typeExpense}
              </button>
            ))}
          </div>
        </div>

        {canEdit && (
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium transition-colors whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.addTransaction}</span>
          </button>
        )}
      </div>

      {/* Transactions Table */}
      <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <p className="text-sm text-slate-500 dark:text-zinc-400">{t.emptyTransactions}</p>
            {canEdit && (
              <button
                type="button"
                onClick={onAdd}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-teal-600 text-white text-xs font-medium hover:bg-teal-700"
              >
                <Plus className="w-3.5 h-3.5" />
                {t.logFirstEntry}
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-zinc-800 text-left text-xs font-medium text-slate-500 dark:text-zinc-400">
                  <th className="py-3 px-5">{t.date}</th>
                  <th className="py-3 px-4">{t.category}</th>
                  <th className="py-3 px-4">{t.member}</th>
                  <th className="py-3 px-4">{t.note}</th>
                  <th className="py-3 px-4 text-right">{t.amount}</th>
                  {canEdit && <th className="py-3 px-5 text-right">{t.actions}</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                {filtered.map((tx) => (
                  <tr
                    key={tx.id}
                    className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <td className="py-3 px-5 font-mono tabular-nums text-xs text-slate-500 dark:text-zinc-400 whitespace-nowrap">
                      {tx.date}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900 dark:text-zinc-100">
                        {tx.category}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-zinc-400">
                        {tx.scope === 'business' ? t.scopeBusiness : t.scopePersonal} ·{' '}
                        {tx.paymentMethod}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-zinc-300 whitespace-nowrap">
                      {tx.memberName || '-'}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-zinc-400 max-w-xs truncate">
                      {tx.note || '-'}
                    </td>
                    <td
                      className={`py-3 px-4 text-right font-mono tabular-nums font-medium whitespace-nowrap ${
                        tx.type === 'income'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {tx.type === 'income' ? '+' : '-'}
                      {formatCurrency(tx.amount, currency, hideAmounts)}
                    </td>
                    {canEdit && (
                      <td className="py-3 px-5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => onEdit(tx)}
                            className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800"
                            aria-label={t.edit}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDelete(tx.id)}
                            className="p-1.5 rounded-md text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
                            aria-label={t.delete}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
