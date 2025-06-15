
"""
AI Trading Strategy - Signal Generation
Author: Mattiaz
Description: Generates AI-powered trading signals using technical analysis
"""

import logging
import numpy as np
from typing import Dict, List
from datetime import datetime
from core.engine import TradeSignal, StrategyType

logger = logging.getLogger(__name__)

class AIStrategy:
    def __init__(self):
        self.min_confidence = 60.0
        
    async def generate_signals(self, market_data: Dict) -> List[TradeSignal]:
        """Generate AI trading signals based on market data"""
        try:
            signals = []
            
            for symbol, data in market_data.items():
                if not isinstance(data, dict) or 'price' not in data:
                    continue
                
                # Analyze market conditions
                analysis = await self._analyze_symbol(symbol, data)
                
                if analysis['confidence'] > self.min_confidence:
                    signal = TradeSignal(
                        symbol=symbol,
                        direction=analysis['direction'],
                        confidence=analysis['confidence'],
                        price=data['price'],
                        target_price=analysis['target_price'],
                        strategy=StrategyType.AI_SIGNALS,
                        timestamp=datetime.now(),
                        risk_level=analysis['risk_level']
                    )
                    signals.append(signal)
            
            return sorted(signals, key=lambda x: x.confidence, reverse=True)
            
        except Exception as e:
            logger.error(f"AI signal generation failed: {e}")
            return []
    
    async def _analyze_symbol(self, symbol: str, data: Dict) -> Dict:
        """Analyze individual symbol for trading signals"""
        try:
            price = data['price']
            volume = data.get('volume_24h', 0)
            change = data.get('change_24h', 0)
            
            # Simulate technical analysis
            rsi = np.random.uniform(20, 80)
            macd = np.random.uniform(-1, 1)
            volatility = abs(change) / 100
            
            # Signal generation logic
            confidence = 0
            direction = 'hold'
            
            if rsi < 30 and macd > 0:
                direction = 'buy'
                confidence = 75 + np.random.uniform(0, 15)
            elif rsi > 70 and macd < 0:
                direction = 'sell'
                confidence = 70 + np.random.uniform(0, 20)
            elif abs(change) > 5:  # High volatility
                direction = 'buy' if change > 0 else 'sell'
                confidence = 65 + np.random.uniform(0, 15)
            
            # Calculate target price
            if direction == 'buy':
                target_price = price * (1 + np.random.uniform(0.02, 0.05))
            elif direction == 'sell':
                target_price = price * (1 - np.random.uniform(0.01, 0.03))
            else:
                target_price = price
            
            # Risk assessment
            if volatility > 0.05:
                risk_level = "High"
            elif volatility > 0.02:
                risk_level = "Medium"
            else:
                risk_level = "Low"
            
            return {
                'direction': direction,
                'confidence': round(confidence, 1),
                'target_price': round(target_price, 2),
                'risk_level': risk_level,
                'rsi': round(rsi, 1),
                'macd': round(macd, 3),
                'volatility': round(volatility, 3)
            }
            
        except Exception as e:
            logger.error(f"Symbol analysis failed for {symbol}: {e}")
            return {
                'direction': 'hold',
                'confidence': 0,
                'target_price': data.get('price', 0),
                'risk_level': 'Unknown'
            }
