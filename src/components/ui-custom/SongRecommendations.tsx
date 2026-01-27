import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useAudio } from '@/context/AudioContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Sparkles, Music, TrendingUp, Heart, Disc } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Song } from '@/types/music';
import ShareSongButton from './ShareSongButton';

interface SongRecommendationsProps {
  className?: string;
}

const SongRecommendations: React.FC<SongRecommendationsProps> = ({ className }) => {
  const { user } = useAuth();
  const { playSong, currentSong, isPlaying } = useAudio();

  // Fetch user favorites
  const { data: userFavorites } = useQuery({
    queryKey: ['user-favorites', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('favorites')
        .select('song_id, songs(*)')
        .eq('user_id', user.id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch all songs with stats
  const { data: allSongs, isLoading } = useQuery({
    queryKey: ['songs-with-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('songs')
        .select('*')
        .eq('published', true);
      
      if (error) throw error;
      return data as Song[];
    },
  });

  // Fetch play statistics
  const { data: viewStats } = useQuery({
    queryKey: ['song-view-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('song_view_stats')
        .select('song_id, view_count');
      
      if (error) throw error;
      
      // Aggregate view counts by song
      const statsMap = new Map<string, number>();
      data?.forEach(stat => {
        const current = statsMap.get(stat.song_id) || 0;
        statsMap.set(stat.song_id, current + stat.view_count);
      });
      
      return statsMap;
    },
  });

  // Generate recommendations based on favorites and play stats
  const recommendations = React.useMemo(() => {
    if (!allSongs) return [];
    
    const favoriteGenres = new Set<string>();
    const favoriteArtists = new Set<string>();
    const favoriteSongIds = new Set<string>();

    // Analyze user favorites
    userFavorites?.forEach(fav => {
      if (fav.songs) {
        const song = fav.songs as unknown as Song;
        favoriteSongIds.add(fav.song_id);
        if (song.genre) favoriteGenres.add(song.genre);
        if (song.artist) favoriteArtists.add(song.artist);
      }
    });

    // Score each song
    const scoredSongs = allSongs
      .filter(song => !favoriteSongIds.has(song.id)) // Exclude already favorited
      .map(song => {
        let score = 0;
        
        // Genre match
        if (song.genre && favoriteGenres.has(song.genre)) {
          score += 30;
        }
        
        // Artist match
        if (song.artist && favoriteArtists.has(song.artist)) {
          score += 40;
        }
        
        // Popularity score from views
        const viewCount = viewStats?.get(song.id) || 0;
        score += Math.min(viewCount / 10, 20); // Cap at 20 points
        
        // Download popularity
        score += Math.min((song.download_count || 0) / 5, 10); // Cap at 10 points
        
        return { song, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);

    return scoredSongs;
  }, [allSongs, userFavorites, viewStats]);

  // Get trending songs (most played recently)
  const trendingSongs = React.useMemo(() => {
    if (!allSongs || !viewStats) return [];
    
    return allSongs
      .map(song => ({
        song,
        views: viewStats.get(song.id) || 0,
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 4)
      .map(item => item.song);
  }, [allSongs, viewStats]);

  const handlePlaySong = (song: Song) => {
    playSong(song, allSongs || []);
  };

  if (isLoading) {
    return (
      <Card className={`border-border ${className}`}>
        <CardContent className="p-6 flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Disc className="w-8 h-8 text-primary" />
          </motion.div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Personalized Recommendations */}
      {recommendations.length > 0 && (
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Recommended For You
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {recommendations.map(({ song, score }, index) => (
                  <motion.div
                    key={song.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`group relative bg-card border border-border rounded-lg overflow-hidden hover:border-primary/50 transition-all ${
                      currentSong?.id === song.id ? 'ring-2 ring-primary' : ''
                    }`}
                  >
                    <div className="relative h-32">
                      <img
                        src={song.cover_url || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400&q=80'}
                        alt={song.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="icon"
                          className="bg-primary hover:bg-primary/90 rounded-full w-12 h-12"
                          onClick={() => handlePlaySong(song)}
                        >
                          <Play className="h-6 w-6" />
                        </Button>
                      </div>
                      
                      {currentSong?.id === song.id && isPlaying && (
                        <div className="absolute top-2 right-2">
                          <motion.div
                            className="w-6 h-6 bg-primary rounded-full flex items-center justify-center"
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 1, repeat: Infinity }}
                          >
                            <Music className="w-3 h-3 text-primary-foreground" />
                          </motion.div>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-3">
                      <h4 className="font-semibold truncate">{song.title}</h4>
                      <p className="text-sm text-muted-foreground truncate">{song.artist}</p>
                      <div className="flex items-center justify-between mt-2">
                        {song.genre && (
                          <Badge variant="secondary" className="text-xs">
                            {song.genre}
                          </Badge>
                        )}
                        <ShareSongButton song={song} size="sm" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trending Songs */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            Trending Now
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {trendingSongs.map((song, index) => (
              <motion.div
                key={song.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors group ${
                  currentSong?.id === song.id ? 'bg-primary/10' : ''
                }`}
              >
                <span className="text-2xl font-bold text-muted-foreground w-8">
                  #{index + 1}
                </span>
                
                <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src={song.cover_url || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&h=80&q=80'}
                    alt={song.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => handlePlaySong(song)}
                    >
                      <Play className="h-4 w-4 text-white" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{song.title}</p>
                  <p className="text-sm text-muted-foreground truncate">{song.artist}</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {viewStats?.get(song.id) || 0} plays
                  </span>
                  <ShareSongButton song={song} />
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* No recommendations message */}
      {recommendations.length === 0 && user && (
        <Card className="border-border">
          <CardContent className="p-8 text-center">
            <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Build Your Profile</h3>
            <p className="text-muted-foreground">
              Add songs to your favorites to get personalized recommendations!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SongRecommendations;
