
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
import { notificationService } from '@/services/notificationService';
import { Badge } from '@/components/ui/badge';

const Index = () => {
  const [balance, setBalance] = useState(10000);
  const [positions, setPositions] = useState([]);
  const [botActive, setBotActive] = useState(false);
  const [botProfit, setBotProfit] = useState(0);
  const [sandboxMode, setSandboxMode] = useState(true);
  const { toast } = useToast();

  const handleTrade = (order) => {
    console.log('Executing trade:', order);
    
    // Enhanced trade execution with strategy tracking
    const isBot = order.strategy === 'arbitrage' || order.strategy === 'ai_signal';
    
    if (order.type === 'buy') {
      const cost = order.amount * order.price;
      if (cost > balance) {
        toast({
          title: "Otillräckligt saldo",
          description: "Du har inte tillräckligt med medel för denna handel",
          variant: "destructive",
        });
        return;
      }
      setBalance(prev => prev - cost);
    } else {
      const revenue = order.amount * order.price;
      
      // Calculate profit for bot trades
      if (isBot && order.strategy === 'arbitrage') {
        // Simulate arbitrage profit (0.3-1.8%)
        const profit = revenue * (0.003 + Math.random() * 0.015);
        setBotProfit(prev => prev + profit);
        setBalance(prev => prev + revenue + profit);
      } else if (isBot && order.strategy === 'ai_signal') {
        // AI signal profit based on confidence
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
      title: `Handel genomförd${strategyText}${sandboxText}`,
      description: `${order.type.toUpperCase()} ${order.amount.toFixed(6)} ${order.symbol} för $${order.price}${exchangeText}`,
    });

    // Send notification
    notificationService.notifyTradeExecuted({
      ...order,
      sandbox: sandboxMode
    });
  };

  const toggleBot = () => {
    setBotActive(prev => !prev);
    toast({
      title: botActive ? "Trading Bot Stoppad" : "Trading Bot Startad",
      description: botActive ? "Automatisk handel har stoppats" : "Automatisk handel är nu aktiv",
      variant: botActive ? "destructive" : "default",
    });
  };

  // Request notification permission on component mount
  useEffect(() => {
    notificationService.requestPermission();
  }, []);

  // Update portfolio stats to include bot performance
  const totalProfit = botProfit;
  const totalValue = balance + positions.reduce((sum, pos) => sum + (pos.amount * pos.price), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent mb-2">
                Advanced AI Trading Bot Pro
              </h1>
              <p className="text-gray-400">Multi-Exchange Arbitrage & AI Signal Trading Platform</p>
            </div>
            
            {/* Sandbox Mode Indicator */}
            {sandboxMode && (
              <Badge variant="outline" className="text-orange-400 border-orange-400 text-lg px-4 py-2">
                🧪 SANDBOX MODE
              </Badge>
            )}
          </div>
          
          {botActive && (
            <div className="mt-2 flex items-center text-green-400">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2"></div>
              Bot profit: +${botProfit.toFixed(2)} {sandboxMode && '(Simulerat)'}
            </div>
          )}
        </div>

        {/* Enhanced Trading Bot Section */}
        <div className="mb-6">
          <EnhancedTradingBot 
            onTrade={handleTrade}
            balance={balance}
            isActive={botActive}
            onToggleActive={toggleBot}
          />
        </div>

        {/* New Enhanced Features Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <AutoModeStatus />
          <MemeRadarPanel />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <WalletConnection />
          <TradeReplay />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <TrendingCoins />
          <div className="space-y-6">
            <Portfolio balance={balance} positions={positions} />
            <OrderForm onTrade={handleTrade} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <TradingDashboard />
          </div>
          <div className="space-y-6">
            <MarketData />
            <TradingHistory positions={positions} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
