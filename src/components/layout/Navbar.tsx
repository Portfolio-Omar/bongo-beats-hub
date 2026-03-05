import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { cn } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Menu, Home, Music, Settings, Moon, Sun, MessageSquare, BookOpen, User, LogOut, ListMusic, Heart, LogIn } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import logo from '@/assets/logo.png';

const navItems = [
  { name: 'Home', path: '/', icon: <Home className="h-4 w-4" /> },
  { name: 'Music', path: '/music', icon: <Music className="h-4 w-4" /> },
  { name: 'Playlists', path: '/playlists', icon: <ListMusic className="h-4 w-4" /> },
  { name: 'Blog', path: '/blog', icon: <BookOpen className="h-4 w-4" /> },
  { name: 'Feedback', path: '/feedback', icon: <MessageSquare className="h-4 w-4" /> },
];

const Navbar: React.FC = () => {
  const { isAuthenticated, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="Bongo Old Skool" className="h-10 w-10 rounded-full object-cover" />
            <span className="font-heading font-bold text-lg hidden sm:block bg-gradient-to-r from-gold to-yellow-600 bg-clip-text text-transparent">
              Bongo Old Skool
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link key={item.path} to={item.path}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "gap-2 transition-all",
                    location.pathname === item.path && "bg-primary/10 text-primary"
                  )}
                >
                  {item.icon}
                  {item.name}
                </Button>
              </Link>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full h-9 w-9">
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            {isAuthenticated ? (
              <div className="hidden md:flex items-center gap-2">
                <Link to="/favorites">
                  <Button variant="ghost" size="icon" className="rounded-full h-9 w-9">
                    <Heart className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/settings">
                  <Button variant="ghost" size="icon" className="rounded-full h-9 w-9">
                    <Settings className="h-4 w-4" />
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={signOut} className="gap-2">
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link to="/auth">
                  <Button variant="outline" size="sm" className="gap-2 border-gold/50 hover:bg-gold/10">
                    <LogIn className="h-4 w-4" />
                    Sign In
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button size="sm" className="gap-2 bg-gold hover:bg-gold/90 text-gold-foreground">
                    <User className="h-4 w-4" />
                    Register
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon" className="rounded-full h-9 w-9">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 p-0">
                <div className="flex flex-col h-full">
                  <div className="p-4 border-b border-border/40 flex items-center gap-3">
                    <img src={logo} alt="Bongo Old Skool" className="h-10 w-10 rounded-full object-cover" />
                    <span className="font-heading font-bold bg-gradient-to-r from-gold to-yellow-600 bg-clip-text text-transparent">
                      Bongo Old Skool
                    </span>
                  </div>
                  <div className="flex-1 py-4 space-y-1 px-2">
                    {navItems.map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Button
                          variant="ghost"
                          className={cn(
                            "w-full justify-start gap-3",
                            location.pathname === item.path && "bg-primary/10 text-primary"
                          )}
                        >
                          {item.icon}
                          {item.name}
                        </Button>
                      </Link>
                    ))}
                    {isAuthenticated && (
                      <>
                        <Link to="/favorites" onClick={() => setMobileMenuOpen(false)}>
                          <Button variant="ghost" className="w-full justify-start gap-3">
                            <Heart className="h-4 w-4" /> Favorites
                          </Button>
                        </Link>
                        <Link to="/settings" onClick={() => setMobileMenuOpen(false)}>
                          <Button variant="ghost" className="w-full justify-start gap-3">
                            <Settings className="h-4 w-4" /> Settings
                          </Button>
                        </Link>
                      </>
                    )}
                  </div>
                  <div className="p-4 border-t border-border/40">
                    {isAuthenticated ? (
                      <Button variant="outline" className="w-full gap-2" onClick={() => { signOut(); setMobileMenuOpen(false); }}>
                        <LogOut className="h-4 w-4" /> Sign Out
                      </Button>
                    ) : (
                      <div className="space-y-2">
                        <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                          <Button className="w-full gap-2 bg-gold hover:bg-gold/90 text-gold-foreground">
                            <User className="h-4 w-4" /> Register / Sign In
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
