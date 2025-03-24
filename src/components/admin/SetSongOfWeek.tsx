
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Song {
  id: string;
  title: string;
  artist: string;
}

interface SongOfWeek {
  id: string;
  song_id: string;
  active: boolean;
}

const SetSongOfWeek: React.FC = () => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [selectedSong, setSelectedSong] = useState<string | null>(null);
  const [currentFeatured, setCurrentFeatured] = useState<SongOfWeek | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    fetchSongs();
    fetchCurrentFeatured();
  }, []);
  
  const fetchSongs = async () => {
    try {
      const { data, error } = await supabase
        .from('songs')
        .select('id, title, artist')
        .order('title');
        
      if (error) {
        console.error('Error fetching songs:', error);
        return;
      }
      
      setSongs(data || []);
    } catch (error) {
      console.error('Error in fetchSongs:', error);
    }
  };
  
  const fetchCurrentFeatured = async () => {
    try {
      const { data, error } = await supabase
        .from('song_of_the_week')
        .select('*')
        .eq('active', true)
        .order('feature_date', { ascending: false })
        .limit(1)
        .single();
        
      if (error) {
        if (error.code !== 'PGRST116') { // PGRST116 is "No rows returned" error
          console.error('Error fetching featured song:', error);
        }
        return;
      }
      
      setCurrentFeatured(data);
      setSelectedSong(data.song_id);
    } catch (error) {
      console.error('Error in fetchCurrentFeatured:', error);
    }
  };
  
  const handleSetFeatured = async () => {
    if (!selectedSong) {
      toast.error('Please select a song');
      return;
    }
    
    setIsLoading(true);
    try {
      // If there's a current featured song, deactivate it
      if (currentFeatured) {
        const { error: updateError } = await supabase
          .from('song_of_the_week')
          .update({ active: false })
          .eq('id', currentFeatured.id);
          
        if (updateError) {
          console.error('Error deactivating current featured song:', updateError);
          toast.error('Error updating featured song');
          setIsLoading(false);
          return;
        }
      }
      
      // Insert the new featured song
      const { error: insertError } = await supabase
        .from('song_of_the_week')
        .insert({
          song_id: selectedSong,
          active: true,
          feature_date: new Date().toISOString()
        });
        
      if (insertError) {
        console.error('Error setting new featured song:', insertError);
        toast.error('Error setting featured song');
        setIsLoading(false);
        return;
      }
      
      toast.success('Featured song updated successfully');
      fetchCurrentFeatured();
    } catch (error) {
      console.error('Error in handleSetFeatured:', error);
      toast.error('An error occurred');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Set Song of the Week</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {currentFeatured && (
            <div className="p-4 bg-muted rounded-md">
              <p className="text-sm font-medium">Current Featured Song:</p>
              <p className="text-sm">
                {songs.find(s => s.id === currentFeatured.song_id)?.title || 'Unknown Song'} by {' '}
                {songs.find(s => s.id === currentFeatured.song_id)?.artist || 'Unknown Artist'}
              </p>
            </div>
          )}
          
          <div className="space-y-4">
            <Label className="text-base">Select a song to feature:</Label>
            <div className="grid gap-2 max-h-60 overflow-y-auto pr-2">
              {songs.map((song) => (
                <div key={song.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={song.id}
                    checked={selectedSong === song.id}
                    onCheckedChange={() => setSelectedSong(song.id)}
                  />
                  <Label htmlFor={song.id} className="cursor-pointer text-sm">
                    {song.title} - {song.artist}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          
          <Button 
            onClick={handleSetFeatured} 
            disabled={isLoading || !selectedSong}
            className="w-full"
          >
            {isLoading ? 'Updating...' : 'Set as Song of the Week'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SetSongOfWeek;
