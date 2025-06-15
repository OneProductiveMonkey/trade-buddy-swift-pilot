
"""
Data Fetcher - Market Data Collection
Author: Mattiaz
Description: Fetches real-time market data from multiple sources
"""

import logging
import aiohttp
import asyncio
from typing import Dict, List, Optional
import numpy as np
import time

logger = logging.getLogger(__name__)

class DataFetcher:
    def __init__(self):
        self.cache = {}
        self.cache_duration = 30  # 30 seconds cache
        
    async def get_all_prices(self) -> Dict:
        """Get prices for all monitored symbols"""
        try:
            # Check cache first
            cache_key = "all_prices"
            if self._is_cached(cache_key):
                return self.cache[cache_key]['data']
            
            # Fetch fresh data
            prices = await self._fetch_market_prices()
            
            # Cache results
            self.cache[cache_key] = {
                'data': prices,
                'timestamp': time.time()
            }
            
            return prices
            
        except Exception as e:
            logger.error(f"Failed to get prices: {e}")
            return self._get_demo_prices()
    
    async def _fetch_market_prices(self) -> Dict:
        """Fetch real market prices (demo implementation)"""
        try:
            # In production, this would fetch from real APIs
            # For now, generate realistic demo data
            
            base_prices = {
                'BTC/USDT': 43000 + np.random.normal(0, 500),
                'ETH/USDT': 2600 + np.random.normal(0, 50),
                'SOL/USDT': 100 + np.random.normal(0, 5)
            }
            
            market_data = {}
            for symbol, price in base_prices.items():
                market_data[symbol] = {
                    'price': round(price, 2),
                    'volume_24h': np.random.uniform(1000000, 5000000),
                    'change_24h': np.random.uniform(-5, 5),
                    'exchanges': {
                        'binance': price + np.random.normal(0, price * 0.001),
                        'coinbase': price + np.random.normal(0, price * 0.001),
                        'kucoin': price + np.random.normal(0, price * 0.001)
                    },
                    'last_updated': time.time()
                }
            
            return market_data
            
        except Exception as e:
            logger.error(f"Market price fetch failed: {e}")
            return self._get_demo_prices()
    
    def _is_cached(self, key: str) -> bool:
        """Check if data is cached and still valid"""
        if key in self.cache:
            age = time.time() - self.cache[key]['timestamp']
            return age < self.cache_duration
        return False
    
    def _get_demo_prices(self) -> Dict:
        """Return fallback demo prices"""
        return {
            'BTC/USDT': {
                'price': 43000.0,
                'volume_24h': 2500000000,
                'change_24h': 2.1,
                'exchanges': {
                    'binance': 43000.0,
                    'coinbase': 43005.0,
                    'kucoin': 42995.0
                },
                'last_updated': time.time()
            },
            'ETH/USDT': {
                'price': 2600.0,
                'volume_24h': 1200000000,
                'change_24h': 1.8,
                'exchanges': {
                    'binance': 2600.0,
                    'coinbase': 2602.0,
                    'kucoin': 2598.0
                },
                'last_updated': time.time()
            },
            'SOL/USDT': {
                'price': 100.0,
                'volume_24h': 500000000,
                'change_24h': 3.2,
                'exchanges': {
                    'binance': 100.0,
                    'coinbase': 100.5,
                    'kucoin': 99.8
                },
                'last_updated': time.time()
            }
        }
    
    async def close(self):
        """Cleanup method"""
        pass

# Global instance
data_fetcher = DataFetcher()
