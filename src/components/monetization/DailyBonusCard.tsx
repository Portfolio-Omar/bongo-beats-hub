import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Gift, CheckCircle2 } from 'lucide-react';

interface Props {
  songsToday: number;
}

const tiers = [
  { songs: 10, bonus: 5 },
  { songs: 20, bonus: 10 },
];

const DailyBonusCard: React.FC<Props> = ({ songsToday }) => {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 mb-3">
          <Gift className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Daily Listening Bonus</h3>
        </div>
        <div className="space-y-2">
          {tiers.map(t => {
            const reached = songsToday >= t.songs;
            return (
              <div key={t.songs} className={`flex items-center justify-between p-2 rounded-lg ${reached ? 'bg-green-500/10' : 'bg-muted/50'}`}>
                <span className="text-sm flex items-center gap-2">
                  {reached ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <span className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 inline-block" />}
                  Listen to {t.songs} songs
                </span>
                <Badge variant={reached ? 'default' : 'secondary'}>
                  +KSh {t.bonus}
                </Badge>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground mt-2">Resets daily at midnight</p>
      </CardContent>
    </Card>
  );
};

export default DailyBonusCard;
