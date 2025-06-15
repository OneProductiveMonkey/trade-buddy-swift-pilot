
import { Connection, PublicKey } from '@solana/web3.js';
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
  private solanaConnection: Connection;

  constructor() {
    // Use mainnet for live trading
    this.solanaConnection = new Connection('https://api.mainnet-beta.solana.com');
  }

  // Check if we're in browser environment
  private isBrowser(): boolean {
    return typeof window !== 'undefined';
  }

  // Phantom Wallet Integration with live connection
  async connectPhantom(): Promise<WalletInfo | null> {
    try {
      if (!this.isBrowser()) {
        throw new Error('Phantom only available in browser');
      }

      if (!window.solana?.isPhantom) {
        window.open('https://phantom.app/', '_blank');
        throw new Error('Phantom wallet not installed. Opening installation page.');
      }

      const response = await window.solana.connect();
      const publicKey = response.publicKey;
      
      if (!publicKey) throw new Error('No public key from Phantom');

      // Get live balance from Solana mainnet
      const balance = await this.solanaConnection.getBalance(publicKey);

      return {
        address: publicKey.toString(),
        balance: balance / 1e9, // Convert lamports to SOL
        network: 'solana-mainnet',
        type: 'phantom'
      };
    } catch (error: any) {
      console.error('Phantom connection error:', error);
      throw new Error(error.message || 'Phantom connection failed');
    }
  }

  // MetaMask Integration with live connection
  async connectMetaMask(): Promise<WalletInfo | null> {
    try {
      if (!this.isBrowser()) {
        throw new Error('MetaMask only available in browser');
      }

      if (!window.ethereum) {
        window.open('https://metamask.io/download/', '_blank');
        throw new Error('MetaMask not installed. Opening installation page.');
      }

      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts available in MetaMask');
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      const balance = await provider.getBalance(address);
      const network = await provider.getNetwork();

      return {
        address,
        balance: parseFloat(ethers.formatEther(balance)),
        network: network.name || 'ethereum',
        type: 'metamask'
      };
    } catch (error: any) {
      console.error('MetaMask connection error:', error);
      throw new Error(error.message || 'MetaMask connection failed');
    }
  }

  async disconnectWallet(type: 'phantom' | 'metamask') {
    try {
      if (type === 'phantom' && window.solana) {
        await window.solana.disconnect();
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
