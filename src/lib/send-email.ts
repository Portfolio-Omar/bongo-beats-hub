import { supabase } from '@/integrations/supabase/client';

export const sendEmail = async (type: string, to?: string, data?: Record<string, any>) => {
  try {
    const { data: result, error } = await supabase.functions.invoke('send-email', {
      body: { type, to, data },
    });
    if (error) console.error('Email send error:', error);
    return result;
  } catch (err) {
    console.error('Email invoke error:', err);
  }
};
