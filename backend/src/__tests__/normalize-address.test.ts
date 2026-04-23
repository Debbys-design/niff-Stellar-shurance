import { Keypair, MuxedAccount } from '@stellar/stellar-sdk';
import { normalizeAddress, tryNormalizeAddress } from '../src/common/utils/normalize-address';

// Stable test fixtures
const G_ADDRESS = Keypair.random().publicKey(); // valid G-address
const ANOTHER_G = Keypair.random().publicKey();

// Build a valid M-address from G_ADDRESS with mux ID 42
const muxed = new MuxedAccount(
  { accountId: () => G_ADDRESS, sequenceNumber: () => '0', incrementSequenceNumber: () => {} } as any,
  '42',
);
// Use the SDK helper to produce a real M-address string
import { StrKey } from '@stellar/stellar-sdk';
const M_ADDRESS = MuxedAccount.fromAddress(
  // Construct via encode: base account + mux id
  (() => {
    const kp = Keypair.fromPublicKey(G_ADDRESS);
    const ma = new MuxedAccount({ accountId: () => G_ADDRESS } as any, '42');
    return ma.accountId();
  })(),
  '0',
).accountId();

describe('normalizeAddress', () => {
  it('returns a G-address unchanged', () => {
    expect(normalizeAddress(G_ADDRESS)).toBe(G_ADDRESS);
  });

  it('strips mux ID from an M-address and returns the base G-address', () => {
    // Build a proper M-address
    const base = Keypair.random();
    const ma = new MuxedAccount(
      { accountId: () => base.publicKey(), sequenceNumber: () => '0', incrementSequenceNumber: () => {} } as any,
      '99',
    );
    const mAddr = ma.accountId();
    expect(normalizeAddress(mAddr)).toBe(base.publicKey());
  });

  it('two M-addresses with different mux IDs but same base key normalize to the same G-address', () => {
    const base = Keypair.random();
    const ma1 = new MuxedAccount(
      { accountId: () => base.publicKey(), sequenceNumber: () => '0', incrementSequenceNumber: () => {} } as any,
      '1',
    );
    const ma2 = new MuxedAccount(
      { accountId: () => base.publicKey(), sequenceNumber: () => '0', incrementSequenceNumber: () => {} } as any,
      '2',
    );
    expect(normalizeAddress(ma1.accountId())).toBe(normalizeAddress(ma2.accountId()));
  });

  it('throws on an empty string', () => {
    expect(() => normalizeAddress('')).toThrow('must not be empty');
  });

  it('throws on a garbage string', () => {
    expect(() => normalizeAddress('not-an-address')).toThrow('Invalid Stellar address');
  });

  it('throws on a truncated G-address', () => {
    expect(() => normalizeAddress(G_ADDRESS.slice(0, 10))).toThrow();
  });
});

describe('tryNormalizeAddress', () => {
  it('returns null for invalid input instead of throwing', () => {
    expect(tryNormalizeAddress('garbage')).toBeNull();
    expect(tryNormalizeAddress('')).toBeNull();
  });

  it('returns the normalized address for valid input', () => {
    expect(tryNormalizeAddress(G_ADDRESS)).toBe(G_ADDRESS);
  });
});
