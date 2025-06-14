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

@app.route('/')
def index():
    """Main dashboard"""
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
                <button class="btn" onclick="getSignals()">🤖 Get AI Signals</button>
                <button class="btn" onclick="getStrategy()">📊 Strategy Recommendation</button>
            </div>
            
            <div id="output" style="background: #16213e; padding: 20px; border-radius: 8px; margin: 20px 0; height: 300px; overflow-y: auto;"></div>
        </div>
        
        <script>
            function updateOutput(message) {
                const output = document.getElementById('output');
                output.innerHTML += '<div>' + new Date().toLocaleTimeString() + ': ' + message + '</div>';
                output.scrollTop = output.scrollHeight;
            }
            
            function startTrading() {
                fetch('/api/start_enhanced_trading', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ budget: 1000, strategy: 'hybrid', risk_level: 'medium' })
                })
                .then(r => r.json())
                .then(data => updateOutput('🚀 ' + data.message));
            }
            
            function stopTrading() {
                fetch('/api/stop_enhanced_trading', { method: 'POST' })
                .then(r => r.json())
                .then(data => updateOutput('⏹️ ' + data.message));
            }
            
            function getSignals() {
                fetch('/api/ai_signals')
                .then(r => r.json())
                .then(data => {
                    updateOutput('🤖 AI Signals generated: ' + data.signals.length + ' signals');
                    data.signals.forEach(signal => {
                        updateOutput(`📊 ${signal.coin}: ${signal.direction.toUpperCase()} (${signal.confidence}% confidence)`);
                    });
                });
            }
            
            function getStrategy() {
                fetch('/api/strategy_recommendation')
                .then(r => r.json())
                .then(data => {
                    updateOutput('📊 Recommended: ' + data.recommended_strategy + ' (' + data.confidence + '% confidence)');
                    updateOutput('💡 Reason: ' + data.reason);
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
    """Get enhanced bot status"""
    try:
        # Get fresh data
        arbitrage_opportunities = exchange_manager.find_arbitrage_opportunities(SELECTED_MARKETS)
        ai_signals = signal_generator.generate_signals({}, SELECTED_MARKETS)
        
        return jsonify({
            'portfolio': portfolio,
            'ai_signals': ai_signals,
            'arbitrage_opportunities': arbitrage_opportunities[:5],
            'trading_active': trading_core.is_active,
            'connection_status': exchange_manager.get_connection_status()
        })
    except Exception as e:
        logger.error(f"Status endpoint error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/health')
def health_check():
    """Health check endpoint"""
    status = exchange_manager.get_connection_status()
    return jsonify({
        'status': 'healthy',
        'active_exchanges': status['active_exchanges'],
        'demo_exchanges': status['demo_exchanges'],
        'monitored_markets': len(SELECTED_MARKETS),
        'trading_active': trading_core.is_active
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

@app.route('/api/performance_summary')
def get_performance_summary():
    """Get comprehensive performance summary"""
    return jsonify(trading_core.get_performance_summary())

@app.route('/api/strategy_recommendation')
def get_strategy_recommendation():
    """Get AI strategy recommendation"""
    market_data = {
        'arbitrage_opportunities': exchange_manager.find_arbitrage_opportunities(SELECTED_MARKETS)
    }
    return jsonify(strategy_manager.recommend_strategy(market_data, portfolio))

@app.route('/api/ai_signals')
def get_ai_signals():
    """Get AI trading signals"""
    signals = signal_generator.generate_signals({}, SELECTED_MARKETS)
    return jsonify({
        'signals': signals,
        'performance': signal_generator.get_signal_performance()
    })

@app.route('/api/auto_mode', methods=['POST'])
def auto_mode():
    """Enable AI auto-strategy mode"""
    try:
        market_data = {
            'arbitrage_opportunities': exchange_manager.find_arbitrage_opportunities(SELECTED_MARKETS)
        }
        signals = signal_generator.generate_signals({}, SELECTED_MARKETS)
        
        trades = strategy_manager.execute_strategy('auto', market_data, signals)
        
        return jsonify({
            'success': True,
            'message': 'Auto mode activated',
            'recommended_trades': trades
        })
        
    except Exception as e:
        logger.error(f"Auto mode error: {e}")
        return jsonify({'success': False, 'message': str(e)})

@app.route('/api/execute_enhanced_trade', methods=['POST'])
def execute_enhanced_trade():
    """Execute enhanced trade"""
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
        
        if success:
            # Update portfolio
            if trade_result.get('profit', 0) > 0:
                portfolio['profit_live'] += trade_result['profit']
                portfolio['successful_trades'] += 1
            
            portfolio['total_trades'] += 1
            portfolio['win_rate'] = (portfolio['successful_trades'] / portfolio['total_trades']) * 100
        
        return jsonify({'success': success, 'message': message, 'trade': trade_result})
        
    except Exception as e:
        logger.error(f"Trade execution error: {e}")
        return jsonify({'success': False, 'message': str(e)})

@app.route('/api/send_notification', methods=['POST'])
def send_notification():
    """Send email notification"""
    try:
        data = request.json
        email = data.get('email')
        notification = data.get('notification')
        
        # Here you would integrate with an email service like SendGrid, Mailgun, etc.
        # For now, just log the notification
        logger.info(f"Email notification to {email}: {notification['title']}")
        
        return jsonify({'success': True, 'message': 'Notification sent'})
        
    except Exception as e:
        logger.error(f"Notification error: {e}")
        return jsonify({'success': False, 'message': str(e)})

@app.route('/api/auto_mode_status')
def get_auto_mode_status():
    """Get auto mode status and decision history"""
    # Mock data - replace with real implementation
    decisions = [
        {
            'timestamp': datetime.now().isoformat(),
            'recommended_strategy': 'arbitrage',
            'confidence': 85,
            'reasoning': 'Hög spread upptäckt mellan Binance och KuCoin för BTC/USDT',
            'market_conditions': {
                'volatility': 0.3,
                'trend_strength': 0.7,
                'arbitrage_opportunities': 3,
                'ai_signal_strength': 0.6
            },
            'action_taken': 'Executed arbitrage trade for $500',
            'result': {
                'profit': 12.50,
                'success': True
            }
        }
    ]
    
    return jsonify({
        'active': trading_core.is_active,
        'current_strategy': 'arbitrage',
        'decisions': decisions
    })

if __name__ == '__main__':
    logger.info("🚀 Starting Enhanced Trading Bot Server")
    app.run(debug=True, host='0.0.0.0', port=5000)
