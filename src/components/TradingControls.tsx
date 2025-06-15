
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Settings, Bot, Zap, Shield, TrendingUp } from 'lucide-react';

interface TradingControlsProps {
  onStartTrading: (config: any) => void;
  onStopTrading: () => void;
  isActive: boolean;
  balance: number;
}

export const TradingControls: React.FC<TradingControlsProps> = ({
  onStartTrading,
  onStopTrading,
  isActive,
  balance
}) => {
  const [config, setConfig] = useState({
    budget: 200,
    strategy: 'arbitrage',
    riskLevel: 'medium',
    autoRebalance: true,
    stopLoss: 5,
    takeProfit: 10,
    maxPositions: 3
  });

  const strategies = [
    { value: 'arbitrage', label: 'Arbitrage', icon: '⚡', desc: 'Multi-exchange price differences' },
    { value: 'ai_signals', label: 'AI Signals', icon: '🤖', desc: 'Machine learning predictions' },
    { value: 'grid', label: 'Grid Trading', icon: '📊', desc: 'Automated buy/sell grid' },
    { value: 'dca', label: 'DCA Bot', icon: '💰', desc: 'Dollar cost averaging' }
  ];

  const riskLevels = [
    { value: 'conservative', label: 'Conservative', color: 'bg-green-500', range: '0.1-0.5%' },
    { value: 'moderate', label: 'Moderate', color: 'bg-yellow-500', range: '0.5-1.5%' },
    { value: 'aggressive', label: 'Aggressive', color: 'bg-red-500', range: '1.5-3.0%' }
  ];

  const handleStart = () => {
    onStartTrading(config);
  };

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-white flex items-center">
          <Settings className="w-5 h-5 mr-2 text-blue-400" />
          Trading Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Budget Configuration */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-gray-300">Trading Budget</Label>
          <div className="space-y-2">
            <Input
              type="number"
              value={config.budget}
              onChange={(e) => setConfig({...config, budget: Number(e.target.value)})}
              className="bg-gray-800 border-gray-700 text-white"
              min="100"
              max={balance}
            />
            <Slider
              value={[config.budget]}
              onValueChange={(value) => setConfig({...config, budget: value[0]})}
              max={balance}
              min={100}
              step={50}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>$100</span>
              <span>${balance.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Strategy Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-gray-300">Trading Strategy</Label>
          <div className="grid grid-cols-2 gap-2">
            {strategies.map((strategy) => (
              <div
                key={strategy.value}
                onClick={() => setConfig({...config, strategy: strategy.value})}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  config.strategy === strategy.value
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                }`}
              >
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-lg">{strategy.icon}</span>
                  <span className="text-sm font-medium text-white">{strategy.label}</span>
                </div>
                <p className="text-xs text-gray-400">{strategy.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Risk Level */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-gray-300">Risk Level</Label>
          <div className="space-y-2">
            {riskLevels.map((risk) => (
              <div
                key={risk.value}
                onClick={() => setConfig({...config, riskLevel: risk.value})}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  config.riskLevel === risk.value
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${risk.color}`}></div>
                    <span className="text-sm font-medium text-white">{risk.label}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {risk.range}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Advanced Settings */}
        <div className="space-y-4 pt-4 border-t border-gray-800">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium text-gray-300">Auto Rebalance</Label>
            <Switch
              checked={config.autoRebalance}
              onCheckedChange={(checked) => setConfig({...config, autoRebalance: checked})}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-gray-400">Stop Loss (%)</Label>
              <Input
                type="number"
                value={config.stopLoss}
                onChange={(e) => setConfig({...config, stopLoss: Number(e.target.value)})}
                className="bg-gray-800 border-gray-700 text-white text-sm"
                min="1"
                max="20"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs text-gray-400">Take Profit (%)</Label>
              <Input
                type="number"
                value={config.takeProfit}
                onChange={(e) => setConfig({...config, takeProfit: Number(e.target.value)})}
                className="bg-gray-800 border-gray-700 text-white text-sm"
                min="1"
                max="50"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-4">
          {isActive ? (
            <Button
              onClick={onStopTrading}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              <Shield className="w-4 h-4 mr-2" />
              Stop Trading
            </Button>
          ) : (
            <Button
              onClick={handleStart}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Bot className="w-4 h-4 mr-2" />
              Start Trading
            </Button>
          )}
          
          <Button
            variant="outline"
            className="border-gray-700 text-gray-300 hover:bg-gray-800"
          >
            <TrendingUp className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
