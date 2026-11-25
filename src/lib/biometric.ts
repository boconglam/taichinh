const CREDENTIAL_KEY = 'smart_ledger_webauthn_cred_id';
const PIN_HASH_KEY = 'smart_ledger_pin_hash';

function bufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToUint8Array(base64url: string): Uint8Array<ArrayBuffer> {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function isPlatformBiometricSupported(): Promise<boolean> {
  if (
    typeof window === 'undefined' ||
    !window.PublicKeyCredential ||
    !PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable
  ) {
    return false;
  }
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

export function hasRegisteredBiometric(): boolean {
  return Boolean(localStorage.getItem(CREDENTIAL_KEY));
}

export async function registerBiometricPasskey(displayName: string): Promise<{
  ok: boolean;
  reason?: string;
}> {
  if (!window.PublicKeyCredential || !navigator.credentials) {
    return { ok: false, reason: 'WebAuthn unsupported in this browser' };
  }
  try {
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const userId = crypto.getRandomValues(new Uint8Array(16));
    const cred = (await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: { name: 'Sổ Quỹ Thông Minh', id: window.location.hostname },
        user: {
          id: userId,
          name: displayName || 'ledger-user',
          displayName: displayName || 'Ledger Owner',
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' },
          { alg: -257, type: 'public-key' },
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
        },
        timeout: 60000,
      },
    })) as PublicKeyCredential | null;

    if (!cred) {
      return { ok: false, reason: 'Cancelled' };
    }
    localStorage.setItem(CREDENTIAL_KEY, bufferToBase64Url(cred.rawId));
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      reason: err instanceof Error ? err.message : 'Biometric registration failed',
    };
  }
}

export async function verifyBiometricPasskey(): Promise<boolean> {
  const storedId = localStorage.getItem(CREDENTIAL_KEY);
  if (!storedId || !window.PublicKeyCredential || !navigator.credentials) {
    return false;
  }
  try {
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge,
        allowCredentials: [
          {
            id: base64UrlToUint8Array(storedId),
            type: 'public-key',
            transports: ['internal'],
          },
        ],
        userVerification: 'required',
        timeout: 60000,
      },
    });
    return Boolean(assertion);
  } catch {
    return false;
  }
}

async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function saveBackupPin(pin: string): Promise<void> {
  const clean = pin.trim();
  if (clean.length < 4) return;
  const hashed = await sha256(`smart-ledger:${clean}`);
  localStorage.setItem(PIN_HASH_KEY, hashed);
}

export function hasBackupPin(): boolean {
  return Boolean(localStorage.getItem(PIN_HASH_KEY));
}

export async function verifyBackupPin(pin: string): Promise<boolean> {
  const stored = localStorage.getItem(PIN_HASH_KEY);
  if (!stored) return false;
  const hashed = await sha256(`smart-ledger:${pin.trim()}`);
  return hashed === stored;
}
