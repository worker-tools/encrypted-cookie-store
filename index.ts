// deno-lint-ignore-file no-explicit-any
import type { 
  CookieInit, CookieList, CookieListItem, CookieStore, CookieStoreDeleteOptions, CookieStoreGetOptions,
} from 'https://ghuc.cc/qwtel/cookie-store-interface/index.d.ts';
export * from 'https://ghuc.cc/qwtel/cookie-store-interface/index.d.ts';

import { bufferSourceToUint8Array, concatBufferSources, splitBufferSource } from "https://ghuc.cc/qwtel/typed-array-utils/index.ts";
import { Base64Decoder, Base64Encoder } from "https://ghuc.cc/qwtel/base64-encoding/index.ts";
import { AggregateError } from "./aggregate-error.ts";

const EXT = '.enc';
const IV_LENGTH = 16; // bytes

const secretToUint8Array = (secret: string | BufferSource) => typeof secret === 'string'
  ? new TextEncoder().encode(secret)
  : bufferSourceToUint8Array(secret);

export interface EncryptedCookieStoreOptions {
  /**
   * One or more crypto keys that were previously used to encrypt cookies.
   * `EncryptedCookieStore` will try to decrypt cookies using these, but they are not used for encrypting new cookies.
   */
  keyring?: readonly CryptoKey[],
}

export interface DeriveOptions {
  secret: string | BufferSource | JsonWebKey
  salt?: BufferSource
  iterations?: number
  format?: KeyFormat,
  hash?: HashAlgorithmIdentifier;
  hmacHash?: HashAlgorithmIdentifier;
  length?: number,
}

/**
 * # Encrypted Cookie Store
 * A partial implementation of the [Cookie Store API](https://wicg.github.io/cookie-store)
 * that transparently encrypts and decrypts cookies via AES-GCM.
 * 
 * This is likely only useful in server-side implementations, 
 * but written in a platform-agnostic way. 
 */
export class EncryptedCookieStore implements CookieStore {
  /** A helper function to derive a crypto key from a passphrase */
  static async deriveCryptoKey(opts: DeriveOptions): Promise<CryptoKey> {
    if (!opts.secret) throw Error('Secret missing');

    const passphraseKey = await (opts.format === 'jwk'
      ? crypto.subtle.importKey('jwk', opts.secret as JsonWebKey, 'PBKDF2', false, ['deriveKey'])
      : crypto.subtle.importKey(
        opts.format ?? 'raw',
        secretToUint8Array(opts.secret as string | BufferSource),
        'PBKDF2',
        false,
        ['deriveKey', 'deriveBits']
      )
    );

    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        iterations: opts.iterations ?? 999,
        hash: opts.hash ?? 'SHA-256',
        salt: opts.salt
          ? bufferSourceToUint8Array(opts.salt)
          : new Base64Decoder().decode('Gfw5ic5qS062JvoubvO+DA==')
      },
      passphraseKey,
      {
        name: 'AES-GCM',
        length: opts.length ?? 256,
      },
      false,
      ['encrypt', 'decrypt'],
    );

    return key;
  }

  #store: CookieStore;
  #keyring: readonly CryptoKey[];
  #key: CryptoKey;

  constructor(store: CookieStore, key: CryptoKey, opts: EncryptedCookieStoreOptions = {}) {
    this.#store = store;
    this.#key = key
    this.#keyring = [key, ...opts.keyring ?? []];
  }

  get(name?: string): Promise<CookieListItem | null>;
  get(options?: CookieStoreGetOptions): Promise<CookieListItem | null>;
  async get(name?: string | CookieStoreGetOptions): Promise<CookieListItem | null> {
    if (typeof name !== 'string') throw Error('Overload not implemented.');

    const cookie = await this.#store.get(`${name}${EXT}`);
    if (!cookie) return cookie;

    // FIXME: empty values!
    return this.#decrypt(cookie);
  }

  getAll(name?: string): Promise<CookieList>;
  getAll(options?: CookieStoreGetOptions): Promise<CookieList>;
  async getAll(options?: any) {
    if (options != null) throw Error('Overload not implemented.');

    const list: CookieList = [];
    for (const cookie of await this.#store.getAll(options)) {
      if (cookie.name.endsWith(EXT)) {
        list.push(await this.#decrypt(cookie));
      }
    }
    return list;
  }

  set(name: string, value: string): Promise<void>;
  set(options: CookieInit): Promise<void>;
  async set(options: string | CookieInit, value?: string) {
    const [name, val] = typeof options === 'string'
      ? [options, value ?? '']
      : [options.name, options.value ?? ''];

    // FIXME: empty string!
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    const message = new TextEncoder().encode(val);
    const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, this.#key, message);
    const cipherB64 = new Base64Encoder({ url: true }).encode(concatBufferSources(iv, cipher));
    return this.#store.set({
      ...typeof options === 'string' ? {} : options,
      name: `${name}${EXT}`,
      value: cipherB64,
    });
  }

  delete(name: string): Promise<void>;
  delete(options: CookieStoreDeleteOptions): Promise<void>;
  delete(options: any) {
    if (typeof options !== 'string') throw Error('Overload not implemented.');
    return this.#store.delete(`${options}${EXT}`);
  }

  #decrypt = async (cookie: CookieListItem): Promise<CookieListItem> => {
    const errors: any[] = [];
    for (const key of this.#keyring) {
      try {
        const buffer = new Base64Decoder().decode(cookie.value);
        const [iv, cipher] = splitBufferSource(buffer, IV_LENGTH);
        const clearBuffer = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipher);
        const clearText = new TextDecoder().decode(clearBuffer);
        cookie.name = cookie.name.substring(0, cookie.name.length - EXT.length);
        cookie.value = clearText;
        return cookie;
      } catch (err) {
        errors.push(err);
      }
    }
    throw new AggregateError(errors, 'None of the provided keys was able to decrypt the cookie.');
  }

  addEventListener(...args: Parameters<CookieStore['addEventListener']>): void {
    return this.#store.addEventListener(...args);
  }
  dispatchEvent(event: Event): boolean {
    return this.#store.dispatchEvent(event);
  }
  removeEventListener(...args: Parameters<CookieStore['removeEventListener']>): void {
    return this.#store.removeEventListener(...args);
  }
}
