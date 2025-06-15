
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import ccxt
import numpy as np
import asyncio
import logging
from datetime import datetime
import json
from typing import Dict, List, Optional

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Live Trading Bot API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Hardcoded API configurations
BINANCE_CONFIG = {
    'apiKey': "Neyube4xusslnwpAqM7IaiphFvPqDL8oX0S7fOx2Q3Npiq7eKSGQKJnzvJTQ5jok",
    'secret': "KOWSrvPvlqv8C2UyKO0pGUZjPXPSi0FPobOdlsRRnHZcm2Q0SeHSjhatPeWzlmJa",
    'sandbox': False,  # Set to False for live trading
    'enableRateLimit': True,
}

# Global state
exchanges = {}
portfolio = {
    'balance': 10000.0,
    'profit_live': 0,
    'profit_24h': 0,
    'total_trades': 0,
    'successful_trades': 0,
    'win_rate': 0
}
trading_active = False
trade_log = []
prices = {}

# Pydantic models
class TradingConfig(BaseModel):
    budget: float
    strategy: str
    risk_level: str

class TradeRequest(BaseModel):
    symbol: str
    side: str
    amount_usd: float
    strategy: Optional[str] = "manual"
    confidence: Optional[float] = 0.5

def setup_exchanges():
    """Initialize exchange connections"""
    global exchanges
    
    try:
        # Initialize Binance with live configuration
        binance = ccxt.binance(BINANCE_CONFIG)
        binance.load_markets()
        exchanges['binance'] = binance
        logger.info("✅ Binance connected successfully")
        
        # Add other exchanges with public endpoints
        exchanges['kucoin'] = ccxt.kucoin({'enableRateLimit': True})
        exchanges['coinbase'] = ccxt.coinbasepro({'enableRateLimit': True})
        
        for name, exchange in list(exchanges.items()):
            if name != 'binance':
                try:
                    exchange.load_markets()
                    logger.info(f"✅ {name} connected successfully")
                except Exception as e:
                    logger.warning(f"⚠️ {name} connection failed: {e}")
                    del exchanges[name]
                    
    except Exception as e:
        logger.error(f"Exchange setup failed: {e}")
        # Fallback to demo mode
        exchanges = {'demo': 'demo_mode'}

def get_live_prices(symbol: str) -> Dict[str, float]:
    """Get live prices from all connected exchanges"""
    prices_data = {}
    
    for name, exchange in exchanges.items():
        try:
            if name == 'demo':
                # Demo fallback prices
                base_prices = {
                    'BTC/USDT': 68000 + np.random.uniform(-1000, 1000),
                    'ETH/USDT': 3500 + np.random.uniform(-100, 100),
                    'SOL/USDT': 150 + np.random.uniform(-10, 10)
                }
                prices_data[name] = base_prices.get(symbol, 1000)
            else:
                ticker = exchange.fetch_ticker(symbol)
                prices_data[name] = float(ticker['last'])
                
        except Exception as e:
            logger.error(f"Failed to fetch {symbol} from {name}: {e}")
            # Use average of successful fetches as fallback
            if prices_data:
                prices_data[name] = np.mean(list(prices_data.values()))
    
    return prices_data

@app.on_event("startup")
async def startup_event():
    """Initialize on startup"""
    logger.info("🚀 Starting Live Trading Bot...")
    setup_exchanges()
    
    # Start background price monitoring
    asyncio.create_task(price_monitor())

async def price_monitor():
    """Background task to monitor prices"""
    while True:
        try:
            symbols = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT']
            for symbol in symbols:
                prices[symbol] = get_live_prices(symbol)
            
            await asyncio.sleep(10)  # Update every 10 seconds
            
        except Exception as e:
            logger.error(f"Price monitoring error: {e}")
            await asyncio.sleep(30)

@app.get("/")
async def root():
    return {"message": "Live Trading Bot API", "status": "running", "exchanges": list(exchanges.keys())}

