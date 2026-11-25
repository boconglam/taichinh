import React, { useEffect, useState } from 'react';
import {
  Download,
  Fingerprint,
  Globe,
  KeyRound,
  LogOut,
  Monitor,
  Moon,
  Plus,
  RefreshCw,
  RotateCcw,
  Shield,
  Sun,
  Trash2,
  UserCheck,
} from 'lucide-react';
import type { TranslationDict } from '../i18n/translations';
import {
  hasBackupPin,
  hasRegisteredBiometric,
  isPlatformBiometricSupported,
  registerBiometricPasskey,
  saveBackupPin,
} from '../lib/biometric';
import type { BankOption } from '../lib/qrUtils';
import { usePWAInstall } from '../hooks/usePWAInstall';
import type {
  CurrencyCode,
  LanguageCode,
  ThemeMode,
  UserPrivateInfo,
  UserProfile,
  UserRole,
} from '../types/finance';

interface Props {
  profile: UserProfile;
  privateInfo: UserPrivateInfo;
  banks: BankOption[];
  syncingBanks: boolean;
  bankSyncMessage: string;
  isAuthenticated: boolean;
  t: TranslationDict;
  onUpdateProfile: (patch: Partial<UserProfile>) => void;
  onUpdatePrivateInfo: (patch: Partial<UserPrivateInfo>) => void;
  onSyncBanks: () => void;
  onAddCustomBank: (bank: BankOption) => void;
  onRemoveCustomBank: (bin: string) => void;
  onSignInGoogle: () => void;
  onSignInApple: () => void;
  onSignOut: () => void;
  onResetDemo: () => void;
}

