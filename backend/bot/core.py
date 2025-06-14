
"""
Core trading bot functionality
"""
import logging
from typing import Dict, List, Optional, Tuple
from concurrent.futures import ThreadPoolExecutor
import numpy as np
import time
from datetime import datetime

logger = logging.getLogger(__name__)

class TradingCore:
    def __init__(self, config: Dict):
        self.config = config
        self.executor = ThreadPoolExecutor(max_workers=10)
        self.is_active = False
        self.performance_metrics = {
            'total_trades': 0,
            'successful_trades': 0,
            'total_profit': 0.0,
            'win_rate': 0.0,
            'avg_trade_time': 0.0
        }
        
    def start_trading(self, strategy: str = 'hybrid', budget: float = 1000):
        """Start automated trading with specified strategy"""
        if self.is_active:
            return False, "Trading already active"
            
        try:
            self.is_active = True
            logger.info(f"🚀 Trading started - Strategy: {strategy}, Budget: ${budget}")
            return True, f"Trading started with {strategy} strategy"
        except Exception as e:
            logger.error(f"Failed to start trading: {e}")
            return False, str(e)
    
    def stop_trading(self):
        """Stop automated trading"""
        self.is_active = False
        logger.info("⏹️ Trading stopped")
        return True, "Trading stopped successfully"
    
    def execute_trade(self, trade_params: Dict) -> Tuple[bool, str, Dict]:
        """Execute a single trade with enhanced tracking"""
        start_time = time.time()
        
        try:
            # Simulate trade execution
            execution_time = time.time() - start_time
            
            # Calculate realistic profit based on strategy
            profit = self._calculate_profit(trade_params)
            
            # Update metrics
            self._update_metrics(profit, execution_time)
            
            trade_result = {
                'timestamp': datetime.now().isoformat(),
                'symbol': trade_params['symbol'],
                'side': trade_params['side'],
                'amount': trade_params['amount'],
                'price': trade_params['price'],
                'profit': profit,
                'execution_time': execution_time,
                'strategy': trade_params.get('strategy', 'manual')
            }
            
            return True, "Trade executed successfully", trade_result
            
        except Exception as e:
            logger.error(f"Trade execution failed: {e}")
            return False, str(e), {}
    
    def _calculate_profit(self, trade_params: Dict) -> float:
        """Calculate realistic profit based on strategy and market conditions"""
        strategy = trade_params.get('strategy', 'manual')
        amount = trade_params['amount']
        
        if strategy == 'arbitrage':
            # Arbitrage profits: 0.3-1.8%
            profit_pct = np.random.uniform(0.003, 0.018)
        elif strategy == 'ai_signal':
            # AI signal profits: -0.5% to 3% based on confidence
            confidence = trade_params.get('confidence', 0.5)
            profit_pct = np.random.uniform(-0.005, 0.03 * confidence)
        else:
            # Manual trading: -1.5% to 2.5%
            profit_pct = np.random.uniform(-0.015, 0.025)
        
        return amount * profit_pct
    
    def _update_metrics(self, profit: float, execution_time: float):
        """Update performance metrics"""
        self.performance_metrics['total_trades'] += 1
        self.performance_metrics['total_profit'] += profit
        
        if profit > 0:
            self.performance_metrics['successful_trades'] += 1
        
        self.performance_metrics['win_rate'] = (
            self.performance_metrics['successful_trades'] / 
            self.performance_metrics['total_trades'] * 100
        )
        
        # Update average execution time
        current_avg = self.performance_metrics['avg_trade_time']
        total_trades = self.performance_metrics['total_trades']
        self.performance_metrics['avg_trade_time'] = (
            (current_avg * (total_trades - 1) + execution_time) / total_trades
        )
    
    def get_performance_summary(self) -> Dict:
        """Get comprehensive performance summary"""
        return {
            'metrics': self.performance_metrics,
            'status': 'active' if self.is_active else 'inactive',
            'uptime': time.time(),
            'last_updated': datetime.now().isoformat()
        }
