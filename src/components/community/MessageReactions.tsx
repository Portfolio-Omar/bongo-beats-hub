import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { SmilePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const EMOJI_OPTIONS = ['❤️', '😂', '🔥', '👍', '😮', '😢', '🎵'];

interface Reaction {
  emoji: string;
  count: number;
  reacted: boolean;
}

interface MessageReactionsProps {
  messageId: string;
  isOwn: boolean;
}

const MessageReactions: React.FC<MessageReactionsProps> = ({ messageId, isOwn }) => {
  const { user } = useAuth();
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [open, setOpen] = useState(false);

  const fetchReactions = useCallback(async () => {
    const { data } = await supabase
      .from('community_message_reactions')
      .select('emoji, user_id')
      .eq('message_id', messageId);

    if (data) {
      const emojiMap = new Map<string, { count: number; reacted: boolean }>();
      data.forEach((r: any) => {
        const existing = emojiMap.get(r.emoji) || { count: 0, reacted: false };
        existing.count++;
        if (r.user_id === user?.id) existing.reacted = true;
        emojiMap.set(r.emoji, existing);
      });
      setReactions(Array.from(emojiMap.entries()).map(([emoji, data]) => ({ emoji, ...data })));
    }
  }, [messageId, user?.id]);

  useEffect(() => {
    fetchReactions();

    const channel = supabase
      .channel(`reactions-${messageId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'community_message_reactions', filter: `message_id=eq.${messageId}` }, () => {
        fetchReactions();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchReactions, messageId]);

  const toggleReaction = async (emoji: string) => {
    if (!user) return;
    const existing = reactions.find(r => r.emoji === emoji && r.reacted);
    if (existing) {
      await supabase.from('community_message_reactions').delete()
        .eq('message_id', messageId).eq('user_id', user.id).eq('emoji', emoji);
    } else {
      const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
      await supabase.from('community_message_reactions').insert({
        message_id: messageId, user_id: user.id, user_name: userName, emoji,
      });
    }
    setOpen(false);
  };

  return (
    <div className="flex items-center gap-1 flex-wrap mt-1">
      {reactions.map((r) => (
        <button
          key={r.emoji}
          onClick={() => toggleReaction(r.emoji)}
          className={cn(
            'text-[11px] px-1.5 py-0.5 rounded-full border transition-colors',
            r.reacted
              ? 'border-primary/50 bg-primary/10'
              : isOwn ? 'border-primary-foreground/20 hover:bg-primary-foreground/10' : 'border-border hover:bg-muted'
          )}
        >
          {r.emoji} {r.count}
        </button>
      ))}
      {user && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button className={cn(
              'h-5 w-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity',
              isOwn ? 'hover:bg-primary-foreground/10' : 'hover:bg-muted'
            )}>
              <SmilePlus className="h-3 w-3" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2 flex gap-1" side="top">
            {EMOJI_OPTIONS.map(emoji => (
              <button key={emoji} onClick={() => toggleReaction(emoji)} className="text-lg hover:scale-125 transition-transform p-1">
                {emoji}
              </button>
            ))}
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
};

export default MessageReactions;
