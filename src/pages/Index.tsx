import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { Play, Music2, Headphones, Heart, Sparkles, Mic2, Radio } from 'lucide-react';
import { motion } from 'framer-motion';
import SongOfTheWeek from '@/components/ui-custom/SongOfTheWeek';
import PublicUpload from '@/components/ui-custom/PublicUpload';
import AdminPopup from '@/components/admin/AdminPopup';
import { useAuth } from '@/context/AuthContext';
import { useAudio } from '@/context/AudioContext';
import { supabase } from '@/integrations/supabase/client';
import { Song } from '@/types/music';

const Index: React.FC = () => {
  const { isAdmin } = useAuth();
  const { playSong } = useAudio();

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

  const handleRandomPlay = () => {
    if (featuredSongs && featuredSongs.length > 0) {
      const randomSong = featuredSongs[Math.floor(Math.random() * featuredSongs.length)];
      handlePlaySong(randomSong);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-background via-background to-card">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-10"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80)'
          }}
        />
        
        <div className="absolute inset-0 bg-gradient-to-b from-gold/5 via-transparent to-transparent" />
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative text-center px-4 max-w-5xl mx-auto py-20"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-heading font-bold mb-6 bg-gradient-to-r from-gold via-yellow-500 to-gold bg-clip-text text-transparent">
              Welcome to Bongo Old Skool!
            </h1>
          </motion.div>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-xl md:text-3xl mb-4 text-muted-foreground font-display"
          >
            Where every beat, every lyric, and every heartbreak from the 2000s still lives rent-free in our hearts.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="space-y-3 mb-10"
          >
            <p className="text-lg md:text-xl text-muted-foreground italic">
              "If you don't know who Mr. Nice is, this site will confuse you."
            </p>
            <p className="text-lg md:text-xl text-muted-foreground italic">
              "Home of real music, not this 'vibes only' nonsense."
            </p>
            <p className="text-lg md:text-xl text-muted-foreground italic">
              "Bongo Flava raised us — and probably ruined our love lives."
            </p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button 
              size="lg" 
              asChild 
              className="text-lg px-8 py-6 bg-gold hover:bg-gold/90 text-gold-foreground font-heading"
            >
              <Link to="/music">
                <Music2 className="mr-2 h-5 w-5" />
                Take Me to the Music
              </Link>
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              onClick={handleRandomPlay}
              className="text-lg px-8 py-6 border-gold/50 hover:bg-gold/10 font-heading"
            >
              <Headphones className="mr-2 h-5 w-5" />
              Play a Random Old Skool Hit
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* The Golden Era */}
      <section className="py-20 px-4 bg-gradient-to-b from-card to-background">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-6xl font-heading font-bold mb-6 bg-gradient-to-r from-gold to-yellow-600 bg-clip-text text-transparent">
              Before Wi-Fi, there was Wenge… and we survived!
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Step back to the days when phones had buttons, music videos had fog machines, and Dully Sykes was on every playlist. 
              Here at Bongo Old Skool, we keep those golden memories spinning — one throwback at a time.
            </p>
            <Button size="lg" asChild className="bg-gold hover:bg-gold/90 text-gold-foreground font-heading">
              <Link to="/music">
                <Headphones className="mr-2 h-5 w-5" />
                Start Vibing →
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Legends Never Fade */}
      <section className="py-20 px-4 bg-gradient-to-b from-background to-card">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-6xl font-heading font-bold mb-6">
              Meet the OGs Who Made History (and Broke Hearts)
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {[
              { 
                name: 'Professor Jay', 
                desc: 'Bars sharper than your teacher\'s cane.',
                icon: Mic2
              },
              { 
                name: 'Lady Jaydee', 
                desc: 'The queen who made heartbreak sound sweet.',
                icon: Heart
              },
              { 
                name: 'Juma Nature', 
                desc: 'Every verse, a Nairobi–Dar express trip.',
                icon: Radio
              }
            ].map((legend, index) => (
              <motion.div
                key={legend.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="group hover:shadow-xl transition-all duration-300 border-gold/20 hover:border-gold/50">
                  <CardContent className="p-6 text-center">
                    <div className="mb-4 flex justify-center">
                      <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <legend.icon className="w-8 h-8 text-gold" />
                      </div>
                    </div>
                    <h3 className="text-2xl font-heading font-bold mb-3">{legend.name}</h3>
                    <p className="text-muted-foreground italic">"{legend.desc}"</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <Button size="lg" asChild className="bg-gold hover:bg-gold/90 text-gold-foreground font-heading">
              <Link to="/music">
                <Sparkles className="mr-2 h-5 w-5" />
                See More Legends →
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Throwback of the Week */}
      <SongOfTheWeek />

      {/* Share Your Music */}
      <PublicUpload />

      {/* Latest Hits Grid */}
      <section className="py-20 px-4 bg-gradient-to-b from-card to-background">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-6xl font-heading font-bold mb-4">
              Latest Old Skool Hits
            </h2>
            <p className="text-lg text-muted-foreground">
              Fresh additions to the nostalgia collection
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
          >
            {featuredSongs?.slice(0, 6).map((song, index) => (
              <motion.div
                key={song.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-gold/20 hover:border-gold/50">
                  <CardContent className="p-0">
                    <div className="relative">
                      <img
                        src={song.cover_url || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300&q=80'}
                        alt={`${song.title} cover`}
                        className="w-full h-48 object-cover rounded-t-lg"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 rounded-t-lg flex items-center justify-center">
                        <Button
                          variant="secondary"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gold hover:bg-gold/90 text-gold-foreground"
                          onClick={() => handlePlaySong(song)}
                        >
                          <Play className="h-6 w-6" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <h3 className="font-heading font-semibold text-lg mb-1 line-clamp-1">{song.title}</h3>
                      <p className="text-muted-foreground mb-2 line-clamp-1">{song.artist}</p>
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
            viewport={{ once: true }}
            className="text-center"
          >
            <Button size="lg" asChild className="bg-gold hover:bg-gold/90 text-gold-foreground font-heading">
              <Link to="/music">
                View All Music →
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {isAdmin && <AdminPopup delay={20000} />}
    </div>
  );
};

export default Index;
