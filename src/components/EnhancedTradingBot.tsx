import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowUpRight, ArrowDownLeft, TrendingUp, TrendingDown, Zap, Bot, Target, Activity, AlertTriangle } from 'lucide-react';
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
  const { toast } = useToast();

  // Check if API is configured
  const apiConfigured = isApiConfigured();
  const setupInstructions = getSetupInstructions();

  // Update data from backend API
  useEffect(() => {
    const updateData = async () => {
      try {
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
              const avgPrice = Object.values(exchangePrices).length > 0 
                ? Object.values(exchangePrices).reduce((a: number, b: number) => a + b, 0) / Object.values(exchangePrices).length
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
          // Use fallback data
          generateFallbackData();
        }
        
        // Get health check
        const healthData = await tradingApi.getHealthCheck();
        if (healthData.status === 'healthy') {
          setConnectionStatus(`Connected to ${healthData.active_exchanges} exchanges • ${healthData.monitored_markets} markets`);
        }
        
      } catch (error) {
        console.error('Update error:', error);
        setBackendConnected(false);
        setConnectionStatus('connection error');
        generateFallbackData();
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
      const buyPrice = Math.min(...Object.values(market.exchanges));
      const sellPrice = Math.max(...Object.values(market.exchanges));
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
        title: "Invalid Budget",
        description: `Minimum trading budget is $${TRADING_CONFIG.MIN_TRADE_AMOUNT}`,
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await tradingApi.startEnhancedTrading({
        budget: tradingBudget,
        strategy,
        risk_level: riskLevel
      });

      if (result.success) {
        onToggleActive();
        toast({
          title: "Trading Started",
          description: result.message,
        });
      } else {
        toast({
          title: "Failed to Start Trading",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Connection Error",
        description: "Unable to connect to trading backend",
        variant: "destructive",
      });
    }
  };

  const handleStopTrading = async () => {
    try {
      const result = await tradingApi.stopEnhancedTrading();
      
      if (result.success) {
        onToggleActive();
        toast({
          title: "Trading Stopped",
          description: result.message,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to stop trading",
        variant: "destructive",
      });
    }
  };

  const executeArbitrage = async (opportunity: ArbitrageOpportunity) => {
    try {
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
          title: "Arbitrage Executed",
          description: result.message,
        });
      } else {
        toast({
          title: "Arbitrage Failed",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Execution Error",
        description: "Failed to execute arbitrage trade",
        variant: "destructive",
      });
    }
  };

  const executeAISignal = async (signal: AISignal) => {
    try {
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
          title: "AI Signal Executed",
          description: result.message,
        });
      } else {
        toast({
          title: "Signal Execution Failed",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Execution Error",
        description: "Failed to execute AI signal",
        variant: "destructive",
      });
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'border-green-400 bg-green-500/10';
    if (confidence >= 60) return 'border-yellow-400 bg-yellow-500/10';
    return 'border-red-400 bg-red-500/10';
  };

  return (
    <div className="space-y-6">
      {/* API Configuration Warning */}
      {!apiConfigured && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">API Configuration Required for Live Trading</p>
              <p className="text-sm opacity-80">{setupInstructions.message}</p>
              <div className="text-xs space-y-1 mt-2">
                {setupInstructions.variables.map((variable, index) => (
                  <div key={index} className="font-mono bg-gray-100 dark:bg-gray-800 p-1 rounded">
                    {variable}
                  </div>
                ))}
              </div>
              <p className="text-xs opacity-70 mt-2">{setupInstructions.note}</p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Connection Status */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center text-white">
            <Bot className="w-5 h-5 mr-2" />
            Enhanced Trading Bot
            <div className={`ml-auto flex items-center ${isActive ? 'text-green-400' : 'text-red-400'}`}>
              <div className={`w-2 h-2 rounded-full mr-2 ${isActive ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
              {isActive ? 'ACTIVE' : 'INACTIVE'}
            </div>
          </CardTitle>
          <div className="text-sm text-gray-400">
            Status: {connectionStatus} • Backend: {backendConnected ? 'Connected' : 'Offline'}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* ... keep existing code (trading controls and configuration) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Strategy</label>
              <select 
                value={strategy} 
                onChange={(e) => setStrategy(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
              >
                <option value="arbitrage">Multi-Exchange Arbitrage</option>
                <option value="ai_signals">AI Signal Trading</option>
                <option value="hybrid">Hybrid (Arbitrage + AI)</option>
                <option value="conservative">Conservative Mode</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Risk Level</label>
              <select 
                value={riskLevel} 
                onChange={(e) => setRiskLevel(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
              >
                <option value="low">Low Risk (0.3-0.8%)</option>
                <option value="medium">Medium Risk (0.5-1.5%)</option>
                <option value="high">High Risk (1.0-3.0%)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Trading Budget</label>
              <input 
                type="number" 
                value={tradingBudget} 
                onChange={(e) => setTradingBudget(Number(e.target.value))}
                min={TRADING_CONFIG.MIN_TRADE_AMOUNT} 
                max={Math.min(TRADING_CONFIG.MAX_TRADE_AMOUNT, balance * 0.5)}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
              />
            </div>
          </div>
          
          <div className="flex gap-4">
            <Button 
              onClick={isActive ? handleStopTrading : handleStartTrading}
              className={`flex-1 ${isActive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
            >
              {isActive ? '⏹️ Stop Trading' : '🚀 Start Trading'}
            </Button>
          </div>

          {/* Portfolio Stats */}
          {portfolioData && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div className="bg-gray-700/30 p-3 rounded">
                <div className="text-xs text-gray-400">Balance</div>
                <div className="text-lg font-bold text-white">${portfolioData.balance.toFixed(2)}</div>
              </div>
              <div className="bg-gray-700/30 p-3 rounded">
                <div className="text-xs text-gray-400">Live Profit</div>
                <div className={`text-lg font-bold ${portfolioData.profit_live >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ${portfolioData.profit_live.toFixed(2)}
                </div>
              </div>
              <div className="bg-gray-700/30 p-3 rounded">
                <div className="text-xs text-gray-400">Win Rate</div>
                <div className="text-lg font-bold text-white">{portfolioData.win_rate.toFixed(1)}%</div>
              </div>
              <div className="bg-gray-700/30 p-3 rounded">
                <div className="text-xs text-gray-400">Total Trades</div>
                <div className="text-lg font-bold text-white">{portfolioData.total_trades}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Arbitrage Opportunities */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center text-white">
              <Zap className="w-5 h-5 mr-2" />
              Arbitrage Opportunities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {arbitrageOpportunities.length === 0 ? (
                <p className="text-gray-400 text-center py-4">Scanning for opportunities...</p>
              ) : (
                arbitrageOpportunities.map((opp, index) => (
                  <div key={index} className="p-3 bg-gray-700/30 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium text-white">{opp.name}</h4>
                        <p className="text-sm text-gray-400">
                          Buy: {opp.buy_exchange} (${opp.buy_price.toFixed(4)}) → 
                          Sell: {opp.sell_exchange} (${opp.sell_price.toFixed(4)})
                        </p>
                      </div>
                      <Badge className="bg-green-600 text-white">
                        +{opp.profit_pct}%
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-green-400 font-mono">
                        Profit: ${opp.profit_usd}
                      </span>
                      <Button 
                        size="sm" 
                        onClick={() => executeArbitrage(opp)}
                        className="bg-blue-600 hover:bg-blue-700"
                        disabled={!isActive && !backendConnected}
                      >
                        Execute
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* AI Signals */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center text-white">
              <Target className="w-5 h-5 mr-2" />
              AI Trading Signals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {aiSignals.length === 0 ? (
                <p className="text-gray-400 text-center py-4">Analyzing market conditions...</p>
              ) : (
                aiSignals.map((signal, index) => (
                  <div 
                    key={index} 
                    className={`p-3 rounded-lg border-l-4 ${getConfidenceColor(signal.confidence)}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium text-white">{signal.coin}</h4>
                        <p className="text-sm text-gray-400">
                          {signal.direction.toUpperCase()} • {signal.confidence}% confidence
                        </p>
                        <p className="text-xs text-gray-500">
                          ${signal.current_price} → ${signal.target_price} • {signal.timeframe}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge 
                          className={`${signal.direction === 'buy' ? 'bg-green-600' : 'bg-red-600'} text-white mb-1`}
                        >
                          {signal.direction === 'buy' ? (
                            <><ArrowUpRight className="w-3 h-3 mr-1" />BUY</>
                          ) : (
                            <><ArrowDownLeft className="w-3 h-3 mr-1" />SELL</>
                          )}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="text-xs text-gray-400">
                        RSI: {signal.analysis.rsi.toFixed(1)} | Trend: {signal.analysis.trend}
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => executeAISignal(signal)}
                        className={`${signal.direction === 'buy' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                        disabled={!isActive && !backendConnected}
                      >
                        Execute
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
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center text-white">
            <Activity className="w-5 h-5 mr-2" />
            Multi-Exchange Market Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {marketData.map((market, index) => (
              <div key={index} className="p-4 bg-gray-700/30 rounded-lg">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-medium text-white">{market.name}</h4>
                    <p className="text-sm text-gray-400">{market.symbol}</p>
                  </div>
                  <Badge
                    className={`${market.change >= 0 ? 'bg-green-600' : 'bg-red-600'} text-white`}
                  >
                    {market.change >= 0 ? (
                      <TrendingUp className="w-3 h-3 mr-1" />
                    ) : (
                      <TrendingDown className="w-3 h-3 mr-1" />
                    )}
                    {market.change >= 0 ? '+' : ''}{market.change.toFixed(2)}%
                  </Badge>
                </div>
                
                <div className="text-xl font-mono text-white mb-3">
                  ${market.price.toFixed(market.symbol.includes('BTC') ? 0 : 2)}
                </div>
                
                <div className="space-y-1">
                  <p className="text-xs text-gray-400 mb-1">Exchange Prices:</p>
                  {Object.entries(market.exchanges).slice(0, 3).map(([exchange, price]) => (
                    <div key={exchange} className="flex justify-between text-xs">
                      <span className="text-gray-400">{exchange}:</span>
                      <span className="text-white">${price.toFixed(4)}</span>
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
