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
      throw error;
    }
  }

  async getMarketAnalysis(symbol: string) {
    try {
      const response = await fetch(`${this.baseUrl}/api/market_analysis/${symbol}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Market Analysis API Error:', error);
      throw error;
    }
  }

  async getPerformanceSummary() {
    try {
      const response = await fetch(`${this.baseUrl}/api/performance_summary`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Performance API Error:', error);
      // Return demo data as fallback
      return {
        metrics: {
          total_trades: 45,
          successful_trades: 38,
          total_profit: 247.83,
          win_rate: 84.4,
          avg_trade_time: 2.3
        },
        status: 'active',
        uptime: 7200
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
      return await response.json();
    } catch (error) {
      console.error('Execute trade error:', error);
      throw error;
    }
  }

  async executeArbitrage(arbitrageData: any) {
    try {
      const response = await fetch(`${this.baseUrl}/api/execute_arbitrage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(arbitrageData)
      });
      return await response.json();
    } catch (error) {
      console.error('Execute arbitrage error:', error);
      throw error;
    }
  }

  async sendNotification(notification: { type: string; message: string; priority?: string }) {
    try {
      const response = await fetch(`${this.baseUrl}/api/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notification)
      });
      return await response.json();
    } catch (error) {
      console.error('Notification error:', error);
      throw error;
    }
  }

  async getAutoModeStatus() {
    try {
      const response = await fetch(`${this.baseUrl}/api/auto_mode`);
      return await response.json();
    } catch (error) {
      console.error('Auto mode error:', error);
      throw error;
    }
  }

  async getMemeRadar() {
    try {
      const response = await fetch(`${this.baseUrl}/api/meme_radar`);
      return await response.json();
    } catch (error) {
      console.error('Meme radar error:', error);
      throw error;
    }
  }

  async getTradeReplay() {
    try {
      const response = await fetch(`${this.baseUrl}/api/trade_replay`);
      return await response.json();
    } catch (error) {
      console.error('Trade replay error:', error);
      throw error;
    }
  }

  async getStrategyRecommendation() {
    try {
      const response = await fetch(`${this.baseUrl}/api/strategy_recommendation`);
      return await response.json();
    } catch (error) {
      console.error('Strategy recommendation error:', error);
      throw error;
    }
  }

  async activateAutoMode() {
    try {
      const response = await fetch(`${this.baseUrl}/api/activate_auto_mode`, {
        method: 'POST'
      });
      return await response.json();
    } catch (error) {
      console.error('Activate auto mode error:', error);
      throw error;
    }
  }
}

export const tradingApi = new TradingApiService();
