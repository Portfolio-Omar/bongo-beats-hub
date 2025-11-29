import { useState } from 'react';
import { Plus, ListMusic } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { usePlaylists } from '@/hooks/usePlaylists';
import PlaylistDialog from './PlaylistDialog';

interface AddToPlaylistMenuProps {
  songId: string;
}

const AddToPlaylistMenu = ({ songId }: AddToPlaylistMenuProps) => {
  const { playlists, addSongToPlaylist } = usePlaylists();
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Plus className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={() => setShowCreateDialog(true)}>
            <ListMusic className="mr-2 h-4 w-4" />
            Create New Playlist
          </DropdownMenuItem>
          {playlists.length > 0 && <DropdownMenuSeparator />}
          {playlists.map((playlist) => (
            <DropdownMenuItem
              key={playlist.id}
              onClick={() => addSongToPlaylist(playlist.id, songId)}
            >
              {playlist.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <PlaylistDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </>
  );
};

export default AddToPlaylistMenu;
