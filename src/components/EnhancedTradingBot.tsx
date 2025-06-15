import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TradingStrategy } from './TradingStrategy';
import { PerformanceMetrics } from './PerformanceMetrics';
import { AISignalPanel } from './AISignalPanel';
import { tradingApi } from '@/services/tradingApi';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { Activity, Wifi, WifiOff, Play, Square } from 'lucide-react';

interface BotStatus {
  portfolio: {
    balance: number;
    profit_live: number;
    profit_24h: number;
    total_trades: number;
    successful_trades: number;
    win_rate: number;
  };
  ai_signals: any[];
  arbitrage_opportunities: any[];
  trading_active: boolean;
  connection_status: {
    active_exchanges: number;
    demo_exchanges: number;
    total_exchanges: number;
  };
}

export const EnhancedTradingBot: React.FC<{
  onTrade?: (order: any) => void;
  balance?: number;
  isActive?: boolean;
  onToggleActive?: () => void;
}> = ({ onTrade, balance, isActive, onToggleActive }) => {
  const [botStatus, setBotStatus] = useState<BotStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<string>('');
  const { toast } = useToast();
  const { t } = useLanguage();

  const fetchBotStatus = async () => {
    try {
      const data = await tradingApi.getEnhancedStatus();
      setBotStatus(data);
      setConnectionStatus(t('connection.connected').replace('{count}', data.connection_status?.active_exchanges || 0));
    } catch (error) {
      console.error('Error fetching bot status:', error);
      setConnectionStatus(t('connection.error'));
      setBotStatus({
        portfolio: {
          balance: balance || 10000,
          profit_live: 0,
          profit_24h: 0,
          total_trades: 0,
          successful_trades: 0,
          win_rate: 0
        },
        ai_signals: [],
        arbitrage_opportunities: [],
        trading_active: isActive || false,
        connection_status: {
          active_exchanges: 0,
          demo_exchanges: 5,
          total_exchanges: 5
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStartTrading = async () => {
    try {
      const result = await tradingApi.startEnhancedTrading({
        budget: 1000,
        strategy: 'hybrid',
        risk_level: 'medium'
      });

      if (result.success) {
        toast({
          title: "Trading Startad",
          description: result.message,
        });
        onToggleActive?.();
        fetchBotStatus();
      } else {
        toast({
          title: "Fel vid start",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Nätverksfel",
        description: "Kunde inte starta trading",
        variant: "destructive",
      });
    }
  };

  const handleStopTrading = async () => {
    try {
      const result = await tradingApi.stopEnhancedTrading();
      if (result.success) {
        toast({
          title: "Trading Stoppad",
          description: result.message,
        });
        onToggleActive?.();
        fetchBotStatus();
      }
    } catch (error) {
      toast({
        title: "Fel vid stopp",
        description: "Kunde inte stoppa trading",
        variant: "destructive",
      });
    }
  };

  const handleExecuteSignal = async (signal: any) => {
    try {
      const result = await tradingApi.executeEnhancedTrade({
        symbol: signal.symbol,
        side: signal.direction,
        amount_usd: 200,
        strategy: 'ai_signal',
        confidence: signal.confidence
      });

      if (result.success) {
        toast({
          title: "Trade Genomförd",
          description: `${signal.direction.toUpperCase()} ${signal.coin} genomförd`,
        });
        
        // Call parent onTrade function if provided
        if (onTrade) {
          onTrade({
            symbol: signal.symbol,
            type: signal.direction,
            amount: 200 / signal.current_price,
            price: signal.current_price,
            strategy: 'ai_signal',
            confidence: signal.confidence,
            exchange: 'AI Signal'
          });
        }
        
        fetchBotStatus();
      } else {
        toast({
          title: "Trade Misslyckades",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Exekveringsfel",
        description: "Kunde inte genomföra trade",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchBotStatus();
    const interval = setInterval(fetchBotStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center space-x-3 text-gray-400">
          <Activity className="w-5 h-5 animate-spin" />
          <span>Loading Enhanced Trading Bot...</span>
        </div>
      </div>
    );
  }

  const isConnected = botStatus?.connection_status?.active_exchanges > 0;

  return (
    <div className="space-y-6">
      {/* Connection Status Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-700/50 to-gray-800/50 rounded-lg border border-gray-600/50">
        <div className="flex items-center space-x-3">
          {isConnected ? (
            <Wifi className="w-5 h-5 text-green-400" />
          ) : (
            <WifiOff className="w-5 h-5 text-yellow-400" />
          )}
          <div>
            <span className="text-white font-medium">{connectionStatus}</span>
            <div className="flex items-center space-x-2 mt-1">
              <Badge variant="outline" className="text-xs text-gray-400 border-gray-600">
                {botStatus?.connection_status?.demo_exchanges || 0} {t('connection.demo')}
              </Badge>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {botStatus?.trading_active ? (
            <Button 
              onClick={onToggleActive} 
              variant="destructive" 
              size="sm"
              className="bg-red-600 hover:bg-red-700"
            >
              <Square className="w-4 h-4 mr-2" />
              {t('trading.stop')}
            </Button>
          ) : (
            <Button 
              onClick={onToggleActive} 
              size="sm"
              className="bg-green-600 hover:bg-green-700"
            >
              <Play className="w-4 h-4 mr-2" />
              {t('trading.start')}
            </Button>
          )}
        </div>
      </div>

      {/* Portfolio Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: t('portfolio.balance'),
            value: `$${(botStatus?.portfolio?.balance || balance || 0).toLocaleString()}`,
            icon: '💰',
            color: 'text-blue-400'
          },
          {
            label: t('portfolio.liveProfit'),
            value: `$${(botStatus?.portfolio?.profit_live || 0).toFixed(2)}`,
            icon: '📈',
            color: (botStatus?.portfolio?.profit_live || 0) >= 0 ? 'text-green-400' : 'text-red-400'
          },
          {
            label: t('portfolio.winRate'),
            value: `${(botStatus?.portfolio?.win_rate || 0).toFixed(1)}%`,
            icon: '🎯',
            color: 'text-purple-400'
          },
          {
            label: t('portfolio.totalTrades'),
            value: `${botStatus?.portfolio?.total_trades || 0}`,
            icon: '🔄',
            color: 'text-yellow-400'
          }
        ].map((stat, index) => (
          <Card key={index} className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <div className="text-2xl mb-1">{stat.icon}</div>
              <div className={`text-xl font-bold ${stat.color}`}>
                {stat.value}
              </div>
              <div className="text-xs text-gray-400 mt-1">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-gray-800/50 border border-gray-700/50">
          <TabsTrigger value="overview" className="text-white data-[state=active]:bg-blue-600">
            📊 {t('tabs.overview')}
          </TabsTrigger>
          <TabsTrigger value="signals" className="text-white data-[state=active]:bg-purple-600">
            🤖 {t('tabs.signals')}
          </TabsTrigger>
          <TabsTrigger value="strategy" className="text-white data-[state=active]:bg-green-600">
            🧠 {t('tabs.strategy')}
          </TabsTrigger>
          <TabsTrigger value="performance" className="text-white data-[state=active]:bg-orange-600">
            📈 {t('tabs.performance')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-gray-800/50 border-gray-700/50">
              <CardHeader>
                <CardTitle className="text-green-400">⚡ Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="text-white border-gray-600 hover:bg-gray-700">
                    📊 Live Market
                  </Button>
                  <Button variant="outline" className="text-white border-gray-600 hover:bg-gray-700">
                    💹 Arbitrage
                  </Button>
                  <Button variant="outline" className="text-white border-gray-600 hover:bg-gray-700">
                    🔄 History
                  </Button>
                  <Button variant="outline" className="text-white border-gray-600 hover:bg-gray-700">
                    ⚙️ Settings
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700/50">
              <CardHeader>
                <CardTitle className="text-blue-400">📊 Market Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">AI Signals</span>
                    <Badge className="bg-green-600">
                      {botStatus?.ai_signals?.length || 0} Active
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Arbitrage Ops</span>
                    <Badge className="bg-blue-600">
                      {botStatus?.arbitrage_opportunities?.length || 0} Found
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="signals" className="mt-6">
          <AISignalPanel onExecuteSignal={() => {}} />
        </TabsContent>

        <TabsContent value="strategy" className="mt-6">
          <TradingStrategy />
        </TabsContent>

        <TabsContent value="performance" className="mt-6">
          <PerformanceMetrics />
        </TabsContent>
      </Tabs>
    </div>
  );
};
