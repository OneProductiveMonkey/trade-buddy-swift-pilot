
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { marketDataService } from '@/services/marketDataService';

interface TrendingCoin {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap_rank: number;
  total_volume: number;
  sentiment_score?: number;
}

interface MemeAnalysis {
  coin: TrendingCoin;
  pump_potential: number;
  volume_spike: number;
  social_mentions: number;
  risk_level: 'low' | 'medium' | 'high';
}

export const TrendingCoins: React.FC = () => {
  const [trendingCoins, setTrendingCoins] = useState<TrendingCoin[]>([]);
  const [memeAnalysis, setMemeAnalysis] = useState<MemeAnalysis[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTrendingData = async () => {
    setLoading(true);
    try {
      const [trending, memeCoins] = await Promise.all([
        marketDataService.getTrendingCoins(),
        marketDataService.getMemeCoins()
      ]);
      
      setTrendingCoins(trending.slice(0, 10));
      
      const analysis = await marketDataService.analyzeMemeOpportunities(memeCoins);
      setMemeAnalysis(analysis.slice(0, 8));
    } catch (error) {
      console.error('Error fetching trending data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrendingData();
    const interval = setInterval(fetchTrendingData, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const getPriceChangeColor = (change: number) => {
    if (change > 0) return 'text-green-400';
    if (change < 0) return 'text-red-400';
    return 'text-gray-400';
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'high': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const CoinRow = ({ coin }: { coin: TrendingCoin }) => (
    <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg mb-2">
      <div className="flex items-center space-x-3">
        <img src={coin.image} alt={coin.name} className="w-8 h-8 rounded-full" />
        <div>
          <div className="text-white font-medium">{coin.symbol.toUpperCase()}</div>
          <div className="text-xs text-gray-400">#{coin.market_cap_rank}</div>
        </div>
      </div>
      <div className="text-right">
        <div className="text-white">${coin.current_price.toFixed(6)}</div>
        <div className={`text-xs ${getPriceChangeColor(coin.price_change_percentage_24h)}`}>
          {coin.price_change_percentage_24h > 0 ? '+' : ''}{coin.price_change_percentage_24h?.toFixed(2)}%
        </div>
      </div>
    </div>
  );

  const MemeAnalysisRow = ({ analysis }: { analysis: MemeAnalysis }) => (
    <div className="p-3 bg-gray-700 rounded-lg mb-2">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-3">
          <img src={analysis.coin.image} alt={analysis.coin.name} className="w-6 h-6 rounded-full" />
          <div>
            <span className="text-white font-medium">{analysis.coin.symbol.toUpperCase()}</span>
            <Badge className={`ml-2 ${getRiskColor(analysis.risk_level)} text-white text-xs`}>
              {analysis.risk_level.toUpperCase()}
            </Badge>
          </div>
        </div>
        <div className="text-right">
          <div className="text-orange-400 font-bold">{analysis.pump_potential}%</div>
          <div className="text-xs text-gray-400">Pump Potential</div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="text-center">
          <div className="text-blue-400">{analysis.volume_spike}x</div>
          <div className="text-gray-400">Vol Spike</div>
        </div>
        <div className="text-center">
          <div className="text-purple-400">{analysis.social_mentions}</div>
          <div className="text-gray-400">Social</div>
        </div>
        <div className="text-center">
          <div className="text-green-400">${analysis.coin.current_price.toFixed(6)}</div>
          <div className="text-gray-400">Pris</div>
        </div>
      </div>
    </div>
  );

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-green-400 flex items-center justify-between">
          🔥 Trending & Meme Analys
          <Button 
            onClick={fetchTrendingData} 
            disabled={loading}
            size="sm"
            variant="outline"
          >
            {loading ? 'Uppdaterar...' : 'Uppdatera'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="trending" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-700">
            <TabsTrigger value="trending" className="text-white">📈 Trending</TabsTrigger>
            <TabsTrigger value="meme" className="text-white">🚀 Meme Radar</TabsTrigger>
          </TabsList>

          <TabsContent value="trending" className="mt-4">
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {trendingCoins.map((coin) => (
                <CoinRow key={coin.id} coin={coin} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="meme" className="mt-4">
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {memeAnalysis.map((analysis, index) => (
                <MemeAnalysisRow key={analysis.coin.id} analysis={analysis} />
              ))}
            </div>
            <div className="mt-4 p-3 bg-orange-900/20 border border-orange-500 rounded text-xs">
              <div className="text-orange-400 font-bold">⚠️ Hög Risk Varning</div>
              <div className="text-orange-300">Meme coins är extremt volatila. Handla endast med kapital du har råd att förlora.</div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
