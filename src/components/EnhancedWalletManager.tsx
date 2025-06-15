
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { walletService, WalletInfo } from '@/services/walletService';
import { useToast } from '@/hooks/use-toast';
import { 
  ExternalLink, 
  RefreshCw, 
  Wallet, 
  Copy, 
  Eye, 
  EyeOff,
  TrendingUp,
  DollarSign
} from 'lucide-react';

export const EnhancedWalletManager: React.FC = () => {
  const [phantomWallet, setPhantomWallet] = useState<WalletInfo | null>(null);
  const [metamaskWallet, setMetamaskWallet] = useState<WalletInfo | null>(null);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<string | null>(null);
  const [showBalances, setShowBalances] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    initializeWallets();
    const interval = setInterval(updateWalletData, 10000);
    return () => clearInterval(interval);
  }, []);

  const initializeWallets = async () => {
    await updateWalletData();
  };

  const updateWalletData = async () => {
    try {
      // Check and update Phantom
      const phantomStatus = await walletService.getPhantomStatus();
      if (phantomStatus.connected && phantomStatus.address) {
        const phantomData = await walletService.connectPhantom();
        if (phantomData) setPhantomWallet(phantomData);
      }

      // Check and update MetaMask
      const metamaskStatus = await walletService.getMetaMaskStatus();
      if (metamaskStatus.connected && metamaskStatus.address) {
        const metamaskData = await walletService.connectMetaMask();
        if (metamaskData) setMetamaskWallet(metamaskData);
      }
    } catch (error) {
      console.error('Wallet update failed:', error);
    }
  };

  const connectWallet = async (type: 'phantom' | 'metamask') => {
    setConnecting(type);
    try {
      let wallet;
      if (type === 'phantom') {
        wallet = await walletService.connectPhantom();
        if (wallet) {
          setPhantomWallet(wallet);
          toast({
            title: "✅ Phantom Ansluten",
            description: `${wallet.balance.toFixed(4)} SOL ($${wallet.usdValue?.toFixed(2)})`,
          });
        }
      } else {
        wallet = await walletService.connectMetaMask();
        if (wallet) {
          setMetamaskWallet(wallet);
          toast({
            title: "✅ MetaMask Ansluten",
            description: `${wallet.balance.toFixed(4)} ETH ($${wallet.usdValue?.toFixed(2)})`,
          });
        }
      }
    } catch (error: any) {
      toast({
        title: `❌ ${type === 'phantom' ? 'Phantom' : 'MetaMask'} Fel`,
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setConnecting(null);
    }
  };

  const refreshWallet = async (type: 'phantom' | 'metamask') => {
    setRefreshing(type);
    try {
      await connectWallet(type);
      toast({
        title: "🔄 Uppdaterad",
        description: `${type === 'phantom' ? 'Phantom' : 'MetaMask'} saldo uppdaterat`,
      });
    } catch (error: any) {
      toast({
        title: "❌ Uppdateringsfel",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setRefreshing(null);
    }
  };

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast({
      title: "📋 Kopierad",
      description: "Adress kopierad till urklipp",
    });
  };

  const openExplorer = (wallet: WalletInfo) => {
    const url = wallet.type === 'phantom' 
      ? `https://solscan.io/account/${wallet.address}`
      : `https://etherscan.io/address/${wallet.address}`;
    window.open(url, '_blank');
  };

  const WalletCard = ({ 
    wallet, 
    type, 
    available 
  }: {
    wallet: WalletInfo | null;
    type: 'phantom' | 'metamask';
    available: boolean;
  }) => {
    const isConnected = wallet?.isConnected;
    const symbol = type === 'phantom' ? 'SOL' : 'ETH';
    const icon = type === 'phantom' ? '👻' : '🦊';
    const name = type === 'phantom' ? 'Phantom' : 'MetaMask';

    return (
      <Card className="bg-gray-800/50 border-gray-700/50 hover:bg-gray-800/70 transition-all">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <span className="text-lg">{icon}</span>
              <span className="text-white">{name}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
              <Badge variant={isConnected ? 'default' : available ? 'outline' : 'destructive'} className="text-xs">
                {isConnected ? 'Live' : available ? 'Ready' : 'Install'}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {isConnected && wallet ? (
            <>
              {/* Address Display */}
              <div className="bg-gray-700/50 p-3 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-400">Adress</span>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyAddress(wallet.address)}
                      className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openExplorer(wallet)}
                      className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <div className="text-xs font-mono text-green-400 break-all">
                  {wallet.address}
                </div>
              </div>

              {/* Balance Display */}
              <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-4 rounded-lg border border-blue-500/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-300">Saldo</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowBalances(!showBalances)}
                    className="h-6 w-6 p-0 text-gray-400"
                  >
                    {showBalances ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  </Button>
                </div>
                
                {showBalances ? (
                  <div>
                    <div className="text-lg font-bold text-white">
                      {wallet.balance.toFixed(6)} {symbol}
                    </div>
                    {wallet.usdValue && (
                      <div className="text-sm text-green-400">
                        ≈ ${wallet.usdValue.toFixed(2)} USD
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-lg font-bold text-gray-400">••••••</div>
                )}
              </div>

              {/* Network Info */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Nätverk:</span>
                <span className="text-blue-400">{wallet.network}</span>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2">
                <Button
                  onClick={() => refreshWallet(type)}
                  disabled={refreshing === type}
                  variant="outline"
                  size="sm"
                  className="flex-1 border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                >
                  <RefreshCw className={`w-3 h-3 mr-1 ${refreshing === type ? 'animate-spin' : ''}`} />
                  {refreshing === type ? 'Uppdaterar...' : 'Uppdatera'}
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <div className="text-center py-4">
                <Wallet className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-400">
                  {available ? 'Ej ansluten' : 'Ej installerad'}
                </p>
              </div>
              
              <Button
                onClick={() => connectWallet(type)}
                disabled={connecting === type || !available}
                className="w-full"
                variant={available ? 'default' : 'outline'}
              >
                {connecting === type ? 'Ansluter...' : 
                 !available ? `Installera ${name}` : 
                 `Anslut ${name}`}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const totalBalance = (phantomWallet?.usdValue || 0) + (metamaskWallet?.usdValue || 0);
  const connectedCount = [phantomWallet?.isConnected, metamaskWallet?.isConnected].filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Portfolio Overview */}
      <Card className="bg-gradient-to-r from-green-500/10 via-blue-500/10 to-purple-500/10 border-green-500/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">Portfolio Översikt</h2>
              <p className="text-sm text-gray-400">{connectedCount} av 2 wallets anslutna</p>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-2 mb-1">
                <DollarSign className="w-5 h-5 text-green-400" />
                <span className="text-2xl font-bold text-green-400">
                  {showBalances ? `$${totalBalance.toFixed(2)}` : '••••••'}
                </span>
              </div>
              <div className="flex items-center space-x-1 text-sm text-gray-400">
                <TrendingUp className="w-4 h-4" />
                <span>Total värde</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Wallet Management */}
      <Tabs defaultValue="wallets" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-gray-800">
          <TabsTrigger value="wallets">Wallets</TabsTrigger>
          <TabsTrigger value="activity">Aktivitet</TabsTrigger>
        </TabsList>
        
        <TabsContent value="wallets" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <WalletCard
              wallet={phantomWallet}
              type="phantom"
              available={walletService.isPhantomAvailable()}
            />
            <WalletCard
              wallet={metamaskWallet}
              type="metamask"
              available={walletService.isMetaMaskAvailable()}
            />
          </div>
        </TabsContent>
        
        <TabsContent value="activity" className="space-y-4">
          <Card className="bg-gray-800/50 border-gray-700/50">
            <CardContent className="p-6 text-center">
              <div className="text-gray-400 mb-2">📊</div>
              <h3 className="text-lg font-medium text-white mb-2">Aktivitetslogg</h3>
              <p className="text-sm text-gray-400">
                Wallet transaktioner och aktiviteter visas här
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
