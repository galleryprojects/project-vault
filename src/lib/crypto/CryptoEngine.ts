import * as bitcoin from 'bitcoinjs-lib';
import * as ecc from 'tiny-secp256k1';
import { BIP32Factory } from 'bip32';
import b58 from 'bs58check';

const bip32 = BIP32Factory(ecc);

// [GOD_MODE_NOTE] Litecoin Network Configuration
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
 * Converts a zpub (SegWit) to a standard xpub so the library can read it.
 * This is crucial for modern wallets like BlueWallet/Exodus.
 */
function zpubToXpub(zpub: string) {
  let data = b58.decode(zpub);
  data.set([0x04, 0x88, 0xb2, 0x1e], 0); // Replace zpub prefix with xpub prefix
  return b58.encode(data);
}

export function generateCryptoAddress(coin: 'BTC' | 'LTC', index: number): string {
  const xpub = coin === 'BTC' ? process.env.BTC_XPUB : process.env.LTC_XPUB;
  
  if (!xpub) throw new Error(`Missing ${coin}_XPUB in environment variables.`);

  // 1. Handle BTC (Assuming SegWit/zpub)
  if (coin === 'BTC') {
    const cleanXpub = xpub.startsWith('zpub') ? zpubToXpub(xpub) : xpub;
    const node = bip32.fromBase58(cleanXpub);
    const { address } = bitcoin.payments.p2wpkh({
      pubkey: node.derive(0).derive(index).publicKey,
      network: bitcoin.networks.bitcoin,
    });
    return address!;
  } 

  // 2. Handle LTC
  const node = bip32.fromBase58(xpub, LITECOIN);
  const { address } = bitcoin.payments.p2pkh({
    pubkey: node.derive(0).derive(index).publicKey,
    network: LITECOIN,
  });
  return address!;
}