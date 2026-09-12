import { createHash } from 'crypto';

/**
 * Compute SHA-256 hash of a buffer.
 * Returns the hex digest string.
 */
export function hashBuffer(buf: Buffer): string {
  return createHash('sha256').update(buf).digest('hex');
}

/**
 * Compute SHA-256 hash of a string.
 */
export function hashString(content: string): string {
  return createHash('sha256').update(content, 'utf8').digest('hex');
}
