import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Song } from '@/types/music';

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  user_id: string;
  created_at: string;
  songs?: Song[];
}

export const usePlaylists = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch playlists
  const fetchPlaylists = async () => {
    if (!user) {
      setPlaylists([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('playlists')
        .select(`
          *,
          playlist_songs(
            song_id,
            songs(*)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedPlaylists = data?.map(playlist => ({
        ...playlist,
        songs: playlist.playlist_songs?.map((ps: any) => ps.songs) || []
      })) || [];

      setPlaylists(formattedPlaylists);
    } catch (error) {
      console.error('Error fetching playlists:', error);
      toast({
        title: "Error",
        description: "Failed to load playlists",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Create playlist
  const createPlaylist = async (name: string, description?: string) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be signed in to create playlists",
        variant: "destructive",
      });
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('playlists')
        .insert({
          name,
          description,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: `Playlist "${name}" created`,
      });

      fetchPlaylists();
      return data;
    } catch (error) {
      console.error('Error creating playlist:', error);
      toast({
        title: "Error",
        description: "Failed to create playlist",
        variant: "destructive",
      });
      return null;
    }
  };

  // Delete playlist
  const deletePlaylist = async (playlistId: string) => {
    try {
      const { error } = await supabase
        .from('playlists')
        .delete()
        .eq('id', playlistId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Playlist deleted",
      });

      fetchPlaylists();
    } catch (error) {
      console.error('Error deleting playlist:', error);
      toast({
        title: "Error",
        description: "Failed to delete playlist",
        variant: "destructive",
      });
    }
  };

  // Add song to playlist
  const addSongToPlaylist = async (playlistId: string, songId: string) => {
    try {
      const { error } = await supabase
        .from('playlist_songs')
        .insert({
          playlist_id: playlistId,
          song_id: songId,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Song added to playlist",
      });

      fetchPlaylists();
    } catch (error: any) {
      console.error('Error adding song to playlist:', error);
      if (error?.code === '23505') {
        toast({
          title: "Info",
          description: "Song is already in this playlist",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to add song to playlist",
          variant: "destructive",
        });
      }
    }
  };

  // Remove song from playlist
  const removeSongFromPlaylist = async (playlistId: string, songId: string) => {
    try {
      const { error } = await supabase
        .from('playlist_songs')
        .delete()
        .eq('playlist_id', playlistId)
        .eq('song_id', songId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Song removed from playlist",
      });

      fetchPlaylists();
    } catch (error) {
      console.error('Error removing song from playlist:', error);
      toast({
        title: "Error",
        description: "Failed to remove song from playlist",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchPlaylists();
  }, [user]);

  return {
    playlists,
    loading,
    createPlaylist,
    deletePlaylist,
    addSongToPlaylist,
    removeSongFromPlaylist,
    refetch: fetchPlaylists,
  };
};
