import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

interface Playlist {
  id: string;
  name: string;
  description: string | null;
  user_id: string;
  created_at: string;
}

export const usePlaylists = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: playlists, isLoading } = useQuery({
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

  const createPlaylist = useMutation({
    mutationFn: async ({ name, description }: { name: string; description?: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('playlists')
        .insert([{
          name,
          description: description || null,
          user_id: user.id,
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      toast.success('Playlist created!');
    },
    onError: () => {
      toast.error('Failed to create playlist');
    },
  });

  const addSongToPlaylist = useMutation({
    mutationFn: async ({ playlistId, songId }: { playlistId: string; songId: string }) => {
      const { error } = await supabase
        .from('playlist_songs')
        .insert([{
          playlist_id: playlistId,
          song_id: songId,
        }]);
      
      if (error) {
        if (error.code === '23505') {
          throw new Error('Song already in playlist');
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlist-songs'] });
      toast.success('Song added to playlist!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add song');
    },
  });

  const removeSongFromPlaylist = useMutation({
    mutationFn: async ({ playlistId, songId }: { playlistId: string; songId: string }) => {
      const { error } = await supabase
        .from('playlist_songs')
        .delete()
        .eq('playlist_id', playlistId)
        .eq('song_id', songId);
      
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
      toast.success('Playlist deleted!');
    },
    onError: () => {
      toast.error('Failed to delete playlist');
    },
  });

  return {
    playlists,
    isLoading,
    createPlaylist,
    addSongToPlaylist,
    removeSongFromPlaylist,
    deletePlaylist,
  };
};
