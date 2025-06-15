
"""
Enhanced Flask application with modular structure
"""
from flask import Flask, jsonify, request, render_template_string
from flask_cors import CORS
import logging
from datetime import datetime
import os

# Import bot modules
from bot.core import TradingCore
from bot.exchanges import ExchangeManager
from bot.signals import AISignalGenerator
from bot.strategy import StrategyManager
from bot.auto_mode import auto_mode_engine
from bot.trade_replay import trade_replay_system
from bot.meme_radar import meme_radar

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Initialize bot components
config = {'api_keys': {}}
trading_core = TradingCore(config)
exchange_manager = ExchangeManager()
signal_generator = AISignalGenerator()
strategy_manager = StrategyManager()

# Global state
portfolio = {
    'balance': 10000,
    'profit_live': 0,
    'profit_24h': 0,
    'total_trades': 0,
    'successful_trades': 0,
    'win_rate': 0
}

SELECTED_MARKETS = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT']
SANDBOX_MODE = os.getenv('SANDBOX_MODE', 'true').lower() == 'true'

@app.route('/')
def index():
    # ... keep existing code (HTML template) the same ...
    return render_template_string('''
    <!DOCTYPE html>
    <html>
    <head>
        <title>🚀 Advanced AI Trading Bot</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #1a1a2e; color: white; }
            .container { max-width: 1200px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 30px; }
            .header h1 { color: #00d4ff; margin-bottom: 10px; }
            .status { display: flex; justify-content: space-between; margin: 20px 0; }
            .status-item { background: #16213e; padding: 15px; border-radius: 8px; flex: 1; margin: 0 10px; text-align: center; }
            .controls { background: #16213e; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .btn { background: #00d4ff; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin: 5px; }
            .btn:hover { background: #0099cc; }
            .stop { background: #ff4757; }
            .stop:hover { background: #ff3742; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🚀 Advanced AI Trading Bot</h1>
                <p>Multi-Exchange Arbitrage & AI Signal Trading Platform</p>
                <div id="mode-indicator" style="margin-top: 10px; padding: 5px 10px; border-radius: 5px; background: #ff9500;">
                    🧪 SANDBOX MODE
                </div>
            </div>
            
            <div class="status">
                <div class="status-item">
                    <h3>💰 Balance</h3>
                    <div id="balance">$10,000</div>
                </div>
                <div class="status-item">
                    <h3>📈 Profit</h3>
                    <div id="profit">$0</div>
                </div>
                <div class="status-item">
                    <h3>🏆 Win Rate</h3>
                    <div id="winrate">0%</div>
                </div>
                <div class="status-item">
                    <h3>🔄 Trades</h3>
                    <div id="trades">0</div>
                </div>
            </div>
            
            <div class="controls">
                <h3>Trading Controls</h3>
                <button class="btn" onclick="startTrading()">🚀 Start Trading</button>
                <button class="btn stop" onclick="stopTrading()">⏹️ Stop Trading</button>
                <button class="btn" onclick="getAutoMode()">🤖 Auto Mode Status</button>
                <button class="btn" onclick="getTradeReplay()">📊 Trade Replay</button>
                <button class="btn" onclick="getMemeRadar()">🔥 Meme Radar</button>
            </div>
            
            <div id="output" style="background: #16213e; padding: 20px; border-radius: 8px; margin: 20px 0; height: 400px; overflow-y: auto;"></div>
        </div>
        
        <script>
            function updateOutput(message) {
                const output = document.getElementById('output');
                output.innerHTML += '<div style="margin-bottom: 5px; padding: 5px; border-left: 3px solid #00d4ff;">' + new Date().toLocaleTimeString() + ': ' + message + '</div>';
                output.scrollTop = output.scrollHeight;
            }
            
            function startTrading() {
                fetch('/api/start_enhanced_trading', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ budget: 1000, strategy: 'auto', risk_level: 'medium' })
                })
                .then(r => r.json())
                .then(data => updateOutput('🚀 ' + data.message));
            }
            
            function stopTrading() {
                fetch('/api/stop_enhanced_trading', { method: 'POST' })
                .then(r => r.json())
                .then(data => updateOutput('⏹️ ' + data.message));
            }
            
            function getAutoMode() {
                fetch('/api/auto_mode_status')
                .then(r => r.json())
                .then(data => {
                    updateOutput('🤖 Auto Mode: ' + (data.active ? 'ACTIVE' : 'INACTIVE'));
                    if (data.current_strategy) {
                        updateOutput('📊 Current Strategy: ' + data.current_strategy.toUpperCase() + ' (' + data.confidence + '% confidence)');
                        if (data.decisions && data.decisions.length > 0) {
                            updateOutput('💡 Latest: ' + data.decisions[0].rationale);
                        }
                    }
                });
            }
            
            function getTradeReplay() {
                fetch('/api/trade_replay')
                .then(r => r.json())
                .then(data => {
                    updateOutput('📊 Trade Replay - Last ' + data.trades.length + ' trades loaded');
                    data.trades.forEach((trade, i) => {
                        const profit = trade.profit_loss > 0 ? '+$' + trade.profit_loss.toFixed(2) : '-$' + Math.abs(trade.profit_loss).toFixed(2);
                        updateOutput(`${i+1}. ${trade.symbol} ${trade.side.toUpperCase()} - ${profit} (${trade.roi_percentage.toFixed(2)}% ROI)`);
                    });
                });
            }
            
            function getMemeRadar() {
                fetch('/api/meme_radar')
                .then(r => r.json())
                .then(data => {
                    updateOutput('🔥 Meme Radar - ' + data.meme_candidates.length + ' candidates found');
                    data.meme_candidates.slice(0, 5).forEach((coin, i) => {
                        updateOutput(`${i+1}. ${coin.name} (${coin.symbol}) - ${coin.pump_potential}% pump potential`);
                    });
                });
            }
            
            // Auto-update every 5 seconds
            setInterval(() => {
                fetch('/api/enhanced_status')
                .then(r => r.json())
                .then(data => {
                    document.getElementById('balance').textContent = '$' + data.portfolio.balance.toLocaleString();
                    document.getElementById('profit').textContent = '$' + data.portfolio.profit_live.toFixed(2);
                    document.getElementById('winrate').textContent = data.portfolio.win_rate.toFixed(1) + '%';
                    document.getElementById('trades').textContent = data.portfolio.total_trades;
                });
            }, 5000);
        </script>
    </body>
    </html>
    ''')

