
import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bot, Settings, Bell, Activity, Zap } from 'lucide-react';

interface TradingHeaderProps {
  isActive: boolean;
  profit: number;
  onToggleActive: () => void;
  onSettings: () => void;
}

export const TradingHeader: React.FC<TradingHeaderProps> = ({
  isActive,
  profit,
  onToggleActive,
  onSettings
}) => {
  return (
    <Card className="bg-gray-900 border-gray-800 mb-6">
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">TradingBot Pro</h1>
                <p className="text-sm text-gray-400">Multi-Exchange AI Trading</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Badge 
                variant={isActive ? "default" : "secondary"}
                className={`px-3 py-1 ${isActive ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300'}`}
              >
                <Activity className={`w-3 h-3 mr-1 ${isActive ? 'animate-pulse' : ''}`} />
                {isActive ? 'Active' : 'Inactive'}
              </Badge>
              
              {profit !== 0 && (
                <Badge 
                  variant="outline"
                  className={`px-3 py-1 border-0 ${profit > 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}
                >
                  <Zap className="w-3 h-3 mr-1" />
                  {profit > 0 ? '+' : ''}${profit.toFixed(2)}
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white"
            >
              <Bell className="w-4 h-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onSettings}
              className="text-gray-400 hover:text-white"
            >
              <Settings className="w-4 h-4" />
            </Button>
            
            <Button
              onClick={onToggleActive}
              className={`px-6 ${
                isActive 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isActive ? 'Stop Trading' : 'Start Trading'}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};
