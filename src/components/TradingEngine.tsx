
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { tradingApi } from '@/services/tradingApi';
import { useToast } from '@/hooks/use-toast';
import { 
  Bot, 
  Play, 
  Square, 
  TrendingUp, 
  DollarSign, 
  Target, 
  Zap,
  Activity,
  BarChart3,
  Settings
} from 'lucide-react';

interface TradingEngineProps {
  onTrade?: (order: any) => void;
  balance: number;
}

export const TradingEngine: React.FC<TradingEngineProps> = ({ onTrade, balance }) => {
  const [isActive, setIsActive] = useState(false);
  const [portfolio, setPortfolio] = useState({
    balance: balance,
    profit_live: 0,
    profit_24h: 0,
    total_trades: 0,
    successful_trades: 0,
    win_rate: 0
  });
  const [aiSignals, setAiSignals] = useState([]);
  const [arbitrageOps, setArbitrageOps] = useState([]);
  const [tradingConfig, setTradingConfig] = useState({
    budget: 25,
    strategy: 'arbitrage',
    riskLevel: 'medium'
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    updateTradingData();
    const interval = setInterval(updateTradingData, 3000);
    return () => clearInterval(interval);
  }, []);

  const updateTradingData = async () => {
    try {
      const data = await tradingApi.getEnhancedStatus();
      setPortfolio(data.portfolio);
      setAiSignals(data.ai_signals || []);
      setArbitrageOps(data.arbitrage_opportunities || []);
    } catch (error) {
      console.error('Trading data update failed:', error);
    }
  };

  const handleStartTrading = async () => {
    if (tradingConfig.budget < 5) {
      toast({
        title: "⚠️ Ogiltigt belopp",
        description: 'Minsta handelsbelopp är $5',
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await tradingApi.startEnhancedTrading(tradingConfig);
      if (result.success) {
        setIsActive(true);
        toast({
          title: "🚀 Trading Startad",
          description: `Bot aktiverad med $${tradingConfig.budget} budget`,
        });
      } else {
        toast({
          title: "❌ Misslyckades att starta",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "❌ Startfel",
        description: error.message || 'Misslyckades att starta trading',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStopTrading = async () => {
    try {
      await tradingApi.stopEnhancedTrading();
      setIsActive(false);
      toast({
        title: "⏹️ Trading Stoppad",
        description: "Bot har inaktiverats",
      });
    } catch (error) {
      toast({
        title: "❌ Stoppfel",
        description: "Misslyckades att stoppa trading bot",
        variant: "destructive",
      });
    }
  };

  const executeSignal = async (signal: any) => {
    try {
      const result = await tradingApi.executeEnhancedTrade({
        symbol: signal.symbol,
        side: signal.direction,
        amount_usd: tradingConfig.budget,
        strategy: 'ai_signal',
        confidence: signal.confidence
      });
      
      if (result.success && onTrade) {
        onTrade({
          type: signal.direction,
          symbol: signal.symbol,
          amount: tradingConfig.budget / signal.current_price,
          price: signal.current_price
        });
      }
      
      toast({
        title: result.success ? "✅ Signal Utförd" : "❌ Signal Misslyckades",
        description: result.message,
        variant: result.success ? "default" : "destructive"
      });
    } catch (error: any) {
      toast({
        title: "❌ Exekveringsfel",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStrategyInfo = (strategy: string) => {
    const strategies = {
      arbitrage: { icon: '🔄', name: 'Arbitrage', color: 'text-blue-400' },
      ai_signals: { icon: '🤖', name: 'AI Signals', color: 'text-purple-400' },
      hybrid: { icon: '⚡', name: 'Hybrid', color: 'text-green-400' }
    };
    return strategies[strategy as keyof typeof strategies] || strategies.arbitrage;
  };

  const strategyInfo = getStrategyInfo(tradingConfig.strategy);

  return (
    <div className="space-y-6">
      {/* Trading Engine Header */}
      <Card className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-green-500/10 border-blue-500/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">AI Trading Engine</h2>
                <p className="text-sm text-gray-400">Multi-strategi automatiserad handel</p>
              </div>
              <Badge 
                variant={isActive ? "default" : "secondary"}
                className={`px-3 py-1 ${isActive ? 'bg-green-600 text-white animate-pulse' : 'bg-gray-700 text-gray-300'}`}
              >
                <Activity className="w-3 h-3 mr-1" />
                {isActive ? 'LIVE' : 'INACTIVE'}
              </Badge>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm text-gray-400">Aktiv strategi</div>
                <div className={`text-lg font-bold ${strategyInfo.color}`}>
                  {strategyInfo.icon} {strategyInfo.name}
                </div>
              </div>
              
              <Button
                onClick={isActive ? handleStopTrading : handleStartTrading}
                disabled={loading}
                className={`px-6 ${
                  isActive 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {isActive ? (
                  <>
                    <Square className="w-4 h-4 mr-2" />
                    Stoppa
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    {loading ? 'Startar...' : 'Starta'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gray-900/50 border-gray-800">
          <CardContent className="p-4 text-center">
            <DollarSign className="w-6 h-6 mx-auto mb-2 text-green-400" />
            <div className="text-lg font-bold text-white">
              ${portfolio.balance.toFixed(2)}
            </div>
            <div className="text-xs text-gray-400">Portfölj Saldo</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-900/50 border-gray-800">
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-6 h-6 mx-auto mb-2 text-blue-400" />
            <div className={`text-lg font-bold ${portfolio.profit_live >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {portfolio.profit_live >= 0 ? '+' : ''}${portfolio.profit_live.toFixed(2)}
            </div>
            <div className="text-xs text-gray-400">Live Vinst</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-900/50 border-gray-800">
          <CardContent className="p-4 text-center">
            <Target className="w-6 h-6 mx-auto mb-2 text-purple-400" />
            <div className="text-lg font-bold text-white">
              {portfolio.win_rate.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-400">Vinstfrekvens</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-900/50 border-gray-800">
          <CardContent className="p-4 text-center">
            <Zap className="w-6 h-6 mx-auto mb-2 text-yellow-400" />
            <div className="text-lg font-bold text-white">
              {portfolio.total_trades}
            </div>
            <div className="text-xs text-gray-400">Totala Trades</div>
          </CardContent>
        </Card>
      </div>

      {/* Trading Configuration */}
      <Card className="bg-gray-900/50 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            Trading Konfiguration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Budget ($)
              </label>
              <input
                type="number"
                value={tradingConfig.budget}
                onChange={(e) => setTradingConfig({...tradingConfig, budget: Number(e.target.value)})}
                className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white"
                min="5"
                max="500"
                step="5"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Strategi
              </label>
              <select
                value={tradingConfig.strategy}
                onChange={(e) => setTradingConfig({...tradingConfig, strategy: e.target.value})}
                className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white"
              >
                <option value="arbitrage">🔄 Arbitrage</option>
                <option value="ai_signals">🤖 AI Signaler</option>
                <option value="hybrid">⚡ Hybrid</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Risk Nivå
              </label>
              <select
                value={tradingConfig.riskLevel}
                onChange={(e) => setTradingConfig({...tradingConfig, riskLevel: e.target.value})}
                className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white"
              >
                <option value="low">🟢 Låg Risk</option>
                <option value="medium">🟡 Medium Risk</option>
                <option value="high">🔴 Hög Risk</option>
              </select>
            </div>
          </div>
          
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
            <div className="text-sm text-blue-200">
              <span className="font-medium">💡 Tip:</span> Börja med låg risk och små belopp för att testa systemet.
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Signals & Opportunities */}
      <Tabs defaultValue="signals" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-gray-800">
          <TabsTrigger value="signals">🤖 AI Signaler</TabsTrigger>
          <TabsTrigger value="arbitrage">🔄 Arbitrage</TabsTrigger>
        </TabsList>
        
        <TabsContent value="signals">
          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-6">
              {aiSignals.length === 0 ? (
                <div className="text-center py-8">
                  <Bot className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-400">Inga AI signaler tillgängliga</p>
                  <p className="text-sm text-gray-500">Analyserar marknadsförhållanden...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {aiSignals.map((signal: any, index) => (
                    <div key={index} className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-bold text-white">{signal.coin}</span>
                            <Badge variant={signal.direction === 'buy' ? 'default' : 'destructive'}>
                              {signal.direction.toUpperCase()}
                            </Badge>
                            <Badge variant="outline">
                              {signal.confidence.toFixed(1)}%
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-400">
                            ${signal.current_price.toFixed(4)} → ${signal.target_price.toFixed(4)}
                          </div>
                        </div>
                        <Button
                          onClick={() => executeSignal(signal)}
                          size="sm"
                          className={signal.direction === 'buy' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                        >
                          Utför
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="arbitrage">
          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-6">
              {arbitrageOps.length === 0 ? (
                <div className="text-center py-8">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-400">Inga arbitrage möjligheter</p>
                  <p className="text-sm text-gray-500">Skannar börser...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {arbitrageOps.map((opp: any, index) => (
                    <div key={index} className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-bold text-white mb-1">{opp.name}</div>
                          <div className="text-sm text-gray-400">
                            {opp.buy_exchange} → {opp.sell_exchange}
                          </div>
                          <div className="text-sm text-green-400">
                            +{opp.profit_pct.toFixed(2)}% (${opp.profit_usd.toFixed(2)})
                          </div>
                        </div>
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                          Utför
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
