import { Wallet, HDNodeWallet } from 'ethers';

export class CryptoService {
  private mnemonic: string;
  private nextIndex: number = 1; // Start from 1, reserve 0 for master wallet

  constructor(mnemonic?: string) {
    this.mnemonic = mnemonic || process.env.MNEMONIC || '';

    if (!this.mnemonic) {
      throw new Error('MNEMONIC environment variable is required');
    }

    // Validate mnemonic
    try {
      Wallet.fromPhrase(this.mnemonic);
    } catch (error) {
      throw new Error('Invalid mnemonic phrase');
    }
  }

  /**
   * Gets the master wallet (index 0)
   * This is the main wallet that funds can be sent to
   */
  getMasterWallet(): { privateKey: string; address: string; derivationPath: string } {
    return this.deriveWallet(0);
  }

  /**
   * Generates a new wallet with a unique derivation path
   * Each bot gets its own wallet derived from the master mnemonic
   * Uses BIP44 derivation path: m/44'/60'/0'/0/{index}
   */
  generateWallet(index?: number): { privateKey: string; address: string; derivationPath: string } {
    const walletIndex = index !== undefined ? index : this.nextIndex++;
    const derivationPath = `m/44'/60'/0'/0/${walletIndex}`;

    const hdNode = HDNodeWallet.fromPhrase(this.mnemonic, undefined, derivationPath);

    return {
      privateKey: hdNode.privateKey,
      address: hdNode.address,
      derivationPath,
    };
  }

  /**
   * Gets the next available wallet index
   */
  getNextIndex(): number {
    return this.nextIndex;
  }

  /**
   * Sets the next wallet index (useful when loading existing bots)
   */
  setNextIndex(index: number): void {
    this.nextIndex = index;
  }

  /**
   * Derives a wallet from a specific index
   */
  deriveWallet(index: number): { privateKey: string; address: string; derivationPath: string } {
    return this.generateWallet(index);
  }

  /**
   * Verifies if a mnemonic is valid
   */
  static isValidMnemonic(mnemonic: string): boolean {
    try {
      Wallet.fromPhrase(mnemonic);
      return true;
    } catch {
      return false;
    }
  }
}
