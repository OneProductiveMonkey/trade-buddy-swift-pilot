
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';
import { Globe } from 'lucide-react';

export const LanguageSettings: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'sv', name: 'Svenska', flag: '🇸🇪' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Globe className="w-5 h-5 text-blue-400" />
        <h3 className="text-lg font-semibold text-white">Language Settings</h3>
      </div>
      
      <div className="space-y-2">
        <Label className="text-gray-300">Select Language</Label>
        <Select value={language} onValueChange={setLanguage}>
          <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
            <SelectValue placeholder="Choose language" />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700">
            {languages.map((lang) => (
              <SelectItem key={lang.code} value={lang.code} className="text-white hover:bg-gray-700">
                <span className="flex items-center space-x-2">
                  <span>{lang.flag}</span>
                  <span>{lang.name}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="text-sm text-gray-400">
        <p>{t('settings.language_help', 'Interface language will change immediately after selection.')}</p>
      </div>
    </div>
  );
};
