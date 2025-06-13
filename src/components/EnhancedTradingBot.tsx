
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, ArrowDownLeft, TrendingUp, TrendingDown, Zap, Bot, Target, Activity } from 'lucide-react';

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
  buyExchange: string;
  sellExchange: string;
  buyPrice: number;
  sellPrice: number;
  profitPct: number;
  profitUsd: number;
  confidence: number;
  priority: number;
}

interface AISignal {
  symbol: string;
  name: string;
  direction: 'buy' | 'sell' | 'hold';
  confidence: number;
  currentPrice: number;
  targetPrice: number;
  riskLevel: string;
  timeframe: string;
  analysis: {
    rsi: number;
    trend: string;
    volume: number;
    momentum: number;
  };
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
  const [strategy, setStrategy] = useState('arbitrage');
  const [riskLevel, setRiskLevel] = useState('medium');
  const [tradingBudget, setTradingBudget] = useState(200);

  const exchanges = ['Binance', 'Coinbase', 'KuCoin', 'OKX', 'Bybit'];

  const selectedMarkets = [
    {
      symbol: 'BTC/USDT',
      name: 'Bitcoin',
      basePrice: 43000,
      minProfitThreshold: 0.3,
      tradeAmountPct: 30,
      volatility: 'medium' as const,
      priority: 1
    },
    {
      symbol: 'ETH/USDT', 
      name: 'Ethereum',
      basePrice: 2600,
      minProfitThreshold: 0.4,
      tradeAmountPct: 25,
      volatility: 'medium' as const,
      priority: 2
    },
    {
      symbol: 'SOL/USDT',
      name: 'Solana',
      basePrice: 100,
      minProfitThreshold: 0.5,
      tradeAmountPct: 20,
      volatility: 'high' as const,
      priority: 3
    }
  ];

