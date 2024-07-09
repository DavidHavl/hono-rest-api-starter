export function getRandomBytes(length = 32) {
  // @ts-ignore
  if (globalThis.crypto === undefined || globalThis.crypto.getRandomValues === undefined) {
    throw new Error('crypto.getRandomValues is not available');
  }
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}
