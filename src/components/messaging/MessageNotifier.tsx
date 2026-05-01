import React, { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useNavigate, useLocation } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';

/**
 * Global realtime listener for incoming private messages.
 * Shows a toast (with click-through to /messages) and refreshes
 * cached message queries so unread badges/counts update instantly.
 */
const MessageNotifier: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const senderNamesRef = useRef<Record<string, string>>({});

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`messages-notify-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'private_messages',
          filter: `receiver_id=eq.${user.id}`,
        },
        async (payload) => {
          const msg = payload.new as any;

          // Refresh caches
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
          queryClient.invalidateQueries({ queryKey: ['messages'] });
          queryClient.invalidateQueries({ queryKey: ['unread-message-count'] });

          // Don't notify if user is already viewing /messages
          if (location.pathname === '/messages') return;

          // Resolve sender display name (cached)
          let name = senderNamesRef.current[msg.sender_id];
          if (!name) {
            const { data } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('user_id', msg.sender_id)
              .maybeSingle();
            name = data?.full_name || `User ${msg.sender_id.slice(0, 6)}`;
            senderNamesRef.current[msg.sender_id] = name;
          }

          toast(`💬 ${name}`, {
            description: msg.message || '🎵 Shared a song',
            action: {
              label: 'Open',
              onClick: () => navigate('/messages'),
            },
            duration: 6000,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, location.pathname, navigate, queryClient]);

  return null;
};

export default MessageNotifier;
