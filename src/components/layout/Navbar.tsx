import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { Menu, Home, Music, Settings, Moon, Sun, MessageSquare, BookOpen, Shield, User, LogOut, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const navItems = [
  { name: 'Home', path: '/', icon: <Home className="h-4 w-4" /> },
  { name: 'Music', path: '/music', icon: <Music className="h-4 w-4" /> },
  { name: 'Favorites', path: '/favorites', icon: <Heart className="h-4 w-4" /> },
  { name: 'Blog', path: '/blog', icon: <BookOpen className="h-4 w-4" /> },
  { name: 'Feedback', path: '/feedback', icon: <MessageSquare className="h-4 w-4" /> },
];

const Navbar: React.FC = () => {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
              className="w-10 h-10 rounded-full bg-gradient-to-br from-gold to-yellow-600 flex items-center justify-center shadow-lg"
            >
              <Music className="h-6 w-6 text-gold-foreground" />
            </motion.div>
            <span className="text-xl font-heading font-bold bg-gradient-to-r from-gold to-yellow-600 bg-clip-text text-transparent">
              Bongo Vibes
            </span>
          </Link>

          {/* Desktop Navigation */}
          {!isMobile && (
            <div className="flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link key={item.path} to={item.path}>
                    <Button
                      variant="ghost"
                      className={cn(
                        "gap-2 relative transition-all duration-200",
                        isActive && "bg-gold/10 text-gold hover:bg-gold/20"
                      )}
                    >
                      {item.icon}
                      <span>{item.name}</span>
                      {isActive && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold"
                          initial={false}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                      )}
                    </Button>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Right Section */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="relative overflow-hidden"
            >
              <AnimatePresence mode="wait">
                {theme === 'dark' ? (
                  <motion.div
                    key="moon"
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 20, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Moon className="h-5 w-5" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="sun"
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 20, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Sun className="h-5 w-5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>

            {/* User Menu */}
            {!isMobile && user && (
              <>
                <Link to="/settings">
                  <Button variant="ghost" size="icon">
                    <Settings className="h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/admin">
                  <Button variant="ghost" size="icon">
                    <Shield className="h-5 w-5" />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={signOut}
                  title="Sign out"
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </>
            )}

            {!isMobile && !user && (
              <Link to="/auth">
                <Button variant="default" className="bg-gold hover:bg-gold/90 text-gold-foreground">
                  <User className="h-4 w-4 mr-2" />
                  Sign In
                </Button>
              </Link>
            )}

            {/* Mobile Menu */}
            {isMobile && (
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                  <div className="flex flex-col gap-6 mt-8">
                    <div className="flex items-center gap-2 pb-4 border-b border-border">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold to-yellow-600 flex items-center justify-center">
                        <Music className="h-6 w-6 text-gold-foreground" />
                      </div>
                      <span className="text-lg font-heading font-bold bg-gradient-to-r from-gold to-yellow-600 bg-clip-text text-transparent">
                        Bongo Vibes
                      </span>
                    </div>

                    {/* Navigation Links */}
                    <div className="flex flex-col gap-2">
                      {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                          <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <Button
                              variant="ghost"
                              className={cn(
                                "w-full justify-start gap-3 h-12",
                                isActive && "bg-gold/10 text-gold"
                              )}
                            >
                              {item.icon}
                              <span className="text-base">{item.name}</span>
                            </Button>
                          </Link>
                        );
                      })}
                    </div>

                    {/* User Section */}
                    {user ? (
                      <div className="flex flex-col gap-2 pt-4 border-t border-border">
                        <Link to="/settings" onClick={() => setMobileMenuOpen(false)}>
                          <Button variant="ghost" className="w-full justify-start gap-3 h-12">
                            <Settings className="h-5 w-5" />
                            <span className="text-base">Settings</span>
                          </Button>
                        </Link>
                        <Link to="/admin" onClick={() => setMobileMenuOpen(false)}>
                          <Button variant="ghost" className="w-full justify-start gap-3 h-12">
                            <Shield className="h-5 w-5" />
                            <span className="text-base">Admin</span>
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          className="w-full justify-start gap-3 h-12"
                          onClick={() => {
                            signOut();
                            setMobileMenuOpen(false);
                          }}
                        >
                          <LogOut className="h-5 w-5" />
                          <span className="text-base">Sign Out</span>
                        </Button>
                      </div>
                    ) : (
                      <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                        <Button className="w-full bg-gold hover:bg-gold/90 text-gold-foreground h-12">
                          <User className="h-5 w-5 mr-2" />
                          Sign In
                        </Button>
                      </Link>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;