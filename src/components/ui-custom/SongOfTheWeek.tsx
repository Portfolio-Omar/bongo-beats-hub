import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from '@/integrations/supabase/client';
import { Song } from '@/types/music';
import { motion } from 'framer-motion';
import { Play, Pause, Download } from 'lucide-react';

const SongOfTheWeek: React.FC = () => {
  const [song, setSong] = useState<Song | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  useEffect(() => {
    const fetchSongOfTheWeek = async () => {
      try {
        setLoading(true);
        const randomSongId = localStorage.getItem('random_song_id');
        
        if (randomSongId) {
          const { data: songData, error: songError } = await supabase
            .from('songs').select('*').eq('id', randomSongId).single();
          if (!songError && songData) { setSong(songData); setLoading(false); return; }
        }
        
        const { data: sotw, error: sotwError } = await supabase
          .from('song_of_the_week')
          .select('*, song:song_id(*)')
          .eq('active', true)
          .order('feature_date', { ascending: false })
          .limit(1)
          .single();
          
        if (sotwError) {
          const { data: fallbackSongs } = await supabase
            .from('songs').select('*').eq('published', true).order('created_at', { ascending: false }).limit(20);
          if (fallbackSongs && fallbackSongs.length > 0) {
            setSong(fallbackSongs[Math.floor(Math.random() * fallbackSongs.length)]);
          } else { setError('No songs available.'); }
        } else if (sotw?.song) {
          setSong(sotw.song);
        } else { setError('No featured song available.'); }
      } catch { setError('An unexpected error occurred.'); }
      finally { setLoading(false); }
    };
    fetchSongOfTheWeek();
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
    }
  };
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="w-full max-w-4xl mx-auto h-96 rounded-2xl animate-pulse bg-accent/10" />
      </div>
    );
  }
  
  if (error || !song) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center text-muted-foreground">{error || 'No song available.'}</div>
      </div>
    );
  }

  return (
    <section className="relative py-24 overflow-hidden bg-gradient-to-b from-card to-background">
      <div className="absolute inset-0 bg-gradient-to-br from-gold/5 via-transparent to-gold/10" />
      <motion.div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold/10 rounded-full blur-3xl"
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }} transition={{ duration: 8, repeat: Infinity }} />
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="text-center mb-12">
          <motion.div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 text-gold-foreground font-medium text-sm mb-6 border border-gold/30" whileHover={{ scale: 1.05 }}>
            <div className="w-2 h-2 bg-gold rounded-full animate-pulse" />
            Throwback of the Week
          </motion.div>
          <h2 className="text-4xl md:text-6xl font-heading font-bold bg-gradient-to-r from-gold to-yellow-600 bg-clip-text text-transparent mb-4">
            🎵 This one used to shut down every club in Sinza
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto italic">
            "Because auto-tune wasn't needed for real emotions"
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="max-w-5xl mx-auto">
          <Card className="overflow-hidden border border-gold/30 shadow-2xl bg-gradient-to-br from-background/80 to-background/60 backdrop-blur-xl">
            <CardContent className="p-0">
              <audio ref={audioRef} src={song.audio_url} preload="metadata" onEnded={() => setIsPlaying(false)} />
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-0">
                {/* Cover Art */}
                <div className="lg:col-span-2 relative h-80 lg:h-auto overflow-hidden group">
                  <motion.div className="absolute inset-0 bg-gradient-to-br from-gold/30 via-transparent to-gold/20"
                    animate={{ opacity: [0.3, 0.5, 0.3] }} transition={{ duration: 4, repeat: Infinity }} />
                  {song.cover_url ? (
                    <motion.img src={song.cover_url} alt={`${song.title} by ${song.artist}`} className="w-full h-full object-cover"
                      whileHover={{ scale: 1.05 }} transition={{ duration: 0.6 }} />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }} className="text-6xl text-primary/50">♪</motion.div>
                    </div>
                  )}
                </div>
                
                {/* Song Info - Simplified Controls */}
                <div className="lg:col-span-3 p-8 lg:p-12 flex flex-col justify-center">
                  <div className="mb-8">
                    <h3 className="text-3xl lg:text-5xl font-bold mb-3">{song.title}</h3>
                    <p className="text-xl lg:text-2xl text-muted-foreground mb-6">{song.artist}</p>
                    <div className="flex flex-wrap gap-3 mb-6">
                      {song.genre && (
                        <div className="px-4 py-2 rounded-full bg-gold/10 text-gold-foreground font-medium border border-gold/30">{song.genre}</div>
                      )}
                      {song.year && (
                        <div className="px-4 py-2 rounded-full bg-gold/5 text-foreground font-medium border border-gold/30">{song.year}</div>
                      )}
                      <div className="px-4 py-2 rounded-full bg-muted text-muted-foreground font-medium flex items-center gap-2">
                        <Download className="w-4 h-4" />{song.download_count || 0} downloads
                      </div>
                    </div>
                  </div>
                  
                  {/* Simple Play/Pause Only */}
                  <div className="flex items-center gap-4">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        size="lg"
                        onClick={togglePlay}
                        className="rounded-full w-16 h-16 bg-gold hover:bg-gold/90 text-gold-foreground shadow-xl"
                      >
                        {isPlaying ? <Pause className="h-7 w-7" /> : <Play className="h-7 w-7 ml-1" />}
                      </Button>
                    </motion.div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {isPlaying ? 'Now Playing' : 'Tap to play'}
                      </p>
                    </div>
                  </div>
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
