
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { tradingApi } from '@/services/tradingApi';
import { useToast } from '@/hooks/use-toast';

interface AutoModeDecision {
  timestamp: string;
  recommended_strategy: string;
  confidence: number;
  reasoning: string;
  market_conditions: {
    volatility: number;
    trend_strength: number;
    arbitrage_opportunities: number;
    ai_signal_strength: number;
  };
  action_taken: string;
  result?: {
    profit: number;
    success: boolean;
  };
}

export const AutoModeStatus: React.FC = () => {
  const [isAutoMode, setIsAutoMode] = useState(false);
  const [decisions, setDecisions] = useState<AutoModeDecision[]>([]);
  const [currentStrategy, setCurrentStrategy] = useState<string>('none');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchAutoModeStatus = async () => {
    try {
      const response = await fetch('/api/auto_mode_status');
      if (response.ok) {
        const data = await response.json();
        setIsAutoMode(data.active);
        setDecisions(data.decisions || []);
        setCurrentStrategy(data.current_strategy || 'none');
      }
    } catch (error) {
      console.error('Error fetching auto mode status:', error);
    }
  };

  const toggleAutoMode = async () => {
    setLoading(true);
    try {
      if (isAutoMode) {
        const response = await fetch('/api/auto_mode', { method: 'DELETE' });
        if (response.ok) {
          setIsAutoMode(false);
          setCurrentStrategy('none');
          toast({
            title: "Auto Mode Inaktiverad",
            description: "AI väljer inte längre strategier automatiskt",
          });
        }
      } else {
        const result = await tradingApi.activateAutoMode();
        if (result.success) {
          setIsAutoMode(true);
          toast({
            title: "Auto Mode Aktiverad",
            description: "AI väljer nu optimal strategi automatiskt",
          });
        } else {
          toast({
            title: "Auto Mode Fel",
            description: result.message,
            variant: "destructive",
          });
        }
      }
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
    const interval = setInterval(fetchAutoModeStatus, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const getStrategyColor = (strategy: string) => {
    const colors = {
      arbitrage: 'bg-blue-500',
      ai_signal: 'bg-purple-500',
      hybrid: 'bg-green-500',
      conservative: 'bg-gray-500',
      aggressive: 'bg-red-500'
    };
    return colors[strategy as keyof typeof colors] || 'bg-gray-500';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-400';
    if (confidence >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-green-400 flex items-center justify-between">
          🤖 Auto Mode Dashboard
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isAutoMode ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`}></div>
            <Badge variant={isAutoMode ? 'default' : 'outline'}>
              {isAutoMode ? 'AKTIV' : 'INAKTIV'}
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
                {isAutoMode 
                  ? 'AI väljer automatiskt optimal strategi baserat på marknadsförhållanden'
                  : 'Manuell strategival är aktivt'
                }
              </p>
            </div>
            <Button 
              onClick={toggleAutoMode}
              disabled={loading}
              className={isAutoMode ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}
            >
              {loading ? 'Ändrar...' : isAutoMode ? 'Inaktivera Auto Mode' : 'Aktivera Auto Mode'}
            </Button>
          </div>

          {isAutoMode && (
            <div className="flex items-center space-x-4">
              <div>
                <span className="text-gray-400 text-sm">Aktuell Strategi:</span>
                <Badge className={`ml-2 ${getStrategyColor(currentStrategy)} text-white`}>
                  {currentStrategy.toUpperCase()}
                </Badge>
              </div>
            </div>
          )}
        </div>

        {/* AI Decisions History */}
        <div className="space-y-3">
          <h4 className="text-white font-medium">🧠 AI Beslut Historik</h4>
          
          {decisions.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              {isAutoMode ? 'Väntar på AI-beslut...' : 'Aktivera Auto Mode för att se AI-beslut'}
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {decisions.map((decision, index) => (
                <div key={index} className="p-4 bg-gray-700 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-400">
                        {new Date(decision.timestamp).toLocaleTimeString()}
                      </span>
                      <Badge className={`${getStrategyColor(decision.recommended_strategy)} text-white`}>
                        {decision.recommended_strategy.toUpperCase()}
                      </Badge>
                      <span className={`font-bold ${getConfidenceColor(decision.confidence)}`}>
                        {decision.confidence}%
                      </span>
                    </div>
                    {decision.result && (
                      <div className={`font-bold ${decision.result.profit > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {decision.result.profit > 0 ? '+' : ''}${decision.result.profit.toFixed(2)}
                      </div>
                    )}
                  </div>

                  <p className="text-gray-300 text-sm mb-3">{decision.reasoning}</p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div className="text-center p-2 bg-gray-600 rounded">
                      <div className="text-white font-bold">
                        {(decision.market_conditions.volatility * 100).toFixed(1)}%
                      </div>
                      <div className="text-gray-400">Volatilitet</div>
                    </div>
                    <div className="text-center p-2 bg-gray-600 rounded">
                      <div className="text-white font-bold">
                        {(decision.market_conditions.trend_strength * 100).toFixed(1)}%
                      </div>
                      <div className="text-gray-400">Trend</div>
                    </div>
                    <div className="text-center p-2 bg-gray-600 rounded">
                      <div className="text-white font-bold">
                        {decision.market_conditions.arbitrage_opportunities}
                      </div>
                      <div className="text-gray-400">Arbitrage</div>
                    </div>
                    <div className="text-center p-2 bg-gray-600 rounded">
                      <div className="text-white font-bold">
                        {(decision.market_conditions.ai_signal_strength * 100).toFixed(1)}%
                      </div>
                      <div className="text-gray-400">AI Signal</div>
                    </div>
                  </div>

                  <div className="mt-3 text-xs text-gray-400">
                    Åtgärd: <span className="text-white">{decision.action_taken}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Performance Summary */}
        {decisions.length > 0 && (
          <div className="mt-6 p-4 bg-gray-700 rounded-lg">
            <h4 className="text-white font-medium mb-3">📊 Auto Mode Performance</h4>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-white font-bold text-lg">
                  {decisions.filter(d => d.result?.success).length}
                </div>
                <div className="text-xs text-green-400">Lyckade Beslut</div>
              </div>
              <div>
                <div className="text-white font-bold text-lg">
                  {((decisions.filter(d => d.result?.success).length / decisions.length) * 100).toFixed(1)}%
                </div>
                <div className="text-xs text-blue-400">Träffsäkerhet</div>
              </div>
              <div>
                <div className={`font-bold text-lg ${
                  decisions.reduce((sum, d) => sum + (d.result?.profit || 0), 0) > 0 
                    ? 'text-green-400' 
                    : 'text-red-400'
                }`}>
                  ${decisions.reduce((sum, d) => sum + (d.result?.profit || 0), 0).toFixed(2)}
                </div>
                <div className="text-xs text-gray-400">Total Vinst</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
