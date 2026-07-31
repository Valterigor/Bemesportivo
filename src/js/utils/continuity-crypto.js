const encoder = new TextEncoder();
const decoder = new TextDecoder();

function bytesToHex(bytes) {
  return [...bytes].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

function bytesToBase64Url(bytes) {
  let binary = '';
  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlToBytes(value) {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
  const binary = atob(padded);
  return Uint8Array.from(binary, character => character.charCodeAt(0));
}

async function digest(value) {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(value)));
}

export function normalizeContinuityCode(value) {
  return String(value || '').replace(/[^a-fA-F0-9]/g, '').toUpperCase().slice(0, 32);
}

export function formatContinuityCode(value) {
  return normalizeContinuityCode(value).match(/.{1,4}/g)?.join('-') || '';
}

export function generateContinuityCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return bytesToHex(bytes).toUpperCase();
}

export async function deriveContinuityIdentity(value) {
  const code = normalizeContinuityCode(value);
  if (code.length !== 32) throw new Error('invalid-continuity-code');
  const [idBytes, tokenBytes, keyBytes] = await Promise.all([
    digest(`be-sync-id:${code}`),
    digest(`be-sync-auth:${code}`),
    digest(`be-sync-key:${code}`)
  ]);
  const key = await crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['encrypt', 'decrypt']);
  return {
    code,
    id: bytesToHex(idBytes),
    token: bytesToHex(tokenBytes),
    key
  };
}

export async function encryptContinuityData(data, identity) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = encoder.encode(JSON.stringify(data));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: encoder.encode(identity.id) },
    identity.key,
    plaintext
  );
  return {
    version: 1,
    algorithm: 'AES-GCM',
    iv: bytesToBase64Url(iv),
    ciphertext: bytesToBase64Url(new Uint8Array(ciphertext))
  };
}

export async function decryptContinuityData(envelope, identity) {
  if (!envelope || envelope.version !== 1 || envelope.algorithm !== 'AES-GCM') {
    throw new Error('invalid-encrypted-envelope');
  }
  const plaintext = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: base64UrlToBytes(envelope.iv),
      additionalData: encoder.encode(identity.id)
    },
    identity.key,
    base64UrlToBytes(envelope.ciphertext)
  );
  return JSON.parse(decoder.decode(plaintext));
}
