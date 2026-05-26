import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/context/LanguageContext';

const Terms: React.FC = () => {
  const { language } = useLanguage();
  const isSw = language === 'sw';
  return (
    <div className="min-h-screen container mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-4xl font-heading font-bold mb-6 bg-gradient-to-r from-gold to-yellow-600 bg-clip-text text-transparent">
        {isSw ? 'Sheria na Masharti' : 'Terms & Conditions'}
      </h1>
      <Card>
        <CardContent className="prose prose-sm dark:prose-invert max-w-none p-6 space-y-4">
          <p>{isSw
            ? 'Karibu Bongo Old Skool. Kwa kutumia tovuti hii, unakubali masharti yafuatayo.'
            : 'Welcome to Bongo Old Skool. By accessing or using our platform you agree to be bound by the following terms.'}</p>

          <h2>{isSw ? '1. Matumizi Halali' : '1. Acceptable Use'}</h2>
          <p>{isSw
            ? 'Hutaruhusiwa kutumia tovuti kwa shughuli zisizo halali, kupakia maudhui yanayokiuka hakimiliki, au kushambulia mfumo.'
            : 'You may not use the service for unlawful activities, upload copyrighted material you do not own, or attempt to disrupt the platform.'}</p>

          <h2>{isSw ? '2. Akaunti' : '2. Accounts'}</h2>
          <p>{isSw
            ? 'Una jukumu la usalama wa akaunti yako na nywila. Tunaweza kusimamisha akaunti zinazokiuka masharti.'
            : 'You are responsible for safeguarding your account credentials. We may suspend accounts that violate these terms.'}</p>

          <h2>{isSw ? '3. Malipo na Mapato' : '3. Payments & Earnings'}</h2>
          <p>{isSw
            ? 'Ada ya usajili wa KSh 150 hairejesheki. Mapato yanaweza kuondolewa kwa M-Pesa au benki yenye kiwango cha chini cha KSh 500.'
            : 'The KSh 150 registration fee is non-refundable. Earnings can be withdrawn via M-Pesa or bank with a minimum of KSh 500.'}</p>

          <h2>{isSw ? '4. Maudhui' : '4. Content'}</h2>
          <p>{isSw
            ? 'Maudhui yote ya muziki ni mali ya wenye hakimiliki. Tunatoa jukwaa la kuhifadhi tu.'
            : 'All music remains the property of its respective rights holders. We provide a preservation and listening platform only.'}</p>

          <h2>{isSw ? '5. Mabadiliko' : '5. Changes'}</h2>
          <p>{isSw
            ? 'Tunaweza kubadilisha masharti haya wakati wowote. Endelea kutumia tovuti kuonyesha kukubali.'
            : 'We may update these terms at any time. Continued use of the site constitutes acceptance of the updated terms.'}</p>

          <p className="text-sm text-muted-foreground pt-4">
            {isSw ? 'Imesasishwa: ' : 'Last updated: '}{new Date().toLocaleDateString()}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Terms;
