import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Play, Tv, AlertTriangle, Video } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const MAX_ADS_PER_DAY = 3;
const REWARD_PER_AD = 2;

interface AdVideo {
  id: string;
  title: string;
  video_url: string;
  thumbnail_url: string | null;
}

interface AdRewardCardProps {
  isRegistered?: boolean;
}

const AdRewardCard: React.FC<AdRewardCardProps> = ({ isRegistered = false }) => {
  const { user } = useAuth();
  const [adsWatched, setAdsWatched] = useState(0);
  const [watching, setWatching] = useState(false);
  const [tabVisible, setTabVisible] = useState(true);
  const [paused, setPaused] = useState(false);
  const [adVideos, setAdVideos] = useState<AdVideo[]>([]);
  const [currentAd, setCurrentAd] = useState<AdVideo | null>(null);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const completedRef = useRef(false);

  useEffect(() => {
    fetchAdVideos();
    if (user) fetchAdData();
  }, [user]);

  // Pause/resume video on tab visibility change
  useEffect(() => {
    const handleVisibility = () => {
      const visible = document.visibilityState === 'visible';
      setTabVisible(visible);
      if (!visible && watching) {
        setPaused(true);
        if (videoRef.current) videoRef.current.pause();
      } else if (visible && watching) {
        setPaused(false);
        if (videoRef.current) videoRef.current.play();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [watching]);

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
    if (!isRegistered) { toast.error('Pay KSh 150 registration fee to unlock ad rewards'); return; }
    if (adsWatched >= MAX_ADS_PER_DAY) { toast.error('Daily ad limit reached (3/day)'); return; }
    if (!tabVisible) { toast.error('Please keep this tab active to watch ads'); return; }
    if (adVideos.length === 0) { toast.error('No ads available right now'); return; }

    const ad = adVideos[Math.floor(Math.random() * adVideos.length)];
    setCurrentAd(ad);
    setWatching(true);
    setPaused(false);
    setProgress(0);
    completedRef.current = false;
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (video && video.duration) {
      setProgress((video.currentTime / video.duration) * 100);
    }
  };

  const handleVideoEnded = () => {
    if (!completedRef.current) {
      completedRef.current = true;
      completeAd();
    }
  };

  const completeAd = async () => {
    if (!user) return;
    setWatching(false);
    setPaused(false);
    setCurrentAd(null);
    setProgress(0);
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
          {!isRegistered && <Badge variant="destructive" className="text-xs">Locked</Badge>}
        </div>
        <p className="text-sm text-muted-foreground mb-3">Watch ads to earn KSh {REWARD_PER_AD} each (max {MAX_ADS_PER_DAY}/day)</p>
        {!isRegistered && <p className="text-xs text-destructive mb-2">Pay KSh 150 registration fee to unlock</p>}
        <Progress value={(adsWatched / MAX_ADS_PER_DAY) * 100} className="mb-2 h-2" />
        <p className="text-xs text-muted-foreground mb-3">{adsWatched}/{MAX_ADS_PER_DAY} ads watched today · KSh {adsWatched * REWARD_PER_AD} earned</p>

        {watching ? (
          <div className="text-center p-4 bg-muted rounded-lg">
            {paused ? (
              <>
                <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                <div className="text-lg font-bold mb-2 text-yellow-600">⚠️ Ad Paused</div>
                <p className="text-sm text-muted-foreground">Return to this tab to continue watching</p>
              </>
            ) : (
              <>
                {currentAd && (
                  <div className="mb-3">
                    <video
                      ref={videoRef}
                      src={currentAd.video_url}
                      autoPlay
                      playsInline
                      className="w-full rounded-lg max-h-56 object-contain bg-black"
                      onTimeUpdate={handleTimeUpdate}
                      onEnded={handleVideoEnded}
                      onContextMenu={(e) => e.preventDefault()}
                      controlsList="nodownload nofullscreen noplaybackrate"
                      disablePictureInPicture
                      style={{ pointerEvents: 'none' }}
                    />
                    <p className="text-xs text-muted-foreground mt-1">{currentAd.title}</p>
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">Watch the full video to earn your reward. Don't switch tabs!</p>
                <Progress value={progress} className="mt-3 h-2" />
              </>
            )}
          </div>
        ) : (
          <Button onClick={startAd} disabled={adsWatched >= MAX_ADS_PER_DAY || adVideos.length === 0} className="w-full">
            <Play className="h-4 w-4 mr-2" />
            {adsWatched >= MAX_ADS_PER_DAY
              ? 'Daily Limit Reached (3/3)'
              : adVideos.length === 0
                ? 'No Ads Available'
                : `Watch Ad (+KSh ${REWARD_PER_AD})`}
          </Button>
        )}

        {adVideos.length > 0 && !watching && (
          <div className="mt-4 pt-4 border-t border-border/40">
            <p className="text-xs font-medium text-muted-foreground mb-2">Available Ads ({adVideos.length})</p>
            <div className="grid gap-2">
              {adVideos.map((ad) => (
                <div key={ad.id} className="flex items-center gap-2 p-2 rounded-md bg-muted/30">
                  <Video className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-xs truncate">{ad.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdRewardCard;
