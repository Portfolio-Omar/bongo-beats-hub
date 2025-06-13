
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Music, Trash2, Edit2, Search } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Song } from '@/types/music';

const SongsManagementTab: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [songToDelete, setSongToDelete] = useState<string | null>(null);
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    artist: '',
    genre: '',
    year: ''
  });

  // Fetch songs from Supabase
  const { data: songs, isLoading } = useQuery({
    queryKey: ['admin_songs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('songs')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching songs:', error);
        toast.error('Failed to load songs');
        throw error;
      }
      
      return data as Song[];
    }
  });

  // Filter songs based on search term
  const filteredSongs = songs?.filter(song =>
    song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    song.artist.toLowerCase().includes(searchTerm.toLowerCase()) ||
    song.genre?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Toggle published status
  const togglePublishedMutation = useMutation({
    mutationFn: async ({ id, published }: { id: string, published: boolean }) => {
      const { error } = await supabase
        .from('songs')
        .update({ published })
        .eq('id', id);
      
      if (error) throw error;
      return { id, published };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin_songs'] });
      queryClient.invalidateQueries({ queryKey: ['songs'] });
      toast.success(`Song ${data.published ? 'published' : 'unpublished'} successfully`);
    },
    onError: (error) => {
      console.error('Error updating song:', error);
      toast.error('Failed to update song status');
    }
  });

  // Update song
  const updateSongMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string, updates: Partial<Song> }) => {
      const { error } = await supabase
        .from('songs')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_songs'] });
      queryClient.invalidateQueries({ queryKey: ['songs'] });
      toast.success('Song updated successfully');
      setEditingSong(null);
    },
    onError: (error) => {
      console.error('Error updating song:', error);
      toast.error('Failed to update song');
    }
  });

  // Delete song
  const deleteSongMutation = useMutation({
    mutationFn: async (id: string) => {
      // Get song data to delete from storage
      const { data: song, error: fetchError } = await supabase
        .from('songs')
        .select('audio_url, cover_url')
        .eq('id', id)
        .single();
      
      if (fetchError) throw fetchError;
      
      // Delete from database first
      const { error: dbError } = await supabase
        .from('songs')
        .delete()
        .eq('id', id);
      
      if (dbError) throw dbError;
      
      // Extract file paths from URLs and delete from storage
      if (song.audio_url) {
        const audioPath = song.audio_url.split('/').pop();
        if (audioPath) {
          await supabase.storage
            .from('songs')
            .remove([audioPath]);
        }
      }
      
      if (song.cover_url) {
        const coverPath = song.cover_url.split('/').pop();
        if (coverPath) {
          await supabase.storage
            .from('songs')
            .remove([coverPath]);
        }
      }
      
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_songs'] });
      queryClient.invalidateQueries({ queryKey: ['songs'] });
      toast.success('Song deleted successfully');
      setSongToDelete(null);
    },
    onError: (error) => {
      console.error('Error deleting song:', error);
      toast.error('Failed to delete song');
      setSongToDelete(null);
    }
  });

  const handleEdit = (song: Song) => {
    setEditingSong(song);
    setEditForm({
      title: song.title,
      artist: song.artist,
      genre: song.genre || '',
      year: song.year || ''
    });
  };

  const handleSaveEdit = () => {
    if (!editingSong) return;
    
    updateSongMutation.mutate({
      id: editingSong.id,
      updates: editForm
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-card p-6 rounded-lg border space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Music className="h-5 w-5 text-primary" />
            Manage Songs
          </h3>
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search songs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredSongs.length > 0 ? (
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Artist</TableHead>
                  <TableHead>Genre</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Published</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSongs.map((song) => (
                  <TableRow key={song.id} className="transition-colors hover:bg-muted/50">
                    <TableCell className="font-medium">{song.title}</TableCell>
                    <TableCell>{song.artist}</TableCell>
                    <TableCell>{song.genre || '-'}</TableCell>
                    <TableCell>{song.year || '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Switch
                          checked={song.published}
                          onCheckedChange={(checked) => togglePublishedMutation.mutate({ id: song.id, published: checked })}
                          className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-primary data-[state=checked]:to-secondary"
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEdit(song)}
                          className="hover:text-primary hover:border-primary/50"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => setSongToDelete(song.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8">
            <Music className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {searchTerm ? 'No songs found' : 'No songs available'}
            </h3>
            <p className="text-muted-foreground">
              {searchTerm ? 'Try adjusting your search terms' : 'Upload your first song using the Upload Songs tab'}
            </p>
          </div>
        )}
      </div>
      
      {/* Edit Song Dialog */}
      <Dialog open={!!editingSong} onOpenChange={(open) => !open && setEditingSong(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Song</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-artist">Artist</Label>
              <Input
                id="edit-artist"
                value={editForm.artist}
                onChange={(e) => setEditForm({ ...editForm, artist: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-genre">Genre</Label>
              <Input
                id="edit-genre"
                value={editForm.genre}
                onChange={(e) => setEditForm({ ...editForm, genre: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-year">Year</Label>
              <Input
                id="edit-year"
                value={editForm.year}
                onChange={(e) => setEditForm({ ...editForm, year: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingSong(null)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit} disabled={updateSongMutation.isPending}>
                {updateSongMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!songToDelete} onOpenChange={(open) => !open && setSongToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the song and its files. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => songToDelete && deleteSongMutation.mutate(songToDelete)}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SongsManagementTab;
