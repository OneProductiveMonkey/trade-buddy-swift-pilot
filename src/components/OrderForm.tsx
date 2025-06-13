
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShoppingCart, TrendingDown } from 'lucide-react';

export const OrderForm = ({ onTrade }) => {
  const [orderType, setOrderType] = useState('buy');
  const [symbol, setSymbol] = useState('BTC');
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('45000');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!amount || !price) return;

    onTrade({
      type: orderType,
      symbol,
      amount: parseFloat(amount),
      price: parseFloat(price),
    });

    setAmount('');
  };

  return (
    <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white">Ny order</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="buy" className="w-full" onValueChange={setOrderType}>
          <TabsList className="grid w-full grid-cols-2 bg-gray-700">
            <TabsTrigger value="buy" className="data-[state=active]:bg-green-600">
              <ShoppingCart className="w-4 h-4 mr-2" />
              KÖP
            </TabsTrigger>
            <TabsTrigger value="sell" className="data-[state=active]:bg-red-600">
              <TrendingDown className="w-4 h-4 mr-2" />
              SÄLJ
            </TabsTrigger>
          </TabsList>

          <TabsContent value="buy" className="space-y-4 mt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="symbol" className="text-gray-300">Kryptovaluta</Label>
                <Select value={symbol} onValueChange={setSymbol}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    <SelectItem value="BTC">Bitcoin (BTC)</SelectItem>
                    <SelectItem value="ETH">Ethereum (ETH)</SelectItem>
                    <SelectItem value="ADA">Cardano (ADA)</SelectItem>
                    <SelectItem value="SOL">Solana (SOL)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="amount" className="text-gray-300">Mängd</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.00000001"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>

              <div>
                <Label htmlFor="price" className="text-gray-300">Pris (USD)</Label>
                <Input
                  id="price"
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium"
              >
                Köp {symbol}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="sell" className="space-y-4 mt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="symbol" className="text-gray-300">Kryptovaluta</Label>
                <Select value={symbol} onValueChange={setSymbol}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    <SelectItem value="BTC">Bitcoin (BTC)</SelectItem>
                    <SelectItem value="ETH">Ethereum (ETH)</SelectItem>
                    <SelectItem value="ADA">Cardano (ADA)</SelectItem>
                    <SelectItem value="SOL">Solana (SOL)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="amount" className="text-gray-300">Mängd</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.00000001"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>

              <div>
                <Label htmlFor="price" className="text-gray-300">Pris (USD)</Label>
                <Input
                  id="price"
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-red-600 hover:bg-red-700 text-white font-medium"
              >
                Sälj {symbol}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
