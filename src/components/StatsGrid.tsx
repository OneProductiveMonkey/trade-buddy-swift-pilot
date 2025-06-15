
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, Target, Zap, Clock } from 'lucide-react';

interface Portfolio {
  balance: number;
  profit_live: number;
  profit_24h: number;
  total_trades: number;
  successful_trades: number;
  win_rate: number;
}

interface StatsGridProps {
  portfolio: Portfolio;
}

export const StatsGrid: React.FC<StatsGridProps> = ({ portfolio }) => {
  const stats = [
    {
      title: 'Portfolio Value',
      value: `$${portfolio.balance.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10'
    },
    {
      title: 'Today P&L',
      value: `${portfolio.profit_live >= 0 ? '+' : ''}$${portfolio.profit_live.toFixed(2)}`,
      icon: portfolio.profit_live >= 0 ? TrendingUp : TrendingDown,
      color: portfolio.profit_live >= 0 ? 'text-green-400' : 'text-red-400',
      bgColor: portfolio.profit_live >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'
    },
    {
      title: '24h Performance',
      value: `${portfolio.profit_24h >= 0 ? '+' : ''}${portfolio.profit_24h.toFixed(1)}%`,
      icon: portfolio.profit_24h >= 0 ? TrendingUp : TrendingDown,
      color: portfolio.profit_24h >= 0 ? 'text-green-400' : 'text-red-400',
      bgColor: portfolio.profit_24h >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'
    },
    {
      title: 'Win Rate',
      value: `${portfolio.win_rate.toFixed(1)}%`,
      icon: Target,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10'
    },
    {
      title: 'Total Trades',
      value: portfolio.total_trades.toString(),
      icon: Zap,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10'
    },
    {
      title: 'Success Rate',
      value: `${portfolio.total_trades > 0 ? ((portfolio.successful_trades / portfolio.total_trades) * 100).toFixed(1) : 0}%`,
      icon: Clock,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
      {stats.map((stat, index) => (
        <Card key={index} className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className={`w-8 h-8 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </div>
            <div className={`text-lg font-bold ${stat.color}`}>
              {stat.value}
            </div>
            <div className="text-xs text-gray-400 font-medium">
              {stat.title}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
