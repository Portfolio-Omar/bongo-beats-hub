
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import MusicPlayer from './MusicPlayer';
import { supabase } from '@/integrations/supabase/client';
import { Song } from '@/types/music';
import { motion } from 'framer-motion';

const SongOfTheWeek: React.FC = () => {
  const [song, setSong] = useState<Song | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchSongOfTheWeek = async () => {
      try {
        setLoading(true);
        
        // First check if we have a random song ID from the homepage
        const randomSongId = localStorage.getItem('random_song_id');
        
        if (randomSongId) {
          // If we have a random song ID, fetch that specific song
          const { data: songData, error: songError } = await supabase
            .from('songs')
            .select('*')
            .eq('id', randomSongId)
            .single();
          
          if (songError) {
            console.error('Error fetching random song:', songError);
            setError('Failed to load featured song.');
            // If error, fallback to regular song of the week
          } else if (songData) {
            // Ensure download_count exists in the data
            setSong({
              ...songData,
              download_count: songData.download_count || 0
            });
            setLoading(false);
            return;
          }
        }
        
        // If no random song or there was an error, fetch the official song of the week
        const { data: sotw, error: sotwError } = await supabase
          .from('song_of_the_week')
          .select('*, song:song_id(*)')
          .eq('active', true)
          .order('feature_date', { ascending: false })
          .limit(1)
          .single();
          
        if (sotwError) {
          console.error('Error fetching song of the week:', sotwError);
          
          // If no song of the week is set, fallback to a random song
          const { data: fallbackSongs, error: fallbackError } = await supabase
            .from('songs')
            .select('*')
            .eq('published', true)
            .order('created_at', { ascending: false })
            .limit(20);
            
          if (fallbackError || !fallbackSongs || fallbackSongs.length === 0) {
            setError('No songs available at the moment.');
          } else {
            // Randomly select one song
            const randomIndex = Math.floor(Math.random() * fallbackSongs.length);
            const selectedSong = fallbackSongs[randomIndex];
            // Ensure download_count exists in the data
            setSong({
              ...selectedSong,
              download_count: selectedSong.download_count || 0
            });
          }
        } else if (sotw && sotw.song) {
          // Ensure download_count exists in the data
          setSong({
            ...sotw.song,
            download_count: sotw.song.download_count || 0
          });
        } else {
          setError('No featured song available.');
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        setError('An unexpected error occurred.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSongOfTheWeek();
  }, []);
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="skeleton-card w-full max-w-4xl mx-auto h-96 rounded-2xl animate-pulse bg-accent/10" />
      </div>
    );
  }
  
  if (error || !song) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center text-muted-foreground">
          {error || 'No song available at the moment.'}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-accent/5 to-background">
          <div className="relative">
            {/* Decorative elements */}
            <div className="absolute top-0 left-0 w-48 h-48 bg-primary/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-accent/10 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl" />
            
            <CardContent className="p-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                {/* Cover Art Section */}
                <div className="relative h-64 md:h-auto overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 mix-blend-overlay" />
                  {song.cover_url ? (
                    <img 
                      src={song.cover_url} 
                      alt={`${song.title} by ${song.artist}`} 
                      className="w-full h-full object-cover md:h-full"
                    />
                  ) : (
                    <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                      <span className="text-4xl text-primary/50">♪</span>
                    </div>
                  )}
                </div>
                
                {/* Song Info & Player Section */}
                <div className="p-6 md:p-8 flex flex-col relative">
                  <div className="mb-6">
                    <span className="text-xs font-medium bg-primary/10 text-primary px-3 py-1 rounded-full">
                      Featured Song
                    </span>
                    <h2 className="mt-3 text-2xl md:text-3xl font-display font-bold">{song.title}</h2>
                    <p className="text-lg text-muted-foreground">{song.artist}</p>
                    
                    <div className="mt-2 flex flex-wrap gap-2">
                      {song.genre && (
                        <span className="text-xs bg-muted px-2 py-1 rounded text-muted-foreground">
                          {song.genre}
                        </span>
                      )}
                      {song.year && (
                        <span className="text-xs bg-muted px-2 py-1 rounded text-muted-foreground">
                          {song.year}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Music Player */}
                  <div className="mt-auto">
                    <MusicPlayer 
                      song={{
                        id: song.id,
                        title: song.title,
                        artist: song.artist,
                        coverUrl: song.cover_url || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400&q=80',
                        audioUrl: song.audio_url,
                        downloadCount: song.download_count
                      }}
                      onPlayNext={() => {}}
                      onPlayPrevious={() => {}}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default SongOfTheWeek;
