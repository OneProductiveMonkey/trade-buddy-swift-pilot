
"""
Configuration Settings - Enhanced with new modules
Author: Mattiaz
Description: Environment and configuration management for all trading bot modules
"""

import os
from typing import Dict, Any
from dataclasses import dataclass, field

@dataclass
class TradingConfig:
    # API Configuration
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 5000
    DEBUG: bool = True
    
    # Trading Configuration
    DEFAULT_BALANCE: float = 10000.0
    MIN_TRADE_AMOUNT: float = 100.0
    MAX_TRADE_AMOUNT: float = 1000.0
    DEFAULT_RISK_LEVEL: str = "medium"
    
    # Exchange API Keys (demo mode for now)
    BINANCE_API_KEY: str = ""
    BINANCE_SECRET: str = ""
    COINBASE_API_KEY: str = ""
    COINBASE_SECRET: str = ""
    
    # Database
    DATABASE_URL: str = "sqlite:///trading_bot.db"
    TRADES_DB_PATH: str = "trades.db"
    
    # Strategies
    AI_MIN_CONFIDENCE: float = 60.0
    ARBITRAGE_MIN_PROFIT: float = 0.3
    AUTO_MODE_ENABLED: bool = True
    
    # Rate Limits
    API_RATE_LIMIT: int = 100  # requests per minute
    PRICE_UPDATE_INTERVAL: int = 5  # seconds
    STRATEGY_RUN_INTERVAL: int = 15  # seconds
    
    # Meme Radar Configuration
    MEME_RADAR_ENABLED: bool = True
    MEME_MAX_MARKET_CAP: float = 100_000_000  # $100M max market cap
    MEME_MIN_VOLUME: float = 1_000_000  # $1M min 24h volume
    MEME_CACHE_DURATION: int = 120  # 2 minutes
    
    # Wallet Configuration
    METAMASK_NETWORK: str = "mainnet"  # mainnet, goerli, sepolia
    PHANTOM_NETWORK: str = "mainnet-beta"  # mainnet-beta, testnet, devnet
    WALLET_TESTNET_MODE: bool = True
    
    # Notification Configuration
    WEBHOOK_ENABLED: bool = True
    WEBHOOK_TIMEOUT: int = 10  # seconds
    MAX_NOTIFICATION_HISTORY: int = 100
    
    # Auto Mode Configuration
    AUTO_VOLATILITY_THRESHOLD: float = 0.6
    AUTO_SPREAD_THRESHOLD: float = 0.5
    AUTO_CONFIDENCE_MIN: float = 70.0
    
    # Trade Replay Configuration
    REPLAY_MAX_TRADES: int = 100
    REPLAY_METRICS_DAYS: int = 7

def load_config() -> TradingConfig:
    """Load configuration from environment variables"""
    config = TradingConfig()
    
    # Load from environment if available
    config.API_HOST = os.getenv('API_HOST', config.API_HOST)
    config.API_PORT = int(os.getenv('API_PORT', config.API_PORT))
    config.DEBUG = os.getenv('DEBUG', 'true').lower() == 'true'
    
    # Trading config
    config.DEFAULT_BALANCE = float(os.getenv('DEFAULT_BALANCE', config.DEFAULT_BALANCE))
    config.MIN_TRADE_AMOUNT = float(os.getenv('MIN_TRADE_AMOUNT', config.MIN_TRADE_AMOUNT))
    config.MAX_TRADE_AMOUNT = float(os.getenv('MAX_TRADE_AMOUNT', config.MAX_TRADE_AMOUNT))
    
    # API Keys
    config.BINANCE_API_KEY = os.getenv('BINANCE_API_KEY', '')
    config.BINANCE_SECRET = os.getenv('BINANCE_SECRET', '')
    config.COINBASE_API_KEY = os.getenv('COINBASE_API_KEY', '')
    config.COINBASE_SECRET = os.getenv('COINBASE_SECRET', '')
    
    # Database
    config.DATABASE_URL = os.getenv('DATABASE_URL', config.DATABASE_URL)
    config.TRADES_DB_PATH = os.getenv('TRADES_DB_PATH', config.TRADES_DB_PATH)
    
    # Strategy settings
    config.AI_MIN_CONFIDENCE = float(os.getenv('AI_MIN_CONFIDENCE', config.AI_MIN_CONFIDENCE))
    config.ARBITRAGE_MIN_PROFIT = float(os.getenv('ARBITRAGE_MIN_PROFIT', config.ARBITRAGE_MIN_PROFIT))
    config.AUTO_MODE_ENABLED = os.getenv('AUTO_MODE_ENABLED', 'true').lower() == 'true'
    
    # Meme radar settings
    config.MEME_RADAR_ENABLED = os.getenv('MEME_RADAR_ENABLED', 'true').lower() == 'true'
    config.MEME_MAX_MARKET_CAP = float(os.getenv('MEME_MAX_MARKET_CAP', config.MEME_MAX_MARKET_CAP))
    config.MEME_MIN_VOLUME = float(os.getenv('MEME_MIN_VOLUME', config.MEME_MIN_VOLUME))
    
    # Wallet settings
    config.METAMASK_NETWORK = os.getenv('METAMASK_NETWORK', config.METAMASK_NETWORK)
    config.PHANTOM_NETWORK = os.getenv('PHANTOM_NETWORK', config.PHANTOM_NETWORK)
    config.WALLET_TESTNET_MODE = os.getenv('WALLET_TESTNET_MODE', 'true').lower() == 'true'
    
    # Notification settings
    config.WEBHOOK_ENABLED = os.getenv('WEBHOOK_ENABLED', 'true').lower() == 'true'
    config.WEBHOOK_TIMEOUT = int(os.getenv('WEBHOOK_TIMEOUT', config.WEBHOOK_TIMEOUT))
    
    # Auto mode settings
    config.AUTO_VOLATILITY_THRESHOLD = float(os.getenv('AUTO_VOLATILITY_THRESHOLD', config.AUTO_VOLATILITY_THRESHOLD))
    config.AUTO_SPREAD_THRESHOLD = float(os.getenv('AUTO_SPREAD_THRESHOLD', config.AUTO_SPREAD_THRESHOLD))
    config.AUTO_CONFIDENCE_MIN = float(os.getenv('AUTO_CONFIDENCE_MIN', config.AUTO_CONFIDENCE_MIN))
    
    return config

# Global config instance
settings = load_config()
