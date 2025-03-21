
import React from 'react';
import { Link } from 'react-router-dom';
import { Music, Mail, Phone, MapPin, Facebook, Twitter, Instagram } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-white pt-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3 lg:grid-cols-4">
          {/* Logo and About */}
          <div className="flex flex-col space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <Music className="h-6 w-6 text-primary" />
              <span className="font-display text-xl font-semibold">BongoBeat</span>
            </Link>
            <p className="max-w-xs text-sm text-muted-foreground">
              Preserving and celebrating the rich heritage of classic Bongo and Kenyan music.
            </p>
            <div className="flex space-x-4 pt-2">
              <a href="#" className="text-muted-foreground transition-colors hover:text-primary">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground transition-colors hover:text-primary">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground transition-colors hover:text-primary">
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col space-y-4">
            <h3 className="font-display text-lg font-medium">Quick Links</h3>
            <Link to="/" className="text-sm text-muted-foreground transition-colors hover:text-primary">
              Home
            </Link>
            <Link to="/music" className="text-sm text-muted-foreground transition-colors hover:text-primary">
              Music Library
            </Link>
            <Link to="/blog" className="text-sm text-muted-foreground transition-colors hover:text-primary">
              Blog
            </Link>
            <Link to="/polls" className="text-sm text-muted-foreground transition-colors hover:text-primary">
              Polls
            </Link>
            <Link to="/contact" className="text-sm text-muted-foreground transition-colors hover:text-primary">
              Contact Us
            </Link>
          </div>

          {/* Resources */}
          <div className="flex flex-col space-y-4">
            <h3 className="font-display text-lg font-medium">Resources</h3>
            <a href="#" className="text-sm text-muted-foreground transition-colors hover:text-primary">
              About Bongo Music
            </a>
            <a href="#" className="text-sm text-muted-foreground transition-colors hover:text-primary">
              Kenyan Music History
            </a>
            <a href="#" className="text-sm text-muted-foreground transition-colors hover:text-primary">
              Music Appreciation
            </a>
            <a href="#" className="text-sm text-muted-foreground transition-colors hover:text-primary">
              Artist Spotlights
            </a>
          </div>

          {/* Contact Info */}
          <div className="flex flex-col space-y-4">
            <h3 className="font-display text-lg font-medium">Contact</h3>
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">hello@bongobeat.com</span>
            </div>
            <div className="flex items-center space-x-2">
              <Phone className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">+254 700 000 000</span>
            </div>
            <div className="flex items-start space-x-2">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">
                Nairobi, Kenya
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 border-t border-border py-6 text-center">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} BongoBeat. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
