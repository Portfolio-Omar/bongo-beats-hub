import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'sw';

const translations: Record<string, Record<Language, string>> = {
  // Nav & common
  'home': { en: 'Home', sw: 'Nyumbani' },
  'music': { en: 'Music', sw: 'Muziki' },
  'downloads': { en: 'Downloads', sw: 'Pakua' },
  'messages': { en: 'Messages', sw: 'Ujumbe' },
  'profile': { en: 'Profile', sw: 'Wasifu' },
  'favorites': { en: 'Favorites', sw: 'Vipendwa' },
  'settings': { en: 'Settings', sw: 'Mipangilio' },
  'sign_in': { en: 'Sign In', sw: 'Ingia' },
  'sign_out': { en: 'Sign Out', sw: 'Toka' },
  'search': { en: 'Search', sw: 'Tafuta' },
  'play': { en: 'Play', sw: 'Cheza' },
  'download': { en: 'Download', sw: 'Pakua' },
  'share': { en: 'Share', sw: 'Shiriki' },
  // Homepage
  'welcome': { en: 'Welcome to Bongo Old Skool!', sw: 'Karibu Bongo Old Skool!' },
  'tagline': { en: 'Where every beat, every lyric, and every heartbreak from the 2000s still lives rent-free in our hearts.', sw: 'Kila wimbo, kila mdundo, na kila mapigo ya moyo kutoka miaka ya 2000 bado yanaishi moyoni mwetu.' },
  'take_me_to_music': { en: 'Take Me to the Music', sw: 'Nipeleke Muzikini' },
  'random_play': { en: 'Play a Random Old Skool Hit', sw: 'Cheza Wimbo wa Zamani' },
  'explore_everything': { en: 'Explore Everything', sw: 'Gundua Yote' },
  'quick_access': { en: 'Quick access to all features', sw: 'Fikia haraka huduma zote' },
  'listen_earn': { en: 'Listen & Earn KSh', sw: 'Sikiliza na Upate KSh' },
  'start_earning': { en: 'Start Earning Now', sw: 'Anza Kupata Sasa' },
  // Music page
  'search_placeholder': { en: 'Search by title, artist, genre, or year...', sw: 'Tafuta kwa jina, msanii, aina, au mwaka...' },
  'songs_found': { en: 'songs found', sw: 'nyimbo zimepatikana' },
  'no_songs': { en: 'No songs found', sw: 'Hakuna nyimbo zilizopatikana' },
  'voice_search': { en: 'Voice Search', sw: 'Tafuta kwa Sauti' },
  'listening': { en: 'Listening...', sw: 'Inasikiliza...' },
  // Gamification
  'your_level': { en: 'Your Level', sw: 'Kiwango Chako' },
  'points': { en: 'Points', sw: 'Pointi' },
  'badges': { en: 'Badges', sw: 'Beji' },
  'streak': { en: 'Day Streak', sw: 'Siku Mfululizo' },
  'leaderboard': { en: 'Leaderboard', sw: 'Ubao wa Viongozi' },
  // Messages
  'new_message': { en: 'New Message', sw: 'Ujumbe Mpya' },
  'send': { en: 'Send', sw: 'Tuma' },
  'type_message': { en: 'Type a message...', sw: 'Andika ujumbe...' },
  'no_messages': { en: 'No messages yet', sw: 'Hakuna ujumbe bado' },
  // Shorts
  'playlists': { en: 'Playlists', sw: 'Orodha za Nyimbo' },
  'community': { en: 'Community', sw: 'Jumuiya' },
  'shorts': { en: 'Shorts', sw: 'Video Fupi' },
  'create_short': { en: 'Create Short', sw: 'Tengeneza Video Fupi' },
  'live': { en: 'Live', sw: 'Moja kwa Moja' },
  'earn': { en: 'Earn', sw: 'Pata' },
  'blog': { en: 'Blog', sw: 'Blogu' },
  'feedback': { en: 'Feedback', sw: 'Maoni' },
  'register': { en: 'Register Free', sw: 'Jiandikishe Bure' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('app_language') as Language) || 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app_language', lang);
  };

  const t = (key: string): string => {
    return translations[key]?.[language] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
