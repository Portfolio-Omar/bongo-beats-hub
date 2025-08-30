
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import MusicPlayer from './MusicPlayer';
import { supabase } from '@/integrations/supabase/client';
import { Song } from '@/types/music';
import { motion } from 'framer-motion';
import { Play, Download } from 'lucide-react';

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
            setSong(songData);
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
            setSong(selectedSong);
          }
        } else if (sotw && sotw.song) {
          setSong(sotw.song);
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
    <section className="relative py-24 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
      
      {/* Floating orbs */}
      <motion.div 
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl"
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3]
        }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      <motion.div 
        className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-accent/10 rounded-full blur-3xl"
        animate={{ 
          scale: [1.2, 1, 1.2],
          opacity: [0.5, 0.3, 0.5]
        }}
        transition={{ duration: 6, repeat: Infinity, delay: 2 }}
      />
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm mb-6"
            whileHover={{ scale: 1.05 }}
          >
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            Featured This Week
          </motion.div>
          <h2 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-4">
            Song of the Week
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover our hand-picked selection of the finest Bongo music
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-5xl mx-auto"
        >
          <Card className="overflow-hidden border-0 shadow-2xl bg-gradient-to-br from-background/80 to-background/60 backdrop-blur-xl">
            <CardContent className="p-0">
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-0">
                {/* Cover Art Section - Enhanced */}
                <div className="lg:col-span-2 relative h-80 lg:h-auto overflow-hidden group">
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-br from-primary/30 via-transparent to-accent/30"
                    animate={{ opacity: [0.3, 0.5, 0.3] }}
                    transition={{ duration: 4, repeat: Infinity }}
                  />
                  {song.cover_url ? (
                    <motion.img 
                      src={song.cover_url} 
                      alt={`${song.title} by ${song.artist}`} 
                      className="w-full h-full object-cover"
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.6 }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                        className="text-6xl text-primary/50"
                      >
                        ♪
                      </motion.div>
                    </div>
                  )}
                  
                  {/* Overlay with play button */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-500 flex items-center justify-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      whileHover={{ scale: 1 }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    >
                      <Button
                        size="lg"
                        className="rounded-full w-16 h-16 shadow-2xl"
                        onClick={() => {}}
                      >
                        <Play className="h-6 w-6 ml-1" />
                      </Button>
                    </motion.div>
                  </div>
                </div>
                
                {/* Song Info & Controls Section - Enhanced */}
                <div className="lg:col-span-3 p-8 lg:p-12 flex flex-col justify-center relative">
                  <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                  >
                    <div className="mb-8">
                      <motion.h3 
                        className="text-3xl lg:text-5xl font-bold mb-3 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent"
                        whileHover={{ scale: 1.02 }}
                      >
                        {song.title}
                      </motion.h3>
                      <motion.p 
                        className="text-xl lg:text-2xl text-muted-foreground mb-6"
                        whileHover={{ scale: 1.02 }}
                      >
                        {song.artist}
                      </motion.p>
                      
                      <div className="flex flex-wrap gap-3 mb-6">
                        {song.genre && (
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            className="px-4 py-2 rounded-full bg-primary/10 text-primary font-medium"
                          >
                            {song.genre}
                          </motion.div>
                        )}
                        {song.year && (
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            className="px-4 py-2 rounded-full bg-accent/10 text-accent-foreground font-medium"
                          >
                            {song.year}
                          </motion.div>
                        )}
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          className="px-4 py-2 rounded-full bg-muted text-muted-foreground font-medium flex items-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                          {song.download_count || 0} downloads
                        </motion.div>
                      </div>
                    </div>
                    
                    {/* Enhanced Music Player */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.5 }}
                      className="space-y-4"
                    >
                      <MusicPlayer 
                        song={{
                          id: song.id,
                          title: song.title,
                          artist: song.artist,
                          coverUrl: song.cover_url || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400&q=80',
                          audioUrl: song.audio_url,
                          downloadCount: song.download_count || 0
                        }}
                        onPlayNext={() => {}}
                        onPlayPrevious={() => {}}
                      />
                    </motion.div>
                  </motion.div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
};

export default SongOfTheWeek;
