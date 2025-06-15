
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRightLeft, TrendingUp, Clock, DollarSign } from 'lucide-react';

interface ArbitrageOpportunity {
  symbol: string;
  name: string;
  buy_exchange: string;
  sell_exchange: string;
  buy_price: number;
  sell_price: number;
  profit_pct: number;
  profit_usd: number;
  position_size: number;
  priority: number;
  volatility: string;
  confidence: number;
}

interface ArbitrageOpportunitiesProps {
  onExecute?: (opportunity: ArbitrageOpportunity) => void;
}

export const ArbitrageOpportunities: React.FC<ArbitrageOpportunitiesProps> = ({ onExecute }) => {
  const [opportunities, setOpportunities] = useState<ArbitrageOpportunity[]>([]);
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState<string | null>(null);

  useEffect(() => {
    fetchOpportunities();
    const interval = setInterval(fetchOpportunities, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchOpportunities = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/enhanced_status');
      const data = await response.json();
      setOpportunities(data.arbitrage_opportunities || []);
    } catch (error) {
      console.error('Failed to fetch arbitrage opportunities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async (opportunity: ArbitrageOpportunity) => {
    setExecuting(opportunity.symbol);
    try {
      const response = await fetch('/api/execute_arbitrage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: opportunity.symbol,
          buy_exchange: opportunity.buy_exchange,
          sell_exchange: opportunity.sell_exchange,
          position_size: opportunity.position_size
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Show success notification
        if (onExecute) onExecute(opportunity);
      }
      
    } catch (error) {
      console.error('Failed to execute arbitrage:', error);
    } finally {
      setExecuting(null);
    }
  };

  const getProfitColor = (profit: number) => {
    if (profit > 1.0) return 'text-green-400';
    if (profit > 0.5) return 'text-yellow-400';
    return 'text-gray-400';
  };

  const getVolatilityColor = (volatility: string) => {
    switch (volatility) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'default';
      default: return 'secondary';
    }
  };

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <ArrowRightLeft className="w-5 h-5 mr-2 text-green-400" />
          Arbitrage Opportunities
          {loading && <Clock className="w-4 h-4 ml-2 animate-spin text-blue-400" />}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {opportunities.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Scanning for profitable opportunities...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {opportunities.slice(0, 5).map((opp, index) => (
              <div 
                key={`${opp.symbol}-${index}`}
                className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="text-lg font-bold text-white">
                      {opp.name}
                    </div>
                    <Badge variant={getVolatilityColor(opp.volatility)}>
                      {opp.volatility} risk
                    </Badge>
                    <Badge variant="outline" className="text-blue-400 border-blue-400">
                      Priority {opp.priority}
                    </Badge>
                  </div>
                  
                  <div className={`text-right ${getProfitColor(opp.profit_pct)}`}>
                    <div className="text-xl font-bold">
                      +{opp.profit_pct.toFixed(2)}%
                    </div>
                    <div className="text-sm flex items-center">
                      <DollarSign className="w-3 h-3 mr-1" />
                      {opp.profit_usd.toFixed(2)}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                  <div className="space-y-1">
                    <div className="text-gray-400">Buy from:</div>
                    <div className="text-white font-medium">
                      {opp.buy_exchange}
                    </div>
                    <div className="text-gray-300">
                      ${opp.buy_price.toFixed(4)}
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="text-gray-400">Sell to:</div>
                    <div className="text-white font-medium">
                      {opp.sell_exchange}
                    </div>
                    <div className="text-gray-300">
                      ${opp.sell_price.toFixed(4)}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-400">
                    Position: ${opp.position_size.toFixed(0)} • 
                    Confidence: {(opp.confidence * 100).toFixed(0)}%
                  </div>
                  
                  <Button
                    onClick={() => handleExecute(opp)}
                    disabled={executing === opp.symbol}
                    className="bg-green-600 hover:bg-green-700 text-white"
                    size="sm"
                  >
                    {executing === opp.symbol ? (
                      <>
                        <Clock className="w-4 h-4 mr-2 animate-spin" />
                        Executing...
                      </>
                    ) : (
                      <>
                        <ArrowRightLeft className="w-4 h-4 mr-2" />
                        Execute
                      </>
                    )}
                  </Button>
                </div>
                
                {/* Progress bar for confidence */}
                <div className="mt-3">
                  <div className="w-full bg-gray-700 rounded-full h-1">
                    <div 
                      className="bg-green-400 h-1 rounded-full transition-all duration-300"
                      style={{ width: `${opp.confidence * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-4 text-xs text-gray-500 text-center">
          Opportunities refresh every 5 seconds
        </div>
      </CardContent>
    </Card>
  );
};
