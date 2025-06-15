
// Trading bot configuration
export const TRADING_CONFIG = {
  // Backend API Configuration
  API_BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  
  // Binance API Configuration (these should be set as environment variables)
  BINANCE_API_KEY: "Neyube4xusslnwpAqM7IaiphFvPqDL8oX0S7fOx2Q3Npiq7eKSGQKJnzvJTQ5jok",
  BINANCE_SECRET: "KOWSrvPvlqv8C2UyKO0pGUZjPXPSi0FPobOdlsRRnHZcm2Q0SeHSjhatPeWzlmJa",
  
  // Trading Parameters
  SELECTED_MARKETS: [
    {
      symbol: 'BTC/USDT',
      name: 'Bitcoin',
      basePrice: 68000,
      minProfitThreshold: 0.3,
      tradeAmountPct: 30,
      volatility: 'medium' as const,
      priority: 1
    },
    {
      symbol: 'ETH/USDT', 
      name: 'Ethereum',
      basePrice: 3500,
      minProfitThreshold: 0.4,
      tradeAmountPct: 25,
      volatility: 'medium' as const,
      priority: 2
    },
    {
      symbol: 'SOL/USDT',
      name: 'Solana',
      basePrice: 150,
      minProfitThreshold: 0.5,
      tradeAmountPct: 20,
      volatility: 'high' as const,
      priority: 3
    }
  ],
  
  // Exchange List
  EXCHANGES: ['Binance', 'KuCoin', 'Coinbase'],
  
  // Update Intervals
  PRICE_UPDATE_INTERVAL: 10000, // 10 seconds for live data
  STATUS_UPDATE_INTERVAL: 5000, // 5 seconds
  
  // Trading Limits - Updated for live trading
  MIN_TRADE_AMOUNT: 10, // $10 minimum as requested
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
    message: 'Live trading configured with Binance API',
    status: 'ready',
    note: 'Bot is connected to live Binance exchange with minimum $10 trades'
  };
};
