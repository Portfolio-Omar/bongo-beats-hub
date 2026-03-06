import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, Music2, Disc } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useAudio } from '@/context/AudioContext';
import { motion } from 'framer-motion';
import { Song } from '@/types/music';
import SongRating from './SongRating';

interface ArtistProfileProps {
  artistName: string;
  onClose?: () => void;
}

const ArtistProfile: React.FC<ArtistProfileProps> = ({ artistName, onClose }) => {
  const { playSong } = useAudio();

  const { data: songs } = useQuery({
    queryKey: ['artist-songs', artistName],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('songs')
        .select('*')
        .eq('published', true)
        .ilike('artist', `%${artistName}%`)
        .order('download_count', { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });

  const genres = songs ? [...new Set(songs.filter(s => s.genre).map(s => s.genre!))] : [];
  const totalDownloads = songs?.reduce((sum, s) => sum + (s.download_count || 0), 0) || 0;

  const handlePlay = (song: Song) => playSong(song, songs || []);

  return (
    <div className="space-y-6">
      {/* Artist Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/20 via-accent/10 to-primary/5 p-6">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center border-2 border-primary/20">
            <Music2 className="w-10 h-10 text-primary" />
          </div>
          <div>
            <h2 className="text-3xl font-heading font-bold">{artistName}</h2>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-sm text-muted-foreground">{songs?.length || 0} songs</span>
              <span className="text-sm text-muted-foreground">•</span>
              <span className="text-sm text-muted-foreground">{totalDownloads} downloads</span>
            </div>
            <div className="flex gap-1.5 mt-3">
              {genres.slice(0, 3).map(g => (
                <Badge key={g} variant="secondary" className="text-xs bg-primary/10 text-primary">{g}</Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Popular Tracks */}
      <div>
        <h3 className="font-heading font-semibold text-lg mb-3">Popular Tracks</h3>
        <div className="space-y-2">
          {songs?.map((song, i) => (
            <motion.div
              key={song.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
            >
              <span className="text-sm text-muted-foreground w-6 text-right">{i + 1}</span>
              <img
                src={song.cover_url || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=60&h=60&fit=crop'}
                alt="" className="w-10 h-10 rounded object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{song.title}</p>
                <div className="flex items-center gap-2">
                  {song.year && <span className="text-[10px] text-muted-foreground">{song.year}</span>}
                  <SongRating songId={song.id} compact />
                </div>
              </div>
              <span className="text-xs text-muted-foreground">{song.download_count || 0} ↓</span>
              <Button
                variant="ghost" size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handlePlay(song)}
              >
                <Play className="h-4 w-4" />
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ArtistProfile;
