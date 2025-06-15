
"""
Trade Replay System for Analytics
"""
import logging
import sqlite3
from datetime import datetime, timedelta
from typing import List, Dict
import json

logger = logging.getLogger(__name__)

class TradeReplaySystem:
    def __init__(self, db_path='trading_bot.db'):
        self.db_path = db_path
        self.setup_replay_tables()
    
    def setup_replay_tables(self):
        """Setup database tables for trade replay"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Enhanced trade replay table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS trade_replay (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp DATETIME,
                    symbol TEXT,
                    side TEXT,
                    entry_price REAL,
                    exit_price REAL,
                    amount REAL,
                    profit_loss REAL,
                    roi_percentage REAL,
                    strategy TEXT,
                    exchange TEXT,
                    confidence REAL,
                    execution_time REAL,
                    market_conditions TEXT
                )
            ''')
            
            conn.commit()
            conn.close()
            logger.info("Trade replay tables initialized")
            
        except Exception as e:
            logger.error(f"Failed to setup replay tables: {e}")
    
    def record_trade(self, trade_data: Dict):
        """Record a trade for replay analysis"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Calculate ROI
            entry_price = trade_data.get('entry_price', trade_data.get('price', 0))
            exit_price = trade_data.get('exit_price', entry_price * 1.005)  # Simulate 0.5% profit
            roi = ((exit_price - entry_price) / entry_price) * 100 if entry_price > 0 else 0
            
            cursor.execute('''
                INSERT INTO trade_replay (
                    timestamp, symbol, side, entry_price, exit_price, amount,
                    profit_loss, roi_percentage, strategy, exchange, confidence,
                    execution_time, market_conditions
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                datetime.now(),
                trade_data.get('symbol', 'BTC/USDT'),
                trade_data.get('side', 'buy'),
                entry_price,
                exit_price,
                trade_data.get('amount', 0),
                trade_data.get('profit', (exit_price - entry_price) * trade_data.get('amount', 0)),
                roi,
                trade_data.get('strategy', 'manual'),
                trade_data.get('exchange', 'binance'),
                trade_data.get('confidence', 0.5),
                trade_data.get('execution_time', 0.1),
                json.dumps(trade_data.get('market_conditions', {}))
            ))
            
            conn.commit()
            conn.close()
            
        except Exception as e:
            logger.error(f"Failed to record trade for replay: {e}")
    
    def get_recent_trades(self, limit: int = 10) -> List[Dict]:
        """Get recent trades for replay"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT * FROM trade_replay 
                ORDER BY timestamp DESC 
                LIMIT ?
            ''', (limit,))
            
            rows = cursor.fetchall()
            conn.close()
            
            # Convert to dict format
            trades = []
            for row in rows:
                trade = {
                    'id': row[0],
                    'timestamp': row[1],
                    'symbol': row[2],
                    'side': row[3],
                    'entry_price': row[4],
                    'exit_price': row[5],
                    'amount': row[6],
                    'profit_loss': row[7],
                    'roi_percentage': row[8],
                    'strategy': row[9],
                    'exchange': row[10],
                    'confidence': row[11],
                    'execution_time': row[12],
                    'market_conditions': json.loads(row[13]) if row[13] else {}
                }
                trades.append(trade)
            
            return trades
            
        except Exception as e:
            logger.error(f"Failed to get recent trades: {e}")
            return []
    
    def get_trade_statistics(self) -> Dict:
        """Get overall trade statistics"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Get basic stats
            cursor.execute('''
                SELECT 
                    COUNT(*) as total_trades,
                    SUM(CASE WHEN profit_loss > 0 THEN 1 ELSE 0 END) as winning_trades,
                    AVG(roi_percentage) as avg_roi,
                    SUM(profit_loss) as total_profit,
                    MAX(roi_percentage) as best_trade,
                    MIN(roi_percentage) as worst_trade,
                    AVG(execution_time) as avg_execution_time
                FROM trade_replay
                WHERE timestamp >= datetime('now', '-7 days')
            ''')
            
            stats = cursor.fetchone()
            conn.close()
            
            if stats and stats[0] > 0:
                return {
                    'total_trades': stats[0],
                    'winning_trades': stats[1],
                    'win_rate': (stats[1] / stats[0]) * 100,
                    'avg_roi': round(stats[2] or 0, 2),
                    'total_profit': round(stats[3] or 0, 2),
                    'best_trade': round(stats[4] or 0, 2),
                    'worst_trade': round(stats[5] or 0, 2),
                    'avg_execution_time': round(stats[6] or 0, 3)
                }
            
            return {
                'total_trades': 0,
                'winning_trades': 0,
                'win_rate': 0,
                'avg_roi': 0,
                'total_profit': 0,
                'best_trade': 0,
                'worst_trade': 0,
                'avg_execution_time': 0
            }
            
        except Exception as e:
            logger.error(f"Failed to get trade statistics: {e}")
            return {}

# Global instance
trade_replay_system = TradeReplaySystem()
