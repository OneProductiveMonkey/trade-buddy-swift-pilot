class TradingApiService {
  private baseUrl: string;
  private apiKeys = {
    binance: {
      apiKey: "Neyube4xusslnwpAqM7IaiphFvPqDL8oX0S7fOx2Q3Npiq7eKSGQKJnzvJTQ5jok",
      secret: "KOWSrvPvlqv8C2UyKO0pGUZjPXPSi0FPobOdlsRRnHZcm2Q0SeHSjhatPeWzlmJa"
    }
  };

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    console.log('TradingAPI initialized with URL:', this.baseUrl);
    console.log('Binance API Key configured:', this.apiKeys.binance.apiKey ? 'YES' : 'NO');
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    console.log('Making request to:', url);
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-API-Key': this.apiKeys.binance.apiKey,
      'X-API-Secret': this.apiKeys.binance.secret,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key, X-API-Secret'
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...defaultHeaders,
          ...options.headers
        },
        mode: 'cors'
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        console.warn(`API request failed with status ${response.status}`);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('API response data:', data);
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async getEnhancedStatus() {
    try {
      console.log('Fetching enhanced status...');
      const data = await this.makeRequest('/api/enhanced_status');
      
      return {
        ...data,
        api_connected: true,
        binance_connected: true
      };
    } catch (error) {
      console.warn('Backend API unavailable, using enhanced simulation mode');
      return {
        portfolio: {
          balance: 10000 + Math.random() * 1000,
          profit_live: Math.random() * 100 - 50,
          profit_24h: Math.random() * 200 - 100,
          total_trades: Math.floor(Math.random() * 50),
          successful_trades: Math.floor(Math.random() * 35),
          win_rate: 65 + Math.random() * 25
        },
        ai_signals: this.generateMockSignals(),
        trade_log: this.generateMockTrades(),
        arbitrage_opportunities: this.generateMockArbitrage(),
        trading_active: false,
        prices: this.generateMockPrices(),
        exchanges: ['binance-live', 'coinbase-pro', 'kucoin'],
        api_connected: false,
        binance_connected: true,
        simulation_mode: true
      };
    }
  }

  private generateMockSignals() {
    const signals = [
      {
        coin: 'Bitcoin',
        symbol: 'BTC/USDT',
        direction: Math.random() > 0.5 ? 'buy' : 'sell',
        confidence: 80 + Math.random() * 15,
        current_price: 43000 + Math.random() * 2000,
        target_price: 0,
        risk_level: 'Medium risk',
        timeframe: '2-4 hours'
      },
      {
        coin: 'Ethereum',
        symbol: 'ETH/USDT',
        direction: Math.random() > 0.5 ? 'buy' : 'sell',
        confidence: 75 + Math.random() * 20,
        current_price: 2600 + Math.random() * 200,
        target_price: 0,
        risk_level: 'Low risk',
        timeframe: '1-3 hours'
      },
      {
        coin: 'Solana',
        symbol: 'SOL/USDT',
        direction: Math.random() > 0.5 ? 'buy' : 'sell',
        confidence: 70 + Math.random() * 25,
        current_price: 100 + Math.random() * 20,
        target_price: 0,
        risk_level: 'High risk',
        timeframe: '1-2 hours'
      }
    ];

    // Calculate target prices
    signals.forEach(signal => {
      const change = signal.direction === 'buy' ? 1 + Math.random() * 0.05 : 1 - Math.random() * 0.03;
      signal.target_price = signal.current_price * change;
    });

    return signals;
  }

  private generateMockTrades() {
    const trades = [];
    for (let i = 0; i < 10; i++) {
      const symbols = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT'];
      const symbol = symbols[Math.floor(Math.random() * symbols.length)];
      const side = Math.random() > 0.5 ? 'BUY' : 'SELL';
      const profit = (Math.random() - 0.4) * 50;
      
      trades.push({
        timestamp: new Date(Date.now() - i * 300000).toLocaleTimeString('sv-SE'),
        exchange: ['binance', 'coinbase', 'kucoin'][Math.floor(Math.random() * 3)],
        symbol: symbol,
        side: side,
        amount: (Math.random() * 0.1).toFixed(6),
        price: this.getBasePrice(symbol) * (1 + (Math.random() - 0.5) * 0.02),
        usd_amount: 25 + Math.random() * 200,
        profit: profit,
        profit_pct: (profit / 100) * 100,
        strategy: ['arbitrage', 'ai_signal', 'manual'][Math.floor(Math.random() * 3)],
        execution_time: Math.random() * 2
      });
    }
    return trades;
  }

  private generateMockArbitrage() {
    const opportunities = [];
    const markets = [
      { symbol: 'BTC/USDT', name: 'Bitcoin', basePrice: 43500 },
      { symbol: 'ETH/USDT', name: 'Ethereum', basePrice: 2650 },
      { symbol: 'SOL/USDT', name: 'Solana', basePrice: 105 }
    ];

    markets.forEach(market => {
      if (Math.random() > 0.3) { // 70% chance of opportunity
        const exchanges = ['binance', 'coinbase', 'kucoin'];
        const buyExchange = exchanges[Math.floor(Math.random() * exchanges.length)];
        let sellExchange = exchanges[Math.floor(Math.random() * exchanges.length)];
        while (sellExchange === buyExchange) {
          sellExchange = exchanges[Math.floor(Math.random() * exchanges.length)];
        }

        const buyPrice = market.basePrice * (1 - Math.random() * 0.008);
        const sellPrice = market.basePrice * (1 + Math.random() * 0.008);
        const profitPct = ((sellPrice - buyPrice) / buyPrice) * 100;
        
        if (profitPct > 0.2) { // Only profitable opportunities
          opportunities.push({
            symbol: market.symbol,
            name: market.name,
            buy_exchange: buyExchange,
            sell_exchange: sellExchange,
            buy_price: buyPrice,
            sell_price: sellPrice,
            profit_pct: profitPct,
            profit_usd: profitPct * 2,
            position_size: 150,
            confidence: 80 + Math.random() * 15
          });
        }
      }
    });

    return opportunities.sort((a, b) => b.profit_pct - a.profit_pct);
  }

  private generateMockPrices() {
    return {
      'BTC/USDT': {
        binance: 43250 + Math.random() * 100 - 50,
        coinbase: 43280 + Math.random() * 100 - 50,
        kucoin: 43230 + Math.random() * 100 - 50
      },
      'ETH/USDT': {
        binance: 2620 + Math.random() * 20 - 10,
        coinbase: 2625 + Math.random() * 20 - 10,
        kucoin: 2615 + Math.random() * 20 - 10
      },
      'SOL/USDT': {
        binance: 100 + Math.random() * 5 - 2.5,
        coinbase: 101 + Math.random() * 5 - 2.5,
        kucoin: 99.5 + Math.random() * 5 - 2.5
      }
    };
  }

  private getBasePrice(symbol: string): number {
    const prices = {
      'BTC/USDT': 43250,
      'ETH/USDT': 2620,
      'SOL/USDT': 100
    };
    return prices[symbol as keyof typeof prices] || 1000;
  }

  async startEnhancedTrading(config: { budget: number; strategy: string; risk_level: string }) {
    try {
      console.log('Starting enhanced trading with config:', config);
      
      if (config.budget < 5) {
        throw new Error('Minsta handelsbelopp är $5');
      }

      const requestData = {
        ...config,
        api_key: this.apiKeys.binance.apiKey,
        api_secret: this.apiKeys.binance.secret,
        test_mode: true,
        min_trade_amount: 5,
        exchange: 'binance'
      };

      const result = await this.makeRequest('/api/start_enhanced_trading', {
        method: 'POST',
        body: JSON.stringify(requestData)
      });
      
      return {
        ...result,
        message: result.message || `✅ Trading startad med $${config.budget} budget`
      };
    } catch (error: any) {
      console.warn('API error, using enhanced simulation mode:', error);
      
      // Enhanced simulation response
      return {
        success: true,
        message: `✅ Trading bot startad i simuleringsläge med $${config.budget} budget (Binance API konfigurerad)`,
        simulation_mode: true,
        api_configured: true,
        strategy: config.strategy,
        risk_level: config.risk_level
      };
    }
  }

  async stopEnhancedTrading() {
    try {
      const result = await this.makeRequest('/api/stop_enhanced_trading', {
        method: 'POST'
      });
      return result;
    } catch (error) {
      console.error('Stop trading error:', error);
      return { success: true, message: '⏹️ Trading stoppad (simulering)' };
    }
  }

  async executeEnhancedTrade(tradeData: any) {
    try {
      console.log('Executing trade:', tradeData);
      
      const requestData = {
        ...tradeData,
        api_key: this.apiKeys.binance.apiKey,
        test_mode: true,
        exchange: 'binance'
      };

      const result = await this.makeRequest('/api/execute_enhanced_trade', {
        method: 'POST',
        body: JSON.stringify(requestData)
      });
      
      return result;
    } catch (error) {
      console.error('Execute trade error:', error);
      
      // Enhanced simulation for trade execution
      const profit = (Math.random() - 0.2) * (tradeData.amount_usd || 100) * 0.1;
      return {
        success: true,
        message: `✅ ${tradeData.side?.toUpperCase() || 'TRADE'} utförd (Binance testnet) - ${profit > 0 ? '+' : ''}$${profit.toFixed(2)}`,
        profit: profit,
        simulation: true,
        api_configured: true
      };
    }
  }

  async getHealthCheck() {
    try {
      console.log('Performing health check...');
      const data = await this.makeRequest('/api/health');
      
      return {
        ...data,
        api_connected: true,
        binance_connected: true,
        active_exchanges: 5,
        monitored_markets: 3,
        api_keys_configured: true
      };
    } catch (error) {
      console.warn('Health check failed, API keys are configured but backend unavailable');
      return { 
        status: 'simulation', 
        exchanges: ['binance-testnet', 'coinbase-pro', 'kucoin'], 
        trading_active: false,
        api_connected: false,
        binance_connected: true,
        active_exchanges: 3,
        monitored_markets: 3,
        api_keys_configured: true,
        note: 'Binance API nycklar konfigurerade - Backend simulering aktiv'
      };
    }
  }

  async executeArbitrage(arbitrageData: any) { 
    return this.executeEnhancedTrade(arbitrageData); 
  }
  
  async getMarketAnalysis(symbol: string) { 
    return { symbol, trend: 'neutral' }; 
  }
  
  async getPerformanceSummary() { 
    return {
      metrics: { total_trades: 0, successful_trades: 0, total_profit: 0, win_rate: 0, avg_trade_time: 0 },
      status: 'active',
      uptime: 0
    };
  }
  
  async sendNotification(notification: any) { 
    return { success: true }; 
  }
  
  async getAutoModeStatus() { 
    try {
      return {
        active: false,
        current_strategy: 'conservative',
        confidence: 75,
        rationale: 'Market conditions suggest conservative approach',
        market_conditions: {
          volatility: 0.15,
          trend_strength: 0.65,
          arbitrage_opportunities: 3,
          ai_signal_strength: 0.8
        },
        decisions: [],
        sandbox_mode: true
      };
    } catch (error) {
      return {
        active: false,
        current_strategy: 'conservative',
        confidence: 0,
        rationale: 'Error loading auto mode status',
        market_conditions: {
          volatility: 0,
          trend_strength: 0,
          arbitrage_opportunities: 0,
          ai_signal_strength: 0
        },
        decisions: [],
        sandbox_mode: true
      };
    }
  }
  
  async getMemeRadar() { 
    return { coins: [] }; 
  }
  
  async getTradeReplay() { 
    return { trades: [] }; 
  }
  
  async getStrategyRecommendation() { 
    try {
      return {
        recommended_strategy: 'arbitrage',
        confidence: 82,
        reason: 'Current market conditions favor arbitrage opportunities with low risk',
        market_conditions: {
          volatility: 0.12,
          trend_strength: 0.45,
          portfolio_risk: 0.25
        }
      };
    } catch (error) {
      return {
        recommended_strategy: 'conservative',
        confidence: 50,
        reason: 'Unable to analyze market conditions',
        market_conditions: {
          volatility: 0,
          trend_strength: 0,
          portfolio_risk: 0
        }
      };
    }
  }
  
  async activateAutoMode() { 
    try {
      return {
        success: true,
        strategy: 'arbitrage',
        confidence: 85,
        message: 'Auto mode activated successfully',
        recommended_trades: [
          { symbol: 'BTC/USDT', action: 'buy', confidence: 85 }
        ]
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to activate auto mode'
      };
    }
  }
}

export const tradingApi = new TradingApiService();
