
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { walletService, WalletInfo } from '@/services/walletService';
import { useToast } from '@/hooks/use-toast';

export const WalletConnection: React.FC = () => {
  const [phantomWallet, setPhantomWallet] = useState<WalletInfo | null>(null);
  const [metamaskWallet, setMetamaskWallet] = useState<WalletInfo | null>(null);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [walletStatus, setWalletStatus] = useState({ phantom: false, metamask: false });
  const { toast } = useToast();

  // Check wallet status on component mount
  useEffect(() => {
    checkWalletStatus();
    const interval = setInterval(checkWalletStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const checkWalletStatus = async () => {
    try {
      const status = await walletService.getWalletReadyStatus();
      setWalletStatus(status);

      // Auto-connect if wallets are already connected
      if (status.phantom && !phantomWallet) {
        const phantomStatus = await walletService.getPhantomStatus();
        if (phantomStatus.connected && phantomStatus.address) {
          try {
            const wallet = await walletService.connectPhantom();
            if (wallet) setPhantomWallet(wallet);
          } catch (error) {
            console.error('Auto-connect Phantom failed:', error);
          }
        }
      }

      if (status.metamask && !metamaskWallet) {
        const metamaskStatus = await walletService.getMetaMaskStatus();
        if (metamaskStatus.connected && metamaskStatus.address) {
          try {
            const wallet = await walletService.connectMetaMask();
            if (wallet) setMetamaskWallet(wallet);
          } catch (error) {
            console.error('Auto-connect MetaMask failed:', error);
          }
        }
      }
    } catch (error) {
      console.error('Wallet status check failed:', error);
    }
  };

  const connectPhantom = async () => {
    setConnecting('phantom');
    try {
      const wallet = await walletService.connectPhantom();
      if (wallet) {
        setPhantomWallet(wallet);
        toast({
          title: "✅ Phantom Ansluten",
          description: `Adress: ${wallet.address.substring(0, 8)}...${wallet.address.substring(-4)} | Saldo: ${wallet.balance.toFixed(4)} SOL`,
        });
      }
    } catch (error: any) {
      console.error('Phantom connection error:', error);
      toast({
        title: "❌ Phantom Fel",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setConnecting(null);
    }
  };

  const connectMetaMask = async () => {
    setConnecting('metamask');
    try {
      const wallet = await walletService.connectMetaMask();
      if (wallet) {
        setMetamaskWallet(wallet);
        toast({
          title: "✅ MetaMask Ansluten",
          description: `Adress: ${wallet.address.substring(0, 8)}...${wallet.address.substring(-4)} | Saldo: ${wallet.balance.toFixed(4)} ETH`,
        });
      }
    } catch (error: any) {
      console.error('MetaMask connection error:', error);
      toast({
        title: "❌ MetaMask Fel",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setConnecting(null);
    }
  };

  const disconnectWallet = async (type: 'phantom' | 'metamask') => {
    await walletService.disconnectWallet(type);
    if (type === 'phantom') {
      setPhantomWallet(null);
      toast({ title: "👻 Phantom Frånkopplad" });
    } else {
      setMetamaskWallet(null);
      toast({ title: "🦊 MetaMask Frånkopplad" });
    }
    await checkWalletStatus();
  };

  const refreshWallet = async (type: 'phantom' | 'metamask') => {
    if (type === 'phantom' && phantomWallet) {
      try {
        const wallet = await walletService.connectPhantom();
        if (wallet) setPhantomWallet(wallet);
      } catch (error) {
        console.error('Refresh Phantom failed:', error);
      }
    } else if (type === 'metamask' && metamaskWallet) {
      try {
        const wallet = await walletService.connectMetaMask();
        if (wallet) setMetamaskWallet(wallet);
      } catch (error) {
        console.error('Refresh MetaMask failed:', error);
      }
    }
  };

  const WalletCard = ({ wallet, type, onConnect, onDisconnect, onRefresh, available }: {
    wallet: WalletInfo | null;
    type: 'phantom' | 'metamask';
    onConnect: () => void;
    onDisconnect: () => void;
    onRefresh: () => void;
    available: boolean;
  }) => (
    <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">
              {type === 'phantom' ? '👻' : '🦊'}
            </div>
            <div>
              <h3 className="text-white font-medium">
                {type === 'phantom' ? 'Phantom' : 'MetaMask'}
              </h3>
              <p className="text-xs text-gray-400">
                {type === 'phantom' ? 'Solana Wallet' : 'Ethereum Wallet'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${wallet?.isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
            <Badge variant={wallet?.isConnected ? 'default' : available ? 'outline' : 'destructive'}>
              {wallet?.isConnected ? 'Ansluten' : available ? 'Tillgänglig' : 'Ej installerad'}
            </Badge>
          </div>
        </div>

        {wallet?.isConnected ? (
          <div className="space-y-2">
            <div className="text-sm text-gray-400 break-all">
              <span className="text-green-400">●</span> {wallet.address}
            </div>
            <div className="text-sm text-gray-400">
              Saldo: <span className="text-green-400 font-mono">{wallet.balance.toFixed(6)} {type === 'phantom' ? 'SOL' : 'ETH'}</span>
            </div>
            <div className="text-sm text-gray-400">
              Nätverk: <span className="text-blue-400">{wallet.network}</span>
            </div>
            <div className="flex space-x-2 mt-3">
              <Button 
                onClick={onRefresh} 
                variant="outline" 
                size="sm"
                className="flex-1 border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
              >
                🔄 Uppdatera
              </Button>
              <Button 
                onClick={onDisconnect} 
                variant="outline" 
                size="sm"
                className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10"
              >
                Koppla från
              </Button>
            </div>
          </div>
        ) : (
          <Button 
            onClick={onConnect}
            disabled={connecting === type || !available}
            className={`w-full ${!available ? 'opacity-50 cursor-not-allowed' : ''}`}
            variant={available ? 'default' : 'outline'}
          >
            {connecting === type ? 'Ansluter...' : 
             !available ? 'Installera' : 
             `Anslut ${type === 'phantom' ? 'Phantom' : 'MetaMask'}`}
          </Button>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Card className="bg-gray-800/30 border-gray-700/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-green-400 flex items-center space-x-2">
          <span>👛</span>
          <span>Wallet Anslutningar</span>
          {(phantomWallet?.isConnected || metamaskWallet?.isConnected) && (
            <Badge className="ml-auto bg-green-500">
              {[phantomWallet?.isConnected, metamaskWallet?.isConnected].filter(Boolean).length} Ansluten
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <WalletCard
            wallet={phantomWallet}
            type="phantom"
            onConnect={connectPhantom}
            onDisconnect={() => disconnectWallet('phantom')}
            onRefresh={() => refreshWallet('phantom')}
            available={walletService.isPhantomAvailable()}
          />
          <WalletCard
            wallet={metamaskWallet}
            type="metamask"
            onConnect={connectMetaMask}
            onDisconnect={() => disconnectWallet('metamask')}
            onRefresh={() => refreshWallet('metamask')}
            available={walletService.isMetaMaskAvailable()}
          />
        </div>

        {/* Status Summary */}
        <div className="mt-4 p-3 bg-gray-700/50 rounded-lg">
          <div className="text-sm font-medium text-white mb-2">Wallet Status</div>
          <div className="flex items-center space-x-4 text-xs">
            <div className={`flex items-center space-x-1 ${phantomWallet?.isConnected ? 'text-green-400' : 'text-gray-400'}`}>
              <div className={`w-2 h-2 rounded-full ${phantomWallet?.isConnected ? 'bg-green-400' : 'bg-gray-400'}`}></div>
              <span>Phantom {phantomWallet?.isConnected ? 'Ready' : 'Not Connected'}</span>
            </div>
            <div className={`flex items-center space-x-1 ${metamaskWallet?.isConnected ? 'text-green-400' : 'text-gray-400'}`}>
              <div className={`w-2 h-2 rounded-full ${metamaskWallet?.isConnected ? 'bg-green-400' : 'bg-gray-400'}`}></div>
              <span>MetaMask {metamaskWallet?.isConnected ? 'Ready' : 'Not Connected'}</span>
            </div>
          </div>
        </div>

        {(phantomWallet?.isConnected || metamaskWallet?.isConnected) && (
          <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
            <div className="flex items-center space-x-2">
              <span className="text-green-400">✅</span>
              <div>
                <div className="text-green-400 text-sm font-medium">
                  Wallets Anslutna
                </div>
                <div className="text-green-300 text-xs">
                  Trading bot kan nu genomföra transaktioner med riktiga saldon
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
