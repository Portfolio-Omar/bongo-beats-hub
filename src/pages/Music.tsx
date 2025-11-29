import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAudio } from "@/context/AudioContext";
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Download, Play, Search, Grid, List, Music2, Disc, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Song } from '@/types/music';
import BackgroundSlideshow from '@/components/ui-custom/BackgroundSlideshow';
import AddToPlaylistMenu from '@/components/playlists/AddToPlaylistMenu';

const Music = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('title');
  const [filterGenre, setFilterGenre] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { toast } = useToast();
  const { playSong, currentSong, isPlaying } = useAudio();

  const { data: songs, isLoading } = useQuery({
    queryKey: ['songs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('songs')
        .select('*')
        .eq('published', true);
      
      if (error) {
        console.error('Error fetching songs:', error);
        toast({
          title: "Error",
          description: "Failed to load songs",
          variant: "destructive",
        });
        throw error;
      }
      
      return data || [];
    }
  });

  const genres = songs 
    ? ['all', ...new Set(songs.filter(song => song.genre).map(song => song.genre as string))]
    : ['all'];

  const filteredSongs = songs ? songs.filter(song => {
    const matchesSearch = 
      song.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      song.artist.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGenre = filterGenre === 'all' || !filterGenre || song.genre === filterGenre;
    return matchesSearch && matchesGenre;
  }) : [];

  const sortedSongs = [...filteredSongs].sort((a, b) => {
    if (sortBy === 'title') return a.title.localeCompare(b.title);
    if (sortBy === 'artist') return a.artist.localeCompare(b.artist);
    if (sortBy === 'year' && a.year && b.year) return a.year.localeCompare(b.year);
    return 0;
  });

  const handleDownload = async (song: Song, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      const { error } = await supabase
        .from('songs')
        .update({ download_count: (song.download_count || 0) + 1 })
        .eq('id', song.id);

      if (error) throw error;

      const link = document.createElement('a');
      link.href = song.audio_url;
      link.download = `${song.artist} - ${song.title}.mp3`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Download started",
        description: `${song.title} by ${song.artist}`,
      });
    } catch (error) {
      console.error('Error downloading song:', error);
      toast({
        title: "Download failed",
        description: "Unable to download the song",
        variant: "destructive",
      });
    }
  };

  const handlePlaySong = async (song: Song) => {
    playSong(song, sortedSongs);
    
    // Track play statistics
    try {
      const { error } = await supabase.rpc('increment_song_view', { 
        _song_id: song.id 
      });
      
      if (error) {
        console.error('Error tracking play:', error);
      }
    } catch (error) {
      console.error('Error tracking play:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-96">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16"
          >
            <Disc className="w-full h-full text-gold" />
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32 relative">
      <BackgroundSlideshow />
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-gold/20 via-gold/10 to-gold/20 border-b border-gold/30">
        <div className="container mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <Music2 className="w-12 h-12 text-gold" />
              <h1 className="text-5xl md:text-6xl font-heading font-bold bg-gradient-to-r from-gold to-yellow-600 bg-clip-text text-transparent">
                Bongo Old Skool Vibes
              </h1>
            </div>
            <motion.p 
              className="text-lg text-muted-foreground font-display italic"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              Vintage beats, modern feels. Every lyric hits different in 2025.
            </motion.p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Search and Filter Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-col md:flex-row gap-4 mb-8"
        >
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search songs or artists..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-card border-gold/30 focus:border-gold"
            />
          </div>

          <div className="flex gap-2">
            <Select value={filterGenre} onValueChange={setFilterGenre}>
              <SelectTrigger className="w-[150px] bg-card border-gold/30">
                <SelectValue placeholder="Genre" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Genres</SelectItem>
                {genres.filter(genre => genre !== 'all').map((genre) => (
                  <SelectItem key={genre} value={genre}>
                    {genre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[120px] bg-card border-gold/30">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="title">Title</SelectItem>
                <SelectItem value="artist">Artist</SelectItem>
                <SelectItem value="year">Year</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex border border-gold/30 rounded-lg bg-card">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className={`rounded-r-none ${viewMode === 'grid' ? 'bg-gold hover:bg-gold/90 text-gold-foreground' : ''}`}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className={`rounded-l-none ${viewMode === 'list' ? 'bg-gold hover:bg-gold/90 text-gold-foreground' : ''}`}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Songs Display */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className={viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            : "space-y-4"
          }
        >
          {sortedSongs.map((song, index) => (
            <motion.div
              key={song.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
            >
              {viewMode === 'grid' ? (
                <Card className={`group hover:shadow-2xl transition-all duration-300 cursor-pointer border-gold/20 hover:border-gold/50 ${
                  currentSong?.id === song.id ? 'ring-2 ring-gold shadow-lg shadow-gold/20' : ''
                }`}>
                  <CardContent className="p-0">
                    <div className="relative">
                      <img
                        src={song.cover_url || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400&q=80'}
                        alt={`${song.title} cover`}
                        className="w-full h-48 object-cover rounded-t-lg"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-t-lg flex items-center justify-center">
                        <Button
                          variant="secondary"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gold hover:bg-gold/90 text-gold-foreground shadow-xl scale-110"
                          onClick={() => handlePlaySong(song)}
                        >
                          <Play className="h-6 w-6" />
                        </Button>
                      </div>
                      
                      {/* Now Playing Indicator */}
                      {currentSong?.id === song.id && isPlaying && (
                        <div className="absolute top-2 right-2">
                          <motion.div
                            className="w-8 h-8 bg-gold rounded-full flex items-center justify-center"
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 1, repeat: Infinity }}
                          >
                            <Music2 className="w-4 h-4 text-gold-foreground" />
                          </motion.div>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-4">
                      <h3 className="font-heading font-semibold text-lg mb-1 line-clamp-1">{song.title}</h3>
                      <p className="text-muted-foreground mb-3 line-clamp-1">{song.artist}</p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                          {song.genre && (
                            <Badge variant="secondary" className="text-xs bg-gold/10 text-gold border-gold/30">
                              {song.genre}
                            </Badge>
                          )}
                          {song.year && (
                            <Badge variant="outline" className="text-xs border-gold/30">
                              {song.year}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex gap-1">
                          <AddToPlaylistMenu songId={song.id} />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-gold/10 hover:text-gold"
                            onClick={(e) => handleDownload(song, e)}
                            title="Download song"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {song.download_count && song.download_count > 0 && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                          <Download className="h-3 w-3" />
                          {song.download_count} downloads
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className={`group hover:shadow-xl transition-all duration-300 border-gold/20 hover:border-gold/50 ${
                  currentSong?.id === song.id ? 'ring-2 ring-gold shadow-lg shadow-gold/20' : ''
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="relative flex-shrink-0">
                        <img
                          src={song.cover_url || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&h=80&q=80'}
                          alt={`${song.title} cover`}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 rounded-lg flex items-center justify-center">
                          <Button
                            variant="secondary"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 h-10 w-10 bg-gold hover:bg-gold/90 text-gold-foreground"
                            onClick={() => handlePlaySong(song)}
                          >
                            <Play className="h-5 w-5" />
                          </Button>
                        </div>
                        
                        {currentSong?.id === song.id && isPlaying && (
                          <div className="absolute -top-1 -right-1">
                            <motion.div
                              className="w-6 h-6 bg-gold rounded-full flex items-center justify-center"
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ duration: 1, repeat: Infinity }}
                            >
                              <Music2 className="w-3 h-3 text-gold-foreground" />
                            </motion.div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-heading font-semibold text-lg truncate">{song.title}</h3>
                        <p className="text-muted-foreground truncate">{song.artist}</p>
                        <div className="flex gap-2 mt-2">
                          {song.genre && (
                            <Badge variant="secondary" className="text-xs bg-gold/10 text-gold border-gold/30">
                              {song.genre}
                            </Badge>
                          )}
                          {song.year && (
                            <Badge variant="outline" className="text-xs border-gold/30">
                              {song.year}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {song.download_count && song.download_count > 0 && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Download className="h-3 w-3" />
                            {song.download_count}
                          </div>
                        )}
                        <AddToPlaylistMenu songId={song.id} />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 hover:bg-gold/10 hover:text-gold"
                          onClick={(e) => handleDownload(song, e)}
                          title="Download song"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          ))}
        </motion.div>

        {sortedSongs.length === 0 && !isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <Disc className="w-16 h-16 text-gold/50 mx-auto mb-4" />
            <p className="text-muted-foreground text-xl font-heading">No songs found</p>
            <p className="text-muted-foreground">Try adjusting your search or filters</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Music;
