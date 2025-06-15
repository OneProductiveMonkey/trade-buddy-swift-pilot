
import { Connection, PublicKey } from '@solana/web3.js';
import { ethers } from 'ethers';

declare global {
  interface Window {
    solana?: {
      isPhantom?: boolean;
      connect: () => Promise<{ publicKey: PublicKey }>;
      disconnect: () => Promise<void>;
      on: (event: string, callback: () => void) => void;
      request: (args: { method: string }) => Promise<any>;
      publicKey?: PublicKey;
      isConnected: boolean;
    };
    ethereum?: {
      isMetaMask?: boolean;
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (...args: any[]) => void) => void;
      removeListener: (event: string, callback: (...args: any[]) => void) => void;
      selectedAddress?: string;
      isConnected: () => boolean;
    };
  }
}

export interface WalletInfo {
  address: string;
  balance: number;
  network: string;
  type: 'phantom' | 'metamask';
  isConnected: boolean;
}

class WalletService {
  private solanaConnection: Connection;

  constructor() {
    // Use mainnet for live trading
    this.solanaConnection = new Connection('https://api.mainnet-beta.solana.com');
  }

  private isBrowser(): boolean {
    return typeof window !== 'undefined';
  }

  // Enhanced Phantom Wallet Integration
  async connectPhantom(): Promise<WalletInfo | null> {
    try {
      if (!this.isBrowser()) {
        throw new Error('Phantom only available in browser');
      }

      if (!window.solana?.isPhantom) {
        window.open('https://phantom.app/', '_blank');
        throw new Error('Phantom wallet not installed. Opening installation page.');
      }

      // Check if already connected
      if (window.solana.isConnected && window.solana.publicKey) {
        console.log('Phantom already connected, using existing connection');
        const publicKey = window.solana.publicKey;
        const balance = await this.getSolanaBalance(publicKey);
        
        return {
          address: publicKey.toString(),
          balance: balance,
          network: 'solana-mainnet',
          type: 'phantom',
          isConnected: true
        };
      }

      // Request new connection
      const response = await window.solana.connect();
      const publicKey = response.publicKey;
      
      if (!publicKey) throw new Error('No public key from Phantom');

      // Get real balance from Solana mainnet
      const balance = await this.getSolanaBalance(publicKey);

      return {
        address: publicKey.toString(),
        balance: balance,
        network: 'solana-mainnet',
        type: 'phantom',
        isConnected: true
      };
    } catch (error: any) {
      console.error('Phantom connection error:', error);
      throw new Error(error.message || 'Phantom connection failed');
    }
  }

  // Enhanced MetaMask Integration
  async connectMetaMask(): Promise<WalletInfo | null> {
    try {
      if (!this.isBrowser()) {
        throw new Error('MetaMask only available in browser');
      }

      if (!window.ethereum?.isMetaMask) {
        window.open('https://metamask.io/download/', '_blank');
        throw new Error('MetaMask not installed. Opening installation page.');
      }

      // Check if already connected
      if (window.ethereum.selectedAddress && window.ethereum.isConnected()) {
        console.log('MetaMask already connected, using existing connection');
        const address = window.ethereum.selectedAddress;
        const balance = await this.getEthereumBalance(address);
        const network = await this.getEthereumNetwork();
        
        return {
          address,
          balance,
          network,
          type: 'metamask',
          isConnected: true
        };
      }

      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts available in MetaMask');
      }

      const address = accounts[0];
      const balance = await this.getEthereumBalance(address);
      const network = await this.getEthereumNetwork();

      return {
        address,
        balance,
        network,
        type: 'metamask',
        isConnected: true
      };
    } catch (error: any) {
      console.error('MetaMask connection error:', error);
      throw new Error(error.message || 'MetaMask connection failed');
    }
  }

  // Get real Solana balance
  private async getSolanaBalance(publicKey: PublicKey): Promise<number> {
    try {
      const balance = await this.solanaConnection.getBalance(publicKey);
      return balance / 1e9; // Convert lamports to SOL
    } catch (error) {
      console.error('Failed to get SOL balance:', error);
      // Return 0 instead of simulated balance for accuracy
      return 0;
    }
  }

  // Get real Ethereum balance
  private async getEthereumBalance(address: string): Promise<number> {
    try {
      if (!window.ethereum) throw new Error('No Ethereum provider');
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const balance = await provider.getBalance(address);
      return parseFloat(ethers.formatEther(balance));
    } catch (error) {
      console.error('Failed to get ETH balance:', error);
      // Return 0 instead of simulated balance for accuracy
      return 0;
    }
  }

  // Get Ethereum network
  private async getEthereumNetwork(): Promise<string> {
    try {
      if (!window.ethereum) return 'unknown';
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      return network.name || 'ethereum';
    } catch (error) {
      console.error('Failed to get network:', error);
      return 'ethereum';
    }
  }

  // Check wallet status without connecting
  async getPhantomStatus(): Promise<{ connected: boolean; address?: string }> {
    if (!this.isBrowser() || !window.solana?.isPhantom) {
      return { connected: false };
    }

    if (window.solana.isConnected && window.solana.publicKey) {
      return {
        connected: true,
        address: window.solana.publicKey.toString()
      };
    }

    return { connected: false };
  }

  async getMetaMaskStatus(): Promise<{ connected: boolean; address?: string }> {
    if (!this.isBrowser() || !window.ethereum?.isMetaMask) {
      return { connected: false };
    }

    if (window.ethereum.selectedAddress && window.ethereum.isConnected()) {
      return {
        connected: true,
        address: window.ethereum.selectedAddress
      };
    }

    return { connected: false };
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

  // Check if wallets are available and properly installed
  isPhantomAvailable(): boolean {
    return this.isBrowser() && !!window.solana?.isPhantom;
  }

  isMetaMaskAvailable(): boolean {
    return this.isBrowser() && !!window.ethereum?.isMetaMask;
  }

  // Get wallet connection status for display
  async getWalletReadyStatus(): Promise<{ phantom: boolean; metamask: boolean }> {
    const phantomStatus = await this.getPhantomStatus();
    const metamaskStatus = await this.getMetaMaskStatus();
    
    return {
      phantom: phantomStatus.connected,
      metamask: metamaskStatus.connected
    };
  }
}

export const walletService = new WalletService();
