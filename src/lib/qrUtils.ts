import QRCode from 'qrcode';
import jsQR from 'jsqr';

export interface BankOption {
  bin: string;
  shortName: string;
  name: string;
  code?: string;
  isCustom?: boolean;
}

const BANKS_CACHE_KEY = 'smart_ledger_banks_v1';

export const POPULAR_BANKS: BankOption[] = [
  { bin: '970405', shortName: 'Agribank', name: 'Ngân hàng Nông nghiệp và Phát triển Nông thôn VN', code: 'VBA' },
  { bin: '970436', shortName: 'Vietcombank', name: 'Ngân hàng TMCP Ngoại thương Việt Nam', code: 'VCB' },
  { bin: '970407', shortName: 'Techcombank', name: 'Ngân hàng TMCP Kỹ thương Việt Nam', code: 'TCB' },
  { bin: '970422', shortName: 'MB Bank', name: 'Ngân hàng TMCP Quân đội', code: 'MB' },
  { bin: '970418', shortName: 'BIDV', name: 'Ngân hàng TMCP Đầu tư và Phát triển VN', code: 'BIDV' },
  { bin: '970415', shortName: 'VietinBank', name: 'Ngân hàng TMCP Công thương Việt Nam', code: 'ICB' },
  { bin: '970416', shortName: 'ACB', name: 'Ngân hàng TMCP Á Châu', code: 'ACB' },
  { bin: '970432', shortName: 'VPBank', name: 'Ngân hàng TMCP Việt Nam Thịnh Vượng', code: 'VPB' },
  { bin: '970423', shortName: 'TPBank', name: 'Ngân hàng TMCP Tiên Phong', code: 'TPB' },
  { bin: '970403', shortName: 'Sacombank', name: 'Ngân hàng TMCP Sài Gòn Thương Tín', code: 'STB' },
  { bin: '970437', shortName: 'HDBank', name: 'Ngân hàng TMCP Phát triển TP.HCM', code: 'HDB' },
  { bin: '970441', shortName: 'VIB', name: 'Ngân hàng TMCP Quốc tế Việt Nam', code: 'VIB' },
  { bin: '970443', shortName: 'SHB', name: 'Ngân hàng TMCP Sài Gòn - Hà Nội', code: 'SHB' },
  { bin: '970426', shortName: 'MSB', name: 'Ngân hàng TMCP Hàng Hải Việt Nam', code: 'MSB' },
  { bin: '970448', shortName: 'OCB', name: 'Ngân hàng TMCP Phương Đông', code: 'OCB' },
  { bin: '970440', shortName: 'SeABank', name: 'Ngân hàng TMCP Đông Nam Á', code: 'SEAB' },
  { bin: '970431', shortName: 'Eximbank', name: 'Ngân hàng TMCP Xuất Nhập khẩu VN', code: 'EIB' },
  { bin: '970449', shortName: 'LPBank', name: 'Ngân hàng TMCP Lộc Phát Việt Nam', code: 'LPB' },
];

export function loadCachedBanks(): BankOption[] {
  try {
    const raw = localStorage.getItem(BANKS_CACHE_KEY);
    if (!raw) return POPULAR_BANKS;
    const parsed = JSON.parse(raw) as BankOption[];
    if (!Array.isArray(parsed) || parsed.length === 0) return POPULAR_BANKS;
    // Ensure Agribank & core defaults are always merged cleanly
    const map = new Map<string, BankOption>();
    POPULAR_BANKS.forEach((b) => map.set(b.bin, b));
    parsed.forEach((b) => {
      if (b.bin && b.shortName) map.set(b.bin, b);
    });
    return Array.from(map.values()).sort((a, b) => a.shortName.localeCompare(b.shortName));
  } catch {
    return POPULAR_BANKS;
  }
}

export function saveCachedBanks(banks: BankOption[]): void {
  try {
    localStorage.setItem(BANKS_CACHE_KEY, JSON.stringify(banks));
  } catch {
    // ignore storage quota errors
  }
}

export async function syncLiveBanksFromVietQR(existing: BankOption[]): Promise<{
  ok: boolean;
  banks: BankOption[];
  count: number;
}> {
  try {
    const res = await fetch('https://api.vietqr.io/v2/banks');
    if (!res.ok) {
      return { ok: false, banks: existing, count: existing.length };
    }
    const json = (await res.json()) as {
      code?: string;
      data?: Array<{
        bin?: string;
        shortName?: string;
        short_name?: string;
        name?: string;
        code?: string;
        transferSupported?: number;
      }>;
    };
    if (!Array.isArray(json.data) || json.data.length === 0) {
      return { ok: false, banks: existing, count: existing.length };
    }
    const merged = new Map<string, BankOption>();
    existing.filter((b) => b.isCustom).forEach((b) => merged.set(b.bin, b));
    json.data.forEach((item) => {
      const bin = String(item.bin || '').trim();
      const shortName = String(item.shortName || item.short_name || item.code || '').trim();
      const name = String(item.name || shortName).trim();
      if (bin && shortName) {
        merged.set(bin, {
          bin,
          shortName,
          name,
          code: item.code ? String(item.code) : undefined,
        });
      }
    });
    const nextList = Array.from(merged.values()).sort((a, b) =>
      a.shortName.localeCompare(b.shortName)
    );
    saveCachedBanks(nextList);
    return { ok: true, banks: nextList, count: nextList.length };
  } catch {
    return { ok: false, banks: existing, count: existing.length };
  }
}

