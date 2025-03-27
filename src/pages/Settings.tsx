
import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Moon, Sun, Shield, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Toggle } from '@/components/ui/toggle';
import VisitorStats from '@/components/settings/VisitorStats';

const Settings = () => {
  const { isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();

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

          {/* Visitor Statistics - Only visible for authenticated users */}
          {isAuthenticated && (
            <VisitorStats />
          )}

          {/* Admin Panel Access - Only visible for authenticated users */}
          {isAuthenticated && (
            <Card className="bg-gradient-to-r from-primary/5 to-accent/10 border-primary/20">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <CardTitle>Admin Controls</CardTitle>
                </div>
                <CardDescription>
                  Access advanced management features for your platform.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="default" className="w-full bg-primary hover:bg-primary/90">
                  <Link to="/admin">
                    <Shield className="mr-2 h-4 w-4" />
                    Open Admin Dashboard
                  </Link>
                </Button>
                <p className="text-sm text-muted-foreground mt-4">
                  The admin dashboard allows you to manage content, users, and system settings.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Settings;
