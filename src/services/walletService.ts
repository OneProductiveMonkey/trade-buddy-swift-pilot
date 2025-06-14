
import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { ethers } from 'ethers';

// Type declarations for browser wallet extensions
declare global {
  interface Window {
    solana?: {
      isPhantom?: boolean;
      connect: () => Promise<{ publicKey: PublicKey }>;
      disconnect: () => Promise<void>;
      on: (event: string, callback: () => void) => void;
      request: (args: { method: string }) => Promise<any>;
    };
    ethereum?: {
      isMetaMask?: boolean;
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (...args: any[]) => void) => void;
      removeListener: (event: string, callback: (...args: any[]) => void) => void;
    };
  }
}

export interface WalletInfo {
  address: string;
  balance: number;
  network: string;
  type: 'phantom' | 'metamask';
}

class WalletService {
  private phantomAdapter: PhantomWalletAdapter | null = null;
  private metamaskProvider: any = null;
  private solanaConnection: Connection;

  constructor() {
    // Use devnet for testing
    this.solanaConnection = new Connection('https://api.devnet.solana.com');
  }

  // Check if we're in browser environment
  private isBrowser(): boolean {
    return typeof window !== 'undefined';
  }

  // Phantom Wallet Integration
  async connectPhantom(): Promise<WalletInfo | null> {
    try {
      if (!this.isBrowser()) {
        throw new Error('Phantom endast tillgänglig i webbläsare');
      }

      if (!window.solana?.isPhantom) {
        // Open Phantom download page
        window.open('https://phantom.app/', '_blank');
        throw new Error('Phantom wallet inte installerad. Installationssida öppnad.');
      }

      const response = await window.solana.connect();
      const publicKey = response.publicKey;
      
      if (!publicKey) throw new Error('Ingen publik nyckel från Phantom');

      const balance = await this.solanaConnection.getBalance(publicKey);

      return {
        address: publicKey.toString(),
        balance: balance / 1e9, // Convert lamports to SOL
        network: 'solana-devnet',
        type: 'phantom'
      };
    } catch (error: any) {
      console.error('Phantom connection error:', error);
      throw new Error(error.message || 'Phantom anslutning misslyckades');
    }
  }

  // MetaMask Integration
  async connectMetaMask(): Promise<WalletInfo | null> {
    try {
      if (!this.isBrowser()) {
        throw new Error('MetaMask endast tillgänglig i webbläsare');
      }

      if (!window.ethereum) {
        window.open('https://metamask.io/download/', '_blank');
        throw new Error('MetaMask inte installerad. Installationssida öppnad.');
      }

      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (!accounts || accounts.length === 0) {
        throw new Error('Inga konton tillgängliga i MetaMask');
      }

      this.metamaskProvider = new ethers.BrowserProvider(window.ethereum);
      const signer = await this.metamaskProvider.getSigner();
      const address = await signer.getAddress();
      const balance = await this.metamaskProvider.getBalance(address);
      const network = await this.metamaskProvider.getNetwork();

      return {
        address,
        balance: parseFloat(ethers.formatEther(balance)),
        network: network.name || 'ethereum',
        type: 'metamask'
      };
    } catch (error: any) {
      console.error('MetaMask connection error:', error);
      throw new Error(error.message || 'MetaMask anslutning misslyckades');
    }
  }

  async disconnectWallet(type: 'phantom' | 'metamask') {
    try {
      if (type === 'phantom' && this.phantomAdapter) {
        await this.phantomAdapter.disconnect();
        this.phantomAdapter = null;
      }
      // MetaMask doesn't have programmatic disconnect
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  }

  // Check if wallets are available
  isPhantomAvailable(): boolean {
    return this.isBrowser() && !!window.solana?.isPhantom;
  }

  isMetaMaskAvailable(): boolean {
    return this.isBrowser() && !!window.ethereum?.isMetaMask;
  }
}

export const walletService = new WalletService();
