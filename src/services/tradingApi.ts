// Backend API service for trading bot communication
class TradingApiService {
  public baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:5000') {
    this.baseUrl = baseUrl;
  }

  async getEnhancedStatus() {
    try {
      const response = await fetch(`${this.baseUrl}/api/enhanced_status`);
      if (!response.ok) throw new Error('Failed to fetch status');
      return await response.json();
    } catch (error) {
      console.error('API Error - Enhanced Status:', error);
      return this.getFallbackStatus();
    }
  }

  async getHealthCheck() {
    try {
      const response = await fetch(`${this.baseUrl}/api/health`);
      if (!response.ok) throw new Error('Health check failed');
      return await response.json();
    } catch (error) {
      console.error('API Error - Health Check:', error);
      return {
        status: 'offline',
        active_exchanges: 0,
        demo_exchanges: 5,
        monitored_markets: 3,
        trading_active: false,
        sandbox_mode: true
      };
    }
  }

  async getAutoModeStatus() {
    try {
      const response = await fetch(`${this.baseUrl}/api/auto_mode_status`);
      if (!response.ok) throw new Error('Auto mode status failed');
      return await response.json();
    } catch (error) {
      console.error('API Error - Auto Mode Status:', error);
      return {
        active: false,
        current_strategy: null,
        confidence: 0,
        rationale: 'Demo mode - inga AI beslut tillgängliga',
        market_conditions: {},
        decisions: [],
        sandbox_mode: true
      };
    }
  }

  async activateAutoMode() {
    try {
      const response = await fetch(`${this.baseUrl}/api/auto_mode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Auto mode activation failed');
      return await response.json();
    } catch (error) {
      console.error('API Error - Auto Mode:', error);
      return { 
        success: false, 
        message: 'Auto mode activation failed',
        strategy: 'hybrid',
        confidence: 75,
        rationale: 'Demo mode - simulerad AI strategi'
      };
    }
  }

  async getTradeReplay() {
    try {
      const response = await fetch(`${this.baseUrl}/api/trade_replay`);
      if (!response.ok) throw new Error('Trade replay failed');
      return await response.json();
    } catch (error) {
      console.error('API Error - Trade Replay:', error);
      return {
        trades: [],
        statistics: {
          total_trades: 0,
          winning_trades: 0,
          win_rate: 0,
          avg_roi: 0,
          total_profit: 0
        },
        total_count: 0,
        sandbox_mode: true
      };
    }
  }

  async getMemeRadarData() {
    try {
      const response = await fetch(`${this.baseUrl}/api/meme_radar`);
      if (!response.ok) throw new Error('Meme radar failed');
      return await response.json();
    } catch (error) {
      console.error('API Error - Meme Radar:', error);
      return {
        success: false,
        data: {
          meme_candidates: [],
          top_gainers: [],
          volume_leaders: [],
          total_analyzed: 0
        },
        sandbox_mode: true
      };
    }
  }

  async startEnhancedTrading(config: {
    budget: number;
    strategy: string;
    risk_level: string;
  }) {
    try {
      const response = await fetch(`${this.baseUrl}/api/start_enhanced_trading`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      return await response.json();
    } catch (error) {
      console.error('API Error - Start Trading:', error);
      return { success: false, message: 'Connection error' };
    }
  }

  async stopEnhancedTrading() {
    try {
      const response = await fetch(`${this.baseUrl}/api/stop_enhanced_trading`, {
        method: 'POST'
      });
      return await response.json();
    } catch (error) {
      console.error('API Error - Stop Trading:', error);
      return { success: false, message: 'Connection error' };
    }
  }

  async executeEnhancedTrade(tradeData: {
    symbol: string;
    side: string;
    amount_usd: number;
    strategy: string;
    confidence: number;
    exchange?: string;
  }) {
    try {
      const response = await fetch(`${this.baseUrl}/api/execute_enhanced_trade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tradeData)
      });
      return await response.json();
    } catch (error) {
      console.error('API Error - Execute Trade:', error);
      return { success: false, message: 'Trade execution failed' };
    }
  }

  async executeArbitrage(arbitrageData: {
    symbol: string;
    buy_exchange: string;
    sell_exchange: string;
    position_size: number;
  }) {
    try {
      const response = await fetch(`${this.baseUrl}/api/execute_arbitrage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(arbitrageData)
      });
      return await response.json();
    } catch (error) {
      console.error('API Error - Execute Arbitrage:', error);
      return { success: false, message: 'Arbitrage execution failed' };
    }
  }

  async getStrategyRecommendation() {
    try {
      const response = await fetch(`${this.baseUrl}/api/strategy_recommendation`);
      if (!response.ok) throw new Error('Strategy recommendation failed');
      return await response.json();
    } catch (error) {
      console.error('API Error - Strategy Recommendation:', error);
      return {
        recommended_strategy: 'conservative',
        confidence: 50,
        reason: 'Demo mode - använder konservativ strategi',
        market_conditions: {
          volatility: 0.3,
          trend_strength: 0.5,
          portfolio_risk: 0.2
        }
      };
    }
  }

  async getPerformanceSummary() {
    try {
      const response = await fetch(`${this.baseUrl}/api/performance_summary`);
      if (!response.ok) throw new Error('Performance summary failed');
      return await response.json();
    } catch (error) {
      console.error('API Error - Performance Summary:', error);
      return {
        metrics: {
          total_trades: 0,
          successful_trades: 0,
          total_profit: 0,
          win_rate: 0,
          avg_trade_time: 0
        },
        status: 'offline',
        uptime: 0
      };
    }
  }

  private getFallbackStatus() {
    return {
      portfolio: {
        balance: 10000,
        profit_live: 0,
        profit_24h: 0,
        profit_1_5h: 0,
        total_trades: 0,
        successful_trades: 0,
        win_rate: 0
      },
      ai_signals: [],
      trade_log: [],
      arbitrage_opportunities: [],
      trading_active: false,
      prices: {},
      market_data: {},
      sandbox_mode: true
    };
  }
}

export const tradingApi = new TradingApiService();
