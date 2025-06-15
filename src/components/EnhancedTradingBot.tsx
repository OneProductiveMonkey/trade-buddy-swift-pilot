
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { tradingApi } from '@/services/tradingApi';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { Activity, Wifi, WifiOff, Play, Square, TrendingUp, DollarSign } from 'lucide-react';

interface BotStatus {
  portfolio: {
    balance: number;
    profit_live: number;
    profit_24h: number;
    total_trades: number;
    win_rate: number;
  };
  ai_signals: Array<{
    coin: string;
    symbol: string;
    direction: string;
    confidence: number;
    current_price: number;
  }>;
  arbitrage_opportunities: Array<{
    symbol: string;
    profit_pct: number;
    buy_exchange: string;
    sell_exchange: string;
  }>;
  trading_active: boolean;
  connection_status: {
    active_exchanges: number;
    demo_exchanges: number;
  };
}

export const EnhancedTradingBot: React.FC<{
  onTrade?: (order: any) => void;
  balance?: number;
  isActive?: boolean;
  onToggleActive?: () => void;
}> = ({ onTrade, balance, isActive, onToggleActive }) => {
  const [botStatus, setBotStatus] = useState<BotStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { t } = useLanguage();

  const fetchBotStatus = async () => {
    try {
      const data = await tradingApi.getEnhancedStatus();
      setBotStatus(data);
    } catch (error) {
      console.error('Status fetch error:', error);
      // Fallback with demo data
      setBotStatus({
        portfolio: {
          balance: balance || 10000,
          profit_live: 145.67,
          profit_24h: 8.4,
          total_trades: 23,
          win_rate: 78.3
        },
        ai_signals: [
          { coin: 'Bitcoin', symbol: 'BTC/USDT', direction: 'buy', confidence: 85, current_price: 43250 },
          { coin: 'Ethereum', symbol: 'ETH/USDT', direction: 'sell', confidence: 72, current_price: 2580 }
        ],
        arbitrage_opportunities: [
          { symbol: 'BTC/USDT', profit_pct: 0.8, buy_exchange: 'binance', sell_exchange: 'coinbase' }
        ],
        trading_active: isActive || false,
        connection_status: { active_exchanges: 0, demo_exchanges: 5 }
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBotStatus();
    const interval = setInterval(fetchBotStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="p-8 text-center">
          <Activity className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-400" />
          <p className="text-gray-400">Loading trading engine...</p>
        </CardContent>
      </Card>
    );
  }

  const isConnected = (botStatus?.connection_status?.active_exchanges || 0) > 0;

  return (
    <div className="space-y-4">
      {/* Connection & Control Bar */}
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {isConnected ? (
                <Wifi className="w-5 h-5 text-green-400" />
              ) : (
                <WifiOff className="w-5 h-5 text-yellow-400" />
              )}
              <div>
                <span className="text-white font-medium">
                  {isConnected ? 
                    `${t('connection.connected')} ${botStatus?.connection_status?.active_exchanges || 0}` :
                    `Demo Mode - ${botStatus?.connection_status?.demo_exchanges || 0} exchanges`
                  }
                </span>
              </div>
            </div>
            
            <Button 
              onClick={onToggleActive} 
              className={`${botStatus?.trading_active ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
            >
              {botStatus?.trading_active ? (
                <>
                  <Square className="w-4 h-4 mr-2" />
                  {t('trading.stop')}
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  {t('trading.start')}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4 text-center">
            <DollarSign className="w-6 h-6 mx-auto mb-2 text-blue-400" />
            <div className="text-2xl font-bold text-white">
              ${(botStatus?.portfolio?.balance || balance || 0).toLocaleString()}
            </div>
            <div className="text-xs text-gray-400">{t('portfolio.balance')}</div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-6 h-6 mx-auto mb-2 text-green-400" />
            <div className="text-2xl font-bold text-green-400">
              +${(botStatus?.portfolio?.profit_live || 0).toFixed(2)}
            </div>
            <div className="text-xs text-gray-400">{t('portfolio.liveProfit')}</div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4 text-center">
            <Activity className="w-6 h-6 mx-auto mb-2 text-purple-400" />
            <div className="text-2xl font-bold text-white">
              {(botStatus?.portfolio?.win_rate || 0).toFixed(1)}%
            </div>
            <div className="text-xs text-gray-400">{t('portfolio.winRate')}</div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4 text-center">
            <div className="text-2xl mb-2">🔄</div>
            <div className="text-2xl font-bold text-white">
              {botStatus?.portfolio?.total_trades || 0}
            </div>
            <div className="text-xs text-gray-400">{t('portfolio.totalTrades')}</div>
          </CardContent>
        </Card>
      </div>

      {/* AI Signals & Arbitrage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* AI Signals */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-green-400 text-lg flex items-center">
              🤖 AI Signals
              <Badge className="ml-auto bg-green-600">
                {botStatus?.ai_signals?.length || 0}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(botStatus?.ai_signals || []).slice(0, 3).map((signal, index) => (
              <div key={index} className="p-3 bg-gray-800 rounded-lg border border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-white">{signal.coin}</span>
                  <Badge className={signal.direction === 'buy' ? 'bg-green-600' : 'bg-red-600'}>
                    {signal.direction.toUpperCase()}
                  </Badge>
                </div>
                <div className="text-sm text-gray-400 flex justify-between">
                  <span>${signal.current_price}</span>
                  <span>{signal.confidence}% confidence</span>
                </div>
              </div>
            ))}
            {(!botStatus?.ai_signals || botStatus.ai_signals.length === 0) && (
              <div className="text-center py-6 text-gray-500">
                <Activity className="w-8 h-8 mx-auto mb-2 animate-pulse" />
                <p>Analyzing market signals...</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Arbitrage Opportunities */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-blue-400 text-lg flex items-center">
              ⚡ Arbitrage
              <Badge className="ml-auto bg-blue-600">
                {botStatus?.arbitrage_opportunities?.length || 0}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(botStatus?.arbitrage_opportunities || []).slice(0, 3).map((opp, index) => (
              <div key={index} className="p-3 bg-gray-800 rounded-lg border border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-white">{opp.symbol}</span>
                  <span className="text-green-400 font-bold">+{opp.profit_pct.toFixed(2)}%</span>
                </div>
                <div className="text-xs text-gray-400">
                  {opp.buy_exchange} → {opp.sell_exchange}
                </div>
              </div>
            ))}
            {(!botStatus?.arbitrage_opportunities || botStatus.arbitrage_opportunities.length === 0) && (
              <div className="text-center py-6 text-gray-500">
                <Activity className="w-8 h-8 mx-auto mb-2 animate-pulse" />
                <p>Scanning opportunities...</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Status Indicator */}
      {botStatus?.trading_active && (
        <Card className="bg-green-900/20 border-green-600">
          <CardContent className="p-4">
            <div className="flex items-center justify-center space-x-3">
              <Activity className="w-5 h-5 text-green-400 animate-pulse" />
              <span className="text-green-400 font-medium">Bot is actively trading</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
