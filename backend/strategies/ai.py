
"""
AI Strategy - RSI, MACD, and Momentum Analysis
Author: Mattiaz
Description: AI-powered trading signals using technical analysis
"""

import logging
import numpy as np
import pandas as pd
from typing import List, Dict, Any
from datetime import datetime, timedelta
from ..core.engine import TradeSignal, StrategyType

logger = logging.getLogger(__name__)

class AIStrategy:
    def __init__(self):
        self.min_confidence = 60.0
        self.lookback_hours = 24
        
    async def generate_signals(self, market_data: Dict[str, Any]) -> List[TradeSignal]:
        """Generate AI-based trading signals"""
        signals = []
        
        try:
            for symbol, data in market_data.items():
                if symbol.startswith('_'):  # Skip metadata
                    continue
                
                signal = await self._analyze_symbol(symbol, data)
                if signal and signal.confidence > self.min_confidence:
                    signals.append(signal)
            
            # Sort by confidence
            signals.sort(key=lambda x: x.confidence, reverse=True)
            return signals[:5]  # Top 5 signals
            
        except Exception as e:
            logger.error(f"AI signal generation error: {e}")
            return []
    
    async def _analyze_symbol(self, symbol: str, data: Dict[str, Any]) -> TradeSignal:
        """Analyze a single symbol and generate signal"""
        try:
            # Get average price from all sources
            prices = []
            for source, source_data in data.items():
                if isinstance(source_data, dict) and 'price' in source_data:
                    prices.append(source_data['price'])
            
            if not prices:
                return None
            
            current_price = np.mean(prices)
            
            # Get 24h change data
            changes = []
            volumes = []
            
            for source, source_data in data.items():
                if isinstance(source_data, dict):
                    if 'change_24h' in source_data:
                        changes.append(source_data['change_24h'])
                    if 'volume_24h' in source_data:
                        volumes.append(source_data['volume_24h'])
            
            avg_change = np.mean(changes) if changes else 0
            avg_volume = np.mean(volumes) if volumes else 1000000
            
            # Technical Analysis (simplified)
            analysis = self._calculate_indicators(current_price, avg_change, avg_volume)
            
            # Generate signal
            direction, confidence, target_price = self._generate_signal_from_analysis(
                current_price, analysis
            )
            
            if direction and confidence > self.min_confidence:
                return TradeSignal(
                    symbol=symbol,
                    direction=direction,
                    confidence=confidence,
                    price=current_price,
                    target_price=target_price,
                    strategy=StrategyType.AI_SIGNALS,
                    timestamp=datetime.now(),
                    risk_level=self._calculate_risk_level(confidence)
                )
            
            return None
            
        except Exception as e:
            logger.error(f"Symbol analysis error for {symbol}: {e}")
            return None
    
    def _calculate_indicators(self, price: float, change_24h: float, volume: float) -> Dict[str, float]:
        """Calculate technical indicators (simplified version)"""
        
        # Simulated RSI based on 24h change
        rsi = 50 + (change_24h * 2)  # Scale change to RSI-like range
        rsi = max(0, min(100, rsi))
        
        # Simulated MACD momentum
        macd = change_24h / 10  # Normalize change
        
        # Volume analysis
        volume_normalized = volume / 1000000  # Scale volume
        volume_spike = 1.0 if volume_normalized > 5 else volume_normalized / 5
        
        # Trend strength based on momentum
        trend_strength = abs(change_24h) / 10
        trend_strength = min(1.0, trend_strength)
        
        return {
            'rsi': rsi,
            'macd': macd,
            'volume_spike': volume_spike,
            'trend_strength': trend_strength,
            'momentum': change_24h
        }
    
    def _generate_signal_from_analysis(self, price: float, analysis: Dict[str, float]) -> tuple:
        """Generate trading signal from technical analysis"""
        
        rsi = analysis['rsi']
        macd = analysis['macd']
        volume_spike = analysis['volume_spike']
        momentum = analysis['momentum']
        
        confidence = 50.0  # Base confidence
        direction = None
        target_price = price
        
        # RSI signals
        if rsi < 30:  # Oversold
            direction = 'buy'
            confidence += 25
            target_price = price * 1.03  # 3% target
        elif rsi > 70:  # Overbought
            direction = 'sell'
            confidence += 20
            target_price = price * 0.98  # 2% down target
        
        # MACD momentum
        if macd > 0.5:  # Strong positive momentum
            if direction == 'buy':
                confidence += 15
            elif not direction:
                direction = 'buy'
                confidence += 10
                target_price = price * 1.025
        elif macd < -0.5:  # Strong negative momentum
            if direction == 'sell':
                confidence += 15
            elif not direction:
                direction = 'sell'
                confidence += 10
                target_price = price * 0.975
        
        # Volume confirmation
        if volume_spike > 0.8:
            confidence += 10
        
        # Momentum boost
        if abs(momentum) > 3:  # Strong momentum
            confidence += 5
        
        # Risk adjustment
        if abs(momentum) > 8:  # Very volatile
            confidence -= 10
        
        # Ensure direction
        if not direction:
            if momentum > 1:
                direction = 'buy'
                target_price = price * 1.02
            elif momentum < -1:
                direction = 'sell'
                target_price = price * 0.98
            else:
                direction = 'hold'
                confidence = 30
        
        confidence = max(0, min(100, confidence))
        
        return direction, confidence, target_price
    
    def _calculate_risk_level(self, confidence: float) -> str:
        """Calculate risk level based on confidence"""
        if confidence > 85:
            return "Low Risk"
        elif confidence > 70:
            return "Medium Risk"
        else:
            return "High Risk"
    
    async def backtest_strategy(self, symbol: str, days: int = 7) -> Dict[str, Any]:
        """Backtest the AI strategy"""
        try:
            from ..core.data import data_fetcher
            
            historical_data = await data_fetcher.get_historical_data(symbol, days)
            
            if len(historical_data) < 10:
                return {'error': 'Insufficient historical data'}
            
            trades = []
            balance = 10000
            
            for i, data_point in enumerate(historical_data[1:], 1):
                # Simulate analysis on each data point
                fake_market_data = {
                    symbol: {
                        'source': {
                            'price': data_point['price'],
                            'change_24h': np.random.uniform(-5, 5),
                            'volume_24h': np.random.uniform(1000000, 5000000)
                        }
                    }
                }
                
                signals = await self.generate_signals(fake_market_data)
                
                if signals:
                    signal = signals[0]
                    
                    # Simulate trade execution
                    trade_amount = balance * 0.1  # 10% of balance
                    
                    if signal.direction == 'buy':
                        # Simulate profit/loss based on next price movement
                        if i < len(historical_data) - 1:
                            next_price = historical_data[i + 1]['price']
                            profit_pct = (next_price - signal.price) / signal.price
                            profit = trade_amount * profit_pct
                            balance += profit
                            
                            trades.append({
                                'timestamp': data_point['timestamp'],
                                'signal': signal.direction,
                                'price': signal.price,
                                'confidence': signal.confidence,
                                'profit': profit
                            })
            
            total_profit = balance - 10000
            win_rate = len([t for t in trades if t['profit'] > 0]) / len(trades) * 100 if trades else 0
            
            return {
                'total_trades': len(trades),
                'total_profit': total_profit,
                'win_rate': win_rate,
                'final_balance': balance,
                'trades': trades[-10:]  # Last 10 trades
            }
            
        except Exception as e:
            logger.error(f"Backtest error: {e}")
            return {'error': str(e)}
