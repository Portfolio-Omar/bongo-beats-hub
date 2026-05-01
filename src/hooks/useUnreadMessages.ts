import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export function useUnreadMessages() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: count = 0 } = useQuery({
    queryKey: ['unread-message-count', user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { count } = await supabase
        .from('private_messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .eq('is_read', false);
      return count || 0;
    },
    enabled: !!user,
    refetchInterval: 15000,
  });

  // Realtime invalidation
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`unread-${user.id}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'private_messages',
        filter: `receiver_id=eq.${user.id}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['unread-message-count'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user?.id, queryClient]);

  return count;
}
