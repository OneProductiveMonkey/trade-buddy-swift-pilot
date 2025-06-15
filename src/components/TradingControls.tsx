
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Settings, Play, Square, Wallet, AlertTriangle, Zap, CheckCircle, XCircle } from 'lucide-react';
import { walletService } from '@/services/walletService';
import { useToast } from '@/hooks/use-toast';

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
  const [budget, setBudget] = useState(25);
  const [strategy, setStrategy] = useState('arbitrage');
  const [riskLevel, setRiskLevel] = useState('medium');
  const [loading, setLoading] = useState(false);
  const [walletStatus, setWalletStatus] = useState({ phantom: false, metamask: false });
  const [apiStatus, setApiStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const { toast } = useToast();

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const checkStatus = async () => {
    try {
      const status = await walletService.getWalletReadyStatus();
      setWalletStatus(status);

      // Check API status
      try {
        const response = await fetch('http://localhost:5000/api/health');
        setApiStatus(response.ok ? 'connected' : 'disconnected');
      } catch {
        setApiStatus('disconnected');
      }
    } catch (error) {
      console.error('Status check failed:', error);
    }
  };

  const handleStartTrading = async () => {
    if (budget < 5) {
      toast({
        title: "⚠️ Ogiltigt belopp",
        description: 'Minsta handelsbelopp är $5 för testhandel',
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await onStartTrading({
        budget,
        strategy,
        risk_level: riskLevel
      });
    } catch (error: any) {
      toast({
        title: "❌ Startfel",
        description: error.message || 'Misslyckades att starta trading',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStrategyInfo = (strategy: string) => {
    const strategies = {
      arbitrage: { icon: '🔄', name: 'Arbitrage Trading', desc: 'Handel mellan börser', risk: 'Låg' },
      ai_signals: { icon: '🤖', name: 'AI Signal Trading', desc: 'Följ AI förutsägelser', risk: 'Medium' },
      hybrid: { icon: '⚡', name: 'Hybrid Strategi', desc: 'Kombinera metoder', risk: 'Medium' }
    };
    return strategies[strategy as keyof typeof strategies] || strategies.arbitrage;
  };

  const getRiskInfo = (risk: string) => {
    const risks = {
      low: { color: 'bg-green-500', range: '0.3-0.8%', desc: 'Konservativ approach' },
      medium: { color: 'bg-yellow-500', range: '0.5-1.5%', desc: 'Balanserad strategi' },
      high: { color: 'bg-red-500', range: '1.0-3.0%', desc: 'Aggressiv trading' }
    };
    return risks[risk as keyof typeof risks] || risks.medium;
  };

  const strategyInfo = getStrategyInfo(strategy);
  const riskInfo = getRiskInfo(riskLevel);

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center justify-between">
          <div className="flex items-center">
            <Settings className="w-5 h-5 mr-2 text-blue-400" />
            Trading Konfiguration
          </div>
          <div className="flex items-center space-x-2">
            <Badge className="bg-yellow-500">
              <Zap className="w-3 h-3 mr-1" />
              TEST
            </Badge>
            {apiStatus === 'connected' ? (
              <CheckCircle className="w-4 h-4 text-green-400" />
            ) : (
              <XCircle className="w-4 h-4 text-red-400" />
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Overview */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-800/50 p-3 rounded-lg">
            <div className="text-xs text-gray-400 mb-1">API Status</div>
            <div className={`text-sm font-medium ${apiStatus === 'connected' ? 'text-green-400' : 'text-red-400'}`}>
              {apiStatus === 'connected' ? '✅ Ansluten' : '❌ Frånkopplad'}
            </div>
          </div>
          <div className="bg-gray-800/50 p-3 rounded-lg">
            <div className="text-xs text-gray-400 mb-1">Wallet Status</div>
            <div className="text-sm font-medium text-white">
              {walletStatus.phantom || walletStatus.metamask ? (
                <span className="text-green-400">✅ {Object.values(walletStatus).filter(Boolean).length} Ansluten</span>
              ) : (
                <span className="text-yellow-400">⚠️ Ingen wallet</span>
              )}
            </div>
          </div>
        </div>

        {/* Test Mode Notice */}
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <span className="text-yellow-400">🟡</span>
            <div>
              <div className="text-yellow-400 text-sm font-medium">
                Testläge aktiverat
              </div>
              <div className="text-yellow-300 text-xs">
                Simulerade trades med minimum $5 volym • {apiStatus === 'disconnected' ? 'Lokal simulation' : 'Backend simulation'}
              </div>
            </div>
          </div>
        </div>

        {/* Budget Configuration */}
        <div className="space-y-3">
          <Label className="text-gray-300 flex items-center justify-between">
            <span className="flex items-center">
              <Wallet className="w-4 h-4 mr-2" />
              Handelsbudget
            </span>
            <span className="text-sm text-green-400">${budget}</span>
          </Label>
          <div className="space-y-3">
            <Input
              type="number"
              value={budget}
              onChange={(e) => setBudget(Math.max(5, Number(e.target.value)))}
              min={5}
              max={500}
              step={5}
              className="bg-gray-800 border-gray-700 text-white"
            />
            <Slider
              value={[budget]}
              onValueChange={(value) => setBudget(value[0])}
              max={500}
              min={5}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>$5 (Min)</span>
              <span className="text-green-400 font-medium">${budget}</span>
              <span>$500 (Max)</span>
            </div>
          </div>
        </div>

        {/* Strategy Selection */}
        <div className="space-y-2">
          <Label className="text-gray-300">Handelsstrategi</Label>
          <Select value={strategy} onValueChange={setStrategy}>
            <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              <SelectItem value="arbitrage">
                <div className="flex items-center space-x-2">
                  <span>🔄</span>
                  <div>
                    <div className="font-medium">Arbitrage Trading</div>
                    <div className="text-xs text-gray-400">Handel mellan börser</div>
                  </div>
                </div>
              </SelectItem>
              <SelectItem value="ai_signals">
                <div className="flex items-center space-x-2">
                  <span>🤖</span>
                  <div>
                    <div className="font-medium">AI Signal Trading</div>
                    <div className="text-xs text-gray-400">Följ AI förutsägelser</div>
                  </div>
                </div>
              </SelectItem>
              <SelectItem value="hybrid">
                <div className="flex items-center space-x-2">
                  <span>⚡</span>
                  <div>
                    <div className="font-medium">Hybrid Strategi</div>
                    <div className="text-xs text-gray-400">Kombinera metoder</div>
                  </div>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          
          {/* Strategy Info */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-2">
            <div className="flex items-center space-x-2">
              <span>{strategyInfo.icon}</span>
              <div className="text-xs">
                <div className="text-blue-400 font-medium">{strategyInfo.name}</div>
                <div className="text-blue-300">{strategyInfo.desc} • Risk: {strategyInfo.risk}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Risk Level */}
        <div className="space-y-2">
          <Label className="text-gray-300">Risknivå</Label>
          <Select value={riskLevel} onValueChange={setRiskLevel}>
            <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              <SelectItem value="low">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <div>
                    <div className="font-medium">Låg Risk</div>
                    <div className="text-xs text-gray-400">0.3-0.8% förväntad avkastning</div>
                  </div>
                </div>
              </SelectItem>
              <SelectItem value="medium">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div>
                    <div className="font-medium">Medium Risk</div>
                    <div className="text-xs text-gray-400">0.5-1.5% förväntad avkastning</div>
                  </div>
                </div>
              </SelectItem>
              <SelectItem value="high">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div>
                    <div className="font-medium">Hög Risk</div>
                    <div className="text-xs text-gray-400">1.0-3.0% förväntad avkastning</div>
                  </div>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Risk Info */}
          <div className="bg-gray-700/50 rounded-lg p-2">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${riskInfo.color}`}></div>
              <div className="text-xs">
                <span className="text-gray-300">{riskInfo.range} • {riskInfo.desc}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {!isActive ? (
            <Button
              onClick={handleStartTrading}
              disabled={loading || budget < 5}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              <Play className="w-4 h-4 mr-2" />
              {loading ? 'Startar Trading...' : 'Starta Trading Bot'}
            </Button>
          ) : (
            <Button
              onClick={onStopTrading}
              className="w-full bg-red-600 hover:bg-red-700 text-white"
            >
              <Square className="w-4 h-4 mr-2" />
              Stoppa Trading
            </Button>
          )}
          
          {/* Status Summary */}
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
            <div>
              <span className="font-medium">Tillgängligt:</span> ${balance.toFixed(2)}
            </div>
            <div>
              <span className="font-medium">Använder:</span> ${budget}
            </div>
            <div>
              <span className="font-medium">Strategi:</span> {strategyInfo.name}
            </div>
            <div>
              <span className="font-medium">Risk:</span> {riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)}
            </div>
          </div>
        </div>

        {/* Important Notice */}
        <div className="bg-blue-600/10 border border-blue-600/30 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 text-blue-400 mt-0.5" />
            <div className="text-xs text-blue-200">
              <div className="font-medium mb-1">ℹ️ Testläge Information</div>
              <div>Trading sker med simulerad data. Minimum trade $5. Alla vinster/förluster är simulerade för utbildningssyfte.</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
