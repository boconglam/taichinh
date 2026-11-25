import React, { useMemo, useState } from 'react';
import { formatCurrency, type TranslationDict } from '../i18n/translations';
import type { CurrencyCode, FamilyMember, Transaction } from '../types/finance';

interface CashflowChartProps {
  transactions: Transaction[];
  currency: CurrencyCode;
  hideAmounts: boolean;
  t: TranslationDict;
}

export const CashflowTrendChart: React.FC<CashflowChartProps> = ({
  transactions,
  currency,
  hideAmounts,
  t,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const buckets = useMemo(() => {
    const map = new Map<string, { label: string; income: number; expense: number }>();
    const sorted = [...transactions].sort((a, b) => a.date.localeCompare(b.date));
    sorted.forEach((tx) => {
      const key = tx.date.slice(0, 10);
      const existing = map.get(key) || { label: key.slice(5), income: 0, expense: 0 };
      if (tx.type === 'income') existing.income += tx.amount;
      else existing.expense += tx.amount;
      map.set(key, existing);
    });
    const list = Array.from(map.values()).slice(-8);
    if (list.length === 0) {
      return [{ label: '--', income: 0, expense: 0 }];
    }
    return list;
  }, [transactions]);

  const maxVal = Math.max(
    1,
    ...buckets.flatMap((b) => [b.income, b.expense])
  );

  const chartH = 200;
  const chartW = 640;
  const padL = 16;
  const padR = 16;
  const padT = 16;
  const padB = 32;
  const innerW = chartW - padL - padR;
  const innerH = chartH - padT - padB;
  const groupW = innerW / buckets.length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-5 text-xs text-slate-600 dark:text-zinc-400">
          <span className="inline-flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 inline-block" />
            {t.incomeLabel}
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-xs bg-rose-500 inline-block" />
            {t.expenseLabel}
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="w-4 h-0.5 bg-teal-500 inline-block" />
            {t.profitLabel}
          </span>
        </div>
        {hoveredIdx !== null && buckets[hoveredIdx] && (
          <div className="text-xs font-mono tabular-nums text-slate-700 dark:text-zinc-300">
            <span>{buckets[hoveredIdx].label}</span>
            <span className="mx-2 text-slate-400">·</span>
            <span className="text-emerald-600 dark:text-emerald-400">
              +{formatCurrency(buckets[hoveredIdx].income, currency, hideAmounts)}
            </span>
            <span className="mx-2 text-slate-400">/</span>
            <span className="text-rose-600 dark:text-rose-400">
              -{formatCurrency(buckets[hoveredIdx].expense, currency, hideAmounts)}
            </span>
          </div>
        )}
      </div>

      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${chartW} ${chartH}`}
          className="w-full h-52 min-w-[420px]"
          role="img"
          aria-label={t.cashflowTrend}
        >
          {[0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = padT + innerH * (1 - ratio);
            return (
              <line
                key={ratio}
                x1={padL}
                x2={chartW - padR}
                y1={y}
                y2={y}
                className="stroke-slate-200 dark:stroke-zinc-800"
                strokeDasharray="3 3"
                strokeWidth={1}
              />
            );
          })}

          {buckets.map((b, i) => {
            const centerX = padL + i * groupW + groupW / 2;
            const barW = Math.min(20, groupW * 0.28);
            const incH = (b.income / maxVal) * innerH;
            const expH = (b.expense / maxVal) * innerH;
            return (
              <g
                key={`${b.label}-${i}`}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="cursor-pointer"
              >
                <rect
                  x={centerX - barW - 2}
                  y={padT + innerH - incH}
                  width={barW}
                  height={Math.max(2, incH)}
                  rx={3}
                  className="fill-emerald-500/90 hover:fill-emerald-400 transition-colors"
                />
                <rect
                  x={centerX + 2}
                  y={padT + innerH - expH}
                  width={barW}
                  height={Math.max(2, expH)}
                  rx={3}
                  className="fill-rose-500/85 hover:fill-rose-400 transition-colors"
                />
                <text
                  x={centerX}
                  y={chartH - 8}
                  textAnchor="middle"
                  className="fill-slate-500 dark:fill-zinc-400 text-[11px] font-mono"
                >
                  {b.label}
                </text>
              </g>
            );
          })}

          {buckets.length > 1 && (
            <polyline
              fill="none"
              className="stroke-teal-500"
              strokeWidth={2}
              points={buckets
                .map((b, i) => {
                  const cx = padL + i * groupW + groupW / 2;
                  const net = Math.max(0, b.income - b.expense);
                  const y = padT + innerH - (net / maxVal) * innerH;
                  return `${cx},${y}`;
                })
                .join(' ')}
            />
          )}
        </svg>
      </div>
    </div>
  );
};

interface CategoryChartProps {
  transactions: Transaction[];
  currency: CurrencyCode;
  hideAmounts: boolean;
  t: TranslationDict;
}

const CATEGORY_COLORS = [
  'bg-teal-500',
  'bg-sky-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-emerald-500',
  'bg-indigo-500',
];

export const CategoryBreakdownChart: React.FC<CategoryChartProps> = ({
  transactions,
  currency,
  hideAmounts,
  t,
}) => {
  const { items, total } = useMemo(() => {
    const map = new Map<string, number>();
    let sum = 0;
    transactions
      .filter((tx) => tx.type === 'expense')
      .forEach((tx) => {
        map.set(tx.category, (map.get(tx.category) || 0) + tx.amount);
        sum += tx.amount;
      });
    const list = Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
    return { items: list, total: sum };
  }, [transactions]);

  if (items.length === 0) {
    return (
      <p className="text-sm text-slate-500 dark:text-zinc-400 py-8 text-center">
        {t.emptyTransactions}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="h-2.5 w-full rounded-full overflow-hidden flex bg-slate-100 dark:bg-zinc-800">
        {items.map((item, idx) => {
          const pct = total > 0 ? (item.value / total) * 100 : 0;
          return (
            <div
              key={item.name}
              style={{ width: `${pct}%` }}
              className={`${CATEGORY_COLORS[idx % CATEGORY_COLORS.length]} h-full`}
              title={`${item.name}: ${pct.toFixed(1)}%`}
            />
          );
        })}
      </div>

      <div className="space-y-2.5">
        {items.map((item, idx) => {
          const pct = total > 0 ? (item.value / total) * 100 : 0;
          return (
            <div key={item.name} className="flex items-center justify-between gap-3 text-sm">
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className={`w-2.5 h-2.5 rounded-xs shrink-0 ${
                    CATEGORY_COLORS[idx % CATEGORY_COLORS.length]
                  }`}
                />
                <span className="truncate text-slate-700 dark:text-zinc-300">{item.name}</span>
              </div>
              <div className="flex items-center gap-3 shrink-0 font-mono tabular-nums text-xs">
                <span className="text-slate-500 dark:text-zinc-400">{pct.toFixed(1)}%</span>
                <span className="font-medium text-slate-900 dark:text-zinc-100">
                  {formatCurrency(item.value, currency, hideAmounts)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface FamilyChartProps {
  members: FamilyMember[];
  transactions: Transaction[];
  currency: CurrencyCode;
  hideAmounts: boolean;
  t: TranslationDict;
}

export const FamilyComparisonChart: React.FC<FamilyChartProps> = ({
  members,
  transactions,
  currency,
  hideAmounts,
  t,
}) => {
  const rows = useMemo(() => {
    return members.map((m) => {
      const spent = transactions
        .filter((tx) => tx.type === 'expense' && tx.memberName === m.name)
        .reduce((s, tx) => s + tx.amount, 0);
      return {
        ...m,
        spent,
        maxScale: Math.max(m.monthlyIncome, m.monthlyBudget, spent, 1),
      };
    });
  }, [members, transactions]);

  const globalMax = Math.max(1, ...rows.map((r) => r.maxScale));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-5 text-xs text-slate-600 dark:text-zinc-400">
        <span className="inline-flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-xs bg-teal-500 inline-block" />
          {t.monthlyIncome}
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-xs bg-amber-500 inline-block" />
          {t.monthlyBudget}
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-xs bg-rose-500 inline-block" />
          {t.actualSpent}
        </span>
      </div>

      <div className="space-y-4">
        {rows.map((r) => (
          <div key={r.id} className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <div>
                <span className="font-medium text-slate-900 dark:text-zinc-100">{r.name}</span>
                <span className="mx-2 text-slate-400">·</span>
                <span className="text-xs text-slate-500 dark:text-zinc-400">{r.relation}</span>
              </div>
              <span className="font-mono tabular-nums text-xs text-slate-600 dark:text-zinc-300">
                {formatCurrency(r.monthlyIncome, currency, hideAmounts)} /{' '}
                {formatCurrency(r.spent, currency, hideAmounts)}
              </span>
            </div>

            <div className="space-y-1">
              <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                <div
                  className="h-full bg-teal-500 rounded-full"
                  style={{ width: `${Math.min(100, (r.monthlyIncome / globalMax) * 100)}%` }}
                />
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full"
                  style={{ width: `${Math.min(100, (r.monthlyBudget / globalMax) * 100)}%` }}
                />
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                <div
                  className="h-full bg-rose-500 rounded-full"
                  style={{ width: `${Math.min(100, (r.spent / globalMax) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
