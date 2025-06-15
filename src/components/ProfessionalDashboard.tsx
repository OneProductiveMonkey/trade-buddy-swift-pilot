
import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { TradingHeader } from './TradingHeader';
import { StatsGrid } from './StatsGrid';
import { TradingControls } from './TradingControls';
import { MarketAnalysisPanel } from './MarketAnalysisPanel';
import { ArbitrageOpportunities } from './ArbitrageOpportunities';
import { RealTimeTradeLog } from './RealTimeTradeLog';
import { WalletConnection } from './WalletConnection';
import { UserSettings } from './UserSettings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
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
  const [showSettings, setShowSettings] = useState(false);
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
    } catch (error) {
      console.error('Misslyckades att uppdatera data:', error);
    }
  };

  const handleStartTrading = async (config: any) => {
    try {
      const result = await tradingApi.startEnhancedTrading(config);
      if (result.success) {
        setIsActive(true);
        toast({
          title: "Trading Startad",
          description: `Bot aktiverad med $${config.budget} budget`,
        });
      } else {
        toast({
          title: "Misslyckades att starta",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Fel",
        description: "Misslyckades att starta trading bot",
        variant: "destructive",
      });
    }
  };

  const handleStopTrading = async () => {
    try {
      await tradingApi.stopEnhancedTrading();
      setIsActive(false);
      toast({
        title: "Trading Stoppad",
        description: "Bot har inaktiverats",
      });
    } catch (error) {
      toast({
        title: "Fel",
        description: "Misslyckades att stoppa trading bot",
        variant: "destructive",
      });
    }
  };

  const toggleActive = () => {
    if (isActive) {
      handleStopTrading();
    } else {
      setShowSettings(true);
    }
  };

  return (
    <div className="min-h-screen bg-black p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <TradingHeader
          isActive={isActive}
          profit={portfolio.profit_live}
          onToggleActive={toggleActive}
          onSettings={() => setShowSettings(!showSettings)}
        />

        <StatsGrid portfolio={portfolio} />

        <WalletConnection />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <TradingControls
              onStartTrading={handleStartTrading}
              onStopTrading={handleStopTrading}
              isActive={isActive}
              balance={balance}
            />
          </div>

          <div className="lg:col-span-2">
            <Tabs defaultValue="analysis" className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-gray-800 border-gray-700">
                <TabsTrigger 
                  value="analysis" 
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                >
                  Analys
                </TabsTrigger>
                <TabsTrigger 
                  value="arbitrage"
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                >
                  Arbitrage
                </TabsTrigger>
                <TabsTrigger 
                  value="trades"
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                >
                  Trades
                </TabsTrigger>
                <TabsTrigger 
                  value="settings"
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                >
                  Inställningar
                </TabsTrigger>
              </TabsList>
              
              <div className="mt-4">
                <TabsContent value="analysis" className="mt-0">
                  <MarketAnalysisPanel />
                </TabsContent>
                
                <TabsContent value="arbitrage" className="mt-0">
                  <ArbitrageOpportunities onExecute={(opp) => console.log('Arbitrage:', opp)} />
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
      </div>
    </div>
  );
};
