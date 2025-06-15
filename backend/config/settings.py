
"""
Configuration Settings
Author: Mattiaz
Description: Environment and configuration management
"""

import os
from typing import Dict, Any
from dataclasses import dataclass

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
    
    # Strategies
    AI_MIN_CONFIDENCE: float = 60.0
    ARBITRAGE_MIN_PROFIT: float = 0.3
    
    # Rate Limits
    API_RATE_LIMIT: int = 100  # requests per minute
    PRICE_UPDATE_INTERVAL: int = 5  # seconds
    STRATEGY_RUN_INTERVAL: int = 15  # seconds

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
    
    return config

# Global config instance
settings = load_config()
