
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { tradingApi } from '@/services/tradingApi';
import { useToast } from '@/hooks/use-toast';

interface AutoModeDecision {
  timestamp: string;
  strategy: string;
  confidence: number;
  rationale: string;
  market_conditions: {
    volatility: number;
    trend_strength: number;
    arbitrage_opportunities: number;
    ai_signal_strength: number;
  };
}

interface AutoModeStatus {
  active: boolean;
  current_strategy: string;
  confidence: number;
  rationale: string;
  market_conditions: any;
  decisions: AutoModeDecision[];
  sandbox_mode: boolean;
}

export const AutoModeStatus: React.FC = () => {
  const [status, setStatus] = useState<AutoModeStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchAutoModeStatus = async () => {
    try {
      const data = await tradingApi.getAutoModeStatus();
      setStatus(data);
    } catch (error) {
      console.error('Error fetching auto mode status:', error);
    }
  };

  const toggleAutoMode = async () => {
    setLoading(true);
    try {
      if (status?.active) {
        // Stop auto mode (implement in tradingApi)
        await tradingApi.stopEnhancedTrading();
        toast({
          title: "Auto Mode Inaktiverad",
          description: "AI väljer inte längre strategier automatiskt",
        });
      } else {
        const result = await tradingApi.activateAutoMode();
        if (result.success) {
          toast({
            title: "🤖 Auto Mode Aktiverad",
            description: `AI valde ${result.strategy} strategi (${result.confidence}% säkerhet)`,
          });
        } else {
          toast({
            title: "Auto Mode Fel",
            description: result.message,
            variant: "destructive",
          });
        }
      }
      await fetchAutoModeStatus();
    } catch (error) {
      toast({
        title: "Auto Mode Fel",
        description: "Kunde inte ändra auto mode status",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAutoModeStatus();
    const interval = setInterval(fetchAutoModeStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const getStrategyColor = (strategy: string) => {
    const colors = {
      arbitrage: 'bg-blue-500',
      ai_signal: 'bg-purple-500',
      hybrid: 'bg-green-500',
      conservative: 'bg-gray-500'
    };
    return colors[strategy as keyof typeof colors] || 'bg-gray-500';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-400';
    if (confidence >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  if (!status) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-4">
          <div className="text-center">Loading auto mode status...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-green-400 flex items-center justify-between">
          🤖 AI Auto Mode
          <div className="flex items-center space-x-2">
            {status.sandbox_mode && (
              <Badge variant="outline" className="text-orange-400 border-orange-400">
                🧪 SANDBOX
              </Badge>
            )}
            <div className={`w-3 h-3 rounded-full ${status.active ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`}></div>
            <Badge variant={status.active ? 'default' : 'outline'}>
              {status.active ? 'AKTIV' : 'INAKTIV'}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Control Panel */}
        <div className="mb-6 p-4 bg-gray-700 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-white font-medium">AI Auto-Strategi</h3>
              <p className="text-sm text-gray-400">
                {status.active 
                  ? 'AI väljer automatiskt optimal strategi baserat på marknadsförhållanden'
                  : 'Manuell strategival är aktivt'
                }
              </p>
            </div>
            <Button 
              onClick={toggleAutoMode}
              disabled={loading}
              className={status.active ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}
            >
              {loading ? 'Ändrar...' : status.active ? 'Stoppa Auto Mode' : 'Starta Auto Mode'}
            </Button>
          </div>

          {status.active && status.current_strategy && (
            <div className="space-y-3">
              <div className="flex items-center space-x-4">
                <div>
                  <span className="text-gray-400 text-sm">Aktuell Strategi:</span>
                  <Badge className={`ml-2 ${getStrategyColor(status.current_strategy)} text-white`}>
                    {status.current_strategy.toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <span className="text-gray-400 text-sm">Säkerhet:</span>
                  <span className={`ml-2 font-bold ${getConfidenceColor(status.confidence)}`}>
                    {status.confidence}%
                  </span>
                </div>
              </div>
              
              {status.rationale && (
                <div className="p-3 bg-gray-600 rounded text-sm">
                  <strong className="text-blue-400">AI Förklaring:</strong>
                  <p className="text-gray-300 mt-1">{status.rationale}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Market Conditions */}
        {status.market_conditions && (
          <div className="mb-6">
            <h4 className="text-white font-medium mb-3">📊 Marknadsförhållanden</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="text-center p-3 bg-gray-700 rounded">
                <div className="text-white font-bold">
                  {(status.market_conditions.volatility * 100).toFixed(1)}%
                </div>
                <div className="text-gray-400 text-xs">Volatilitet</div>
              </div>
              <div className="text-center p-3 bg-gray-700 rounded">
                <div className="text-white font-bold">
                  {status.market_conditions.arbitrage_opportunities}
                </div>
                <div className="text-gray-400 text-xs">Arbitrage</div>
              </div>
              <div className="text-center p-3 bg-gray-700 rounded">
                <div className="text-white font-bold">
                  {(status.market_conditions.ai_signal_strength * 100).toFixed(1)}%
                </div>
                <div className="text-gray-400 text-xs">AI Signal</div>
              </div>
              <div className="text-center p-3 bg-gray-700 rounded">
                <div className="text-white font-bold">
                  {(status.market_conditions.trend_strength * 100).toFixed(1)}%
                </div>
                <div className="text-gray-400 text-xs">Trend</div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Decisions */}
        <div className="space-y-3">
          <h4 className="text-white font-medium">🧠 Senaste AI Beslut</h4>
          
          {status.decisions.length === 0 ? (
            <div className="text-center py-4 text-gray-400">
              {status.active ? 'Väntar på AI-beslut...' : 'Aktivera Auto Mode för att se AI-beslut'}
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {status.decisions.slice(0, 5).map((decision, index) => (
                <div key={index} className="p-3 bg-gray-700 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-400">
                        {new Date(decision.timestamp).toLocaleTimeString()}
                      </span>
                      <Badge className={`${getStrategyColor(decision.strategy)} text-white text-xs`}>
                        {decision.strategy.toUpperCase()}
                      </Badge>
                      <span className={`font-bold text-sm ${getConfidenceColor(decision.confidence)}`}>
                        {decision.confidence}%
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-300 text-sm">{decision.rationale}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
