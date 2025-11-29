import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList } from '@/components/ui/navigation-menu';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { Menu, Phone, Home, Music, Settings, Moon, Sun, MessageSquare, BookOpen, Shield, User, LogOut, Heart } from 'lucide-react';
const navItems = [{
  name: 'Home',
  path: '/',
  icon: <Home className="h-4 w-4 mr-2" />
}, {
  name: 'Music',
  path: '/music',
  icon: <Music className="h-4 w-4 mr-2" />
}, {
  name: 'Favorites',
  path: '/favorites',
  icon: <Heart className="h-4 w-4 mr-2" />
}, {
  name: 'Blog',
  path: '/blog',
  icon: <BookOpen className="h-4 w-4 mr-2" />
}, {
  name: 'Contact',
  path: '/contact',
  icon: <Phone className="h-4 w-4 mr-2" />
}, {
  name: 'Admin',
  path: '/admin',
  icon: <Shield className="h-4 w-4 mr-2" />
}, {
  name: 'Settings',
  path: '/settings',
  icon: <Settings className="h-4 w-4 mr-2" />
}, {
  name: 'Feedback',
  path: '/feedback',
  icon: <MessageSquare className="h-4 w-4 mr-2" />
}];
const Navbar: React.FC = () => {
  const {
    user,
    signOut
  } = useAuth();
  const {
    theme,
    toggleTheme
  } = useTheme();
  const location = useLocation();
  const isMobile = useIsMobile();
  return <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      
    </header>;
};
export default Navbar;