
import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'sv';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    // App Title
    'app.title': 'OPM MoneyMaker',
    'app.subtitle': 'Multi-Exchange Arbitrage & AI Signal Trading Platform',
    
    // Connection Status
    'connection.connected': 'Connected to {count} exchanges',
    'connection.demo': 'demo exchanges',
    'connection.error': 'Connection Error - using demo mode',
    'connection.initializing': 'Initializing...',
    
    // Portfolio
    'portfolio.balance': 'Portfolio Balance',
    'portfolio.liveProfit': 'Live Profit',
    'portfolio.performance24h': '24h Performance',
    'portfolio.winRate': 'Win Rate',
    'portfolio.totalTrades': 'Total Trades',
    'portfolio.activePositions': 'Active Positions',
    
    // Trading Controls
    'trading.start': 'Start Trading',
    'trading.stop': 'Stop Trading',
    'trading.active': 'Trading Active',
    'trading.stopped': 'Trading Stopped',
    
    // Tabs
    'tabs.overview': 'Overview',
    'tabs.signals': 'AI Signals',
    'tabs.strategy': 'Strategy',
    'tabs.performance': 'Performance',
    'tabs.memeRadar': 'Meme Radar',
    'tabs.replay': 'Trade Replay',
    
    // Auto Mode
    'autoMode.title': 'AI Auto Mode',
    'autoMode.activate': 'Activate Auto Mode',
    'autoMode.active': 'Auto Mode Active',
    'autoMode.confidence': 'Confidence',
    
    // Settings
    'settings.title': 'Settings',
    'settings.language': 'Language',
    'settings.english': 'English',
    'settings.swedish': 'Swedish'
  },
  sv: {
    // App Title
    'app.title': 'OPM MoneyMaker',
    'app.subtitle': 'Multi-Börs Arbitrage & AI Signal Trading Platform',
    
    // Connection Status
    'connection.connected': 'Ansluten till {count} börser',
    'connection.demo': 'demo börser',
    'connection.error': 'Anslutningsfel - använder demo-läge',
    'connection.initializing': 'Initialiserar...',
    
    // Portfolio
    'portfolio.balance': 'Portfolio Saldo',
    'portfolio.liveProfit': 'Live Vinst',
    'portfolio.performance24h': '24h Prestanda',
    'portfolio.winRate': 'Vinstprocent',
    'portfolio.totalTrades': 'Totala Trades',
    'portfolio.activePositions': 'Aktiva Positioner',
    
    // Trading Controls
    'trading.start': 'Starta Trading',
    'trading.stop': 'Stoppa Trading',
    'trading.active': 'Trading Aktiv',
    'trading.stopped': 'Trading Stoppad',
    
    // Tabs
    'tabs.overview': 'Översikt',
    'tabs.signals': 'AI Signaler',
    'tabs.strategy': 'Strategi',
    'tabs.performance': 'Prestanda',
    'tabs.memeRadar': 'Meme Radar',
    'tabs.replay': 'Trade Uppspelning',
    
    // Auto Mode
    'autoMode.title': 'AI Auto-läge',
    'autoMode.activate': 'Aktivera Auto-läge',
    'autoMode.active': 'Auto-läge Aktivt',
    'autoMode.confidence': 'Säkerhet',
    
    // Settings
    'settings.title': 'Inställningar',
    'settings.language': 'Språk',
    'settings.english': 'Engelska',
    'settings.swedish': 'Svenska'
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    const saved = localStorage.getItem('opm-language');
    if (saved === 'sv' || saved === 'en') {
      setLanguage(saved);
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('opm-language', lang);
  };

  const t = (key: string): string => {
    const translation = translations[language][key];
    if (!translation) {
      console.warn(`Missing translation for key: ${key}`);
      return key;
    }
    return translation;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
