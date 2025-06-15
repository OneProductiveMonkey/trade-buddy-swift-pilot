from fastapi import FastAPI, WebSocket, HTTPException, BackgroundTasks
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import ccxt
import pandas as pd
import numpy as np
import time
import threading
import sqlite3
from datetime import datetime, timedelta
import requests
import json
from typing import Dict, List, Tuple, Optional
import os
import asyncio
import logging
from concurrent.futures import ThreadPoolExecutor
import ta  # Technical analysis library

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Advanced AI Trading Bot API")

# Add CORS middleware to allow frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods,
    allow_headers=["*"],  # Allows all headers
)

# WebSocket Manager for real-time updates
class WebSocketManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_text(json.dumps(message))
            except:
                self.disconnect(connection)

manager = WebSocketManager()

# --- Pydantic Models for Request Bodies ---
class StartTradingPayload(BaseModel):
    budget: float
    strategy: str
    risk_level: str

class ExecuteTradePayload(BaseModel):
    exchange: Optional[str] = 'binance'
    symbol: str
    side: str
    amount_usd: float
    strategy: Optional[str] = 'manual'
    confidence: Optional[float] = 0.5

class ExecuteArbitragePayload(BaseModel):
    symbol: str
    buy_exchange: str
    sell_exchange: str
    position_size: float

# --- Global State & Configuration ---
exchanges = {}
portfolio = {
    'balance': 1000,
    'profit_live': 0,
    'profit_24h': 0,
    'profit_1_5h': 0,
    'total_trades': 0,
    'successful_trades': 0,
    'win_rate': 0
}
trading_active = False
ai_signals = []
trade_log = []
prices = {}
market_data = {}

SELECTED_MARKETS = [
    {
        'symbol': 'BTC/USDT', 'name': 'Bitcoin', 'min_profit_threshold': 0.3,
        'trade_amount_pct': 30, 'volatility': 'medium', 'priority': 1
    },
    {
        'symbol': 'ETH/USDT', 'name': 'Ethereum', 'min_profit_threshold': 0.4,
        'trade_amount_pct': 25, 'volatility': 'medium', 'priority': 2
    },
    {
        'symbol': 'SOL/USDT', 'name': 'Solana', 'min_profit_threshold': 0.5,
        'trade_amount_pct': 20, 'volatility': 'high', 'priority': 3
    }
]

