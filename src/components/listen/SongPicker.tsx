import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Search, Plus, Play, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import type { SongSnapshot } from '@/hooks/useListenSession';

interface SongPickerProps {
  onPlayNow: (song: SongSnapshot) => void;
  onAddToQueue: (song: SongSnapshot) => void;
  disabled?: boolean;
  label?: string;
}

const SongPicker: React.FC<SongPickerProps> = ({ onPlayNow, onAddToQueue, disabled, label }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SongSnapshot[]>([]);
  const [searching, setSearching] = useState(false);

  const search = useCallback(async (q: string) => {
    setSearching(true);
    let req = supabase
      .from('songs')
      .select('id, title, artist, audio_url, cover_url, duration')
      .eq('published', true)
      .limit(20);
    if (q.trim()) {
      req = req.or(`title.ilike.%${q.trim()}%,artist.ilike.%${q.trim()}%`);
    } else {
      req = req.order('created_at', { ascending: false });
    }
    const { data } = await req;
    setResults((data || []) as SongSnapshot[]);
    setSearching(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => search(query), 300);
    return () => clearTimeout(t);
  }, [query, open, search]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled} className="gap-2">
          <Plus className="h-4 w-4" /> {label || 'Add Songs'}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="p-4 pb-2">
          <SheetTitle>Add songs to the session</SheetTitle>
        </SheetHeader>
        <div className="px-4 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title or artist..."
              className="pl-9"
            />
          </div>
        </div>
        <ScrollArea className="flex-1 px-2 pb-4">
          {searching ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ) : results.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">No songs found</p>
          ) : (
            <div className="space-y-1">
              {results.map((song) => (
                <div key={song.id} className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted/60">
                  {song.cover_url ? (
                    <img src={song.cover_url} alt="" className="h-10 w-10 rounded object-cover" />
                  ) : (
                    <div className="h-10 w-10 rounded bg-muted flex items-center justify-center text-muted-foreground">
                      <Play className="h-4 w-4" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{song.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{song.artist}</p>
                  </div>
                  <Button size="icon" variant="ghost" title="Play now" onClick={() => { onPlayNow(song); }}>
                    <Play className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" title="Add to queue" onClick={() => { onAddToQueue(song); }}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default SongPicker;
