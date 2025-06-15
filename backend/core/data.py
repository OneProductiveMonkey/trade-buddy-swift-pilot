
"""
Data Fetcher - Real-time price and market data
Author: Mattiaz
Description: Async data fetching from multiple crypto APIs
"""

import aiohttp
import asyncio
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime
import json

logger = logging.getLogger(__name__)

class DataFetcher:
    def __init__(self):
        self.session = None
        self.base_urls = {
            'coingecko': 'https://api.coingecko.com/api/v3',
            'binance': 'https://api.binance.com/api/v3',
            'coinbase': 'https://api.coinbase.com/v2'
        }
        
        # Selected markets for trading
        self.markets = [
            {'symbol': 'BTC/USDT', 'coingecko_id': 'bitcoin', 'binance_symbol': 'BTCUSDT'},
            {'symbol': 'ETH/USDT', 'coingecko_id': 'ethereum', 'binance_symbol': 'ETHUSDT'},
            {'symbol': 'SOL/USDT', 'coingecko_id': 'solana', 'binance_symbol': 'SOLUSDT'},
        ]
    
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def get_session(self):
        """Get or create HTTP session"""
        if not self.session:
            self.session = aiohttp.ClientSession()
        return self.session
    
    async def get_all_prices(self) -> Dict[str, Any]:
        """Get prices from all sources"""
        session = await self.get_session()
        
        try:
            # Fetch from multiple sources in parallel
            tasks = []
            
            # CoinGecko prices
            tasks.append(self._fetch_coingecko_prices(session))
            
            # Binance prices
            tasks.append(self._fetch_binance_prices(session))
            
            # Coinbase prices (simplified)
            tasks.append(self._fetch_coinbase_prices(session))
            
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Combine results
            combined_data = {}
            
            for i, result in enumerate(results):
                if isinstance(result, Exception):
                    logger.error(f"Data fetch error from source {i}: {result}")
                    continue
                
                if result:
                    combined_data.update(result)
            
            # Add timestamp
            combined_data['_timestamp'] = datetime.now().isoformat()
            combined_data['_sources'] = len([r for r in results if not isinstance(r, Exception)])
            
            return combined_data
            
        except Exception as e:
            logger.error(f"Failed to fetch market data: {e}")
            return self._get_fallback_data()
    
    async def _fetch_coingecko_prices(self, session) -> Dict[str, Any]:
        """Fetch prices from CoinGecko"""
        try:
            coin_ids = ','.join([m['coingecko_id'] for m in self.markets])
            url = f"{self.base_urls['coingecko']}/simple/price"
            params = {
                'ids': coin_ids,
                'vs_currencies': 'usd',
                'include_24hr_change': 'true',
                'include_24hr_vol': 'true'
            }
            
            async with session.get(url, params=params, timeout=10) as response:
                if response.status == 200:
                    data = await response.json()
                    
                    # Transform to our format
                    prices = {}
                    for market in self.markets:
                        coin_data = data.get(market['coingecko_id'], {})
                        if coin_data:
                            prices[market['symbol']] = {
                                'coingecko': {
                                    'price': coin_data.get('usd', 0),
                                    'change_24h': coin_data.get('usd_24h_change', 0),
                                    'volume_24h': coin_data.get('usd_24h_vol', 0)
                                }
                            }
                    
                    return prices
                    
        except Exception as e:
            logger.error(f"CoinGecko fetch error: {e}")
            return {}
    
    async def _fetch_binance_prices(self, session) -> Dict[str, Any]:
        """Fetch prices from Binance"""
        try:
            url = f"{self.base_urls['binance']}/ticker/24hr"
            
            async with session.get(url, timeout=10) as response:
                if response.status == 200:
                    data = await response.json()
                    
                    # Filter our markets
                    prices = {}
                    for market in self.markets:
                        binance_symbol = market['binance_symbol']
                        
                        for ticker in data:
                            if ticker['symbol'] == binance_symbol:
                                if market['symbol'] not in prices:
                                    prices[market['symbol']] = {}
                                
                                prices[market['symbol']]['binance'] = {
                                    'price': float(ticker['lastPrice']),
                                    'change_24h': float(ticker['priceChangePercent']),
                                    'volume_24h': float(ticker['volume'])
                                }
                                break
                    
                    return prices
                    
        except Exception as e:
            logger.error(f"Binance fetch error: {e}")
            return {}
    
    async def _fetch_coinbase_prices(self, session) -> Dict[str, Any]:
        """Fetch prices from Coinbase (simplified)"""
        try:
            prices = {}
            
            # Coinbase has different endpoint structure, so we'll simulate for now
            # In production, implement proper Coinbase Pro API calls
            
            for market in self.markets:
                symbol = market['symbol'].replace('/USDT', '-USD')
                # This is a placeholder - implement actual Coinbase API
                
            return prices
            
        except Exception as e:
            logger.error(f"Coinbase fetch error: {e}")
            return {}
    
    def _get_fallback_data(self) -> Dict[str, Any]:
        """Fallback data when APIs fail"""
        import random
        
        base_prices = {
            'BTC/USDT': 43000,
            'ETH/USDT': 2600,
            'SOL/USDT': 100
        }
        
        fallback = {}
        for symbol, base_price in base_prices.items():
            # Add some realistic variance
            variance = base_price * 0.02  # 2% variance
            price = base_price + random.uniform(-variance, variance)
            
            fallback[symbol] = {
                'fallback': {
                    'price': round(price, 2),
                    'change_24h': random.uniform(-5, 5),
                    'volume_24h': random.uniform(1000000, 10000000)
                }
            }
        
        fallback['_timestamp'] = datetime.now().isoformat()
        fallback['_sources'] = 0
        fallback['_fallback'] = True
        
        return fallback
    
    async def get_historical_data(self, symbol: str, days: int = 7) -> List[Dict]:
        """Get historical price data"""
        session = await self.get_session()
        
        try:
            # Find the coingecko ID for this symbol
            coin_id = None
            for market in self.markets:
                if market['symbol'] == symbol:
                    coin_id = market['coingecko_id']
                    break
            
            if not coin_id:
                return []
            
            url = f"{self.base_urls['coingecko']}/coins/{coin_id}/market_chart"
            params = {
                'vs_currency': 'usd',
                'days': days,
                'interval': 'hourly' if days <= 1 else 'daily'
            }
            
            async with session.get(url, params=params, timeout=15) as response:
                if response.status == 200:
                    data = await response.json()
                    
                    # Transform to our format
                    historical = []
                    prices = data.get('prices', [])
                    
                    for timestamp, price in prices:
                        historical.append({
                            'timestamp': datetime.fromtimestamp(timestamp / 1000),
                            'price': price,
                            'symbol': symbol
                        })
                    
                    return historical
                    
        except Exception as e:
            logger.error(f"Historical data fetch error: {e}")
            return []
    
    async def close(self):
        """Close the HTTP session"""
        if self.session:
            await self.session.close()
            self.session = None

# Global data fetcher instance
data_fetcher = DataFetcher()
