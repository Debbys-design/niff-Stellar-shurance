/**
 * Stellar address normalization utilities.
 *
 * Canonical format
 * ----------------
 * - G-addresses (ed25519 public keys): stored as-is (56-char uppercase base32).
 * - C-addresses (Soroban contract IDs): stored as-is (56-char uppercase base32).
 * - Muxed accounts (M-addresses): the mux ID is STRIPPED and the underlying
 *   G-address is stored. Rationale: mux IDs are a payment-routing hint, not a
 *   distinct identity. Storing the base G-address prevents duplicate rows for
 *   the same key-pair and simplifies policy/claim lookups.
 *
 * Invalid addresses (wrong checksum, unknown prefix, empty string) are rejected
 * at API boundaries — callers receive a clear error rather than a stored garbage
 * value.
 */

import { StrKey, MuxedAccount } from '@stellar/stellar-sdk';

export type NormalizedAddress = string;

/**
 * Normalizes a Stellar address to its canonical form.
 *
 * - G-address → returned unchanged.
 * - C-address → returned unchanged.
 * - M-address → underlying G-address (mux ID stripped).
 * - Anything else → throws with a descriptive message.
 */
export function normalizeAddress(raw: string): NormalizedAddress {
  if (!raw) throw new Error('Address must not be empty');

  const trimmed = raw.trim();

  if (StrKey.isValidEd25519PublicKey(trimmed)) return trimmed;

  if (StrKey.isValidContract(trimmed)) return trimmed;

  if (trimmed.startsWith('M')) {
    try {
      const muxed = MuxedAccount.fromAddress(trimmed, '0');
      return muxed.baseAccount().accountId();
    } catch {
      throw new Error(`Invalid muxed address: ${trimmed}`);
    }
  }

  throw new Error(`Invalid Stellar address: ${trimmed}`);
}

/**
 * Returns the normalized address or `null` if the input is invalid.
 * Useful in contexts where you want to handle the error yourself.
 */
export function tryNormalizeAddress(raw: string): NormalizedAddress | null {
  try {
    return normalizeAddress(raw);
  } catch {
    return null;
  }
}
