
"""
FastAPI Routes - Trading Bot API Endpoints
Author: Mattiaz
Description: RESTful API for the trading bot
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Dict, List, Any, Optional
import logging
import asyncio
from datetime import datetime

from ..core.engine import engine, TradingMode, StrategyType
from ..core.data import data_fetcher
from ..strategies.ai import AIStrategy
from ..strategies.arbitrage import ArbitrageStrategy

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

class AutoModeConfig(BaseModel):
    enabled: bool
    strategies: List[str]
    max_budget: float
    risk_level: str

# Initialize FastAPI app
app = FastAPI(
    title="OPM MoneyMaker Trading Bot API",
    description="Advanced crypto trading bot with AI signals and arbitrage",
    version="2.0.0"
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
        logger.info("🚀 Starting Trading Bot API...")
        await engine.start()
        logger.info("✅ Trading Bot API ready")
    except Exception as e:
        logger.error(f"Startup error: {e}")

# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    try:
        await engine.stop()
        await data_fetcher.close()
        logger.info("🛑 Trading Bot API stopped")
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
        "uptime": "online"
    }

# Enhanced status endpoint
@app.get("/api/enhanced_status")
async def get_enhanced_status():
    """Get comprehensive bot status"""
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
            "connection_status": {
                "active_exchanges": len([k for k, v in engine.market_data.items() if not k.startswith('_')]),
                "demo_exchanges": 3,
                "last_update": status["last_update"]
            }
        }
    except Exception as e:
        logger.error(f"Enhanced status error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Start trading
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

# Stop trading
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

# Execute trade
@app.post("/api/execute_enhanced_trade")
async def execute_enhanced_trade(trade_request: TradeRequest):
    """Execute a trading order"""
    try:
        # Create a mock signal for execution
        from ..core.engine import TradeSignal
        
        signal = TradeSignal(
            symbol=trade_request.symbol,
            direction=trade_request.side,
            confidence=trade_request.confidence,
            price=0,  # Will be fetched from market data
            target_price=0,  # Will be calculated
            strategy=StrategyType.AI_SIGNALS,
            timestamp=datetime.now(),
            risk_level="Medium Risk"
        )
        
        # Execute the signal
        await engine._execute_signal(signal)
        
        return {
            "success": True,
            "message": f"✅ {trade_request.side.upper()} order executed for {trade_request.symbol}"
        }
    except Exception as e:
        logger.error(f"Trade execution error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Get market data
@app.get("/api/market_data")
async def get_market_data():
    """Get current market data"""
    try:
        market_data = await data_fetcher.get_all_prices()
        return market_data
    except Exception as e:
        logger.error(f"Market data error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Auto mode endpoints
@app.get("/api/auto_mode")
async def get_auto_mode_status():
    """Get auto mode status"""
    return {
        "enabled": engine.mode == TradingMode.AUTO,
        "strategies": [s.value for s in engine.active_strategies],
        "performance": {
            "trades_today": len(engine.trade_history),
            "profit_today": sum(t.get('profit', 0) for t in engine.trade_history),
            "win_rate": engine.portfolio.win_rate
        }
    }

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
            "mode": engine.mode.value
        }
    except Exception as e:
        logger.error(f"Auto mode activation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Strategy endpoints
@app.get("/api/strategy_recommendation")
async def get_strategy_recommendation():
    """Get AI strategy recommendation"""
    try:
        ai_strategy = AIStrategy()
        
        # Analyze current market conditions
        signals = await ai_strategy.generate_signals(engine.market_data)
        
        # Determine best strategy based on market conditions
        if len(signals) > 3 and any(s.confidence > 80 for s in signals):
            recommendation = "ai_signals"
            reason = "High confidence AI signals available"
        else:
            arb_strategy = ArbitrageStrategy()
            opportunities = await arb_strategy.find_opportunities(engine.market_data)
            
            if len(opportunities) > 2:
                recommendation = "arbitrage"
                reason = "Multiple arbitrage opportunities detected"
            else:
                recommendation = "hybrid"
                reason = "Balanced market conditions"
        
        return {
            "recommended_strategy": recommendation,
            "reason": reason,
            "confidence": 75,
            "market_conditions": "normal",
            "available_signals": len(signals),
            "available_arbitrage": len(opportunities) if 'opportunities' in locals() else 0
        }
    except Exception as e:
        logger.error(f"Strategy recommendation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Performance endpoints
@app.get("/api/performance_summary")
async def get_performance_summary():
    """Get trading performance summary"""
    try:
        status = engine.get_status()
        trade_history = engine.get_trade_history(100)
        
        # Calculate performance metrics
        total_profit = sum(t.get('profit', 0) for t in trade_history)
        profitable_trades = [t for t in trade_history if t.get('profit', 0) > 0]
        
        return {
            "metrics": {
                "total_trades": len(trade_history),
                "successful_trades": len(profitable_trades),
                "total_profit": total_profit,
                "win_rate": (len(profitable_trades) / len(trade_history) * 100) if trade_history else 0,
                "avg_trade_time": 2.3,  # Simulated
                "best_trade": max((t.get('profit', 0) for t in trade_history), default=0),
                "avg_profit_per_trade": total_profit / len(trade_history) if trade_history else 0
            },
            "status": "active" if engine.is_running else "inactive",
            "uptime": 7200  # Simulated uptime in seconds
        }
    except Exception as e:
        logger.error(f"Performance summary error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Trade replay endpoint
@app.get("/api/trade_replay")
async def get_trade_replay():
    """Get trade replay data"""
    try:
        trade_history = engine.get_trade_history(50)
        
        replay_data = []
        running_balance = 10000
        
        for trade in trade_history:
            running_balance += trade.get('profit', 0)
            
            replay_data.append({
                "timestamp": trade["timestamp"].isoformat() if isinstance(trade["timestamp"], datetime) else trade["timestamp"],
                "action": trade["direction"],
                "symbol": trade["symbol"],
                "price": trade["price"],
                "profit": trade.get("profit", 0),
                "balance": running_balance,
                "strategy": trade.get("strategy", "manual")
            })
        
        return {
            "trades": replay_data,
            "summary": {
                "total_trades": len(replay_data),
                "final_balance": running_balance,
                "total_profit": running_balance - 10000,
                "timespan": "24h"
            }
        }
    except Exception as e:
        logger.error(f"Trade replay error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)
