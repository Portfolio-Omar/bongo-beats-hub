import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Award, Users, Plus, Trash2, Edit, Save, X } from 'lucide-react';
import { toast } from 'sonner';

const GamificationTab: React.FC = () => {
  const queryClient = useQueryClient();
  const [newBadge, setNewBadge] = useState({ name: '', description: '', icon: '🏅', category: 'general', requirement_type: 'songs_listened', requirement_value: 10 });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});

  const { data: badges } = useQuery({
    queryKey: ['admin-badges'],
    queryFn: async () => {
      const { data } = await supabase.from('badge_definitions').select('*').order('category');
      return data || [];
    },
  });

  const { data: leaderboard } = useQuery({
    queryKey: ['admin-gamification-leaderboard'],
    queryFn: async () => {
      const { data } = await supabase.from('user_gamification').select('*').order('xp', { ascending: false }).limit(50);
      return data || [];
    },
  });

  const { data: profiles } = useQuery({
    queryKey: ['all-profiles-admin'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('user_id, full_name');
      const map: Record<string, string> = {};
      data?.forEach((p: any) => { map[p.user_id] = p.full_name || p.user_id.slice(0, 8); });
      return map;
    },
  });

  const addBadge = async () => {
    if (!newBadge.name) return;
    const { error } = await supabase.from('badge_definitions').insert(newBadge);
    if (error) { toast.error('Failed to add badge'); return; }
    toast.success('Badge added!');
    setNewBadge({ name: '', description: '', icon: '🏅', category: 'general', requirement_type: 'songs_listened', requirement_value: 10 });
    queryClient.invalidateQueries({ queryKey: ['admin-badges'] });
  };

  const deleteBadge = async (id: string) => {
    await supabase.from('badge_definitions').delete().eq('id', id);
    toast.success('Badge deleted');
    queryClient.invalidateQueries({ queryKey: ['admin-badges'] });
  };

  const saveBadge = async (id: string) => {
    await supabase.from('badge_definitions').update(editData).eq('id', id);
    toast.success('Badge updated');
    setEditingId(null);
    queryClient.invalidateQueries({ queryKey: ['admin-badges'] });
  };

  const levelColor = (level: string) => {
    const colors: Record<string, string> = {
      'Legend': 'bg-gold text-gold-foreground',
      'Super Fan': 'bg-purple-500 text-white',
      'Pro': 'bg-blue-500 text-white',
      'Rising Star': 'bg-green-500 text-white',
      'Explorer': 'bg-teal-500 text-white',
      'Beginner': 'bg-muted text-muted-foreground',
    };
    return colors[level] || 'bg-muted';
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="badges">
        <TabsList>
          <TabsTrigger value="badges" className="gap-2"><Award className="h-4 w-4" /> Badges</TabsTrigger>
          <TabsTrigger value="leaderboard" className="gap-2"><Trophy className="h-4 w-4" /> User Levels</TabsTrigger>
        </TabsList>

        <TabsContent value="badges" className="space-y-4 mt-4">
          {/* Add new badge */}
          <Card className="border-gold/20">
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Plus className="h-5 w-5" /> Add New Badge</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Input placeholder="Badge name" value={newBadge.name} onChange={e => setNewBadge({ ...newBadge, name: e.target.value })} />
                <Input placeholder="Description" value={newBadge.description} onChange={e => setNewBadge({ ...newBadge, description: e.target.value })} />
                <Input placeholder="Icon emoji" value={newBadge.icon} onChange={e => setNewBadge({ ...newBadge, icon: e.target.value })} className="w-20" />
                <select className="border rounded-md px-3 py-2 bg-background text-sm" value={newBadge.category}
                  onChange={e => setNewBadge({ ...newBadge, category: e.target.value })}>
                  <option value="general">General</option>
                  <option value="listening">Listening</option>
                  <option value="social">Social</option>
                  <option value="engagement">Engagement</option>
                  <option value="special">Special</option>
                </select>
                <select className="border rounded-md px-3 py-2 bg-background text-sm" value={newBadge.requirement_type}
                  onChange={e => setNewBadge({ ...newBadge, requirement_type: e.target.value })}>
                  <option value="songs_listened">Songs Listened</option>
                  <option value="messages_sent">Messages Sent</option>
                  <option value="comments_made">Comments Made</option>
                  <option value="songs_shared">Songs Shared</option>
                  <option value="streak_days">Streak Days</option>
                  <option value="unique_artists">Unique Artists</option>
                  <option value="early_user">Early User</option>
                </select>
                <Input type="number" placeholder="Required value" value={newBadge.requirement_value}
                  onChange={e => setNewBadge({ ...newBadge, requirement_value: parseInt(e.target.value) || 0 })} />
                <Button onClick={addBadge} className="bg-gold hover:bg-gold/90 text-gold-foreground"><Plus className="h-4 w-4 mr-1" /> Add</Button>
              </div>
            </CardContent>
          </Card>

          {/* Badges list */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Icon</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Requirement</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {badges?.map((badge: any) => (
                    <TableRow key={badge.id}>
                      <TableCell className="text-2xl">{editingId === badge.id ? <Input value={editData.icon} onChange={e => setEditData({ ...editData, icon: e.target.value })} className="w-16" /> : badge.icon}</TableCell>
                      <TableCell>{editingId === badge.id ? <Input value={editData.name} onChange={e => setEditData({ ...editData, name: e.target.value })} /> : <span className="font-medium">{badge.name}</span>}</TableCell>
                      <TableCell><Badge variant="outline">{badge.category}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{badge.requirement_type}</TableCell>
                      <TableCell>{badge.requirement_value}</TableCell>
                      <TableCell>{badge.is_active ? '✅' : '❌'}</TableCell>
                      <TableCell>
                        {editingId === badge.id ? (
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" onClick={() => saveBadge(badge.id)}><Save className="h-4 w-4" /></Button>
                            <Button size="icon" variant="ghost" onClick={() => setEditingId(null)}><X className="h-4 w-4" /></Button>
                          </div>
                        ) : (
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" onClick={() => { setEditingId(badge.id); setEditData(badge); }}><Edit className="h-4 w-4" /></Button>
                            <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deleteBadge(badge.id)}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leaderboard" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> User Levels & XP ({leaderboard?.length || 0} users)</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>XP</TableHead>
                    <TableHead>Points</TableHead>
                    <TableHead>Streak</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaderboard?.map((entry: any, i: number) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-bold">{i + 1}</TableCell>
                      <TableCell>{profiles?.[entry.user_id] || entry.user_id.slice(0, 8)}</TableCell>
                      <TableCell><Badge className={levelColor(entry.level)}>{entry.level}</Badge></TableCell>
                      <TableCell>{entry.xp}</TableCell>
                      <TableCell>{entry.points}</TableCell>
                      <TableCell>{entry.streak_days > 0 ? `🔥 ${entry.streak_days}` : '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GamificationTab;
