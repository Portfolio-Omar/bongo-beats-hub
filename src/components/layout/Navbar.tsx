
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { Menu, X, Music } from 'lucide-react';

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { isAuthenticated, logout } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Music', path: '/music' },
    { name: 'Blog', path: '/blog' },
    { name: 'Polls', path: '/polls' },
    { name: 'Contact', path: '/contact' },
  ];

  return (
    <header 
      className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white/80 backdrop-blur-md shadow-sm' : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center gap-2 text-xl font-semibold hover:opacity-80 transition-opacity"
          >
            <Music className="h-6 w-6 text-primary" />
            <span className="font-display">BongoBeat</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`nav-link text-sm font-medium ${
                  location.pathname === link.path ? 'text-primary after:w-full' : ''
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* CTA and Admin buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/admin">Admin Panel</Link>
                </Button>
                <Button variant="outline" size="sm" onClick={logout}>
                  Logout
                </Button>
              </>
            ) : (
              <Button asChild size="sm" className="animate-pulse-subtle">
                <Link to="/admin">Admin</Link>
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="glass-panel mx-4 mt-2 flex flex-col space-y-4 py-4">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-6 py-2 text-sm font-medium ${
                  location.pathname === link.path ? 'text-primary' : ''
                }`}
              >
                {link.name}
              </Link>
            ))}
            {isAuthenticated ? (
              <>
                <Link to="/admin" className="px-6 py-2 text-sm font-medium">
                  Admin Panel
                </Link>
                <Button variant="outline" size="sm" onClick={logout} className="mx-6">
                  Logout
                </Button>
              </>
            ) : (
              <Link to="/admin" className="px-6 py-2 text-sm font-medium">
                Admin Login
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
