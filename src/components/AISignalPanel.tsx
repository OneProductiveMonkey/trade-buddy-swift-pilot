
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowUp, ArrowDown, TrendingUp } from 'lucide-react';

interface AISignal {
  coin: string;
  symbol: string;
  direction: 'buy' | 'sell';
  confidence: number;
  current_price: number;
  target_price: number;
  risk_level: string;
  timeframe: string;
  timestamp: string;
}

interface SignalResponse {
  signals: AISignal[];
  performance: {
    total_signals: number;
    avg_confidence: number;
    buy_signals: number;
    sell_signals: number;
  };
}

export const AISignalPanel: React.FC<{ onExecuteSignal?: (signal: AISignal) => void }> = ({ 
  onExecuteSignal 
}) => {
  const [signalData, setSignalData] = useState<SignalResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchSignals = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/ai_signals');
      if (!response.ok) throw new Error('Failed to fetch signals');
      const data = await response.json();
      setSignalData(data);
    } catch (error) {
      console.error('Error fetching AI signals:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSignals();
    
    if (autoRefresh) {
      const interval = setInterval(fetchSignals, 15000); // Update every 15 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 85) return 'bg-green-500';
    if (confidence >= 75) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getDirectionIcon = (direction: string) => {
    return direction === 'buy' ? (
      <ArrowUp className="w-4 h-4 text-green-400" />
    ) : (
      <ArrowDown className="w-4 h-4 text-red-400" />
    );
  };

  const getRiskColor = (risk: string) => {
    if (risk.includes('Low')) return 'text-green-400';
    if (risk.includes('Medium')) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-purple-400 flex items-center justify-between">
          🤖 AI Trading Signals
          <div className="flex space-x-2">
            <Button 
              onClick={() => setAutoRefresh(!autoRefresh)}
              size="sm"
              variant={autoRefresh ? "default" : "outline"}
            >
              {autoRefresh ? '🔄 Auto' : '⏸️ Manual'}
            </Button>
            <Button 
              onClick={fetchSignals} 
              disabled={loading}
              size="sm"
              variant="outline"
            >
              {loading ? 'Laddar...' : 'Uppdatera'}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {signalData ? (
          <div className="space-y-4">
            {/* Performance Summary */}
            <div className="grid grid-cols-4 gap-3 mb-6">
              <div className="bg-gray-700 p-3 rounded text-center">
                <div className="text-lg font-bold text-white">{signalData.performance.total_signals}</div>
                <div className="text-xs text-gray-400">Totala Signaler</div>
              </div>
              <div className="bg-gray-700 p-3 rounded text-center">
                <div className="text-lg font-bold text-purple-400">
                  {signalData.performance.avg_confidence.toFixed(1)}%
                </div>
                <div className="text-xs text-gray-400">Snitt Säkerhet</div>
              </div>
              <div className="bg-gray-700 p-3 rounded text-center">
                <div className="text-lg font-bold text-green-400">{signalData.performance.buy_signals}</div>
                <div className="text-xs text-gray-400">Köp</div>
              </div>
              <div className="bg-gray-700 p-3 rounded text-center">
                <div className="text-lg font-bold text-red-400">{signalData.performance.sell_signals}</div>
                <div className="text-xs text-gray-400">Sälj</div>
              </div>
            </div>

            {/* Signal List */}
            <div className="space-y-3">
              {signalData.signals.length > 0 ? (
                signalData.signals.map((signal, index) => (
                  <div 
                    key={index}
                    className="bg-gray-700 p-4 rounded-lg border-l-4 border-purple-500"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          {getDirectionIcon(signal.direction)}
                          <span className="font-bold text-white text-lg">
                            {signal.coin}
                          </span>
                        </div>
                        <Badge className={`${getConfidenceColor(signal.confidence)} text-white`}>
                          {signal.confidence}% säkerhet
                        </Badge>
                      </div>
                      <Button 
                        onClick={() => onExecuteSignal?.(signal)}
                        size="sm"
                        className={signal.direction === 'buy' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                      >
                        {signal.direction === 'buy' ? '📈 KÖP' : '📉 SÄLJ'}
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-gray-400">Nuvarande Pris</div>
                        <div className="text-white font-mono">${signal.current_price}</div>
                      </div>
                      <div>
                        <div className="text-gray-400">Målpris</div>
                        <div className="text-white font-mono">${signal.target_price}</div>
                      </div>
                      <div>
                        <div className="text-gray-400">Risknivå</div>
                        <div className={getRiskColor(signal.risk_level)}>{signal.risk_level}</div>
                      </div>
                      <div>
                        <div className="text-gray-400">Tidsram</div>
                        <div className="text-white">{signal.timeframe}</div>
                      </div>
                    </div>

                    <div className="mt-3 text-xs text-gray-400">
                      Genererad: {new Date(signal.timestamp).toLocaleString('sv-SE')}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <TrendingUp className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                  <div className="text-gray-400">Inga signaler just nu</div>
                  <div className="text-gray-500 text-sm">Analyserar marknadsförhållanden...</div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-400">
              {loading ? 'Genererar AI-signaler...' : 'Ingen data tillgänglig'}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
