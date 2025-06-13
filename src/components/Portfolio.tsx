
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, TrendingUp, PieChart } from 'lucide-react';

export const Portfolio = ({ balance, positions }) => {
  const totalValue = positions.reduce((sum, pos) => {
    return sum + (pos.amount * pos.price);
  }, 0);

  const profitLoss = totalValue - (10000 - balance);
  const profitPercent = ((profitLoss / 10000) * 100).toFixed(2);

  return (
    <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center text-white">
          <Wallet className="w-5 h-5 mr-2" />
          Portfolio
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          <div className="bg-gray-700/30 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">Kontosaldo</span>
              <Wallet className="w-4 h-4 text-gray-400" />
            </div>
            <span className="text-2xl font-mono text-white">${balance.toLocaleString()}</span>
          </div>

          <div className="bg-gray-700/30 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">Totalt värde</span>
              <PieChart className="w-4 h-4 text-gray-400" />
            </div>
            <span className="text-2xl font-mono text-white">${(balance + totalValue).toLocaleString()}</span>
          </div>

          <div className="bg-gray-700/30 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">Vinst/Förlust</span>
              <TrendingUp className={`w-4 h-4 ${profitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`} />
            </div>
            <div className="flex items-center space-x-2">
              <span className={`text-2xl font-mono ${profitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {profitLoss >= 0 ? '+' : ''}${profitLoss.toFixed(2)}
              </span>
              <span className={`text-sm ${profitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                ({profitPercent}%)
              </span>
            </div>
          </div>
        </div>

        {positions.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-400 mb-2">Aktiva positioner</h4>
            <div className="space-y-2">
              {positions.slice(0, 3).map((pos) => (
                <div key={pos.id} className="flex justify-between items-center bg-gray-700/20 p-2 rounded">
                  <span className="text-sm text-white">{pos.symbol}</span>
                  <span className={`text-sm ${pos.type === 'buy' ? 'text-green-400' : 'text-red-400'}`}>
                    {pos.type.toUpperCase()} {pos.amount}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
