import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAudio } from "@/context/AudioContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Download, Play, Search, Edit, Save, Grid, List } from 'lucide-react';
import { motion } from 'framer-motion';
import { Song } from '@/types/music';

const Music = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('title');
  const [filterGenre, setFilterGenre] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [editedSong, setEditedSong] = useState<Partial<Song>>({});
  const { toast } = useToast();
  const { playSong } = useAudio();
  const { isAdminAuthenticated } = useAuth();

  const { data: songs, isLoading, refetch } = useQuery({
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
      // Update download count in database
      const { error } = await supabase
        .from('songs')
        .update({ download_count: (song.download_count || 0) + 1 })
        .eq('id', song.id);

      if (error) throw error;

      // Create download link for direct download
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

  const handleEditClick = (song: Song, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSong(song);
    setEditedSong({
      title: song.title,
      artist: song.artist,
      genre: song.genre || '',
      year: song.year || '',
      download_count: song.download_count || 0,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingSong) return;

    try {
      const { error } = await supabase
        .from('songs')
        .update({
          title: editedSong.title,
          artist: editedSong.artist,
          genre: editedSong.genre || null,
          year: editedSong.year || null,
        })
        .eq('id', editingSong.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Song updated successfully",
      });

      refetch();
      setEditingSong(null);
      setEditedSong({});
    } catch (error) {
      console.error('Error updating song:', error);
      toast({
        title: "Error",
        description: "Failed to update song",
        variant: "destructive",
      });
    }
  };

  const handlePlaySong = (song: Song) => {
    playSong(song, sortedSongs);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold mb-4">Music Library</h1>
        <p className="text-muted-foreground">
          Discover and enjoy our collection of amazing music
        </p>
      </motion.div>

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
            className="pl-10"
          />
        </div>

        <div className="flex gap-2">
          <Select value={filterGenre} onValueChange={setFilterGenre}>
            <SelectTrigger className="w-[150px]">
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
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="title">Title</SelectItem>
              <SelectItem value="artist">Artist</SelectItem>
              <SelectItem value="year">Year</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex border rounded-lg">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
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
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            {viewMode === 'grid' ? (
              <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer">
                <CardContent className="p-0">
                  <div className="relative">
                    <img
                      src={song.cover_url || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400&q=80'}
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
                      
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => handleDownload(song, e)}
                          title="Download song"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        {isAdminAuthenticated && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => handleEditClick(song, e)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
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
              <Card className="group hover:shadow-md transition-all duration-300">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <img
                        src={song.cover_url || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&h=80&q=80'}
                        alt={`${song.title} cover`}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 rounded-lg flex items-center justify-center">
                        <Button
                          variant="secondary"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 h-8 w-8"
                          onClick={() => handlePlaySong(song)}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg truncate">{song.title}</h3>
                      <p className="text-muted-foreground truncate">{song.artist}</p>
                      <div className="flex gap-2 mt-1">
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
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {song.download_count && song.download_count > 0 && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Download className="h-3 w-3" />
                          {song.download_count}
                        </div>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => handleDownload(song, e)}
                        title="Download song"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      {isAdminAuthenticated && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => handleEditClick(song, e)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
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
          className="text-center py-12"
        >
          <p className="text-muted-foreground text-lg">No songs found</p>
          <p className="text-muted-foreground">Try adjusting your search or filters</p>
        </motion.div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingSong} onOpenChange={() => setEditingSong(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Song</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={editedSong.title || ''}
                onChange={(e) => setEditedSong({ ...editedSong, title: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="artist">Artist</Label>
              <Input
                id="artist"
                value={editedSong.artist || ''}
                onChange={(e) => setEditedSong({ ...editedSong, artist: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="genre">Genre</Label>
              <Input
                id="genre"
                value={editedSong.genre || ''}
                onChange={(e) => setEditedSong({ ...editedSong, genre: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                value={editedSong.year || ''}
                onChange={(e) => setEditedSong({ ...editedSong, year: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setEditingSong(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Music;