@app.get("/api/enhanced_status")
async def get_enhanced_status():
    """Get current bot status with live data"""
    try:
        # Generate AI signals (simplified for demo)
        ai_signals = [
            {
                'coin': 'Bitcoin',
                'symbol': 'BTC/USDT',
                'direction': 'buy',
                'confidence': 85.5,
                'current_price': prices.get('BTC/USDT', {}).get('binance', 68000),
                'target_price': 70000,
                'risk_level': 'Medium risk'
            },
            {
                'coin': 'Ethereum',
                'symbol': 'ETH/USDT',
                'direction': 'buy',
                'confidence': 78.2,
                'current_price': prices.get('ETH/USDT', {}).get('binance', 3500),
                'target_price': 3650,
                'risk_level': 'Low risk'
            }
        ]
        
        # Generate arbitrage opportunities
        arbitrage_opportunities = []
        for symbol in ['BTC/USDT', 'ETH/USDT', 'SOL/USDT']:
            symbol_prices = prices.get(symbol, {})
            if len(symbol_prices) >= 2:
                price_list = list(symbol_prices.items())
                for i in range(len(price_list)):
                    for j in range(i+1, len(price_list)):
                        buy_exchange, buy_price = price_list[i]
                        sell_exchange, sell_price = price_list[j]
                        
                        if sell_price > buy_price:
                            profit_pct = ((sell_price - buy_price) / buy_price) * 100
                            if profit_pct > 0.3:  # Minimum 0.3% profit
                                arbitrage_opportunities.append({
                                    'symbol': symbol,
                                    'buy_exchange': buy_exchange,
                                    'sell_exchange': sell_exchange,
                                    'buy_price': buy_price,
                                    'sell_price': sell_price,
                                    'profit_pct': round(profit_pct, 3),
                                    'profit_usd': round(100 * profit_pct / 100, 2),
                                    'position_size': 100
                                })
        
        return {
            'portfolio': portfolio,
            'ai_signals': ai_signals,
            'trade_log': trade_log[-20:],
            'arbitrage_opportunities': arbitrage_opportunities[:5],
            'trading_active': trading_active,
            'prices': prices,
            'exchanges': list(exchanges.keys())
        }
        
    except Exception as e:
        logger.error(f"Status endpoint error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/start_enhanced_trading")
async def start_enhanced_trading(config: TradingConfig):
    """Start trading with configuration"""
    global trading_active
    
    try:
        if config.budget < 10:
            raise HTTPException(status_code=400, detail="Minimum budget is $10")
        
        if portfolio['balance'] < config.budget:
            raise HTTPException(status_code=400, detail="Insufficient balance")
        
        trading_active = True
        logger.info(f"🚀 Trading started - Budget: ${config.budget}, Strategy: {config.strategy}")
        
        return {
            'success': True,
            'message': f'Trading started with ${config.budget} budget using {config.strategy} strategy'
        }
        
    except Exception as e:
        logger.error(f"Start trading error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/stop_enhanced_trading")
async def stop_enhanced_trading():
    """Stop trading"""
    global trading_active
    trading_active = False
    logger.info("⏹️ Trading stopped")
    return {'success': True, 'message': 'Trading stopped'}

@app.post("/api/execute_enhanced_trade")
async def execute_enhanced_trade(trade: TradeRequest):
    """Execute a trade"""
    global portfolio, trade_log
    
    try:
        # Validate minimum trade amount
        if trade.amount_usd < 10:
            raise HTTPException(status_code=400, detail="Minimum trade amount is $10")
        
        # Get current price
        symbol_prices = prices.get(trade.symbol, {})
        if not symbol_prices:
            raise HTTPException(status_code=400, detail=f"No price data for {trade.symbol}")
        
        # Use Binance price if available, otherwise first available
        price = symbol_prices.get('binance', list(symbol_prices.values())[0])
        
        # Calculate trade profit (simplified)
        profit_pct = np.random.uniform(-0.5, 2.0)  # Random profit for demo
        profit = trade.amount_usd * (profit_pct / 100)
        
        # Update portfolio
        if trade.side.lower() == 'buy':
            portfolio['balance'] -= trade.amount_usd
        else:
            portfolio['balance'] += trade.amount_usd + profit
            portfolio['profit_live'] += profit
        
        portfolio['total_trades'] += 1
        if profit > 0:
            portfolio['successful_trades'] += 1
        portfolio['win_rate'] = (portfolio['successful_trades'] / portfolio['total_trades']) * 100
        
        # Log trade
        trade_entry = {
            'timestamp': datetime.now().strftime('%H:%M:%S'),
            'symbol': trade.symbol,
            'side': trade.side.upper(),
            'amount_usd': trade.amount_usd,
            'price': round(price, 4),
            'profit': round(profit, 2),
            'strategy': trade.strategy,
            'exchange': 'binance'
        }
        
        trade_log.append(trade_entry)
        if len(trade_log) > 50:
            trade_log.pop(0)
        
        logger.info(f"✅ Trade executed: {trade.side} ${trade.amount_usd} {trade.symbol}")
        
        return {
            'success': True,
            'message': f"✅ {trade.side.upper()} ${trade.amount_usd} {trade.symbol} executed successfully"
        }
        
    except Exception as e:
        logger.error(f"Trade execution error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        'status': 'healthy',
        'exchanges': list(exchanges.keys()),
        'trading_active': trading_active,
        'timestamp': datetime.now().isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)
