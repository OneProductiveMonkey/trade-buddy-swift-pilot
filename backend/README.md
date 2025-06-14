
# 🚀 Advanced AI Trading Bot

En avancerad trading bot med AI-signaler, arbitrage och multi-exchange stöd.

## ✨ Funktioner

- **Multi-Exchange Arbitrage**: Binance, KuCoin, Bybit, OKX, Coinbase
- **AI Trading Signals**: RSI, MACD, momentum, volymanalys
- **Strategirekommendationer**: AI-driven strategival
- **Live Dashboard**: Realtids status och performance
- **Säker API-hantering**: Miljövariabler och sandlåde-läge
- **Modulär arkitektur**: Lätt att utöka och underhålla

## 🚀 Snabbstart

### 1. Installation

```bash
# Klona repository
git clone <your-repo-url>
cd trading-bot

# Installera dependencies
pip install -r requirements.txt

# Kopiera environment fil
cp .env.example .env
```

### 2. Konfigurera API-nycklar

Redigera `.env` filen:

```bash
BINANCE_API_KEY=din_binance_api_nyckel
BINANCE_SECRET=din_binance_secret
BINANCE_SANDBOX=true  # Sätt till false för live trading
```

### 3. Starta applikationen

```bash
python app.py
```

Öppna webbläsaren och gå till: `http://localhost:5000`

## 🐳 Docker Deployment

```bash
# Bygg och starta
docker-compose up -d

# Visa loggar
docker-compose logs -f trading-bot
```

## 📊 API Endpoints

- `GET /api/enhanced_status` - Hämta bot status
- `POST /api/start_enhanced_trading` - Starta trading
- `POST /api/stop_enhanced_trading` - Stoppa trading
- `GET /api/ai_signals` - Hämta AI-signaler
- `GET /api/strategy_recommendation` - Få strategirekommendation
- `POST /api/auto_mode` - Aktivera auto-läge
- `GET /api/performance_summary` - Performance sammanfattning

## 🔧 Konfiguration

### Trading Strategier

1. **Arbitrage**: Utnyttjar prisskillnader mellan börser
2. **AI Signals**: Teknisk analys med AI
3. **Hybrid**: Kombination av arbitrage och AI
4. **Conservative**: Lågrisk-strategier endast
5. **Auto**: AI väljer optimal strategi

### Risk Nivåer

- **Low**: 0.3-0.8% profit threshold
- **Medium**: 0.5-1.5% profit threshold  
- **High**: 1.0-3.0% profit threshold

## 🔒 Säkerhet

- API-nycklar lagras som miljövariabler
- Sandlåde-läge för testning
- CORS-skydd aktiverat
- Input validering på alla endpoints

## 📈 Performance Monitoring

Bot:en spårar:
- Totala trades och vinst
- Win rate och genomsnittlig execution tid
- Arbitrage möjligheter i realtid
- AI signal prestanda

## 🛠️ Utveckling

### Projektstruktur

```
backend/
├── app.py              # Huvud Flask app
├── bot/
│   ├── core.py         # Kärnfunktionalitet
│   ├── exchanges.py    # Börs-hantering
│   ├── signals.py      # AI signal generation
│   └── strategy.py     # Trading strategier
├── requirements.txt    # Python dependencies
├── Dockerfile         # Docker konfiguration
└── README.md          # Denna fil
```

### Lägg till ny börs

1. Öppna `bot/exchanges.py`
2. Lägg till börs-konfiguration i `setup_exchanges()`
3. Testa anslutning

### Skapa ny strategi

1. Öppna `bot/strategy.py`
2. Implementera ny strategi-metod
3. Lägg till i `self.strategies` dict

## 🚨 Felsökning

### Vanliga problem

**API-anslutning misslyckas:**
- Kontrollera API-nycklar i `.env`
- Verifiera nätverksanslutning
- Kolla API-begränsningar

**Trade execution fel:**
- Kontrollera saldo
- Verifiera symbol format
- Kolla exchange status

### Loggar

```bash
# Visa alla loggar
tail -f trading_bot.log

# Bara error loggar  
grep ERROR trading_bot.log
```

## 📞 Support

- GitHub Issues: [Skapa issue](https://github.com/your-repo/issues)
- Discord: [Trading Bot Community](#)
- Email: support@tradingbot.com

## ⚠️ Varningar

- **ANVÄND ALDRIG RIKTIGA PENGAR UTAN GRUNDLIG TESTNING**
- Sätt alltid `BINANCE_SANDBOX=true` för testning
- Börja med små belopp
- Förstå risker med automatisk trading

## 📄 Licens

MIT License - Se LICENSE fil för detaljer.

---

**Gjord med ❤️ för trading community**
