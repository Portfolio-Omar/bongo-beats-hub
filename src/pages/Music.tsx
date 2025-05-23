import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import MusicPlayer from '@/components/ui-custom/MusicPlayer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, Music2, PlayCircle, Clock,
  ChevronDown, Filter, Loader2, Download, Heart
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { supabase, rpcFunctions } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";

interface Song {
  id: string;
  title: string;
  artist: string;
  genre: string | null;
  duration: string | null;
  year: string | null;
  cover_url: string | null;
  audio_url: string;
  download_count?: number;
  published?: boolean;
  created_at?: string;
}

const Music: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [sortBy, setSortBy] = useState('title');
  const [filterGenre, setFilterGenre] = useState('all');
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedArtist, setEditedArtist] = useState('');
  const [editedGenre, setEditedGenre] = useState('');
  const [editedYear, setEditedYear] = useState('');
  
  const { data: songs, isLoading, error, refetch } = useQuery({
    queryKey: ['songs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('songs')
        .select('*');
      
      if (error) {
        console.error('Error fetching songs:', error);
        toast.error('Failed to load songs');
        throw error;
      }
      
      return (data || []).map(song => ({
        ...song,
        download_count: song.download_count || 0
      })) as Song[];
    }
  });
  
  useEffect(() => {
    if (songs && songs.length > 0 && !selectedSong) {
      setSelectedSong(songs[0]);
    }
  }, [songs, selectedSong]);
  
  const genres = songs 
    ? ['all', ...new Set(songs.filter(song => song.genre).map(song => song.genre as string))]
    : ['all'];
  
  const filteredSongs = songs ? songs.filter(song => {
    const matchesSearch = 
      song.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      song.artist.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGenre = filterGenre === 'all' || song.genre === filterGenre;
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
      const link = document.createElement('a');
      link.href = song.audio_url;
      link.download = `${song.title} - ${song.artist}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      const { error } = await supabase
        .from('songs')
        .update({ download_count: (song.download_count || 0) + 1 })
        .eq('id', song.id);
        
      if (error) throw error;
      
      refetch();
      
      toast.success(`Downloading ${song.title}`);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download song');
    }
  };
  
  const handleEditClick = (song: Song, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSong(song);
    setEditedTitle(song.title);
    setEditedArtist(song.artist);
    setEditedGenre(song.genre || '');
    setEditedYear(song.year || '');
  };
  
  const handleSaveEdit = async () => {
    if (!editingSong) return;
    
    try {
      const { error } = await supabase
        .from('songs')
        .update({
          title: editedTitle,
          artist: editedArtist,
          genre: editedGenre || null,
          year: editedYear || null
        })
        .eq('id', editingSong.id);
      
      if (error) throw error;
      
      toast.success('Song updated successfully');
      refetch();
      setEditingSong(null);
      
      if (selectedSong && selectedSong.id === editingSong.id) {
        setSelectedSong({
          ...selectedSong,
          title: editedTitle,
          artist: editedArtist,
          genre: editedGenre || null,
          year: editedYear || null
        });
      }
    } catch (error) {
      console.error('Error updating song:', error);
      toast.error('Failed to update song');
    }
  };
  
  const playNextSong = () => {
    if (!selectedSong || !sortedSongs.length) return;
    
    const currentIndex = sortedSongs.findIndex(song => song.id === selectedSong.id);
    let nextIndex;
    
    if (isShuffleEnabled) {
      let randomIndex;
      do {
        randomIndex = Math.floor(Math.random() * sortedSongs.length);
      } while (randomIndex === currentIndex && sortedSongs.length > 1);
      
      nextIndex = randomIndex;
    } else {
      nextIndex = (currentIndex + 1) % sortedSongs.length;
    }
    
    setSelectedSong(sortedSongs[nextIndex]);
  };
  
  const playPreviousSong = () => {
    if (!selectedSong || !sortedSongs.length) return;
    
    const currentIndex = sortedSongs.findIndex(song => song.id === selectedSong.id);
    const previousIndex = (currentIndex - 1 + sortedSongs.length) % sortedSongs.length;
    
    setSelectedSong(sortedSongs[previousIndex]);
  };
  
  const [isShuffleEnabled, setIsShuffleEnabled] = useState(false);
  
  const toggleShuffle = () => {
    setIsShuffleEnabled(!isShuffleEnabled);
    toast.info(isShuffleEnabled ? 'Shuffle disabled' : 'Shuffle enabled');
  };
  
  if (error) {
    console.error('Error in rendering:', error);
  }
  
  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 relative overflow-hidden">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/5 to-secondary/5"></div>
          <motion.div 
            className="absolute top-1/2 left-1/4 w-96 h-96 rounded-full bg-primary/10 blur-3xl"
            animate={{
              x: [0, 30, 0, -30, 0],
              y: [0, -30, 0, 30, 0],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              repeatType: "loop"
            }}
          />
          <motion.div 
            className="absolute bottom-1/3 right-1/4 w-64 h-64 rounded-full bg-secondary/10 blur-3xl"
            animate={{
              x: [0, -20, 0, 20, 0],
              y: [0, 20, 0, -20, 0],
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              repeatType: "loop"
            }}
          />
        </div>

        <div className="text-center mb-12">
          <motion.h1 
            className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Music Library
          </motion.h1>
          <motion.p 
            className="text-muted-foreground max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Explore our curated collection of classic Bongo and Kenyan tracks, 
            preserving the rich musical heritage of East Africa.
          </motion.p>
        </div>
        
        <motion.div 
          className="mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {selectedSong ? (
            <MusicPlayer 
              song={{
                id: selectedSong.id,
                title: selectedSong.title,
                artist: selectedSong.artist,
                coverUrl: selectedSong.cover_url || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400&q=80',
                audioUrl: selectedSong.audio_url,
                downloadCount: selectedSong.download_count || 0
              }}
              songs={sortedSongs.map(song => ({
                id: song.id,
                title: song.title,
                artist: song.artist,
                coverUrl: song.cover_url || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400&q=80',
                audioUrl: song.audio_url,
                downloadCount: song.download_count || 0
              }))}
              onPlayNext={playNextSong}
              onPlayPrevious={playPreviousSong}
              onSongEnd={playNextSong}
            />
          ) : (
            <div className="bg-card p-8 rounded-xl text-center">
              <Music2 className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-4" />
              <h3 className="text-lg font-medium mb-2">No song selected</h3>
              <p className="text-muted-foreground">Select a song from the list below to play</p>
            </div>
          )}
        </motion.div>
        
        <motion.div 
          className="mb-8 flex flex-col md:flex-row gap-4 justify-between"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by title or artist..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={filterGenre} onValueChange={setFilterGenre}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Filter by genre" />
                </SelectTrigger>
                <SelectContent>
                  {genres.map(genre => (
                    <SelectItem key={genre} value={genre}>
                      {genre === 'all' ? 'All Genres' : genre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="title">Title</SelectItem>
                  <SelectItem value="artist">Artist</SelectItem>
                  <SelectItem value="year">Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </motion.div>
        
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="hidden md:grid grid-cols-12 py-3 px-4 text-sm font-medium text-muted-foreground bg-secondary rounded-lg">
            <div className="col-span-1">#</div>
            <div className="col-span-5">Title</div>
            <div className="col-span-2">Artist</div>
            <div className="col-span-2">Genre</div>
            <div className="col-span-1">Duration</div>
            <div className="col-span-1 text-right">Actions</div>
          </div>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading music...</span>
            </div>
          ) : sortedSongs.length > 0 ? (
            sortedSongs.map((song, index) => (
              <motion.div 
                key={song.id}
                className={`grid grid-cols-1 md:grid-cols-12 items-center py-3 px-4 rounded-lg transition-all duration-200 hover:bg-secondary/50 cursor-pointer ${selectedSong?.id === song.id ? 'bg-secondary' : ''}`}
                onClick={() => setSelectedSong(song)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 * index }}
              >
                <div className="hidden md:block col-span-1 text-muted-foreground">{index + 1}</div>
                
                <div className="flex items-center gap-3 col-span-1 md:col-span-5">
                  <div className="relative h-12 w-12 rounded-md overflow-hidden flex-shrink-0">
                    <img 
                      src={song.cover_url || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400&q=80'} 
                      alt={song.title} 
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400&q=80';
                      }}
                    />
                    {selectedSong?.id === song.id && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <PlayCircle className="h-6 w-6 text-white" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium line-clamp-1">{song.title}</h3>
                    <p className="text-sm text-muted-foreground md:hidden">{song.artist}</p>
                  </div>
                </div>
                
                <div className="hidden md:block col-span-2 text-muted-foreground">{song.artist}</div>
                <div className="hidden md:block col-span-2 text-muted-foreground">{song.genre || '-'}</div>
                <div className="hidden md:block col-span-1 text-muted-foreground">{song.duration || '--:--'}</div>
                
                <div className="hidden md:flex col-span-1 justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-primary"
                    onClick={(e) => handleDownload(song, e)}
                    title={`Downloads: ${song.download_count || 0}`}
                  >
                    <Download className="h-4 w-4" />
                    <span className="sr-only">Download ({song.download_count || 0})</span>
                  </Button>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-8">
              <Music2 className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-4" />
              <h3 className="text-lg font-medium mb-2">No songs found</h3>
              <p className="text-muted-foreground">Try adjusting your search or filters</p>
            </div>
          )}
        </motion.div>
      </div>
      
      <Dialog open={!!editingSong} onOpenChange={(open) => !open && setEditingSong(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Song</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">Title</label>
              <Input
                id="title"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                placeholder="Song title"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="artist" className="text-sm font-medium">Artist</label>
              <Input
                id="artist"
                value={editedArtist}
                onChange={(e) => setEditedArtist(e.target.value)}
                placeholder="Artist name"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="genre" className="text-sm font-medium">Genre</label>
              <Input
                id="genre"
                value={editedGenre}
                onChange={(e) => setEditedGenre(e.target.value)}
                placeholder="Genre"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="year" className="text-sm font-medium">Year</label>
              <Input
                id="year"
                value={editedYear}
                onChange={(e) => setEditedYear(e.target.value)}
                placeholder="Year"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Music;
