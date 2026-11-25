import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { formatCurrency } from '../i18n/translations';
import type {
  CurrencyCode,
  DebtRecord,
  FamilyMember,
  InventoryItem,
  Transaction,
} from '../types/finance';

export interface ReportPayload {
  appName: string;
  periodLabel: string;
  currency: CurrencyCode;
  transactions: Transaction[];
  inventory: InventoryItem[];
  debts: DebtRecord[];
  familyMembers: FamilyMember[];
}

export function exportReportToExcel(payload: ReportPayload): void {
  const wb = XLSX.utils.book_new();

  const totalIncome = payload.transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = payload.transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalCogs = payload.transactions
    .filter((t) => t.scope === 'business' && t.type === 'income')
    .reduce((sum, t) => sum + t.cogs, 0);
  const bizRevenue = payload.transactions
    .filter((t) => t.scope === 'business' && t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const bizExpense = payload.transactions
    .filter((t) => t.scope === 'business' && t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const summarySheet = XLSX.utils.json_to_sheet([
    { Metric: 'Báo cáo / Report', Value: payload.appName },
    { Metric: 'Kỳ / Period', Value: payload.periodLabel },
    { Metric: 'Ngày xuất / Exported At', Value: new Date().toISOString().slice(0, 10) },
    { Metric: 'Tổng thu / Total Income', Value: totalIncome },
    { Metric: 'Tổng chi / Total Expense', Value: totalExpense },
    { Metric: 'Số dư ròng / Net Balance', Value: totalIncome - totalExpense },
    { Metric: 'Doanh thu kinh doanh / Business Revenue', Value: bizRevenue },
    { Metric: 'Giá vốn / COGS', Value: totalCogs },
    { Metric: 'Lợi nhuận kinh doanh / Business Profit', Value: bizRevenue - totalCogs - bizExpense },
  ]);
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

  const txRows = payload.transactions.map((t) => ({
    Date: t.date,
    Scope: t.scope,
    Type: t.type,
    Category: t.category,
    Amount: t.amount,
    COGS: t.cogs,
    Method: t.paymentMethod,
    Member: t.memberName,
    Note: t.note,
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(txRows), 'Transactions');

  const invRows = payload.inventory.map((i) => ({
    SKU: i.sku,
    Name: i.name,
    Category: i.category,
    Unit: i.unit,
    CostPrice: i.costPrice,
    SellPrice: i.sellPrice,
    Stock: i.stock,
    MinStock: i.minStock,
    InventoryValue: i.costPrice * i.stock,
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(invRows), 'Inventory');

  const debtRows = payload.debts.map((d) => ({
    Direction: d.direction,
    Counterparty: d.counterparty,
    TotalAmount: d.amount,
    PaidAmount: d.paidAmount,
    Remaining: Math.max(0, d.amount - d.paidAmount),
    DueDate: d.dueDate,
    Status: d.status,
    Note: d.note,
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(debtRows), 'Debts');

  const familyRows = payload.familyMembers.map((f) => ({
    Name: f.name,
    Relation: f.relation,
    MonthlyIncome: f.monthlyIncome,
    MonthlyBudget: f.monthlyBudget,
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(familyRows), 'Family');

  const filename = `bao-cao-tai-chinh-${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, filename);
}

/**
 * Renders crisp multi-page PDF via high-DPI HTML5 canvas so Vietnamese, Japanese,
 * and Korean Unicode glyphs always render accurately without missing-font boxes.
 */
export function exportReportToPdf(payload: ReportPayload): void {
  const width = 1240;
  const height = 1754;
  const margin = 72;

  const totalIncome = payload.transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = payload.transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  const bizRevenue = payload.transactions
    .filter((t) => t.scope === 'business' && t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const bizCogs = payload.transactions
    .filter((t) => t.scope === 'business' && t.type === 'income')
    .reduce((sum, t) => sum + t.cogs, 0);
  const bizExpense = payload.transactions
    .filter((t) => t.scope === 'business' && t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  const netBizProfit = bizRevenue - bizCogs - bizExpense;

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [width / 2, height / 2] });

  const createPageCanvas = () => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    return { canvas, ctx };
  };

  const { canvas: page1, ctx } = createPageCanvas();
  let y = 84;

  // Header
  ctx.fillStyle = '#09090b';
  ctx.font = '700 34px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(payload.appName, margin, y);

  ctx.fillStyle = '#0d9488';
  ctx.font = '600 18px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(
    `BÁO CÁO TÀI CHÍNH ĐỊNH KỲ · ${payload.periodLabel} · ${new Date().toISOString().slice(0, 10)}`,
    margin,
    y + 34
  );

  y += 60;
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(margin, y);
  ctx.lineTo(width - margin, y);
  ctx.stroke();

  // KPI Grid
  y += 36;
  const cardW = (width - margin * 2 - 48) / 4;
  const kpis = [
    { label: 'TỔNG THU NHẬP', val: formatCurrency(totalIncome, payload.currency), color: '#16a34a' },
    { label: 'TỔNG CHI TIÊU', val: formatCurrency(totalExpense, payload.currency), color: '#dc2626' },
    { label: 'SỐ DƯ RÒNG', val: formatCurrency(totalIncome - totalExpense, payload.currency), color: '#0f172a' },
    { label: 'LỢI NHUẬN KINH DOANH', val: formatCurrency(netBizProfit, payload.currency), color: '#0d9488' },
  ];

  kpis.forEach((k, idx) => {
    const x = margin + idx * (cardW + 16);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(x, y, cardW, 104);
    ctx.strokeStyle = '#e2e8f0';
    ctx.strokeRect(x, y, cardW, 104);
    ctx.fillStyle = '#64748b';
    ctx.font = '600 13px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(k.label, x + 16, y + 34);
    ctx.fillStyle = k.color;
    ctx.font = '700 22px "JetBrains Mono", monospace';
    ctx.fillText(k.val, x + 16, y + 72);
  });

  y += 148;

  // Transactions Table Header
  ctx.fillStyle = '#0f172a';
  ctx.font = '700 22px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('Chi tiết giao dịch gần đây', margin, y);
  y += 22;

  const drawTableHeader = (c: CanvasRenderingContext2D, topY: number) => {
    c.fillStyle = '#f1f5f9';
    c.fillRect(margin, topY, width - margin * 2, 42);
    c.fillStyle = '#475569';
    c.font = '700 15px "Plus Jakarta Sans", sans-serif';
    c.fillText('Ngày', margin + 12, topY + 27);
    c.fillText('Phân loại', margin + 150, topY + 27);
    c.fillText('Danh mục', margin + 290, topY + 27);
    c.fillText('Ghi chú', margin + 490, topY + 27);
    c.fillText('Số tiền', width - margin - 180, topY + 27);
    return topY + 42;
  };

  y = drawTableHeader(ctx, y);

  const txSlice = payload.transactions.slice(0, 22);
  txSlice.forEach((tx, idx) => {
    if (idx % 2 === 1) {
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(margin, y, width - margin * 2, 40);
    }
    ctx.strokeStyle = '#f1f5f9';
    ctx.beginPath();
    ctx.moveTo(margin, y + 40);
    ctx.lineTo(width - margin, y + 40);
    ctx.stroke();

    ctx.fillStyle = '#334155';
    ctx.font = '500 15px "JetBrains Mono", monospace';
    ctx.fillText(tx.date, margin + 12, y + 26);

    ctx.font = '500 15px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(tx.scope === 'business' ? 'Kinh doanh' : 'Cá nhân', margin + 150, y + 26);
    ctx.fillText(tx.category.slice(0, 18), margin + 290, y + 26);
    ctx.fillText((tx.note || '-').slice(0, 32), margin + 490, y + 26);

    ctx.fillStyle = tx.type === 'income' ? '#16a34a' : '#dc2626';
    ctx.font = '600 15px "JetBrains Mono", monospace';
    const prefix = tx.type === 'income' ? '+' : '-';
    ctx.fillText(`${prefix}${formatCurrency(tx.amount, payload.currency)}`, width - margin - 180, y + 26);
    y += 40;
  });

  pdf.addImage(page1.toDataURL('image/png'), 'PNG', 0, 0, width / 2, height / 2);

  // Page 2: Inventory & Debts Summary
  const { canvas: page2, ctx: ctx2 } = createPageCanvas();
  let y2 = 84;
  ctx2.fillStyle = '#09090b';
  ctx2.font = '700 26px "Plus Jakarta Sans", sans-serif';
  ctx2.fillText('Tồn kho kinh doanh & Công nợ', margin, y2);
  y2 += 30;

  ctx2.fillStyle = '#f1f5f9';
  ctx2.fillRect(margin, y2, width - margin * 2, 42);
  ctx2.fillStyle = '#475569';
  ctx2.font = '700 15px "Plus Jakarta Sans", sans-serif';
  ctx2.fillText('SKU', margin + 12, y2 + 27);
  ctx2.fillText('Sản phẩm', margin + 140, y2 + 27);
  ctx2.fillText('Giá nhập', margin + 520, y2 + 27);
  ctx2.fillText('Giá bán', margin + 720, y2 + 27);
  ctx2.fillText('Tồn kho', width - margin - 140, y2 + 27);
  y2 += 42;

  payload.inventory.slice(0, 12).forEach((item) => {
    ctx2.strokeStyle = '#f1f5f9';
    ctx2.beginPath();
    ctx2.moveTo(margin, y2 + 40);
    ctx2.lineTo(width - margin, y2 + 40);
    ctx2.stroke();
    ctx2.fillStyle = '#334155';
    ctx2.font = '500 15px "JetBrains Mono", monospace';
    ctx2.fillText(item.sku, margin + 12, y2 + 26);
    ctx2.font = '500 15px "Plus Jakarta Sans", sans-serif';
    ctx2.fillText(item.name.slice(0, 32), margin + 140, y2 + 26);
    ctx2.font = '500 15px "JetBrains Mono", monospace';
    ctx2.fillText(formatCurrency(item.costPrice, payload.currency), margin + 520, y2 + 26);
    ctx2.fillText(formatCurrency(item.sellPrice, payload.currency), margin + 720, y2 + 26);
    ctx2.fillStyle = item.stock <= item.minStock ? '#dc2626' : '#16a34a';
    ctx2.fillText(`${item.stock} ${item.unit}`, width - margin - 140, y2 + 26);
    y2 += 40;
  });

  y2 += 56;
  ctx2.fillStyle = '#09090b';
  ctx2.font = '700 22px "Plus Jakarta Sans", sans-serif';
  ctx2.fillText('Theo dõi công nợ & Hạn thanh toán', margin, y2);
  y2 += 24;

  ctx2.fillStyle = '#f1f5f9';
  ctx2.fillRect(margin, y2, width - margin * 2, 42);
  ctx2.fillStyle = '#475569';
  ctx2.font = '700 15px "Plus Jakarta Sans", sans-serif';
  ctx2.fillText('Loại', margin + 12, y2 + 27);
  ctx2.fillText('Đối tác', margin + 160, y2 + 27);
  ctx2.fillText('Hạn thanh toán', margin + 480, y2 + 27);
  ctx2.fillText('Trạng thái', margin + 680, y2 + 27);
  ctx2.fillText('Còn lại', width - margin - 180, y2 + 27);
  y2 += 42;

  payload.debts.slice(0, 12).forEach((d) => {
    ctx2.strokeStyle = '#f1f5f9';
    ctx2.beginPath();
    ctx2.moveTo(margin, y2 + 40);
    ctx2.lineTo(width - margin, y2 + 40);
    ctx2.stroke();
    ctx2.fillStyle = '#334155';
    ctx2.font = '500 15px "Plus Jakarta Sans", sans-serif';
    ctx2.fillText(d.direction === 'payable' ? 'Phải trả' : 'Phải thu', margin + 12, y2 + 26);
    ctx2.fillText(d.counterparty.slice(0, 26), margin + 160, y2 + 26);
    ctx2.font = '500 15px "JetBrains Mono", monospace';
    ctx2.fillText(d.dueDate, margin + 480, y2 + 26);
    ctx2.fillText(d.status.toUpperCase(), margin + 680, y2 + 26);
    ctx2.fillText(
      formatCurrency(Math.max(0, d.amount - d.paidAmount), payload.currency),
      width - margin - 180,
      y2 + 26
    );
    y2 += 40;
  });

  pdf.addPage([width / 2, height / 2], 'portrait');
  pdf.addImage(page2.toDataURL('image/png'), 'PNG', 0, 0, width / 2, height / 2);

  pdf.save(`bao-cao-tai-chinh-${new Date().toISOString().slice(0, 10)}.pdf`);
}
