
"""
Webhook Notification System
Author: Mattiaz
Description: Send notifications on trades and strategy changes
"""

import logging
import aiohttp
import asyncio
from typing import Dict, List, Optional
from datetime import datetime
import json

logger = logging.getLogger(__name__)

class NotificationManager:
    def __init__(self):
        self.webhook_urls = []
        self.notification_history = []
        self.max_history = 100
        
    def add_webhook(self, url: str) -> bool:
        """Add a webhook URL for notifications"""
        try:
            if url and url.startswith(('http://', 'https://')):
                if url not in self.webhook_urls:
                    self.webhook_urls.append(url)
                    logger.info(f"Webhook added: {url}")
                    return True
                else:
                    logger.info(f"Webhook already exists: {url}")
                    return True
            else:
                logger.warning(f"Invalid webhook URL: {url}")
                return False
        except Exception as e:
            logger.error(f"Failed to add webhook: {e}")
            return False
    
    def remove_webhook(self, url: str) -> bool:
        """Remove a webhook URL"""
        try:
            if url in self.webhook_urls:
                self.webhook_urls.remove(url)
                logger.info(f"Webhook removed: {url}")
                return True
            return False
        except Exception as e:
            logger.error(f"Failed to remove webhook: {e}")
            return False
    
    async def send_trade_notification(self, trade_data: Dict):
        """Send notification for trade execution"""
        try:
            notification = {
                'type': 'trade_executed',
                'timestamp': datetime.now().isoformat(),
                'data': {
                    'symbol': trade_data.get('symbol', 'Unknown'),
                    'side': trade_data.get('side', 'Unknown'),
                    'amount': trade_data.get('amount', 0),
                    'price': trade_data.get('price', 0),
                    'profit': trade_data.get('profit', 0),
                    'strategy': trade_data.get('strategy', 'manual'),
                    'confidence': trade_data.get('confidence', 0),
                    'exchange': trade_data.get('exchange', 'unknown')
                },
                'message': f"Trade executed: {trade_data.get('side', '').upper()} {trade_data.get('symbol', '')} - Profit: ${trade_data.get('profit', 0):.2f}"
            }
            
            await self._send_notification(notification)
            
        except Exception as e:
            logger.error(f"Failed to send trade notification: {e}")
    
    async def send_strategy_change_notification(self, old_strategy: str, new_strategy: str, confidence: float, reason: str):
        """Send notification for strategy changes"""
        try:
            notification = {
                'type': 'strategy_changed',
                'timestamp': datetime.now().isoformat(),
                'data': {
                    'old_strategy': old_strategy,
                    'new_strategy': new_strategy,
                    'confidence': confidence,
                    'reason': reason
                },
                'message': f"Strategy changed from {old_strategy} to {new_strategy} (Confidence: {confidence:.1f}%) - {reason}"
            }
            
            await self._send_notification(notification)
            
        except Exception as e:
            logger.error(f"Failed to send strategy change notification: {e}")
    
    async def send_profit_alert(self, profit_amount: float, total_profit: float, timeframe: str):
        """Send notification for significant profit events"""
        try:
            notification = {
                'type': 'profit_alert',
                'timestamp': datetime.now().isoformat(),
                'data': {
                    'profit_amount': profit_amount,
                    'total_profit': total_profit,
                    'timeframe': timeframe
                },
                'message': f"Profit Alert: ${profit_amount:.2f} earned in {timeframe}. Total profit: ${total_profit:.2f}"
            }
            
            await self._send_notification(notification)
            
        except Exception as e:
            logger.error(f"Failed to send profit alert: {e}")
    
    async def send_opportunity_alert(self, opportunity_data: Dict):
        """Send notification for new trading opportunities"""
        try:
            notification = {
                'type': 'opportunity_found',
                'timestamp': datetime.now().isoformat(),
                'data': opportunity_data,
                'message': f"New opportunity: {opportunity_data.get('symbol', '')} - {opportunity_data.get('profit_pct', 0):.2f}% profit potential"
            }
            
            await self._send_notification(notification)
            
        except Exception as e:
            logger.error(f"Failed to send opportunity alert: {e}")
    
    async def _send_notification(self, notification: Dict):
        """Send notification to all configured webhooks"""
        try:
            # Store in history
            self.notification_history.append(notification)
            if len(self.notification_history) > self.max_history:
                self.notification_history.pop(0)
            
            # Send to all webhooks
            if not self.webhook_urls:
                logger.debug("No webhooks configured, notification stored in history only")
                return
            
            tasks = []
            for webhook_url in self.webhook_urls:
                task = self._send_to_webhook(webhook_url, notification)
                tasks.append(task)
            
            # Send to all webhooks concurrently
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Log results
            success_count = sum(1 for result in results if result is True)
            logger.info(f"Notification sent to {success_count}/{len(self.webhook_urls)} webhooks")
            
        except Exception as e:
            logger.error(f"Failed to send notification: {e}")
    
    async def _send_to_webhook(self, webhook_url: str, notification: Dict) -> bool:
        """Send notification to a specific webhook"""
        try:
            # Prepare payload
            payload = {
                'text': notification['message'],
                'timestamp': notification['timestamp'],
                'type': notification['type'],
                'data': notification['data']
            }
            
            # Add Discord-specific formatting if URL contains discord
            if 'discord' in webhook_url.lower():
                payload = {
                    'content': notification['message'],
                    'embeds': [{
                        'title': f"Trading Bot - {notification['type'].replace('_', ' ').title()}",
                        'description': notification['message'],
                        'color': 0x00ff00 if 'profit' in notification['type'] else 0x0099ff,
                        'timestamp': notification['timestamp'],
                        'fields': [
                            {'name': key.replace('_', ' ').title(), 'value': str(value), 'inline': True}
                            for key, value in notification['data'].items()
                            if isinstance(value, (str, int, float))
                        ][:10]  # Limit to 10 fields
                    }]
                }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    webhook_url,
                    json=payload,
                    timeout=10,
                    headers={'Content-Type': 'application/json'}
                ) as response:
                    if response.status in [200, 204]:
                        logger.debug(f"Webhook notification sent successfully to {webhook_url}")
                        return True
                    else:
                        logger.warning(f"Webhook returned {response.status}: {webhook_url}")
                        return False
                        
        except Exception as e:
            logger.error(f"Failed to send to webhook {webhook_url}: {e}")
            return False
    
    def get_webhook_status(self) -> Dict:
        """Get webhook configuration status"""
        return {
            'configured_webhooks': len(self.webhook_urls),
            'webhook_urls': [url[:50] + '...' if len(url) > 50 else url for url in self.webhook_urls],
            'recent_notifications': len(self.notification_history),
            'last_notification': self.notification_history[-1]['timestamp'] if self.notification_history else None
        }
    
    def get_notification_history(self, limit: int = 20) -> List[Dict]:
        """Get recent notification history"""
        return self.notification_history[-limit:] if self.notification_history else []

# Global instance
notification_manager = NotificationManager()
