
"""
Trading Bot Engine - Core Logic
Author: Mattiaz
Description: Modular trading engine with async support and strategy management
"""

import asyncio
import logging
import time
from datetime import datetime
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from enum import Enum

logger = logging.getLogger(__name__)

class TradingMode(Enum):
    MANUAL = "manual"
    AUTO = "auto"
    SANDBOX = "sandbox"

class StrategyType(Enum):
    ARBITRAGE = "arbitrage"
    AI_SIGNALS = "ai_signals"
    HYBRID = "hybrid"

@dataclass
class TradeSignal:
    symbol: str
    direction: str  # buy/sell
    confidence: float
    price: float
    target_price: float
    strategy: StrategyType
    timestamp: datetime
    risk_level: str

@dataclass
class Portfolio:
    balance: float = 10000.0
    profit_live: float = 0.0
    profit_24h: float = 0.0
    total_trades: int = 0
    successful_trades: int = 0
    win_rate: float = 0.0
    active_positions: Dict[str, Any] = None

    def __post_init__(self):
        if self.active_positions is None:
            self.active_positions = {}

class BotEngine:
    def __init__(self):
        self.is_running = False
        self.mode = TradingMode.SANDBOX
        self.portfolio = Portfolio()
        self.active_strategies = [StrategyType.ARBITRAGE, StrategyType.AI_SIGNALS]
        self.trade_history = []
        self.current_signals = []
        self.market_data = {}
        self.last_update = datetime.now()
        
    async def start(self):
        """Start the trading engine"""
        if self.is_running:
            return False
            
        self.is_running = True
        logger.info("🚀 Trading Engine Started")
        
        # Start background tasks
        asyncio.create_task(self._price_monitor())
        asyncio.create_task(self._strategy_runner())
        asyncio.create_task(self._portfolio_updater())
        
        return True
    
    async def stop(self):
        """Stop the trading engine"""
        self.is_running = False
        logger.info("⏹️ Trading Engine Stopped")
        return True
    
    async def _price_monitor(self):
        """Background task to monitor prices"""
        while self.is_running:
            try:
                from .data import data_fetcher
                
                # Update market data
                self.market_data = await data_fetcher.get_all_prices()
                self.last_update = datetime.now()
                
                await asyncio.sleep(5)  # Update every 5 seconds
                
            except Exception as e:
                logger.error(f"Price monitor error: {e}")
                await asyncio.sleep(10)
    
    async def _strategy_runner(self):
        """Background task to run trading strategies"""
        while self.is_running:
            try:
                if self.mode == TradingMode.AUTO:
                    # Run AI strategy
                    if StrategyType.AI_SIGNALS in self.active_strategies:
                        await self._run_ai_strategy()
                    
                    # Run arbitrage
                    if StrategyType.ARBITRAGE in self.active_strategies:
                        await self._run_arbitrage_strategy()
                
                await asyncio.sleep(15)  # Run strategies every 15 seconds
                
            except Exception as e:
                logger.error(f"Strategy runner error: {e}")
                await asyncio.sleep(20)
    
    async def _portfolio_updater(self):
        """Background task to update portfolio metrics"""
        while self.is_running:
            try:
                # Calculate win rate
                if self.portfolio.total_trades > 0:
                    self.portfolio.win_rate = (self.portfolio.successful_trades / self.portfolio.total_trades) * 100
                
                # Update 24h profit (simulation)
                if len(self.trade_history) > 0:
                    recent_trades = [t for t in self.trade_history if (datetime.now() - t['timestamp']).total_seconds() < 86400]
                    self.portfolio.profit_24h = sum(t.get('profit', 0) for t in recent_trades)
                
                await asyncio.sleep(30)  # Update every 30 seconds
                
            except Exception as e:
                logger.error(f"Portfolio updater error: {e}")
                await asyncio.sleep(60)
    
    async def _run_ai_strategy(self):
        """Run AI-based trading strategy"""
        try:
            from strategies.ai import AIStrategy
            ai = AIStrategy()
            
            signals = await ai.generate_signals(self.market_data)
            
            for signal in signals:
                if signal.confidence > 75:  # High confidence threshold
                    await self._execute_signal(signal)
                    
        except Exception as e:
            logger.error(f"AI strategy error: {e}")
    
    async def _run_arbitrage_strategy(self):
        """Run arbitrage strategy"""
        try:
            from strategies.arbitrage import ArbitrageStrategy
            arb = ArbitrageStrategy()
            
            opportunities = await arb.find_opportunities(self.market_data)
            
            for opp in opportunities[:2]:  # Top 2 opportunities
                if opp.get('profit_pct', 0) > 0.5:  # 0.5% minimum profit
                    await self._execute_arbitrage(opp)
                    
        except Exception as e:
            logger.error(f"Arbitrage strategy error: {e}")
    
    async def _execute_signal(self, signal: TradeSignal):
        """Execute a trading signal"""
        try:
            if self.mode == TradingMode.SANDBOX:
                # Simulate trade
                profit = self._simulate_trade(signal)
                
                trade = {
                    'id': len(self.trade_history) + 1,
                    'timestamp': datetime.now(),
                    'symbol': signal.symbol,
                    'direction': signal.direction,
                    'price': signal.price,
                    'amount': 100,  # Fixed amount for demo
                    'profit': profit,
                    'strategy': signal.strategy.value,
                    'confidence': signal.confidence
                }
                
                self.trade_history.append(trade)
                self.portfolio.total_trades += 1
                
                if profit > 0:
                    self.portfolio.successful_trades += 1
                    self.portfolio.profit_live += profit
                
                logger.info(f"✅ Signal executed: {signal.symbol} {signal.direction} - Profit: ${profit:.2f}")
                
        except Exception as e:
            logger.error(f"Signal execution error: {e}")
    
    async def _execute_arbitrage(self, opportunity):
        """Execute arbitrage opportunity"""
        try:
            if self.mode == TradingMode.SANDBOX:
                profit = opportunity.get('profit_usd', 0)
                
                trade = {
                    'id': len(self.trade_history) + 1,
                    'timestamp': datetime.now(),
                    'symbol': opportunity.get('symbol', 'BTC/USDT'),
                    'direction': 'arbitrage',
                    'price': opportunity.get('avg_price', 0),
                    'amount': opportunity.get('position_size', 100),
                    'profit': profit,
                    'strategy': 'arbitrage',
                    'confidence': 85
                }
                
                self.trade_history.append(trade)
                self.portfolio.total_trades += 1
                
                if profit > 0:
                    self.portfolio.successful_trades += 1
                    self.portfolio.profit_live += profit
                
                logger.info(f"⚡ Arbitrage executed: {opportunity.get('symbol')} - Profit: ${profit:.2f}")
                
        except Exception as e:
            logger.error(f"Arbitrage execution error: {e}")
    
    def _simulate_trade(self, signal: TradeSignal) -> float:
        """Simulate trade execution and return profit"""
        # Simulate realistic profit based on confidence and market conditions
        base_profit = 100 * (signal.confidence / 100)
        variance = base_profit * 0.3  # 30% variance
        
        import random
        profit = base_profit + random.uniform(-variance, variance)
        
        # Higher confidence = better chance of profit
        if signal.confidence > 80:
            profit *= 1.2
        elif signal.confidence < 60:
            profit *= 0.7
        
        return round(profit, 2)
    
    def get_status(self) -> Dict[str, Any]:
        """Get current bot status"""
        return {
            'is_running': self.is_running,
            'mode': self.mode.value,
            'portfolio': {
                'balance': self.portfolio.balance,
                'profit_live': self.portfolio.profit_live,
                'profit_24h': self.portfolio.profit_24h,
                'total_trades': self.portfolio.total_trades,
                'win_rate': self.portfolio.win_rate,
                'active_positions': len(self.portfolio.active_positions)
            },
            'active_strategies': [s.value for s in self.active_strategies],
            'last_update': self.last_update.isoformat(),
            'market_data_count': len(self.market_data),
            'recent_signals': len(self.current_signals)
        }
    
    def set_mode(self, mode: str):
        """Set trading mode"""
        try:
            self.mode = TradingMode(mode)
            logger.info(f"Mode changed to: {mode}")
            return True
        except ValueError:
            logger.error(f"Invalid mode: {mode}")
            return False
    
    def get_trade_history(self, limit: int = 50) -> List[Dict]:
        """Get recent trade history"""
        return self.trade_history[-limit:]

# Global engine instance
engine = BotEngine()
