
// Trading bot configuration
export const TRADING_CONFIG = {
  // Backend API Configuration
  API_BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  
  // Binance API Configuration (these should be set as environment variables)
  BINANCE_API_KEY: process.env.REACT_APP_BINANCE_API_KEY || '',
  BINANCE_SECRET: process.env.REACT_APP_BINANCE_SECRET || '',
  
  // Trading Parameters
  SELECTED_MARKETS: [
    {
      symbol: 'BTC/USDT',
      name: 'Bitcoin',
      basePrice: 43000,
      minProfitThreshold: 0.3,
      tradeAmountPct: 30,
      volatility: 'medium' as const,
      priority: 1
    },
    {
      symbol: 'ETH/USDT', 
      name: 'Ethereum',
      basePrice: 2600,
      minProfitThreshold: 0.4,
      tradeAmountPct: 25,
      volatility: 'medium' as const,
      priority: 2
    },
    {
      symbol: 'SOL/USDT',
      name: 'Solana',
      basePrice: 100,
      minProfitThreshold: 0.5,
      tradeAmountPct: 20,
      volatility: 'high' as const,
      priority: 3
    }
  ],
  
  // Exchange List
  EXCHANGES: ['Binance', 'Coinbase', 'KuCoin', 'OKX', 'Bybit'],
  
  // Update Intervals
  PRICE_UPDATE_INTERVAL: 5000, // 5 seconds
  STATUS_UPDATE_INTERVAL: 3000, // 3 seconds
  
  // Trading Limits
  MIN_TRADE_AMOUNT: 100,
  MAX_TRADE_AMOUNT: 1000,
  
  // Risk Levels
  RISK_LEVELS: {
    low: { min: 0.3, max: 0.8 },
    medium: { min: 0.5, max: 1.5 },
    high: { min: 1.0, max: 3.0 }
  }
};

// Helper function to check if API keys are configured
export const isApiConfigured = () => {
  return !!(TRADING_CONFIG.BINANCE_API_KEY && TRADING_CONFIG.BINANCE_SECRET);
};

// Environment setup instructions
export const getSetupInstructions = () => {
  return {
    message: 'To enable live trading, set these environment variables:',
    variables: [
      'REACT_APP_BINANCE_API_KEY=your_binance_api_key',
      'REACT_APP_BINANCE_SECRET=your_binance_secret',
      'REACT_APP_API_URL=http://localhost:5000'
    ],
    note: 'For security, these should be set in your .env.local file or deployment environment'
  };
};
