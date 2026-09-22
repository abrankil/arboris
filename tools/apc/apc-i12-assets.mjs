import { normalizeFingerprintSha256 } from './apc-i12-contract.mjs';

function bytesToHex(bytes) {
  return [...bytes].map(value => value.toString(16).padStart(2, '0')).join('');
}

export async function sha256OriginalBytes(input, cryptoImpl = globalThis.crypto) {
  if (!cryptoImpl?.subtle?.digest) throw new Error('Web Crypto SHA-256 is required');
  let buffer;
  if (input instanceof ArrayBuffer) {
    buffer = input;
  } else if (ArrayBuffer.isView(input)) {
    buffer = input.buffer.slice(input.byteOffset, input.byteOffset + input.byteLength);
  } else if (input?.arrayBuffer) {
    buffer = await input.arrayBuffer();
  } else {
    throw new TypeError('File, Blob, ArrayBuffer or typed array is required');
  }

  const digest = await cryptoImpl.subtle.digest('SHA-256', buffer);
  return bytesToHex(new Uint8Array(digest));
}

export async function stageApcPhotoFile(file, { cryptoImpl = globalThis.crypto } = {}) {
  if (!file?.arrayBuffer) throw new TypeError('File/Blob with arrayBuffer() is required');
  const fingerprintSha256 = await sha256OriginalBytes(file, cryptoImpl);
  return {
    file,
    fileRef: file.name ?? 'local-file',
    fingerprintSha256,
    capturedAt: null,
    location: null,
  };
}

export async function verifyApcRelinkFile(file, persistedFingerprint, { cryptoImpl = globalThis.crypto } = {}) {
  const expected = normalizeFingerprintSha256(persistedFingerprint);
  if (!expected) return { match: false, fingerprintSha256: null, reason: 'INVALID_PERSISTED_FINGERPRINT' };
  const actual = await sha256OriginalBytes(file, cryptoImpl);
  return {
    match: actual === expected,
    fingerprintSha256: actual,
    reason: actual === expected ? null : 'FINGERPRINT_MISMATCH',
  };
}

export class ApcAssetRuntime {
  constructor({ createObjectURL = globalThis.URL?.createObjectURL?.bind(globalThis.URL), revokeObjectURL = globalThis.URL?.revokeObjectURL?.bind(globalThis.URL) } = {}) {
    this.createObjectURL = createObjectURL;
    this.revokeObjectURL = revokeObjectURL;
    this.assets = new Map();
  }

  get(photoId) {
    return this.assets.get(photoId) ?? null;
  }

  attach(photoId, file) {
    if (!photoId) throw new Error('photoId is required');
    if (!file) throw new Error('file is required');
    if (typeof this.createObjectURL !== 'function') throw new Error('URL.createObjectURL is required');

    this.detach(photoId);
    const objectUrl = this.createObjectURL(file);
    const entry = { file, objectUrl };
    this.assets.set(photoId, entry);
    return entry;
  }

  detach(photoId) {
    const existing = this.assets.get(photoId);
    if (!existing) return false;
    if (existing.objectUrl && typeof this.revokeObjectURL === 'function') {
      this.revokeObjectURL(existing.objectUrl);
    }
    this.assets.delete(photoId);
    return true;
  }

  replaceSession() {
    this.clear();
  }

  clear() {
    for (const photoId of [...this.assets.keys()]) this.detach(photoId);
  }
}
