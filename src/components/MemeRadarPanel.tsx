
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface MemeCoin {
  id: string;
  name: string;
  symbol: string;
  current_price: number;
  market_cap: number;
  volume_24h: number;
  price_change_24h: number;
  pump_potential: number;
  volume_spike: number;
  risk_level: 'low' | 'medium' | 'high';
  market_cap_rank: number;
  image?: string;
}

interface MemeRadarData {
  meme_candidates: MemeCoin[];
  top_gainers: MemeCoin[];
  volume_leaders: MemeCoin[];
  total_analyzed: number;
}

export const MemeRadarPanel: React.FC = () => {
  const [radarData, setRadarData] = useState<MemeRadarData | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchMemeRadarData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/meme_radar');
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setRadarData(result.data);
          setLastUpdate(new Date());
        }
      }
    } catch (error) {
      console.error('Error fetching meme radar data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMemeRadarData();
    const interval = setInterval(fetchMemeRadarData, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'high': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getPumpColor = (pump: number) => {
    if (pump >= 80) return 'text-red-400';
    if (pump >= 60) return 'text-orange-400';
    if (pump >= 40) return 'text-yellow-400';
    return 'text-green-400';
  };

  const formatMarketCap = (marketCap: number) => {
    if (marketCap >= 1e9) return `$${(marketCap / 1e9).toFixed(1)}B`;
    if (marketCap >= 1e6) return `$${(marketCap / 1e6).toFixed(1)}M`;
    if (marketCap >= 1e3) return `$${(marketCap / 1e3).toFixed(1)}K`;
    return `$${marketCap.toFixed(0)}`;
  };

  const CoinRow = ({ coin }: { coin: MemeCoin }) => (
    <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg mb-2 hover:bg-gray-600 transition-colors">
      <div className="flex items-center space-x-3">
        {coin.image && (
          <img src={coin.image} alt={coin.name} className="w-8 h-8 rounded-full" />
        )}
        <div>
          <div className="text-white font-medium flex items-center space-x-2">
            <span>{coin.symbol}</span>
            <Badge className={`${getRiskColor(coin.risk_level)} text-white text-xs`}>
              {coin.risk_level.toUpperCase()}
            </Badge>
          </div>
          <div className="text-xs text-gray-400">{coin.name}</div>
        </div>
      </div>
      <div className="text-right">
        <div className="text-white">${coin.current_price.toFixed(6)}</div>
        <div className={`text-xs ${coin.price_change_24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {coin.price_change_24h >= 0 ? '+' : ''}{coin.price_change_24h?.toFixed(2)}%
        </div>
      </div>
      <div className="text-right ml-4">
        <div className={`font-bold ${getPumpColor(coin.pump_potential)}`}>
          {coin.pump_potential}%
        </div>
        <div className="text-xs text-gray-400">Pump</div>
      </div>
    </div>
  );

  const MemeAnalysisRow = ({ coin }: { coin: MemeCoin }) => (
    <div className="p-3 bg-gray-700 rounded-lg mb-2">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-3">
          {coin.image && (
            <img src={coin.image} alt={coin.name} className="w-6 h-6 rounded-full" />
          )}
          <div>
            <span className="text-white font-medium">{coin.symbol}</span>
            <Badge className={`ml-2 ${getRiskColor(coin.risk_level)} text-white text-xs`}>
              {coin.risk_level.toUpperCase()}
            </Badge>
          </div>
        </div>
        <div className="text-right">
          <div className={`font-bold ${getPumpColor(coin.pump_potential)}`}>
            {coin.pump_potential}%
          </div>
          <div className="text-xs text-gray-400">Pump Potential</div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="text-center">
          <div className="text-blue-400">{coin.volume_spike}%</div>
          <div className="text-gray-400">Vol Spike</div>
        </div>
        <div className="text-center">
          <div className="text-purple-400">{formatMarketCap(coin.market_cap)}</div>
          <div className="text-gray-400">Market Cap</div>
        </div>
        <div className="text-center">
          <div className="text-green-400">${coin.current_price.toFixed(6)}</div>
          <div className="text-gray-400">Pris</div>
        </div>
      </div>
    </div>
  );

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-green-400 flex items-center justify-between">
          🔥 Meme Coin Radar
          <div className="flex items-center space-x-2">
            {lastUpdate && (
              <span className="text-xs text-gray-400">
                Uppdaterad: {lastUpdate.toLocaleTimeString()}
              </span>
            )}
            <Button 
              onClick={fetchMemeRadarData} 
              disabled={loading}
              size="sm"
              variant="outline"
            >
              {loading ? 'Scannar...' : 'Uppdatera'}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!radarData ? (
          <div className="text-center py-8 text-gray-400">
            {loading ? 'Scannar meme coins...' : 'Ingen data tillgänglig'}
          </div>
        ) : (
          <Tabs defaultValue="candidates" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-gray-700">
              <TabsTrigger value="candidates" className="text-white">
                🚀 Kandidater ({radarData.meme_candidates.length})
              </TabsTrigger>
              <TabsTrigger value="gainers" className="text-white">
                📈 Toppgainare ({radarData.top_gainers.length})
              </TabsTrigger>
              <TabsTrigger value="volume" className="text-white">
                📊 Volym ({radarData.volume_leaders.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="candidates" className="mt-4">
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {radarData.meme_candidates.slice(0, 10).map((coin) => (
                  <MemeAnalysisRow key={coin.id} coin={coin} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="gainers" className="mt-4">
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {radarData.top_gainers.map((coin) => (
                  <CoinRow key={coin.id} coin={coin} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="volume" className="mt-4">
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {radarData.volume_leaders.map((coin) => (
                  <CoinRow key={coin.id} coin={coin} />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        )}

        {radarData && (
          <div className="mt-4 p-3 bg-orange-900/20 border border-orange-500 rounded text-xs">
            <div className="text-orange-400 font-bold">⚠️ Hög Risk Varning</div>
            <div className="text-orange-300">
              Meme coins är extremt volatila. Handla endast med kapital du har råd att förlora.
              Total analyserade: {radarData.total_analyzed} coins.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
