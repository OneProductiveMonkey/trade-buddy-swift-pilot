
"""
AI Auto Mode Decision Engine
"""
import logging
import numpy as np
from datetime import datetime
from typing import Dict, List, Tuple

logger = logging.getLogger(__name__)

class AutoModeEngine:
    def __init__(self):
        self.decision_history = []
        self.current_strategy = None
        self.last_confidence = 0
        
    def analyze_market_conditions(self, market_data: Dict) -> Dict:
        """Analyze current market conditions and return metrics"""
        try:
            # Simulate market analysis based on available data
            arbitrage_opportunities = len(market_data.get('arbitrage_opportunities', []))
            ai_signals = market_data.get('ai_signals', [])
            strong_signals = len([s for s in ai_signals if s.get('confidence', 0) > 80])
            
            # Calculate market metrics
            volatility = np.random.uniform(0.2, 0.9)  # Simulate volatility
            trend_strength = np.random.uniform(0.3, 0.8)
            volume_spike = np.random.uniform(0.8, 2.5)
            
            return {
                'volatility': round(volatility, 2),
                'trend_strength': round(trend_strength, 2),
                'arbitrage_opportunities': arbitrage_opportunities,
                'ai_signal_strength': round(strong_signals / max(len(ai_signals), 1), 2),
                'volume_spike': round(volume_spike, 2)
            }
            
        except Exception as e:
            logger.error(f"Market analysis failed: {e}")
            return {
                'volatility': 0.5,
                'trend_strength': 0.5,
                'arbitrage_opportunities': 0,
                'ai_signal_strength': 0.5,
                'volume_spike': 1.0
            }
    
    def decide_strategy(self, market_conditions: Dict, portfolio: Dict) -> Tuple[str, float, str]:
        """AI decision engine for optimal strategy selection"""
        try:
            volatility = market_conditions['volatility']
            arbitrage_opps = market_conditions['arbitrage_opportunities']
            ai_signal_strength = market_conditions['ai_signal_strength']
            trend_strength = market_conditions['trend_strength']
            
            # Decision logic based on market conditions
            if arbitrage_opps >= 3 and volatility < 0.4:
                strategy = "arbitrage"
                confidence = 85 + (arbitrage_opps * 2)
                rationale = f"High arbitrage opportunities ({arbitrage_opps}) detected with low volatility ({volatility:.1%}). Perfect for risk-free profit."
                
            elif ai_signal_strength > 0.7 and trend_strength > 0.6:
                strategy = "ai_signal"
                confidence = 80 + (ai_signal_strength * 15)
                rationale = f"Strong AI signals ({ai_signal_strength:.1%}) with trending market ({trend_strength:.1%}). High profit potential."
                
            elif volatility > 0.6 and arbitrage_opps >= 1:
                strategy = "hybrid"
                confidence = 75 + (arbitrage_opps * 3)
                rationale = f"Volatile market ({volatility:.1%}) with some arbitrage opportunities. Balanced approach recommended."
                
            else:
                strategy = "arbitrage"
                confidence = 60
                rationale = "Market conditions unclear. Defaulting to conservative arbitrage strategy for steady returns."
            
            # Cap confidence at 95%
            confidence = min(confidence, 95)
            
            # Store decision
            decision = {
                'timestamp': datetime.now().isoformat(),
                'strategy': strategy,
                'confidence': confidence,
                'rationale': rationale,
                'market_conditions': market_conditions,
                'portfolio_balance': portfolio.get('balance', 0)
            }
            
            self.decision_history.append(decision)
            self.current_strategy = strategy
            self.last_confidence = confidence
            
            # Keep only last 20 decisions
            if len(self.decision_history) > 20:
                self.decision_history.pop(0)
            
            return strategy, confidence, rationale
            
        except Exception as e:
            logger.error(f"Strategy decision failed: {e}")
            return "arbitrage", 50, "Error in analysis, using conservative approach"
    
    def get_current_status(self) -> Dict:
        """Get current auto mode status"""
        return {
            'active': self.current_strategy is not None,
            'current_strategy': self.current_strategy,
            'confidence': self.last_confidence,
            'decisions': self.decision_history[-10:],  # Last 10 decisions
            'total_decisions': len(self.decision_history)
        }
    
    def reset(self):
        """Reset auto mode engine"""
        self.current_strategy = None
        self.last_confidence = 0
        logger.info("Auto mode engine reset")

# Global instance
auto_mode_engine = AutoModeEngine()
