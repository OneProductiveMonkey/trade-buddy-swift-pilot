
interface NotificationConfig {
  email?: string;
  webhook?: string;
  discord?: string;
  telegram?: string;
}

interface TradeNotification {
  type: 'trade_executed' | 'profit_alert' | 'loss_alert' | 'opportunity_found';
  title: string;
  message: string;
  data?: any;
  timestamp: string;
}

class NotificationService {
  private config: NotificationConfig = {};
  private notificationHistory: TradeNotification[] = [];

  setConfig(config: NotificationConfig) {
    this.config = config;
    localStorage.setItem('notification_config', JSON.stringify(config));
  }

  getConfig(): NotificationConfig {
    const saved = localStorage.getItem('notification_config');
    return saved ? JSON.parse(saved) : {};
  }

  async sendNotification(notification: TradeNotification) {
    this.notificationHistory.unshift(notification);
    
    // Browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico'
      });
    }

    // Webhook notification
    if (this.config.webhook) {
      try {
        await fetch(this.config.webhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `${notification.title}\n${notification.message}`,
            timestamp: notification.timestamp,
            data: notification.data
          })
        });
      } catch (error) {
        console.error('Webhook notification error:', error);
      }
    }

    // Email notification (via backend)
    if (this.config.email) {
      try {
        await fetch('/api/send_notification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: this.config.email,
            notification
          })
        });
      } catch (error) {
        console.error('Email notification error:', error);
      }
    }
  }

  async requestPermission() {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }

  getNotificationHistory(): TradeNotification[] {
    return this.notificationHistory.slice(0, 50); // Last 50 notifications
  }

  // Convenience methods for different notification types
  async notifyTradeExecuted(trade: any) {
    await this.sendNotification({
      type: 'trade_executed',
      title: `Trade Genomförd: ${trade.symbol}`,
      message: `${trade.side.toUpperCase()} ${trade.amount} ${trade.symbol} för $${trade.price}`,
      data: trade,
      timestamp: new Date().toISOString()
    });
  }

  async notifyProfitAlert(profit: number, strategy: string) {
    await this.sendNotification({
      type: 'profit_alert',
      title: '💰 Vinstlarm!',
      message: `${strategy} genererade $${profit.toFixed(2)} i vinst`,
      data: { profit, strategy },
      timestamp: new Date().toISOString()
    });
  }

  async notifyOpportunity(opportunity: any) {
    await this.sendNotification({
      type: 'opportunity_found',
      title: `🚀 Ny Möjlighet: ${opportunity.symbol}`,
      message: `${opportunity.profit_pct}% profit potential upptäckt`,
      data: opportunity,
      timestamp: new Date().toISOString()
    });
  }
}

export const notificationService = new NotificationService();
