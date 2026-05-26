import React from 'react';
import { Link } from 'react-router-dom';
import { Music, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Youtube, Linkedin, Heart, Radio } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

const Footer: React.FC = () => {
  const { t, language } = useLanguage();
  const isSw = language === 'sw';
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
              <span className="font-display text-xl font-semibold">Bongo Old Skool</span>
            </Link>
            <p className="max-w-xs text-sm text-muted-foreground">
              {isSw
                ? 'Tunahifadhi na kusherehekea urithi wa muziki wa zamani wa Bongo na Kenya. Tunaunganisha vizazi kupitia melodi zisizosahaulika.'
                : 'Preserving and celebrating the rich heritage of classic Bongo and Kenyan music. Connecting generations through timeless melodies.'}
            </p>
            <div className="flex space-x-4 pt-2">
              {[Facebook, Twitter, Instagram, Youtube].map((Icon, i) => (
                <a key={i} href="#" className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center text-muted-foreground transition-colors hover:text-primary hover:bg-primary/10">
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col space-y-4">
            <h3 className="font-display text-lg font-medium relative pb-2 before:absolute before:bottom-0 before:left-0 before:w-12 before:h-0.5 before:bg-primary/50">
              {isSw ? 'Viungo' : 'Quick Links'}
            </h3>
            {[
              { to: '/', label: t('home') },
              { to: '/music', label: isSw ? 'Maktaba ya Muziki' : 'Music Library' },
              { to: '/podcasts', label: 'Podcasts' },
              { to: '/audio-rooms', label: isSw ? 'Vyumba' : 'Rooms' },
              { to: '/downloads', label: t('downloads') },
              { to: '/blog', label: t('blog') },
              { to: '/contact', label: isSw ? 'Wasiliana Nasi' : 'Contact Us' },
            ].map((l) => (
              <Link key={l.to} to={l.to} className="text-sm text-muted-foreground transition-colors hover:text-primary flex items-center gap-2 group">
                <span className="h-1 w-1 rounded-full bg-primary/50 group-hover:w-2 transition-all duration-300"></span>
                {l.label}
              </Link>
            ))}
          </div>

          {/* Legal */}
          <div className="flex flex-col space-y-4">
            <h3 className="font-display text-lg font-medium relative pb-2 before:absolute before:bottom-0 before:left-0 before:w-12 before:h-0.5 before:bg-primary/50">
              {isSw ? 'Kisheria' : 'Legal'}
            </h3>
            <Link to="/privacy" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-2 group">
              <span className="h-1 w-1 rounded-full bg-primary/50 group-hover:w-2 transition-all"></span>
              {isSw ? 'Sera ya Faragha' : 'Privacy Policy'}
            </Link>
            <Link to="/terms" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-2 group">
              <span className="h-1 w-1 rounded-full bg-primary/50 group-hover:w-2 transition-all"></span>
              {isSw ? 'Sheria na Masharti' : 'Terms & Conditions'}
            </Link>
            <Link to="/cookies" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-2 group">
              <span className="h-1 w-1 rounded-full bg-primary/50 group-hover:w-2 transition-all"></span>
              {isSw ? 'Sera ya Vidakuzi' : 'Cookie Policy'}
            </Link>
            <Link to="/feedback" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-2 group">
              <span className="h-1 w-1 rounded-full bg-primary/50 group-hover:w-2 transition-all"></span>
              {t('feedback')}
            </Link>
          </div>

          {/* Contact Info */}
          <div className="flex flex-col space-y-4">
            <h3 className="font-display text-lg font-medium relative pb-2 before:absolute before:bottom-0 before:left-0 before:w-12 before:h-0.5 before:bg-primary/50">
              {isSw ? 'Mawasiliano' : 'Contact'}
            </h3>
            <a href="mailto:omaryw003@gmail.com" className="flex items-center space-x-3 text-sm text-muted-foreground hover:text-primary transition-colors group">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all"><Mail className="h-4 w-4" /></div>
              <span>omaryw003@gmail.com</span>
            </a>
            <a href="tel:+254725409996" className="flex items-center space-x-3 text-sm text-muted-foreground hover:text-primary transition-colors group">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all"><Phone className="h-4 w-4" /></div>
              <span>+254 725 409 996</span>
            </a>
            <div className="flex items-start space-x-3 text-sm text-muted-foreground">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary mt-0.5"><MapPin className="h-4 w-4" /></div>
              <span>Mombasa, Kenya</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 border-t border-border py-6 flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Bongo Old Skool. {isSw ? 'Haki zote zimehifadhiwa.' : 'All rights reserved.'}
          </p>
          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
            {isSw ? 'Imetengenezwa na' : 'Developed by'}{' '}
            <a
              href="https://transsdev.netlify.app"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold bg-gradient-to-r from-gold to-yellow-600 bg-clip-text text-transparent hover:underline"
            >
              Trans Dev
            </a>
          </p>
        </div>

        <div className="py-3 flex justify-center">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            {isSw ? 'Imetengenezwa kwa' : 'Made with'} <Heart className="h-3 w-3 text-red-500 animate-pulse" /> {isSw ? 'Mombasa' : 'in Mombasa'}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
