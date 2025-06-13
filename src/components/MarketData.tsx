
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

export const MarketData = () => {
  const [markets, setMarkets] = useState([]);

  useEffect(() => {
    const generateMarketData = () => [
      {
        symbol: 'BTC/USD',
        price: 45000 + (Math.random() - 0.5) * 2000,
        change: (Math.random() - 0.5) * 10,
        volume: Math.random() * 1000000000,
      },
      {
        symbol: 'ETH/USD',
        price: 3000 + (Math.random() - 0.5) * 200,
        change: (Math.random() - 0.5) * 8,
        volume: Math.random() * 500000000,
      },
      {
        symbol: 'ADA/USD',
        price: 0.5 + (Math.random() - 0.5) * 0.1,
        change: (Math.random() - 0.5) * 15,
        volume: Math.random() * 100000000,
      },
      {
        symbol: 'SOL/USD',
        price: 100 + (Math.random() - 0.5) * 20,
        change: (Math.random() - 0.5) * 12,
        volume: Math.random() * 200000000,
      },
    ];

    setMarkets(generateMarketData());

    const interval = setInterval(() => {
      setMarkets(generateMarketData());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center text-white">
          <Activity className="w-5 h-5 mr-2" />
          Marknadsdata
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {markets.map((market, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition-colors">
              <div>
                <div className="font-medium text-white">{market.symbol}</div>
                <div className="text-sm text-gray-400">
                  Vol: ${(market.volume / 1000000).toFixed(1)}M
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-white">
                  ${market.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
                <Badge
                  variant={market.change >= 0 ? "default" : "destructive"}
                  className={`${
                    market.change >= 0 
                      ? "bg-green-600 hover:bg-green-700" 
                      : "bg-red-600 hover:bg-red-700"
                  } text-white`}
                >
                  {market.change >= 0 ? (
                    <TrendingUp className="w-3 h-3 mr-1" />
                  ) : (
                    <TrendingDown className="w-3 h-3 mr-1" />
                  )}
                  {market.change >= 0 ? '+' : ''}{market.change.toFixed(2)}%
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
