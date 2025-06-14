
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, RotateCcw } from 'lucide-react';

interface TradeReplayData {
  id: string;
  timestamp: string;
  symbol: string;
  side: 'buy' | 'sell';
  amount: number;
  price: number;
  profit: number;
  strategy: string;
  confidence: number;
  exchange: string;
}

export const TradeReplay: React.FC = () => {
  const [trades, setTrades] = useState<TradeReplayData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1000); // milliseconds

  // Mock trade data - replace with real data from your API
  const generateMockTrades = (): TradeReplayData[] => {
    const symbols = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT'];
    const strategies = ['arbitrage', 'ai_signal', 'manual'];
    const exchanges = ['Binance', 'KuCoin', 'Bybit'];
    
    return Array.from({ length: 20 }, (_, i) => ({
      id: `trade_${i}`,
      timestamp: new Date(Date.now() - (20 - i) * 300000).toISOString(),
      symbol: symbols[Math.floor(Math.random() * symbols.length)],
      side: Math.random() > 0.5 ? 'buy' : 'sell',
      amount: Math.random() * 10 + 0.1,
      price: Math.random() * 50000 + 1000,
      profit: (Math.random() - 0.3) * 100,
      strategy: strategies[Math.floor(Math.random() * strategies.length)],
      confidence: Math.random() * 100,
      exchange: exchanges[Math.floor(Math.random() * exchanges.length)]
    }));
  };

  useEffect(() => {
    setTrades(generateMockTrades());
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isPlaying && currentIndex < trades.length - 1) {
      interval = setInterval(() => {
        setCurrentIndex(prev => {
          if (prev < trades.length - 1) {
            return prev + 1;
          } else {
            setIsPlaying(false);
            return prev;
          }
        });
      }, speed);
    }

    return () => clearInterval(interval);
  }, [isPlaying, currentIndex, trades.length, speed]);

  const handlePlayPause = () => {
    if (currentIndex >= trades.length - 1) {
      setCurrentIndex(0);
    }
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setIsPlaying(false);
  };

  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed);
  };

  const currentTrade = trades[currentIndex];
  const visibleTrades = trades.slice(0, currentIndex + 1).reverse();

  const getStrategyColor = (strategy: string) => {
    switch (strategy) {
      case 'arbitrage': return 'bg-blue-500';
      case 'ai_signal': return 'bg-purple-500';
      case 'manual': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getProfitColor = (profit: number) => {
    return profit > 0 ? 'text-green-400' : 'text-red-400';
  };

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-green-400">🕒 Trade Replay</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Controls */}
        <div className="flex items-center justify-between mb-4 p-3 bg-gray-700 rounded-lg">
          <div className="flex items-center space-x-2">
            <Button 
              onClick={handlePlayPause}
              size="sm"
              className="flex items-center space-x-1"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isPlaying ? 'Pausa' : 'Spela'}</span>
            </Button>
            <Button 
              onClick={handleReset}
              size="sm"
              variant="outline"
              className="flex items-center space-x-1"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset</span>
            </Button>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-white text-sm">Hastighet:</span>
            {[2000, 1000, 500].map(speedOption => (
              <Button
                key={speedOption}
                onClick={() => handleSpeedChange(speedOption)}
                size="sm"
                variant={speed === speedOption ? "default" : "outline"}
                className="text-xs"
              >
                {speedOption === 2000 ? '0.5x' : speedOption === 1000 ? '1x' : '2x'}
              </Button>
            ))}
          </div>
        </div>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-400 mb-1">
            <span>Trade {currentIndex + 1} av {trades.length}</span>
            <span>{isPlaying ? 'Spelar...' : 'Pausad'}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-green-400 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / trades.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Current Trade Highlight */}
        {currentTrade && (
          <div className="mb-4 p-4 bg-gradient-to-r from-green-900/30 to-blue-900/30 border border-green-500 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Badge className={`${getStrategyColor(currentTrade.strategy)} text-white`}>
                  {currentTrade.strategy.toUpperCase()}
                </Badge>
                <span className="text-white font-bold">{currentTrade.symbol}</span>
                <Badge variant={currentTrade.side === 'buy' ? 'default' : 'destructive'}>
                  {currentTrade.side.toUpperCase()}
                </Badge>
              </div>
              <div className={`font-bold ${getProfitColor(currentTrade.profit)}`}>
                {currentTrade.profit > 0 ? '+' : ''}${currentTrade.profit.toFixed(2)}
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2 text-sm">
              <div>
                <div className="text-gray-400">Amount</div>
                <div className="text-white">{currentTrade.amount.toFixed(6)}</div>
              </div>
              <div>
                <div className="text-gray-400">Price</div>
                <div className="text-white">${currentTrade.price.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-gray-400">Exchange</div>
                <div className="text-white">{currentTrade.exchange}</div>
              </div>
              <div>
                <div className="text-gray-400">Confidence</div>
                <div className="text-white">{currentTrade.confidence.toFixed(1)}%</div>
              </div>
            </div>
          </div>
        )}

        {/* Trade History */}
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {visibleTrades.map((trade, index) => (
            <div 
              key={trade.id}
              className={`p-3 rounded-lg transition-all duration-300 ${
                index === 0 ? 'bg-green-900/30 border border-green-500' : 'bg-gray-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-400">
                    {new Date(trade.timestamp).toLocaleTimeString()}
                  </span>
                  <Badge className={`${getStrategyColor(trade.strategy)} text-white text-xs`}>
                    {trade.strategy}
                  </Badge>
                  <span className="text-white text-sm">{trade.symbol}</span>
                  <Badge 
                    variant={trade.side === 'buy' ? 'default' : 'destructive'}
                    className="text-xs"
                  >
                    {trade.side.toUpperCase()}
                  </Badge>
                </div>
                <div className={`text-sm font-bold ${getProfitColor(trade.profit)}`}>
                  {trade.profit > 0 ? '+' : ''}${trade.profit.toFixed(2)}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="mt-4 p-3 bg-gray-700 rounded-lg">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-white font-bold">
                {visibleTrades.filter(t => t.profit > 0).length}
              </div>
              <div className="text-xs text-green-400">Vinnande</div>
            </div>
            <div>
              <div className="text-white font-bold">
                {visibleTrades.filter(t => t.profit < 0).length}
              </div>
              <div className="text-xs text-red-400">Förlorande</div>
            </div>
            <div>
              <div className={`font-bold ${getProfitColor(visibleTrades.reduce((sum, t) => sum + t.profit, 0))}`}>
                ${visibleTrades.reduce((sum, t) => sum + t.profit, 0).toFixed(2)}
              </div>
              <div className="text-xs text-gray-400">Total Vinst</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
