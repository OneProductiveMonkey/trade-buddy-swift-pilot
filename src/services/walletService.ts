
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
    this.solanaConnection = new Connection('https://api.mainnet-beta.solana.com');
  }

  private isBrowser(): boolean {
    return typeof window !== 'undefined';
  }

  async connectPhantom(): Promise<WalletInfo | null> {
    try {
      if (!this.isBrowser()) {
        throw new Error('Phantom endast tillgänglig i webbläsare');
      }

      if (!window.solana?.isPhantom) {
        window.open('https://phantom.app/', '_blank');
        throw new Error('Phantom wallet ej installerad. Öppnar installationssida.');
      }

      const response = await window.solana.connect();
      const publicKey = response.publicKey;
      
      if (!publicKey) throw new Error('Ingen publik nyckel från Phantom');

      const balance = await this.getSolanaBalance(publicKey);

      return {
        address: publicKey.toString(),
        balance: balance,
        network: 'solana-mainnet',
        type: 'phantom',
        isConnected: true
      };
    } catch (error: any) {
      console.error('Phantom anslutningsfel:', error);
      throw new Error(error.message || 'Phantom anslutning misslyckades');
    }
  }

  async connectMetaMask(): Promise<WalletInfo | null> {
    try {
      if (!this.isBrowser()) {
        throw new Error('MetaMask endast tillgänglig i webbläsare');
      }

      if (!window.ethereum?.isMetaMask) {
        window.open('https://metamask.io/download/', '_blank');
        throw new Error('MetaMask ej installerad. Öppnar installationssida.');
      }

      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (!accounts || accounts.length === 0) {
        throw new Error('Inga konton tillgängliga i MetaMask');
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
      console.error('MetaMask anslutningsfel:', error);
      throw new Error(error.message || 'MetaMask anslutning misslyckades');
    }
  }

  private async getSolanaBalance(publicKey: PublicKey): Promise<number> {
    try {
      const balance = await this.solanaConnection.getBalance(publicKey);
      return balance / 1e9; // Convert lamports to SOL
    } catch (error) {
      console.error('Misslyckades att hämta SOL saldo:', error);
      return 0;
    }
  }

  private async getEthereumBalance(address: string): Promise<number> {
    try {
      if (!window.ethereum) throw new Error('Ingen Ethereum provider');
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const balance = await provider.getBalance(address);
      return parseFloat(ethers.formatEther(balance));
    } catch (error) {
      console.error('Misslyckades att hämta ETH saldo:', error);
      return 0;
    }
  }

  private async getEthereumNetwork(): Promise<string> {
    try {
      if (!window.ethereum) return 'okänt';
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      return network.name || 'ethereum';
    } catch (error) {
      console.error('Misslyckades att hämta nätverk:', error);
      return 'ethereum';
    }
  }

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

    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts && accounts.length > 0) {
        return {
          connected: true,
          address: accounts[0]
        };
      }
    } catch (error) {
      console.error('MetaMask status check failed:', error);
    }

    return { connected: false };
  }

  async disconnectWallet(type: 'phantom' | 'metamask') {
    try {
      if (type === 'phantom' && window.solana) {
        await window.solana.disconnect();
      }
    } catch (error) {
      console.error('Frånkopplingfel:', error);
    }
  }

  isPhantomAvailable(): boolean {
    return this.isBrowser() && !!window.solana?.isPhantom;
  }

  isMetaMaskAvailable(): boolean {
    return this.isBrowser() && !!window.ethereum?.isMetaMask;
  }

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
