
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
  const { toast } = useToast();

  const connectPhantom = async () => {
    setConnecting('phantom');
    try {
      const wallet = await walletService.connectPhantom();
      if (wallet) {
        setPhantomWallet(wallet);
        toast({
          title: "✅ Phantom Ansluten",
          description: `Adress: ${wallet.address.substring(0, 8)}...${wallet.address.substring(-4)}`,
        });
      }
    } catch (error: any) {
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
          description: `Adress: ${wallet.address.substring(0, 8)}...${wallet.address.substring(-4)}`,
        });
      }
    } catch (error: any) {
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
  };

  const WalletCard = ({ wallet, type, onConnect, onDisconnect, available }: {
    wallet: WalletInfo | null;
    type: 'phantom' | 'metamask';
    onConnect: () => void;
    onDisconnect: () => void;
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
          <Badge variant={wallet ? 'default' : available ? 'outline' : 'destructive'}>
            {wallet ? 'Ansluten' : available ? 'Tillgänglig' : 'Ej installerad'}
          </Badge>
        </div>

        {wallet ? (
          <div className="space-y-2">
            <div className="text-sm text-gray-400">
              <span className="text-green-400">●</span> {wallet.address.substring(0, 12)}...{wallet.address.substring(-8)}
            </div>
            <div className="text-sm text-gray-400">
              Saldo: <span className="text-green-400 font-mono">{wallet.balance.toFixed(4)} {type === 'phantom' ? 'SOL' : 'ETH'}</span>
            </div>
            <div className="text-sm text-gray-400">
              Nätverk: <span className="text-blue-400">{wallet.network}</span>
            </div>
            <Button 
              onClick={onDisconnect} 
              variant="outline" 
              size="sm"
              className="w-full mt-3 border-red-500/30 text-red-400 hover:bg-red-500/10"
            >
              Koppla från
            </Button>
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
          {(phantomWallet || metamaskWallet) && (
            <Badge className="ml-auto bg-green-500">
              Ansluten
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
            available={walletService.isPhantomAvailable()}
          />
          <WalletCard
            wallet={metamaskWallet}
            type="metamask"
            onConnect={connectMetaMask}
            onDisconnect={() => disconnectWallet('metamask')}
            available={walletService.isMetaMaskAvailable()}
          />
        </div>

        {(phantomWallet || metamaskWallet) && (
          <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
            <div className="flex items-center space-x-2">
              <span className="text-green-400">✅</span>
              <div>
                <div className="text-green-400 text-sm font-medium">
                  Wallet Ansluten
                </div>
                <div className="text-green-300 text-xs">
                  Trading bot kan nu genomföra transaktioner
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
