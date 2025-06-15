
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Languages } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export const LanguageSettings: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();

  return (
    <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 shadow-xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-white flex items-center gap-2">
          <Languages className="w-5 h-5 text-blue-400" />
          {t('settings.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-gray-400 mb-3">{t('settings.language')}</p>
          <div className="flex gap-2">
            <Button
              onClick={() => setLanguage('en')}
              variant={language === 'en' ? 'default' : 'outline'}
              size="sm"
              className={language === 'en' ? 'bg-blue-600 hover:bg-blue-700' : 'border-gray-600 text-gray-300'}
            >
              {t('settings.english')}
              {language === 'en' && <Badge className="ml-2 bg-green-500">✓</Badge>}
            </Button>
            <Button
              onClick={() => setLanguage('sv')}
              variant={language === 'sv' ? 'default' : 'outline'}
              size="sm"
              className={language === 'sv' ? 'bg-blue-600 hover:bg-blue-700' : 'border-gray-600 text-gray-300'}
            >
              {t('settings.swedish')}
              {language === 'sv' && <Badge className="ml-2 bg-green-500">✓</Badge>}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
