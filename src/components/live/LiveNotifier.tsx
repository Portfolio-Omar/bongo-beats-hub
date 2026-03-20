import React, { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const LiveNotifier: React.FC = () => {
  const navigate = useNavigate();
  const notifiedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const channel = supabase.channel('live-notifications')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'live_sessions',
        filter: 'status=eq.live',
      }, (payload) => {
        const session = payload.new as any;
        if (notifiedRef.current.has(session.id)) return;
        notifiedRef.current.add(session.id);

        toast({
          title: `🔴 ${session.artist_name} is now LIVE!`,
          description: session.title,
          action: (
            <button
              onClick={() => navigate('/live')}
              className="text-xs font-semibold text-primary hover:underline"
            >
              Watch Now
            </button>
          ),
          duration: 10000,
        });
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'live_sessions',
        filter: 'status=eq.live',
      }, (payload) => {
        const session = payload.new as any;
        if (notifiedRef.current.has(session.id)) return;
        notifiedRef.current.add(session.id);

        toast({
          title: `🔴 ${session.artist_name} is now LIVE!`,
          description: session.title,
          action: (
            <button
              onClick={() => navigate('/live')}
              className="text-xs font-semibold text-primary hover:underline"
            >
              Watch Now
            </button>
          ),
          duration: 10000,
        });
      });

    channel.subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [navigate]);

  return null;
};

export default LiveNotifier;
