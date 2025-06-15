
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { User, Settings, Bell, Shield, Database, Trash2 } from 'lucide-react';

export const UserSettings: React.FC = () => {
  const [notifications, setNotifications] = useState(true);
  const [autoMode, setAutoMode] = useState(false);
  const [riskTolerance, setRiskTolerance] = useState('medium');
  const [language, setLanguage] = useState('sv');
  const [theme, setTheme] = useState('dark');

  const handleSaveSettings = () => {
    const settings = {
      notifications,
      autoMode,
      riskTolerance,
      language,
      theme
    };
    localStorage.setItem('tradingBotSettings', JSON.stringify(settings));
    alert('Inställningar sparade!');
  };

  const handleResetData = () => {
    if (confirm('Är du säker på att du vill återställa all data? Detta kan inte ångras.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <User className="w-5 h-5 mr-2 text-blue-400" />
            Användarinställningar
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Notifications */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-gray-300 flex items-center">
                <Bell className="w-4 h-4 mr-2" />
                Notifikationer
              </Label>
              <p className="text-xs text-gray-400">Få meddelanden om trades och marknadsförändringar</p>
            </div>
            <Switch checked={notifications} onCheckedChange={setNotifications} />
          </div>

          {/* Auto Mode */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-gray-300 flex items-center">
                <Settings className="w-4 h-4 mr-2" />
                Automatiskt läge
              </Label>
              <p className="text-xs text-gray-400">Låt AI hantera alla handelsbeslut</p>
            </div>
            <Switch checked={autoMode} onCheckedChange={setAutoMode} />
          </div>

          {/* Risk Tolerance */}
          <div className="space-y-2">
            <Label className="text-gray-300 flex items-center">
              <Shield className="w-4 h-4 mr-2" />
              Standard risktolerans
            </Label>
            <Select value={riskTolerance} onValueChange={setRiskTolerance}>
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="low">Låg risk</SelectItem>
                <SelectItem value="medium">Medium risk</SelectItem>
                <SelectItem value="high">Hög risk</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Language */}
          <div className="space-y-2">
            <Label className="text-gray-300">Språk</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="sv">🇸🇪 Svenska</SelectItem>
                <SelectItem value="en">🇺🇸 English</SelectItem>
                <SelectItem value="de">🇩🇪 Deutsch</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Theme */}
          <div className="space-y-2">
            <Label className="text-gray-300">Tema</Label>
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="dark">Mörkt tema</SelectItem>
                <SelectItem value="light">Ljust tema</SelectItem>
                <SelectItem value="auto">Automatiskt</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex space-x-3">
            <Button onClick={handleSaveSettings} className="flex-1 bg-blue-600 hover:bg-blue-700">
              Spara inställningar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Card */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Database className="w-5 h-5 mr-2 text-green-400" />
            Statistik & Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-800 p-3 rounded-lg">
              <div className="text-sm text-gray-400">Totala trades</div>
              <div className="text-xl font-bold text-white">127</div>
            </div>
            <div className="bg-gray-800 p-3 rounded-lg">
              <div className="text-sm text-gray-400">Framgångsgrad</div>
              <div className="text-xl font-bold text-green-400">68%</div>
            </div>
            <div className="bg-gray-800 p-3 rounded-lg">
              <div className="text-sm text-gray-400">Genomsnittlig vinst</div>
              <div className="text-xl font-bold text-blue-400">$23.45</div>
            </div>
            <div className="bg-gray-800 p-3 rounded-lg">
              <div className="text-sm text-gray-400">Aktiv tid</div>
              <div className="text-xl font-bold text-purple-400">48h</div>
            </div>
          </div>

          <Button 
            onClick={handleResetData} 
            variant="destructive" 
            className="w-full bg-red-600 hover:bg-red-700"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Återställ all data
          </Button>
        </CardContent>
      </Card>

      {/* API Status */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">API Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Binance API</span>
              <Badge className="bg-green-500">Ansluten</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">WebSocket</span>
              <Badge className="bg-green-500">Aktiv</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">AI Signaler</span>
              <Badge className="bg-yellow-500">Analyserar</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
