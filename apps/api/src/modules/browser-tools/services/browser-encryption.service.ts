import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

const ALGORITHM      = 'aes-256-gcm';
const IV_BYTES       = 12;
const TAG_BYTES      = 16;
const CURRENT_VER    = 1;

@Injectable()
export class BrowserEncryptionService {
  private readonly keys = new Map<number, Buffer>();

  constructor(private config: ConfigService) {
    const raw = this.config.getOrThrow<string>('BROWSER_SESSION_ENCRYPTION_KEY');
    if (!/^[0-9a-fA-F]{64}$/.test(raw)) {
      throw new Error('BROWSER_SESSION_ENCRYPTION_KEY must be 64 hex chars (32 bytes)');
    }
    this.keys.set(CURRENT_VER, Buffer.from(raw, 'hex'));
  }

  encrypt(plaintext: string): { ciphertext: string; version: number } {
    const key    = this.keys.get(CURRENT_VER)!;
    const iv     = crypto.randomBytes(IV_BYTES);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv) as crypto.CipherGCM;
    const enc    = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const tag    = cipher.getAuthTag();
    const payload = Buffer.concat([Buffer.from([CURRENT_VER]), iv, tag, enc]);
    return { ciphertext: payload.toString('base64'), version: CURRENT_VER };
  }

  decrypt(ciphertext: string): string {
    const payload = Buffer.from(ciphertext, 'base64');
    const version = payload[0];
    const key     = this.keys.get(version);
    if (!key) throw new Error(`No decryption key for version ${version}`);
    const iv      = payload.subarray(1, 1 + IV_BYTES);
    const tag     = payload.subarray(1 + IV_BYTES, 1 + IV_BYTES + TAG_BYTES);
    const enc     = payload.subarray(1 + IV_BYTES + TAG_BYTES);
    const dec     = crypto.createDecipheriv(ALGORITHM, key, iv) as crypto.DecipherGCM;
    dec.setAuthTag(tag);
    return dec.update(enc) + dec.final('utf8');
  }

  get currentVersion() { return CURRENT_VER; }
}
