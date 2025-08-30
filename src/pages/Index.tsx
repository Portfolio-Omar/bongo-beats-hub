
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { Play, Music, Headphones, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import Hero from '@/components/ui-custom/Hero';
import SongOfTheWeek from '@/components/ui-custom/SongOfTheWeek';
import PublicUpload from '@/components/ui-custom/PublicUpload';
import AdminPopup from '@/components/admin/AdminPopup';
import { useAuth } from '@/context/AuthContext';
import { useAudio } from '@/context/AudioContext';
import { supabase } from '@/integrations/supabase/client';
import { Song } from '@/types/music';

const Index: React.FC = () => {
  const { isAdminAuthenticated } = useAuth();
  const { playSong } = useAudio();

  // Fetch latest songs for homepage display
  const { data: featuredSongs } = useQuery({
    queryKey: ['featured-songs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('songs')
        .select('*')
        .eq('published', true)
        .order('created_at', { ascending: false })
        .limit(6);
      
      if (error) throw error;
      return data || [];
    }
  });

  const handlePlaySong = (song: Song) => {
    playSong(song, featuredSongs || []);
  };
  
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80)'
          }}
        />
        <div className="absolute inset-0 bg-black/40" />
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative text-center text-white px-4 max-w-4xl mx-auto"
        >
          <h1 className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
            Music Portal
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-white/90">
            Discover the Best Bongo Music Collection
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="text-lg px-8 py-6">
              <Link to="/music">
                <Music className="mr-2 h-5 w-5" />
                Explore Music
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6 bg-white/10 border-white/30 text-white hover:bg-white/20">
              <Headphones className="mr-2 h-5 w-5" />
              Listen Now
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Featured Song Section */}
      <SongOfTheWeek />

      {/* Public Upload Section */}
      <PublicUpload />

      {/* Latest Music Section */}
      <section className="py-16 bg-background/50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold mb-4">Latest Music</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Check out our newest additions to the music collection
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
          >
            {featuredSongs?.slice(0, 6).map((song, index) => (
              <motion.div
                key={song.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer">
                  <CardContent className="p-0">
                    <div className="relative">
                      <img
                        src={song.cover_url || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300&q=80'}
                        alt={`${song.title} cover`}
                        className="w-full h-48 object-cover rounded-t-lg"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 rounded-t-lg flex items-center justify-center">
                        <Button
                          variant="secondary"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                          onClick={() => handlePlaySong(song)}
                        >
                          <Play className="h-6 w-6" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <h3 className="font-semibold text-lg mb-1 line-clamp-1">{song.title}</h3>
                      <p className="text-muted-foreground mb-2 line-clamp-1">{song.artist}</p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                          {song.genre && (
                            <Badge variant="secondary" className="text-xs">
                              {song.genre}
                            </Badge>
                          )}
                          {song.year && (
                            <Badge variant="outline" className="text-xs">
                              {song.year}
                            </Badge>
                          )}
                        </div>
                        
                        {song.download_count && song.download_count > 0 && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Download className="h-3 w-3" />
                            {song.download_count}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-center"
          >
            <Button size="lg" asChild>
              <Link to="/music">
                View All Music
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {isAdminAuthenticated && <AdminPopup delay={20000} />}
    </div>
  );
};

export default Index;
