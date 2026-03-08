import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Play, Tv, AlertTriangle } from 'lucide-react';

const MAX_ADS_PER_DAY = 3;
const REWARD_PER_AD = 2;
const AD_DURATION = 15; // seconds

interface AdVideo {
  id: string;
  title: string;
  video_url: string;
  thumbnail_url: string | null;
}

const AdRewardCard: React.FC = () => {
  const { user } = useAuth();
  const [adsWatched, setAdsWatched] = useState(0);
  const [watching, setWatching] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [tabVisible, setTabVisible] = useState(true);
  const [paused, setPaused] = useState(false);
  const [adVideos, setAdVideos] = useState<AdVideo[]>([]);
  const [currentAd, setCurrentAd] = useState<AdVideo | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    fetchAdVideos();
    if (user) fetchAdData();
  }, [user]);

  useEffect(() => {
    const handleVisibility = () => {
      const visible = document.visibilityState === 'visible';
      setTabVisible(visible);
      if (!visible && watching) {
        setPaused(true);
        if (videoRef.current) videoRef.current.pause();
      } else if (visible && paused && watching) {
        setPaused(false);
        if (videoRef.current) videoRef.current.play();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [watching, paused]);

  useEffect(() => {
    if (watching && !paused && countdown > 0) {
      intervalRef.current = setInterval(() => {
        setCountdown(c => {
          if (c <= 1) {
            clearInterval(intervalRef.current!);
            completeAd();
            return 0;
          }
          return c - 1;
        });
      }, 1000);
      return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }
  }, [watching, paused]);

  const fetchAdVideos = async () => {
    const { data } = await supabase.from('ad_videos').select('*').eq('is_active', true);
    if (data) setAdVideos(data as AdVideo[]);
  };

  const fetchAdData = async () => {
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase.from('ad_rewards')
      .select('*').eq('user_id', user.id).eq('reward_date', today).maybeSingle();
    if (data) setAdsWatched((data as any).ads_watched || 0);
  };

  const startAd = () => {
    if (!user) { toast.error('Please sign in'); return; }
    if (adsWatched >= MAX_ADS_PER_DAY) { toast.error('Daily ad limit reached (3/day)'); return; }
    if (!tabVisible) { toast.error('Please keep this tab active to watch ads'); return; }
    
    // Pick a random ad video if available
    const ad = adVideos.length > 0 ? adVideos[Math.floor(Math.random() * adVideos.length)] : null;
    setCurrentAd(ad);
    setWatching(true);
    setPaused(false);
    setCountdown(AD_DURATION);
  };

  const completeAd = async () => {
    if (!user) return;
    setWatching(false);
    setPaused(false);
    setCurrentAd(null);
    const newCount = adsWatched + 1;
    const today = new Date().toISOString().split('T')[0];

    const { error } = await supabase.from('ad_rewards').upsert({
      user_id: user.id,
      reward_date: today,
      ads_watched: newCount,
      total_earned: newCount * REWARD_PER_AD,
    }, { onConflict: 'user_id,reward_date' });

    if (!error) {
      const { data: earnings } = await supabase.from('user_earnings')
        .select('balance, total_earned').eq('user_id', user.id).maybeSingle();
      
      if (earnings) {
        await supabase.from('user_earnings').update({
          balance: Number(earnings.balance) + REWARD_PER_AD,
          total_earned: Number(earnings.total_earned) + REWARD_PER_AD,
        }).eq('user_id', user.id);
      } else {
        await supabase.from('user_earnings').insert({
          user_id: user.id,
          balance: REWARD_PER_AD,
          total_earned: REWARD_PER_AD,
        });
      }

      setAdsWatched(newCount);
      toast.success(`💰 Earned KSh ${REWARD_PER_AD} from ad!`);
    } else {
      toast.error('Failed to process ad reward');
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
            {paused ? (
              <>
                <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                <div className="text-lg font-bold mb-2 text-yellow-600">⚠️ Ad Paused</div>
                <p className="text-sm text-muted-foreground">Return to this tab to continue watching</p>
                <p className="text-2xl font-bold text-primary mt-2">{countdown}s remaining</p>
              </>
            ) : (
              <>
                {currentAd ? (
                  <div className="mb-3">
                    <video
                      ref={videoRef}
                      src={currentAd.video_url}
                      autoPlay
                      muted
                      playsInline
                      className="w-full rounded-lg max-h-48 object-contain bg-black"
                      onContextMenu={(e) => e.preventDefault()}
                    />
                    <p className="text-xs text-muted-foreground mt-1">{currentAd.title}</p>
                  </div>
                ) : (
                  <div className="animate-pulse text-lg font-bold mb-2">📺 Watching Ad...</div>
                )}
                <p className="text-2xl font-bold text-primary">{countdown}s</p>
                <p className="text-xs text-muted-foreground mt-1">Keep this tab active. Don't switch away!</p>
                <Progress value={((AD_DURATION - countdown) / AD_DURATION) * 100} className="mt-3 h-2" />
              </>
            )}
          </div>
        ) : (
          <Button onClick={startAd} disabled={adsWatched >= MAX_ADS_PER_DAY} className="w-full">
            <Play className="h-4 w-4 mr-2" />
            {adsWatched >= MAX_ADS_PER_DAY ? 'Daily Limit Reached (3/3)' : `Watch Ad (+KSh ${REWARD_PER_AD})`}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default AdRewardCard;
