import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface SongRatingProps {
  songId: string;
  compact?: boolean;
}

const SongRating: React.FC<SongRatingProps> = ({ songId, compact = false }) => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [hoverRating, setHoverRating] = useState(0);

  const { data: avgData } = useQuery({
    queryKey: ['song-avg-rating', songId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('song_ratings')
        .select('rating')
        .eq('song_id', songId);
      if (error) throw error;
      if (!data || data.length === 0) return { avg: 0, count: 0 };
      const avg = data.reduce((sum, r) => sum + r.rating, 0) / data.length;
      return { avg: Math.round(avg * 10) / 10, count: data.length };
    }
  });

  const { data: userRating } = useQuery({
    queryKey: ['song-user-rating', songId, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from('song_ratings')
        .select('rating')
        .eq('song_id', songId)
        .eq('user_id', user!.id)
        .maybeSingle();
      return data?.rating || 0;
    }
  });

  const rateMutation = useMutation({
    mutationFn: async (rating: number) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('song_ratings')
        .upsert({ song_id: songId, user_id: user.id, rating }, { onConflict: 'song_id,user_id' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['song-avg-rating', songId] });
      queryClient.invalidateQueries({ queryKey: ['song-user-rating', songId] });
      toast.success('Rating saved!');
    },
    onError: () => toast.error('Failed to save rating')
  });

  const handleRate = (rating: number) => {
    if (!isAuthenticated) {
      toast.error('Sign in to rate songs');
      navigate('/auth');
      return;
    }
    rateMutation.mutate(rating);
  };

  return (
    <div className={cn("flex items-center gap-2", compact && "gap-1")}>
      <div className="flex" onMouseLeave={() => setHoverRating(0)}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => handleRate(star)}
            onMouseEnter={() => setHoverRating(star)}
            className="p-0.5 transition-transform hover:scale-110"
          >
            <Star
              className={cn(
                compact ? "h-3.5 w-3.5" : "h-5 w-5",
                "transition-colors",
                (hoverRating || userRating || 0) >= star
                  ? "fill-yellow-400 text-yellow-400"
                  : (avgData?.avg || 0) >= star
                  ? "fill-yellow-400/40 text-yellow-400/40"
                  : "text-muted-foreground/30"
              )}
            />
          </button>
        ))}
      </div>
      {avgData && avgData.count > 0 && (
        <span className={cn("text-muted-foreground", compact ? "text-[10px]" : "text-xs")}>
          {avgData.avg} ({avgData.count})
        </span>
      )}
    </div>
  );
};

export default SongRating;
