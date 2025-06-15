
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
  const [refreshing, setRefreshing] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    checkWalletStatus();
    const interval = setInterval(checkWalletStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const checkWalletStatus = async () => {
    try {
      const status = await walletService.getWalletReadyStatus();

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
          description: `${wallet.address.substring(0, 8)}...${wallet.address.substring(-4)} | ${wallet.balance.toFixed(4)} SOL`,
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
          description: `${wallet.address.substring(0, 8)}...${wallet.address.substring(-4)} | ${wallet.balance.toFixed(4)} ETH`,
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
    setRefreshing(type);
    try {
      if (type === 'phantom') {
        const wallet = await walletService.connectPhantom();
        if (wallet) setPhantomWallet(wallet);
      } else {
        const wallet = await walletService.connectMetaMask();
        if (wallet) setMetamaskWallet(wallet);
      }
      toast({
        title: "🔄 Uppdaterat",
        description: `${type === 'phantom' ? 'Phantom' : 'MetaMask'} saldo uppdaterat`,
      });
    } catch (error) {
      console.error(`Refresh ${type} failed:`, error);
    } finally {
      setRefreshing(null);
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
            <div className="text-lg font-mono">
              <span className="text-green-400">{wallet.balance.toFixed(6)}</span>
              <span className="text-gray-400 ml-2">{type === 'phantom' ? 'SOL' : 'ETH'}</span>
            </div>
            <div className="text-sm text-gray-400">
              Nätverk: <span className="text-blue-400">{wallet.network}</span>
            </div>
            <div className="flex space-x-2 mt-3">
              <Button 
                onClick={onRefresh} 
                variant="outline" 
                size="sm"
                disabled={refreshing === type}
                className="flex-1 border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
              >
                {refreshing === type ? '🔄 Uppdaterar...' : '🔄 Uppdatera'}
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

  const totalBalance = (phantomWallet?.balance || 0) * 150 + (metamaskWallet?.balance || 0) * 3500; // Rough USD conversion

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

        {/* Enhanced Status Summary */}
        <div className="mt-4 p-3 bg-gray-700/50 rounded-lg">
          <div className="text-sm font-medium text-white mb-2">Wallet Översikt</div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Total uppskattad värde:</span>
              <span className="text-green-400 font-mono">${totalBalance.toFixed(2)}</span>
            </div>
            <div className="flex items-center space-x-4 text-xs">
              <div className={`flex items-center space-x-1 ${phantomWallet?.isConnected ? 'text-green-400' : 'text-gray-400'}`}>
                <div className={`w-2 h-2 rounded-full ${phantomWallet?.isConnected ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                <span>Phantom {phantomWallet?.isConnected ? `(${phantomWallet.balance.toFixed(2)} SOL)` : 'Ej ansluten'}</span>
              </div>
              <div className={`flex items-center space-x-1 ${metamaskWallet?.isConnected ? 'text-green-400' : 'text-gray-400'}`}>
                <div className={`w-2 h-2 rounded-full ${metamaskWallet?.isConnected ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                <span>MetaMask {metamaskWallet?.isConnected ? `(${metamaskWallet.balance.toFixed(4)} ETH)` : 'Ej ansluten'}</span>
              </div>
            </div>
          </div>
        </div>

        {(phantomWallet?.isConnected || metamaskWallet?.isConnected) && (
          <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
            <div className="flex items-center space-x-2">
              <span className="text-green-400">✅</span>
              <div>
                <div className="text-green-400 text-sm font-medium">
                  Wallets Konfigurerade
                </div>
                <div className="text-green-300 text-xs">
                  Trading bot kan nu använda riktiga wallet-saldon för trading
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
