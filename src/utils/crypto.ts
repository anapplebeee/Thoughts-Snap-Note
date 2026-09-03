import { EncryptedPayload } from '../types';

// Convert Uint8Array to base64
function bufferToBase64(buffer: Uint8Array): string {
  let binary = '';
  const len = buffer.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  return btoa(binary);
}

// Convert base64 to Uint8Array
function base64ToBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Derive AES-GCM key using PBKDF2
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt plaintext using AES-GCM 256-bit with PBKDF2 key derivation.
 */
export async function encryptText(plaintext: string, masterPin: string): Promise<EncryptedPayload> {
  if (!plaintext) {
    return { ciphertext: '', iv: '', salt: '' };
  }

  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(masterPin, salt);

  const enc = new TextEncoder();
  const encodedData = enc.encode(plaintext);

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    encodedData
  );

  return {
    ciphertext: bufferToBase64(new Uint8Array(encryptedBuffer)),
    iv: bufferToBase64(iv),
    salt: bufferToBase64(salt),
  };
}

/**
 * Decrypt ciphertext using AES-GCM 256-bit with PBKDF2 key derivation.
 * Throws Error if password/PIN is invalid.
 */
export async function decryptText(payload: EncryptedPayload, masterPin: string): Promise<string> {
  if (!payload.ciphertext) return '';

  const salt = base64ToBuffer(payload.salt);
  const iv = base64ToBuffer(payload.iv);
  const ciphertextBuffer = base64ToBuffer(payload.ciphertext);

  const key = await deriveKey(masterPin, salt);

  try {
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      ciphertextBuffer
    );

    const dec = new TextDecoder();
    return dec.decode(decryptedBuffer);
  } catch (err) {
    throw new Error('密码错误或密文损坏，无法解密');
  }
}

/**
 * Strong password generator
 */
export function generateStrongPassword(
  length = 16,
  options: { numbers?: boolean; symbols?: boolean; uppercase?: boolean } = {
    numbers: true,
    symbols: true,
    uppercase: true,
  }
): string {
  const lowercase = 'abcdefghijkmnpqrstuvwxyz'; // removed l, o for clarity
  const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // removed I, O
  const numbers = '23456789'; // removed 0, 1
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  let charPool = lowercase;
  let requiredChars: string[] = [lowercase[Math.floor(Math.random() * lowercase.length)]];

  if (options.uppercase) {
    charPool += uppercase;
    requiredChars.push(uppercase[Math.floor(Math.random() * uppercase.length)]);
  }
  if (options.numbers) {
    charPool += numbers;
    requiredChars.push(numbers[Math.floor(Math.random() * numbers.length)]);
  }
  if (options.symbols) {
    charPool += symbols;
    requiredChars.push(symbols[Math.floor(Math.random() * symbols.length)]);
  }

  const remainingLength = Math.max(length - requiredChars.length, 0);
  const randomValues = new Uint32Array(remainingLength);
  window.crypto.getRandomValues(randomValues);

  const generated: string[] = [...requiredChars];
  for (let i = 0; i < remainingLength; i++) {
    generated.push(charPool[randomValues[i] % charPool.length]);
  }

  // Shuffle
  return generated.sort(() => Math.random() - 0.5).join('');
}

/**
 * Simple password strength calculation
 */
export function evaluatePasswordStrength(password: string): {
  score: number; // 0 - 4
  label: string;
  color: string;
} {
  if (!password) return { score: 0, label: '无', color: 'bg-neutral-300 text-neutral-600' };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  switch (score) {
    case 1:
      return { score: 1, label: '较弱', color: 'bg-rose-500 text-white' };
    case 2:
      return { score: 2, label: '一般', color: 'bg-amber-500 text-white' };
    case 3:
      return { score: 3, label: '良好', color: 'bg-blue-500 text-white' };
    case 4:
      return { score: 4, label: '极强', color: 'bg-emerald-600 text-white' };
    default:
      return { score: 0, label: '太短', color: 'bg-neutral-400 text-white' };
  }
}
