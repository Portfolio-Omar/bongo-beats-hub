import { useCallback, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Song } from '@/types/music';
import { sendEmail } from '@/lib/send-email';

export const useListeningReward = () => {
  const { user, isAuthenticated } = useAuth();
  const lastRewardTime = useRef<number>(0);
  const tabVisible = useRef(true);
  const rewardedSongs = useRef<Set<string>>(new Set());

  useEffect(() => {
    const handleVisibility = () => {
      tabVisible.current = document.visibilityState === 'visible';
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  const checkAndReward = useCallback(async (
    song: Song,
    playDuration: number,
    songDuration: number,
    isMuted: boolean
  ) => {
    if (!isAuthenticated || !user) return;

    // Anti-cheat: tab must be visible, audio unmuted
    if (!tabVisible.current || isMuted) return;

    // 80% threshold
    if (songDuration <= 0 || (playDuration / songDuration) < 0.8) return;

    // Already rewarded this song in this session
    const sessionKey = `${song.id}-${Math.floor(Date.now() / 60000)}`;
    if (rewardedSongs.current.has(sessionKey)) return;

    // 30 second cooldown
    const now = Date.now();
    if (now - lastRewardTime.current < 30000) return;

    try {
      const { data, error } = await supabase.rpc('process_listen_reward', {
        _user_id: user.id,
        _song_id: song.id,
        _play_duration: playDuration,
        _song_duration: songDuration
      });

      if (error) {
        console.error('Reward error:', error);
        return;
      }

      const result = data as any;
      if (result?.success) {
        rewardedSongs.current.add(sessionKey);
        lastRewardTime.current = now;
        const amount = result.reward;
        toast.success(`💰 Earned KSh ${amount}${result.boosted ? ' (Boosted!)' : ''}`, {
          duration: 3000,
          position: 'bottom-left'
        });

        // Milestone email notifications
        const songsToday = result.songs_today;
        const milestones = [10, 50, 100];
        if (milestones.includes(songsToday)) {
          const milestoneKey = `milestone-${songsToday}-${new Date().toDateString()}`;
          if (!rewardedSongs.current.has(milestoneKey)) {
            rewardedSongs.current.add(milestoneKey);
            const descriptions: Record<number, string> = {
              10: 'You listened to 10 songs today! Keep the vibe going!',
              50: 'Amazing! 50 songs today - you are a true Bongo Flava fan!',
              100: 'Incredible! 100 songs today - you are a legend!'
            };
            sendEmail('reward_milestone', undefined, {
              user_id: user.id,
              name: user.user_metadata?.full_name || user.email?.split('@')[0],
              milestone: `${songsToday} Songs Today!`,
              description: descriptions[songsToday]
            });
          }
        }
      }
    } catch (err) {
      console.error('Reward processing error:', err);
    }
  }, [isAuthenticated, user]);

  return { checkAndReward };
};
