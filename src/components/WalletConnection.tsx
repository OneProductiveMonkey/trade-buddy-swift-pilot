
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
          title: "Phantom Ansluten",
          description: `Adress: ${wallet.address.substring(0, 8)}...`,
        });
      } else {
        toast({
          title: "Phantom Fel",
          description: "Kunde inte ansluta till Phantom wallet",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Phantom Fel",
        description: "Installera Phantom wallet extension",
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
          title: "MetaMask Ansluten",
          description: `Adress: ${wallet.address.substring(0, 8)}...`,
        });
      } else {
        toast({
          title: "MetaMask Fel",
          description: "Kunde inte ansluta till MetaMask",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "MetaMask Fel",
        description: "Installera MetaMask extension",
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
      toast({ title: "Phantom Frånkopplad" });
    } else {
      setMetamaskWallet(null);
      toast({ title: "MetaMask Frånkopplad" });
    }
  };

  const WalletCard = ({ wallet, type, onConnect, onDisconnect }: {
    wallet: WalletInfo | null;
    type: 'phantom' | 'metamask';
    onConnect: () => void;
    onDisconnect: () => void;
  }) => (
    <Card className="bg-gray-800 border-gray-700">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="text-2xl">
              {type === 'phantom' ? '👻' : '🦊'}
            </div>
            <h3 className="text-white font-medium">
              {type === 'phantom' ? 'Phantom' : 'MetaMask'}
            </h3>
          </div>
          <Badge variant={wallet ? 'default' : 'outline'}>
            {wallet ? 'Ansluten' : 'Frånkopplad'}
          </Badge>
        </div>

        {wallet ? (
          <div className="space-y-2">
            <div className="text-sm text-gray-400">
              Adress: <span className="text-white">{wallet.address.substring(0, 20)}...</span>
            </div>
            <div className="text-sm text-gray-400">
              Saldo: <span className="text-green-400">{wallet.balance.toFixed(4)} {type === 'phantom' ? 'SOL' : 'ETH'}</span>
            </div>
            <div className="text-sm text-gray-400">
              Nätverk: <span className="text-blue-400">{wallet.network}</span>
            </div>
            <Button 
              onClick={onDisconnect} 
              variant="outline" 
              size="sm"
              className="w-full mt-3"
            >
              Koppla från
            </Button>
          </div>
        ) : (
          <Button 
            onClick={onConnect}
            disabled={connecting === type}
            className="w-full"
          >
            {connecting === type ? 'Ansluter...' : `Anslut ${type === 'phantom' ? 'Phantom' : 'MetaMask'}`}
          </Button>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-green-400">👛 Wallet Anslutningar</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <WalletCard
            wallet={phantomWallet}
            type="phantom"
            onConnect={connectPhantom}
            onDisconnect={() => disconnectWallet('phantom')}
          />
          <WalletCard
            wallet={metamaskWallet}
            type="metamask"
            onConnect={connectMetaMask}
            onDisconnect={() => disconnectWallet('metamask')}
          />
        </div>

        {(phantomWallet || metamaskWallet) && (
          <div className="mt-4 p-3 bg-green-900/20 border border-green-500 rounded">
            <div className="text-green-400 text-sm font-bold">
              ✅ Wallet Ansluten
            </div>
            <div className="text-green-300 text-xs">
              Trading bot kan nu genomföra transaktioner via ansluten wallet
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
