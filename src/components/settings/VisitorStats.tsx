
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, ChartContainer, ChartBars, ChartBar } from '@/components/ui/chart';
import { supabase } from '@/integrations/supabase/client';
import { BarChart3, Info } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from '@/components/ui/skeleton';

interface ViewStats {
  date: string;
  count: number;
}

interface SongOfWeek {
  id: string;
  song_id: string;
  active: boolean;
  feature_date: string;
  song_title?: string;
  song_artist?: string;
}

const VisitorStats: React.FC = () => {
  const [currentFeatured, setCurrentFeatured] = useState<SongOfWeek | null>(null);
  const [viewStats, setViewStats] = useState<ViewStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [chartData, setChartData] = useState<{ name: string; value: number }[]>([]);
  
  useEffect(() => {
    fetchCurrentFeatured();
  }, []);
  
  const fetchCurrentFeatured = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('song_of_the_week')
        .select('*, songs:song_id(title, artist)')
        .eq('active', true)
        .order('feature_date', { ascending: false })
        .limit(1)
        .maybeSingle();
        
      if (error) {
        console.error('Error fetching featured song:', error);
        setIsLoading(false);
        return;
      }
      
      if (data) {
        const songData: SongOfWeek = {
          ...data,
          song_title: data.songs.title,
          song_artist: data.songs.artist
        };
        setCurrentFeatured(songData);
        fetchViewStats(data.song_id);
      } else {
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error in fetchCurrentFeatured:', error);
      setIsLoading(false);
    }
  };
  
  const fetchViewStats = async (songId: string) => {
    try {
      const { data, error } = await supabase
        .from('song_view_stats')
        .select('view_date, view_count')
        .eq('song_id', songId)
        .order('view_date', { ascending: false })
        .limit(14);
        
      if (error) {
        console.error('Error fetching view stats:', error);
        setIsLoading(false);
        return;
      }
      
      const formattedStats = data.map(stat => ({
        date: new Date(stat.view_date).toLocaleDateString(),
        count: stat.view_count
      }));
      
      setViewStats(formattedStats);
      
      // Format data for the chart
      setChartData(
        formattedStats
          .slice() // Create a copy
          .reverse() // Reverse to show oldest to newest
          .map((stat) => ({
            name: stat.date,
            value: stat.count,
          }))
      );
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error in fetchViewStats:', error);
      setIsLoading(false);
    }
  };
  
  // Calculate total views
  const totalViews = viewStats.reduce((sum, stat) => sum + stat.count, 0);
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Visitor Statistics
          </CardTitle>
          <CardDescription>Loading visitor data...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    );
  }
  
  if (!currentFeatured) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Visitor Statistics
          </CardTitle>
          <CardDescription>Track how many people view your featured song</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-6">
            No featured song has been set yet. Visit the Admin dashboard to set a Song of the Week.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Visitor Statistics
        </CardTitle>
        <CardDescription>Track how many people view your featured song</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-4 bg-muted rounded-md">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium">Current Featured Song:</p>
              <p className="text-sm">
                {currentFeatured.song_title || 'Unknown Song'} by {' '}
                {currentFeatured.song_artist || 'Unknown Artist'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Featured since: {new Date(currentFeatured.feature_date).toLocaleDateString()}
              </p>
              {totalViews > 0 && (
                <p className="text-sm font-medium text-green-600 mt-1">
                  Total Views: {totalViews}
                </p>
              )}
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Info className="h-4 w-4 text-primary" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs max-w-xs">This song is currently featured on the homepage. Views are counted each time a visitor accesses the Song of the Week.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        
        {viewStats.length > 0 ? (
          <div className="space-y-6">
            <div className="h-[200px] w-full">
              <ChartContainer>
                <BarChart
                  data={chartData}
                  yAxisWidth={30}
                  showAnimation={true}
                />
              </ChartContainer>
            </div>
            
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
            
            <div className="mt-4 pt-3 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Total Views:</span>
                <span className="text-sm font-bold">{totalViews}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Note: Each page load counts as one view. These statistics help track engagement with your featured song.
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground">No view data available yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Views will be recorded when visitors access the Song of the Week
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VisitorStats;
