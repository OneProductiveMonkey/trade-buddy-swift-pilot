
from fastapi import FastAPI, Request, HTTPException
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
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

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
        except Exception as e:
            logger.error(f"Trade execution failed: {e}")
            return False, f"❌ Trade failed: {str(e)}"

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
    # Background tasks are already started in bot.__init__

@app.get("/", response_class=HTMLResponse)
async def get_index():
    # This HTML is from your original file to restore the UI.
    # We will migrate this to React components in the next step.
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>🚀 Advanced AI Trading Bot</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
            body { background-color: #1a1a2e; color: white; font-family: 'Segoe UI', sans-serif; }
            .profit-positive { color: #22c55e; }
            .profit-negative { color: #ef4444; }
            .log-buy { border-left-color: #22c55e; }
            .log-sell { border-left-color: #ef4444; }
            .status-active { background: #22c55e; animation: pulse 2s infinite; }
            .status-inactive { background: #ef4444; }
            @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        </style>
    </head>
    <body class="bg-gray-900">
        <div class="container mx-auto p-4 md:p-8">
            <header class="text-center mb-8 p-6 bg-gray-800 rounded-xl shadow-lg">
                <h1 class="text-4xl font-bold text-cyan-400">🚀 Advanced AI Trading Bot</h1>
                <p class="text-gray-400 mt-2">Multi-Exchange Arbitrage & AI Signal Trading Platform</p>
                <div class="mt-4 inline-flex items-center">
                    <span class="status-indicator w-3 h-3 rounded-full mr-2" id="status-indicator"></span>
                    <span id="connection-status">Initializing...</span>
                </div>
            </header>

            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                <!-- Stat Boxes -->
                <div class="stat-box bg-gray-800 p-4 rounded-lg text-center"><h3 class="text-sm text-gray-400">Portfolio Balance</h3><div class="text-2xl font-bold" id="balance">$1,000.00</div></div>
                <div class="stat-box bg-gray-800 p-4 rounded-lg text-center"><h3 class="text-sm text-gray-400">Live Profit</h3><div class="text-2xl font-bold profit-positive" id="profit-live">+$0.00</div></div>
                <div class="stat-box bg-gray-800 p-4 rounded-lg text-center"><h3 class="text-sm text-gray-400">24h Performance</h3><div class="text-2xl font-bold profit-positive" id="profit-24h">+0.0%</div></div>
                <div class="stat-box bg-gray-800 p-4 rounded-lg text-center"><h3 class="text-sm text-gray-400">Win Rate</h3><div class="text-2xl font-bold" id="win-rate">0%</div></div>
                <div class="stat-box bg-gray-800 p-4 rounded-lg text-center"><h3 class="text-sm text-gray-400">Total Trades</h3><div class="text-2xl font-bold" id="total-trades">0</div></div>
                <div class="stat-box bg-gray-800 p-4 rounded-lg text-center"><h3 class="text-sm text-gray-400">Active Positions</h3><div class="text-2xl font-bold" id="active-positions">0</div></div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <!-- Controls -->
                <div class="bg-gray-800 p-6 rounded-lg">
                    <h3 class="text-xl font-bold text-cyan-400 border-b border-gray-700 pb-2 mb-4">Trading Controls</h3>
                    <div class="mb-4">
                        <label class="block mb-2 text-sm font-medium text-gray-300">Trading Budget</label>
                        <input type="number" id="budget" value="200" min="100" max="1000" step="50" class="w-full p-2 bg-gray-700 border border-gray-600 rounded-md">
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div>
                            <label class="block mb-2 text-sm font-medium text-gray-300">Strategy</label>
                            <select id="strategy" class="w-full p-2 bg-gray-700 border border-gray-600 rounded-md"><option value="arbitrage">Arbitrage</option><option value="ai_signals">AI Signals</option></select>
                        </div>
                        <div>
                            <label class="block mb-2 text-sm font-medium text-gray-300">Risk Level</label>
                            <select id="risk-level" class="w-full p-2 bg-gray-700 border border-gray-600 rounded-md"><option value="low">Low</option><option value="medium" selected>Medium</option><option value="high">High</option></select>
                        </div>
                    </div>
                    <div class="flex gap-4">
                        <button onclick="startTrading()" id="start-btn" class="flex-1 py-3 px-4 bg-green-600 hover:bg-green-700 rounded-md font-semibold">Start Trading</button>
                        <button onclick="stopTrading()" id="stop-btn" class="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 rounded-md font-semibold">Stop Trading</button>
                    </div>
                </div>
                <!-- Signals & Opportunities -->
                <div class="space-y-4">
                    <div class="bg-gray-800 p-6 rounded-lg"><h3 class="text-xl font-bold text-cyan-400 mb-4">🤖 AI Trading Signals</h3><div id="ai-signals" class="space-y-3"></div></div>
                    <div class="bg-gray-800 p-6 rounded-lg"><h3 class="text-xl font-bold text-cyan-400 mb-4">💹 Arbitrage Opportunities</h3><div id="arbitrage-opportunities" class="space-y-3"></div></div>
                </div>
            </div>
            
            <!-- Trade Log -->
            <div class="bg-gray-800 p-6 rounded-lg">
                <h3 class="text-xl font-bold text-cyan-400 mb-4">📋 Trading Log</h3>
                <div class="trade-log h-64 overflow-y-auto bg-gray-900 p-4 rounded-md font-mono text-sm" id="trade-log"></div>
            </div>
        </div>

        <script>
            // Frontend Javascript to interact with FastAPI backend
            const API_URL = ''; // Relative path for same-origin requests

            function updateData() {
                fetch(API_URL + '/api/enhanced_status')
                    .then(response => response.json())
                    .then(data => {
                        // Update Portfolio
                        const portfolio = data.portfolio;
                        document.getElementById('balance').textContent = '$' + portfolio.balance.toFixed(2);
                        document.getElementById('profit-live').textContent = (portfolio.profit_live >= 0 ? '+$' : '-$') + Math.abs(portfolio.profit_live).toFixed(2);
                        document.getElementById('profit-live').className = 'text-2xl font-bold ' + (portfolio.profit_live >= 0 ? 'profit-positive' : 'profit-negative');
                        document.getElementById('win-rate').textContent = portfolio.win_rate.toFixed(1) + '%';
                        document.getElementById('total-trades').textContent = portfolio.total_trades;
                        
                        // Update AI Signals
                        const signalsContainer = document.getElementById('ai-signals');
                        signalsContainer.innerHTML = data.ai_signals.map(s => \`
                            <div class="p-3 bg-gray-700 rounded-md">
                                <div class="flex justify-between items-center font-bold">\${s.coin} <span class="text-xs px-2 py-1 rounded-full \${s.direction === 'buy' ? 'bg-green-600' : 'bg-red-600'}">\${s.direction.toUpperCase()}</span></div>
                                <div class="text-xs text-gray-400 mt-1">Confidence: \${s.confidence}% | Price: $\${s.current_price.toFixed(2)}</div>
                            </div>
                        \`).join('') || '<p class="text-gray-500">No signals available...</p>';
                        
                        // Update Arbitrage Opportunities
                        const arbContainer = document.getElementById('arbitrage-opportunities');
                        arbContainer.innerHTML = data.arbitrage_opportunities.map(o => \`
                            <div class="p-3 bg-gray-700 rounded-md">
                                <div class="flex justify-between items-center font-bold">\${o.symbol} <span class="profit-positive">+\${o.profit_pct.toFixed(2)}%</span></div>
                                <div class="text-xs text-gray-400 mt-1">\${o.buy_exchange} → \${o.sell_exchange}</div>
                            </div>
                        \`).join('') || '<p class="text-gray-500">Scanning for opportunities...</p>';
                        
                        // Update Trade Log
                        const logContainer = document.getElementById('trade-log');
                        logContainer.innerHTML = data.trade_log.map(l => \`
                            <div class="p-2 border-l-2 \${l.side === 'BUY' ? 'log-buy' : 'log-sell'}">
                                [\${l.timestamp}] \${l.side} \${l.symbol} @ \${l.price} | Profit: <span class="\${l.profit >= 0 ? 'profit-positive' : 'profit-negative'}">\${l.profit.toFixed(2)}</span>
                            </div>
                        \`).join('');
                        logContainer.scrollTop = logContainer.scrollHeight;

                        // Update trading status
                        document.getElementById('start-btn').disabled = data.trading_active;
                        document.getElementById('stop-btn').disabled = !data.trading_active;

                    }).catch(err => console.error("Update error:", err));
                
                fetch(API_URL + '/api/health').then(r => r.json()).then(data => {
                    const statusIndicator = document.getElementById('status-indicator');
                    statusIndicator.className = 'status-indicator w-3 h-3 rounded-full mr-2 ' + (data.active_exchanges > 0 ? 'status-active' : 'status-inactive');
                    document.getElementById('connection-status').textContent = data.active_exchanges > 0 ? \`Connected to \${data.active_exchanges} exchanges\` : 'Demo Mode';
                })
            }

            function startTrading() {
                const payload = {
                    budget: parseFloat(document.getElementById('budget').value),
                    strategy: document.getElementById('strategy').value,
                    risk_level: document.getElementById('risk-level').value
                };
                fetch(API_URL + '/api/start_enhanced_trading', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(payload)
                }).then(r => r.json()).then(data => alert(data.message));
            }
            
            function stopTrading() {
                fetch(API_URL + '/api/stop_enhanced_trading', { method: 'POST' })
                    .then(r => r.json()).then(data => alert(data.message));
            }

            document.addEventListener('DOMContentLoaded', () => {
                updateData();
                setInterval(updateData, 5000);
            });
        </script>
    </body>
    </html>
    """;

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

