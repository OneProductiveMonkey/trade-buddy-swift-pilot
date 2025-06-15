
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TrendingUp, TrendingDown, Activity, Bot, DollarSign, Target, Zap, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Trade {
  id: string;
  timestamp: string;
  symbol: string;
  side: 'buy' | 'sell';
  amount: number;
  price: number;
  profit: number;
  strategy: string;
}

interface EnhancedTradingBotProps {
  onTrade: (trade: any) => void;
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
  const [portfolio, setPortfolio] = useState({
    balance: balance,
    profit_live: 0,
    profit_24h: 0,
    total_trades: 0,
    win_rate: 0
  });

  const [aiSignals, setAiSignals] = useState([
    {
      coin: 'Bitcoin',
      symbol: 'BTC/USDT',
      direction: 'buy',
      confidence: 85.2,
      current_price: 43250,
      target_price: 44500,
      risk_level: 'Medium risk'
    },
    {
      coin: 'Ethereum',
      symbol: 'ETH/USDT',
      direction: 'buy',
      confidence: 78.9,
      current_price: 2650,
      target_price: 2750,
      risk_level: 'Low risk'
    }
  ]);

  const [tradeHistory, setTradeHistory] = useState<Trade[]>([]);
  const [tradingConfig, setTradingConfig] = useState({
    budget: 500,
    strategy: 'hybrid',
    riskLevel: 'medium'
  });

  const { toast } = useToast();

  useEffect(() => {
    setPortfolio(prev => ({ ...prev, balance }));
  }, [balance]);

  const handleExecuteSignal = (signal: any) => {
    const trade = {
      symbol: signal.symbol,
      side: signal.direction,
      amount: tradingConfig.budget / signal.current_price,
      price: signal.current_price,
      type: signal.direction
    };

    onTrade(trade);

    const newTrade: Trade = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString(),
      symbol: signal.symbol,
      side: signal.direction,
      amount: trade.amount,
      price: signal.current_price,
      profit: Math.random() * 50 - 10, // Simulated profit
      strategy: 'AI Signal'
    };

    setTradeHistory(prev => [newTrade, ...prev.slice(0, 9)]);
    setPortfolio(prev => ({
      ...prev,
      total_trades: prev.total_trades + 1,
      profit_live: prev.profit_live + newTrade.profit,
      win_rate: ((prev.total_trades * prev.win_rate + (newTrade.profit > 0 ? 100 : 0)) / (prev.total_trades + 1))
    }));

    toast({
      title: "Trade Executed",
      description: `${signal.direction.toUpperCase()} ${signal.coin} at $${signal.current_price}`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Portfolio Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Balance</p>
                <p className="text-white text-xl font-bold">${portfolio.balance.toFixed(2)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Live P&L</p>
                <p className={`text-xl font-bold ${portfolio.profit_live >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ${portfolio.profit_live.toFixed(2)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Win Rate</p>
                <p className="text-white text-xl font-bold">{portfolio.win_rate.toFixed(1)}%</p>
              </div>
              <Target className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Trades</p>
                <p className="text-white text-xl font-bold">{portfolio.total_trades}</p>
              </div>
              <Activity className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Trading Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trading Controls */}
        <Card className="lg:col-span-1 bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              Trading Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Auto Trading</span>
              <Switch checked={isActive} onCheckedChange={onToggleActive} />
            </div>

            <div className="space-y-2">
              <label className="text-gray-400 text-sm">Budget ($)</label>
              <Input
                type="number"
                value={tradingConfig.budget}
                onChange={(e) => setTradingConfig(prev => ({ ...prev, budget: Number(e.target.value) }))}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <label className="text-gray-400 text-sm">Strategy</label>
              <Select value={tradingConfig.strategy} onValueChange={(value) => setTradingConfig(prev => ({ ...prev, strategy: value }))}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="arbitrage">Arbitrage</SelectItem>
                  <SelectItem value="ai_signals">AI Signals</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-gray-400 text-sm">Risk Level</label>
              <Select value={tradingConfig.riskLevel} onValueChange={(value) => setTradingConfig(prev => ({ ...prev, riskLevel: value }))}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="low">Low Risk</SelectItem>
                  <SelectItem value="medium">Medium Risk</SelectItem>
                  <SelectItem value="high">High Risk</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isActive && (
              <div className="p-3 bg-green-900/20 border border-green-700 rounded">
                <div className="flex items-center text-green-400">
                  <Bot className="w-4 h-4 mr-2 animate-pulse" />
                  <span className="text-sm">Bot Active - Scanning Markets</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Signals & Trade History */}
        <Card className="lg:col-span-2 bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Trading Dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signals" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-gray-800">
                <TabsTrigger value="signals" className="text-gray-300">AI Signals</TabsTrigger>
                <TabsTrigger value="history" className="text-gray-300">Trade History</TabsTrigger>
              </TabsList>

              <TabsContent value="signals" className="space-y-4">
                {aiSignals.map((signal, index) => (
                  <div key={index} className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-yellow-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-bold">₿</span>
                        </div>
                        <div>
                          <h3 className="text-white font-semibold">{signal.coin}</h3>
                          <p className="text-gray-400 text-sm">{signal.symbol}</p>
                        </div>
                      </div>
                      <Badge 
                        variant={signal.direction === 'buy' ? 'default' : 'destructive'}
                        className={signal.direction === 'buy' ? 'bg-green-600' : 'bg-red-600'}
                      >
                        {signal.direction.toUpperCase()}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <p className="text-gray-400 text-xs">Current Price</p>
                        <p className="text-white font-semibold">${signal.current_price.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs">Target Price</p>
                        <p className="text-white font-semibold">${signal.target_price.toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="mb-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-400">Confidence</span>
                        <span className="text-white">{signal.confidence}%</span>
                      </div>
                      <Progress value={signal.confidence} className="h-2" />
                    </div>

                    <Button 
                      onClick={() => handleExecuteSignal(signal)}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      disabled={!isActive}
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      Execute Trade
                    </Button>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="history">
                <ScrollArea className="h-96">
                  <div className="space-y-2">
                    {tradeHistory.length > 0 ? tradeHistory.map((trade) => (
                      <div key={trade.id} className="p-3 bg-gray-800 rounded border border-gray-700">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Badge variant={trade.side === 'buy' ? 'default' : 'destructive'}>
                              {trade.side.toUpperCase()}
                            </Badge>
                            <div>
                              <p className="text-white text-sm font-semibold">{trade.symbol}</p>
                              <p className="text-gray-400 text-xs">{trade.timestamp}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-white text-sm">${trade.price.toFixed(2)}</p>
                            <p className={`text-xs ${trade.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {trade.profit >= 0 ? '+' : ''}${trade.profit.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )) : (
                      <div className="text-center text-gray-400 py-8">
                        <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No trades executed yet</p>
                        <p className="text-sm">Start trading to see history</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