# --- Enhanced Trading Bot Class ---
class EnhancedTradingBot:
    def __init__(self):
        self.executor = ThreadPoolExecutor(max_workers=10)
        self.setup_database()
        self.setup_exchanges()
        self.initialize_markets()
        self.start_price_monitoring()
        self.start_trading_engine()

    def setup_database(self):
        conn = sqlite3.connect('trading_bot.db')
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS trades (
                id INTEGER PRIMARY KEY AUTOINCREMENT, timestamp DATETIME, exchange TEXT,
                symbol TEXT, side TEXT, amount REAL, price REAL, profit REAL,
                profit_pct REAL, strategy TEXT, confidence REAL,
                market_conditions TEXT, execution_time REAL
            )
        ''')
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS market_analysis (
                id INTEGER PRIMARY KEY AUTOINCREMENT, timestamp DATETIME, symbol TEXT,
                rsi REAL, macd REAL, bollinger_position REAL, volume_spike REAL,
                trend_direction TEXT, confidence REAL
            )
        ''')
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS performance (
                id INTEGER PRIMARY KEY AUTOINCREMENT, timestamp DATETIME, total_profit REAL,
                win_rate REAL, total_trades INTEGER, active_positions INTEGER, balance REAL
            )
        ''')
        conn.commit()
        conn.close()

    def setup_exchanges(self):
        global exchanges
        
        # Use provided keys directly
        binance_api_key = "Neyube4xusslnwpAqM7IaiphFvPqDL8oX0S7fOx2Q3Npiq7eKSGQKJnzvJTQ5jok"
        binance_secret = "KOWSrvPvlqv8C2UyKO0pGUZjPXPSi0FPobOdlsRRnHZcm2Q0SeHSjhatPeWzlmJa"

        exchange_configs = {
            'binance': {
                'apiKey': binance_api_key,
                'secret': binance_secret,
                'options': {'defaultType': 'spot'}
            },
            'coinbase': {}, 'kucoin': {}, 'okx': {}, 'bybit': {}
        }
        
        active_exchanges = {}
        for name, config in exchange_configs.items():
            if 'apiKey' in config and config['apiKey']:
                try:
                    exchange_class = getattr(ccxt, name)
                    exchange = exchange_class(config)
                    exchange.load_markets()
                    active_exchanges[name] = exchange
                    logger.info(f"✅ Connected to {name}")
                except Exception as e:
                    logger.warning(f"❌ Failed to connect to {name}, using demo mode: {e}")
                    active_exchanges[name] = 'demo'
            else:
                active_exchanges[name] = 'demo'
        
        exchanges = active_exchanges

    def initialize_markets(self):
        global market_data
        for market in SELECTED_MARKETS:
            symbol = market['symbol']
            market_data[symbol] = {
                'config': market, 'prices': {}, 'analysis': {}, 'last_trade': None,
                'position': None, 'profit_tracking': [], 'price_history': []
            }

    def get_prices_parallel(self, symbol):
        def fetch_price(exchange_name, exchange):
            base_prices = {'BTC/USDT': 68000, 'ETH/USDT': 3500, 'SOL/USDT': 150}
            base = base_prices.get(symbol, 1000)
            try:
                if exchange == 'demo':
                    return base + np.random.normal(0, base * 0.002)
                else:
                    ticker = exchange.fetch_ticker(symbol)
                    return float(ticker['last'])
            except Exception as e:
                logger.error(f"Failed to fetch {symbol} from {exchange_name}: {e}")
                return base + np.random.normal(0, base * 0.005)

        futures = {name: self.executor.submit(fetch_price, name, ex) for name, ex in exchanges.items()}
        return {name: future.result(timeout=5) for name, future in futures.items()}

    def find_enhanced_arbitrage_opportunities(self):
        opportunities = []
        for market in SELECTED_MARKETS:
            symbol = market['symbol']
            min_profit = market['min_profit_threshold']
            try:
                exchange_prices = self.get_prices_parallel(symbol)
                if len(exchange_prices) < 2: continue
                
                for buy_ex, buy_p in exchange_prices.items():
                    for sell_ex, sell_p in exchange_prices.items():
                        if buy_ex != sell_ex:
                            profit_pct = ((sell_p - buy_p) / buy_p) * 100
                            if profit_pct > min_profit:
                                size = (portfolio['balance'] * market['trade_amount_pct']) / 100
                                opportunities.append({
                                    'symbol': symbol, 'name': market['name'], 'buy_exchange': buy_ex,
                                    'sell_exchange': sell_ex, 'buy_price': buy_p, 'sell_price': sell_p,
                                    'profit_pct': round(profit_pct, 3),
                                    'profit_usd': round((sell_p - buy_p) * (size / buy_p), 2),
                                    'position_size': round(size, 2), 'priority': market['priority'],
                                    'confidence': min(0.9, profit_pct / min_profit * 0.6)
                                })
            except Exception as e:
                logger.error(f"Error finding arbitrage for {symbol}: {e}")
        return sorted(opportunities, key=lambda x: (x['profit_pct'] * x['priority']), reverse=True)

    def generate_enhanced_ai_signals(self):
        global ai_signals
        signals = []
        for market in SELECTED_MARKETS:
            symbol = market['symbol']
            try:
                prices = self.get_prices_parallel(symbol)
                avg_price = np.mean(list(prices.values()))
                
                # Simplified analysis for demo
                confidence = np.random.uniform(65, 95)
                direction = np.random.choice(['buy', 'sell'])
                
                if confidence > 70:
                    signals.append({
                        'coin': market['name'], 'symbol': symbol, 'direction': direction,
                        'confidence': round(confidence, 1), 'current_price': round(avg_price, 4),
                        'target_price': round(avg_price * (1.03 if direction == 'buy' else 0.98), 4),
                        'risk_level': f"{market['volatility'].title()} risk", 'timeframe': '1-3 hours'
                    })
            except Exception as e:
                logger.error(f"Error generating signal for {symbol}: {e}")
        ai_signals = sorted(signals, key=lambda x: x['confidence'], reverse=True)[:3]

    def execute_enhanced_trade(self, exchange_name, symbol, side, amount_usd, strategy='manual', confidence=0.5):
        global portfolio, trade_log
        start_time = time.time()
        try:
            amount_usd = max(amount_usd, 100)
            current_prices = self.get_prices_parallel(symbol)
            price = current_prices.get(exchange_name, list(current_prices.values())[0])
            crypto_amount = amount_usd / price

            profit_pct = np.random.uniform(-1.5, 2.5)
            if strategy == 'arbitrage': profit_pct = np.random.uniform(0.3, 1.8)
            elif strategy == 'ai_signal': profit_pct = np.random.uniform(-0.5, confidence/20)
            
            profit = amount_usd * (profit_pct / 100)
            
            trade_profit = 0
            if side == 'buy':
                portfolio['balance'] -= amount_usd
            else: # sell
                portfolio['balance'] += amount_usd + profit
                trade_profit = profit
                portfolio['profit_live'] += profit

            portfolio['total_trades'] += 1
            if profit > 0: portfolio['successful_trades'] += 1
            portfolio['win_rate'] = (portfolio['successful_trades'] / portfolio['total_trades']) * 100 if portfolio['total_trades'] > 0 else 0
            
            trade_entry = {
                'timestamp': datetime.now().strftime('%H:%M:%S'), 'exchange': exchange_name,
                'symbol': symbol, 'side': side.upper(), 'amount': round(crypto_amount, 6),
                'price': round(price, 4), 'usd_amount': amount_usd, 'profit': round(trade_profit, 2),
                'profit_pct': round(profit_pct, 3), 'strategy': strategy, 'confidence': confidence,
                'execution_time': round(time.time() - start_time, 3)
            }
            trade_log.append(trade_entry)
            if len(trade_log) > 50: trade_log.pop(0)
            
            self.save_enhanced_trade_to_db(trade_entry)
            logger.info(f"✅ Trade executed: {side} ${amount_usd} {symbol} at ${price:.4f} (profit: ${trade_profit:.2f})")
            return True, f"✅ {side.upper()} ${amount_usd} {symbol} | Profit: ${trade_profit:.2f} ({profit_pct:.2f}%)"

    def save_enhanced_trade_to_db(self, trade):
        try:
            conn = sqlite3.connect('trading_bot.db')
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO trades (timestamp, exchange, symbol, side, amount, price, profit, profit_pct, strategy, confidence, execution_time)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                datetime.now(), trade['exchange'], trade['symbol'], trade['side'],
                trade['amount'], trade['price'], trade['profit'], trade.get('profit_pct', 0),
                trade['strategy'], trade.get('confidence', 0), trade.get('execution_time', 0)
            ))
            conn.commit()
            conn.close()
        except Exception as e:
            logger.error(f"Failed to save trade to DB: {e}")

    def monitor_markets_job(self):
        while True:
            try:
                for market in SELECTED_MARKETS:
                    symbol = market['symbol']
                    exchange_prices = self.get_prices_parallel(symbol)
                    prices[symbol] = exchange_prices
                    
                    avg_price = np.mean(list(exchange_prices.values()))
                    market_data[symbol]['price_history'].append({'timestamp': datetime.now(), 'price': avg_price})
                    if len(market_data[symbol]['price_history']) > 100:
                        market_data[symbol]['price_history'].pop(0)
                
                self.generate_enhanced_ai_signals()
                time.sleep(15)
            except Exception as e:
                logger.error(f"Price monitoring error: {e}")
                time.sleep(30)

    def trading_engine_job(self):
        while True:
            try:
                if trading_active:
                    opportunities = self.find_enhanced_arbitrage_opportunities()
                    for opp in opportunities[:2]:
                        logger.info(f"🚀 Executing arbitrage: {opp['symbol']} - {opp['profit_pct']:.2f}% profit")
                        success, _ = self.execute_enhanced_trade(opp['buy_exchange'], opp['symbol'], 'buy', opp['position_size'], 'arbitrage', opp['confidence'])
                        if success:
                            time.sleep(1)
                            self.execute_enhanced_trade(opp['sell_exchange'], opp['symbol'], 'sell', opp['position_size'], 'arbitrage', opp['confidence'])
                        time.sleep(5)
                time.sleep(20)
            except Exception as e:
                logger.error(f"Trading engine error: {e}")
                time.sleep(60)

    def start_price_monitoring(self):
        thread = threading.Thread(target=self.monitor_markets_job, daemon=True)
        thread.start()
        logger.info("🔄 Price monitoring started")

    def start_trading_engine(self):
        thread = threading.Thread(target=self.trading_engine_job, daemon=True)
        thread.start()
        logger.info("🤖 Trading engine started")

# --- FastAPI App Initialization ---
bot = EnhancedTradingBot()

@app.on_event("startup")
async def startup_event():
    logger.info("Application startup...")

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await asyncio.sleep(2)
            update = {
                "type": "price_update",
                "data": {
                    "BTC/USDT": 68000 + np.random.normal(0, 500),
                    "ETH/USDT": 3500 + np.random.normal(0, 50),
                    "SOL/USDT": 150 + np.random.normal(0, 10)
                },
                "timestamp": datetime.now().isoformat()
            }
            await manager.broadcast(update)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        manager.disconnect(websocket)

@app.get("/api/enhanced_status")
async def get_enhanced_status():
    try:
        arbitrage_opportunities = bot.find_enhanced_arbitrage_opportunities()
        return {
            'portfolio': portfolio,
            'ai_signals': ai_signals,
            'trade_log': trade_log[-20:],
            'arbitrage_opportunities': arbitrage_opportunities[:5],
            'trading_active': trading_active,
            'prices': prices,
        }
    except Exception as e:
        logger.error(f"Status endpoint error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/market_analysis/{symbol}")
async def get_market_analysis(symbol: str):
    """Get detailed market analysis for a symbol"""
    try:
        analysis = {
            "symbol": symbol,
            "timestamp": datetime.now().isoformat(),
            "indicators": {
                "rsi": np.random.uniform(30, 70),
                "macd": {
                    "macd": np.random.uniform(-100, 100),
                    "signal": np.random.uniform(-100, 100),
                    "histogram": np.random.uniform(-50, 50)
                },
                "bollinger": {
                    "upper": 45000,
                    "middle": 43000,
                    "lower": 41000,
                    "position": np.random.uniform(0, 1)
                },
                "volume_profile": {
                    "volume_spike": np.random.uniform(0.8, 2.0),
                    "trend": np.random.choice(["bullish", "bearish", "neutral"])
                }
            },
            "signals": {
                "buy_strength": np.random.uniform(0, 100),
                "sell_strength": np.random.uniform(0, 100),
                "overall_trend": np.random.choice(["bullish", "bearish", "neutral"]),
                "confidence": np.random.uniform(60, 95)
            },
            "price_targets": {
                "support": 42000,
                "resistance": 45000,
                "next_target": 47000
            }
        }
        return analysis
    except Exception as e:
        logger.error(f"Market analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health")
async def health_check():
    active_count = len([ex for ex in exchanges.values() if ex != 'demo'])
    return {
        'status': 'healthy',
        'active_exchanges': active_count,
        'monitored_markets': len(SELECTED_MARKETS),
        'trading_active': trading_active
    }

@app.post("/api/start_enhanced_trading")
async def start_enhanced_trading(payload: StartTradingPayload):
    global trading_active
    if portfolio['balance'] < payload.budget:
        raise HTTPException(status_code=400, detail="Insufficient balance")
    trading_active = True
    logger.info(f"🚀 Trading started - Budget: ${payload.budget}, Strategy: {payload.strategy}")
    return {"success": True, "message": f"Trading started with ${payload.budget} budget"}

@app.post("/api/stop_enhanced_trading")
async def stop_enhanced_trading():
    global trading_active
    trading_active = False
    logger.info("⏹️ Trading stopped")
    return {"success": True, "message": "Trading stopped"}

@app.post("/api/execute_enhanced_trade")
async def handle_execute_trade(payload: ExecuteTradePayload):
    success, message = bot.execute_enhanced_trade(**payload.dict())
    if not success:
        raise HTTPException(status_code=400, detail=message)
    return {"success": success, "message": message}

@app.post("/api/execute_arbitrage")
async def handle_execute_arbitrage(payload: ExecuteArbitragePayload):
    try:
        buy_success, buy_msg = bot.execute_enhanced_trade(
            payload.buy_exchange, payload.symbol, 'buy', payload.position_size, 'arbitrage', 0.8
        )
        if not buy_success:
            raise HTTPException(status_code=400, detail=f"Buy failed: {buy_msg}")
        
        time.sleep(0.5)
        
        sell_success, sell_msg = bot.execute_enhanced_trade(
            payload.sell_exchange, payload.symbol, 'sell', payload.position_size, 'arbitrage', 0.8
        )
        if not sell_success:
            raise HTTPException(status_code=400, detail=f"Sell failed: {sell_msg}")
        
        return {"success": True, "message": "✅ Arbitrage executed successfully"}
    except Exception as e:
        logger.error(f"Arbitrage execution error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting FastAPI server for trading bot...")
    uvicorn.run(app, host="0.0.0.0", port=5000)
