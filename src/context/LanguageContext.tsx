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
  // Listen Together
  'listen_together': { en: 'Listen Together', sw: 'Sikiliza Pamoja' },
  'listen_together_sub': { en: 'Create a session and listen in perfect sync with friends', sw: 'Fungua kikao na sikiliza kwa wakati mmoja na marafiki' },
  'listen_together_sign_in': { en: 'Sign in to start or join a listening session', sw: 'Ingia ili kuanza au kujiunga na kikao cha kusikiliza' },
  'create_session': { en: 'Create Session', sw: 'Tengeneza Kikao' },
  'create_session_desc': { en: 'Start a session and share the invite code with friends', sw: 'Anza kikao na ushiriki msimbo wa kualika na marafiki' },
  'session_name_ph': { en: "e.g. Friday Throwbacks 🔥", sw: 'k.m. Nyimbo za Ijumma 🔥' },
  'join_code': { en: 'Join with Code', sw: 'Jiunge kwa Msimbo' },
  'join_code_desc': { en: 'Got a 6-digit code from a friend? Enter it here', sw: 'Unayo msimbo wa tarakimu 6 kutoka kwa rafiki? Weka hapa' },
  'enter_code': { en: 'Enter 6-digit code', sw: 'Weka msimbo wa tarakimu 6' },
  'join_session': { en: 'Join Session', sw: 'Jiunge na Kikao' },
  'active_sessions': { en: 'Active Sessions', sw: 'Vikao Vilivyo Hai' },
  'no_active_sessions': { en: 'No active sessions right now — start one!', sw: 'Hakuna vikao kwa sasa — anza moja!' },
  'idle': { en: 'Idle', sw: 'Haijacheza' },
  'now_playing_together': { en: 'Now Playing', sw: 'Inacheza Sasa' },
  'nothing_playing': { en: 'Nothing playing yet', sw: 'Hakuna kinachochezwa bado' },
  'add_songs': { en: 'Add Songs', sw: 'Ongeza Nyimbo' },
  'queue': { en: 'Queue', sw: 'Foleni' },
  'queue_empty': { en: 'The queue is empty — add some songs!', sw: 'Foleni ni tupu — ongeza nyimbo!' },
  'play_now': { en: 'Play now', sw: 'Cheza sasa' },
  'chat': { en: 'Chat', sw: 'Ongea' },
  'members': { en: 'Members', sw: 'Wanachama' },
  'react_live': { en: 'React live — everyone sees it', sw: 'Toa hisia — kila mtu ataona' },
  'invite': { en: 'Invite', sw: 'Karibisha' },
  'copy_code': { en: 'Tap to copy code', sw: 'Bofya kunakili msimbo' },
  'hosted_by': { en: 'Hosted by', sw: 'Mwenyeji ni' },
  'you_are_host': { en: 'You are the host', sw: 'Wewe ni mwenyeji' },
  'end_session': { en: 'End Session', sw: 'Maliza Kikao' },
  'leave_session': { en: 'Leave', sw: 'Toka' },
  'session_ended': { en: 'This session has ended', sw: 'Kikao hiki kimeisha' },
  'back_to_sessions': { en: 'Back to Sessions', sw: 'Rudi kwa Vikao' },
  'host_controls_note': { en: 'Only the host controls playback — you are in sync automatically', sw: 'Mwenyeji peke yake anadhibuti — uko kwa wakati mmoja' },
  // Misc
  'playlists': { en: 'Playlists', sw: 'Orodha za Nyimbo' },
  'community': { en: 'Community', sw: 'Jumuiya' },
  'shorts': { en: 'Shorts', sw: 'Video Fupi' },
  'create_short': { en: 'Create Short', sw: 'Tengeneza Video Fupi' },
  'play_ludo': { en: 'Play Ludo', sw: 'Cheza Ludo' },
  'ludo_subtitle': { en: 'A little friendly rivalry, a lot of Bongo spirit.', sw: 'Ushindani wa kirafiki wenye roho ya Bongo.' },
  'ludo_vs_ai': { en: 'Vs Expert AI', sw: 'Dhidi ya AI Bingwa' },
  'ludo_vs_ai_desc': { en: 'You against three thoughtful opponents.', sw: 'Wewe dhidi ya wapinzani watatu wenye mbinu.' },
  'ludo_pass_play': { en: 'Pass & Play', sw: 'Cheza kwa Zamu' },
  'ludo_pass_play_desc': { en: 'Four players. One screen. Take turns around the table.', sw: 'Wachezaji wanne. Skrini moja. Chezaneni kwa zamu.' },
  'ludo_roll': { en: 'Roll dice', sw: 'Tupa kete' },
  'ludo_roll_again': { en: 'Roll again', sw: 'Tupa tena' },
  'ludo_waiting': { en: 'Thinking…', sw: 'Anafikiria…' },
  'ludo_new_game': { en: 'New game', sw: 'Mchezo mpya' },
  'ludo_your_turn': { en: 'Your turn', sw: 'Zamu yako' },
  'ludo_ai_turn': { en: 'AI is thinking', sw: 'AI inafikiria' },
  'ludo_select_token': { en: 'Choose a token', sw: 'Chagua kete' },
  'ludo_sound_on': { en: 'Game sounds on', sw: 'Sauti ya mchezo imewashwa' },
  'ludo_sound_off': { en: 'Game sounds off', sw: 'Sauti ya mchezo imezimwa' },
  'ludo_theme_classic': { en: 'Classic', sw: 'Kawaida' },
  'ludo_theme_night': { en: 'Midnight', sw: 'Usiku wa manane' },
  'ludo_theme_carnival': { en: 'Carnival', sw: 'Sherehe' },
  'ludo_rules': { en: 'House rules', sw: 'Sheria za mchezo' },
  'ludo_wins': { en: 'wins the game', sw: 'ameshinda mchezo' },
  'ludo_first_to_home': { en: 'First to bring all four tokens home wins.', sw: 'Wa kwanza kupeleka kete zote nne nyumbani ndiye mshindi.' },
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
