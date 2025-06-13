import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { 
  Home, Music, ArrowLeft, Phone, Shield, MessageSquare, 
  Settings, Moon, Sun, BookOpen 
} from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';

const MobileMenu = () => {
  const { isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const menuItems = [
    { name: 'Home', path: '/', icon: <Home className="h-5 w-5 mr-3" /> },
    { name: 'Music', path: '/music', icon: <Music className="h-5 w-5 mr-3" /> },
    { name: 'Blog', path: '/blog', icon: <BookOpen className="h-5 w-5 mr-3" /> },
    { name: 'Contact', path: '/contact', icon: <Phone className="h-5 w-5 mr-3" /> },
    { name: 'Settings', path: '/settings', icon: <Settings className="h-5 w-5 mr-3" /> },
  ];

  if (isAuthenticated) {
    menuItems.push({ 
      name: 'Admin', 
      path: '/admin', 
      icon: <Shield className="h-5 w-5 mr-3" /> 
    });
  }
  
  menuItems.push({ 
    name: 'Feedback', 
    path: '/feedback', 
    icon: <MessageSquare className="h-5 w-5 mr-3" /> 
  });

  return (
    <Layout>
      <div className="container py-8">
        <Button 
          variant="ghost" 
          className="mb-4" 
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-5 w-5 mr-2" /> Back
        </Button>
        
        <h1 className="text-2xl font-bold mb-6">Menu</h1>
        
        <div className="grid gap-3 mb-6">
          {menuItems.map((item) => (
            <Link 
              key={item.name} 
              to={item.path} 
              className="flex items-center p-4 rounded-lg border border-border hover:bg-accent transition-colors"
            >
              {item.icon}
              <span className="font-medium">{item.name}</span>
            </Link>
          ))}
        </div>

        <div className="mt-8">
          <h2 className="text-lg font-medium mb-3">Theme</h2>
          <div className="flex gap-3">
            <Toggle 
              pressed={theme === 'light'} 
              onClick={() => theme === 'dark' && toggleTheme()}
              className="flex-1 flex items-center justify-center gap-2 p-4 rounded-lg border border-border h-auto data-[state=on]:border-primary/30 data-[state=on]:bg-accent"
            >
              <Sun className="h-5 w-5 mr-2" />
              <span>Light</span>
            </Toggle>
            <Toggle 
              pressed={theme === 'dark'} 
              onClick={() => theme === 'light' && toggleTheme()}
              className="flex-1 flex items-center justify-center gap-2 p-4 rounded-lg border border-border h-auto data-[state=on]:border-primary/30 data-[state=on]:bg-accent" 
            >
              <Moon className="h-5 w-5 mr-2" />
              <span>Dark</span>
            </Toggle>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default MobileMenu;
