
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuLink, navigationMenuTriggerStyle } from '@/components/ui/navigation-menu';
import { Moon, Sun, Menu } from 'lucide-react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

const Navbar: React.FC = () => {
  const [open, setOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const location = useLocation();

  const links = [
    { href: '/', label: 'Home' },
    { href: '/music', label: 'Music' },
    { href: '/blog', label: 'Blog' },
    { href: '/polls', label: 'Polls' },
    { href: '/contact', label: 'Contact' },
    { href: '/feedback', label: 'Feedback' },
    { href: '/admin', label: 'Admin' },
  ];

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="flex justify-between items-center w-full">
          <div className="mr-4 hidden md:flex">
            <Link to="/" className="mr-6 flex items-center space-x-2">
              <span className="font-bold text-xl font-display">MusicHub</span>
            </Link>
            <NavigationMenu>
              <NavigationMenuList>
                {links.map((link, i) => (
                  <NavigationMenuItem key={i}>
                    <Link to={link.href} legacyBehavior passHref>
                      <NavigationMenuLink 
                        className={cn(
                          navigationMenuTriggerStyle(),
                          location.pathname === link.href ? "text-primary font-medium" : ""
                        )}
                      >
                        {link.label}
                      </NavigationMenuLink>
                    </Link>
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </NavigationMenu>
          </div>
          <div className="md:hidden flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <span className="font-bold text-xl font-display">MusicHub</span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              aria-label="Toggle Theme"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <div className="grid gap-6 py-6">
                  <Link 
                    to="/" 
                    onClick={() => setOpen(false)}
                    className="flex items-center space-x-2"
                  >
                    <span className="font-bold text-xl font-display">MusicHub</span>
                  </Link>
                  <div className="grid gap-3">
                    {links.map((link, i) => (
                      <Link 
                        key={i} 
                        to={link.href} 
                        onClick={() => setOpen(false)}
                        className={cn(
                          "text-sm font-medium transition-colors hover:text-primary py-1",
                          location.pathname === link.href ? "text-primary font-medium" : "text-muted-foreground"
                        )}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
