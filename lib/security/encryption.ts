import crypto from 'crypto';

const DEFAULT_DEV_KEY = 'dev-insecure-key-change-me';

function getKeyMaterial(): string {
  const key = process.env.DATA_ENCRYPTION_KEY || process.env.JWT_SECRET || '';

  if (!key && process.env.NODE_ENV === 'production') {
    throw new Error('DATA_ENCRYPTION_KEY is not configured');
  }

  return key || DEFAULT_DEV_KEY;
}

function deriveKey(raw: string): Buffer {
  // Support hex or base64 keys; otherwise derive via SHA-256
  if (/^[a-fA-F0-9]{64}$/.test(raw)) {
    return Buffer.from(raw, 'hex');
  }

  try {
    const buf = Buffer.from(raw, 'base64');
    if (buf.length === 32) return buf;
  } catch {
    // fall through
  }

  return crypto.createHash('sha256').update(raw).digest();
}

export const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
export const ENCRYPTION_IV_LENGTH = 12;
export const ENCRYPTION_TAG_LENGTH = 16;
const ENCRYPTION_PREFIX = 'enc:';

export function encryptString(plainText: string): string {
  if (!plainText) return plainText;
  if (plainText.startsWith(ENCRYPTION_PREFIX)) return plainText;

  const key = deriveKey(getKeyMaterial());
  const iv = crypto.randomBytes(ENCRYPTION_IV_LENGTH);
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `${ENCRYPTION_PREFIX}${iv.toString('base64')}.${tag.toString('base64')}.${encrypted.toString('base64')}`;
}

export function decryptString(cipherText: string): string {
  if (!cipherText) return cipherText;
  if (!cipherText.startsWith(ENCRYPTION_PREFIX)) return cipherText;

  const key = deriveKey(getKeyMaterial());
  const payload = cipherText.slice(ENCRYPTION_PREFIX.length);
  const [ivB64, tagB64, dataB64] = payload.split('.');

  if (!ivB64 || !tagB64 || !dataB64) {
    throw new Error('Invalid encrypted payload');
  }

  const iv = Buffer.from(ivB64, 'base64');
  const tag = Buffer.from(tagB64, 'base64');
  const data = Buffer.from(dataB64, 'base64');

  const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
  return decrypted.toString('utf8');
}

export function isEncrypted(value: string | undefined | null): boolean {
  if (!value) return false;
  return value.startsWith(ENCRYPTION_PREFIX);
}

export function getEncryptionKey(): Buffer {
  return deriveKey(getKeyMaterial());
}
