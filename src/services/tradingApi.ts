class TradingApiService {
  private baseUrl: string;
  private ws: WebSocket | null = null;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  }

  // WebSocket connection for real-time updates
  connectWebSocket(onMessage: (data: any) => void) {
    try {
      this.ws = new WebSocket(`ws://localhost:5000/ws`);
      
      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        onMessage(data);
      };
      
      this.ws.onopen = () => {
        console.log('WebSocket connected');
      };
      
      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        // Attempt to reconnect after 3 seconds
        setTimeout(() => this.connectWebSocket(onMessage), 3000);
      };
      
      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
    }
  }

  disconnectWebSocket() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  async getEnhancedStatus() {
    try {
      const response = await fetch(`${this.baseUrl}/api/enhanced_status`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      // Return fallback data to keep UI working
      return {
        portfolio: {
          balance: 10000,
          profit_live: 0,
          profit_24h: 0,
          total_trades: 0,
          successful_trades: 0,
          win_rate: 0
        },
        ai_signals: [],
        trade_log: [],
        arbitrage_opportunities: [],
        trading_active: false,
        prices: {},
        exchanges: ['demo']
      };
    }
  }

  async startEnhancedTrading(config: { budget: number; strategy: string; risk_level: string }) {
    try {
      const response = await fetch(`${this.baseUrl}/api/start_enhanced_trading`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to start trading');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Start trading error:', error);
      throw error;
    }
  }

  async stopEnhancedTrading() {
    try {
      const response = await fetch(`${this.baseUrl}/api/stop_enhanced_trading`, {
        method: 'POST'
      });
      return await response.json();
    } catch (error) {
      console.error('Stop trading error:', error);
      throw error;
    }
  }

  async executeEnhancedTrade(tradeData: any) {
    try {
      const response = await fetch(`${this.baseUrl}/api/execute_enhanced_trade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tradeData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Trade execution failed');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Execute trade error:', error);
      throw error;
    }
  }

  async getHealthCheck() {
    try {
      const response = await fetch(`${this.baseUrl}/api/health`);
      return await response.json();
    } catch (error) {
      console.error('Health check error:', error);
      return { status: 'error', exchanges: [], trading_active: false };
    }
  }

  // Placeholder methods for compatibility
  async executeArbitrage(arbitrageData: any) { return this.executeEnhancedTrade(arbitrageData); }
  async getMarketAnalysis(symbol: string) { return { symbol, trend: 'neutral' }; }
  async getPerformanceSummary() { 
    return {
      metrics: { total_trades: 0, successful_trades: 0, total_profit: 0, win_rate: 0, avg_trade_time: 0 },
      status: 'active',
      uptime: 0
    };
  }
  async sendNotification(notification: any) { return { success: true }; }
  async getAutoModeStatus() { return { enabled: false }; }
  async getMemeRadar() { return { coins: [] }; }
  async getTradeReplay() { return { trades: [] }; }
  async getStrategyRecommendation() { return { strategy: 'conservative' }; }
  async activateAutoMode() { return { success: true }; }
}

export const tradingApi = new TradingApiService();
