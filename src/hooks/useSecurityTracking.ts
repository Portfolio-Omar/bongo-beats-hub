import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const generateFingerprint = (): string => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('fingerprint', 2, 2);
  }
  const screenData = `${screen.width}x${screen.height}x${screen.colorDepth}`;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const languages = navigator.languages?.join(',') || navigator.language;
  const platform = navigator.platform;
  const raw = `${canvas.toDataURL()}|${screenData}|${timezone}|${languages}|${platform}`;
  
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
};

export const useSecurityTracking = () => {
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const trackLogin = async () => {
      try {
        const fingerprint = generateFingerprint();

        // Record fingerprint
        await supabase.from('device_fingerprints').insert({
          user_id: user.id,
          fingerprint,
          user_agent: navigator.userAgent,
          ip_address: null, // Would need server-side to get real IP
        });

        // Record login activity
        await supabase.from('login_activity').insert({
          user_id: user.id,
          user_agent: navigator.userAgent,
          ip_address: null,
        });

        // Bot detection: check for headless browser indicators
        const isBot = (navigator as any).webdriver === true || 
          (navigator as any).plugins?.length === 0 ||
          !(window as any).chrome;
        
        if (isBot) {
          await supabase.from('security_flags').insert({
            user_id: user.id,
            flag_type: 'bot_detected',
            description: 'Headless browser indicators detected',
            severity: 'high',
          });
        }
      } catch (err) {
        console.error('Security tracking error:', err);
      }
    };

    trackLogin();
  }, [isAuthenticated, user?.id]);
};
