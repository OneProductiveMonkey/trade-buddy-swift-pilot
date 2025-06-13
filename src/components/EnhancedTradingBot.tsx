
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowUpRight, ArrowDownLeft, TrendingUp, TrendingDown, Zap, Bot, Target, Activity, AlertTriangle, CheckCircle, XCircle, Wifi, WifiOff } from 'lucide-react';
import { tradingApi } from '@/services/tradingApi';
import { TRADING_CONFIG, isApiConfigured, getSetupInstructions } from '@/config/tradingConfig';
import { useToast } from '@/hooks/use-toast';

interface MarketData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  exchanges: { [key: string]: number };
  volatility: 'low' | 'medium' | 'high';
  priority: number;
}

interface ArbitrageOpportunity {
  symbol: string;
  name: string;
  buy_exchange: string;
  sell_exchange: string;
  buy_price: number;
  sell_price: number;
  profit_pct: number;
  profit_usd: number;
  confidence: number;
  priority: number;
  position_size: number;
}

interface AISignal {
  symbol: string;
  coin: string;
  direction: 'buy' | 'sell' | 'hold';
  confidence: number;
  current_price: number;
  target_price: number;
  risk_level: string;
  timeframe: string;
  analysis: {
    rsi: number;
    trend: string;
    volume: number;
    momentum: number;
  };
}

interface PortfolioData {
  balance: number;
  profit_live: number;
  profit_24h: number;
  profit_1_5h: number;
  total_trades: number;
  successful_trades: number;
  win_rate: number;
}

interface EnhancedTradingBotProps {
  onTrade: (order: any) => void;
  balance: number;
  isActive: boolean;
  onToggleActive: () => void;
}

