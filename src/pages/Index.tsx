
import React, { useEffect } from 'react';

import Hero from '@/components/ui-custom/Hero';
import SongOfTheWeek from '@/components/ui-custom/SongOfTheWeek';
import AdminPopup from '@/components/admin/AdminPopup';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const Index: React.FC = () => {
  const { isAuthenticated } = useAuth();
  
  useEffect(() => {
    // This effect runs only once when the page loads
    // to track the home page visit and select a random song
    const trackHomePageVisit = async () => {
      try {
        // Get a random song instead of featured song
        const { data: randomSongData, error: randomSongError } = await supabase
          .from('songs')
          .select('id')
          .eq('published', true)
          .order('created_at', { ascending: false })
          .limit(100);
          
        if (randomSongError || !randomSongData || randomSongData.length === 0) {
          console.error('Error fetching random songs for tracking:', randomSongError);
          return;
        }
        
        // Randomly select one song from the array
        const randomIndex = Math.floor(Math.random() * randomSongData.length);
        const selectedSongId = randomSongData[randomIndex].id;
        
        // Call the function to increment view count
        const { error: rpcError } = await supabase.rpc(
          'increment_song_view',
          { _song_id: selectedSongId }
        );
        
        if (rpcError) {
          console.error('Error incrementing song view:', rpcError);
        }
        
        console.log('Random song selected and view tracked:', selectedSongId);
        
        // Also set this song as the current song of the week in local storage
        // This allows SongOfTheWeek component to display a random song on each visit
        localStorage.setItem('random_song_id', selectedSongId);
      } catch (error) {
        console.error('Error in trackHomePageVisit:', error);
      }
    };
    
    trackHomePageVisit();
  }, []);
  
  return (
    <>
      <Hero />
      <SongOfTheWeek />
      {isAuthenticated && <AdminPopup delay={20000} />}
    </>
  );
};

export default Index;
