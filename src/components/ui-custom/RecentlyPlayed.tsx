import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Clock, Music2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAudio } from '@/context/AudioContext';
import { Song } from '@/types/music';

const RecentlyPlayed: React.FC = () => {
  const { playSong, currentSong, isPlaying } = useAudio();
  const [recentSongs, setRecentSongs] = useState<Song[]>([]);

  useEffect(() => {
    const load = () => {
      try {
        const data = JSON.parse(localStorage.getItem('recentlyPlayed') || '[]');
        setRecentSongs(data.slice(0, 10));
      } catch {
        setRecentSongs([]);
      }
    };
    load();

    // Re-check when a song starts playing
    const interval = setInterval(load, 3000);
    return () => clearInterval(interval);
  }, []);

  if (recentSongs.length === 0) return null;

  return (
    <section className="py-16 px-4 bg-gradient-to-b from-background to-card">
      <div className="container mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <Clock className="h-10 w-10 text-gold mx-auto mb-3" />
          <h2 className="text-3xl md:text-5xl font-heading font-bold mb-2">Recently Played</h2>
          <p className="text-muted-foreground">Pick up where you left off</p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {recentSongs.map((song, i) => {
            const isActive = currentSong?.id === song.id;
            return (
              <motion.div
                key={`${song.id}-${i}`}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                viewport={{ once: true }}
              >
                <Card
                  className={`group cursor-pointer transition-all duration-300 border-gold/20 hover:border-gold/50 hover:shadow-lg overflow-hidden ${
                    isActive ? 'ring-2 ring-gold border-gold/60' : ''
                  }`}
                  onClick={() => playSong(song, recentSongs)}
                >
                  <CardContent className="p-0">
                    <div className="relative aspect-square">
                      <img
                        src={song.cover_url || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'}
                        alt={song.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-300 flex items-center justify-center">
                        {isActive && isPlaying ? (
                          <div className="flex gap-1 items-end h-6">
                            {[1, 2, 3].map(bar => (
                              <motion.div
                                key={bar}
                                className="w-1 bg-gold rounded-full"
                                animate={{ height: ['40%', '100%', '60%', '100%', '40%'] }}
                                transition={{ duration: 0.8, repeat: Infinity, delay: bar * 0.15 }}
                              />
                            ))}
                          </div>
                        ) : (
                          <Button
                            variant="secondary"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 transition-opacity bg-gold hover:bg-gold/90 text-gold-foreground h-10 w-10"
                          >
                            <Play className="h-5 w-5" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="p-3">
                      <p className="font-heading font-semibold text-sm line-clamp-1">{song.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{song.artist}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default RecentlyPlayed;
