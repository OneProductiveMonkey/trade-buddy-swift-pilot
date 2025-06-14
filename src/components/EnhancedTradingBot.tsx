
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
  const [connectionStatus, setConnectionStatus] = useState<string>('Ansluter...');
  const { toast } = useToast();

  const fetchBotStatus = async () => {
    try {
      const data = await tradingApi.getEnhancedStatus();
      setBotStatus(data);
      setConnectionStatus(`Ansluten till ${data.connection_status?.active_exchanges || 0} börser`);
    } catch (error) {
      console.error('Error fetching bot status:', error);
      setConnectionStatus('Anslutningsfel - använder demo-läge');
      // Set fallback data for demo mode
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
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-8 text-center">
          <div className="text-white">Laddar Enhanced Trading Bot...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${
                botStatus?.connection_status?.active_exchanges ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'
              }`}></div>
              <span className="text-white font-medium">{connectionStatus}</span>
              <Badge variant="outline" className="text-gray-300">
                {botStatus?.connection_status?.demo_exchanges || 0} demo börser
              </Badge>
            </div>
            
            <div className="flex space-x-2">
              {botStatus?.trading_active ? (
                <Button onClick={handleStopTrading} variant="destructive" size="sm">
                  ⏹️ Stoppa Trading
                </Button>
              ) : (
                <Button onClick={handleStartTrading} size="sm">
                  🚀 Starta Trading
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-gray-700">
          <TabsTrigger value="overview" className="text-white">📊 Översikt</TabsTrigger>
          <TabsTrigger value="signals" className="text-white">🤖 AI Signaler</TabsTrigger>
          <TabsTrigger value="strategy" className="text-white">🧠 Strategi</TabsTrigger>
          <TabsTrigger value="performance" className="text-white">📈 Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Portfolio Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-400">
                  ${(botStatus?.portfolio?.balance || balance || 0).toLocaleString()}
                </div>
                <div className="text-sm text-gray-400">Portfolio Saldo</div>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4 text-center">
                <div className={`text-2xl font-bold ${
                  (botStatus?.portfolio?.profit_live || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  ${(botStatus?.portfolio?.profit_live || 0).toFixed(2)}
                </div>
                <div className="text-sm text-gray-400">Live Vinst</div>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-400">
                  {(botStatus?.portfolio?.win_rate || 0).toFixed(1)}%
                </div>
                <div className="text-sm text-gray-400">Vinstprocent</div>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-white">
                  {botStatus?.portfolio?.total_trades || 0}
                </div>
                <div className="text-sm text-gray-400">Totala Trades</div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">⚡ Snabbåtgärder</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Button variant="outline" className="text-white border-gray-600">
                  📊 Live Marknad
                </Button>
                <Button variant="outline" className="text-white border-gray-600">
                  💹 Arbitrage
                </Button>
                <Button variant="outline" className="text-white border-gray-600">
                  🔄 Historik
                </Button>
                <Button variant="outline" className="text-white border-gray-600">
                  ⚙️ Inställningar
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="signals" className="mt-6">
          <AISignalPanel onExecuteSignal={handleExecuteSignal} />
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
