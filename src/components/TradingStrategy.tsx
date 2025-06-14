
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { tradingApi } from '@/services/tradingApi';
import { useToast } from '@/hooks/use-toast';

interface StrategyRecommendation {
  recommended_strategy: string;
  confidence: number;
  reason: string;
  market_conditions: {
    volatility: number;
    trend_strength: number;
    portfolio_risk: number;
  };
}

export const TradingStrategy: React.FC = () => {
  const [recommendation, setRecommendation] = useState<StrategyRecommendation | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoModeActive, setAutoModeActive] = useState(false);
  const { toast } = useToast();

  const fetchRecommendation = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${tradingApi.baseUrl}/api/strategy_recommendation`);
      if (!response.ok) throw new Error('Failed to fetch recommendation');
      const data = await response.json();
      setRecommendation(data);
    } catch (error) {
      console.error('Error fetching strategy recommendation:', error);
      toast({
        title: "Fel vid hämtning av strategirekommendation",
        description: "Kunde inte hämta rekommendation från servern",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const activateAutoMode = async () => {
    try {
      const response = await fetch(`${tradingApi.baseUrl}/api/auto_mode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) throw new Error('Failed to activate auto mode');
      
      const data = await response.json();
      setAutoModeActive(true);
      
      toast({
        title: "Auto-läge aktiverat",
        description: `AI har rekommenderat ${data.recommended_trades?.length || 0} trades`,
      });
    } catch (error) {
      console.error('Error activating auto mode:', error);
      toast({
        title: "Fel vid aktivering av auto-läge",
        description: "Kunde inte aktivera auto-läge",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchRecommendation();
    const interval = setInterval(fetchRecommendation, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const getStrategyColor = (strategy: string) => {
    const colors = {
      arbitrage: 'bg-blue-500',
      ai_signals: 'bg-purple-500',
      hybrid: 'bg-green-500',
      conservative: 'bg-gray-500',
      auto: 'bg-orange-500'
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
          🧠 AI Strategirekommendation
          <Button 
            onClick={fetchRecommendation} 
            disabled={loading}
            size="sm"
            variant="outline"
          >
            {loading ? 'Uppdaterar...' : 'Uppdatera'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {recommendation ? (
          <>
            <div className="flex items-center space-x-3">
              <Badge className={`${getStrategyColor(recommendation.recommended_strategy)} text-white`}>
                {recommendation.recommended_strategy.toUpperCase()}
              </Badge>
              <span className={`font-bold ${getConfidenceColor(recommendation.confidence)}`}>
                {recommendation.confidence}% Säkerhet
              </span>
            </div>

            <p className="text-gray-300 text-sm">
              {recommendation.reason}
            </p>

            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="bg-gray-700 p-3 rounded">
                <div className="text-xs text-gray-400">Volatilitet</div>
                <div className="text-lg font-bold text-white">
                  {(recommendation.market_conditions.volatility * 100).toFixed(1)}%
                </div>
              </div>
              <div className="bg-gray-700 p-3 rounded">
                <div className="text-xs text-gray-400">Trendstyrka</div>
                <div className="text-lg font-bold text-white">
                  {(recommendation.market_conditions.trend_strength * 100).toFixed(1)}%
                </div>
              </div>
              <div className="bg-gray-700 p-3 rounded">
                <div className="text-xs text-gray-400">Portföljrisk</div>
                <div className="text-lg font-bold text-white">
                  {(recommendation.market_conditions.portfolio_risk * 100).toFixed(1)}%
                </div>
              </div>
            </div>

            <div className="flex space-x-2 mt-4">
              <Button 
                onClick={activateAutoMode}
                disabled={autoModeActive}
                className="flex-1"
              >
                {autoModeActive ? '✅ Auto-läge Aktivt' : '🤖 Aktivera Auto-läge'}
              </Button>
            </div>

            {autoModeActive && (
              <div className="bg-green-900/20 border border-green-500 p-3 rounded mt-4">
                <div className="text-green-400 font-bold text-sm">
                  🤖 Auto-läge Aktiverat
                </div>
                <div className="text-green-300 text-xs">
                  AI väljer automatiskt optimal strategi baserat på marknadsförhållanden
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-400">
              {loading ? 'Analyserar marknadsförhållanden...' : 'Ingen data tillgänglig'}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
