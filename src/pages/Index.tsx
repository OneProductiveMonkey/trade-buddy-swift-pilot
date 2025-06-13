
import React, { useState, useEffect } from 'react';
import { TradingDashboard } from '@/components/TradingDashboard';
import { Portfolio } from '@/components/Portfolio';
import { OrderForm } from '@/components/OrderForm';
import { MarketData } from '@/components/MarketData';
import { TradingHistory } from '@/components/TradingHistory';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [balance, setBalance] = useState(10000);
  const [positions, setPositions] = useState([]);
  const { toast } = useToast();

  const handleTrade = (order) => {
    console.log('Executing trade:', order);
    
    if (order.type === 'buy') {
      const cost = order.amount * order.price;
      if (cost > balance) {
        toast({
          title: "Otillräckligt saldo",
          description: "Du har inte tillräckligt med medel för denna handel",
          variant: "destructive",
        });
        return;
      }
      setBalance(prev => prev - cost);
    } else {
      setBalance(prev => prev + (order.amount * order.price));
    }

    const newPosition = {
      id: Date.now(),
      symbol: order.symbol,
      type: order.type,
      amount: order.amount,
      price: order.price,
      timestamp: new Date(),
    };

    setPositions(prev => [newPosition, ...prev]);

    toast({
      title: "Handel genomförd",
      description: `${order.type.toUpperCase()} ${order.amount} ${order.symbol} för $${order.price}`,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent mb-2">
            Trading Bot Pro
          </h1>
          <p className="text-gray-400">Avancerad kryptovaluta trading platform</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <TradingDashboard />
          </div>
          <div className="space-y-6">
            <Portfolio balance={balance} positions={positions} />
            <OrderForm onTrade={handleTrade} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MarketData />
          <TradingHistory positions={positions} />
        </div>
      </div>
    </div>
  );
};

export default Index;
