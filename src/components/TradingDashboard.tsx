
import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';

export const TradingDashboard = () => {
  const [chartData, setChartData] = useState([]);
  const [currentPrice, setCurrentPrice] = useState(45000);
  const [priceChange, setPriceChange] = useState(0);

  useEffect(() => {
    // Simulate real-time price data
    const generateData = () => {
      const data = [];
      let price = 45000;
      
      for (let i = 0; i < 50; i++) {
        price += (Math.random() - 0.5) * 1000;
        data.push({
          time: new Date(Date.now() - (49 - i) * 60000).toLocaleTimeString(),
          price: Math.round(price),
        });
      }
      return data;
    };

    setChartData(generateData());

    const interval = setInterval(() => {
      setChartData(prev => {
        const newPrice = prev[prev.length - 1].price + (Math.random() - 0.5) * 500;
        const change = newPrice - currentPrice;
        setCurrentPrice(newPrice);
        setPriceChange(change);
        
        const newData = [...prev.slice(1), {
          time: new Date().toLocaleTimeString(),
          price: Math.round(newPrice),
        }];
        
        return newData;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [currentPrice]);

  return (
    <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-white">
          <span>BTC/USD</span>
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-mono">${currentPrice?.toLocaleString()}</span>
            <div className={`flex items-center ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {priceChange >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span className="ml-1">{priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}</span>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
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
                domain={['dataMin - 1000', 'dataMax + 1000']}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F9FAFB'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="price" 
                stroke="#10B981" 
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, stroke: '#10B981', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