export const SettingsView: React.FC<Props> = ({
  profile,
  privateInfo,
  banks,
  syncingBanks,
  bankSyncMessage,
  isAuthenticated,
  t,
  onUpdateProfile,
  onUpdatePrivateInfo,
  onSyncBanks,
  onAddCustomBank,
  onRemoveCustomBank,
  onSignInGoogle,
  onSignInApple,
  onSignOut,
  onResetDemo,
}) => {
  const [bioSupported, setBioSupported] = useState(false);
  const [bioActive, setBioActive] = useState(hasRegisteredBiometric());
  const [pinSaved, setPinSaved] = useState(hasBackupPin());
  const [pinInput, setPinInput] = useState('');
  const [bioMessage, setBioMessage] = useState('');
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showAddBank, setShowAddBank] = useState(false);
  const [customBin, setCustomBin] = useState('');
  const [customShortName, setCustomShortName] = useState('');
  const [customFullName, setCustomFullName] = useState('');
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  useEffect(() => {
    isPlatformBiometricSupported().then(setBioSupported);
  }, []);

  const handleSetupBiometric = async () => {
    const res = await registerBiometricPasskey(profile.displayName);
    if (res.ok) {
      setBioActive(true);
      onUpdateProfile({ biometricEnabled: true });
      setBioMessage(t.biometricReady);
    } else {
      setBioMessage(res.reason || 'Unavailable');
    }
  };

  const handleSavePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim().length < 4) return;
    await saveBackupPin(pinInput);
    setPinSaved(true);
    setPinInput('');
    onUpdateProfile({ biometricEnabled: true });
    setBioMessage(t.biometricReady);
  };

  const roles: { value: UserRole; label: string }[] = [
    { value: 'owner', label: t.roleOwner },
    { value: 'manager', label: t.roleManager },
    { value: 'member', label: t.roleMember },
    { value: 'viewer', label: t.roleViewer },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-base font-semibold text-slate-900 dark:text-zinc-100">
          {t.settingsTitle}
        </h2>
      </div>

      {/* Auth & RBAC Card */}
      <div className="p-5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <UserCheck className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <div>
              <div className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                {profile.displayName}
              </div>
              <div className="text-xs text-slate-500 dark:text-zinc-400">
                {privateInfo.email || t.offlineLocal} · {profile.provider}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!isAuthenticated ? (
              <>
                <button
                  type="button"
                  onClick={onSignInGoogle}
                  className="px-3.5 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium transition-colors"
                >
                  {t.signInGoogle}
                </button>
                <button
                  type="button"
                  onClick={onSignInApple}
                  className="px-3.5 py-2 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-medium hover:opacity-90 transition-opacity"
                >
                  {t.signInApple}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onSignOut}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 text-xs font-medium text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{t.signOut}</span>
              </button>
            )}
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs font-medium text-slate-600 dark:text-zinc-400">
            {t.roleLabel}
          </span>
          <div className="flex flex-wrap items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-zinc-800">
            {roles.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => onUpdateProfile({ role: r.value })}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  profile.role === r.value
                    ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 shadow-xs'
                    : 'text-slate-600 dark:text-zinc-400'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Theme, Language & Currency */}
      <div className="p-5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-sm font-medium text-slate-900 dark:text-zinc-100">
            <Sun className="w-4 h-4 text-amber-500" />
            <span>{t.appearanceTheme}</span>
          </div>
          <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-zinc-800">
            {(
              [
                { id: 'light', label: t.themeLight, icon: Sun },
                { id: 'dark', label: t.themeDark, icon: Moon },
                { id: 'system', label: t.themeSystem, icon: Monitor },
              ] as const
            ).map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onUpdateProfile({ theme: opt.id as ThemeMode })}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                    profile.theme === opt.id
                      ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 shadow-xs'
                      : 'text-slate-600 dark:text-zinc-400'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-zinc-800">
          <div className="flex items-center gap-2.5 text-sm font-medium text-slate-900 dark:text-zinc-100">
            <Globe className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>{t.languageLabel}</span>
          </div>
          <select
            value={profile.language}
            onChange={(e) => onUpdateProfile({ language: e.target.value as LanguageCode })}
            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-xs font-medium text-slate-900 dark:text-zinc-100"
          >
            <option value="vi">Tiếng Việt</option>
            <option value="en">English</option>
            <option value="ja">日本語</option>
            <option value="ko">한국어</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-zinc-800">
          <span className="text-sm font-medium text-slate-900 dark:text-zinc-100">
            {t.currencyLabel}
          </span>
          <select
            value={profile.currency}
            onChange={(e) => onUpdateProfile({ currency: e.target.value as CurrencyCode })}
            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-xs font-mono font-medium text-slate-900 dark:text-zinc-100"
          >
            <option value="VND">VND (₫)</option>
            <option value="USD">USD ($)</option>
            <option value="JPY">JPY (¥)</option>
            <option value="KRW">KRW (₩)</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-zinc-800">
          <span className="text-sm font-medium text-slate-900 dark:text-zinc-100">
            {t.personalBudgetLabel}
          </span>
          <input
            type="number"
            min={0}
            value={profile.monthlyBudget}
            onChange={(e) => onUpdateProfile({ monthlyBudget: Math.max(0, Number(e.target.value) || 0) })}
            className="w-44 px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-xs font-mono text-right text-slate-900 dark:text-zinc-100"
          />
        </div>
      </div>

      {/* Biometric Fingerprint / Face ID & PIN Security */}
      <div className="p-5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Fingerprint className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <div>
              <div className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                {t.securityBiometric}
              </div>
              <div className="text-xs text-slate-500 dark:text-zinc-400">
                {bioActive || pinSaved ? t.biometricReady : 'WebAuthn Face ID / Touch ID / PIN'}
              </div>
            </div>
          </div>
          <label className="inline-flex items-center gap-2 text-xs font-medium cursor-pointer">
            <input
              type="checkbox"
              checked={profile.biometricEnabled}
              onChange={(e) => onUpdateProfile({ biometricEnabled: e.target.checked })}
              className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
            />
            <span>{profile.biometricEnabled ? 'ON' : 'OFF'}</span>
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={!bioSupported}
            onClick={handleSetupBiometric}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium disabled:opacity-40"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>{t.setupBiometric}</span>
          </button>

          <form onSubmit={handleSavePin} className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-slate-400" />
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
              placeholder={t.setPinLabel}
              className="w-48 px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-xs font-mono"
            />
            <button
              type="submit"
              disabled={pinInput.length < 4}
              className="px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 text-xs font-medium hover:bg-slate-50 dark:hover:bg-zinc-800 disabled:opacity-40"
            >
              {t.save}
            </button>
          </form>
        </div>
        {bioMessage && (
          <p className="text-xs text-teal-600 dark:text-teal-400 font-medium">{bioMessage}</p>
        )}
      </div>

      {/* Bank QR Default Settings & Live Bank List */}
      <div className="p-5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
              {t.qrModalTitle}
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              {banks.length} {t.banksCountLabel}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={syncingBanks}
              onClick={onSyncBanks}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 text-xs font-medium text-teal-600 dark:text-teal-400 hover:bg-slate-50 dark:hover:bg-zinc-800 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncingBanks ? 'animate-spin' : ''}`} />
              <span>{syncingBanks ? t.syncingBanks : t.syncBanksNow}</span>
            </button>
            <button
              type="button"
              onClick={() => setShowAddBank((v) => !v)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-medium hover:opacity-90"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t.addCustomBank}</span>
            </button>
          </div>
        </div>

        {bankSyncMessage && (
          <p className="text-xs text-teal-600 dark:text-teal-400 font-medium">{bankSyncMessage}</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <select
            value={privateInfo.bankBin}
            onChange={(e) => {
              const bank = banks.find((b) => b.bin === e.target.value);
              onUpdatePrivateInfo({
                bankBin: e.target.value,
                bankName: bank?.shortName || privateInfo.bankName,
              });
            }}
            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-xs"
          >
            {banks.map((b) => (
              <option key={b.bin} value={b.bin}>
                {b.shortName} ({b.bin})
              </option>
            ))}
          </select>
          <input
            type="text"
            value={privateInfo.bankAccount}
            onChange={(e) => onUpdatePrivateInfo({ bankAccount: e.target.value })}
            placeholder={t.accountNumber}
            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-xs font-mono"
          />
          <input
            type="text"
            value={privateInfo.accountHolder}
            onChange={(e) => onUpdatePrivateInfo({ accountHolder: e.target.value })}
            placeholder={t.accountHolder}
            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-xs"
          />
        </div>

        {showAddBank && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const cleanBin = customBin.replace(/\D/g, '').slice(0, 12);
              const cleanShort = customShortName.trim();
              if (!cleanBin || !cleanShort) return;
              onAddCustomBank({
                bin: cleanBin,
                shortName: cleanShort,
                name: customFullName.trim() || cleanShort,
                isCustom: true,
              });
              onUpdatePrivateInfo({ bankBin: cleanBin, bankName: cleanShort });
              setCustomBin('');
              setCustomShortName('');
              setCustomFullName('');
              setShowAddBank(false);
            }}
            className="pt-3 border-t border-slate-100 dark:border-zinc-800 grid grid-cols-1 sm:grid-cols-4 gap-2"
          >
            <input
              type="text"
              required
              placeholder="Mã BIN (VD: 970405)"
              value={customBin}
              onChange={(e) => setCustomBin(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-xs font-mono"
            />
            <input
              type="text"
              required
              placeholder={t.bankShortNamePlaceholder}
              value={customShortName}
              onChange={(e) => setCustomShortName(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-xs"
            />
            <input
              type="text"
              placeholder={t.bankFullNamePlaceholder}
              value={customFullName}
              onChange={(e) => setCustomFullName(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-xs"
            />
            <button
              type="submit"
              className="px-3 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium"
            >
              {t.save}
            </button>
          </form>
        )}

        {banks.some((b) => b.isCustom) && (
          <div className="pt-2 space-y-1.5">
            {banks
              .filter((b) => b.isCustom)
              .map((b) => (
                <div
                  key={b.bin}
                  className="flex items-center justify-between text-xs px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800"
                >
                  <span>
                    <span className="font-mono text-slate-500 mr-2">{b.bin}</span>
                    <span className="font-medium text-slate-900 dark:text-zinc-100">
                      {b.shortName}
                    </span>
                    <span className="mx-1.5 text-slate-400">·</span>
                    <span className="text-slate-500 dark:text-zinc-400">{b.name}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemoveCustomBank(b.bin)}
                    className="p-1 text-slate-400 hover:text-rose-600"
                    aria-label={t.delete}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* PWA Install & Reset Data */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          {!isInstalled && isInstallable && (
            <button
              type="button"
              onClick={install}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 text-white text-xs font-medium hover:bg-teal-700"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t.installApp}</span>
            </button>
          )}
          {!isInstalled && !isInstallable && isIOS && (
            <button
              type="button"
              onClick={() => setShowIOSGuide(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 text-xs font-medium"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t.installIOS}</span>
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={onResetDemo}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 text-xs font-medium text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{t.resetDemoData}</span>
        </button>
      </div>

      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-6 space-y-3">
            <h3 className="text-base font-semibold text-slate-900 dark:text-zinc-100">
              {t.installIOS}
            </h3>
            <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
              1. Nhấn nút Chia sẻ (Share) trên thanh công cụ Safari.
              <br />
              2. Chọn &quot;Thêm vào Màn hình chính&quot; (Add to Home Screen).
            </p>
            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-2 rounded-lg bg-teal-600 text-white text-xs font-medium"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
