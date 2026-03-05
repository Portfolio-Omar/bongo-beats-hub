import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { Menu, Home, Music, Settings, Moon, Sun, MessageSquare, BookOpen, Shield, User, LogOut, ListMusic, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const navItems = [
{ name: 'Home', path: '/', icon: <Home className="h-4 w-4" /> },
{ name: 'Music', path: '/music', icon: <Music className="h-4 w-4" /> },
{ name: 'Playlists', path: '/playlists', icon: <ListMusic className="h-4 w-4" /> },
{ name: 'Blog', path: '/blog', icon: <BookOpen className="h-4 w-4" /> },
{ name: 'Feedback', path: '/feedback', icon: <MessageSquare className="h-4 w-4" /> }];


const Navbar: React.FC = () => {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="container mx-auto px-4">
        


















































































































































































































        
      </nav>
    </header>);

};

export default Navbar;