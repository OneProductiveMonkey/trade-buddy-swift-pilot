
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { History, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

export const TradingHistory = ({ positions }) => {
  return (
    <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center text-white">
          <History className="w-5 h-5 mr-2" />
          Trading historik
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {positions.length === 0 ? (
            <p className="text-gray-400 text-center py-8">Inga transaktioner ännu</p>
          ) : (
            positions.slice(0, 10).map((position) => (
              <div key={position.id} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                <div className="flex items-center space-x-3">
                  {position.type === 'buy' ? (
                    <ArrowUpRight className="w-4 h-4 text-green-400" />
                  ) : (
                    <ArrowDownLeft className="w-4 h-4 text-red-400" />
                  )}
                  <div>
                    <div className="font-medium text-white">{position.symbol}</div>
                    <div className="text-sm text-gray-400">
                      {position.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <Badge
                    variant={position.type === 'buy' ? "default" : "destructive"}
                    className={`${
                      position.type === 'buy'
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-red-600 hover:bg-red-700"
                    } text-white mb-1`}
                  >
                    {position.type.toUpperCase()}
                  </Badge>
                  <div className="text-sm text-gray-300">
                    {position.amount} @ ${position.price.toLocaleString()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
