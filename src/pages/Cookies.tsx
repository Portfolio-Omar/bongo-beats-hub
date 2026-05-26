import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/context/LanguageContext';

const Cookies: React.FC = () => {
  const { language } = useLanguage();
  const isSw = language === 'sw';
  return (
    <div className="min-h-screen container mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-4xl font-heading font-bold mb-6 bg-gradient-to-r from-gold to-yellow-600 bg-clip-text text-transparent">
        {isSw ? 'Sera ya Vidakuzi' : 'Cookie Policy'}
      </h1>
      <Card>
        <CardContent className="prose prose-sm dark:prose-invert max-w-none p-6 space-y-4">
          <p>{isSw
            ? 'Tovuti hii hutumia vidakuzi (cookies) na hifadhi ya kivinjari ili kuboresha matumizi yako.'
            : 'This site uses cookies and browser storage to enhance your experience.'}</p>

          <h2>{isSw ? 'Aina za Vidakuzi' : 'Types of Cookies We Use'}</h2>
          <ul>
            <li><strong>{isSw ? 'Muhimu' : 'Essential'}</strong> — {isSw ? 'kuingia, vipindi vya akaunti' : 'sign-in & session management'}</li>
            <li><strong>{isSw ? 'Mapendeleo' : 'Preferences'}</strong> — {isSw ? 'lugha, mandhari, kiasi cha sauti' : 'language, theme, volume'}</li>
            <li><strong>{isSw ? 'Uchanganuzi' : 'Analytics'}</strong> — {isSw ? 'kuelewa matumizi ya jukwaa' : 'understanding how the platform is used'}</li>
            <li><strong>{isSw ? 'Hifadhi ya Nje-Mtandao' : 'Offline Storage'}</strong> — IndexedDB {isSw ? 'kwa nyimbo zilizopakuliwa' : 'for downloaded songs'}</li>
          </ul>

          <h2>{isSw ? 'Udhibiti' : 'Control'}</h2>
          <p>{isSw
            ? 'Unaweza kufuta vidakuzi kupitia mipangilio ya kivinjari chako. Hii inaweza kuathiri baadhi ya huduma.'
            : 'You can clear cookies via your browser settings. This may affect some functionality.'}</p>

          <p className="text-sm text-muted-foreground pt-4">
            {isSw ? 'Imesasishwa: ' : 'Last updated: '}{new Date().toLocaleDateString()}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Cookies;
