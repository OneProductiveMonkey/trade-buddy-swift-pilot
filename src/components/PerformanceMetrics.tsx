
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface PerformanceData {
  metrics: {
    total_trades: number;
    successful_trades: number;
    total_profit: number;
    win_rate: number;
    avg_trade_time: number;
  };
  status: string;
  uptime: number;
}

export const PerformanceMetrics: React.FC = () => {
  const [performance, setPerformance] = useState<PerformanceData | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);

  const fetchPerformance = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/performance_summary');
      if (!response.ok) throw new Error('Failed to fetch performance');
      const data = await response.json();
      setPerformance(data);
      
      // Update chart data
      const newDataPoint = {
        time: new Date().toLocaleTimeString(),
        profit: data.metrics.total_profit,
        trades: data.metrics.total_trades
      };
      
      setChartData(prev => {
        const updated = [...prev, newDataPoint];
        return updated.slice(-20); // Keep last 20 data points
      });
    } catch (error) {
      console.error('Error fetching performance:', error);
    }
  };

  useEffect(() => {
    fetchPerformance();
    const interval = setInterval(fetchPerformance, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const getProfitColor = (profit: number) => {
    if (profit > 0) return 'text-green-400';
    if (profit < 0) return 'text-red-400';
    return 'text-gray-400';
  };

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-blue-400">📊 Performance Metrics</CardTitle>
      </CardHeader>
      <CardContent>
        {performance ? (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-700 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-white">
                  {performance.metrics.total_trades}
                </div>
                <div className="text-xs text-gray-400">Totala Trades</div>
              </div>
              
              <div className="bg-gray-700 p-4 rounded-lg text-center">
                <div className={`text-2xl font-bold ${getProfitColor(performance.metrics.total_profit)}`}>
                  ${performance.metrics.total_profit.toFixed(2)}
                </div>
                <div className="text-xs text-gray-400">Total Vinst</div>
              </div>
              
              <div className="bg-gray-700 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-400">
                  {performance.metrics.win_rate.toFixed(1)}%
                </div>
                <div className="text-xs text-gray-400">Vinstprocent</div>
              </div>
              
              <div className="bg-gray-700 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-400">
                  {performance.metrics.avg_trade_time.toFixed(2)}s
                </div>
                <div className="text-xs text-gray-400">Snitt Tid</div>
              </div>
            </div>

            {/* Status Information */}
            <div className="flex justify-between items-center bg-gray-700 p-4 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  performance.status === 'active' ? 'bg-green-400 animate-pulse' : 'bg-red-400'
                }`}></div>
                <span className="text-white font-medium">
                  Status: {performance.status === 'active' ? 'Aktiv' : 'Inaktiv'}
                </span>
              </div>
              <div className="text-gray-400 text-sm">
                Uptime: {formatUptime(performance.uptime)}
              </div>
            </div>

            {/* Profit Chart */}
            {chartData.length > 0 && (
              <div className="bg-gray-700 p-4 rounded-lg">
                <h4 className="text-white font-medium mb-4">Vinst över Tid</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="time" 
                      stroke="#9CA3AF"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="#9CA3AF"
                      fontSize={12}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        borderRadius: '6px'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="profit" 
                      stroke="#10B981" 
                      strokeWidth={2}
                      dot={{ fill: '#10B981', r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Additional Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-700 p-4 rounded-lg">
                <div className="text-lg font-bold text-white">
                  {performance.metrics.successful_trades}
                </div>
                <div className="text-sm text-gray-400">Lyckade Trades</div>
                <div className="text-xs text-green-400">
                  av {performance.metrics.total_trades} totalt
                </div>
              </div>
              
              <div className="bg-gray-700 p-4 rounded-lg">
                <div className="text-lg font-bold text-white">
                  ${performance.metrics.total_profit > 0 
                    ? (performance.metrics.total_profit / performance.metrics.successful_trades).toFixed(2)
                    : '0.00'
                  }
                </div>
                <div className="text-sm text-gray-400">Snitt Vinst/Trade</div>
                <div className="text-xs text-blue-400">
                  Per lyckad trade
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-400">Laddar performance data...</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