function tlv(tag: string, value: string): string {
  const len = String(value.length).padStart(2, '0');
  return `${tag}${len}${value}`;
}

function crc16CcittFalse(input: string): string {
  let crc = 0xffff;
  for (let i = 0; i < input.length; i++) {
    crc ^= input.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export function buildVietQrPayload(params: {
  bankBin: string;
  accountNumber: string;
  amount?: number;
  note?: string;
}): string {
  const cleanBin = params.bankBin.replace(/\D/g, '') || '970436';
  const cleanAcc = params.accountNumber.replace(/\s+/g, '') || '0011001234567';
  const cleanAmount = params.amount && params.amount > 0 ? Math.round(params.amount) : 0;
  const cleanNote = (params.note || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9 .,_-]/g, '')
    .slice(0, 50);

  const bankInfo = tlv('00', cleanBin) + tlv('01', cleanAcc);
  const napasField =
    tlv('00', 'A000000727') + tlv('01', bankInfo) + tlv('02', 'QRIBFTTA');

  let payload = '';
  payload += tlv('00', '01');
  payload += tlv('01', cleanAmount > 0 ? '12' : '11');
  payload += tlv('38', napasField);
  payload += tlv('53', '704');
  if (cleanAmount > 0) {
    payload += tlv('54', String(cleanAmount));
  }
  payload += tlv('58', 'VN');
  if (cleanNote) {
    payload += tlv('62', tlv('08', cleanNote));
  }
  payload += '6304';
  return payload + crc16CcittFalse(payload);
}

export async function renderQrToDataUrl(payload: string): Promise<string> {
  return QRCode.toDataURL(payload, {
    width: 320,
    margin: 2,
    color: {
      dark: '#09090b',
      light: '#ffffff',
    },
    errorCorrectionLevel: 'M',
  });
}

export interface ParsedQrPayment {
  raw: string;
  amount: number | null;
  note: string;
  accountNumber: string;
  bankBin: string;
}

function parseTlvMap(str: string): Record<string, string> {
  const result: Record<string, string> = {};
  let idx = 0;
  while (idx + 4 <= str.length) {
    const tag = str.slice(idx, idx + 2);
    const len = parseInt(str.slice(idx + 2, idx + 4), 10);
    if (Number.isNaN(len) || len < 0 || idx + 4 + len > str.length) break;
    result[tag] = str.slice(idx + 4, idx + 4 + len);
    idx += 4 + len;
  }
  return result;
}

export function parseQrPayload(raw: string): ParsedQrPayment {
  const trimmed = raw.trim();
  if (trimmed.startsWith('0002')) {
    const root = parseTlvMap(trimmed);
    const amount = root['54'] ? Number(root['54']) : null;
    const extra = root['62'] ? parseTlvMap(root['62']) : {};
    const napas = root['38'] ? parseTlvMap(root['38']) : {};
    const bank = napas['01'] ? parseTlvMap(napas['01']) : {};
    return {
      raw: trimmed,
      amount: amount && !Number.isNaN(amount) ? amount : null,
      note: extra['08'] || extra['05'] || 'Thanh toán QR',
      bankBin: bank['00'] || '',
      accountNumber: bank['01'] || '',
    };
  }

  try {
    const parsed = JSON.parse(trimmed) as { amount?: number; note?: string; account?: string };
    return {
      raw: trimmed,
      amount: typeof parsed.amount === 'number' ? parsed.amount : null,
      note: parsed.note || 'Thanh toán QR',
      bankBin: '',
      accountNumber: parsed.account || '',
    };
  } catch {
    const amountMatch = trimmed.match(/(?:amount|am|sotien|total)[=:\s]+(\d+(?:\.\d+)?)/i);
    return {
      raw: trimmed,
      amount: amountMatch ? Number(amountMatch[1]) : null,
      note: trimmed.slice(0, 120),
      bankBin: '',
      accountNumber: '',
    };
  }
}

export async function decodeQrFromImageFile(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        resolve(code ? code.data : null);
      };
      img.onerror = () => resolve(null);
      img.src = String(reader.result);
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

export function decodeQrFromVideo(video: HTMLVideoElement): string | null {
  if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
    return null;
  }
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const code = jsQR(imageData.data, imageData.width, imageData.height, {
    inversionAttempts: 'dontInvert',
  });
  return code ? code.data : null;
}
