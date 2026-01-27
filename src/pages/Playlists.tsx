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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Plus, Music, Play, Trash2, GripVertical, ListMusic, 
  Disc, ChevronRight, Edit2, X 
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

  // Fetch user playlists
  const { data: playlists, isLoading: playlistsLoading } = useQuery({
    queryKey: ['playlists', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('playlists')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Playlist[];
    },
    enabled: !!user,
  });

  // Fetch songs for selected playlist
  const { data: playlistSongs, isLoading: songsLoading } = useQuery({
    queryKey: ['playlist-songs', selectedPlaylist?.id],
    queryFn: async () => {
      if (!selectedPlaylist) return [];
      const { data, error } = await supabase
        .from('playlist_songs')
        .select(`
          id,
          playlist_id,
          song_id,
          added_at,
          songs (*)
        `)
        .eq('playlist_id', selectedPlaylist.id)
        .order('added_at', { ascending: true });
      
      if (error) throw error;
      return data as PlaylistSong[];
    },
    enabled: !!selectedPlaylist,
  });

  // Update reorderedSongs when playlistSongs changes
  React.useEffect(() => {
    if (playlistSongs) {
      setReorderedSongs(playlistSongs);
    }
  }, [playlistSongs]);

  // Create playlist mutation
  const createPlaylist = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('playlists')
        .insert([{
          name: newPlaylistName,
          description: newPlaylistDescription || null,
          user_id: user.id,
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      setIsCreateOpen(false);
      setNewPlaylistName('');
      setNewPlaylistDescription('');
      toast.success('Playlist created!');
    },
    onError: (error) => {
      console.error('Error creating playlist:', error);
      toast.error('Failed to create playlist');
    },
  });

  // Update playlist mutation
  const updatePlaylist = useMutation({
    mutationFn: async (playlist: Playlist) => {
      const { error } = await supabase
        .from('playlists')
        .update({ name: playlist.name, description: playlist.description })
        .eq('id', playlist.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      setEditingPlaylist(null);
      toast.success('Playlist updated!');
    },
    onError: () => {
      toast.error('Failed to update playlist');
    },
  });

  // Delete playlist mutation
  const deletePlaylist = useMutation({
    mutationFn: async (playlistId: string) => {
      const { error } = await supabase
        .from('playlists')
        .delete()
        .eq('id', playlistId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      setSelectedPlaylist(null);
      toast.success('Playlist deleted!');
    },
    onError: () => {
      toast.error('Failed to delete playlist');
    },
  });

  // Remove song from playlist mutation
  const removeSongFromPlaylist = useMutation({
    mutationFn: async (playlistSongId: string) => {
      const { error } = await supabase
        .from('playlist_songs')
        .delete()
        .eq('id', playlistSongId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlist-songs'] });
      toast.success('Song removed from playlist');
    },
    onError: () => {
      toast.error('Failed to remove song');
    },
  });

  const handlePlayPlaylist = () => {
    if (reorderedSongs.length > 0 && reorderedSongs[0].songs) {
      const songs = reorderedSongs
        .filter(ps => ps.songs)
        .map(ps => ps.songs as Song);
      playSong(songs[0], songs);
    }
  };

  const handlePlaySong = (song: Song) => {
    const songs = reorderedSongs
      .filter(ps => ps.songs)
      .map(ps => ps.songs as Song);
    playSong(song, songs);
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <ListMusic className="w-16 h-16 text-primary/50 mx-auto mb-4" />
          <h2 className="text-2xl font-heading font-bold mb-2">Sign in to view playlists</h2>
          <p className="text-muted-foreground mb-6">Create and manage your personal playlists</p>
          <Button onClick={() => navigate('/auth')} className="bg-primary hover:bg-primary/90">
            Sign In
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 pb-32">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <ListMusic className="w-10 h-10 text-primary" />
            <h1 className="text-4xl font-heading font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              My Playlists
            </h1>
          </div>
          
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                New Playlist
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle>Create New Playlist</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Input
                    placeholder="Playlist name"
                    value={newPlaylistName}
                    onChange={(e) => setNewPlaylistName(e.target.value)}
                    className="bg-background border-border"
                  />
                </div>
                <div>
                  <Textarea
                    placeholder="Description (optional)"
                    value={newPlaylistDescription}
                    onChange={(e) => setNewPlaylistDescription(e.target.value)}
                    className="bg-background border-border"
                  />
                </div>
                <Button
                  onClick={() => createPlaylist.mutate()}
                  disabled={!newPlaylistName.trim() || createPlaylist.isPending}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  Create Playlist
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Playlists List */}
          <div className="lg:col-span-1 space-y-4">
            {playlistsLoading ? (
              <div className="flex items-center justify-center py-10">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Disc className="w-8 h-8 text-primary" />
                </motion.div>
              </div>
            ) : playlists?.length === 0 ? (
              <Card className="border-dashed border-2 border-border">
                <CardContent className="p-8 text-center">
                  <Music className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No playlists yet</p>
                  <p className="text-sm text-muted-foreground">Create your first playlist!</p>
                </CardContent>
              </Card>
            ) : (
              <AnimatePresence>
                {playlists?.map((playlist) => (
                  <motion.div
                    key={playlist.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <Card
                      className={`cursor-pointer transition-all duration-200 hover:border-primary/50 ${
                        selectedPlaylist?.id === playlist.id ? 'border-primary bg-primary/5' : 'border-border'
                      }`}
                      onClick={() => setSelectedPlaylist(playlist)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center flex-shrink-0">
                              <ListMusic className="w-6 h-6 text-primary" />
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-semibold truncate">{playlist.name}</h3>
                              {playlist.description && (
                                <p className="text-sm text-muted-foreground truncate">
                                  {playlist.description}
                                </p>
                              )}
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
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
                        <ListMusic className="w-10 h-10 text-primary" />
                      </div>
                      <div>
                        {editingPlaylist?.id === selectedPlaylist.id ? (
                          <div className="space-y-2">
                            <Input
                              value={editingPlaylist.name}
                              onChange={(e) => setEditingPlaylist({ ...editingPlaylist, name: e.target.value })}
                              className="bg-background"
                            />
                            <Input
                              value={editingPlaylist.description || ''}
                              onChange={(e) => setEditingPlaylist({ ...editingPlaylist, description: e.target.value })}
                              placeholder="Description"
                              className="bg-background"
                            />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => updatePlaylist.mutate(editingPlaylist)}>
                                Save
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => setEditingPlaylist(null)}>
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <CardTitle className="text-2xl">{selectedPlaylist.name}</CardTitle>
                            {selectedPlaylist.description && (
                              <p className="text-muted-foreground">{selectedPlaylist.description}</p>
                            )}
                            <p className="text-sm text-muted-foreground mt-1">
                              {reorderedSongs.length} songs
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {reorderedSongs.length > 0 && (
                        <Button onClick={handlePlayPlaylist} className="bg-primary hover:bg-primary/90">
                          <Play className="h-4 w-4 mr-2" />
                          Play All
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingPlaylist(selectedPlaylist)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => deletePlaylist.mutate(selectedPlaylist.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="p-4">
                  {songsLoading ? (
                    <div className="flex items-center justify-center py-10">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      >
                        <Disc className="w-8 h-8 text-primary" />
                      </motion.div>
                    </div>
                  ) : reorderedSongs.length === 0 ? (
                    <div className="text-center py-10">
                      <Music className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No songs in this playlist</p>
                      <p className="text-sm text-muted-foreground">
                        Add songs from the Music page
                      </p>
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => navigate('/music')}
                      >
                        Browse Music
                      </Button>
                    </div>
                  ) : (
                    <Reorder.Group
                      axis="y"
                      values={reorderedSongs}
                      onReorder={setReorderedSongs}
                      className="space-y-2"
                    >
                      {reorderedSongs.map((item) => (
                        <Reorder.Item
                          key={item.id}
                          value={item}
                          className="bg-card border border-border rounded-lg p-3 cursor-grab active:cursor-grabbing"
                        >
                          <div className="flex items-center gap-3">
                            <GripVertical className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                            
                            <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                              {item.songs?.cover_url ? (
                                <img
                                  src={item.songs.cover_url}
                                  alt={item.songs.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
                                  <Music className="w-5 h-5 text-primary/70" />
                                </div>
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{item.songs?.title}</p>
                              <p className="text-sm text-muted-foreground truncate">
                                {item.songs?.artist}
                              </p>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => item.songs && handlePlaySong(item.songs)}
                                className="hover:bg-primary/10"
                              >
                                <Play className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeSongFromPlaylist.mutate(item.id)}
                                className="hover:text-destructive"
                              >
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
