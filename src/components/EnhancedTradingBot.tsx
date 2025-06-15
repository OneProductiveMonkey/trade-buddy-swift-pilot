
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bot, Play, Square, TrendingUp, DollarSign, Target, Zap } from 'lucide-react';
import { MarketAnalysisPanel } from './MarketAnalysisPanel';
import { ArbitrageOpportunities } from './ArbitrageOpportunities';
import { RealTimeTradeLog } from './RealTimeTradeLog';

interface Portfolio {
  balance: number;
  profit_live: number;
  profit_24h: number;
  total_trades: number;
  successful_trades: number;
  win_rate: number;
}

interface AISignal {
  coin: string;
  symbol: string;
  direction: string;
  confidence: number;
  current_price: number;
  target_price: number;
  risk_level: string;
  timeframe: string;
}

interface EnhancedTradingBotProps {
  onTrade?: (order: any) => void;
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
  const [portfolio, setPortfolio] = useState<Portfolio>({
    balance: balance,
    profit_live: 0,
    profit_24h: 0,
    total_trades: 0,
    successful_trades: 0,
    win_rate: 0
  });
  
  const [aiSignals, setAiSignals] = useState<AISignal[]>([]);
  const [tradingConfig, setTradingConfig] = useState({
    budget: 200,
    strategy: 'arbitrage',
    riskLevel: 'medium'
  });
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');

