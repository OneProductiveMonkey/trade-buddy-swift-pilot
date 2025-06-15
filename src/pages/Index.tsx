
import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSettings } from '@/components/LanguageSettings';
import { EnhancedTradingBot } from '@/components/EnhancedTradingBot';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings, Activity, Bot } from 'lucide-react';

const Index = () => {
  const [balance, setBalance] = useState(10000);
  const [botActive, setBotActive] = useState(false);
  const [botProfit, setBotProfit] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();

  const handleTrade = (order) => {
    console.log('Executing trade:', order);
    
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
      const profit = revenue * (0.003 + Math.random() * 0.015);
      setBotProfit(prev => prev + profit);
      setBalance(prev => prev + revenue + profit);
    }

    toast({
      title: `Trade Executed`,
      description: `${order.type.toUpperCase()} ${order.amount.toFixed(6)} ${order.symbol} at $${order.price}`,
    });
  };

  const toggleBot = () => {
    setBotActive(prev => !prev);
    toast({
      title: botActive ? t('trading.stopped') : t('trading.active'),
      description: botActive ? "Bot stopped" : "Bot activated",
      variant: botActive ? "destructive" : "default",
    });
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Clean Header */}
      <div className="border-b border-gray-800 bg-gray-900/50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">OPM MoneyMaker</h1>
                <p className="text-xs text-gray-400">AI Trading Bot</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {botActive && (
                <div className="flex items-center text-green-400 bg-green-400/10 px-2 py-1 rounded">
                  <Activity className="w-3 h-3 mr-1 animate-pulse" />
                  <span className="text-xs">+${botProfit.toFixed(2)}</span>
                </div>
              )}
              
              <Button
                onClick={() => setShowSettings(!showSettings)}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4 space-y-4">
        {/* Settings Panel */}
        {showSettings && (
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-4">
              <LanguageSettings />
            </CardContent>
          </Card>
        )}

        {/* Main Bot Interface */}
        <EnhancedTradingBot 
          onTrade={handleTrade}
          balance={balance}
          isActive={botActive}
          onToggleActive={toggleBot}
        />
      </div>
    </div>
  );
};

export default Index;
