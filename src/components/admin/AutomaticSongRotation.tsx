
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Song {
  id: string;
  title: string;
  artist: string;
}

interface SongOfDay {
  id: string;
  song_id: string;
  active: boolean;
  feature_date: string;
}

interface ViewStats {
  date: string;
  count: number;
}

const AutomaticSongRotation: React.FC = () => {
  const [currentFeatured, setCurrentFeatured] = useState<SongOfDay | null>(null);
  const [songDetails, setSongDetails] = useState<Song | null>(null);
  const [viewStats, setViewStats] = useState<ViewStats[]>([]);
  const [showStats, setShowStats] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  
  useEffect(() => {
    fetchCurrentFeatured();
  }, []);
  
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
        fetchSongDetails(data.song_id);
        fetchViewStats(data.song_id);
      }
    } catch (error) {
      console.error('Error in fetchCurrentFeatured:', error);
      toast.error('Error fetching current featured song');
    }
  };
  
  const fetchSongDetails = async (songId: string) => {
    try {
      const { data, error } = await supabase
        .from('songs')
        .select('id, title, artist')
        .eq('id', songId)
        .single();
        
      if (error) {
        console.error('Error fetching song details:', error);
        return;
      }
      
      setSongDetails(data);
    } catch (error) {
      console.error('Error in fetchSongDetails:', error);
    }
  };
  
  const fetchViewStats = async (songId: string) => {
    try {
      setIsLoadingStats(true);
      const { data, error } = await supabase
        .from('song_view_stats')
        .select('view_date, view_count')
        .eq('song_id', songId)
        .order('view_date', { ascending: false })
        .limit(14);
        
      if (error) {
        console.error('Error fetching view stats:', error);
        setIsLoadingStats(false);
        return;
      }
      
      const formattedStats = data.map(stat => ({
        date: new Date(stat.view_date).toLocaleDateString(),
        count: stat.view_count
      }));
      
      setViewStats(formattedStats);
      setIsLoadingStats(false);
    } catch (error) {
      console.error('Error in fetchViewStats:', error);
      setIsLoadingStats(false);
    }
  };
  
  const manuallyRotateSong = async () => {
    try {
      // Get a random published song
      const { data: publishedSongs, error: publishedSongsError } = await supabase
        .from('songs')
        .select('id')
        .eq('published', true);
        
      if (publishedSongsError || !publishedSongs || publishedSongs.length === 0) {
        toast.error('No published songs available');
        return;
      }
      
      // Randomly select one of the published songs
      const randomIndex = Math.floor(Math.random() * publishedSongs.length);
      const randomSongId = publishedSongs[randomIndex].id;
      
      // Deactivate all previously active songs
      await supabase
        .from('song_of_the_week')
        .update({ active: false })
        .eq('active', true);
      
      // Add the new song of the day
      const today = new Date().toISOString().split('T')[0];
      await supabase
        .from('song_of_the_week')
        .insert({
          song_id: randomSongId,
          active: true,
          feature_date: today
        });
      
      toast.success('Song of the Day has been manually rotated');
      fetchCurrentFeatured();
    } catch (error) {
      console.error('Error rotating song:', error);
      toast.error('Failed to rotate song');
    }
  };
  
  const toggleStats = () => {
    setShowStats(!showStats);
    if (!showStats && currentFeatured) {
      fetchViewStats(currentFeatured.song_id);
    }
  };
  
  // Calculate total views
  const totalViews = viewStats.reduce((sum, stat) => sum + stat.count, 0);
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Song of the Day</h2>
        <div className="flex gap-2">
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
          <Button
            variant="outline"
            size="sm"
            onClick={manuallyRotateSong}
          >
            Manually Rotate
          </Button>
        </div>
      </div>
      
      <Card className="bg-muted/30 border border-muted">
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            Automatic Song Rotation
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Info className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs max-w-xs">Songs are automatically rotated every day. You can manually rotate to a different song if needed.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Each day at midnight, a random song will be automatically selected from your published songs to be featured as the "Song of the Day".
          </p>
          
          {currentFeatured && songDetails ? (
            <div className="p-4 bg-background rounded-md flex justify-between items-start">
              <div>
                <p className="text-sm font-medium">Current Featured Song:</p>
                <p className="text-sm">
                  {songDetails.title} by {songDetails.artist}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Featured since: {new Date(currentFeatured.feature_date).toLocaleDateString()}
                </p>
                {totalViews > 0 && (
                  <p className="text-xs font-medium text-green-600 mt-1">
                    Total Views: {totalViews}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No song is currently featured. One will be automatically selected soon.</p>
          )}
          
          {showStats && (
            <div className="mt-6 p-4 bg-muted/50 border rounded-md">
              <h3 className="text-sm font-medium mb-3">Visitor Statistics (Last 14 days)</h3>
              
              {isLoadingStats ? (
                <div className="flex justify-center py-4">
                  <p className="text-sm text-muted-foreground">Loading statistics...</p>
                </div>
              ) : viewStats.length > 0 ? (
                <Table>
                  <TableCaption>Song views by day</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Views</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {viewStats.map((stat, index) => (
                      <TableRow key={index}>
                        <TableCell>{stat.date}</TableCell>
                        <TableCell className="text-right font-medium">{stat.count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">No view data available yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Views will be recorded when visitors access the Song of the Day</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AutomaticSongRotation;
