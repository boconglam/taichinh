import React, { useEffect, useRef, useState } from 'react';
import { Camera, CheckCircle2, Download, QrCode, RefreshCw, Save, Upload, X } from 'lucide-react';
import type { TranslationDict } from '../i18n/translations';
import {
  buildVietQrPayload,
  decodeQrFromImageFile,
  decodeQrFromVideo,
  parseQrPayload,
  renderQrToDataUrl,
  type BankOption,
  type ParsedQrPayment,
} from '../lib/qrUtils';
import type { UserPrivateInfo } from '../types/finance';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  privateInfo: UserPrivateInfo;
  banks: BankOption[];
  syncingBanks: boolean;
  onSyncBanks: () => void;
  onUpdatePrivateInfo: (patch: Partial<UserPrivateInfo>) => void;
  t: TranslationDict;
  onCreateTransactionFromQr: (parsed: ParsedQrPayment) => void;
}

export const QRModal: React.FC<Props> = ({
  isOpen,
  onClose,
  privateInfo,
  banks,
  syncingBanks,
  onSyncBanks,
  onUpdatePrivateInfo,
  t,
  onCreateTransactionFromQr,
}) => {
  const [tab, setTab] = useState<'generate' | 'scan'>('generate');
  const [bankBin, setBankBin] = useState(privateInfo.bankBin || '970405');
  const [accountNumber, setAccountNumber] = useState(privateInfo.bankAccount || '0011009876543');
  const [accountHolder, setAccountHolder] = useState(privateInfo.accountHolder || '');
  const [amount, setAmount] = useState('250000');
  const [note, setNote] = useState('Thanh toan don hang');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setBankBin(privateInfo.bankBin || '970405');
      setAccountNumber(privateInfo.bankAccount || '');
      setAccountHolder(privateInfo.accountHolder || '');
      setSavedNotice(false);
    }
  }, [isOpen, privateInfo.bankBin, privateInfo.bankAccount, privateInfo.accountHolder]);

  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [rawInput, setRawInput] = useState('');
  const [parsedResult, setParsedResult] = useState<ParsedQrPayment | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isOpen || tab !== 'generate') return;
    let active = true;
    const payload = buildVietQrPayload({
      bankBin,
      accountNumber,
      amount: Number(amount) || 0,
      note,
    });
    renderQrToDataUrl(payload).then((url) => {
      if (active) setQrDataUrl(url);
    });
    return () => {
      active = false;
    };
  }, [isOpen, tab, bankBin, accountNumber, amount, note]);

  const stopCamera = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((tr) => tr.stop());
      streamRef.current = null;
    }
    setScanning(false);
  };

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen]);

  const startCamera = async () => {
    setCameraError('');
    setParsedResult(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError(t.cameraUnavailable);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setScanning(true);
      const tick = () => {
        if (!videoRef.current || !streamRef.current) return;
        const decoded = decodeQrFromVideo(videoRef.current);
        if (decoded) {
          setParsedResult(parseQrPayload(decoded));
          stopCamera();
          return;
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch {
      setCameraError(t.cameraUnavailable);
      stopCamera();
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCameraError('');
    const decoded = await decodeQrFromImageFile(file);
    if (decoded) {
      setParsedResult(parseQrPayload(decoded));
    } else {
      setCameraError('Không tìm thấy mã QR hợp lệ trong ảnh.');
    }
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `vietqr-${accountNumber}.png`;
    link.click();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <QrCode className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <h2 className="text-base font-semibold text-slate-900 dark:text-zinc-100">
              {t.qrModalTitle}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
            aria-label={t.cancel}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-zinc-800">
          <button
            type="button"
            onClick={() => {
              stopCamera();
              setTab('generate');
            }}
            className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              tab === 'generate'
                ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 shadow-xs'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
            }`}
          >
            {t.qrGenerateTab}
          </button>
          <button
            type="button"
            onClick={() => setTab('scan')}
            className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              tab === 'scan'
                ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 shadow-xs'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
            }`}
          >
            {t.qrScanTab}
          </button>
        </div>

        {tab === 'generate' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-start">
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400">
                    {t.bankLabel} ({banks.length})
                  </label>
                  <button
                    type="button"
                    disabled={syncingBanks}
                    onClick={onSyncBanks}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-teal-600 dark:text-teal-400 hover:underline disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${syncingBanks ? 'animate-spin' : ''}`} />
                    <span>{syncingBanks ? t.syncingBanks : t.syncBanksNow}</span>
                  </button>
                </div>
                <select
                  value={bankBin}
                  onChange={(e) => setBankBin(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm text-slate-900 dark:text-zinc-100"
                >
                  {banks.map((b) => (
                    <option key={b.bin} value={b.bin}>
                      {b.shortName} ({b.bin})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">
                  {t.accountNumber}
                </label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm font-mono text-slate-900 dark:text-zinc-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">
                  {t.accountHolder}
                </label>
                <input
                  type="text"
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm text-slate-900 dark:text-zinc-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">
                  {t.amount}
                </label>
                <input
                  type="number"
                  min={0}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm font-mono text-slate-900 dark:text-zinc-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">
                  {t.qrDescription}
                </label>
                <input
                  type="text"
                  maxLength={50}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm text-slate-900 dark:text-zinc-100"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  const bank = banks.find((b) => b.bin === bankBin);
                  onUpdatePrivateInfo({
                    bankBin,
                    bankName: bank?.shortName || privateInfo.bankName,
                    bankAccount: accountNumber.trim(),
                    accountHolder: accountHolder.trim(),
                  });
                  setSavedNotice(true);
                  setTimeout(() => setSavedNotice(false), 3000);
                }}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-teal-600/30 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 text-xs font-medium hover:bg-teal-100 dark:hover:bg-teal-950/70 transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savedNotice ? t.savedSuccess : t.saveBankAccount}</span>
              </button>
            </div>

            <div className="flex flex-col items-center space-y-3 p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="VietQR Payment Code"
                  referrerPolicy="no-referrer"
                  className="w-48 h-48 rounded-lg bg-white p-2"
                />
              ) : (
                <div className="w-48 h-48 rounded-lg bg-slate-200 dark:bg-zinc-800 animate-pulse" />
              )}
              <div className="text-center text-xs text-slate-600 dark:text-zinc-400">
                <div className="font-medium text-slate-900 dark:text-zinc-100">
                  {banks.find((b) => b.bin === bankBin)?.shortName || privateInfo.bankName}
                </div>
                <div className="font-mono tabular-nums">{accountNumber}</div>
                {accountHolder && <div>{accountHolder}</div>}
              </div>
              <button
                type="button"
                onClick={handleDownload}
                className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>{t.downloadQr}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 overflow-hidden aspect-video flex items-center justify-center">
              <video
                ref={videoRef}
                playsInline
                muted
                className={`w-full h-full object-cover ${scanning ? 'block' : 'hidden'}`}
              />
              {!scanning && (
                <div className="text-center p-6 space-y-3">
                  <Camera className="w-8 h-8 mx-auto text-slate-400 dark:text-zinc-500" />
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={startCamera}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium transition-colors"
                    >
                      <Camera className="w-4 h-4" />
                      <span>{t.startCamera}</span>
                    </button>
                    <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 text-xs font-medium cursor-pointer transition-colors">
                      <Upload className="w-4 h-4" />
                      <span>{t.uploadQrImage}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              )}
              {scanning && (
                <button
                  type="button"
                  onClick={stopCamera}
                  className="absolute bottom-3 right-3 px-3 py-1.5 rounded-lg bg-zinc-900/80 text-white text-xs font-medium"
                >
                  {t.stopCamera}
                </button>
              )}
            </div>

            {cameraError && (
              <p className="text-xs text-amber-600 dark:text-amber-400">{cameraError}</p>
            )}

            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400">
                {t.pasteQrText}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={rawInput}
                  onChange={(e) => setRawInput(e.target.value)}
                  placeholder="000201010212..."
                  className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs font-mono text-slate-900 dark:text-zinc-100"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (rawInput.trim()) {
                      setParsedResult(parseQrPayload(rawInput));
                    }
                  }}
                  className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 text-xs font-medium text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800"
                >
                  Parse
                </button>
              </div>
            </div>

            {parsedResult && (
              <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-3">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 text-sm font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{t.qrDetected}</span>
                </div>
                <div className="text-xs text-slate-600 dark:text-zinc-300 space-y-1 font-mono">
                  <div>
                    {t.amount}: {parsedResult.amount ? parsedResult.amount.toLocaleString() : 'N/A'}
                  </div>
                  <div>
                    {t.note}: {parsedResult.note}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onCreateTransactionFromQr(parsedResult);
                    onClose();
                  }}
                  className="w-full px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium transition-colors"
                >
                  {t.applyQrToTransaction}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
