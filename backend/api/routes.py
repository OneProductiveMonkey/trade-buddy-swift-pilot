
"""
FastAPI Routes - Enhanced with all core modules
Author: Mattiaz
Description: RESTful API for the comprehensive trading bot platform
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Dict, List, Any, Optional
import logging
import asyncio
from datetime import datetime

# Import all core modules
from ..core.engine import engine, TradingMode, StrategyType
from ..core.data import data_fetcher
from ..core.replay import trade_replay
from ..core.notify import notification_manager
from ..strategies.ai import AIStrategy
from ..strategies.arbitrage import ArbitrageStrategy
from ..strategies.auto import auto_engine
from ..strategies.meme import meme_radar
from ..wallets.metamask import metamask_wallet
from ..wallets.phantom import phantom_wallet

logger = logging.getLogger(__name__)

# Pydantic models for request/response
class TradingConfig(BaseModel):
    budget: float
    strategy: str
    risk_level: str
    mode: Optional[str] = "sandbox"

class TradeRequest(BaseModel):
    symbol: str
    side: str
    amount_usd: float
    strategy: Optional[str] = "manual"
    confidence: Optional[float] = 50.0

class WalletConnectRequest(BaseModel):
    wallet_type: str  # "metamask" or "phantom"
    address: str
    network: Optional[str] = None

class WebhookRequest(BaseModel):
    url: str

# Initialize FastAPI app
app = FastAPI(
    title="OPM MoneyMaker Trading Bot API",
    description="Production-ready crypto trading bot with AI signals, arbitrage, and wallet integration",
    version="3.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup event
@app.on_event("startup")
async def startup_event():
    """Initialize the trading bot on startup"""
    try:
        logger.info("🚀 Starting Enhanced Trading Bot API...")
        await engine.start()
        logger.info("✅ Enhanced Trading Bot API ready")
    except Exception as e:
        logger.error(f"Startup error: {e}")

# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    try:
        await engine.stop()
        await data_fetcher.close()
        logger.info("🛑 Enhanced Trading Bot API stopped")
    except Exception as e:
        logger.error(f"Shutdown error: {e}")

# Health check
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "engine_running": engine.is_running,
        "mode": engine.mode.value,
        "modules": {
            "auto_mode": True,
            "meme_radar": True,
            "trade_replay": True,
            "wallet_integration": True,
            "notifications": True
        }
    }

# Enhanced status endpoint
@app.get("/api/enhanced_status")
async def get_enhanced_status():
    """Get comprehensive bot status with all modules"""
    try:
        # Get bot status
        status = engine.get_status()
        
        # Get recent trade history
        trade_history = engine.get_trade_history(20)
        
        # Get current AI signals
        ai_strategy = AIStrategy()
        ai_signals = await ai_strategy.generate_signals(engine.market_data)
        
        # Get arbitrage opportunities
        arb_strategy = ArbitrageStrategy()
        arbitrage_opportunities = await arb_strategy.find_opportunities(engine.market_data)
        
        # Get auto mode status
        auto_status = auto_engine.get_status()
        
        # Get wallet status
        wallet_status = {
            'metamask': metamask_wallet.get_wallet_info(),
            'phantom': phantom_wallet.get_wallet_info()
        }
        
        return {
            "portfolio": status["portfolio"],
            "trading_active": status["is_running"],
            "mode": status["mode"],
            "ai_signals": [
                {
                    "coin": signal.symbol.split('/')[0],
                    "symbol": signal.symbol,
                    "direction": signal.direction,
                    "confidence": signal.confidence,
                    "current_price": signal.price,
                    "target_price": signal.target_price,
                    "risk_level": signal.risk_level,
                    "timeframe": "1-3 hours"
                }
                for signal in ai_signals[:5]
            ],
            "arbitrage_opportunities": arbitrage_opportunities[:5],
            "trade_log": [
                {
                    "timestamp": trade["timestamp"].strftime("%H:%M:%S") if isinstance(trade["timestamp"], datetime) else trade["timestamp"],
                    "symbol": trade["symbol"],
                    "side": trade["direction"].upper(),
                    "amount": trade["amount"],
                    "price": trade["price"],
                    "profit": trade["profit"],
                    "strategy": trade["strategy"],
                    "confidence": trade.get("confidence", 50)
                }
                for trade in trade_history
            ],
            "prices": engine.market_data,
            "auto_mode": auto_status,
            "wallets": wallet_status,
            "connection_status": {
                "active_exchanges": len([k for k, v in engine.market_data.items() if not k.startswith('_')]),
                "demo_exchanges": 3,
                "last_update": status["last_update"]
            }
        }
    except Exception as e:
        logger.error(f"Enhanced status error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Auto Mode endpoints
@app.get("/api/auto_mode")
async def get_auto_mode_status():
    """Get auto mode status and recommendations"""
    try:
        # Analyze current market conditions
        analysis = await auto_engine.analyze_market_conditions(engine.market_data)
        
        # Get strategy recommendation
        strategy, confidence, reason = await auto_engine.select_optimal_strategy(analysis)
        
        return {
            "enabled": engine.mode == TradingMode.AUTO,
            "current_strategy": auto_engine.current_strategy,
            "recommended_strategy": strategy,
            "confidence": confidence,
            "reason": reason,
            "market_analysis": analysis,
            "auto_status": auto_engine.get_status()
        }
    except Exception as e:
        logger.error(f"Auto mode status error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/activate_auto_mode")
async def activate_auto_mode():
    """Activate auto trading mode"""
    try:
        engine.set_mode("auto")
        
        if not engine.is_running:
            await engine.start()
        
        return {
            "success": True,
            "message": "Auto mode activated",
            "mode": engine.mode.value,
            "current_strategy": auto_engine.current_strategy
        }
    except Exception as e:
        logger.error(f"Auto mode activation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Meme Radar endpoints
@app.get("/api/meme_radar")
async def get_meme_radar():
    """Get trending meme coins with pump potential"""
    try:
        meme_data = await meme_radar.get_trending_memes()
        
        return {
            "trending_memes": meme_data,
            "total_analyzed": len(meme_data),
            "last_updated": datetime.now().isoformat(),
            "status": "success"
        }
    except Exception as e:
        logger.error(f"Meme radar error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Trade Replay endpoints
@app.get("/api/trade_replay")
async def get_trade_replay():
    """Get trade replay timeline and analytics"""
    try:
        # Get trade timeline
        trade_timeline = await trade_replay.get_trade_timeline(50)
        
        # Get performance metrics
        performance = await trade_replay.get_performance_metrics(7)
        
        return {
            "trades": trade_timeline,
            "performance_metrics": performance,
            "timeline_length": len(trade_timeline)
        }
    except Exception as e:
        logger.error(f"Trade replay error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Wallet endpoints
@app.post("/api/wallet/connect")
async def connect_wallet(request: WalletConnectRequest):
    """Connect MetaMask or Phantom wallet"""
    try:
        if request.wallet_type.lower() == "metamask":
            success, message = await metamask_wallet.connect_wallet(
                request.address, 
                request.network or "mainnet"
            )
        elif request.wallet_type.lower() == "phantom":
            success, message = await phantom_wallet.connect_wallet(
                request.address, 
                request.network or "mainnet-beta"
            )
        else:
            raise HTTPException(status_code=400, detail="Unsupported wallet type")
        
        if success:
            return {
                "success": True,
                "message": message,
                "wallet_info": (
                    metamask_wallet.get_wallet_info() if request.wallet_type.lower() == "metamask"
                    else phantom_wallet.get_wallet_info()
                )
            }
        else:
            raise HTTPException(status_code=400, detail=message)
            
    except Exception as e:
        logger.error(f"Wallet connection error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/wallet/status")
async def get_wallet_status():
    """Get status of all connected wallets"""
    try:
        return {
            "metamask": metamask_wallet.get_wallet_info(),
            "phantom": phantom_wallet.get_wallet_info()
        }
    except Exception as e:
        logger.error(f"Wallet status error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/wallet/disconnect/{wallet_type}")
async def disconnect_wallet(wallet_type: str):
    """Disconnect specified wallet"""
    try:
        if wallet_type.lower() == "metamask":
            await metamask_wallet.disconnect()
        elif wallet_type.lower() == "phantom":
            await phantom_wallet.disconnect()
        else:
            raise HTTPException(status_code=400, detail="Invalid wallet type")
        
        return {"success": True, "message": f"{wallet_type} disconnected"}
    except Exception as e:
        logger.error(f"Wallet disconnect error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Notification endpoints
@app.post("/api/notifications/webhook")
async def add_webhook(request: WebhookRequest):
    """Add webhook URL for notifications"""
    try:
        success = notification_manager.add_webhook(request.url)
        
        return {
            "success": success,
            "message": "Webhook added successfully" if success else "Failed to add webhook",
            "webhook_status": notification_manager.get_webhook_status()
        }
    except Exception as e:
        logger.error(f"Add webhook error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/notifications/status")
async def get_notification_status():
    """Get notification system status"""
    try:
        return {
            "webhook_status": notification_manager.get_webhook_status(),
            "recent_notifications": notification_manager.get_notification_history(10)
        }
    except Exception as e:
        logger.error(f"Notification status error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Keep existing endpoints...
@app.post("/api/start_enhanced_trading")
async def start_enhanced_trading(config: TradingConfig):
    """Start enhanced trading with configuration"""
    try:
        if config.budget < 100:
            raise HTTPException(status_code=400, detail="Minimum budget is $100")
        
        # Set trading mode
        if config.mode:
            engine.set_mode(config.mode)
        
        # Configure strategies
        if config.strategy == "arbitrage":
            engine.active_strategies = [StrategyType.ARBITRAGE]
        elif config.strategy == "ai_signals":
            engine.active_strategies = [StrategyType.AI_SIGNALS]
        elif config.strategy == "hybrid":
            engine.active_strategies = [StrategyType.ARBITRAGE, StrategyType.AI_SIGNALS]
        
        # Start the engine if not running
        if not engine.is_running:
            await engine.start()
        
        # Send notification
        await notification_manager.send_strategy_change_notification(
            "manual", config.strategy, 100, f"Trading started with ${config.budget} budget"
        )
        
        logger.info(f"🚀 Trading started - Budget: ${config.budget}, Strategy: {config.strategy}")
        
        return {
            "success": True,
            "message": f"Trading started with ${config.budget} budget using {config.strategy} strategy",
            "config": {
                "budget": config.budget,
                "strategy": config.strategy,
                "mode": engine.mode.value,
                "active_strategies": [s.value for s in engine.active_strategies]
            }
        }
    except Exception as e:
        logger.error(f"Start trading error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Keep other existing endpoints but enhance with notification calls...
@app.post("/api/stop_enhanced_trading")
async def stop_enhanced_trading():
    """Stop enhanced trading"""
    try:
        await engine.stop()
        logger.info("⏹️ Trading stopped")
        return {"success": True, "message": "Trading stopped"}
    except Exception as e:
        logger.error(f"Stop trading error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ... keep existing code (execute_enhanced_trade, etc.) ...

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)
