
import React from 'react';
import { Link } from 'react-router-dom';
import { Music, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Youtube, Linkedin, Heart } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gradient-to-br from-primary/5 to-background pt-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3 lg:grid-cols-4">
          {/* Logo and About */}
          <div className="flex flex-col space-y-4">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="relative h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-all duration-300">
                <Music className="h-5 w-5 text-primary" />
              </div>
              <span className="font-display text-xl font-semibold">BongoBeat</span>
            </Link>
            <p className="max-w-xs text-sm text-muted-foreground">
              Preserving and celebrating the rich heritage of classic Bongo and Kenyan music.
              Connecting generations through timeless melodies.
            </p>
            <div className="flex space-x-4 pt-2">
              <a href="#" className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center text-muted-foreground transition-colors hover:text-primary hover:bg-primary/10">
                <Facebook className="h-4 w-4" />
              </a>
              <a href="#" className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center text-muted-foreground transition-colors hover:text-primary hover:bg-primary/10">
                <Twitter className="h-4 w-4" />
              </a>
              <a href="#" className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center text-muted-foreground transition-colors hover:text-primary hover:bg-primary/10">
                <Instagram className="h-4 w-4" />
              </a>
              <a href="#" className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center text-muted-foreground transition-colors hover:text-primary hover:bg-primary/10">
                <Youtube className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col space-y-4">
            <h3 className="font-display text-lg font-medium relative pb-2 before:absolute before:bottom-0 before:left-0 before:w-12 before:h-0.5 before:bg-primary/50">Quick Links</h3>
            <Link to="/" className="text-sm text-muted-foreground transition-colors hover:text-primary flex items-center gap-2 group">
              <span className="h-1 w-1 rounded-full bg-primary/50 group-hover:w-2 transition-all duration-300"></span>
              Home
            </Link>
            <Link to="/music" className="text-sm text-muted-foreground transition-colors hover:text-primary flex items-center gap-2 group">
              <span className="h-1 w-1 rounded-full bg-primary/50 group-hover:w-2 transition-all duration-300"></span>
              Music Library
            </Link>
            <Link to="/blog" className="text-sm text-muted-foreground transition-colors hover:text-primary flex items-center gap-2 group">
              <span className="h-1 w-1 rounded-full bg-primary/50 group-hover:w-2 transition-all duration-300"></span>
              Blog
            </Link>
            <Link to="/polls" className="text-sm text-muted-foreground transition-colors hover:text-primary flex items-center gap-2 group">
              <span className="h-1 w-1 rounded-full bg-primary/50 group-hover:w-2 transition-all duration-300"></span>
              Polls
            </Link>
            <Link to="/contact" className="text-sm text-muted-foreground transition-colors hover:text-primary flex items-center gap-2 group">
              <span className="h-1 w-1 rounded-full bg-primary/50 group-hover:w-2 transition-all duration-300"></span>
              Contact Us
            </Link>
          </div>

          {/* Resources */}
          <div className="flex flex-col space-y-4">
            <h3 className="font-display text-lg font-medium relative pb-2 before:absolute before:bottom-0 before:left-0 before:w-12 before:h-0.5 before:bg-primary/50">Resources</h3>
            <a href="#" className="text-sm text-muted-foreground transition-colors hover:text-primary flex items-center gap-2 group">
              <span className="h-1 w-1 rounded-full bg-primary/50 group-hover:w-2 transition-all duration-300"></span>
              About Bongo Music
            </a>
            <a href="#" className="text-sm text-muted-foreground transition-colors hover:text-primary flex items-center gap-2 group">
              <span className="h-1 w-1 rounded-full bg-primary/50 group-hover:w-2 transition-all duration-300"></span>
              Kenyan Music History
            </a>
            <a href="#" className="text-sm text-muted-foreground transition-colors hover:text-primary flex items-center gap-2 group">
              <span className="h-1 w-1 rounded-full bg-primary/50 group-hover:w-2 transition-all duration-300"></span>
              Music Appreciation
            </a>
            <a href="#" className="text-sm text-muted-foreground transition-colors hover:text-primary flex items-center gap-2 group">
              <span className="h-1 w-1 rounded-full bg-primary/50 group-hover:w-2 transition-all duration-300"></span>
              Artist Spotlights
            </a>
            <a href="#" className="text-sm text-muted-foreground transition-colors hover:text-primary flex items-center gap-2 group">
              <span className="h-1 w-1 rounded-full bg-primary/50 group-hover:w-2 transition-all duration-300"></span>
              Music Guides
            </a>
          </div>

          {/* Contact Info */}
          <div className="flex flex-col space-y-4">
            <h3 className="font-display text-lg font-medium relative pb-2 before:absolute before:bottom-0 before:left-0 before:w-12 before:h-0.5 before:bg-primary/50">Contact</h3>
            <a href="mailto:omaryw003@gmail.com" className="flex items-center space-x-3 text-sm text-muted-foreground hover:text-primary transition-colors group">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
                <Mail className="h-4 w-4" />
              </div>
              <span>omaryw003@gmail.com</span>
            </a>
            <a href="tel:+254725409996" className="flex items-center space-x-3 text-sm text-muted-foreground hover:text-primary transition-colors group">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
                <Phone className="h-4 w-4" />
              </div>
              <span>+254 725 409 996</span>
            </a>
            <div className="flex items-start space-x-3 text-sm text-muted-foreground group">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary mt-0.5">
                <MapPin className="h-4 w-4" />
              </div>
              <span>
                Mombasa, Kenya
              </span>
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <a href="https://www.linkedin.com" className="text-muted-foreground hover:text-primary transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors underline">
                Connect on LinkedIn
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 border-t border-border py-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-muted-foreground mb-4 md:mb-0">
            &copy; {new Date().getFullYear()} BongoBeat. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
            <span className="h-1 w-1 rounded-full bg-muted-foreground"></span>
            <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
            <span className="h-1 w-1 rounded-full bg-muted-foreground"></span>
            <a href="#" className="hover:text-primary transition-colors">Cookies</a>
          </div>
        </div>
        
        <div className="py-3 flex justify-center">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            Made with <Heart className="h-3 w-3 text-red-500 animate-pulse" /> in Mombasa
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