@app.route('/api/enhanced_status')
def get_enhanced_status():
    # ... keep existing code the same ...
    try:
        arbitrage_opportunities = exchange_manager.find_arbitrage_opportunities(SELECTED_MARKETS)
        ai_signals = signal_generator.generate_signals({}, SELECTED_MARKETS)
        
        return jsonify({
            'portfolio': portfolio,
            'ai_signals': ai_signals,
            'arbitrage_opportunities': arbitrage_opportunities[:5],
            'trading_active': trading_core.is_active,
            'connection_status': exchange_manager.get_connection_status(),
            'sandbox_mode': SANDBOX_MODE
        })
    except Exception as e:
        logger.error(f"Status endpoint error: {e}")
        return jsonify({'error': str(e)}), 500

# NEW AUTO MODE ENDPOINTS
@app.route('/api/auto_mode_status')
def get_auto_mode_status():
    """Enhanced auto mode status with AI decision data"""
    try:
        # Get market data for analysis
        market_data = {
            'arbitrage_opportunities': exchange_manager.find_arbitrage_opportunities(SELECTED_MARKETS),
            'ai_signals': signal_generator.generate_signals({}, SELECTED_MARKETS)
        }
        
        # Analyze market conditions
        market_conditions = auto_mode_engine.analyze_market_conditions(market_data)
        
        # Get AI strategy decision
        strategy, confidence, rationale = auto_mode_engine.decide_strategy(market_conditions, portfolio)
        
        return jsonify({
            'active': trading_core.is_active,
            'current_strategy': strategy,
            'confidence': confidence,
            'rationale': rationale,
            'market_conditions': market_conditions,
            'decisions': auto_mode_engine.decision_history[-10:],
            'sandbox_mode': SANDBOX_MODE
        })
        
    except Exception as e:
        logger.error(f"Auto mode status error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/auto_mode', methods=['POST'])
def activate_auto_mode():
    """Activate AI auto-strategy mode with enhanced decision making"""
    try:
        market_data = {
            'arbitrage_opportunities': exchange_manager.find_arbitrage_opportunities(SELECTED_MARKETS),
            'ai_signals': signal_generator.generate_signals({}, SELECTED_MARKETS)
        }
        
        # Get market analysis
        market_conditions = auto_mode_engine.analyze_market_conditions(market_data)
        strategy, confidence, rationale = auto_mode_engine.decide_strategy(market_conditions, portfolio)
        
        # Execute recommended strategy
        trades = strategy_manager.execute_strategy(strategy, market_data, market_data['ai_signals'])
        
        return jsonify({
            'success': True,
            'message': f'Auto mode activated with {strategy} strategy',
            'strategy': strategy,
            'confidence': confidence,
            'rationale': rationale,
            'recommended_trades': trades,
            'market_conditions': market_conditions
        })
        
    except Exception as e:
        logger.error(f"Auto mode activation error: {e}")
        return jsonify({'success': False, 'message': str(e)})

# NEW TRADE REPLAY ENDPOINTS
@app.route('/api/trade_replay')
def get_trade_replay():
    """Get trade replay data for visualization"""
    try:
        trades = trade_replay_system.get_recent_trades(20)
        stats = trade_replay_system.get_trade_statistics()
        
        return jsonify({
            'trades': trades,
            'statistics': stats,
            'total_count': len(trades),
            'sandbox_mode': SANDBOX_MODE
        })
        
    except Exception as e:
        logger.error(f"Trade replay error: {e}")
        return jsonify({'error': str(e)}), 500

# NEW MEME RADAR ENDPOINTS
@app.route('/api/meme_radar')
def get_meme_radar():
    """Get meme coin radar analysis"""
    try:
        radar_data = meme_radar.get_meme_radar_data()
        
        return jsonify({
            'success': True,
            'data': radar_data,
            'sandbox_mode': SANDBOX_MODE,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Meme radar error: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'data': {
                'meme_candidates': [],
                'top_gainers': [],
                'volume_leaders': []
            }
        })

# ENHANCED TRADE EXECUTION
@app.route('/api/execute_enhanced_trade', methods=['POST'])
def execute_enhanced_trade():
    """Execute enhanced trade with replay recording"""
    try:
        data = request.json
        
        trade_params = {
            'symbol': data['symbol'],
            'side': data['side'],
            'amount': data['amount_usd'],
            'price': 100,  # Simulated price
            'strategy': data.get('strategy', 'manual'),
            'confidence': data.get('confidence', 0.5)
        }
        
        success, message, trade_result = trading_core.execute_trade(trade_params)
        
        # Record trade for replay
        if success:
            trade_replay_system.record_trade(trade_result)
            
            # Update portfolio
            if trade_result.get('profit', 0) > 0:
                portfolio['profit_live'] += trade_result['profit']
                portfolio['successful_trades'] += 1
            
            portfolio['total_trades'] += 1
            portfolio['win_rate'] = (portfolio['successful_trades'] / portfolio['total_trades']) * 100
        
        return jsonify({
            'success': success, 
            'message': message, 
            'trade': trade_result,
            'sandbox_mode': SANDBOX_MODE
        })
        
    except Exception as e:
        logger.error(f"Trade execution error: {e}")
        return jsonify({'success': False, 'message': str(e)})

# ... keep existing code (health, start_trading, stop_trading, etc.) the same ...

@app.route('/api/health')
def health_check():
    """Health check endpoint"""
    status = exchange_manager.get_connection_status()
    return jsonify({
        'status': 'healthy',
        'active_exchanges': status['active_exchanges'],
        'demo_exchanges': status['demo_exchanges'],
        'monitored_markets': len(SELECTED_MARKETS),
        'trading_active': trading_core.is_active,
        'sandbox_mode': SANDBOX_MODE
    })

@app.route('/api/start_enhanced_trading', methods=['POST'])
def start_enhanced_trading():
    """Start enhanced trading"""
    try:
        data = request.json or {}
        budget = data.get('budget', 1000)
        strategy = data.get('strategy', 'hybrid')
        
        success, message = trading_core.start_trading(strategy, budget)
        return jsonify({'success': success, 'message': message})
        
    except Exception as e:
        logger.error(f"Start trading error: {e}")
        return jsonify({'success': False, 'message': str(e)})

@app.route('/api/stop_enhanced_trading', methods=['POST'])
def stop_enhanced_trading():
    """Stop enhanced trading"""
    success, message = trading_core.stop_trading()
    return jsonify({'success': success, 'message': message})

if __name__ == '__main__':
    logger.info("🚀 Starting Enhanced Trading Bot Server")
    logger.info(f"🧪 Sandbox Mode: {SANDBOX_MODE}")
    app.run(debug=True, host='0.0.0.0', port=5000)
