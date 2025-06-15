
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Settings, Play, Square, Wallet, AlertTriangle, Zap } from 'lucide-react';
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
  const [budget, setBudget] = useState(100);
  const [strategy, setStrategy] = useState('arbitrage');
  const [riskLevel, setRiskLevel] = useState('medium');
  const [loading, setLoading] = useState(false);

  const handleStartTrading = async () => {
    // Check minimum trade amount ($10)
    if (budget < 10) {
      alert('⚠️ Minimum trade amount is $10 for live trading');
      return;
    }

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
          Live Trading Configuration
          <Badge className="ml-auto bg-green-500">
            <Zap className="w-3 h-3 mr-1" />
            LIVE
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Live Trading Status */}
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <span className="text-green-400">🔴 LIVE</span>
            <div>
              <div className="text-green-400 text-sm font-medium">
                Connected to Binance Exchange
              </div>
              <div className="text-green-300 text-xs">
                Real trades with minimum $10 volume
              </div>
            </div>
          </div>
        </div>

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
          <Label className="text-gray-300">Trading Budget (Min $10)</Label>
          <div className="space-y-3">
            <Input
              type="number"
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              min={10}
              max={balance * 0.8}
              className="bg-gray-800 border-gray-700 text-white"
            />
            <Slider
              value={[budget]}
              onValueChange={(value) => setBudget(value[0])}
              max={Math.min(balance * 0.8, 5000)}
              min={10}
              step={10}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>$10</span>
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
              <SelectItem value="arbitrage">
                <div>
                  <div className="font-medium">🔄 Cross-Chain Arbitrage</div>
                  <div className="text-xs text-gray-400">Trade between exchanges</div>
                </div>
              </SelectItem>
              <SelectItem value="ai_signals">
                <div>
                  <div className="font-medium">🤖 AI Signal Trading</div>
                  <div className="text-xs text-gray-400">Follow AI predictions</div>
                </div>
              </SelectItem>
              <SelectItem value="hybrid">
                <div>
                  <div className="font-medium">⚡ Hybrid Strategy</div>
                  <div className="text-xs text-gray-400">Combine multiple approaches</div>
                </div>
              </SelectItem>
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
              <SelectItem value="low">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <div>
                    <div className="font-medium">Low Risk</div>
                    <div className="text-xs text-gray-400">0.3-0.8% expected returns</div>
                  </div>
                </div>
              </SelectItem>
              <SelectItem value="medium">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div>
                    <div className="font-medium">Medium Risk</div>
                    <div className="text-xs text-gray-400">0.5-1.5% expected returns</div>
                  </div>
                </div>
              </SelectItem>
              <SelectItem value="high">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div>
                    <div className="font-medium">High Risk</div>
                    <div className="text-xs text-gray-400">1.0-3.0% expected returns</div>
                  </div>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Trading Controls */}
        <div className="space-y-3">
          {!isActive ? (
            <Button
              onClick={handleStartTrading}
              disabled={loading || budget < 10}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              <Play className="w-4 h-4 mr-2" />
              {loading ? 'Starting Live Trading...' : 'Start Live Trading Bot'}
            </Button>
          ) : (
            <Button
              onClick={onStopTrading}
              className="w-full bg-red-600 hover:bg-red-700 text-white"
            >
              <Square className="w-4 h-4 mr-2" />
              Stop Live Trading
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

        {/* Live Trading Warning */}
        <div className="bg-red-600/10 border border-red-600/30 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5" />
            <div className="text-xs text-red-200">
              <div className="font-medium mb-1">⚠️ LIVE Trading Warning</div>
              <div>You are trading with real money on live exchanges. Minimum trade is $10. All profits and losses are real.</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
