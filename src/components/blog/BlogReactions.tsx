import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Heart, ThumbsUp, Flame, Star } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Reaction {
  type: string;
  icon: React.ReactNode;
  label: string;
}

const REACTIONS: Reaction[] = [
  { type: 'like', icon: <ThumbsUp className="h-4 w-4" />, label: 'Like' },
  { type: 'love', icon: <Heart className="h-4 w-4" />, label: 'Love' },
  { type: 'fire', icon: <Flame className="h-4 w-4" />, label: 'Fire' },
  { type: 'star', icon: <Star className="h-4 w-4" />, label: 'Star' },
];

interface BlogReactionsProps {
  blogId: string;
}

const BlogReactions: React.FC<BlogReactionsProps> = ({ blogId }) => {
  const { user, isAuthenticated } = useAuth();
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [userReactions, setUserReactions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchReactions();
  }, [blogId]);

  const fetchReactions = async () => {
    // Get all reactions for this blog
    const { data } = await supabase
      .from('blog_reactions')
      .select('reaction_type, user_id')
      .eq('blog_id', blogId);

    if (data) {
      const newCounts: Record<string, number> = {};
      const newUserReactions = new Set<string>();
      
      data.forEach((r: any) => {
        newCounts[r.reaction_type] = (newCounts[r.reaction_type] || 0) + 1;
        if (r.user_id === user?.id) {
          newUserReactions.add(r.reaction_type);
        }
      });
      
      setCounts(newCounts);
      setUserReactions(newUserReactions);
    }
  };

  const toggleReaction = async (reactionType: string) => {
    if (!isAuthenticated || !user) {
      toast.error('Please sign in to react');
      return;
    }

    setLoading(true);
    const hasReaction = userReactions.has(reactionType);

    if (hasReaction) {
      // Remove reaction
      await supabase
        .from('blog_reactions')
        .delete()
        .eq('blog_id', blogId)
        .eq('user_id', user.id)
        .eq('reaction_type', reactionType);
      
      setUserReactions(prev => {
        const next = new Set(prev);
        next.delete(reactionType);
        return next;
      });
      setCounts(prev => ({ ...prev, [reactionType]: Math.max(0, (prev[reactionType] || 1) - 1) }));
    } else {
      // Add reaction
      const { error } = await supabase.from('blog_reactions').insert({
        blog_id: blogId,
        user_id: user.id,
        reaction_type: reactionType,
      });

      if (!error) {
        setUserReactions(prev => new Set(prev).add(reactionType));
        setCounts(prev => ({ ...prev, [reactionType]: (prev[reactionType] || 0) + 1 }));
      }
    }
    setLoading(false);
  };

  const totalReactions = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm text-muted-foreground mr-1">
        {totalReactions > 0 ? `${totalReactions} reaction${totalReactions > 1 ? 's' : ''}` : 'React:'}
      </span>
      {REACTIONS.map((r) => {
        const isActive = userReactions.has(r.type);
        const count = counts[r.type] || 0;
        
        return (
          <Button
            key={r.type}
            variant={isActive ? 'default' : 'outline'}
            size="sm"
            className={cn(
              'h-8 gap-1.5 text-xs transition-all',
              isActive && 'bg-primary text-primary-foreground'
            )}
            onClick={() => toggleReaction(r.type)}
            disabled={loading}
          >
            {r.icon}
            {count > 0 && <span>{count}</span>}
          </Button>
        );
      })}
    </div>
  );
};

export default BlogReactions;
