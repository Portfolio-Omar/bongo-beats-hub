import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from '@/components/ui/navigation-menu';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { 
  Menu, Phone, Home, Music, Settings, Moon, Sun, 
  MessageSquare, BookOpen, Shield, User, LogOut 
} from 'lucide-react';

const navItems = [
  { name: 'Home', path: '/', icon: <Home className="h-4 w-4 mr-2" /> },
  { name: 'Music', path: '/music', icon: <Music className="h-4 w-4 mr-2" /> },
  { name: 'Blog', path: '/blog', icon: <BookOpen className="h-4 w-4 mr-2" /> },
  { name: 'Contact', path: '/contact', icon: <Phone className="h-4 w-4 mr-2" /> },
  { name: 'Admin', path: '/admin', icon: <Shield className="h-4 w-4 mr-2" /> },
  { name: 'Settings', path: '/settings', icon: <Settings className="h-4 w-4 mr-2" /> },
  { name: 'Feedback', path: '/feedback', icon: <MessageSquare className="h-4 w-4 mr-2" /> },
];

const Navbar: React.FC = () => {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const isMobile = useIsMobile();
  
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="mr-4 flex items-center">
          <Link to="/" className="flex items-center space-x-2 font-display text-xl">
            <span className="hidden font-bold sm:inline-block">Music Portal</span>
          </Link>
        </div>
        
        <nav className="hidden md:flex">
          <div className="flex items-center space-x-6">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={cn(
                  "flex items-center text-sm font-medium transition-colors hover:text-primary",
                  location.pathname === item.path 
                    ? "text-primary" 
                    : "text-muted-foreground"
                )}
              >
                {item.icon}
                {item.name}
              </Link>
            ))}
          </div>
        </nav>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleTheme}
            className="hidden md:flex"
          >
            {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            <span className="sr-only">Toggle theme</span>
          </Button>

          {/* Auth Section - Desktop */}
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground max-w-[120px] truncate">
                  {user.email}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={signOut}
                  className="flex items-center gap-1"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <Link to="/auth">
                <Button variant="ghost" size="sm" className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  Sign In
                </Button>
              </Link>
            )}
          </div>
          
          {/* Mobile Navigation */}
          <div className="flex md:hidden">
            <Button variant="outline" size="icon" asChild>
              <Link to="/menu">
                <span className="sr-only">Toggle menu</span>
                <Menu className="h-6 w-6" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
