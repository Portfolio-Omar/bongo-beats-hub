import React, { useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const ReferralNotifier: React.FC = () => {
  const { user } = useAuth();
  const notifiedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;

    // Subscribe to realtime changes on referrals where user is the referrer
    const channel = supabase
      .channel('referral-bonus-notifications')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'referrals',
          filter: `referrer_id=eq.${user.id}`,
        },
        (payload) => {
          const newRow = payload.new as any;
          if (newRow.bonus_paid && !notifiedRef.current.has(newRow.id)) {
            notifiedRef.current.add(newRow.id);
            toast.success('🎉 Referral Bonus Earned! KSh 10 added to your balance!', {
              duration: 6000,
              description: 'Your friend listened to 10 songs. Keep sharing!',
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return null;
};

export default ReferralNotifier;
