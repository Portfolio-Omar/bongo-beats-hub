import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'sw';

const translations: Record<string, Record<Language, string>> = {
  // Nav & common
  'home': { en: 'Home', sw: 'Nyumbani' },
  'music': { en: 'Music', sw: 'Muziki' },
  'podcasts': { en: 'Podcasts', sw: 'Podikasti' },
  'rooms': { en: 'Rooms', sw: 'Vyumba' },
  'downloads': { en: 'Downloads', sw: 'Pakua' },
  'messages': { en: 'Messages', sw: 'Ujumbe' },
  'profile': { en: 'Profile', sw: 'Wasifu' },
  'favorites': { en: 'Favorites', sw: 'Vipendwa' },
  'settings': { en: 'Settings', sw: 'Mipangilio' },
  'sign_in': { en: 'Sign In', sw: 'Ingia' },
  'sign_out': { en: 'Sign Out', sw: 'Toka' },
  'search': { en: 'Search', sw: 'Tafuta' },
  'play': { en: 'Play', sw: 'Cheza' },
  'pause': { en: 'Pause', sw: 'Simamisha' },
  'download': { en: 'Download', sw: 'Pakua' },
  'share': { en: 'Share', sw: 'Shiriki' },
  'like': { en: 'Like', sw: 'Penda' },
  'comment': { en: 'Comment', sw: 'Toa Maoni' },
  'send': { en: 'Send', sw: 'Tuma' },
  'cancel': { en: 'Cancel', sw: 'Ghairi' },
  'save': { en: 'Save', sw: 'Hifadhi' },
  'delete': { en: 'Delete', sw: 'Futa' },
  'edit': { en: 'Edit', sw: 'Hariri' },
  'loading': { en: 'Loading...', sw: 'Inapakia...' },
  'next': { en: 'Next', sw: 'Inayofuata' },
  'previous': { en: 'Previous', sw: 'Iliyotangulia' },
  'view_all': { en: 'View All', sw: 'Ona Zote' },
  // Homepage
  'welcome': { en: 'Welcome to Bongo Old Skool!', sw: 'Karibu Bongo Old Skool!' },
  'tagline': { en: 'Where every beat, every lyric, and every heartbreak from the 2000s still lives rent-free in our hearts.', sw: 'Kila wimbo, kila mdundo, na kila mapigo ya moyo kutoka miaka ya 2000 bado yanaishi moyoni mwetu.' },
  'take_me_to_music': { en: 'Take Me to the Music', sw: 'Nipeleke Muzikini' },
  'random_play': { en: 'Play a Random Old Skool Hit', sw: 'Cheza Wimbo wa Zamani' },
  'listen_to_podcasts': { en: 'Listen to Podcasts', sw: 'Sikiliza Podikasti' },
  'explore_everything': { en: 'Explore Everything', sw: 'Gundua Yote' },
  'quick_access': { en: 'Quick access to all features', sw: 'Fikia haraka huduma zote' },
  'listen_earn': { en: 'Listen & Earn KSh', sw: 'Sikiliza na Upate KSh' },
  'start_earning': { en: 'Start Earning Now', sw: 'Anza Kupata Sasa' },
  'top_earners': { en: 'Top Earners', sw: 'Wapatao Zaidi' },
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
  'type_message': { en: 'Type a message...', sw: 'Andika ujumbe...' },
  'no_messages': { en: 'No messages yet', sw: 'Hakuna ujumbe bado' },
  // Misc
  'playlists': { en: 'Playlists', sw: 'Orodha za Nyimbo' },
  'community': { en: 'Community', sw: 'Jumuiya' },
  'shorts': { en: 'Shorts', sw: 'Video Fupi' },
  'create_short': { en: 'Create Short', sw: 'Tengeneza Video Fupi' },
  'live': { en: 'Live', sw: 'Moja kwa Moja' },
  'earn': { en: 'Earn', sw: 'Pata' },
  'blog': { en: 'Blog', sw: 'Blogu' },
  'feedback': { en: 'Feedback', sw: 'Maoni' },
  'register': { en: 'Register Free', sw: 'Jiandikishe Bure' },
  // Legal
  'privacy_policy': { en: 'Privacy Policy', sw: 'Sera ya Faragha' },
  'terms_conditions': { en: 'Terms & Conditions', sw: 'Sheria na Masharti' },
  'cookie_policy': { en: 'Cookie Policy', sw: 'Sera ya Vidakuzi' },
  'developed_by': { en: 'Developed by', sw: 'Imetengenezwa na' },
  // Chatbot
  'ask_anything': { en: 'Ask me anything about music', sw: 'Niulize lolote kuhusu muziki' },
  'chatbot_placeholder': { en: 'Ask about songs, artists, or features...', sw: 'Uliza kuhusu nyimbo, wasanii, au huduma...' },
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
    // Update <html lang="..."> for accessibility & SEO
    document.documentElement.lang = lang === 'sw' ? 'sw' : 'en';
  };

  useEffect(() => {
    document.documentElement.lang = language === 'sw' ? 'sw' : 'en';
  }, [language]);

  const t = (key: string): string => {
    return translations[key]?.[language] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
