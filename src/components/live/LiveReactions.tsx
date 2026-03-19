import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

interface FloatingReaction {
  id: string;
  emoji: string;
  x: number;
}

const REACTIONS = ['❤️', '🔥', '👏', '🎵', '🎶', '💯'];

interface LiveReactionsProps {
  sessionId: string;
}

const LiveReactions: React.FC<LiveReactionsProps> = ({ sessionId }) => {
  const { user } = useAuth();
  const [floating, setFloating] = useState<FloatingReaction[]>([]);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    const channel = supabase.channel(`reactions-${sessionId}`);
    channelRef.current = channel;

    channel.on('broadcast', { event: 'reaction' }, ({ payload }) => {
      const id = crypto.randomUUID();
      const x = 10 + Math.random() * 80;
      setFloating(prev => [...prev.slice(-20), { id, emoji: payload.emoji, x }]);
      setTimeout(() => {
        setFloating(prev => prev.filter(r => r.id !== id));
      }, 2500);
    });

    channel.subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [sessionId]);

  const sendReaction = (emoji: string) => {
    if (!user) return;
    channelRef.current?.send({ type: 'broadcast', event: 'reaction', payload: { emoji, userId: user.id } });

    // Also add locally
    const id = crypto.randomUUID();
    const x = 10 + Math.random() * 80;
    setFloating(prev => [...prev.slice(-20), { id, emoji, x }]);
    setTimeout(() => {
      setFloating(prev => prev.filter(r => r.id !== id));
    }, 2500);
  };

  return (
    <>
      {/* Floating reactions overlay */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
        <AnimatePresence>
          {floating.map(r => (
            <motion.div
              key={r.id}
              initial={{ opacity: 1, y: 0, x: `${r.x}%` }}
              animate={{ opacity: 0, y: -300 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2.5, ease: 'easeOut' }}
              className="absolute bottom-10 text-3xl"
              style={{ left: `${r.x}%` }}
            >
              {r.emoji}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Reaction buttons */}
      <div className="flex items-center gap-1">
        {REACTIONS.map(emoji => (
          <Button
            key={emoji}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-lg hover:scale-125 transition-transform"
            onClick={() => sendReaction(emoji)}
            disabled={!user}
          >
            {emoji}
          </Button>
        ))}
      </div>
    </>
  );
};

export default LiveReactions;
