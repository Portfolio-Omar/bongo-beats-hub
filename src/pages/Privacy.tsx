import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/context/LanguageContext';

const Privacy: React.FC = () => {
  const { language } = useLanguage();
  const isSw = language === 'sw';
  return (
    <div className="min-h-screen container mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-4xl font-heading font-bold mb-6 bg-gradient-to-r from-gold to-yellow-600 bg-clip-text text-transparent">
        {isSw ? 'Sera ya Faragha' : 'Privacy Policy'}
      </h1>
      <Card>
        <CardContent className="prose prose-sm dark:prose-invert max-w-none p-6 space-y-4">
          <p>{isSw
            ? 'Tunaheshimu faragha yako. Sera hii inaeleza tunavyokusanya, kutumia na kulinda taarifa zako.'
            : 'We respect your privacy. This policy explains how we collect, use and protect your information.'}</p>

          <h2>{isSw ? '1. Taarifa Tunazokusanya' : '1. Information We Collect'}</h2>
          <ul>
            <li>{isSw ? 'Jina, barua pepe, na avatar wakati wa kujiandikisha' : 'Name, email and avatar at registration'}</li>
            <li>{isSw ? 'Historia ya usikilizaji ili kutoa mapendekezo' : 'Listening history to power recommendations'}</li>
            <li>{isSw ? 'Taarifa za malipo ya M-Pesa (zinahifadhiwa kwa usalama)' : 'M-Pesa transaction references (stored securely)'}</li>
          </ul>

          <h2>{isSw ? '2. Tunavyotumia Taarifa' : '2. How We Use Information'}</h2>
          <p>{isSw
            ? 'Kuendesha jukwaa, kulipa mapato, kuzuia ulaghai, na kuboresha huduma.'
            : 'To operate the platform, pay earnings, prevent fraud, and improve our services.'}</p>

          <h2>{isSw ? '3. Kushiriki na Wengine' : '3. Sharing'}</h2>
          <p>{isSw
            ? 'Hatuuzi data yako. Tunashiriki tu na watoa huduma muhimu (Supabase, M-Pesa) na pale sheria inapotaka.'
            : 'We do not sell your data. We share only with essential service providers (Supabase, M-Pesa) and when required by law.'}</p>

          <h2>{isSw ? '4. Haki Zako' : '4. Your Rights'}</h2>
          <p>{isSw
            ? 'Unaweza kufuta akaunti yako au kuomba taarifa zako wakati wowote kwa kuwasiliana nasi.'
            : 'You may delete your account or request a copy of your data at any time by contacting us.'}</p>

          <h2>{isSw ? '5. Mawasiliano' : '5. Contact'}</h2>
          <p>omaryw003@gmail.com</p>

          <p className="text-sm text-muted-foreground pt-4">
            {isSw ? 'Imesasishwa: ' : 'Last updated: '}{new Date().toLocaleDateString()}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Privacy;
