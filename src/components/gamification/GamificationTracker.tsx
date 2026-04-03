import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Listens for events and awards points automatically
const GamificationTracker: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const handleSongEnded = async (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.song) {
        try {
          const result = await supabase.rpc('award_points', { _user_id: user.id, _points: 5, _action: 'listen' });
          const data = result.data as any;
          if (data?.level_up) {
            toast.success(`🎉 Level Up! You're now a ${data.level}!`, { duration: 5000 });
          }
        } catch {}
      }
    };

    window.addEventListener('song-ended', handleSongEnded);
    return () => window.removeEventListener('song-ended', handleSongEnded);
  }, [isAuthenticated, user]);

  return null;
};

export default GamificationTracker;
