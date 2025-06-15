
import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { CheckCircle, XCircle, Wifi, WifiOff, Activity } from 'lucide-react';
import { tradingApi } from '@/services/tradingApi';
import { walletService } from '@/services/walletService';

export const LiveStatusBar: React.FC = () => {
  const [status, setStatus] = useState({
    api: 'checking',
    binance: false,
    phantom: false,
    metamask: false,
    trading: false
  });
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    checkAllStatus();
    const interval = setInterval(checkAllStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const checkAllStatus = async () => {
    try {
      // Check API status
      const healthCheck = await tradingApi.getHealthCheck();
      
      // Check wallet status
      const phantomStatus = await walletService.getPhantomStatus();
      const metamaskStatus = await walletService.getMetaMaskStatus();
      
      setStatus({
        api: healthCheck.api_connected ? 'connected' : 'disconnected',
        binance: healthCheck.binance_connected || false,
        phantom: phantomStatus.connected,
        metamask: metamaskStatus.connected,
        trading: healthCheck.trading_active || false
      });
      
      setLastUpdate(new Date());
    } catch (error) {
      setStatus(prev => ({ ...prev, api: 'error' }));
    }
  };

  const getStatusColor = (isConnected: boolean) => 
    isConnected ? 'bg-green-500' : 'bg-red-500';

  const getStatusIcon = (isConnected: boolean) => 
    isConnected ? CheckCircle : XCircle;

  return (
    <Card className="bg-gray-900/80 border-gray-700/50 backdrop-blur-sm mb-4">
      <div className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              {status.api === 'connected' ? (
                <Wifi className="w-4 h-4 text-green-400" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-400" />
              )}
              <span className="text-sm font-medium text-white">Live Status</span>
            </div>
            
            <div className="flex items-center space-x-3">
              <Badge className={`${getStatusColor(status.api === 'connected')} text-white`}>
                API {status.api === 'connected' ? 'Live' : 'Offline'}
              </Badge>
              
              <Badge className={`${getStatusColor(status.binance)} text-white`}>
                <span className="mr-1">₿</span>
                Binance {status.binance ? 'Live' : 'Offline'}
              </Badge>
              
              <Badge className={`${getStatusColor(status.phantom)} text-white`}>
                <span className="mr-1">👻</span>
                Phantom {status.phantom ? 'Live' : 'Offline'}
              </Badge>
              
              <Badge className={`${getStatusColor(status.metamask)} text-white`}>
                <span className="mr-1">🦊</span>
                MetaMask {status.metamask ? 'Live' : 'Offline'}
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {status.trading && (
              <Badge className="bg-green-500 text-white animate-pulse">
                <Activity className="w-3 h-3 mr-1" />
                Trading Active
              </Badge>
            )}
            
            <span className="text-xs text-gray-400">
              Uppdaterad: {lastUpdate.toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};