export const EnhancedTradingBot: React.FC<EnhancedTradingBotProps> = ({ 
  onTrade, 
  balance, 
  isActive, 
  onToggleActive 
}) => {
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [arbitrageOpportunities, setArbitrageOpportunities] = useState<ArbitrageOpportunity[]>([]);
  const [aiSignals, setAISignals] = useState<AISignal[]>([]);
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null);
  const [strategy, setStrategy] = useState('arbitrage');
  const [riskLevel, setRiskLevel] = useState('medium');
  const [tradingBudget, setTradingBudget] = useState(200);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [backendConnected, setBackendConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Check if API is configured
  const apiConfigured = isApiConfigured();
  const setupInstructions = getSetupInstructions();

  // Update data from backend API
  useEffect(() => {
    const updateData = async () => {
      try {
        setLoading(true);
        
        // Get enhanced status
        const statusData = await tradingApi.getEnhancedStatus();
        
        if (statusData && !statusData.error) {
          setBackendConnected(true);
          setPortfolioData(statusData.portfolio);
          setAISignals(statusData.ai_signals || []);
          setArbitrageOpportunities(statusData.arbitrage_opportunities || []);
          
          // Update market data from prices
          if (statusData.prices) {
            const markets = TRADING_CONFIG.SELECTED_MARKETS.map(market => {
              const exchangePrices = statusData.prices[market.symbol] || {};
              const prices = Object.values(exchangePrices) as number[];
              const avgPrice = prices.length > 0 
                ? prices.reduce((a, b) => a + b, 0) / prices.length
                : market.basePrice;
              
              return {
                symbol: market.symbol,
                name: market.name,
                price: avgPrice,
                change: (Math.random() - 0.5) * 10, // Simulated change
                exchanges: exchangePrices,
                volatility: market.volatility,
                priority: market.priority
              };
            });
            setMarketData(markets);
          }
          
          setConnectionStatus('connected');
        } else {
          setBackendConnected(false);
          setConnectionStatus('offline');
          generateFallbackData();
        }
        
        // Get health check
        const healthData = await tradingApi.getHealthCheck();
        if (healthData.status === 'healthy') {
          setConnectionStatus(`Ansluten till ${healthData.active_exchanges} börser • ${healthData.monitored_markets} marknader`);
        }
        
      } catch (error) {
        console.error('Update error:', error);
        setBackendConnected(false);
        setConnectionStatus('anslutningsfel');
        generateFallbackData();
      } finally {
        setLoading(false);
      }
    };

    // Initial update
    updateData();
    
    // Set up interval for regular updates
    const interval = setInterval(updateData, TRADING_CONFIG.STATUS_UPDATE_INTERVAL);
    
    return () => clearInterval(interval);
  }, []);

  const generateFallbackData = () => {
    // Generate fallback data when backend is not available
    const markets = TRADING_CONFIG.SELECTED_MARKETS.map(market => {
      const exchangePrices: { [key: string]: number } = {};
      TRADING_CONFIG.EXCHANGES.forEach(exchange => {
        const variation = (Math.random() - 0.5) * (market.basePrice * 0.005);
        exchangePrices[exchange] = market.basePrice + variation;
      });

      return {
        symbol: market.symbol,
        name: market.name,
        price: market.basePrice,
        change: (Math.random() - 0.5) * 10,
        exchanges: exchangePrices,
        volatility: market.volatility,
        priority: market.priority
      };
    });
    
    setMarketData(markets);
    
    // Generate sample arbitrage opportunities
    const opportunities: ArbitrageOpportunity[] = [];
    markets.forEach(market => {
      const prices = Object.values(market.exchanges) as number[];
      const buyPrice = Math.min(...prices);
      const sellPrice = Math.max(...prices);
      const profitPct = ((sellPrice - buyPrice) / buyPrice) * 100;
      
      if (profitPct > 0.3) {
        opportunities.push({
          symbol: market.symbol,
          name: market.name,
          buy_exchange: 'Binance',
          sell_exchange: 'Coinbase',
          buy_price: buyPrice,
          sell_price: sellPrice,
          profit_pct: Number(profitPct.toFixed(3)),
          profit_usd: Number((profitPct * tradingBudget / 100).toFixed(2)),
          confidence: 0.7,
          priority: market.priority,
          position_size: tradingBudget
        });
      }
    });
    
    setArbitrageOpportunities(opportunities.slice(0, 3));
  };

  const handleStartTrading = async () => {
    if (tradingBudget < TRADING_CONFIG.MIN_TRADE_AMOUNT) {
      toast({
        title: "Ogiltig Budget",
        description: `Minsta trading budget är $${TRADING_CONFIG.MIN_TRADE_AMOUNT}`,
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const result = await tradingApi.startEnhancedTrading({
        budget: tradingBudget,
        strategy,
        risk_level: riskLevel
      });

      if (result.success) {
        onToggleActive();
        toast({
          title: "Trading Startad",
          description: result.message,
        });
      } else {
        toast({
          title: "Misslyckades att Starta Trading",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Anslutningsfel",
        description: "Kan inte ansluta till trading backend",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStopTrading = async () => {
    try {
      setLoading(true);
      const result = await tradingApi.stopEnhancedTrading();
      
      if (result.success) {
        onToggleActive();
        toast({
          title: "Trading Stoppad",
          description: result.message,
        });
      }
    } catch (error) {
      toast({
        title: "Fel",
        description: "Misslyckades att stoppa trading",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const executeArbitrage = async (opportunity: ArbitrageOpportunity) => {
    try {
      setLoading(true);
      const result = await tradingApi.executeArbitrage({
        symbol: opportunity.symbol,
        buy_exchange: opportunity.buy_exchange,
        sell_exchange: opportunity.sell_exchange,
        position_size: opportunity.position_size
      });

      if (result.success) {
        // Also trigger local trade tracking
        onTrade({
          symbol: opportunity.symbol,
          type: 'buy',
          amount: opportunity.position_size / opportunity.buy_price,
          price: opportunity.buy_price,
          exchange: opportunity.buy_exchange,
          strategy: 'arbitrage'
        });

        setTimeout(() => {
          onTrade({
            symbol: opportunity.symbol,
            type: 'sell',
            amount: opportunity.position_size / opportunity.buy_price,
            price: opportunity.sell_price,
            exchange: opportunity.sell_exchange,
            strategy: 'arbitrage'
          });
        }, 1000);

        toast({
          title: "Arbitrage Utfört",
          description: result.message,
        });
      } else {
        toast({
          title: "Arbitrage Misslyckades",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Exekveringsfel",
        description: "Misslyckades att utföra arbitrage trade",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const executeAISignal = async (signal: AISignal) => {
    try {
      setLoading(true);
      const result = await tradingApi.executeEnhancedTrade({
        symbol: signal.symbol,
        side: signal.direction,
        amount_usd: tradingBudget * 0.5,
        strategy: 'ai_signal',
        confidence: signal.confidence
      });

      if (result.success) {
        // Also trigger local trade tracking
        onTrade({
          symbol: signal.symbol,
          type: signal.direction,
          amount: (tradingBudget * 0.5) / signal.current_price,
          price: signal.current_price,
          exchange: 'AI_Signal',
          strategy: 'ai_signal',
          confidence: signal.confidence
        });

        toast({
          title: "AI Signal Utförd",
          description: result.message,
        });
      } else {
        toast({
          title: "Signal Exekvering Misslyckades",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Exekveringsfel",
        description: "Misslyckades att utföra AI signal",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'border-green-500 bg-green-500/20 text-green-400';
    if (confidence >= 60) return 'border-yellow-500 bg-yellow-500/20 text-yellow-400';
    return 'border-red-500 bg-red-500/20 text-red-400';
  };

  const getConnectionIcon = () => {
    if (backendConnected) return <Wifi className="w-4 h-4 text-green-400" />;
    return <WifiOff className="w-4 h-4 text-red-400" />;
  };

  const getStatusIcon = () => {
    if (isActive) return <CheckCircle className="w-4 h-4 text-green-400" />;
    return <XCircle className="w-4 h-4 text-red-400" />;
  };

  return (
    <div className="space-y-6">
      {/* API Configuration Warning */}
      {!apiConfigured && (
        <Alert className="border-orange-500 bg-orange-500/10">
          <AlertTriangle className="h-4 w-4 text-orange-400" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium text-orange-400">API Konfiguration Krävs för Live Trading</p>
              <p className="text-sm text-orange-300">{setupInstructions.message}</p>
              <div className="text-xs space-y-1 mt-2">
                {setupInstructions.variables.map((variable, index) => (
                  <div key={index} className="font-mono bg-gray-100 dark:bg-gray-800 p-1 rounded text-gray-800 dark:text-gray-200">
                    {variable}
                  </div>
                ))}
              </div>
              <p className="text-xs text-orange-400 mt-2">{setupInstructions.note}</p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Enhanced Connection Status */}
      <Card className="bg-gradient-to-r from-gray-900 to-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-white">
            <div className="flex items-center">
              <Bot className="w-6 h-6 mr-3 text-blue-400" />
              <span>Advanced AI Trading Bot</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                {getStatusIcon()}
                <span className="text-sm font-medium">{isActive ? 'AKTIV' : 'INAKTIV'}</span>
              </div>
              <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${backendConnected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                {getConnectionIcon()}
                <span className="text-sm">{backendConnected ? 'Ansluten' : 'Offline'}</span>
              </div>
            </div>
          </CardTitle>
          <div className="text-sm text-gray-400 flex items-center">
            <Activity className="w-4 h-4 mr-2" />
            Status: {connectionStatus}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Trading Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">🎯 Strategi</label>
              <select 
                value={strategy} 
                onChange={(e) => setStrategy(e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                disabled={loading}
              >
                <option value="arbitrage">🔄 Multi-Exchange Arbitrage</option>
                <option value="ai_signals">🤖 AI Signal Trading</option>
                <option value="hybrid">⚡ Hybrid (Arbitrage + AI)</option>
                <option value="conservative">🛡️ Conservative Mode</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">⚠️ Risk Nivå</label>
              <select 
                value={riskLevel} 
                onChange={(e) => setRiskLevel(e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                disabled={loading}
              >
                <option value="low">🟢 Låg Risk (0.3-0.8%)</option>
                <option value="medium">🟡 Medium Risk (0.5-1.5%)</option>
                <option value="high">🔴 Hög Risk (1.0-3.0%)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">💵 Trading Budget</label>
              <input 
                type="number" 
                value={tradingBudget} 
                onChange={(e) => setTradingBudget(Number(e.target.value))}
                min={TRADING_CONFIG.MIN_TRADE_AMOUNT} 
                max={Math.min(TRADING_CONFIG.MAX_TRADE_AMOUNT, balance * 0.5)}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                disabled={loading}
              />
              <p className="text-xs text-gray-400 mt-1">
                Min: ${TRADING_CONFIG.MIN_TRADE_AMOUNT} | Max: ${Math.min(TRADING_CONFIG.MAX_TRADE_AMOUNT, balance * 0.5)}
              </p>
            </div>
          </div>
          
          <div className="flex gap-4">
            <Button 
              onClick={isActive ? handleStopTrading : handleStartTrading}
              className={`flex-1 ${isActive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} transition-all duration-200`}
              disabled={loading}
            >
              {loading ? '⏳ Laddar...' : (isActive ? '⏹️ Stoppa Trading' : '🚀 Starta Trading')}
            </Button>
          </div>

          {/* Portfolio Stats */}
          {portfolioData && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-800/50 rounded-lg">
              <div className="text-center">
                <div className="text-xs text-gray-400 mb-1">Balans</div>
                <div className="text-lg font-bold text-white">${portfolioData.balance.toFixed(2)}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-400 mb-1">Live Vinst</div>
                <div className={`text-lg font-bold ${portfolioData.profit_live >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ${portfolioData.profit_live.toFixed(2)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-400 mb-1">Vinstgrad</div>
                <div className="text-lg font-bold text-white">{portfolioData.win_rate.toFixed(1)}%</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-400 mb-1">Totala Trades</div>
                <div className="text-lg font-bold text-white">{portfolioData.total_trades}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Arbitrage Opportunities */}
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center text-white">
              <Zap className="w-5 h-5 mr-2 text-yellow-400" />
              Arbitrage Möjligheter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto"></div>
                  <p className="text-gray-400 mt-2">Scannar möjligheter...</p>
                </div>
              ) : arbitrageOpportunities.length === 0 ? (
                <p className="text-gray-400 text-center py-8">Inga lönsamma möjligheter hittades</p>
              ) : (
                arbitrageOpportunities.map((opp, index) => (
                  <div key={index} className="p-4 bg-gray-800 rounded-lg border border-gray-600 hover:border-gray-500 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium text-white text-lg">{opp.name}</h4>
                        <p className="text-sm text-gray-400">
                          Köp: {opp.buy_exchange} (${opp.buy_price.toFixed(4)}) → 
                          Sälj: {opp.sell_exchange} (${opp.sell_price.toFixed(4)})
                        </p>
                      </div>
                      <Badge className="bg-green-600 text-white font-bold">
                        +{opp.profit_pct}%
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-green-400 font-mono text-lg">
                        Vinst: ${opp.profit_usd}
                      </span>
                      <Button 
                        size="sm" 
                        onClick={() => executeArbitrage(opp)}
                        className="bg-blue-600 hover:bg-blue-700 transition-colors"
                        disabled={!isActive || loading}
                      >
                        ⚡ Utför
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* AI Signals */}
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center text-white">
              <Target className="w-5 h-5 mr-2 text-purple-400" />
              AI Trading Signaler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mx-auto"></div>
                  <p className="text-gray-400 mt-2">Analyserar marknaden...</p>
                </div>
              ) : aiSignals.length === 0 ? (
                <p className="text-gray-400 text-center py-8">Analyserar marknadsförhållanden...</p>
              ) : (
                aiSignals.map((signal, index) => (
                  <div 
                    key={index} 
                    className={`p-4 rounded-lg border-l-4 ${getConfidenceColor(signal.confidence)} bg-gray-800 border border-gray-600`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium text-white text-lg">{signal.coin}</h4>
                        <p className="text-sm text-gray-400">
                          {signal.direction.toUpperCase()} • {signal.confidence}% förtroende
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          ${signal.current_price} → ${signal.target_price} • {signal.timeframe}
                        </p>
                      </div>
                      <Badge 
                        className={`${signal.direction === 'buy' ? 'bg-green-600' : 'bg-red-600'} text-white font-bold`}
                      >
                        {signal.direction === 'buy' ? (
                          <><ArrowUpRight className="w-3 h-3 mr-1" />KÖP</>
                        ) : (
                          <><ArrowDownLeft className="w-3 h-3 mr-1" />SÄLJ</>
                        )}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="text-xs text-gray-400">
                        RSI: {signal.analysis.rsi.toFixed(1)} | Trend: {signal.analysis.trend}
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => executeAISignal(signal)}
                        className={`${signal.direction === 'buy' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} transition-colors`}
                        disabled={!isActive || loading}
                      >
                        ⚡ Utför
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Market Overview */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center text-white">
            <Activity className="w-5 h-5 mr-2 text-green-400" />
            Multi-Exchange Marknadsdata
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {marketData.map((market, index) => (
              <div key={index} className="p-6 bg-gray-800 rounded-lg border border-gray-600 hover:border-gray-500 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-medium text-white text-xl">{market.name}</h4>
                    <p className="text-sm text-gray-400">{market.symbol}</p>
                  </div>
                  <Badge
                    className={`${market.change >= 0 ? 'bg-green-600' : 'bg-red-600'} text-white font-bold`}
                  >
                    {market.change >= 0 ? (
                      <TrendingUp className="w-3 h-3 mr-1" />
                    ) : (
                      <TrendingDown className="w-3 h-3 mr-1" />
                    )}
                    {market.change >= 0 ? '+' : ''}{market.change.toFixed(2)}%
                  </Badge>
                </div>
                
                <div className="text-2xl font-mono text-white mb-4">
                  ${market.price.toFixed(market.symbol.includes('BTC') ? 0 : 2)}
                </div>
                
                <div className="space-y-2">
                  <p className="text-xs text-gray-400 mb-2 font-medium">Börs Priser:</p>
                  {Object.entries(market.exchanges).slice(0, 3).map(([exchange, price]) => (
                    <div key={exchange} className="flex justify-between text-sm bg-gray-700 p-2 rounded">
                      <span className="text-gray-300">{exchange}:</span>
                      <span className="text-white font-mono">${Number(price).toFixed(4)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
