
import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { LiveStatusBar } from './LiveStatusBar';
import { EnhancedWalletManager } from './EnhancedWalletManager';
import { TradingEngine } from './TradingEngine';
import { RealTimeTradeLog } from './RealTimeTradeLog';
import { UserSettings } from './UserSettings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { tradingApi } from '@/services/tradingApi';

interface Portfolio {
  balance: number;
  profit_live: number;
  profit_24h: number;
  total_trades: number;
  successful_trades: number;
  win_rate: number;
}

interface ProfessionalDashboardProps {
  balance: number;
  onTrade?: (order: any) => void;
}

export const ProfessionalDashboard: React.FC<ProfessionalDashboardProps> = ({
  balance,
  onTrade
}) => {
  const [portfolio, setPortfolio] = useState<Portfolio>({
    balance: balance,
    profit_live: 0,
    profit_24h: 0,
    total_trades: 0,
    successful_trades: 0,
    win_rate: 0
  });
  
  const [isActive, setIsActive] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    updateData();
    const interval = setInterval(updateData, 5000);
    return () => clearInterval(interval);
  }, []);

  const updateData = async () => {
    try {
      const data = await tradingApi.getEnhancedStatus();
      setPortfolio(data.portfolio);
      setIsActive(data.trading_active || false);
    } catch (error) {
      console.error('Misslyckades att uppdatera data:', error);
    }
  };

  return (
    <div className="min-h-screen bg-black p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Live Status Bar */}
        <LiveStatusBar />

        {/* Main Dashboard Header */}
        <Card className="bg-gray-900/50 border-gray-800">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  🚀 Professional Trading Dashboard
                </h1>
                <p className="text-gray-400">
                  Multi-Exchange AI Trading Platform med Live Wallet Integration
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <Badge className="bg-green-500 text-white">
                  Testläge Aktivt
                </Badge>
                <Badge variant="outline" className="border-blue-500 text-blue-400">
                  v2.0 Pro
                </Badge>
              </div>
            </div>
          </div>
        </Card>

        {/* Main Content Tabs */}
        <Tabs defaultValue="trading" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-gray-800 border-gray-700">
            <TabsTrigger 
              value="trading" 
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              🤖 Trading Engine
            </TabsTrigger>
            <TabsTrigger 
              value="wallets"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              👛 Wallets
            </TabsTrigger>
            <TabsTrigger 
              value="trades"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              📊 Trade Log
            </TabsTrigger>
            <TabsTrigger 
              value="settings"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              ⚙️ Inställningar
            </TabsTrigger>
          </TabsList>
          
          <div className="mt-6">
            <TabsContent value="trading" className="mt-0">
              <TradingEngine onTrade={onTrade} balance={balance} />
            </TabsContent>
            
            <TabsContent value="wallets" className="mt-0">
              <EnhancedWalletManager />
            </TabsContent>
            
            <TabsContent value="trades" className="mt-0">
              <RealTimeTradeLog />
            </TabsContent>
            
            <TabsContent value="settings" className="mt-0">
              <UserSettings />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};
