
"""
AI signal generation and technical analysis
"""
import numpy as np
import pandas as pd
import logging
from typing import Dict, List, Optional
from datetime import datetime
import ta

logger = logging.getLogger(__name__)

class AISignalGenerator:
    def __init__(self):
        self.signal_history = []
        self.confidence_threshold = 70
        
    def generate_signals(self, market_data: Dict, symbols: List[str]) -> List[Dict]:
        """Generate AI trading signals for given symbols"""
        signals = []
        
        for symbol in symbols:
            try:
                signal = self._analyze_symbol(symbol, market_data.get(symbol, {}))
                if signal and signal['confidence'] > self.confidence_threshold:
                    signals.append(signal)
            except Exception as e:
                logger.error(f"Error generating signal for {symbol}: {e}")
        
        # Sort by confidence and return top 3
        signals.sort(key=lambda x: x['confidence'], reverse=True)
        self.signal_history = signals[:3]
        return self.signal_history
    
    def _analyze_symbol(self, symbol: str, data: Dict) -> Optional[Dict]:
        """Analyze individual symbol and generate signal"""
        try:
            # Get current price (simulated)
            current_price = self._get_current_price(symbol)
            
            # Generate technical indicators (simulated)
            analysis = self._calculate_technical_indicators(symbol)
            
            # Determine signal direction and confidence
            direction, confidence = self._determine_signal(analysis)
            
            if confidence < self.confidence_threshold:
                return None
            
            # Calculate target price
            target_multiplier = 1.03 if direction == 'buy' else 0.97
            target_price = current_price * target_multiplier
            
            return {
                'coin': symbol.split('/')[0],
                'symbol': symbol,
                'direction': direction,
                'confidence': round(confidence, 1),
                'current_price': round(current_price, 4),
                'target_price': round(target_price, 4),
                'risk_level': self._get_risk_level(symbol),
                'timeframe': self._get_timeframe(confidence),
                'analysis': analysis,
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error analyzing {symbol}: {e}")
            return None
    
    def _get_current_price(self, symbol: str) -> float:
        """Get current price for symbol (demo implementation)"""
        base_prices = {
            'BTC/USDT': 43000,
            'ETH/USDT': 2600,
            'SOL/USDT': 100,
            'ADA/USDT': 0.5,
            'DOT/USDT': 7.5
        }
        base = base_prices.get(symbol, 1000)
        return base + np.random.normal(0, base * 0.005)
    
    def _calculate_technical_indicators(self, symbol: str) -> Dict:
        """Calculate technical indicators (simulated)"""
        return {
            'rsi': np.random.uniform(25, 75),
            'macd': np.random.uniform(-0.5, 0.5),
            'bb_position': np.random.uniform(0, 1),
            'volume_spike': np.random.uniform(0.8, 2.0),
            'momentum': np.random.uniform(-1, 1),
            'trend': np.random.choice(['bullish', 'bearish', 'neutral'], p=[0.4, 0.3, 0.3])
        }
    
    def _determine_signal(self, analysis: Dict) -> tuple:
        """Determine signal direction and confidence based on analysis"""
        confidence = 0
        direction = 'hold'
        
        # RSI-based signals
        if analysis['rsi'] < 30 and analysis['trend'] == 'bullish':
            direction = 'buy'
            confidence = 85 + np.random.uniform(0, 10)
        elif analysis['rsi'] > 70 and analysis['trend'] == 'bearish':
            direction = 'sell'
            confidence = 75 + np.random.uniform(0, 15)
        
        # Momentum-based signals
        elif analysis['momentum'] > 0.5 and analysis['volume_spike'] > 1.3:
            direction = 'buy'
            confidence = 70 + np.random.uniform(0, 15)
        elif analysis['momentum'] < -0.5 and analysis['volume_spike'] > 1.2:
            direction = 'sell'
            confidence = 70 + np.random.uniform(0, 10)
        
        # MACD-based signals
        elif analysis['macd'] > 0.2 and analysis['bb_position'] < 0.3:
            direction = 'buy'
            confidence = 75 + np.random.uniform(0, 10)
        elif analysis['macd'] < -0.2 and analysis['bb_position'] > 0.7:
            direction = 'sell'
            confidence = 72 + np.random.uniform(0, 8)
        
        return direction, confidence
    
    def _get_risk_level(self, symbol: str) -> str:
        """Determine risk level for symbol"""
        risk_map = {
            'BTC/USDT': 'Medium risk',
            'ETH/USDT': 'Medium risk', 
            'SOL/USDT': 'High risk',
            'ADA/USDT': 'High risk',
            'DOT/USDT': 'High risk'
        }
        return risk_map.get(symbol, 'High risk')
    
    def _get_timeframe(self, confidence: float) -> str:
        """Get recommended timeframe based on confidence"""
        if confidence > 85:
            return '30min - 1h'
        elif confidence > 75:
            return '1-3 hours'
        else:
            return '2-6 hours'
    
    def get_signal_performance(self) -> Dict:
        """Get performance metrics for generated signals"""
        if not self.signal_history:
            return {'total_signals': 0, 'avg_confidence': 0}
        
        return {
            'total_signals': len(self.signal_history),
            'avg_confidence': np.mean([s['confidence'] for s in self.signal_history]),
            'buy_signals': len([s for s in self.signal_history if s['direction'] == 'buy']),
            'sell_signals': len([s for s in self.signal_history if s['direction'] == 'sell']),
            'last_updated': datetime.now().isoformat()
        }
