
interface TrendingCoin {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap_rank: number;
  total_volume: number;
  sentiment_score?: number;
}

interface MemeAnalysis {
  coin: TrendingCoin;
  pump_potential: number;
  volume_spike: number;
  social_mentions: number;
  risk_level: 'low' | 'medium' | 'high';
}

class MarketDataService {
  private coingeckoBase = 'https://api.coingecko.com/api/v3';
  private cmcApiKey = process.env.VITE_CMC_API_KEY || '';

  async getTrendingCoins(): Promise<TrendingCoin[]> {
    try {
      const response = await fetch(`${this.coingeckoBase}/coins/markets?vs_currency=usd&order=volume_desc&per_page=50&page=1&sparkline=false&price_change_percentage=24h`);
      
      if (!response.ok) throw new Error('CoinGecko API fel');
      
      const data = await response.json();
      return data.map((coin: any) => ({
        id: coin.id,
        symbol: coin.symbol,
        name: coin.name,
        image: coin.image,
        current_price: coin.current_price,
        price_change_percentage_24h: coin.price_change_percentage_24h,
        market_cap_rank: coin.market_cap_rank,
        total_volume: coin.total_volume
      }));
    } catch (error) {
      console.error('Trending coins error:', error);
      return [];
    }
  }

  async getMemeCoins(): Promise<TrendingCoin[]> {
    try {
      // Fokusera på low-cap coins med hög volym
      const response = await fetch(`${this.coingeckoBase}/coins/markets?vs_currency=usd&order=volume_desc&per_page=100&page=1&price_change_percentage=24h&category=meme-token`);
      
      if (!response.ok) throw new Error('Meme coins API fel');
      
      const data = await response.json();
      return data.filter((coin: any) => 
        coin.market_cap < 100000000 && // Under $100M market cap
        coin.total_volume > 1000000 // Over $1M volume
      ).slice(0, 20);
    } catch (error) {
      console.error('Meme coins error:', error);
      return [];
    }
  }

  async analyzeMemeOpportunities(coins: TrendingCoin[]): Promise<MemeAnalysis[]> {
    return coins.map(coin => {
      // Enkel algoritm för pump-potential
      const volumeRatio = coin.total_volume / (coin.current_price * 1000000);
      const priceChange = Math.abs(coin.price_change_percentage_24h || 0);
      
      const pump_potential = Math.min(100, (volumeRatio * 10 + priceChange * 2));
      const volume_spike = volumeRatio > 5 ? volumeRatio : 0;
      
      let risk_level: 'low' | 'medium' | 'high' = 'medium';
      if (pump_potential > 70) risk_level = 'high';
      if (pump_potential < 30) risk_level = 'low';

      return {
        coin,
        pump_potential: Math.round(pump_potential),
        volume_spike: Math.round(volume_spike),
        social_mentions: Math.floor(Math.random() * 1000), // Placeholder
        risk_level
      };
    }).sort((a, b) => b.pump_potential - a.pump_potential);
  }

  async getSentimentAnalysis(coinId: string): Promise<{ score: number; summary: string } | null> {
    try {
      // Använd CoinGecko's social data
      const response = await fetch(`${this.coingeckoBase}/coins/${coinId}?localization=false&tickers=false&market_data=false&community_data=true&developer_data=false&sparkline=false`);
      
      if (!response.ok) return null;
      
      const data = await response.json();
      const social = data.community_data;
      
      // Beräkna sentiment score baserat på social aktivitet
      const twitterFollowers = social?.twitter_followers || 0;
      const redditSubscribers = social?.reddit_subscribers || 0;
      const telegramUsers = social?.telegram_channel_user_count || 0;
      
      const socialScore = Math.min(100, (twitterFollowers / 1000 + redditSubscribers / 100 + telegramUsers / 100));
      
      let summary = 'Neutral sentiment';
      if (socialScore > 70) summary = 'Mycket positivt sentiment';
      else if (socialScore > 40) summary = 'Positivt sentiment';
      else if (socialScore < 20) summary = 'Negativt sentiment';
      
      return {
        score: Math.round(socialScore),
        summary
      };
    } catch (error) {
      console.error('Sentiment analysis error:', error);
      return null;
    }
  }
}

export const marketDataService = new MarketDataService();
