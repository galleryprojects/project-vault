import * as bitcoin from 'bitcoinjs-lib';
import * as ecc from 'tiny-secp256k1';
import { BIP32Factory } from 'bip32';
import b58 from 'bs58check';

const bip32 = BIP32Factory(ecc);

// Litecoin Network Configuration
const LITECOIN = {
  messagePrefix: '\x19Litecoin Signed Message:\n',
  bech32: 'ltc',
  bip32: {
    public: 0x019da462, // Ltub
    private: 0x019d9cfe,
  },
  pubKeyHash: 0x30,
  scriptHash: 0x32,
  wif: 0xb0,
};

/**
 * Normalizes zpub, ypub, or any other prefix into a standard xpub.
 * This prevents the "Invalid network version" crash when reading the key.
 */
function normalizeXpub(pubKey: string): string {
  // If it's already a standard xpub or Ltub, return it as-is
  if (pubKey.startsWith('xpub') || pubKey.startsWith('Ltub')) return pubKey;

  try {
    let data = b58.decode(pubKey);
    // Force the prefix to a standard xpub (0x0488b21e)
    data.set([0x04, 0x88, 0xb2, 0x1e], 0);
    return b58.encode(data);
  } catch (error) {
    throw new Error(`Invalid Extended Public Key format: ${pubKey.substring(0, 8)}...`);
  }
}

export function generateCryptoAddress(coin: 'BTC' | 'LTC', index: number): string {
  const rawXpub = coin === 'BTC' ? process.env.BTC_XPUB : process.env.LTC_XPUB;
  
  if (!rawXpub) throw new Error(`Missing ${coin}_XPUB in environment variables.`);

  // 1. Normalize the key to bypass strict network version checks
  const cleanXpub = normalizeXpub(rawXpub);

  // 2. Parse the node. If it's explicitly an Ltub, parse as Litecoin. Otherwise, default to Bitcoin.
  const parseNetwork = rawXpub.startsWith('Ltub') ? LITECOIN : bitcoin.networks.bitcoin;
  const node = bip32.fromBase58(cleanXpub, parseNetwork as any);
  
  // 3. Derive the specific child address based on the database index
  const child = node.derive(0).derive(index);

  // UPDATE THIS BLOCK IN CryptoEngine.ts
  // 4. Generate the final address string using the correct target network
  if (coin === 'BTC') {
    // p2wpkh forces Native SegWit (bc1q...) addresses
    const { address } = bitcoin.payments.p2wpkh({
      pubkey: child.publicKey,
      network: bitcoin.networks.bitcoin,
    });
    return address!;
  } else {
    // p2pkh forces Legacy Litecoin (L...) addresses
    const { address } = bitcoin.payments.p2pkh({
      pubkey: child.publicKey,
      network: LITECOIN,
    });
    return address!;
  }
}