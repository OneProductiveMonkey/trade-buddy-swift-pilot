
"""
Meme Coin Radar - Trending Token Detection
Author: Mattiaz
Description: Fetches and analyzes trending meme coins from CoinGecko
"""

import logging
import aiohttp
import asyncio
from typing import List, Dict, Optional
from datetime import datetime
import time

logger = logging.getLogger(__name__)

class MemeRadar:
    def __init__(self):
        self.base_url = "https://api.coingecko.com/api/v3"
        self.cache = {}
        self.cache_duration = 120  # 2 minutes cache
        
    async def get_trending_memes(self) -> List[Dict]:
        """Get top trending meme coins with pump analysis"""
        try:
            # Check cache first
            cache_key = "trending_memes"
            if self._is_cached(cache_key):
                return self.cache[cache_key]['data']
            
            # Fetch trending coins and market data
            trending_data = await self._fetch_trending_coins()
            market_data = await self._fetch_market_data()
            
            # Analyze and filter meme candidates
            meme_candidates = await self._analyze_meme_potential(trending_data, market_data)
            
            # Cache results
            self.cache[cache_key] = {
                'data': meme_candidates,
                'timestamp': time.time()
            }
            
            return meme_candidates
            
        except Exception as e:
            logger.error(f"Failed to get trending memes: {e}")
            return self._get_fallback_data()
    
    async def _fetch_trending_coins(self) -> List[Dict]:
        """Fetch trending coins from CoinGecko"""
        try:
            async with aiohttp.ClientSession() as session:
                url = f"{self.base_url}/search/trending"
                async with session.get(url, timeout=10) as response:
                    if response.status == 200:
                        data = await response.json()
                        return data.get('coins', [])
                    else:
                        logger.warning(f"CoinGecko trending API returned {response.status}")
                        return []
        except Exception as e:
            logger.error(f"Failed to fetch trending coins: {e}")
            return []
    
    async def _fetch_market_data(self) -> List[Dict]:
        """Fetch market data for analysis"""
        try:
            async with aiohttp.ClientSession() as session:
                url = f"{self.base_url}/coins/markets"
                params = {
                    'vs_currency': 'usd',
                    'order': 'volume_desc',
                    'per_page': 100,
                    'page': 1,
                    'sparkline': False,
                    'price_change_percentage': '1h,24h'
                }
                
                async with session.get(url, params=params, timeout=10) as response:
                    if response.status == 200:
                        return await response.json()
                    else:
                        logger.warning(f"CoinGecko markets API returned {response.status}")
                        return []
        except Exception as e:
            logger.error(f"Failed to fetch market data: {e}")
            return []
    
    async def _analyze_meme_potential(self, trending_data: List[Dict], market_data: List[Dict]) -> List[Dict]:
        """Analyze meme coin pump potential"""
        try:
            meme_candidates = []
            
            # Create lookup for market data
            market_lookup = {coin['id']: coin for coin in market_data}
            
            for trend_coin in trending_data:
                coin_id = trend_coin.get('item', {}).get('id')
                if not coin_id:
                    continue
                
                # Get corresponding market data
                market_info = market_lookup.get(coin_id)
                if not market_info:
                    continue
                
                # Apply meme coin filters
                market_cap = market_info.get('market_cap', 0) or 0
                current_price = market_info.get('current_price', 0) or 0
                volume_24h = market_info.get('total_volume', 0) or 0
                price_change_1h = market_info.get('price_change_percentage_1h', 0) or 0
                price_change_24h = market_info.get('price_change_percentage_24h', 0) or 0
                
                # Meme coin criteria
                if (market_cap < 100_000_000 and  # Under $100M market cap
                    current_price < 1.0 and       # Under $1
                    volume_24h > 1_000_000):      # Over $1M volume
                    
                    # Calculate pump potential score
                    volume_ratio = volume_24h / max(market_cap, 1) if market_cap > 0 else 0
                    price_momentum = abs(price_change_1h) + abs(price_change_24h)
                    
                    pump_score = min(100, (volume_ratio * 50) + (price_momentum * 2))
                    
                    # Volume spike detection
                    volume_spike_ratio = (volume_ratio * 100) if volume_ratio > 0.02 else 0
                    
                    # Risk assessment
                    if pump_score > 75:
                        risk_level = "Very High"
                    elif pump_score > 50:
                        risk_level = "High"
                    elif pump_score > 25:
                        risk_level = "Medium"
                    else:
                        risk_level = "Low"
                    
                    meme_data = {
                        'id': coin_id,
                        'name': market_info.get('name', ''),
                        'symbol': market_info.get('symbol', '').upper(),
                        'current_price': round(current_price, 6),
                        'market_cap': market_cap,
                        'volume_24h': volume_24h,
                        'price_change_1h': round(price_change_1h, 2),
                        'price_change_24h': round(price_change_24h, 2),
                        'pump_potential': round(pump_score, 1),
                        'volume_spike': round(volume_spike_ratio, 1),
                        'risk_level': risk_level,
                        'market_cap_rank': market_info.get('market_cap_rank'),
                        'trending_rank': trend_coin.get('item', {}).get('market_cap_rank', 999),
                        'last_updated': datetime.now().isoformat()
                    }
                    
                    meme_candidates.append(meme_data)
            
            # Sort by pump potential and return top 5
            meme_candidates.sort(key=lambda x: x['pump_potential'], reverse=True)
            return meme_candidates[:5]
            
        except Exception as e:
            logger.error(f"Meme analysis failed: {e}")
            return []
    
    def _is_cached(self, key: str) -> bool:
        """Check if data is cached and still valid"""
        if key in self.cache:
            age = time.time() - self.cache[key]['timestamp']
            return age < self.cache_duration
        return False
    
    def _get_fallback_data(self) -> List[Dict]:
        """Return fallback data when API fails"""
        return [
            {
                'name': 'Demo Meme Coin',
                'symbol': 'DEMO',
                'current_price': 0.001234,
                'market_cap': 50000000,
                'volume_24h': 5000000,
                'price_change_1h': 15.6,
                'price_change_24h': 45.2,
                'pump_potential': 78.5,
                'volume_spike': 245.0,
                'risk_level': 'High',
                'market_cap_rank': 567,
                'trending_rank': 3,
                'last_updated': datetime.now().isoformat()
            }
        ]

# Global instance
meme_radar = MemeRadar()
