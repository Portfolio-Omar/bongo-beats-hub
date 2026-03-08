import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Megaphone, Plus, Trash2 } from 'lucide-react';

const PromotionsTab: React.FC = () => {
  const [songs, setSongs] = useState<any[]>([]);
  const [promotions, setPromotions] = useState<any[]>([]);
  const [selectedSong, setSelectedSong] = useState('');
  const [boosterTiers, setBoosterTiers] = useState<any[]>([]);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    const [songsRes, promoRes, tiersRes] = await Promise.all([
      supabase.from('songs').select('id, title, artist').eq('published', true).order('title').limit(200),
      supabase.from('promoted_songs').select('*').order('created_at', { ascending: false }),
      supabase.from('booster_tiers').select('*').order('sort_order'),
    ]);
    if (songsRes.data) setSongs(songsRes.data);
    if (promoRes.data) setPromotions(promoRes.data);
    if (tiersRes.data) setBoosterTiers(tiersRes.data);
  };

  const addPromotion = async () => {
    if (!selectedSong) { toast.error('Select a song'); return; }
    const { error } = await supabase.from('promoted_songs').insert({
      song_id: selectedSong,
      promotion_type: 'featured',
      is_active: true,
    });
    if (error) toast.error('Failed'); else { toast.success('Song promoted!'); setSelectedSong(''); fetchAll(); }
  };

  const removePromotion = async (id: string) => {
    await supabase.from('promoted_songs').update({ is_active: false }).eq('id', id);
    toast.success('Promotion removed');
    fetchAll();
  };

  const updateTierPrice = async (id: string, price: number) => {
    await supabase.from('booster_tiers').update({ price }).eq('id', id);
    toast.success('Price updated');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Megaphone className="h-5 w-5" /> Promoted Songs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Select value={selectedSong} onValueChange={setSelectedSong}>
              <SelectTrigger className="flex-1"><SelectValue placeholder="Select song to promote" /></SelectTrigger>
              <SelectContent>
                {songs.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.title} - {s.artist}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={addPromotion}><Plus className="h-4 w-4 mr-1" /> Add</Button>
          </div>
          <div className="space-y-2">
            {promotions.filter((p: any) => p.is_active).map((p: any) => {
              const song = songs.find(s => s.id === p.song_id);
              return (
                <div key={p.id} className="flex items-center justify-between p-2 rounded bg-muted/50">
                  <span className="text-sm">{song ? `${song.title} - ${song.artist}` : p.song_id.slice(0, 8)}</span>
                  <Button size="icon" variant="ghost" onClick={() => removePromotion(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Booster Tier Pricing</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {boosterTiers.map((t: any) => (
              <div key={t.id} className="flex items-center gap-3">
                <span className="text-sm font-medium w-40">{t.name}</span>
                <span className="text-xs text-muted-foreground w-24">KSh {t.rate_per_song}/song</span>
                <span className="text-xs text-muted-foreground w-16">{t.duration_hours}h</span>
                <Input
                  type="number"
                  className="w-24"
                  defaultValue={t.price}
                  onBlur={(e) => updateTierPrice(t.id, parseFloat(e.target.value))}
                />
                <Badge>{t.is_active ? 'Active' : 'Disabled'}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PromotionsTab;
