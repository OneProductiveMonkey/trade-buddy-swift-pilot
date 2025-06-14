
"""
Trading strategy logic and decision making
"""
import logging
from typing import Dict, List, Optional
import numpy as np
from datetime import datetime

logger = logging.getLogger(__name__)

class StrategyManager:
    def __init__(self):
        self.strategies = {
            'arbitrage': self._arbitrage_strategy,
            'ai_signals': self._ai_signal_strategy,
            'hybrid': self._hybrid_strategy,
            'conservative': self._conservative_strategy,
            'auto': self._auto_strategy
        }
        self.current_strategy = 'hybrid'
        self.market_conditions = 'neutral'
        
    def recommend_strategy(self, market_data: Dict, portfolio: Dict) -> Dict:
        """Recommend optimal strategy based on market conditions"""
        try:
            volatility = self._calculate_market_volatility(market_data)
            trend_strength = self._calculate_trend_strength(market_data)
            portfolio_risk = self._assess_portfolio_risk(portfolio)
            
            # Strategy recommendation logic
            if volatility > 0.8 and trend_strength > 0.7:
                recommended = 'ai_signals'
                confidence = 85
                reason = 'High volatility with strong trends favor AI signal trading'
            elif volatility < 0.3:
                recommended = 'arbitrage'
                confidence = 90
                reason = 'Low volatility ideal for arbitrage opportunities'
            elif portfolio_risk > 0.7:
                recommended = 'conservative'
                confidence = 95
                reason = 'High portfolio risk requires conservative approach'
            else:
                recommended = 'hybrid'
                confidence = 75
                reason = 'Balanced market conditions favor hybrid strategy'
            
            return {
                'recommended_strategy': recommended,
                'confidence': confidence,
                'reason': reason,
                'market_conditions': {
                    'volatility': round(volatility, 2),
                    'trend_strength': round(trend_strength, 2),
                    'portfolio_risk': round(portfolio_risk, 2)
                },
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Strategy recommendation failed: {e}")
            return {
                'recommended_strategy': 'conservative',
                'confidence': 50,
                'reason': 'Error in analysis, defaulting to conservative',
                'timestamp': datetime.now().isoformat()
            }
    
    def execute_strategy(self, strategy_name: str, market_data: Dict, signals: List[Dict]) -> List[Dict]:
        """Execute specified trading strategy"""
        if strategy_name not in self.strategies:
            logger.error(f"Unknown strategy: {strategy_name}")
            return []
        
        try:
            return self.strategies[strategy_name](market_data, signals)
        except Exception as e:
            logger.error(f"Strategy execution failed: {e}")
            return []
    
    def _arbitrage_strategy(self, market_data: Dict, signals: List[Dict]) -> List[Dict]:
        """Arbitrage-focused strategy"""
        trades = []
        
        # Look for arbitrage opportunities with minimum 0.5% profit
        for opportunity in market_data.get('arbitrage_opportunities', []):
            if opportunity['profit_pct'] > 0.5:
                trades.append({
                    'type': 'arbitrage',
                    'symbol': opportunity['symbol'],
                    'action': 'execute',
                    'confidence': opportunity.get('confidence', 0.8),
                    'expected_profit': opportunity['profit_pct'],
                    'risk_level': 'low'
                })
        
        return trades[:3]  # Limit to top 3 opportunities
    
    def _ai_signal_strategy(self, market_data: Dict, signals: List[Dict]) -> List[Dict]:
        """AI signal-based strategy"""
        trades = []
        
        for signal in signals:
            if signal['confidence'] > 80:
                trades.append({
                    'type': 'ai_signal',
                    'symbol': signal['symbol'],
                    'action': signal['direction'],
                    'confidence': signal['confidence'],
                    'expected_profit': 2.0 if signal['direction'] == 'buy' else -1.0,
                    'risk_level': signal['risk_level'].lower().replace(' risk', '')
                })
        
        return trades[:2]  # Limit to top 2 signals
    
    def _hybrid_strategy(self, market_data: Dict, signals: List[Dict]) -> List[Dict]:
        """Hybrid strategy combining arbitrage and AI signals"""
        trades = []
        
        # Add arbitrage trades (60% allocation)
        arbitrage_trades = self._arbitrage_strategy(market_data, signals)
        trades.extend(arbitrage_trades[:2])
        
        # Add AI signal trades (40% allocation)
        ai_trades = self._ai_signal_strategy(market_data, signals)
        trades.extend(ai_trades[:1])
        
        return trades
    
    def _conservative_strategy(self, market_data: Dict, signals: List[Dict]) -> List[Dict]:
        """Conservative strategy with low-risk trades only"""
        trades = []
        
        # Only high-confidence, low-risk opportunities
        for opportunity in market_data.get('arbitrage_opportunities', []):
            if opportunity['profit_pct'] > 0.3 and opportunity.get('confidence', 0) > 0.85:
                trades.append({
                    'type': 'arbitrage_conservative',
                    'symbol': opportunity['symbol'],
                    'action': 'execute',
                    'confidence': opportunity['confidence'],
                    'expected_profit': opportunity['profit_pct'],
                    'risk_level': 'very_low'
                })
        
        return trades[:1]  # Very conservative - only 1 trade at a time
    
    def _auto_strategy(self, market_data: Dict, signals: List[Dict]) -> List[Dict]:
        """AI-driven auto strategy selection"""
        # Get strategy recommendation
        recommendation = self.recommend_strategy(market_data, {})
        recommended_strategy = recommendation['recommended_strategy']
        
        # Execute recommended strategy
        return self.execute_strategy(recommended_strategy, market_data, signals)
    
    def _calculate_market_volatility(self, market_data: Dict) -> float:
        """Calculate market volatility indicator"""
        # Simulate volatility calculation
        return np.random.uniform(0.2, 1.0)
    
    def _calculate_trend_strength(self, market_data: Dict) -> float:
        """Calculate trend strength indicator"""
        # Simulate trend strength calculation
        return np.random.uniform(0.3, 1.0)
    
    def _assess_portfolio_risk(self, portfolio: Dict) -> float:
        """Assess current portfolio risk level"""
        # Simulate risk assessment
        return np.random.uniform(0.1, 0.9)
    
    def get_strategy_performance(self) -> Dict:
        """Get performance metrics for all strategies"""
        return {
            'current_strategy': self.current_strategy,
            'available_strategies': list(self.strategies.keys()),
            'market_conditions': self.market_conditions,
            'last_updated': datetime.now().isoformat()
        }
