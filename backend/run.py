
#!/usr/bin/env python3
"""
Production runner for Enhanced Trading Bot
"""
import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add bot directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import app

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('DEBUG', 'false').lower() == 'true'
    
    print(f"🚀 Starting Enhanced Trading Bot on port {port}")
    print(f"📊 Debug mode: {debug}")
    print(f"🔑 Using Binance API: {'Yes' if os.getenv('BINANCE_API_KEY') else 'No (Demo mode)'}")
    
    app.run(
        host='0.0.0.0',
        port=port,
        debug=debug,
        threaded=True
    )
