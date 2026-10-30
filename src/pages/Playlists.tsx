import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useAudio } from '@/context/AudioContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Plus, Music, Play, Trash2, GripVertical, ListMusic,
  Disc, ChevronLeft, Edit2, X, Search, MoreVertical,
  Shuffle, Clock, Pin, PinOff, Layers, ArrowUpDown,
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
  type?: string;
  pinned?: boolean;
  cover_color?: string | null;
}

interface PlaylistSong {
  id: string;
  playlist_id: string;
  song_id: string;
  added_at: string;
  songs?: Song;
}

const COLLECTION_COLORS = ['#f59e0b', '#ef4444', '#8b5cf6', '#3b82f6', '#10b981', '#ec4899', '#14b8a6', '#f97316'];

type SortBy = 'newest' | 'name' | 'songs';

const Playlists: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { playSong } = useAudio();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'playlist' | 'collection'>('playlist');
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('');
  const [newPlaylistColor, setNewPlaylistColor] = useState<string>(COLLECTION_COLORS[0]);
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null);
  const [reorderedSongs, setReorderedSongs] = useState<PlaylistSong[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [playlistSearch, setPlaylistSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('newest');

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

  // Song counts + first cover per playlist for the library cards
  const { data: playlistMeta, isLoading: metaLoading } = useQuery({
    queryKey: ['playlist-meta', user?.id],
    queryFn: async () => {
      if (!user || !playlists || playlists.length === 0) return {};
      const { data, error } = await supabase
        .from('playlist_songs')
        .select('playlist_id, added_at, songs (cover_url)')
        .in('playlist_id', playlists.map(p => p.id))
        .order('added_at', { ascending: true });
      if (error) throw error;
      const meta: Record<string, { count: number; cover: string | null }> = {};
      ((data || []) as Array<{ playlist_id: string; songs?: { cover_url?: string | null } }>).forEach(row => {
        const m = meta[row.playlist_id] || (meta[row.playlist_id] = { count: 0, cover: null });
        m.count += 1;
        if (!m.cover) m.cover = row.songs?.cover_url || null;
      });
      return meta;
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
        .from('playlists')
        .insert([{
          name: newPlaylistName,
          description: newPlaylistDescription || null,
          type: activeTab,
          cover_color: activeTab === 'collection' ? newPlaylistColor : null,
          user_id: user.id,
        }])
        .select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      setIsCreateOpen(false); setNewPlaylistName(''); setNewPlaylistDescription('');
      toast.success(activeTab === 'collection' ? 'Collection created!' : 'Playlist created!');
    },
    onError: () => toast.error('Failed to create'),
  });

  const togglePin = useMutation({
    mutationFn: async (playlist: Playlist) => {
      const { error } = await supabase
        .from('playlists')
        .update({ pinned: !playlist.pinned })
        .eq('id', playlist.id);
      if (error) throw error;
    },
    onSuccess: (_, playlist) => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      toast.success(playlist.pinned ? 'Unpinned' : 'Pinned to top!');
    },
    onError: () => toast.error('Failed to update'),
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
      toast.success('Updated!');
    },
    onError: () => toast.error('Failed to update'),
  });

  const deletePlaylist = useMutation({
    mutationFn: async (playlistId: string) => {
      const { error } = await supabase.from('playlists').delete().eq('id', playlistId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      queryClient.invalidateQueries({ queryKey: ['playlist-meta'] });
      setSelectedPlaylist(null);
      toast.success('Deleted!');
    },
    onError: () => toast.error('Failed to delete'),
  });

  const removeSongFromPlaylist = useMutation({
    mutationFn: async (playlistSongId: string) => {
      const { error } = await supabase.from('playlist_songs').delete().eq('id', playlistSongId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlist-songs'] });
      queryClient.invalidateQueries({ queryKey: ['playlist-meta'] });
      toast.success('Song removed');
    },
    onError: () => toast.error('Failed to remove song'),
  });

  const getSongsForPlaylist = async (playlistId: string): Promise<Song[]> => {
    const { data, error } = await supabase
      .from('playlist_songs')
      .select('id, songs (*)')
      .eq('playlist_id', playlistId)
      .order('added_at', { ascending: true });
    if (error) throw error;
    return ((data || []) as PlaylistSong[]).filter(ps => ps.songs).map(ps => ps.songs as Song);
  };

  const playFromLibrary = async (playlist: Playlist, shuffle = false) => {
    try {
      const songs = await getSongsForPlaylist(playlist.id);
      if (songs.length === 0) {
        toast.info('No songs yet — add some from the Music page');
        return;
      }
      const finalList = shuffle ? [...songs].sort(() => Math.random() - 0.5) : songs;
      playSong(finalList[0], finalList);
      if (shuffle) toast.success('🔀 Shuffle play started!');
    } catch {
      toast.error('Could not load songs');
    }
  };

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

  const visiblePlaylists = (playlists || [])
    .filter(pl => (pl.type || 'playlist') === activeTab)
    .filter(pl => !playlistSearch || pl.name.toLowerCase().includes(playlistSearch.toLowerCase()));

  const sortedPlaylists = [...visiblePlaylists].sort((a, b) => {
    if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'songs':
        return ((playlistMeta?.[b.id]?.count) || 0) - ((playlistMeta?.[a.id]?.count) || 0);
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  const playlistCountLabel = (pl: Playlist) => playlistMeta?.[pl.id]?.count || 0;

  const renderCover = (pl: Playlist, className: string) => {
    const cover = playlistMeta?.[pl.id]?.cover;
    if (cover) {
      return <img src={cover} alt={pl.name} className={`${className} object-cover`} />;
    }
    if (pl.type === 'collection') {
      return (
        <div
          className={`${className} flex items-center justify-center`}
          style={{ background: `linear-gradient(135deg, ${pl.cover_color || COLLECTION_COLORS[0]}, rgba(0,0,0,0.35))` }}
        >
          <Layers className="w-1/2 h-1/2 text-white/90" />
        </div>
      );
    }
    return (
      <div className={`${className} bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center`}>
        <ListMusic className="w-1/2 h-1/2 text-primary" />
      </div>
    );
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <ListMusic className="w-16 h-16 text-primary/50 mx-auto mb-4" />
          <h2 className="text-2xl font-heading font-bold mb-2">Sign in to view playlists</h2>
          <p className="text-muted-foreground mb-6">Create and manage your personal playlists & collections</p>
          <Button onClick={() => navigate('/auth')} className="bg-primary hover:bg-primary/90">Sign In</Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 pb-32">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <ListMusic className="w-8 h-8 sm:w-10 sm:h-10 text-primary flex-shrink-0" />
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                My Music Library
              </h1>
              <p className="text-sm text-muted-foreground">
                {playlists?.filter(p => (p.type || 'playlist') === 'playlist').length || 0} playlists ·{' '}
                {playlists?.filter(p => p.type === 'collection').length || 0} collections
              </p>
            </div>
          </div>

          <Button
            className="bg-primary hover:bg-primary/90 w-full sm:w-auto"
            onClick={() => setIsCreateOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            {activeTab === 'collection' ? 'New Collection' : 'New Playlist'}
          </Button>
        </div>

        {/* Tabs + toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
          <div className="flex items-center bg-muted/50 rounded-lg p-1 w-fit">
            <button
              onClick={() => { setActiveTab('playlist'); setSelectedPlaylist(null); }}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'playlist' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ListMusic className="h-4 w-4 inline mr-1.5" />Playlists
            </button>
            <button
              onClick={() => { setActiveTab('collection'); setSelectedPlaylist(null); }}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'collection' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Layers className="h-4 w-4 inline mr-1.5" />Collections
            </button>
          </div>

          <div className="flex items-center gap-2 flex-1">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={activeTab === 'collection' ? 'Search collections...' : 'Search playlists...'}
                value={playlistSearch}
                onChange={e => setPlaylistSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex-shrink-0">
                  <ArrowUpDown className="h-4 w-4 mr-1.5" />
                  {sortBy === 'newest' ? 'Newest' : sortBy === 'name' ? 'A–Z' : 'Most songs'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSortBy('newest')}>Newest first</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('name')}>Name A–Z</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('songs')}>Most songs</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Create dialog */}
        <Dialog open={isCreateOpen} onOpenChange={(open) => { setIsCreateOpen(open); if (!open) { setNewPlaylistName(''); setNewPlaylistDescription(''); setNewPlaylistColor(COLLECTION_COLORS[0]); } }}>
          <DialogContent className="bg-card border-border max-w-[95vw] sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{activeTab === 'collection' ? 'Create New Collection' : 'Create New Playlist'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <Input
                placeholder={activeTab === 'collection' ? 'Collection name' : 'Playlist name'}
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                className="bg-background border-border"
              />
              <Textarea
                placeholder="Description (optional)"
                value={newPlaylistDescription}
                onChange={(e) => setNewPlaylistDescription(e.target.value)}
                className="bg-background border-border"
              />
              {activeTab === 'collection' && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Cover color</p>
                  <div className="flex flex-wrap gap-2">
                    {COLLECTION_COLORS.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewPlaylistColor(color)}
                        className={`w-8 h-8 rounded-full transition-transform ${newPlaylistColor === color ? 'ring-2 ring-ring ring-offset-2 ring-offset-card scale-110' : ''}`}
                        style={{ backgroundColor: color }}
                        aria-label={`Color ${color}`}
                      />
                    ))}
                  </div>
                </div>
              )}
              <Button
                onClick={() => createPlaylist.mutate()}
                disabled={!newPlaylistName.trim() || createPlaylist.isPending}
                className="w-full bg-primary hover:bg-primary/90"
              >
                {activeTab === 'collection' ? 'Create Collection' : 'Create Playlist'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {selectedPlaylist ? (
          /* ===== Detail view ===== */
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-border">
              <CardHeaderSlot>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <Button variant="ghost" size="icon" className="flex-shrink-0" onClick={() => setSelectedPlaylist(null)} aria-label="Back">
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-xl overflow-hidden flex-shrink-0">
                      {renderCover(selectedPlaylist, 'w-full h-full')}
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
                          <div className="flex items-center gap-2">
                            {selectedPlaylist.pinned && <Pin className="h-4 w-4 text-gold flex-shrink-0" />}
                            <h2 className="text-xl sm:text-2xl font-semibold truncate">{selectedPlaylist.name}</h2>
                            {selectedPlaylist.type === 'collection' && (
                              <Badge variant="outline" className="border-primary/40 text-primary flex-shrink-0">Collection</Badge>
                            )}
                          </div>
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
                        <DropdownMenuItem onClick={() => togglePin.mutate(selectedPlaylist)}>
                          {selectedPlaylist.pinned ? <PinOff className="h-4 w-4 mr-2" /> : <Pin className="h-4 w-4 mr-2" />}
                          {selectedPlaylist.pinned ? 'Unpin' : 'Pin to top'}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setEditingPlaylist(selectedPlaylist)}>
                          <Edit2 className="h-4 w-4 mr-2" />Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate('/music')}>
                          <Plus className="h-4 w-4 mr-2" />Add Songs
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => deletePlaylist.mutate(selectedPlaylist.id)}>
                          <Trash2 className="h-4 w-4 mr-2" />Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Song search within */}
                {reorderedSongs.length > 3 && (
                  <div className="relative mt-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search songs here..." value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
                  </div>
                )}
              </CardHeaderSlot>

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
                    <p className="text-muted-foreground">No songs yet</p>
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
          </motion.div>
        ) : (
          /* ===== Library grid ===== */
          metaLoading || playlistsLoading ? (
            <div className="flex items-center justify-center py-20">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
                <Disc className="w-10 h-10 text-primary" />
              </motion.div>
            </div>
          ) : sortedPlaylists.length === 0 ? (
            <Card className="border-dashed border-2 border-border">
              <CardContent className="p-10 text-center">
                {activeTab === 'collection' ? (
                  <Layers className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                ) : (
                  <Music className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                )}
                <p className="text-muted-foreground">
                  {playlistSearch ? 'No matching results' : activeTab === 'collection' ? 'No collections yet' : 'No playlists yet'}
                </p>
                {!playlistSearch && (
                  <Button className="mt-4 bg-primary hover:bg-primary/90" onClick={() => setIsCreateOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    {activeTab === 'collection' ? 'Create your first collection' : 'Create your first playlist'}
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <AnimatePresence mode="popLayout">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {sortedPlaylists.map((playlist) => (
                  <motion.div key={playlist.id} layout
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}>
                    <Card
                      className="group cursor-pointer transition-all duration-200 border-border hover:border-primary/50 hover:shadow-lg"
                      onClick={() => setSelectedPlaylist(playlist)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                            {renderCover(playlist, 'w-full h-full')}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              {playlist.pinned && <Pin className="h-3.5 w-3.5 text-gold flex-shrink-0" />}
                              <h3 className="font-semibold truncate">{playlist.name}</h3>
                            </div>
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              {playlist.description || (playlist.type === 'collection' ? 'Music collection' : 'Playlist')}
                            </p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <Badge variant="secondary" className="text-xs">
                                {playlistCountLabel(playlist)} songs
                              </Badge>
                              {playlist.type === 'collection' && (
                                <Badge variant="outline" className="text-xs border-primary/40 text-primary">Collection</Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-3 -mb-1">
                          <div className="flex gap-1">
                            <Button
                              variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10"
                              aria-label="Play"
                              onClick={(e) => { e.stopPropagation(); playFromLibrary(playlist); }}
                            >
                              <Play className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost" size="icon" className={`h-8 w-8 ${playlist.pinned ? 'text-gold' : ''}`}
                              aria-label={playlist.pinned ? 'Unpin' : 'Pin'}
                              onClick={(e) => { e.stopPropagation(); togglePin.mutate(playlist); }}
                            >
                              <Pin className={`h-4 w-4 ${playlist.pinned ? 'fill-current' : ''}`} />
                            </Button>
                            <Button
                              variant="ghost" size="icon" className="h-8 w-8"
                              aria-label="Shuffle play"
                              onClick={(e) => { e.stopPropagation(); playFromLibrary(playlist, true); }}
                            >
                              <Shuffle className="h-4 w-4" />
                            </Button>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8"
                                onClick={(e) => e.stopPropagation()}>
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                              <DropdownMenuItem onClick={() => setSelectedPlaylist(playlist)}>
                                <ListMusic className="h-4 w-4 mr-2" />Open
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => togglePin.mutate(playlist)}>
                                {playlist.pinned ? <PinOff className="h-4 w-4 mr-2" /> : <Pin className="h-4 w-4 mr-2" />}
                                {playlist.pinned ? 'Unpin' : 'Pin to top'}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setEditingPlaylist(playlist)}>
                                <Edit2 className="h-4 w-4 mr-2" />Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive" onClick={() => deletePlaylist.mutate(playlist.id)}>
                                <Trash2 className="h-4 w-4 mr-2" />Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
          )
        )}
      </motion.div>
    </div>
  );
};

/* Simple wrapper to keep header markup tidy */
const CardHeaderSlot: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="p-4 border-b border-border">{children}</div>
);

export default Playlists;
