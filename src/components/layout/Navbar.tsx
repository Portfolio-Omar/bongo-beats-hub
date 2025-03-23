
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
import { Menu, Phone, Home, Music, Settings, Moon, Sun, MessageSquare, BookOpen, Shield } from 'lucide-react';

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
  const { isAuthenticated } = useAuth();
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
        
        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList>
            {navItems.map((item) => (
              <NavigationMenuItem key={item.name}>
                <Link to={item.path}>
                  <NavigationMenuLink
                    className={cn(
                      "group inline-flex h-9 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50",
                      location.pathname === item.path && "bg-accent/50 text-accent-foreground"
                    )}
                  >
                    {item.icon}
                    {item.name}
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>
        
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
