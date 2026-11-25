import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, PackagePlus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { formatCurrency, type TranslationDict } from '../i18n/translations';
import { SCHEMA_LIMITS, type CurrencyCode, type InventoryItem, type Transaction } from '../types/finance';

interface Props {
  transactions: Transaction[];
  inventory: InventoryItem[];
  currency: CurrencyCode;
  hideAmounts: boolean;
  canEdit: boolean;
  t: TranslationDict;
  onSaveInventory: (item: Omit<InventoryItem, 'id' | 'workspaceId' | 'createdBy'>, existingId?: string) => void;
  onDeleteInventory: (id: string) => void;
  onRecordSale: (item: InventoryItem, qty: number, note: string) => void;
  onRestock: (item: InventoryItem, qty: number) => void;
}

export const BusinessInventoryView: React.FC<Props> = ({
  transactions,
  inventory,
  currency,
  hideAmounts,
  canEdit,
  t,
  onSaveInventory,
  onDeleteInventory,
  onRecordSale,
  onRestock,
}) => {
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [saleItem, setSaleItem] = useState<InventoryItem | null>(null);
  const [restockItem, setRestockItem] = useState<InventoryItem | null>(null);

  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Đồ uống');
  const [costPrice, setCostPrice] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [stock, setStock] = useState('20');
  const [minStock, setMinStock] = useState('5');
  const [unit, setUnit] = useState('Cái');

  const [qtyInput, setQtyInput] = useState('1');
  const [saleNote, setSaleNote] = useState('');

  const profitStats = useMemo(() => {
    const bizTx = transactions.filter((tx) => tx.scope === 'business');
    const grossRevenue = bizTx
      .filter((tx) => tx.type === 'income')
      .reduce((s, tx) => s + tx.amount, 0);
    const totalCogs = bizTx
      .filter((tx) => tx.type === 'income')
      .reduce((s, tx) => s + tx.cogs, 0);
    const opExpenses = bizTx
      .filter((tx) => tx.type === 'expense')
      .reduce((s, tx) => s + tx.amount, 0);
    const netProfit = grossRevenue - totalCogs - opExpenses;
    const margin = grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0;

    return { grossRevenue, totalCogs, opExpenses, netProfit, margin };
  }, [transactions]);

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sku.trim() || !name.trim()) return;
    onSaveInventory({
      sku: sku.trim().slice(0, SCHEMA_LIMITS.MAX_SKU),
      name: name.trim().slice(0, SCHEMA_LIMITS.MAX_PRODUCT_NAME),
      category: category.trim().slice(0, SCHEMA_LIMITS.MAX_CATEGORY) || 'General',
      costPrice: Math.max(0, Number(costPrice) || 0),
      sellPrice: Math.max(0, Number(sellPrice) || 0),
      stock: Math.max(0, Number(stock) || 0),
      minStock: Math.max(0, Number(minStock) || 0),
      unit: unit.trim().slice(0, SCHEMA_LIMITS.MAX_UNIT) || 'pcs',
    });
    setSku('');
    setName('');
    setCostPrice('');
    setSellPrice('');
    setShowAddProduct(false);
  };

  return (
    <div className="space-y-6">
      {/* Detailed Profit Analytics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-1">
          <span className="text-xs text-slate-500 dark:text-zinc-400">{t.grossRevenue}</span>
          <div className="text-lg font-semibold font-mono tabular-nums text-slate-900 dark:text-zinc-100">
            {formatCurrency(profitStats.grossRevenue, currency, hideAmounts)}
          </div>
        </div>
        <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-1">
          <span className="text-xs text-slate-500 dark:text-zinc-400">{t.totalCogs}</span>
          <div className="text-lg font-semibold font-mono tabular-nums text-amber-600 dark:text-amber-400">
            {formatCurrency(profitStats.totalCogs, currency, hideAmounts)}
          </div>
        </div>
        <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-1">
          <span className="text-xs text-slate-500 dark:text-zinc-400">{t.operatingExpenses}</span>
          <div className="text-lg font-semibold font-mono tabular-nums text-rose-600 dark:text-rose-400">
            {formatCurrency(profitStats.opExpenses, currency, hideAmounts)}
          </div>
        </div>
        <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-1">
          <span className="text-xs text-slate-500 dark:text-zinc-400">{t.netProfit}</span>
          <div
            className={`text-lg font-semibold font-mono tabular-nums ${
              profitStats.netProfit >= 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {formatCurrency(profitStats.netProfit, currency, hideAmounts)}
          </div>
        </div>
        <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-1">
          <span className="text-xs text-slate-500 dark:text-zinc-400">{t.profitMargin}</span>
          <div className="text-lg font-semibold font-mono tabular-nums text-teal-600 dark:text-teal-400">
            {profitStats.margin.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Inventory Section */}
      <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
            {t.inventoryTitle}
          </h2>
          {canEdit && (
            <button
              type="button"
              onClick={() => setShowAddProduct((v) => !v)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t.addProduct}</span>
            </button>
          )}
        </div>

        {showAddProduct && canEdit && (
          <form
            onSubmit={handleCreateProduct}
            className="p-5 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
          >
            <input
              type="text"
              required
              placeholder={t.sku}
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-mono"
            />
            <input
              type="text"
              required
              placeholder={t.productName}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs"
            />
            <input
              type="number"
              required
              min={0}
              placeholder={t.costPrice}
              value={costPrice}
              onChange={(e) => setCostPrice(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-mono"
            />
            <input
              type="number"
              required
              min={0}
              placeholder={t.sellPrice}
              value={sellPrice}
              onChange={(e) => setSellPrice(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-mono"
            />
            <input
              type="number"
              required
              min={0}
              placeholder={t.stockQty}
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-mono"
            />
            <input
              type="number"
              required
              min={0}
              placeholder={t.minStock}
              value={minStock}
              onChange={(e) => setMinStock(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-mono"
            />
            <input
              type="text"
              required
              placeholder={t.unit}
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs"
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
                onClick={() => setShowAddProduct(false)}
                className="px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 text-xs"
              >
                {t.cancel}
              </button>
            </div>
          </form>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-zinc-800 text-left text-xs font-medium text-slate-500 dark:text-zinc-400">
                <th className="py-3 px-5">{t.sku}</th>
                <th className="py-3 px-4">{t.productName}</th>
                <th className="py-3 px-4 text-right">{t.costPrice}</th>
                <th className="py-3 px-4 text-right">{t.sellPrice}</th>
                <th className="py-3 px-4 text-right">{t.stockQty}</th>
                <th className="py-3 px-4">Trạng thái</th>
                {canEdit && <th className="py-3 px-5 text-right">{t.actions}</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
              {inventory.map((item) => {
                const isLow = item.stock <= item.minStock;
                return (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <td className="py-3 px-5 font-mono text-xs text-slate-500 dark:text-zinc-400">
                      {item.sku}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900 dark:text-zinc-100">
                        {item.name}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-zinc-400">
                        {item.category} · {item.unit}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-600 dark:text-zinc-300">
                      {formatCurrency(item.costPrice, currency, hideAmounts)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-medium text-slate-900 dark:text-zinc-100">
                      {formatCurrency(item.sellPrice, currency, hideAmounts)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold">
                      {item.stock} {item.unit}
                    </td>
                    <td className="py-3 px-4">
                      {isLow ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          {t.lowStockLabel}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {t.inStockLabel}
                        </span>
                      )}
                    </td>
                    {canEdit && (
                      <td className="py-3 px-5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={item.stock <= 0}
                            onClick={() => {
                              setSaleItem(item);
                              setQtyInput('1');
                              setSaleNote(`Bán ${item.name}`);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium disabled:opacity-40"
                          >
                            <ShoppingBag className="w-3 h-3" />
                            <span>{t.recordSale}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setRestockItem(item);
                              setQtyInput('10');
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-zinc-700 text-xs font-medium text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800"
                          >
                            <PackagePlus className="w-3 h-3" />
                            <span>{t.restock}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteInventory(item.id)}
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

      {/* Sale / Restock Quick Modals */}
      {saleItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const qty = Math.max(1, Math.min(saleItem.stock, Number(qtyInput) || 1));
              onRecordSale(saleItem, qty, saleNote);
              setSaleItem(null);
            }}
            className="w-full max-w-sm rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-4"
          >
            <h3 className="text-base font-semibold text-slate-900 dark:text-zinc-100">
              {t.recordSale} · {saleItem.name}
            </h3>
            <div>
              <label className="block text-xs text-slate-500 mb-1">
                {t.quantity} (Max: {saleItem.stock} {saleItem.unit})
              </label>
              <input
                type="number"
                min={1}
                max={saleItem.stock}
                value={qtyInput}
                onChange={(e) => setQtyInput(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 font-mono text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">{t.note}</label>
              <input
                type="text"
                value={saleNote}
                onChange={(e) => setSaleNote(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm"
              />
            </div>
            <div className="text-xs font-mono text-slate-600 dark:text-zinc-300">
              {t.grossRevenue}:{' '}
              {formatCurrency(
                saleItem.sellPrice * Math.max(1, Number(qtyInput) || 1),
                currency,
                hideAmounts
              )}
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSaleItem(null)}
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

      {restockItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const qty = Math.max(1, Number(qtyInput) || 1);
              onRestock(restockItem, qty);
              setRestockItem(null);
            }}
            className="w-full max-w-sm rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-4"
          >
            <h3 className="text-base font-semibold text-slate-900 dark:text-zinc-100">
              {t.restock} · {restockItem.name}
            </h3>
            <div>
              <label className="block text-xs text-slate-500 mb-1">{t.quantity}</label>
              <input
                type="number"
                min={1}
                value={qtyInput}
                onChange={(e) => setQtyInput(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 font-mono text-sm"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRestockItem(null)}
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
