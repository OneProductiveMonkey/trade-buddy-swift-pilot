
"""
Auto Mode Engine - Intelligent Strategy Selection
Author: Mattiaz
Description: Analyzes market conditions and selects optimal trading strategy
"""

import logging
import numpy as np
from typing import Dict, List, Tuple
from datetime import datetime
import asyncio

logger = logging.getLogger(__name__)

class AutoModeEngine:
    def __init__(self):
        self.current_strategy = "hybrid"
        self.confidence = 0.0
        self.last_analysis = {}
        self.strategy_history = []
        
    async def analyze_market_conditions(self, market_data: Dict) -> Dict:
        """Analyze current market conditions and return metrics"""
        try:
            # Calculate market volatility from price data
            volatility = await self._calculate_volatility(market_data)
            
            # Analyze volume spikes
            volume_spike = await self._detect_volume_spikes(market_data)
            
            # Calculate price spreads across exchanges
            price_spreads = await self._calculate_price_spreads(market_data)
            
            # Technical indicators
            rsi_signals = await self._analyze_rsi_conditions(market_data)
            macd_signals = await self._analyze_macd_conditions(market_data)
            
            analysis = {
                'volatility': volatility,
                'volume_spike': volume_spike,
                'max_price_spread': max(price_spreads.values()) if price_spreads else 0,
                'rsi_oversold': rsi_signals['oversold_count'],
                'rsi_overbought': rsi_signals['overbought_count'],
                'macd_bullish': macd_signals['bullish_count'],
                'macd_bearish': macd_signals['bearish_count'],
                'timestamp': datetime.now().isoformat()
            }
            
            self.last_analysis = analysis
            return analysis
            
        except Exception as e:
            logger.error(f"Market analysis failed: {e}")
            return {
                'volatility': 0.5,
                'volume_spike': 1.0,
                'max_price_spread': 0.0,
                'rsi_oversold': 0,
                'rsi_overbought': 0,
                'macd_bullish': 0,
                'macd_bearish': 0,
                'timestamp': datetime.now().isoformat()
            }
    
    async def select_optimal_strategy(self, analysis: Dict) -> Tuple[str, float, str]:
        """Select optimal strategy based on market analysis"""
        try:
            volatility = analysis['volatility']
            volume_spike = analysis['volume_spike']
            max_spread = analysis['max_price_spread']
            rsi_signals = analysis['rsi_oversold'] + analysis['rsi_overbought']
            macd_signals = analysis['macd_bullish'] + analysis['macd_bearish']
            
            # Strategy selection logic
            if max_spread > 0.5 and volatility < 0.6:
                # High price spreads + low volatility = perfect for arbitrage
                strategy = "arbitrage"
                confidence = min(95, 70 + (max_spread * 10))
                reason = f"High price spreads ({max_spread:.2f}%) with low volatility - optimal for arbitrage"
                
            elif volume_spike > 2.0 and (rsi_signals > 0 or macd_signals > 0):
                # Volume spikes + technical signals = AI strategy
                strategy = "ai_signal"
                confidence = min(90, 60 + (volume_spike * 10) + (rsi_signals * 5) + (macd_signals * 5))
                reason = f"Volume spike ({volume_spike:.1f}x) with {rsi_signals + macd_signals} technical signals"
                
            elif volatility > 0.7 and max_spread > 0.2:
                # High volatility + some spreads = hybrid approach
                strategy = "hybrid"
                confidence = min(85, 65 + (volatility * 15) + (max_spread * 5))
                reason = f"High volatility ({volatility:.1f}) with spreads - balanced hybrid approach"
                
            else:
                # Default to conservative arbitrage
                strategy = "arbitrage"
                confidence = 60
                reason = "Stable market conditions - conservative arbitrage strategy"
            
            # Store decision in history
            decision = {
                'timestamp': datetime.now(),
                'strategy': strategy,
                'confidence': confidence,
                'reason': reason,
                'analysis': analysis
            }
            
            self.strategy_history.append(decision)
            if len(self.strategy_history) > 50:  # Keep last 50 decisions
                self.strategy_history.pop(0)
            
            self.current_strategy = strategy
            self.confidence = confidence
            
            return strategy, confidence, reason
            
        except Exception as e:
            logger.error(f"Strategy selection failed: {e}")
            return "arbitrage", 50, "Error in analysis - using conservative approach"
    
    async def _calculate_volatility(self, market_data: Dict) -> float:
        """Calculate market volatility from price data"""
        try:
            prices = []
            for symbol_data in market_data.values():
                if isinstance(symbol_data, dict) and 'price' in symbol_data:
                    prices.append(symbol_data['price'])
            
            if len(prices) < 2:
                return 0.5
            
            # Calculate coefficient of variation as volatility measure
            volatility = np.std(prices) / np.mean(prices) if np.mean(prices) > 0 else 0.5
            return min(1.0, volatility * 100)  # Scale to 0-1
            
        except Exception:
            return 0.5
    
    async def _detect_volume_spikes(self, market_data: Dict) -> float:
        """Detect volume spikes in market data"""
        try:
            # Simulate volume spike detection
            # In production, this would analyze actual volume data
            return np.random.uniform(0.8, 3.0)
        except Exception:
            return 1.0
    
    async def _calculate_price_spreads(self, market_data: Dict) -> Dict[str, float]:
        """Calculate price spreads across different sources"""
        try:
            spreads = {}
            for symbol, data in market_data.items():
                if isinstance(data, dict) and 'exchanges' in data:
                    exchange_prices = list(data['exchanges'].values())
                    if len(exchange_prices) >= 2:
                        max_price = max(exchange_prices)
                        min_price = min(exchange_prices)
                        spread = ((max_price - min_price) / min_price) * 100
                        spreads[symbol] = spread
            return spreads
        except Exception:
            return {}
    
    async def _analyze_rsi_conditions(self, market_data: Dict) -> Dict:
        """Analyze RSI conditions across markets"""
        try:
            oversold_count = 0
            overbought_count = 0
            
            # Simulate RSI analysis
            for _ in range(3):  # Simulate 3 major markets
                rsi = np.random.uniform(20, 80)
                if rsi < 30:
                    oversold_count += 1
                elif rsi > 70:
                    overbought_count += 1
            
            return {
                'oversold_count': oversold_count,
                'overbought_count': overbought_count
            }
        except Exception:
            return {'oversold_count': 0, 'overbought_count': 0}
    
    async def _analyze_macd_conditions(self, market_data: Dict) -> Dict:
        """Analyze MACD conditions across markets"""
        try:
            bullish_count = 0
            bearish_count = 0
            
            # Simulate MACD analysis
            for _ in range(3):  # Simulate 3 major markets
                macd = np.random.uniform(-1, 1)
                if macd > 0.2:
                    bullish_count += 1
                elif macd < -0.2:
                    bearish_count += 1
            
            return {
                'bullish_count': bullish_count,
                'bearish_count': bearish_count
            }
        except Exception:
            return {'bullish_count': 0, 'bearish_count': 0}
    
    def get_status(self) -> Dict:
        """Get current auto mode status"""
        return {
            'enabled': True,
            'current_strategy': self.current_strategy,
            'confidence': self.confidence,
            'last_analysis': self.last_analysis,
            'recent_decisions': self.strategy_history[-5:],
            'total_decisions': len(self.strategy_history)
        }

# Global instance
auto_engine = AutoModeEngine()
