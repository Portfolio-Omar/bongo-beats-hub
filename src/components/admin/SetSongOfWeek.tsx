
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { BarChart3, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Song {
  id: string;
  title: string;
  artist: string;
}

interface SongOfWeek {
  id: string;
  song_id: string;
  active: boolean;
  feature_date: string; // This property was missing from the interface
}

interface ViewStats {
  date: string;
  count: number;
}

const SetSongOfWeek: React.FC = () => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [selectedSong, setSelectedSong] = useState<string | null>(null);
  const [currentFeatured, setCurrentFeatured] = useState<SongOfWeek | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [viewStats, setViewStats] = useState<ViewStats[]>([]);
  const [showStats, setShowStats] = useState(false);
  
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
        toast.error('Error fetching songs');
        return;
      }
      
      setSongs(data || []);
    } catch (error) {
      console.error('Error in fetchSongs:', error);
      toast.error('Error fetching songs');
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
        .maybeSingle();
        
      if (error) {
        console.error('Error fetching featured song:', error);
        return;
      }
      
      if (data) {
        setCurrentFeatured(data);
        setSelectedSong(data.song_id);
        fetchViewStats(data.song_id);
      }
    } catch (error) {
      console.error('Error in fetchCurrentFeatured:', error);
      toast.error('Error fetching current featured song');
    }
  };
  
  const fetchViewStats = async (songId: string) => {
    try {
      const { data, error } = await supabase
        .from('song_view_stats')
        .select('view_date, view_count')
        .eq('song_id', songId)
        .order('view_date', { ascending: false })
        .limit(7);
        
      if (error) {
        console.error('Error fetching view stats:', error);
        return;
      }
      
      const formattedStats = data.map(stat => ({
        date: new Date(stat.view_date).toLocaleDateString(),
        count: stat.view_count
      }));
      
      setViewStats(formattedStats);
    } catch (error) {
      console.error('Error in fetchViewStats:', error);
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
      await fetchCurrentFeatured();
    } catch (error) {
      console.error('Error in handleSetFeatured:', error);
      toast.error('An error occurred');
    } finally {
      setIsLoading(false);
    }
  };
  
  const toggleStats = () => {
    setShowStats(!showStats);
    if (!showStats && currentFeatured) {
      fetchViewStats(currentFeatured.song_id);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Featured Song Selection</h2>
        {currentFeatured && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={toggleStats}
            className="flex items-center gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            {showStats ? 'Hide Stats' : 'View Stats'}
          </Button>
        )}
      </div>
      
      {currentFeatured && (
        <div className="p-4 bg-muted rounded-md flex justify-between items-start">
          <div>
            <p className="text-sm font-medium">Current Featured Song:</p>
            <p className="text-sm">
              {songs.find(s => s.id === currentFeatured.song_id)?.title || 'Unknown Song'} by {' '}
              {songs.find(s => s.id === currentFeatured.song_id)?.artist || 'Unknown Artist'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Featured since: {new Date(currentFeatured.feature_date).toLocaleDateString()}
            </p>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <Info className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">This song is currently featured on the homepage</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}
      
      {showStats && viewStats.length > 0 && (
        <div className="p-4 bg-muted/50 border rounded-md">
          <h3 className="text-sm font-medium mb-2">View Statistics (Last 7 days)</h3>
          <div className="space-y-2">
            {viewStats.map((stat, index) => (
              <div key={index} className="flex justify-between items-center text-sm">
                <span>{stat.date}</span>
                <span className="font-medium">{stat.count} views</span>
              </div>
            ))}
            {viewStats.length === 0 && (
              <p className="text-xs text-muted-foreground">No view data available</p>
            )}
          </div>
        </div>
      )}
      
      <div className="space-y-4">
        <Label className="text-base">Select a song to feature:</Label>
        <div className="grid gap-2 max-h-60 overflow-y-auto pr-2 border rounded-md p-2">
          {songs.map((song) => (
            <div key={song.id} className="flex items-center space-x-2 hover:bg-muted/50 p-1 rounded-md">
              <Checkbox
                id={song.id}
                checked={selectedSong === song.id}
                onCheckedChange={() => setSelectedSong(song.id)}
              />
              <Label htmlFor={song.id} className="cursor-pointer text-sm flex-grow">
                {song.title} - {song.artist}
              </Label>
            </div>
          ))}
          
          {songs.length === 0 && (
            <p className="text-sm text-muted-foreground py-2 px-1">No songs available. Please upload some songs first.</p>
          )}
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
  );
};

export default SetSongOfWeek;
