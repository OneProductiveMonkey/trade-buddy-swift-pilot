
"""
Arbitrage Strategy - Cross-Exchange Opportunities
Author: Mattiaz
Description: Finds arbitrage opportunities across different exchanges
"""

import logging
import numpy as np
from typing import Dict, List
from datetime import datetime

logger = logging.getLogger(__name__)

class ArbitrageStrategy:
    def __init__(self):
        self.min_profit_threshold = 0.3  # 0.3% minimum profit
        
    async def find_opportunities(self, market_data: Dict) -> List[Dict]:
        """Find arbitrage opportunities across exchanges"""
        try:
            opportunities = []
            
            for symbol, data in market_data.items():
                if not isinstance(data, dict) or 'exchanges' not in data:
                    continue
                
                exchange_prices = data['exchanges']
                if len(exchange_prices) < 2:
                    continue
                
                # Find best buy/sell combinations
                for buy_exchange, buy_price in exchange_prices.items():
                    for sell_exchange, sell_price in exchange_prices.items():
                        if buy_exchange != sell_exchange:
                            profit_pct = ((sell_price - buy_price) / buy_price) * 100
                            
                            if profit_pct > self.min_profit_threshold:
                                position_size = np.random.uniform(200, 500)  # $200-$500
                                profit_usd = (sell_price - buy_price) * (position_size / buy_price)
                                
                                opportunity = {
                                    'symbol': symbol,
                                    'buy_exchange': buy_exchange,
                                    'sell_exchange': sell_exchange,
                                    'buy_price': round(buy_price, 4),
                                    'sell_price': round(sell_price, 4),
                                    'profit_pct': round(profit_pct, 3),
                                    'profit_usd': round(profit_usd, 2),
                                    'position_size': round(position_size, 2),
                                    'avg_price': round((buy_price + sell_price) / 2, 4),
                                    'confidence': min(95, 70 + (profit_pct * 5)),
                                    'timestamp': datetime.now().isoformat()
                                }
                                
                                opportunities.append(opportunity)
                
            # Sort by profit potential
            return sorted(opportunities, key=lambda x: x['profit_pct'], reverse=True)
            
        except Exception as e:
            logger.error(f"Arbitrage opportunity search failed: {e}")
            return []
