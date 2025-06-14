
"""
Exchange connection and price fetching functionality
"""
import ccxt
import asyncio
import logging
from typing import Dict, List, Optional
from concurrent.futures import ThreadPoolExecutor
import numpy as np
import os

logger = logging.getLogger(__name__)

class ExchangeManager:
    def __init__(self):
        self.exchanges = {}
        self.executor = ThreadPoolExecutor(max_workers=10)
        self.setup_exchanges()
        
    def setup_exchanges(self):
        """Setup exchange connections with API keys from environment"""
        try:
            # Binance
            if os.getenv('BINANCE_API_KEY'):
                self.exchanges['binance'] = ccxt.binance({
                    'apiKey': os.getenv('BINANCE_API_KEY'),
                    'secret': os.getenv('BINANCE_SECRET'),
                    'sandbox': os.getenv('BINANCE_SANDBOX', 'false').lower() == 'true',
                    'enableRateLimit': True,
                    'options': {'defaultType': 'spot'}
                })
            else:
                self.exchanges['binance'] = 'demo'
                
            # Add other exchanges
            self.exchanges.update({
                'coinbase': 'demo',
                'kucoin': 'demo',
                'okx': 'demo',
                'bybit': 'demo'
            })
            
            # Test connections
            self._test_connections()
            
        except Exception as e:
            logger.error(f"Exchange setup failed: {e}")
            # Fallback to demo mode
            self.exchanges = {name: 'demo' for name in ['binance', 'coinbase', 'kucoin', 'okx', 'bybit']}
    
    def _test_connections(self):
        """Test exchange connections"""
        active_exchanges = {}
        for name, exchange in self.exchanges.items():
            if exchange != 'demo':
                try:
                    exchange.load_markets()
                    active_exchanges[name] = exchange
                    logger.info(f"✅ Connected to {name}")
                except Exception as e:
                    logger.warning(f"❌ Failed to connect to {name}: {e}")
                    active_exchanges[name] = 'demo'
            else:
                active_exchanges[name] = exchange
        
        self.exchanges = active_exchanges
    
    def get_prices_parallel(self, symbol: str) -> Dict[str, float]:
        """Fetch prices from all exchanges in parallel"""
        def fetch_price(exchange_name: str, exchange):
            try:
                if exchange == 'demo':
                    return self._get_demo_price(symbol)
                else:
                    ticker = exchange.fetch_ticker(symbol)
                    return float(ticker['last'])
            except Exception as e:
                logger.error(f"Failed to fetch {symbol} from {exchange_name}: {e}")
                return self._get_demo_price(symbol)
        
        # Fetch prices in parallel
        futures = []
        for name, exchange in self.exchanges.items():
            future = self.executor.submit(fetch_price, name, exchange)
            futures.append((name, future))
        
        exchange_prices = {}
        for name, future in futures:
            try:
                price = future.result(timeout=5)
                exchange_prices[name] = price
            except Exception as e:
                logger.error(f"Timeout fetching price from {name}: {e}")
                if exchange_prices:
                    exchange_prices[name] = np.mean(list(exchange_prices.values()))
        
        return exchange_prices
    
    def _get_demo_price(self, symbol: str) -> float:
        """Generate demo prices with realistic variations"""
        base_prices = {
            'BTC/USDT': 43000,
            'ETH/USDT': 2600,
            'SOL/USDT': 100,
            'ADA/USDT': 0.5,
            'DOT/USDT': 7.5
        }
        base = base_prices.get(symbol, 1000)
        return base + np.random.normal(0, base * 0.002)  # 0.2% variation
    
    def find_arbitrage_opportunities(self, symbols: List[str], min_profit_threshold: float = 0.3) -> List[Dict]:
        """Find arbitrage opportunities across exchanges"""
        opportunities = []
        
        for symbol in symbols:
            try:
                exchange_prices = self.get_prices_parallel(symbol)
                
                if len(exchange_prices) < 2:
                    continue
                
                # Find best buy/sell combinations
                for buy_exchange, buy_price in exchange_prices.items():
                    for sell_exchange, sell_price in exchange_prices.items():
                        if buy_exchange != sell_exchange:
                            profit_pct = ((sell_price - buy_price) / buy_price) * 100
                            
                            if profit_pct > min_profit_threshold:
                                opportunities.append({
                                    'symbol': symbol,
                                    'buy_exchange': buy_exchange,
                                    'sell_exchange': sell_exchange,
                                    'buy_price': buy_price,
                                    'sell_price': sell_price,
                                    'profit_pct': round(profit_pct, 3),
                                    'profit_usd': round((sell_price - buy_price) * 10, 2),  # Assume 10 units
                                    'confidence': min(0.9, profit_pct / min_profit_threshold * 0.6)
                                })
                                
            except Exception as e:
                logger.error(f"Error finding arbitrage for {symbol}: {e}")
        
        return sorted(opportunities, key=lambda x: x['profit_pct'], reverse=True)
    
    def get_connection_status(self) -> Dict:
        """Get connection status for all exchanges"""
        active_exchanges = len([ex for ex in self.exchanges.values() if ex != 'demo'])
        demo_exchanges = len([ex for ex in self.exchanges.values() if ex == 'demo'])
        
        return {
            'total_exchanges': len(self.exchanges),
            'active_exchanges': active_exchanges,
            'demo_exchanges': demo_exchanges,
            'exchanges': list(self.exchanges.keys())
        }
