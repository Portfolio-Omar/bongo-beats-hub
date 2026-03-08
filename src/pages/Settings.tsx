
import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Moon, Sun, ArrowLeft, Type } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Toggle } from '@/components/ui/toggle';
import VisitorStats from '@/components/settings/VisitorStats';

const Settings = () => {
  const { isAuthenticated } = useAuth();
  const { theme, toggleTheme, fontFamily, setFontFamily, availableFonts } = useTheme();

  return (
    <Layout>
      <div className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <h1 className="text-2xl font-bold">Settings</h1>
          </div>
        </div>

        <div className="grid gap-6">
          {/* Theme Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Customize how the Music Portal looks on your device.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                  <span>Dark Mode</span>
                </div>
                <Switch 
                  checked={theme === 'dark'} 
                  onCheckedChange={toggleTheme} 
                />
              </div>
              
              <Separator className="my-6" />
              
              <div className="flex flex-col gap-2">
                <h3 className="text-sm font-medium mb-2">Theme</h3>
                <div className="flex gap-2">
                  <Toggle 
                    pressed={theme === 'light'} 
                    onClick={() => theme === 'dark' && toggleTheme()}
                    className="flex flex-1 items-center justify-center gap-2 p-3 h-auto data-[state=on]:border-primary/30 data-[state=on]:shadow-inner"
                  >
                    <Sun className="h-5 w-5" />
                    <span>Light</span>
                  </Toggle>
                  <Toggle 
                    pressed={theme === 'dark'} 
                    onClick={() => theme === 'light' && toggleTheme()}
                    className="flex flex-1 items-center justify-center gap-2 p-3 h-auto data-[state=on]:border-primary/30 data-[state=on]:shadow-inner"
                  >
                    <Moon className="h-5 w-5" />
                    <span>Dark</span>
                  </Toggle>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Font Family Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Type className="h-5 w-5 text-primary" />
                <CardTitle>Font Preferences</CardTitle>
              </div>
              <CardDescription>
                Choose your preferred font style for the entire app.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {availableFonts.map((font) => (
                  <button
                    key={font.value}
                    onClick={() => setFontFamily(font.value)}
                    className={`p-4 rounded-lg border-2 transition-all text-center ${
                      fontFamily === font.value 
                        ? 'border-primary bg-primary/10 shadow-sm' 
                        : 'border-border hover:border-primary/30 hover:bg-accent/50'
                    }`}
                    style={{ fontFamily: getFontCSS(font.value) }}
                  >
                    <span className="text-lg font-medium block">{font.label}</span>
                    <span className="text-xs text-muted-foreground mt-1 block">Aa Bb Cc</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Visitor Statistics - Only visible for authenticated users */}
          {isAuthenticated && (
            <VisitorStats />
          )}
        </div>
      </div>
    </Layout>
  );
};

function getFontCSS(font: string): string {
  const map: Record<string, string> = {
    inter: "'Inter', sans-serif",
    poppins: "'Poppins', sans-serif",
    bebas: "'Bebas Neue', sans-serif",
    playfair: "'Playfair Display', serif",
    roboto: "'Roboto', sans-serif",
    montserrat: "'Montserrat', sans-serif",
  };
  return map[font] || "'Inter', sans-serif";
}

export default Settings;