  useEffect(() => {
    updateData();
    const interval = setInterval(updateData, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const updateData = async () => {
    try {
      const response = await fetch('/api/enhanced_status');
      const data = await response.json();
      
      setPortfolio(data.portfolio);
      setAiSignals(data.ai_signals || []);
      
      // Update connection status
      const healthResponse = await fetch('/api/health');
      const healthData = await healthResponse.json();
      setConnectionStatus(
        `Connected to ${healthData.active_exchanges} exchanges • ${healthData.monitored_markets} markets`
      );
    } catch (error) {
      console.error('Failed to update data:', error);
      setConnectionStatus('Connection Issues');
    }
  };

  const handleStartTrading = async () => {
    try {
      const response = await fetch('/api/start_enhanced_trading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tradingConfig)
      });
      
      const result = await response.json();
      if (result.success) {
        onToggleActive();
      }
    } catch (error) {
      console.error('Failed to start trading:', error);
    }
  };

  const handleStopTrading = async () => {
    try {
      await fetch('/api/stop_enhanced_trading', { method: 'POST' });
      onToggleActive();
    } catch (error) {
      console.error('Failed to stop trading:', error);
    }
  };

  const executeSignal = async (signal: AISignal) => {
    try {
      const response = await fetch('/api/execute_enhanced_trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: signal.symbol,
          side: signal.direction,
          amount_usd: tradingConfig.budget,
          strategy: 'ai_signal',
          confidence: signal.confidence
        })
      });
      
      const result = await response.json();
      if (onTrade) {
        onTrade({
          type: signal.direction,
          symbol: signal.symbol,
          amount: tradingConfig.budget / signal.current_price,
          price: signal.current_price
        });
      }
    } catch (error) {
      console.error('Failed to execute signal:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Portfolio Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4 text-center">
            <DollarSign className="w-8 h-8 mx-auto mb-2 text-green-400" />
            <div className="text-2xl font-bold text-white">
              ${portfolio.balance.toFixed(2)}
            </div>
            <div className="text-sm text-gray-400">Portfolio Balance</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-8 h-8 mx-auto mb-2 text-blue-400" />
            <div className={`text-2xl font-bold ${portfolio.profit_live >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {portfolio.profit_live >= 0 ? '+' : ''}${portfolio.profit_live.toFixed(2)}
            </div>
            <div className="text-sm text-gray-400">Live Profit</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4 text-center">
            <Target className="w-8 h-8 mx-auto mb-2 text-purple-400" />
            <div className="text-2xl font-bold text-white">
              {portfolio.win_rate.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-400">Win Rate</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4 text-center">
            <Zap className="w-8 h-8 mx-auto mb-2 text-yellow-400" />
            <div className="text-2xl font-bold text-white">
              {portfolio.total_trades}
            </div>
            <div className="text-sm text-gray-400">Total Trades</div>
          </CardContent>
        </Card>
      </div>

      {/* Trading Controls */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Bot className="w-5 h-5 mr-2 text-green-400" />
            Trading Controls
            <Badge 
              variant={isActive ? "default" : "secondary"}
              className="ml-2"
            >
              {isActive ? "Active" : "Inactive"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Trading Budget
              </label>
              <input
                type="number"
                value={tradingConfig.budget}
                onChange={(e) => setTradingConfig({...tradingConfig, budget: Number(e.target.value)})}
                className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white"
                min="100"
                max="1000"
                step="50"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Strategy
              </label>
              <select
                value={tradingConfig.strategy}
                onChange={(e) => setTradingConfig({...tradingConfig, strategy: e.target.value})}
                className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white"
              >
                <option value="arbitrage">Multi-Exchange Arbitrage</option>
                <option value="ai_signals">AI Signal Trading</option>
                <option value="hybrid">Hybrid Strategy</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Risk Level
              </label>
              <select
                value={tradingConfig.riskLevel}
                onChange={(e) => setTradingConfig({...tradingConfig, riskLevel: e.target.value})}
                className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white"
              >
                <option value="low">Low Risk</option>
                <option value="medium">Medium Risk</option>
                <option value="high">High Risk</option>
              </select>
            </div>
          </div>
          
          <div className="flex space-x-4">
            <Button
              onClick={isActive ? handleStopTrading : handleStartTrading}
              className={isActive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}
            >
              {isActive ? (
                <>
                  <Square className="w-4 h-4 mr-2" />
                  Stop Trading
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Start Trading
                </>
              )}
            </Button>
          </div>
          
          <div className="mt-4 text-sm text-gray-400">
            Status: {connectionStatus}
          </div>
        </CardContent>
      </Card>

      {/* AI Signals */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">🤖 AI Trading Signals</CardTitle>
        </CardHeader>
        <CardContent>
          {aiSignals.length === 0 ? (
            <div className="text-center py-4 text-gray-400">
              No signals available. Analyzing market conditions...
            </div>
          ) : (
            <div className="grid gap-3">
              {aiSignals.map((signal, index) => (
                <div key={index} className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-white">{signal.coin}</span>
                      <Badge variant={signal.direction === 'buy' ? 'default' : 'destructive'}>
                        {signal.direction.toUpperCase()}
                      </Badge>
                      <Badge variant="outline">
                        {signal.confidence.toFixed(1)}% confidence
                      </Badge>
                    </div>
                    <Button
                      onClick={() => executeSignal(signal)}
                      size="sm"
                      className={signal.direction === 'buy' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                    >
                      Execute
                    </Button>
                  </div>
                  <div className="text-sm text-gray-400">
                    Current: ${signal.current_price.toFixed(4)} → Target: ${signal.target_price.toFixed(4)}
                    <br />
                    {signal.risk_level} • {signal.timeframe}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Advanced Features Tabs */}
      <Tabs defaultValue="market-analysis" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-gray-800">
          <TabsTrigger value="market-analysis">Market Analysis</TabsTrigger>
          <TabsTrigger value="arbitrage">Arbitrage</TabsTrigger>
          <TabsTrigger value="trade-log">Trade Log</TabsTrigger>
        </TabsList>
        
        <TabsContent value="market-analysis">
          <MarketAnalysisPanel />
        </TabsContent>
        
        <TabsContent value="arbitrage">
          <ArbitrageOpportunities onExecute={(opp) => console.log('Arbitrage executed:', opp)} />
        </TabsContent>
        
        <TabsContent value="trade-log">
          <RealTimeTradeLog />
        </TabsContent>
      </Tabs>
    </div>
  );
};
