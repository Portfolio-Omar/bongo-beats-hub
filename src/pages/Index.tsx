
import React, { useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import Hero from '@/components/ui-custom/Hero';
import SongOfTheDay from '@/components/ui-custom/SongOfTheDay';
import AdminPopup from '@/components/admin/AdminPopup';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const Index: React.FC = () => {
  const { isAuthenticated } = useAuth();
  
  useEffect(() => {
    // This effect runs only once when the page loads
    // to track the home page visit
    const trackHomePageVisit = async () => {
      try {
        const { data: songOfDayData, error: songOfDayError } = await supabase
          .from('song_of_the_week')
          .select('song_id')
          .eq('active', true)
          .order('feature_date', { ascending: false })
          .limit(1)
          .maybeSingle();
          
        if (songOfDayError || !songOfDayData) {
          console.error('Error fetching song of the day for tracking:', songOfDayError);
          return;
        }
        
        // Call the function to increment view count
        const { error: rpcError } = await supabase.rpc(
          'increment_song_view',
          { _song_id: songOfDayData.song_id }
        );
        
        if (rpcError) {
          console.error('Error incrementing song view:', rpcError);
        }
      } catch (error) {
        console.error('Error in trackHomePageVisit:', error);
      }
    };
    
    trackHomePageVisit();
  }, []);
  
  return (
    <Layout>
      <Hero />
      <SongOfTheDay />
      {isAuthenticated && <AdminPopup delay={20000} />}
    </Layout>
  );
};

export default Index;
