
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
  const [budget, setBudget] = useState(25);
  const [strategy, setStrategy] = useState('arbitrage');
  const [riskLevel, setRiskLevel] = useState('medium');
  const [loading, setLoading] = useState(false);

  const handleStartTrading = async () => {
    if (budget < 5) {
      alert('⚠️ Minsta handelsbelopp är $5 för testhandel');
      return;
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

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <Settings className="w-5 h-5 mr-2 text-blue-400" />
          Test Trading Konfiguration
          <Badge className="ml-auto bg-yellow-500">
            <Zap className="w-3 h-3 mr-1" />
            TEST
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <span className="text-yellow-400">🟡 TEST</span>
            <div>
              <div className="text-yellow-400 text-sm font-medium">
                Testläge aktiverat
              </div>
              <div className="text-yellow-300 text-xs">
                Simulerade trades med minimum $5 volym
              </div>
            </div>
          </div>
        </div>

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
              👻 Phantom {walletService.isPhantomAvailable() ? "Klar" : "Ej ansluten"}
            </Badge>
            <Badge 
              variant={walletService.isMetaMaskAvailable() ? "default" : "secondary"}
              className={walletService.isMetaMaskAvailable() ? "bg-orange-600" : "bg-gray-600"}
            >
              🦊 MetaMask {walletService.isMetaMaskAvailable() ? "Klar" : "Ej ansluten"}
            </Badge>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-gray-300">Handelsbudget (Min $5)</Label>
          <div className="space-y-3">
            <Input
              type="number"
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              min={5}
              max={500}
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
              <span>$5</span>
              <span>${budget}</span>
              <span>$500</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-gray-300">Handelsstrategi</Label>
          <Select value={strategy} onValueChange={setStrategy}>
            <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              <SelectItem value="arbitrage">
                <div>
                  <div className="font-medium">🔄 Arbitrage Trading</div>
                  <div className="text-xs text-gray-400">Handel mellan börser</div>
                </div>
              </SelectItem>
              <SelectItem value="ai_signals">
                <div>
                  <div className="font-medium">🤖 AI Signal Trading</div>
                  <div className="text-xs text-gray-400">Följ AI förutsägelser</div>
                </div>
              </SelectItem>
              <SelectItem value="hybrid">
                <div>
                  <div className="font-medium">⚡ Hybrid Strategi</div>
                  <div className="text-xs text-gray-400">Kombinera metoder</div>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

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
        </div>

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
          
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
            <div>
              <span className="font-medium">Tillgängligt:</span> ${balance.toFixed(2)}
            </div>
            <div>
              <span className="font-medium">Använder:</span> ${budget}
            </div>
          </div>
        </div>

        <div className="bg-blue-600/10 border border-blue-600/30 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 text-blue-400 mt-0.5" />
            <div className="text-xs text-blue-200">
              <div className="font-medium mb-1">ℹ️ Testläge</div>
              <div>Du handlar med simulerad data. Minimum trade är $5. Alla vinster och förluster är simulerade.</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
