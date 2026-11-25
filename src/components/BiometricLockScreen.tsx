import React, { useState } from 'react';
import { Fingerprint, Lock, ShieldCheck } from 'lucide-react';
import type { TranslationDict } from '../i18n/translations';
import {
  hasBackupPin,
  hasRegisteredBiometric,
  verifyBackupPin,
  verifyBiometricPasskey,
} from '../lib/biometric';

interface Props {
  t: TranslationDict;
  onUnlock: () => void;
}

export const BiometricLockScreen: React.FC<Props> = ({ t, onUnlock }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const biometricAvailable = hasRegisteredBiometric();
  const pinAvailable = hasBackupPin();

  const handleBiometric = async () => {
    setBusy(true);
    setError('');
    const ok = await verifyBiometricPasskey();
    setBusy(false);
    if (ok) {
      onUnlock();
    } else {
      setError(t.wrongPin);
    }
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) return;
    setBusy(true);
    setError('');
    const ok = await verifyBackupPin(pin);
    setBusy(false);
    if (ok) {
      setPin('');
      onUnlock();
    } else {
      setError(t.wrongPin);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50 dark:bg-zinc-950 p-6">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 space-y-6">
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-12 h-12 rounded-xl border border-teal-500/30 bg-teal-500/10 flex items-center justify-center text-teal-600 dark:text-teal-400">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-zinc-100">
            {t.unlockTitle}
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400">{t.unlockSubtitle}</p>
        </div>

        {biometricAvailable && (
          <button
            type="button"
            disabled={busy}
            onClick={handleBiometric}
            className="w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium transition-colors disabled:opacity-60"
          >
            <Fingerprint className="w-5 h-5" />
            <span>{t.unlockBiometric}</span>
          </button>
        )}

        {pinAvailable && (
          <form onSubmit={handlePinSubmit} className="space-y-3">
            <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400">
              {t.unlockWithPin}
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••••"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-center text-lg tracking-widest font-mono text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <button
              type="submit"
              disabled={busy || pin.length < 4}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-900 dark:text-zinc-100 text-sm font-medium transition-colors disabled:opacity-50"
            >
              {t.unlockWithPin}
            </button>
          </form>
        )}

        {!biometricAvailable && !pinAvailable && (
          <button
            type="button"
            onClick={onUnlock}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition-colors"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{t.unlockBiometric}</span>
          </button>
        )}

        {error && (
          <p className="text-xs text-center text-red-600 dark:text-red-400 font-medium">{error}</p>
        )}
      </div>
    </div>
  );
};
