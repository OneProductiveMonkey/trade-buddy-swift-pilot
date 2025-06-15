
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Languages } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export const LanguageSettings: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2">
        <Languages className="w-4 h-4 text-blue-400" />
        <span className="text-white font-medium">{t('settings.language')}</span>
      </div>
      <div className="flex space-x-2">
        <Button
          onClick={() => setLanguage('en')}
          variant={language === 'en' ? 'default' : 'outline'}
          size="sm"
          className={language === 'en' ? 'bg-blue-600 hover:bg-blue-700' : 'border-gray-600 text-gray-300 hover:bg-gray-700'}
        >
          English
          {language === 'en' && <Badge className="ml-2 bg-green-500 text-white">✓</Badge>}
        </Button>
        <Button
          onClick={() => setLanguage('sv')}
          variant={language === 'sv' ? 'default' : 'outline'}
          size="sm"
          className={language === 'sv' ? 'bg-blue-600 hover:bg-blue-700' : 'border-gray-600 text-gray-300 hover:bg-gray-700'}
        >
          Svenska
          {language === 'sv' && <Badge className="ml-2 bg-green-500 text-white">✓</Badge>}
        </Button>
      </div>
    </div>
  );
};
