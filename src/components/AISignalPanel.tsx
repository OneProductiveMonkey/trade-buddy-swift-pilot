
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { tradingApi } from '@/services/tradingApi';
import { useToast } from '@/hooks/use-toast';

interface AISignal {
  coin: string;
  symbol: string;
  direction: 'buy' | 'sell';
  confidence: number;
  current_price: number;
  target_price: number;
  risk_level: string;
  timeframe: string;
  priority: number;
}

interface AISignalPanelProps {
  onExecuteSignal?: (signal: AISignal) => void;
}

export const AISignalPanel: React.FC<AISignalPanelProps> = ({ onExecuteSignal }) => {
  const [signals, setSignals] = useState<AISignal[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchSignals = async () => {
    setLoading(true);
    try {
      const data = await tradingApi.getEnhancedStatus();
      setSignals(data.ai_signals || []);
    } catch (error) {
      console.error('Error fetching AI signals:', error);
      toast({
        title: "Fel vid hämtning av AI-signaler",
        description: "Kunde inte hämta signaler från servern",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteSignal = async (signal: AISignal) => {
    try {
      const result = await tradingApi.executeEnhancedTrade({
        symbol: signal.symbol,
        side: signal.direction,
        amount_usd: 200,
        strategy: 'ai_signal',
        confidence: signal.confidence / 100
      });

      if (result.success) {
        toast({
          title: "AI Signal Genomförd",
          description: `${signal.direction.toUpperCase()} ${signal.coin} genomförd`,
        });
        
        if (onExecuteSignal) {
          onExecuteSignal(signal);
        }
      } else {
        toast({
          title: "Signal Misslyckades",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Exekveringsfel",
        description: "Kunde inte genomföra AI signal",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchSignals();
    const interval = setInterval(fetchSignals, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'bg-green-500';
    if (confidence >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getDirectionColor = (direction: string) => {
    return direction === 'buy' ? 'text-green-400' : 'text-red-400';
  };

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-green-400 flex items-center justify-between">
          🤖 AI Trading Signaler
          <Button 
            onClick={fetchSignals} 
            disabled={loading}
            size="sm"
            variant="outline"
          >
            {loading ? 'Uppdaterar...' : 'Uppdatera'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {signals.length > 0 ? (
          <div className="space-y-4">
            {signals.map((signal, index) => (
              <div 
                key={index}
                className="bg-gray-700 p-4 rounded-lg border border-gray-600"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-white font-medium">{signal.coin}</h4>
                    <Badge variant="outline" className="text-gray-300">
                      {signal.symbol}
                    </Badge>
                  </div>
                  <Badge className={getConfidenceColor(signal.confidence)}>
                    {signal.confidence}% Säkerhet
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                  <div>
                    <span className="text-gray-400">Riktning: </span>
                    <span className={`font-bold ${getDirectionColor(signal.direction)}`}>
                      {signal.direction.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Nuvarande: </span>
                    <span className="text-white">${signal.current_price}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Mål: </span>
                    <span className="text-white">${signal.target_price}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Tidsram: </span>
                    <span className="text-white">{signal.timeframe}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">{signal.risk_level}</span>
                  <Button 
                    onClick={() => handleExecuteSignal(signal)}
                    size="sm"
                    className={signal.direction === 'buy' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                  >
                    {signal.direction === 'buy' ? '📈 KÖP' : '📉 SÄLJ'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-400">
              {loading ? 'Analyserar marknadsförhållanden...' : 'Inga AI-signaler tillgängliga'}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