  // Simulate real-time market data
  useEffect(() => {
    const generateMarketData = () => {
      const markets = selectedMarkets.map(market => {
        const exchangePrices: { [key: string]: number } = {};
        const basePrice = market.basePrice;
        
        exchanges.forEach(exchange => {
          // Simulate price variations between exchanges
          const variation = (Math.random() - 0.5) * (basePrice * 0.005); // 0.5% max variation
          exchangePrices[exchange] = basePrice + variation;
        });

        const avgPrice = Object.values(exchangePrices).reduce((a, b) => a + b, 0) / exchanges.length;
        const change = (Math.random() - 0.5) * 10; // Random change percentage

        return {
          symbol: market.symbol,
          name: market.name,
          price: avgPrice,
          change,
          exchanges: exchangePrices,
          volatility: market.volatility,
          priority: market.priority
        };
      });

      setMarketData(markets);
      
      // Generate arbitrage opportunities
      generateArbitrageOpportunities(markets);
      
      // Generate AI signals
      generateAISignals(markets);
    };

    generateMarketData();
    const interval = setInterval(generateMarketData, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const generateArbitrageOpportunities = (markets: MarketData[]) => {
    const opportunities: ArbitrageOpportunity[] = [];

    markets.forEach(market => {
      const exchangeNames = Object.keys(market.exchanges);
      
      for (let i = 0; i < exchangeNames.length; i++) {
        for (let j = 0; j < exchangeNames.length; j++) {
          if (i !== j) {
            const buyExchange = exchangeNames[i];
            const sellExchange = exchangeNames[j];
            const buyPrice = market.exchanges[buyExchange];
            const sellPrice = market.exchanges[sellExchange];
            
            const profitPct = ((sellPrice - buyPrice) / buyPrice) * 100;
            const minProfit = selectedMarkets.find(m => m.symbol === market.symbol)?.minProfitThreshold || 0.3;
            
            if (profitPct > minProfit) {
              const positionSize = Math.min(tradingBudget, balance * 0.3);
              const profitUsd = (sellPrice - buyPrice) * (positionSize / buyPrice);
              
              opportunities.push({
                symbol: market.symbol,
                name: market.name,
                buyExchange,
                sellExchange,
                buyPrice,
                sellPrice,
                profitPct: Number(profitPct.toFixed(3)),
                profitUsd: Number(profitUsd.toFixed(2)),
                confidence: Math.min(0.9, profitPct / minProfit * 0.6),
                priority: market.priority
              });
            }
          }
        }
      }
    });

    // Sort by profit potential
    opportunities.sort((a, b) => (b.profitPct * b.priority) - (a.profitPct * a.priority));
    setArbitrageOpportunities(opportunities.slice(0, 5));
  };

  const generateAISignals = (markets: MarketData[]) => {
    const signals: AISignal[] = [];

    markets.forEach(market => {
      // Simulate technical analysis
      const rsi = Math.random() * 100;
      const trend = Math.random() > 0.5 ? 'bullish' : 'bearish';
      const volume = 0.8 + Math.random() * 1.2; // 0.8 to 2.0
      const momentum = (Math.random() - 0.5) * 2; // -1 to 1

      let direction: 'buy' | 'sell' | 'hold' = 'hold';
      let confidence = 0;

      // AI signal logic
      if (rsi < 35 && trend === 'bullish') {
        direction = 'buy';
        confidence = 85 + Math.random() * 10;
      } else if (rsi > 65 && trend === 'bearish') {
        direction = 'sell';
        confidence = 75 + Math.random() * 15;
      } else if (momentum > 0.5 && volume > 1.3) {
        direction = 'buy';
        confidence = 70 + Math.random() * 15;
      }

      if (confidence > 70) {
        const targetPct = direction === 'buy' ? 3 : -2;
        const targetPrice = market.price * (1 + targetPct / 100);

        signals.push({
          symbol: market.symbol,
          name: market.name,
          direction,
          confidence: Number(confidence.toFixed(1)),
          currentPrice: Number(market.price.toFixed(4)),
          targetPrice: Number(targetPrice.toFixed(4)),
          riskLevel: `${market.volatility} risk`,
          timeframe: '1-3 hours',
          analysis: {
            rsi: Number(rsi.toFixed(1)),
            trend,
            volume: Number(volume.toFixed(2)),
            momentum: Number(momentum.toFixed(2))
          }
        });
      }
    });

    setAISignals(signals.slice(0, 3));
  };

  const executeArbitrage = (opportunity: ArbitrageOpportunity) => {
    console.log('Executing arbitrage:', opportunity);
    
    // Execute buy order
    onTrade({
      symbol: opportunity.symbol,
      type: 'buy',
      amount: tradingBudget / opportunity.buyPrice,
      price: opportunity.buyPrice,
      exchange: opportunity.buyExchange,
      strategy: 'arbitrage'
    });

    // Simulate sell order after brief delay
    setTimeout(() => {
      onTrade({
        symbol: opportunity.symbol,
        type: 'sell',
        amount: tradingBudget / opportunity.buyPrice,
        price: opportunity.sellPrice,
        exchange: opportunity.sellExchange,
        strategy: 'arbitrage'
      });
    }, 1000);
  };

  const executeAISignal = (signal: AISignal) => {
    console.log('Executing AI signal:', signal);
    
    const amount = (tradingBudget * 0.5) / signal.currentPrice; // Use 50% of budget
    
    onTrade({
      symbol: signal.symbol,
      type: signal.direction,
      amount,
      price: signal.currentPrice,
      exchange: 'AI_Signal',
      strategy: 'ai_signal',
      confidence: signal.confidence
    });
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'border-green-400 bg-green-500/10';
    if (confidence >= 60) return 'border-yellow-400 bg-yellow-500/10';
    return 'border-red-400 bg-red-500/10';
  };

  return (
    <div className="space-y-6">
      {/* Bot Control Panel */}
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
        </CardHeader>
        <CardContent className="space-y-4">
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
                min={100} 
                max={Math.min(1000, balance * 0.5)}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
              />
            </div>
          </div>
          
          <div className="flex gap-4">
            <Button 
              onClick={onToggleActive}
              className={`flex-1 ${isActive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
            >
              {isActive ? (
                <>⏹️ Stop Trading</>
              ) : (
                <>🚀 Start Trading</>
              )}
            </Button>
          </div>
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
                          Buy: {opp.buyExchange} (${opp.buyPrice.toFixed(4)}) → 
                          Sell: {opp.sellExchange} (${opp.sellPrice.toFixed(4)})
                        </p>
                      </div>
                      <Badge className="bg-green-600 text-white">
                        +{opp.profitPct}%
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-green-400 font-mono">
                        Profit: ${opp.profitUsd}
                      </span>
                      <Button 
                        size="sm" 
                        onClick={() => executeArbitrage(opp)}
                        className="bg-blue-600 hover:bg-blue-700"
                        disabled={!isActive}
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
                        <h4 className="font-medium text-white">{signal.name}</h4>
                        <p className="text-sm text-gray-400">
                          {signal.direction.toUpperCase()} • {signal.confidence}% confidence
                        </p>
                        <p className="text-xs text-gray-500">
                          ${signal.currentPrice} → ${signal.targetPrice} • {signal.timeframe}
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
                        RSI: {signal.analysis.rsi} | Trend: {signal.analysis.trend}
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => executeAISignal(signal)}
                        className={`${signal.direction === 'buy' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                        disabled={!isActive}
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
