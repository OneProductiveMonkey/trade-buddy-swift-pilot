
import React, { useState, useEffect } from 'react';
import { TradingDashboard } from '@/components/TradingDashboard';
import { Portfolio } from '@/components/Portfolio';
import { OrderForm } from '@/components/OrderForm';
import { MarketData } from '@/components/MarketData';
import { TradingHistory } from '@/components/TradingHistory';
import { EnhancedTradingBot } from '@/components/EnhancedTradingBot';
import { useToast } from '@/hooks/use-toast';
import { WalletConnection } from '@/components/WalletConnection';
import { TrendingCoins } from '@/components/TrendingCoins';
import { TradeReplay } from '@/components/TradeReplay';
import { AutoModeStatus } from '@/components/AutoModeStatus';
import { MemeRadarPanel } from '@/components/MemeRadarPanel';
import { LanguageSettings } from '@/components/LanguageSettings';
import { notificationService } from '@/services/notificationService';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, Activity, TrendingUp, Bot } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const Index = () => {
  const [balance, setBalance] = useState(10000);
  const [positions, setPositions] = useState([]);
  const [botActive, setBotActive] = useState(false);
  const [botProfit, setBotProfit] = useState(0);
  const [sandboxMode, setSandboxMode] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();

  const handleTrade = (order) => {
    console.log('Executing trade:', order);
    
    const isBot = order.strategy === 'arbitrage' || order.strategy === 'ai_signal';
    
    if (order.type === 'buy') {
      const cost = order.amount * order.price;
      if (cost > balance) {
        toast({
          title: "Insufficient Balance",
          description: "You don't have enough funds for this trade",
          variant: "destructive",
        });
        return;
      }
      setBalance(prev => prev - cost);
    } else {
      const revenue = order.amount * order.price;
      
      if (isBot && order.strategy === 'arbitrage') {
        const profit = revenue * (0.003 + Math.random() * 0.015);
        setBotProfit(prev => prev + profit);
        setBalance(prev => prev + revenue + profit);
      } else if (isBot && order.strategy === 'ai_signal') {
        const confidenceMultiplier = (order.confidence || 70) / 100;
        const profit = revenue * (Math.random() - 0.3) * 0.02 * confidenceMultiplier;
        setBotProfit(prev => prev + profit);
        setBalance(prev => prev + revenue + profit);
      } else {
        setBalance(prev => prev + revenue);
      }
    }

    const newPosition = {
      id: Date.now(),
      symbol: order.symbol,
      type: order.type,
      amount: order.amount,
      price: order.price,
      timestamp: new Date(),
      exchange: order.exchange || 'Manual',
      strategy: order.strategy || 'manual',
      confidence: order.confidence || 0,
    };

    setPositions(prev => [newPosition, ...prev]);

    const strategyText = order.strategy ? ` (${order.strategy.toUpperCase()})` : '';
    const exchangeText = order.exchange ? ` via ${order.exchange}` : '';
    const sandboxText = sandboxMode ? ' [SANDBOX]' : '';
    
    toast({
      title: `Trade Executed${strategyText}${sandboxText}`,
      description: `${order.type.toUpperCase()} ${order.amount.toFixed(6)} ${order.symbol} at $${order.price}${exchangeText}`,
    });

    notificationService.notifyTradeExecuted({
      ...order,
      sandbox: sandboxMode
    });
  };

  const toggleBot = () => {
    setBotActive(prev => !prev);
    toast({
      title: botActive ? t('trading.stopped') : t('trading.active'),
      description: botActive ? "Automatic trading stopped" : "Automatic trading is now active",
      variant: botActive ? "destructive" : "default",
    });
  };

  useEffect(() => {
    notificationService.requestPermission();
  }, []);

  const totalProfit = botProfit;
  const totalValue = balance + positions.reduce((sum, pos) => sum + (pos.amount * pos.price), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 backdrop-blur-sm border-b border-gray-700/50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-green-400 bg-clip-text text-transparent">
                    {t('app.title')}
                  </h1>
                  <p className="text-sm text-gray-400">{t('app.subtitle')}</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {sandboxMode && (
                <Badge variant="outline" className="text-orange-400 border-orange-400 px-3 py-1">
                  🧪 SANDBOX
                </Badge>
              )}
              
              {botActive && (
                <div className="flex items-center text-green-400 bg-green-400/10 px-3 py-1 rounded-full">
                  <Activity className="w-4 h-4 mr-2 animate-pulse" />
                  <span className="text-sm font-medium">
                    Bot: +${botProfit.toFixed(2)}
                  </span>
                </div>
              )}
              
              <Button
                onClick={() => setShowSettings(!showSettings)}
                variant="outline"
                size="sm"
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6 space-y-6">
        {/* Settings Panel */}
        {showSettings && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <LanguageSettings />
          </div>
        )}

        {/* Enhanced Trading Bot Section */}
        <Card className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm border-gray-700/50 shadow-2xl">
          <CardContent className="p-6">
            <EnhancedTradingBot 
              onTrade={handleTrade}
              balance={balance}
              isActive={botActive}
              onToggleActive={toggleBot}
            />
          </CardContent>
        </Card>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - Status & Controls */}
          <div className="lg:col-span-4 space-y-6">
            <AutoModeStatus />
            <MemeRadarPanel />
            <WalletConnection />
          </div>

          {/* Center Column - Trading & Analytics */}
          <div className="lg:col-span-5 space-y-6">
            <TradingDashboard />
            <TradeReplay />
          </div>

          {/* Right Column - Portfolio & Orders */}
          <div className="lg:col-span-3 space-y-6">
            <Portfolio balance={balance} positions={positions} />
            <OrderForm onTrade={handleTrade} />
            <TrendingCoins />
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MarketData />
          <TradingHistory positions={positions} />
        </div>
      </div>
    </div>
  );
};

export default Index;
