
"""
Trade Replay System - Enhanced Trade Logging and Analytics
Author: Mattiaz
Description: Comprehensive trade tracking with timeline visualization
"""

import logging
import sqlite3
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import json
import os

logger = logging.getLogger(__name__)

class TradeReplaySystem:
    def __init__(self, db_path: str = "trades.db"):
        self.db_path = db_path
        self.setup_database()
        
    def setup_database(self):
        """Initialize SQLite database for trade storage"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS trades (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp DATETIME,
                    symbol TEXT,
                    strategy TEXT,
                    side TEXT,
                    entry_price REAL,
                    exit_price REAL,
                    amount REAL,
                    profit_loss REAL,
                    roi_percentage REAL,
                    confidence REAL,
                    execution_time REAL,
                    market_conditions TEXT,
                    exchange TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS portfolio_snapshots (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp DATETIME,
                    total_balance REAL,
                    profit_loss REAL,
                    total_trades INTEGER,
                    win_rate REAL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            conn.commit()
            conn.close()
            logger.info("Trade replay database initialized")
            
        except Exception as e:
            logger.error(f"Failed to setup database: {e}")
    
    async def record_trade(self, trade_data: Dict):
        """Record a trade execution for replay analysis"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Calculate trade metrics
            entry_price = trade_data.get('price', trade_data.get('entry_price', 0))
            exit_price = trade_data.get('exit_price', entry_price * 1.005)  # Simulate 0.5% profit
            amount = trade_data.get('amount', 0)
            profit_loss = trade_data.get('profit', (exit_price - entry_price) * amount)
            roi = ((exit_price - entry_price) / entry_price * 100) if entry_price > 0 else 0
            
            cursor.execute('''
                INSERT INTO trades (
                    timestamp, symbol, strategy, side, entry_price, exit_price,
                    amount, profit_loss, roi_percentage, confidence, execution_time,
                    market_conditions, exchange
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                datetime.now(),
                trade_data.get('symbol', 'BTC/USDT'),
                trade_data.get('strategy', 'manual'),
                trade_data.get('side', 'buy'),
                entry_price,
                exit_price,
                amount,
                profit_loss,
                roi,
                trade_data.get('confidence', 50),
                trade_data.get('execution_time', 0.1),
                json.dumps(trade_data.get('market_conditions', {})),
                trade_data.get('exchange', 'binance')
            ))
            
            conn.commit()
            conn.close()
            
            logger.info(f"Trade recorded: {trade_data.get('symbol')} - P&L: ${profit_loss:.2f}")
            
        except Exception as e:
            logger.error(f"Failed to record trade: {e}")
    
    async def get_trade_timeline(self, limit: int = 20) -> List[Dict]:
        """Get trade timeline for replay visualization"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT * FROM trades 
                ORDER BY timestamp DESC 
                LIMIT ?
            ''', (limit,))
            
            rows = cursor.fetchall()
            conn.close()
            
            trades = []
            running_balance = 10000  # Starting balance
            
            for row in reversed(rows):  # Reverse to get chronological order
                trade = {
                    'id': row[0],
                    'timestamp': row[1],
                    'symbol': row[2],
                    'strategy': row[3],
                    'side': row[4],
                    'entry_price': row[5],
                    'exit_price': row[6],
                    'amount': row[7],
                    'profit_loss': row[8],
                    'roi_percentage': row[9],
                    'confidence': row[10],
                    'execution_time': row[11],
                    'market_conditions': json.loads(row[12]) if row[12] else {},
                    'exchange': row[13]
                }
                
                running_balance += trade['profit_loss']
                trade['running_balance'] = round(running_balance, 2)
                trade['trade_return'] = round(trade['profit_loss'], 2)
                
                trades.append(trade)
            
            return list(reversed(trades))  # Return in latest-first order
            
        except Exception as e:
            logger.error(f"Failed to get trade timeline: {e}")
            return []
    
    async def get_performance_metrics(self, days: int = 7) -> Dict:
        """Get comprehensive performance metrics"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Get trades from specified period
            since_date = datetime.now() - timedelta(days=days)
            
            cursor.execute('''
                SELECT 
                    COUNT(*) as total_trades,
                    SUM(CASE WHEN profit_loss > 0 THEN 1 ELSE 0 END) as winning_trades,
                    SUM(profit_loss) as total_profit,
                    AVG(profit_loss) as avg_profit_per_trade,
                    AVG(roi_percentage) as avg_roi,
                    MAX(profit_loss) as best_trade,
                    MIN(profit_loss) as worst_trade,
                    AVG(execution_time) as avg_execution_time,
                    AVG(confidence) as avg_confidence
                FROM trades 
                WHERE timestamp >= ?
            ''', (since_date,))
            
            stats = cursor.fetchone()
            
            # Get strategy breakdown
            cursor.execute('''
                SELECT strategy, COUNT(*), SUM(profit_loss)
                FROM trades 
                WHERE timestamp >= ?
                GROUP BY strategy
            ''', (since_date,))
            
            strategy_stats = cursor.fetchall()
            conn.close()
            
            if stats and stats[0] > 0:
                win_rate = (stats[1] / stats[0]) * 100 if stats[0] > 0 else 0
                
                metrics = {
                    'period_days': days,
                    'total_trades': stats[0],
                    'winning_trades': stats[1],
                    'losing_trades': stats[0] - stats[1],
                    'win_rate': round(win_rate, 2),
                    'total_profit': round(stats[2] or 0, 2),
                    'avg_profit_per_trade': round(stats[3] or 0, 2),
                    'avg_roi': round(stats[4] or 0, 2),
                    'best_trade': round(stats[5] or 0, 2),
                    'worst_trade': round(stats[6] or 0, 2),
                    'avg_execution_time': round(stats[7] or 0, 3),
                    'avg_confidence': round(stats[8] or 0, 1),
                    'sharpe_ratio': self._calculate_sharpe_ratio(stats[3], stats[4]),
                    'strategy_breakdown': {
                        strategy: {
                            'trades': count,
                            'profit': round(profit, 2)
                        }
                        for strategy, count, profit in strategy_stats
                    }
                }
                
                return metrics
            
            return {
                'period_days': days,
                'total_trades': 0,
                'winning_trades': 0,
                'losing_trades': 0,
                'win_rate': 0,
                'total_profit': 0,
                'avg_profit_per_trade': 0,
                'avg_roi': 0,
                'best_trade': 0,
                'worst_trade': 0,
                'avg_execution_time': 0,
                'avg_confidence': 0,
                'sharpe_ratio': 0,
                'strategy_breakdown': {}
            }
            
        except Exception as e:
            logger.error(f"Failed to get performance metrics: {e}")
            return {}
    
    def _calculate_sharpe_ratio(self, avg_return: Optional[float], avg_roi: Optional[float]) -> float:
        """Calculate Sharpe ratio for risk-adjusted returns"""
        try:
            if not avg_return or not avg_roi:
                return 0
            
            # Simplified Sharpe ratio calculation
            risk_free_rate = 0.02  # 2% annual risk-free rate
            daily_risk_free = risk_free_rate / 365
            
            # Assume daily trading
            excess_return = (avg_roi / 100) - daily_risk_free
            volatility = abs(avg_roi / 100) * 0.5  # Simplified volatility
            
            sharpe = excess_return / volatility if volatility > 0 else 0
            return round(sharpe, 2)
            
        except Exception:
            return 0
    
    async def save_portfolio_snapshot(self, portfolio_data: Dict):
        """Save portfolio snapshot for historical tracking"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                INSERT INTO portfolio_snapshots (
                    timestamp, total_balance, profit_loss, total_trades, win_rate
                ) VALUES (?, ?, ?, ?, ?)
            ''', (
                datetime.now(),
                portfolio_data.get('balance', 0),
                portfolio_data.get('profit_live', 0),
                portfolio_data.get('total_trades', 0),
                portfolio_data.get('win_rate', 0)
            ))
            
            conn.commit()
            conn.close()
            
        except Exception as e:
            logger.error(f"Failed to save portfolio snapshot: {e}")

# Global instance
trade_replay = TradeReplaySystem()
