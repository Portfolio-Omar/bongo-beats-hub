import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  TrendingUp, Download, Eye, Music, Users, 
  Calendar, Activity, Disc
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format, subDays } from 'date-fns';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

const StatisticsDashboard: React.FC = () => {
  // Fetch song statistics
  const { data: songStats, isLoading: songsLoading } = useQuery({
    queryKey: ['song-statistics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('songs')
        .select('id, title, artist, download_count, genre, created_at')
        .eq('published', true)
        .order('download_count', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch view statistics
  const { data: viewStats, isLoading: viewsLoading } = useQuery({
    queryKey: ['view-statistics'],
    queryFn: async () => {
      const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('song_view_stats')
        .select('song_id, view_date, view_count')
        .gte('view_date', thirtyDaysAgo)
        .order('view_date', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch favorites count
  const { data: favoritesCount } = useQuery({
    queryKey: ['favorites-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('favorites')
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;
      return count || 0;
    },
  });

  // Fetch user count (from user_roles as proxy)
  const { data: usersCount } = useQuery({
    queryKey: ['users-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;
      return count || 0;
    },
  });

  // Calculate totals
  const totalDownloads = songStats?.reduce((sum, song) => sum + (song.download_count || 0), 0) || 0;
  const totalViews = viewStats?.reduce((sum, stat) => sum + stat.view_count, 0) || 0;
  const totalSongs = songStats?.length || 0;

  // Prepare chart data
  const topDownloaded = songStats?.slice(0, 10).map(song => ({
    name: song.title.length > 15 ? song.title.substring(0, 15) + '...' : song.title,
    downloads: song.download_count || 0,
    artist: song.artist,
  })) || [];

  // Group views by date
  const viewsByDate = viewStats?.reduce((acc, stat) => {
    const date = stat.view_date;
    if (!acc[date]) acc[date] = 0;
    acc[date] += stat.view_count;
    return acc;
  }, {} as Record<string, number>) || {};

  const viewsOverTime = Object.entries(viewsByDate).map(([date, views]) => ({
    date: format(new Date(date), 'MMM dd'),
    views,
  }));

  // Genre distribution
  const genreDistribution = songStats?.reduce((acc, song) => {
    const genre = song.genre || 'Unknown';
    if (!acc[genre]) acc[genre] = 0;
    acc[genre]++;
    return acc;
  }, {} as Record<string, number>) || {};

  const genreData = Object.entries(genreDistribution).map(([name, value]) => ({
    name,
    value,
  }));

  const isLoading = songsLoading || viewsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Disc className="w-12 h-12 text-primary" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
        >
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Songs</p>
                  <p className="text-3xl font-bold">{totalSongs}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Music className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-accent/20 bg-gradient-to-br from-accent/5 to-transparent">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Downloads</p>
                  <p className="text-3xl font-bold">{totalDownloads.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                  <Download className="h-6 w-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-green-500/20 bg-gradient-to-br from-green-500/5 to-transparent">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Plays (30d)</p>
                  <p className="text-3xl font-bold">{totalViews.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Eye className="h-6 w-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Favorites</p>
                  <p className="text-3xl font-bold">{favoritesCount?.toLocaleString() || 0}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Downloaded Songs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5 text-primary" />
                Top Downloaded Songs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topDownloaded} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    width={100}
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value, name, props) => [
                      `${value} downloads`,
                      props.payload.artist
                    ]}
                  />
                  <Bar 
                    dataKey="downloads" 
                    fill="hsl(var(--primary))"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Plays Over Time */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-green-500" />
                Plays Over Time (Last 30 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={viewsOverTime}>
                  <defs>
                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="views" 
                    stroke="hsl(var(--primary))" 
                    fillOpacity={1}
                    fill="url(#colorViews)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Genre Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Music className="h-5 w-5 text-accent" />
                Genre Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={genreData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {genreData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Activity Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-purple-500" />
                Recently Added Songs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {songStats?.slice(0, 10).map((song) => (
                  <div
                    key={song.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{song.title}</p>
                      <p className="text-sm text-muted-foreground truncate">{song.artist}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{song.download_count || 0}</p>
                      <p className="text-xs text-muted-foreground">downloads</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default StatisticsDashboard;
