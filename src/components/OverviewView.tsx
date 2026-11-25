import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  Download,
  FileSpreadsheet,
  FileText,
  Plus,
  QrCode,
  TrendingUp,
} from 'lucide-react';
import { formatCurrency, type TranslationDict } from '../i18n/translations';
import { exportReportToExcel, exportReportToPdf } from '../lib/exportReports';
import type {
  CurrencyCode,
  DebtRecord,
  FamilyMember,
  InventoryItem,
  NavTab,
  Transaction,
} from '../types/finance';
import { CategoryBreakdownChart, CashflowTrendChart } from './Charts';

interface Props {
  transactions: Transaction[];
  inventory: InventoryItem[];
  debts: DebtRecord[];
  familyMembers: FamilyMember[];
  currency: CurrencyCode;
  hideAmounts: boolean;
  canEdit: boolean;
  t: TranslationDict;
  onAddTransaction: () => void;
  onOpenQr: () => void;
  onNavigate: (tab: NavTab) => void;
}

export const OverviewView: React.FC<Props> = ({
  transactions,
  inventory,
  debts,
  familyMembers,
  currency,
  hideAmounts,
  canEdit,
  t,
  onAddTransaction,
  onOpenQr,
  onNavigate,
}) => {
  const [period, setPeriod] = useState<'week' | 'month' | 'all'>('month');

  const today = new Date().toISOString().slice(0, 10);

  const filteredTransactions = useMemo(() => {
    if (period === 'all') return transactions;
    const now = new Date();
    const cutoff = new Date();
    if (period === 'week') cutoff.setDate(now.getDate() - 7);
    if (period === 'month') cutoff.setDate(1);
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    return transactions.filter((tx) => tx.date >= cutoffStr);
  }, [transactions, period]);

  const metrics = useMemo(() => {
    const totalIncome = filteredTransactions
      .filter((tx) => tx.type === 'income')
      .reduce((s, tx) => s + tx.amount, 0);
    const totalExpense = filteredTransactions
      .filter((tx) => tx.type === 'expense')
      .reduce((s, tx) => s + tx.amount, 0);
    const personalSpend = filteredTransactions
      .filter((tx) => tx.scope === 'personal' && tx.type === 'expense')
      .reduce((s, tx) => s + tx.amount, 0);

    const bizRev = filteredTransactions
      .filter((tx) => tx.scope === 'business' && tx.type === 'income')
      .reduce((s, tx) => s + tx.amount, 0);
    const bizCogs = filteredTransactions
      .filter((tx) => tx.scope === 'business' && tx.type === 'income')
      .reduce((s, tx) => s + tx.cogs, 0);
    const bizExp = filteredTransactions
      .filter((tx) => tx.scope === 'business' && tx.type === 'expense')
      .reduce((s, tx) => s + tx.amount, 0);

    const overdueDebts = debts.filter((d) => d.status !== 'paid' && d.dueDate < today);

    return {
      netBalance: totalIncome - totalExpense,
      personalSpend,
      bizNetProfit: bizRev - bizCogs - bizExp,
      overdueCount: overdueDebts.length,
    };
  }, [filteredTransactions, debts, today]);

  const periodLabel =
    period === 'week' ? t.dateRangeWeek : period === 'month' ? t.dateRangeMonth : t.dateRangeAll;

  const handleExportPdf = () => {
    exportReportToPdf({
      appName: t.appName,
      periodLabel,
      currency,
      transactions: filteredTransactions,
      inventory,
      debts,
      familyMembers,
    });
  };

  const handleExportExcel = () => {
    exportReportToExcel({
      appName: t.appName,
      periodLabel,
      currency,
      transactions: filteredTransactions,
      inventory,
      debts,
      familyMembers,
    });
  };

  return (
    <div className="space-y-6">
      {/* Toolbar: Period filter & Report Exports */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
          {(['week', 'month', 'all'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                period === p
                  ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
              }`}
            >
              {p === 'week' ? t.dateRangeWeek : p === 'month' ? t.dateRangeMonth : t.dateRangeAll}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportPdf}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-xs font-medium text-slate-700 dark:text-zinc-200 transition-colors whitespace-nowrap"
          >
            <FileText className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            <span>{t.exportPdf}</span>
          </button>
          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-xs font-medium text-slate-700 dark:text-zinc-200 transition-colors whitespace-nowrap"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{t.exportExcel}</span>
          </button>
          <button
            type="button"
            onClick={onOpenQr}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-xs font-medium text-slate-700 dark:text-zinc-200 transition-colors whitespace-nowrap"
          >
            <QrCode className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span>{t.qrPayScan}</span>
          </button>
          {canEdit && (
            <button
              type="button"
              onClick={onAddTransaction}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium transition-colors whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t.addTransaction}</span>
            </button>
          )}
        </div>
      </div>

      {/* Overdue Alert Banner */}
      {metrics.overdueCount > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30">
          <div className="flex items-center gap-2.5 text-sm text-rose-800 dark:text-rose-200">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>
              {t.overdueAlertBanner} ({metrics.overdueCount})
            </span>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('debts')}
            className="text-xs font-semibold text-rose-700 dark:text-rose-300 hover:underline whitespace-nowrap"
          >
            {t.viewAll}
          </button>
        </div>
      )}

      {/* 4-Column KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-2">
          <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">
            {t.totalBalance}
          </span>
          <div className="text-2xl font-semibold font-mono tabular-nums text-slate-900 dark:text-zinc-100">
            {formatCurrency(metrics.netBalance, currency, hideAmounts)}
          </div>
          <div className="text-xs text-slate-500 dark:text-zinc-400">{periodLabel}</div>
        </div>

        <div className="p-5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-2">
          <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">
            {t.personalExpenses}
          </span>
          <div className="text-2xl font-semibold font-mono tabular-nums text-rose-600 dark:text-rose-400">
            {formatCurrency(metrics.personalSpend, currency, hideAmounts)}
          </div>
          <div className="text-xs text-slate-500 dark:text-zinc-400">{t.scopePersonal}</div>
        </div>

        <div className="p-5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-2">
          <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">
            {t.businessNetProfit}
          </span>
          <div className="text-2xl font-semibold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
            {formatCurrency(metrics.bizNetProfit, currency, hideAmounts)}
          </div>
          <div className="text-xs text-slate-500 dark:text-zinc-400">{t.scopeBusiness}</div>
        </div>

        <div className="p-5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-2">
          <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">
            {t.overdueDebtsCount}
          </span>
          <div
            className={`text-2xl font-semibold font-mono tabular-nums ${
              metrics.overdueCount > 0
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {metrics.overdueCount}
          </div>
          <div className="text-xs text-slate-500 dark:text-zinc-400">
            {metrics.overdueCount > 0 ? t.statusOverdue : t.statusPaid}
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
              {t.cashflowTrend}
            </h2>
            <TrendingUp className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          </div>
          <CashflowTrendChart
            transactions={filteredTransactions}
            currency={currency}
            hideAmounts={hideAmounts}
            t={t}
          />
        </div>

        <div className="p-5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-4">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
            {t.expenseBreakdown}
          </h2>
          <CategoryBreakdownChart
            transactions={filteredTransactions}
            currency={currency}
            hideAmounts={hideAmounts}
            t={t}
          />
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
            {t.recentTransactions}
          </h2>
          <button
            type="button"
            onClick={() => onNavigate('personal')}
            className="text-xs font-medium text-teal-600 dark:text-teal-400 hover:underline"
          >
            {t.viewAll}
          </button>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="p-8 text-center space-y-3">
            <p className="text-sm text-slate-500 dark:text-zinc-400">{t.emptyTransactions}</p>
            {canEdit && (
              <button
                type="button"
                onClick={onAddTransaction}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-teal-600 text-white text-xs font-medium hover:bg-teal-700"
              >
                <Download className="w-3.5 h-3.5 rotate-180" />
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
                  <th className="py-3 px-5 text-right">{t.amount}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                {filteredTransactions.slice(0, 6).map((tx) => (
                  <tr
                    key={tx.id}
                    className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <td className="py-3 px-5 font-mono tabular-nums text-xs text-slate-500 dark:text-zinc-400 whitespace-nowrap">
                      {tx.date}
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-slate-900 dark:text-zinc-100 font-medium">
                        {tx.category}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-zinc-400">
                        {tx.scope === 'business' ? t.scopeBusiness : t.scopePersonal} ·{' '}
                        {tx.paymentMethod}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-zinc-300 whitespace-nowrap">
                      {tx.memberName || '-'}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-zinc-400 max-w-xs truncate">
                      {tx.note || '-'}
                    </td>
                    <td
                      className={`py-3 px-5 text-right font-mono tabular-nums font-medium whitespace-nowrap ${
                        tx.type === 'income'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {tx.type === 'income' ? '+' : '-'}
                      {formatCurrency(tx.amount, currency, hideAmounts)}
                    </td>
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
