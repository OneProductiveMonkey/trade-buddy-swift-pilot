
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Settings, Play, Square, Wallet, AlertTriangle } from 'lucide-react';
import { walletService } from '@/services/walletService';

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
  const [budget, setBudget] = useState(500);
  const [strategy, setStrategy] = useState('arbitrage');
  const [riskLevel, setRiskLevel] = useState('medium');
  const [loading, setLoading] = useState(false);

  const handleStartTrading = async () => {
    // Check if wallets are connected for arbitrage
    if (strategy === 'arbitrage') {
      const phantomAvailable = walletService.isPhantomAvailable();
      const metamaskAvailable = walletService.isMetaMaskAvailable();
      
      if (!phantomAvailable && !metamaskAvailable) {
        alert('⚠️ Please connect at least one wallet for arbitrage trading');
        return;
      }
    }

    setLoading(true);
    try {
      await onStartTrading({
        budget,
        strategy,
        risk_level: riskLevel
      });
    } finally {
      setLoading(false);
    }
  };

  const strategies = [
    { value: 'arbitrage', label: '🔄 Cross-Chain Arbitrage', description: 'Trade between exchanges' },
    { value: 'ai_signals', label: '🤖 AI Signal Trading', description: 'Follow AI predictions' },
    { value: 'hybrid', label: '⚡ Hybrid Strategy', description: 'Combine multiple approaches' },
    { value: 'conservative', label: '🛡️ Conservative Mode', description: 'Low risk, steady gains' }
  ];

  const riskLevels = [
    { value: 'low', label: 'Low Risk', color: 'bg-green-500', range: '0.3-0.8%' },
    { value: 'medium', label: 'Medium Risk', color: 'bg-yellow-500', range: '0.5-1.5%' },
    { value: 'high', label: 'High Risk', color: 'bg-red-500', range: '1.0-3.0%' }
  ];

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <Settings className="w-5 h-5 mr-2 text-blue-400" />
          Trading Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Wallet Status */}
        <div className="space-y-2">
          <Label className="text-gray-300 flex items-center">
            <Wallet className="w-4 h-4 mr-2" />
            Wallet Status
          </Label>
          <div className="flex space-x-2">
            <Badge 
              variant={walletService.isPhantomAvailable() ? "default" : "secondary"}
              className={walletService.isPhantomAvailable() ? "bg-purple-600" : "bg-gray-600"}
            >
              👻 Phantom {walletService.isPhantomAvailable() ? "Ready" : "Not Connected"}
            </Badge>
            <Badge 
              variant={walletService.isMetaMaskAvailable() ? "default" : "secondary"}
              className={walletService.isMetaMaskAvailable() ? "bg-orange-600" : "bg-gray-600"}
            >
              🦊 MetaMask {walletService.isMetaMaskAvailable() ? "Ready" : "Not Connected"}
            </Badge>
          </div>
        </div>

        {/* Budget Configuration */}
        <div className="space-y-2">
          <Label className="text-gray-300">Trading Budget</Label>
          <div className="space-y-3">
            <Input
              type="number"
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              min={100}
              max={balance * 0.8}
              className="bg-gray-800 border-gray-700 text-white"
            />
            <Slider
              value={[budget]}
              onValueChange={(value) => setBudget(value[0])}
              max={Math.min(balance * 0.8, 5000)}
              min={100}
              step={50}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>$100</span>
              <span>${budget}</span>
              <span>${Math.min(balance * 0.8, 5000)}</span>
            </div>
          </div>
        </div>

        {/* Strategy Selection */}
        <div className="space-y-2">
          <Label className="text-gray-300">Trading Strategy</Label>
          <Select value={strategy} onValueChange={setStrategy}>
            <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              {strategies.map((strat) => (
                <SelectItem key={strat.value} value={strat.value}>
                  <div>
                    <div className="font-medium">{strat.label}</div>
                    <div className="text-xs text-gray-400">{strat.description}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {strategy === 'arbitrage' && (!walletService.isPhantomAvailable() && !walletService.isMetaMaskAvailable()) && (
            <div className="flex items-center space-x-2 text-yellow-400 text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span>Connect wallets above for cross-chain arbitrage</span>
            </div>
          )}
        </div>

        {/* Risk Level */}
        <div className="space-y-2">
          <Label className="text-gray-300">Risk Level</Label>
          <Select value={riskLevel} onValueChange={setRiskLevel}>
            <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              {riskLevels.map((risk) => (
                <SelectItem key={risk.value} value={risk.value}>
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${risk.color}`} />
                    <div>
                      <div className="font-medium">{risk.label}</div>
                      <div className="text-xs text-gray-400">{risk.range} expected returns</div>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Trading Controls */}
        <div className="space-y-3">
          {!isActive ? (
            <Button
              onClick={handleStartTrading}
              disabled={loading || budget < 100}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              <Play className="w-4 h-4 mr-2" />
              {loading ? 'Starting...' : 'Start Trading Bot'}
            </Button>
          ) : (
            <Button
              onClick={onStopTrading}
              className="w-full bg-red-600 hover:bg-red-700 text-white"
            >
              <Square className="w-4 h-4 mr-2" />
              Stop Trading Bot
            </Button>
          )}
          
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
            <div>
              <span className="font-medium">Available:</span> ${balance.toFixed(2)}
            </div>
            <div>
              <span className="font-medium">Using:</span> ${budget}
            </div>
          </div>
        </div>

        {/* Risk Warning */}
        <div className="bg-yellow-600/10 border border-yellow-600/30 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5" />
            <div className="text-xs text-yellow-200">
              <div className="font-medium mb-1">Risk Warning</div>
              <div>Cryptocurrency trading involves substantial risk. Only trade with funds you can afford to lose.</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
