
"""
Meme Coin Radar using CoinGecko and CoinMarketCap APIs
"""
import logging
import requests
import time
from typing import List, Dict
import numpy as np

logger = logging.getLogger(__name__)

class MemeRadar:
    def __init__(self):
        self.coingecko_base = 'https://api.coingecko.com/api/v3'
        self.cache = {}
        self.cache_duration = 300  # 5 minutes
        
    def get_trending_coins(self) -> List[Dict]:
        """Get trending coins from CoinGecko"""
        try:
            # Check cache
            cache_key = 'trending_coins'
            if self._is_cached(cache_key):
                return self.cache[cache_key]['data']
            
            url = f"{self.coingecko_base}/coins/markets"
            params = {
                'vs_currency': 'usd',
                'order': 'volume_desc',
                'per_page': 100,
                'page': 1,
                'sparkline': False,
                'price_change_percentage': '24h'
            }
            
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            
            # Cache the result
            self.cache[cache_key] = {
                'data': data,
                'timestamp': time.time()
            }
            
            return data
            
        except Exception as e:
            logger.error(f"Failed to get trending coins: {e}")
            return []
    
    def analyze_meme_potential(self, coins: List[Dict]) -> List[Dict]:
        """Analyze meme coin pump potential"""
        meme_candidates = []
        
        try:
            for coin in coins:
                # Filter for potential meme coins
                market_cap = coin.get('market_cap', 0)
                volume_24h = coin.get('total_volume', 0)
                price_change_24h = coin.get('price_change_percentage_24h', 0)
                current_price = coin.get('current_price', 0)
                
                # Meme coin criteria
                if (market_cap < 500_000_000 and  # Under 500M market cap
                    volume_24h > 5_000_000 and    # Over 5M volume
                    current_price < 1.0):         # Under $1
                    
                    # Calculate pump potential score
                    volume_ratio = volume_24h / max(market_cap, 1)
                    price_momentum = abs(price_change_24h or 0)
                    
                    pump_score = min(100, (volume_ratio * 100 + price_momentum * 2))
                    
                    # Volume spike detection
                    volume_spike = volume_ratio if volume_ratio > 0.1 else 0
                    
                    # Risk assessment
                    if pump_score > 80:
                        risk_level = 'high'
                    elif pump_score > 50:
                        risk_level = 'medium'
                    else:
                        risk_level = 'low'
                    
                    meme_data = {
                        'id': coin.get('id'),
                        'name': coin.get('name'),
                        'symbol': coin.get('symbol', '').upper(),
                        'current_price': current_price,
                        'market_cap': market_cap,
                        'volume_24h': volume_24h,
                        'price_change_24h': price_change_24h,
                        'pump_potential': round(pump_score, 1),
                        'volume_spike': round(volume_spike * 100, 1),
                        'risk_level': risk_level,
                        'market_cap_rank': coin.get('market_cap_rank'),
                        'image': coin.get('image', ''),
                        'last_updated': coin.get('last_updated')
                    }
                    
                    meme_candidates.append(meme_data)
            
            # Sort by pump potential
            meme_candidates.sort(key=lambda x: x['pump_potential'], reverse=True)
            
            return meme_candidates[:20]  # Top 20 candidates
            
        except Exception as e:
            logger.error(f"Meme analysis failed: {e}")
            return []
    
    def get_meme_radar_data(self) -> Dict:
        """Get comprehensive meme radar data"""
        try:
            # Get trending coins
            trending_coins = self.get_trending_coins()
            
            # Analyze meme potential
            meme_candidates = self.analyze_meme_potential(trending_coins)
            
            # Get top performers
            top_gainers = [coin for coin in trending_coins 
                          if coin.get('price_change_percentage_24h', 0) > 10][:10]
            
            # Volume leaders
            volume_leaders = sorted(trending_coins, 
                                  key=lambda x: x.get('total_volume', 0), 
                                  reverse=True)[:10]
            
            return {
                'meme_candidates': meme_candidates,
                'top_gainers': top_gainers,
                'volume_leaders': volume_leaders,
                'total_analyzed': len(trending_coins),
                'timestamp': time.time(),
                'status': 'success'
            }
            
        except Exception as e:
            logger.error(f"Meme radar data failed: {e}")
            return {
                'meme_candidates': [],
                'top_gainers': [],
                'volume_leaders': [],
                'total_analyzed': 0,
                'timestamp': time.time(),
                'status': 'error',
                'error': str(e)
            }
    
    def _is_cached(self, key: str) -> bool:
        """Check if data is cached and still valid"""
        if key in self.cache:
            age = time.time() - self.cache[key]['timestamp']
            return age < self.cache_duration
        return False

# Global instance
meme_radar = MemeRadar()
