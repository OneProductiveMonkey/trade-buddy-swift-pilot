
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
    this.solanaConnection = new Connection('https://api.mainnet-beta.solana.com');
  }

  // Phantom Wallet Integration
  async connectPhantom(): Promise<WalletInfo | null> {
    try {
      if (typeof window === 'undefined' || !window.solana?.isPhantom) {
        throw new Error('Phantom wallet inte installerad');
      }

      this.phantomAdapter = new PhantomWalletAdapter();
      await this.phantomAdapter.connect();
      
      const publicKey = this.phantomAdapter.publicKey;
      if (!publicKey) throw new Error('Ingen publik nyckel från Phantom');

      const balance = await this.solanaConnection.getBalance(publicKey);

      return {
        address: publicKey.toString(),
        balance: balance / 1e9, // Convert lamports to SOL
        network: 'solana-mainnet',
        type: 'phantom'
      };
    } catch (error) {
      console.error('Phantom connection error:', error);
      return null;
    }
  }

  // MetaMask Integration
  async connectMetaMask(): Promise<WalletInfo | null> {
    try {
      if (typeof window === 'undefined' || !window.ethereum) {
        throw new Error('MetaMask inte installerad');
      }

      await window.ethereum.request({ method: 'eth_requestAccounts' });
      this.metamaskProvider = new ethers.BrowserProvider(window.ethereum);
      
      const signer = await this.metamaskProvider.getSigner();
      const address = await signer.getAddress();
      const balance = await this.metamaskProvider.getBalance(address);
      const network = await this.metamaskProvider.getNetwork();

      return {
        address,
        balance: parseFloat(ethers.formatEther(balance)),
        network: network.name,
        type: 'metamask'
      };
    } catch (error) {
      console.error('MetaMask connection error:', error);
      return null;
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
}

export const walletService = new WalletService();
