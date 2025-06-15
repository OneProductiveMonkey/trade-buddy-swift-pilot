
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translation dictionary
const translations: Record<string, Record<string, string>> = {
  en: {
    'trading.active': 'Trading Active',
    'trading.stopped': 'Trading Stopped',
    'settings.language_help': 'Interface language will change immediately after selection.',
    'portfolio.balance': 'Balance',
    'portfolio.profit': 'Profit',
    'signals.buy': 'BUY',
    'signals.sell': 'SELL',
    'controls.budget': 'Budget',
    'controls.strategy': 'Strategy',
    'controls.risk': 'Risk Level'
  },
  sv: {
    'trading.active': 'Trading Aktivt',
    'trading.stopped': 'Trading Stoppat',
    'settings.language_help': 'Gränssnittsspråket ändras omedelbart efter val.',
    'portfolio.balance': 'Saldo',
    'portfolio.profit': 'Vinst',
    'signals.buy': 'KÖP',
    'signals.sell': 'SÄLJ',
    'controls.budget': 'Budget',
    'controls.strategy': 'Strategi',
    'controls.risk': 'Risknivå'
  },
  es: {
    'trading.active': 'Trading Activo',
    'trading.stopped': 'Trading Detenido',
    'settings.language_help': 'El idioma de la interfaz cambiará inmediatamente después de la selección.',
    'portfolio.balance': 'Balance',
    'portfolio.profit': 'Ganancia',
    'signals.buy': 'COMPRAR',
    'signals.sell': 'VENDER',
    'controls.budget': 'Presupuesto',
    'controls.strategy': 'Estrategia',
    'controls.risk': 'Nivel de Riesgo'
  }
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState('en');

  const t = (key: string, fallback?: string): string => {
    return translations[language]?.[key] || fallback || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
