
#!/usr/bin/env python3
"""
Live Trading Bot Startup Script
Ensures proper initialization and connection to exchanges
"""

import uvicorn
import logging
import sys
import os
from main import app, bot

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('trading_bot.log')
    ]
)

logger = logging.getLogger(__name__)

def main():
    """Start the live trading bot server"""
    logger.info("🚀 Initializing Live Trading Bot...")
    
    # Verify API keys are set
    binance_key = "Neyube4xusslnwpAqM7IaiphFvPqDL8oX0S7fOx2Q3Npiq7eKSGQKJnzvJTQ5jok"
    if binance_key:
        logger.info("✅ Binance API key configured")
    else:
        logger.warning("⚠️ Binance API key not found - using demo mode")
    
    # Start the server
    logger.info("🔄 Starting FastAPI server on http://localhost:5000")
    
    try:
        uvicorn.run(
            app,
            host="0.0.0.0",
            port=5000,
            log_level="info",
            reload=False,
            access_log=True
        )
    except KeyboardInterrupt:
        logger.info("👋 Shutting down trading bot...")
    except Exception as e:
        logger.error(f"❌ Server error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
