import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Play, Tv } from 'lucide-react';

const MAX_ADS_PER_DAY = 10;
const REWARD_PER_AD = 2;

const AdRewardCard: React.FC = () => {
  const { user } = useAuth();
  const [adsWatched, setAdsWatched] = useState(0);
  const [watching, setWatching] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (user) fetchAdData();
  }, [user]);

  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(t);
    } else if (watching && countdown === 0) {
      completeAd();
    }
  }, [countdown, watching]);

  const fetchAdData = async () => {
    if (!user) return;
    const { data } = await supabase.from('ad_rewards')
      .select('*').eq('user_id', user.id).eq('reward_date', new Date().toISOString().split('T')[0]).maybeSingle();
    if (data) setAdsWatched((data as any).ads_watched || 0);
  };

  const startAd = () => {
    if (adsWatched >= MAX_ADS_PER_DAY) { toast.error('Daily ad limit reached'); return; }
    setWatching(true);
    setCountdown(15); // 15 second ad
  };

  const completeAd = async () => {
    if (!user) return;
    setWatching(false);
    const newCount = adsWatched + 1;
    const today = new Date().toISOString().split('T')[0];

    const { error } = await supabase.from('ad_rewards').upsert({
      user_id: user.id,
      reward_date: today,
      ads_watched: newCount,
      total_earned: newCount * REWARD_PER_AD,
    }, { onConflict: 'user_id,reward_date' });

    if (!error) {
      // Add to balance
      await supabase.from('user_earnings').update({
        balance: supabase.rpc as any, // We'll use raw update
      }).eq('user_id', user.id);

      // Simple balance increment
      const { data: earnings } = await supabase.from('user_earnings').select('balance, total_earned').eq('user_id', user.id).single();
      if (earnings) {
        await supabase.from('user_earnings').update({
          balance: Number(earnings.balance) + REWARD_PER_AD,
          total_earned: Number(earnings.total_earned) + REWARD_PER_AD,
        }).eq('user_id', user.id);
      }

      setAdsWatched(newCount);
      toast.success(`💰 Earned KSh ${REWARD_PER_AD} from ad!`);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 mb-3">
          <Tv className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Ad Rewards</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-3">Watch ads to earn KSh {REWARD_PER_AD} each (max {MAX_ADS_PER_DAY}/day)</p>
        <Progress value={(adsWatched / MAX_ADS_PER_DAY) * 100} className="mb-2 h-2" />
        <p className="text-xs text-muted-foreground mb-3">{adsWatched}/{MAX_ADS_PER_DAY} ads watched today · KSh {adsWatched * REWARD_PER_AD} earned</p>
        
        {watching ? (
          <div className="text-center p-4 bg-muted rounded-lg">
            <div className="animate-pulse text-lg font-bold mb-2">📺 Watching Ad...</div>
            <p className="text-2xl font-bold text-primary">{countdown}s</p>
            <p className="text-xs text-muted-foreground mt-1">Please wait for the ad to finish</p>
          </div>
        ) : (
          <Button onClick={startAd} disabled={adsWatched >= MAX_ADS_PER_DAY} className="w-full">
            <Play className="h-4 w-4 mr-2" />
            {adsWatched >= MAX_ADS_PER_DAY ? 'Daily Limit Reached' : 'Watch Ad (+KSh 2)'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default AdRewardCard;
