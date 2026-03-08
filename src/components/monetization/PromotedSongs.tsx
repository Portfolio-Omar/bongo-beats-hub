import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAudio } from '@/context/AudioContext';
import { Megaphone, Play } from 'lucide-react';
import { Song } from '@/types/music';

interface PromotedSong {
  id: string;
  song_id: string;
  promotion_type: string;
  song?: Song;
}

const PromotedSongs: React.FC = () => {
  const [promoted, setPromoted] = useState<PromotedSong[]>([]);
  const { playSong } = useAudio();

  useEffect(() => {
    fetchPromoted();
  }, []);

  const fetchPromoted = async () => {
    const { data } = await supabase.from('promoted_songs')
      .select('*').eq('is_active', true).order('created_at', { ascending: false }).limit(5);
    
    if (data && data.length > 0) {
      const songIds = data.map((p: any) => p.song_id);
      const { data: songs } = await supabase.from('songs').select('*').in('id', songIds);
      
      const merged = data.map((p: any) => ({
        ...p,
        song: songs?.find((s: any) => s.id === p.song_id),
      }));
      setPromoted(merged as PromotedSong[]);
    }
  };

  if (promoted.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-primary" /> Promoted Songs
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {promoted.map(p => p.song && (
            <div key={p.id} className="flex items-center justify-between p-2 rounded-lg bg-primary/5 border border-primary/10">
              <div className="flex items-center gap-3">
                {p.song.cover_url && (
                  <img src={p.song.cover_url} alt="" className="w-10 h-10 rounded object-cover" />
                )}
                <div>
                  <p className="font-medium text-sm">{p.song.title}</p>
                  <p className="text-xs text-muted-foreground">{p.song.artist}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  <Megaphone className="h-3 w-3 mr-1" /> Sponsored
                </Badge>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => playSong(p.song as Song)}>
                  <Play className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default PromotedSongs;
