import React, { useMemo, useState } from 'react';
import { Plus, Trash2, Users } from 'lucide-react';
import { formatCurrency, type TranslationDict } from '../i18n/translations';
import { SCHEMA_LIMITS, type CurrencyCode, type FamilyMember, type Transaction } from '../types/finance';
import { FamilyComparisonChart } from './Charts';

interface Props {
  members: FamilyMember[];
  transactions: Transaction[];
  currency: CurrencyCode;
  hideAmounts: boolean;
  canEdit: boolean;
  t: TranslationDict;
  onSaveMember: (member: Omit<FamilyMember, 'id' | 'workspaceId' | 'createdBy'>) => void;
  onDeleteMember: (id: string) => void;
}

export const FamilyCompareView: React.FC<Props> = ({
  members,
  transactions,
  currency,
  hideAmounts,
  canEdit,
  t,
  onSaveMember,
  onDeleteMember,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [relation, setRelation] = useState('');
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [monthlyBudget, setMonthlyBudget] = useState('');

  const summary = useMemo(() => {
    const totalIncome = members.reduce((s, m) => s + m.monthlyIncome, 0);
    const monthPrefix = new Date().toISOString().slice(0, 7);
    const totalSpend = transactions
      .filter((tx) => tx.scope === 'personal' && tx.type === 'expense' && tx.date.startsWith(monthPrefix))
      .reduce((s, tx) => s + tx.amount, 0);
    const surplus = totalIncome - totalSpend;
    const savingsRate = totalIncome > 0 ? (surplus / totalIncome) * 100 : 0;
    return { totalIncome, totalSpend, surplus, savingsRate };
  }, [members, transactions]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSaveMember({
      name: name.trim().slice(0, SCHEMA_LIMITS.MAX_DISPLAY_NAME),
      relation: relation.trim().slice(0, SCHEMA_LIMITS.MAX_RELATION) || 'Thành viên',
      monthlyIncome: Math.max(0, Number(monthlyIncome) || 0),
      monthlyBudget: Math.max(0, Number(monthlyBudget) || 0),
    });
    setName('');
    setRelation('');
    setMonthlyIncome('');
    setMonthlyBudget('');
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Header & Add button */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-zinc-100">
            {t.familyTitle}
          </h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">{t.familySubtitle}</p>
        </div>
        {canEdit && (
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.addFamilyMember}</span>
          </button>
        )}
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-1">
          <span className="text-xs text-slate-500 dark:text-zinc-400">{t.householdIncomeTotal}</span>
          <div className="text-xl font-semibold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
            {formatCurrency(summary.totalIncome, currency, hideAmounts)}
          </div>
        </div>
        <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-1">
          <span className="text-xs text-slate-500 dark:text-zinc-400">{t.householdSpendTotal}</span>
          <div className="text-xl font-semibold font-mono tabular-nums text-rose-600 dark:text-rose-400">
            {formatCurrency(summary.totalSpend, currency, hideAmounts)}
          </div>
        </div>
        <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-1">
          <span className="text-xs text-slate-500 dark:text-zinc-400">{t.householdSurplus}</span>
          <div className="text-xl font-semibold font-mono tabular-nums text-slate-900 dark:text-zinc-100">
            {formatCurrency(summary.surplus, currency, hideAmounts)}
          </div>
        </div>
        <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-1">
          <span className="text-xs text-slate-500 dark:text-zinc-400">{t.savingsRate}</span>
          <div className="text-xl font-semibold font-mono tabular-nums text-teal-600 dark:text-teal-400">
            {summary.savingsRate.toFixed(1)}%
          </div>
        </div>
      </div>

      {showForm && canEdit && (
        <form
          onSubmit={handleSubmit}
          className="p-5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3"
        >
          <input
            type="text"
            required
            placeholder={t.member}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-xs"
          />
          <input
            type="text"
            required
            placeholder={t.relation}
            value={relation}
            onChange={(e) => setRelation(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-xs"
          />
          <input
            type="number"
            required
            min={0}
            placeholder={t.monthlyIncome}
            value={monthlyIncome}
            onChange={(e) => setMonthlyIncome(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-xs font-mono"
          />
          <input
            type="number"
            required
            min={0}
            placeholder={t.monthlyBudget}
            value={monthlyBudget}
            onChange={(e) => setMonthlyBudget(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-xs font-mono"
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

      {/* Comparison Chart */}
      <div className="p-5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
            {t.familyTitle}
          </h3>
          <Users className="w-4 h-4 text-teal-600 dark:text-teal-400" />
        </div>
        <FamilyComparisonChart
          members={members}
          transactions={transactions}
          currency={currency}
          hideAmounts={hideAmounts}
          t={t}
        />
      </div>

      {/* Members Table */}
      <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-zinc-800 text-left text-xs font-medium text-slate-500 dark:text-zinc-400">
                <th className="py-3 px-5">{t.member}</th>
                <th className="py-3 px-4">{t.relation}</th>
                <th className="py-3 px-4 text-right">{t.monthlyIncome}</th>
                <th className="py-3 px-4 text-right">{t.monthlyBudget}</th>
                <th className="py-3 px-4 text-right">{t.actualSpent}</th>
                {canEdit && <th className="py-3 px-5 text-right">{t.actions}</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
              {members.map((m) => {
                const spent = transactions
                  .filter((tx) => tx.type === 'expense' && tx.memberName === m.name)
                  .reduce((s, tx) => s + tx.amount, 0);
                return (
                  <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/50">
                    <td className="py-3 px-5 font-medium text-slate-900 dark:text-zinc-100">
                      {m.name}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-zinc-400">{m.relation}</td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(m.monthlyIncome, currency, hideAmounts)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700 dark:text-zinc-300">
                      {formatCurrency(m.monthlyBudget, currency, hideAmounts)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-rose-600 dark:text-rose-400">
                      {formatCurrency(spent, currency, hideAmounts)}
                    </td>
                    {canEdit && (
                      <td className="py-3 px-5 text-right">
                        <button
                          type="button"
                          onClick={() => onDeleteMember(m.id)}
                          className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
                          aria-label={t.delete}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
