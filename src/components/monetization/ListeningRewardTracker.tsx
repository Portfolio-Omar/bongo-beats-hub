import { useEffect } from 'react';
import { useListeningReward } from '@/hooks/useListeningReward';
import { useAudio } from '@/context/AudioContext';

const ListeningRewardTracker: React.FC = () => {
  const { checkAndReward } = useListeningReward();
  const { isMuted } = useAudio();

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.song && detail?.playDuration && detail?.songDuration) {
        checkAndReward(detail.song, detail.playDuration, detail.songDuration, isMuted);
      }
    };

    window.addEventListener('song-ended', handler);
    return () => window.removeEventListener('song-ended', handler);
  }, [checkAndReward, isMuted]);

  return null;
};

export default ListeningRewardTracker;
