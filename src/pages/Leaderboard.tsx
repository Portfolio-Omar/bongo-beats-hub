import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { motion } from 'framer-motion';
import { Trophy, Music, Wallet, Crown, Medal } from 'lucide-react';

interface LeaderEntry {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  value: number;
}

const rankIcons = [
  <Crown className="h-5 w-5 text-yellow-500" />,
  <Medal className="h-5 w-5 text-gray-400" />,
  <Medal className="h-5 w-5 text-amber-700" />,
];

const Leaderboard: React.FC = () => {
  const [topListeners, setTopListeners] = useState<LeaderEntry[]>([]);
  const [topEarners, setTopEarners] = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboards();
  }, []);

  const fetchLeaderboards = async () => {
    const [listenRes, earnRes] = await Promise.all([
      supabase.from('user_earnings').select('user_id, songs_listened_today').order('songs_listened_today', { ascending: false }).limit(20),
      supabase.from('user_earnings').select('user_id, total_earned').order('total_earned', { ascending: false }).limit(20),
    ]);

    // Collect all user IDs
    const allUserIds = new Set<string>();
    listenRes.data?.forEach(r => allUserIds.add(r.user_id));
    earnRes.data?.forEach(r => allUserIds.add(r.user_id));

    // Fetch profiles
    let profileMap = new Map<string, { full_name: string | null; avatar_url: string | null }>();
    if (allUserIds.size > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', Array.from(allUserIds));
      profiles?.forEach(p => profileMap.set(p.user_id, p));
    }

    if (listenRes.data) {
      setTopListeners(listenRes.data.map(r => ({
        user_id: r.user_id,
        value: r.songs_listened_today,
        full_name: profileMap.get(r.user_id)?.full_name || null,
        avatar_url: profileMap.get(r.user_id)?.avatar_url || null,
      })));
    }
    if (earnRes.data) {
      setTopEarners(earnRes.data.map(r => ({
        user_id: r.user_id,
        value: Number(r.total_earned),
        full_name: profileMap.get(r.user_id)?.full_name || null,
        avatar_url: profileMap.get(r.user_id)?.avatar_url || null,
      })));
    }
    setLoading(false);
  };

  const renderList = (entries: LeaderEntry[], unit: string) => (
    <div className="space-y-2">
      {entries.length === 0 && <p className="text-muted-foreground text-center py-8">No data yet. Start listening!</p>}
      {entries.map((entry, i) => (
        <motion.div
          key={entry.user_id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          className={`flex items-center justify-between p-3 rounded-lg ${i < 3 ? 'bg-primary/5 border border-primary/20' : 'bg-muted/50'}`}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-bold text-sm">
              {i < 3 ? rankIcons[i] : i + 1}
            </div>
            <Avatar className="h-8 w-8">
              <AvatarImage src={entry.avatar_url || undefined} />
              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                {entry.full_name ? entry.full_name[0].toUpperCase() : 'U'}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium text-sm">
              {entry.full_name || `User ${entry.user_id.slice(0, 8)}...`}
            </span>
          </div>
          <Badge variant={i < 3 ? 'default' : 'secondary'}>
            {unit === 'songs' ? `${entry.value} songs` : `KSh ${entry.value.toFixed(1)}`}
          </Badge>
        </motion.div>
      ))}
    </div>
  );

  if (loading) return <div className="container py-20 text-center text-muted-foreground">Loading...</div>;

  return (
    <div className="container px-4 py-6 sm:py-8 space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Trophy className="h-8 w-8 text-yellow-500" />
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Leaderboard</span>
        </h1>
        <p className="text-muted-foreground mt-1">Top listeners and earners on the platform</p>
      </motion.div>

      <Tabs defaultValue="listeners">
        <TabsList className="w-full max-w-md">
          <TabsTrigger value="listeners" className="flex-1 gap-2">
            <Music className="h-4 w-4" /> Top Listeners
          </TabsTrigger>
          <TabsTrigger value="earners" className="flex-1 gap-2">
            <Wallet className="h-4 w-4" /> Top Earners
          </TabsTrigger>
        </TabsList>
        <TabsContent value="listeners">
          <Card>
            <CardHeader><CardTitle>Today's Top Listeners</CardTitle></CardHeader>
            <CardContent>{renderList(topListeners, 'songs')}</CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="earners">
          <Card>
            <CardHeader><CardTitle>All-Time Top Earners</CardTitle></CardHeader>
            <CardContent>{renderList(topEarners, 'ksh')}</CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Leaderboard;
