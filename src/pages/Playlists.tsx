import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useAudio } from '@/context/AudioContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Plus, Music, Play, Trash2, GripVertical, ListMusic, 
  Disc, ChevronRight, Edit2, X, Search, MoreVertical,
  Shuffle, Clock
} from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { toast } from 'sonner';
import { Song } from '@/types/music';

interface Playlist {
  id: string;
  name: string;
  description: string | null;
  user_id: string;
  created_at: string;
}

interface PlaylistSong {
  id: string;
  playlist_id: string;
  song_id: string;
  added_at: string;
  songs?: Song;
}

const Playlists: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { playSong } = useAudio();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('');
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null);
  const [reorderedSongs, setReorderedSongs] = useState<PlaylistSong[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [playlistSearch, setPlaylistSearch] = useState('');

  const { data: playlists, isLoading: playlistsLoading } = useQuery({
    queryKey: ['playlists', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('playlists').select('*').eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Playlist[];
    },
    enabled: !!user,
  });

  const { data: playlistSongs, isLoading: songsLoading } = useQuery({
    queryKey: ['playlist-songs', selectedPlaylist?.id],
    queryFn: async () => {
      if (!selectedPlaylist) return [];
      const { data, error } = await supabase
        .from('playlist_songs')
        .select(`id, playlist_id, song_id, added_at, songs (*)`)
        .eq('playlist_id', selectedPlaylist.id)
        .order('added_at', { ascending: true });
      if (error) throw error;
      return data as PlaylistSong[];
    },
    enabled: !!selectedPlaylist,
  });

  // Get song count per playlist
  const { data: playlistCounts } = useQuery({
    queryKey: ['playlist-counts', user?.id],
    queryFn: async () => {
      if (!user || !playlists) return {};
      const counts: Record<string, number> = {};
      for (const pl of playlists) {
        const { count } = await supabase
          .from('playlist_songs').select('id', { count: 'exact', head: true })
          .eq('playlist_id', pl.id);
        counts[pl.id] = count || 0;
      }
      return counts;
    },
    enabled: !!playlists && playlists.length > 0,
  });

  React.useEffect(() => {
    if (playlistSongs) setReorderedSongs(playlistSongs);
  }, [playlistSongs]);

  const createPlaylist = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('playlists').insert([{ name: newPlaylistName, description: newPlaylistDescription || null, user_id: user.id }])
        .select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      setIsCreateOpen(false); setNewPlaylistName(''); setNewPlaylistDescription('');
      toast.success('Playlist created!');
    },
    onError: () => toast.error('Failed to create playlist'),
  });

  const updatePlaylist = useMutation({
    mutationFn: async (playlist: Playlist) => {
      const { error } = await supabase.from('playlists')
        .update({ name: playlist.name, description: playlist.description }).eq('id', playlist.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      setEditingPlaylist(null);
      toast.success('Playlist updated!');
    },
    onError: () => toast.error('Failed to update playlist'),
  });

  const deletePlaylist = useMutation({
    mutationFn: async (playlistId: string) => {
      const { error } = await supabase.from('playlists').delete().eq('id', playlistId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      setSelectedPlaylist(null);
      toast.success('Playlist deleted!');
    },
    onError: () => toast.error('Failed to delete playlist'),
  });

  const removeSongFromPlaylist = useMutation({
    mutationFn: async (playlistSongId: string) => {
      const { error } = await supabase.from('playlist_songs').delete().eq('id', playlistSongId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlist-songs'] });
      queryClient.invalidateQueries({ queryKey: ['playlist-counts'] });
      toast.success('Song removed from playlist');
    },
    onError: () => toast.error('Failed to remove song'),
  });

  const handlePlayPlaylist = () => {
    if (reorderedSongs.length > 0 && reorderedSongs[0].songs) {
      const songs = reorderedSongs.filter(ps => ps.songs).map(ps => ps.songs as Song);
      playSong(songs[0], songs);
    }
  };

  const handleShufflePlay = () => {
    const songs = reorderedSongs.filter(ps => ps.songs).map(ps => ps.songs as Song);
    if (songs.length > 0) {
      const shuffled = [...songs].sort(() => Math.random() - 0.5);
      playSong(shuffled[0], shuffled);
      toast.success('🔀 Shuffle play started!');
    }
  };

  const handlePlaySong = (song: Song) => {
    const songs = reorderedSongs.filter(ps => ps.songs).map(ps => ps.songs as Song);
    playSong(song, songs);
  };

  const getTotalDuration = () => {
    const totalMinutes = reorderedSongs.reduce((sum, item) => {
      if (item.songs?.duration) {
        const parts = item.songs.duration.split(':');
        return sum + (parseInt(parts[0]) || 0) * 60 + (parseInt(parts[1]) || 0);
      }
      return sum;
    }, 0);
    const hours = Math.floor(totalMinutes / 3600);
    const mins = Math.floor((totalMinutes % 3600) / 60);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const filteredSongs = reorderedSongs.filter(item => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return item.songs?.title?.toLowerCase().includes(q) || item.songs?.artist?.toLowerCase().includes(q);
  });

  const filteredPlaylists = playlists?.filter(pl => {
    if (!playlistSearch) return true;
    return pl.name.toLowerCase().includes(playlistSearch.toLowerCase());
  });

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <ListMusic className="w-16 h-16 text-primary/50 mx-auto mb-4" />
          <h2 className="text-2xl font-heading font-bold mb-2">Sign in to view playlists</h2>
          <p className="text-muted-foreground mb-6">Create and manage your personal playlists</p>
          <Button onClick={() => navigate('/auth')} className="bg-primary hover:bg-primary/90">Sign In</Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 pb-32">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <ListMusic className="w-8 h-8 sm:w-10 sm:h-10 text-primary flex-shrink-0" />
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                My Playlists
              </h1>
              <p className="text-sm text-muted-foreground">{playlists?.length || 0} playlists</p>
            </div>
          </div>
          
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />New Playlist
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border max-w-[95vw] sm:max-w-lg">
              <DialogHeader><DialogTitle>Create New Playlist</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-4">
                <Input placeholder="Playlist name" value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)} className="bg-background border-border" />
                <Textarea placeholder="Description (optional)" value={newPlaylistDescription}
                  onChange={(e) => setNewPlaylistDescription(e.target.value)} className="bg-background border-border" />
                <Button onClick={() => createPlaylist.mutate()}
                  disabled={!newPlaylistName.trim() || createPlaylist.isPending}
                  className="w-full bg-primary hover:bg-primary/90">
                  Create Playlist
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Playlists List */}
          <div className="lg:col-span-1 space-y-4">
            {/* Playlist search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search playlists..." value={playlistSearch}
                onChange={e => setPlaylistSearch(e.target.value)} className="pl-10" />
            </div>

            {playlistsLoading ? (
              <div className="flex items-center justify-center py-10">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
                  <Disc className="w-8 h-8 text-primary" />
                </motion.div>
              </div>
            ) : filteredPlaylists?.length === 0 ? (
              <Card className="border-dashed border-2 border-border">
                <CardContent className="p-8 text-center">
                  <Music className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">{playlistSearch ? 'No matching playlists' : 'No playlists yet'}</p>
                  {!playlistSearch && <p className="text-sm text-muted-foreground">Create your first playlist!</p>}
                </CardContent>
              </Card>
            ) : (
              <AnimatePresence>
                {filteredPlaylists?.map((playlist) => (
                  <motion.div key={playlist.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <Card className={`cursor-pointer transition-all duration-200 hover:border-primary/50 ${
                      selectedPlaylist?.id === playlist.id ? 'border-primary bg-primary/5' : 'border-border'
                    }`} onClick={() => setSelectedPlaylist(playlist)}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center flex-shrink-0">
                              <ListMusic className="w-6 h-6 text-primary" />
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-semibold truncate">{playlist.name}</h3>
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="text-xs">
                                  {playlistCounts?.[playlist.id] || 0} songs
                                </Badge>
                                {playlist.description && (
                                  <p className="text-xs text-muted-foreground truncate">{playlist.description}</p>
                                )}
                              </div>
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>

          {/* Playlist Details */}
          <div className="lg:col-span-2">
            {selectedPlaylist ? (
              <Card className="border-border">
                <CardHeader className="border-b border-border">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                      <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-xl bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {reorderedSongs[0]?.songs?.cover_url ? (
                          <img src={reorderedSongs[0].songs.cover_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <ListMusic className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
                        )}
                      </div>
                      <div className="min-w-0">
                        {editingPlaylist?.id === selectedPlaylist.id ? (
                          <div className="space-y-2">
                            <Input value={editingPlaylist.name}
                              onChange={(e) => setEditingPlaylist({ ...editingPlaylist, name: e.target.value })} className="bg-background" />
                            <Input value={editingPlaylist.description || ''}
                              onChange={(e) => setEditingPlaylist({ ...editingPlaylist, description: e.target.value })}
                              placeholder="Description" className="bg-background" />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => updatePlaylist.mutate(editingPlaylist)}>Save</Button>
                              <Button size="sm" variant="ghost" onClick={() => setEditingPlaylist(null)}>Cancel</Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <CardTitle className="text-xl sm:text-2xl truncate">{selectedPlaylist.name}</CardTitle>
                            {selectedPlaylist.description && (
                              <p className="text-muted-foreground text-sm truncate">{selectedPlaylist.description}</p>
                            )}
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-sm text-muted-foreground">{reorderedSongs.length} songs</span>
                              <span className="text-sm text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />{getTotalDuration()}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      {reorderedSongs.length > 0 && (
                        <>
                          <Button onClick={handlePlayPlaylist} className="bg-primary hover:bg-primary/90 flex-1 sm:flex-none">
                            <Play className="h-4 w-4 mr-2" />Play All
                          </Button>
                          <Button variant="outline" size="icon" onClick={handleShufflePlay}>
                            <Shuffle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditingPlaylist(selectedPlaylist)}>
                            <Edit2 className="h-4 w-4 mr-2" />Edit Playlist
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate('/music')}>
                            <Plus className="h-4 w-4 mr-2" />Add Songs
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => deletePlaylist.mutate(selectedPlaylist.id)}>
                            <Trash2 className="h-4 w-4 mr-2" />Delete Playlist
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Song search within playlist */}
                  {reorderedSongs.length > 3 && (
                    <div className="relative mt-4">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Search songs in this playlist..." value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
                    </div>
                  )}
                </CardHeader>
                
                <CardContent className="p-4">
                  {songsLoading ? (
                    <div className="flex items-center justify-center py-10">
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
                        <Disc className="w-8 h-8 text-primary" />
                      </motion.div>
                    </div>
                  ) : reorderedSongs.length === 0 ? (
                    <div className="text-center py-10">
                      <Music className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No songs in this playlist</p>
                      <p className="text-sm text-muted-foreground">Add songs from the Music page</p>
                      <Button variant="outline" className="mt-4" onClick={() => navigate('/music')}>Browse Music</Button>
                    </div>
                  ) : (
                    <Reorder.Group axis="y" values={reorderedSongs} onReorder={setReorderedSongs} className="space-y-2">
                      {(searchQuery ? filteredSongs : reorderedSongs).map((item, index) => (
                        <Reorder.Item key={item.id} value={item}
                          className="bg-card border border-border rounded-lg p-3 cursor-grab active:cursor-grabbing">
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-muted-foreground w-5 text-center">{index + 1}</span>
                            <GripVertical className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                            
                            <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                              {item.songs?.cover_url ? (
                                <img src={item.songs.cover_url} alt={item.songs.title} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
                                  <Music className="w-5 h-5 text-primary/70" />
                                </div>
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{item.songs?.title}</p>
                              <div className="flex items-center gap-2">
                                <p className="text-sm text-muted-foreground truncate">{item.songs?.artist}</p>
                                {item.songs?.duration && (
                                  <span className="text-xs text-muted-foreground">{item.songs.duration}</span>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="icon" onClick={() => item.songs && handlePlaySong(item.songs)}
                                className="hover:bg-primary/10 h-8 w-8">
                                <Play className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => removeSongFromPlaylist.mutate(item.id)}
                                className="hover:text-destructive h-8 w-8">
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </Reorder.Item>
                      ))}
                    </Reorder.Group>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="border-border h-full min-h-[400px] flex items-center justify-center">
                <CardContent className="text-center">
                  <ListMusic className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Select a playlist to view songs</p>
                  <p className="text-sm text-muted-foreground mt-1">Or create a new one to get started</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Playlists;
