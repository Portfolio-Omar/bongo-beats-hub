import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ListPlus, Plus, Music } from 'lucide-react';
import { usePlaylists } from '@/hooks/usePlaylists';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface AddToPlaylistMenuProps {
  songId: string;
  variant?: 'ghost' | 'outline' | 'default';
  size?: 'sm' | 'default' | 'icon';
  className?: string;
}

const AddToPlaylistMenu: React.FC<AddToPlaylistMenuProps> = ({
  songId,
  variant = 'ghost',
  size = 'icon',
  className = '',
}) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { playlists, createPlaylist, addSongToPlaylist } = usePlaylists();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  const handleAddToPlaylist = async (playlistId: string) => {
    await addSongToPlaylist.mutateAsync({ playlistId, songId });
  };

  const handleCreateAndAdd = async () => {
    if (!newPlaylistName.trim()) return;
    
    try {
      const playlist = await createPlaylist.mutateAsync({ name: newPlaylistName });
      await addSongToPlaylist.mutateAsync({ playlistId: playlist.id, songId });
      setIsCreateOpen(false);
      setNewPlaylistName('');
    } catch (error) {
      console.error('Error creating playlist:', error);
    }
  };

  if (!isAuthenticated) {
    return (
      <Button
        variant={variant}
        size={size}
        className={`hover:bg-primary/10 hover:text-primary ${className}`}
        onClick={(e) => {
          e.stopPropagation();
          toast.info('Sign in to create playlists');
          navigate('/auth');
        }}
      >
        <ListPlus className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={variant}
            size={size}
            className={`hover:bg-primary/10 hover:text-primary ${className}`}
            onClick={(e) => e.stopPropagation()}
          >
            <ListPlus className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 bg-card border-border z-50">
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              setIsCreateOpen(true);
            }}
            className="cursor-pointer"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create New Playlist
          </DropdownMenuItem>
          
          {playlists && playlists.length > 0 && (
            <>
              <DropdownMenuSeparator />
              {playlists.map((playlist) => (
                <DropdownMenuItem
                  key={playlist.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddToPlaylist(playlist.id);
                  }}
                  className="cursor-pointer"
                >
                  <Music className="h-4 w-4 mr-2" />
                  {playlist.name}
                </DropdownMenuItem>
              ))}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="bg-card border-border" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Create New Playlist</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <Input
              placeholder="Playlist name"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              className="bg-background border-border"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreateAndAdd();
                }
              }}
            />
            <Button
              onClick={handleCreateAndAdd}
              disabled={!newPlaylistName.trim() || createPlaylist.isPending}
              className="w-full bg-primary hover:bg-primary/90"
            >
              Create & Add Song
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AddToPlaylistMenu;
