
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Activity, Filter, TrendingUp, TrendingDown, Clock } from 'lucide-react';

interface TradeEntry {
  timestamp: string;
  exchange: string;
  symbol: string;
  side: string;
  amount: number;
  price: number;
  usd_amount: number;
  profit: number;
  profit_pct: number;
  strategy: string;
  confidence: number;
  execution_time: number;
}

interface RealTimeTradeLogProps {
  maxEntries?: number;
}

export const RealTimeTradeLog: React.FC<RealTimeTradeLogProps> = ({ maxEntries = 50 }) => {
  const [trades, setTrades] = useState<TradeEntry[]>([]);
  const [filter, setFilter] = useState<'all' | 'buy' | 'sell' | 'profitable'>('all');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTrades();
    const interval = setInterval(fetchTrades, 3000); // Update every 3 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchTrades = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/enhanced_status');
      const data = await response.json();
      setTrades(data.trade_log || []);
    } catch (error) {
      console.error('Failed to fetch trades:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTrades = trades.filter(trade => {
    switch (filter) {
      case 'buy': return trade.side === 'BUY';
      case 'sell': return trade.side === 'SELL';
      case 'profitable': return trade.profit > 0;
      default: return true;
    }
  });

  const getTradeIcon = (side: string) => {
    return side === 'BUY' ? 
      <TrendingUp className="w-4 h-4 text-green-400" /> : 
      <TrendingDown className="w-4 h-4 text-red-400" />;
  };

  const getProfitColor = (profit: number) => {
    if (profit > 0) return 'text-green-400';
    if (profit < 0) return 'text-red-400';
    return 'text-gray-400';
  };

  const getStrategyColor = (strategy: string) => {
    switch (strategy) {
      case 'arbitrage': return 'bg-blue-600';
      case 'ai_signal': return 'bg-purple-600';
      case 'manual': return 'bg-gray-600';
      default: return 'bg-gray-600';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center">
            <Activity className="w-5 h-5 mr-2 text-blue-400" />
            Real-Time Trade Log
            {loading && <Clock className="w-4 h-4 ml-2 animate-spin text-blue-400" />}
          </CardTitle>
          
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select 
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="bg-gray-800 border border-gray-700 text-white rounded px-2 py-1 text-sm"
            >
              <option value="all">All Trades</option>
              <option value="buy">Buy Orders</option>
              <option value="sell">Sell Orders</option>
              <option value="profitable">Profitable Only</option>
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          {filteredTrades.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No trades found for the selected filter</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTrades.slice(0, maxEntries).map((trade, index) => (
                <div 
                  key={`${trade.timestamp}-${index}`}
                  className="bg-gray-800 rounded-lg p-3 border border-gray-700 hover:border-gray-600 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getTradeIcon(trade.side)}
                      <span className="text-white font-medium">
                        {trade.symbol}
                      </span>
                      <Badge 
                        className={`text-xs ${getStrategyColor(trade.strategy)} text-white`}
                      >
                        {trade.strategy}
                      </Badge>
                    </div>
                    
                    <div className="text-xs text-gray-400">
                      {trade.timestamp}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Amount:</span>
                        <span className="text-white">{trade.amount.toFixed(6)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Price:</span>
                        <span className="text-white">${trade.price.toFixed(4)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Value:</span>
                        <span className="text-white">{formatCurrency(trade.usd_amount)}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Profit:</span>
                        <span className={getProfitColor(trade.profit)}>
                          {formatCurrency(trade.profit)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Profit %:</span>
                        <span className={getProfitColor(trade.profit)}>
                          {trade.profit_pct > 0 ? '+' : ''}{trade.profit_pct.toFixed(2)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Exchange:</span>
                        <span className="text-white text-xs">{trade.exchange}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-2 pt-2 border-t border-gray-700 flex justify-between items-center text-xs">
                    <div className="text-gray-400">
                      Confidence: {trade.confidence.toFixed(1)}%
                    </div>
                    <div className="text-gray-400">
                      Execution: {trade.execution_time.toFixed(2)}s
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        
        <div className="mt-4 text-xs text-gray-500 text-center">
          Showing {filteredTrades.length} of {trades.length} trades • Updates every 3 seconds
        </div>
      </CardContent>
    </Card>
  );
};
