
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';

interface MarketAnalysis {
  symbol: string;
  timestamp: string;
  indicators: {
    rsi: number;
    macd: {
      macd: number;
      signal: number;
      histogram: number;
    };
    bollinger: {
      upper: number;
      middle: number;
      lower: number;
      position: number;
    };
    volume_profile: {
      volume_spike: number;
      trend: string;
    };
  };
  signals: {
    buy_strength: number;
    sell_strength: number;
    overall_trend: string;
    confidence: number;
  };
  price_targets: {
    support: number;
    resistance: number;
    next_target: number;
  };
}

export const MarketAnalysisPanel: React.FC = () => {
  const [selectedSymbol, setSelectedSymbol] = useState('BTC/USDT');
  const [analysis, setAnalysis] = useState<MarketAnalysis | null>(null);
  const [loading, setLoading] = useState(false);

  const symbols = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT'];

  useEffect(() => {
    fetchAnalysis();
    const interval = setInterval(fetchAnalysis, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, [selectedSymbol]);

  const fetchAnalysis = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/market_analysis/${selectedSymbol}`);
      const data = await response.json();
      setAnalysis(data);
    } catch (error) {
      console.error('Failed to fetch market analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRSIColor = (rsi: number) => {
    if (rsi > 70) return 'text-red-400';
    if (rsi < 30) return 'text-green-400';
    return 'text-yellow-400';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'bullish': return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'bearish': return <TrendingDown className="w-4 h-4 text-red-400" />;
      default: return <Activity className="w-4 h-4 text-yellow-400" />;
    }
  };

  if (!analysis) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-gray-400">Loading market analysis...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-blue-400" />
            Market Analysis
          </CardTitle>
          <div className="flex space-x-2">
            {symbols.map((symbol) => (
              <button
                key={symbol}
                onClick={() => setSelectedSymbol(symbol)}
                className={`px-3 py-1 rounded text-sm ${
                  selectedSymbol === symbol
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {symbol.split('/')[0]}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="indicators" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gray-800">
            <TabsTrigger value="indicators">Indicators</TabsTrigger>
            <TabsTrigger value="signals">Signals</TabsTrigger>
            <TabsTrigger value="targets">Targets</TabsTrigger>
          </TabsList>
          
          <TabsContent value="indicators" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-800 p-4 rounded-lg">
                <h4 className="text-white font-medium mb-2">RSI (14)</h4>
                <div className={`text-2xl font-bold ${getRSIColor(analysis.indicators.rsi)}`}>
                  {analysis.indicators.rsi.toFixed(1)}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {analysis.indicators.rsi > 70 ? 'Overbought' : 
                   analysis.indicators.rsi < 30 ? 'Oversold' : 'Neutral'}
                </div>
              </div>
              
              <div className="bg-gray-800 p-4 rounded-lg">
                <h4 className="text-white font-medium mb-2">MACD</h4>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">MACD:</span>
                    <span className="text-white">{analysis.indicators.macd.macd.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Signal:</span>
                    <span className="text-white">{analysis.indicators.macd.signal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-800 p-4 rounded-lg">
                <h4 className="text-white font-medium mb-2">Bollinger Bands</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Position:</span>
                    <span className="text-white">{(analysis.indicators.bollinger.position * 100).toFixed(1)}%</span>
                  </div>
                  <div className="text-xs text-gray-400">
                    {analysis.indicators.bollinger.position > 0.8 ? 'Near Upper Band' :
                     analysis.indicators.bollinger.position < 0.2 ? 'Near Lower Band' : 'Mid Range'}
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-800 p-4 rounded-lg">
                <h4 className="text-white font-medium mb-2">Volume</h4>
                <div className="flex items-center space-x-2">
                  <div className="text-lg font-bold text-white">
                    {analysis.indicators.volume_profile.volume_spike.toFixed(1)}x
                  </div>
                  {getTrendIcon(analysis.indicators.volume_profile.trend)}
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="signals" className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-gray-800 p-4 rounded-lg">
                <h4 className="text-white font-medium mb-3">Trading Signals</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Buy Strength:</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-green-400 h-2 rounded-full"
                          style={{ width: `${analysis.signals.buy_strength}%` }}
                        />
                      </div>
                      <span className="text-white text-sm">{analysis.signals.buy_strength.toFixed(0)}%</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Sell Strength:</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-red-400 h-2 rounded-full"
                          style={{ width: `${analysis.signals.sell_strength}%` }}
                        />
                      </div>
                      <span className="text-white text-sm">{analysis.signals.sell_strength.toFixed(0)}%</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2 border-t border-gray-700">
                    <span className="text-gray-400">Overall Trend:</span>
                    <Badge 
                      variant={analysis.signals.overall_trend === 'bullish' ? 'default' : 
                              analysis.signals.overall_trend === 'bearish' ? 'destructive' : 'secondary'}
                    >
                      {analysis.signals.overall_trend}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Confidence:</span>
                    <span className="text-white font-bold">{analysis.signals.confidence.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="targets" className="space-y-4">
            <div className="bg-gray-800 p-4 rounded-lg">
              <h4 className="text-white font-medium mb-3">Price Targets</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-green-400">Support:</span>
                  <span className="text-white font-mono">${analysis.price_targets.support.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-red-400">Resistance:</span>
                  <span className="text-white font-mono">${analysis.price_targets.resistance.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-blue-400">Next Target:</span>
                  <span className="text-white font-mono">${analysis.price_targets.next_target.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        {loading && (
          <div className="text-xs text-gray-400 mt-2 flex items-center">
            <Activity className="w-3 h-3 mr-1 animate-spin" />
            Updating analysis...
          </div>
        )}
      </CardContent>
    </Card>
  );
};
