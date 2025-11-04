import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Play, Trash2, Music } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAudio } from '@/context/AudioContext';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Song } from '@/types/music';

export default function Favorites() {
  const [favorites, setFavorites] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { playSong } = useAudio();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    fetchFavorites();
  }, [isAuthenticated, user]);

  const fetchFavorites = async () => {
    try {
      setIsLoading(true);
      const { data: favoritesData, error: favError } = await supabase
        .from('favorites')
        .select('song_id')
        .eq('user_id', user?.id);

      if (favError) throw favError;

      if (favoritesData && favoritesData.length > 0) {
        const songIds = favoritesData.map(f => f.song_id);
        const { data: songsData, error: songsError } = await supabase
          .from('songs')
          .select('*')
          .in('id', songIds)
          .eq('published', true);

        if (songsError) throw songsError;
        setFavorites(songsData || []);
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
      toast({
        title: "Error",
        description: "Failed to load favorites",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const removeFavorite = async (songId: string) => {
    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user?.id)
        .eq('song_id', songId);

      if (error) throw error;

      setFavorites(favorites.filter(song => song.id !== songId));
      toast({
        title: "Removed from favorites",
        description: "Song removed successfully"
      });
    } catch (error) {
      console.error('Error removing favorite:', error);
      toast({
        title: "Error",
        description: "Failed to remove from favorites",
        variant: "destructive"
      });
    }
  };

  const handlePlay = (song: Song) => {
    playSong(song, favorites);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-gold/5 pt-20 pb-32">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-gold/20 to-gold/5 mb-6">
            <Heart className="w-10 h-10 text-gold fill-gold" />
          </div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-gold via-amber-300 to-gold bg-clip-text text-transparent">
            Your Favorites
          </h1>
          <p className="text-muted-foreground text-lg">
            {favorites.length} {favorites.length === 1 ? 'song' : 'songs'} that captured your heart
          </p>
        </motion.div>

        {favorites.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <Music className="w-20 h-20 mx-auto mb-6 text-muted-foreground/30" />
            <h3 className="text-2xl font-semibold mb-3 text-muted-foreground">
              No favorites yet
            </h3>
            <p className="text-muted-foreground mb-8">
              Start adding songs to your favorites to see them here
            </p>
            <Button 
              onClick={() => navigate('/music')}
              className="bg-gradient-to-r from-gold to-amber-500 hover:from-gold/90 hover:to-amber-600"
            >
              Explore Music
            </Button>
          </motion.div>
        ) : (
          <div className="grid gap-4 max-w-4xl mx-auto">
            {favorites.map((song, index) => (
              <motion.div
                key={song.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group relative bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-4 hover:border-gold/50 transition-all duration-300"
              >
                <div className="flex items-center gap-4">
                  <div className="relative flex-shrink-0">
                    <img
                      src={song.cover_url}
                      alt={song.title}
                      className="w-20 h-20 rounded-xl object-cover"
                    />
                    <button
                      onClick={() => handlePlay(song)}
                      className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"
                    >
                      <Play className="w-8 h-8 text-gold fill-gold" />
                    </button>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg truncate">{song.title}</h3>
                    <p className="text-muted-foreground truncate">{song.artist}</p>
                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                      <span>{song.genre}</span>
                      <span>•</span>
                      <span>{song.year}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => removeFavorite(song.id)}
                    className="p-2 rounded-full hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="w-5 h-5 text-destructive" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
