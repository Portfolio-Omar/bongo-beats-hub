import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Megaphone, Plus, Trash2, Tv, Upload, Video } from 'lucide-react';

const PromotionsTab: React.FC = () => {
  const [songs, setSongs] = useState<any[]>([]);
  const [promotions, setPromotions] = useState<any[]>([]);
  const [selectedSong, setSelectedSong] = useState('');
  const [boosterTiers, setBoosterTiers] = useState<any[]>([]);
  const [adVideos, setAdVideos] = useState<any[]>([]);
  const [adTitle, setAdTitle] = useState('');
  const [adVideoFile, setAdVideoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    const [songsRes, promoRes, tiersRes, adsRes] = await Promise.all([
      supabase.from('songs').select('id, title, artist').eq('published', true).order('title').limit(200),
      supabase.from('promoted_songs').select('*').order('created_at', { ascending: false }),
      supabase.from('booster_tiers').select('*').order('sort_order'),
      supabase.from('ad_videos').select('*').order('created_at', { ascending: false }),
    ]);
    if (songsRes.data) setSongs(songsRes.data);
    if (promoRes.data) setPromotions(promoRes.data);
    if (tiersRes.data) setBoosterTiers(tiersRes.data);
    if (adsRes.data) setAdVideos(adsRes.data);
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

  const uploadAdVideo = async () => {
    if (!adTitle.trim() || !adVideoFile) {
      toast.error('Please provide a title and video file');
      return;
    }
    setUploading(true);
    try {
      const ext = adVideoFile.name.split('.').pop();
      const fileName = `ad-${Date.now()}.${ext}`;
      
      // Convert file to ArrayBuffer for reliable upload
      const arrayBuffer = await adVideoFile.arrayBuffer();
      
      const { error: uploadError } = await supabase.storage
        .from('music_videos')
        .upload(`ads/${fileName}`, arrayBuffer, {
          contentType: adVideoFile.type,
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('music_videos')
        .getPublicUrl(`ads/${fileName}`);

      const { error } = await supabase.from('ad_videos').insert({
        title: adTitle,
        video_url: urlData.publicUrl,
        is_active: true,
      });

      if (error) throw error;
      toast.success('Ad video uploaded!');
      setAdTitle('');
      setAdVideoFile(null);
      // Reset file input
      const fileInput = document.querySelector('input[type="file"][accept="video/*"]') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      fetchAll();
    } catch (err: any) {
      console.error('Ad upload error:', err);
      toast.error('Upload failed: ' + (err.message || 'Unknown error'));
    } finally {
      setUploading(false);
    }
  };

  const toggleAdVideo = async (id: string, isActive: boolean) => {
    await supabase.from('ad_videos').update({ is_active: !isActive }).eq('id', id);
    toast.success(isActive ? 'Ad disabled' : 'Ad enabled');
    fetchAll();
  };

  const deleteAdVideo = async (id: string) => {
    await supabase.from('ad_videos').delete().eq('id', id);
    toast.success('Ad video deleted');
    fetchAll();
  };

  return (
    <div className="space-y-6">
      {/* Promoted Songs */}
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

      {/* Ad Videos Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Tv className="h-5 w-5" /> Ad Videos (Shown to users — max 3 ads/day)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            <div className="grid gap-2">
              <Label>Ad Title</Label>
              <Input value={adTitle} onChange={(e) => setAdTitle(e.target.value)} placeholder="e.g. Sponsor Message" />
            </div>
            <div className="grid gap-2">
              <Label>Video File (short clip, max 20MB)</Label>
              <Input type="file" accept="video/*" onChange={(e) => setAdVideoFile(e.target.files?.[0] || null)} />
            </div>
            <Button onClick={uploadAdVideo} disabled={uploading}>
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? 'Uploading...' : 'Upload Ad Video'}
            </Button>
          </div>

          <div className="space-y-2 mt-4">
            <h4 className="text-sm font-medium">Current Ad Videos</h4>
            {adVideos.length === 0 && <p className="text-sm text-muted-foreground">No ad videos uploaded yet</p>}
             {adVideos.map((ad: any) => (
              <div key={ad.id} className="flex flex-col gap-3 p-3 rounded-lg bg-muted/50 border border-border/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Video className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium">{ad.title}</p>
                      <Badge variant={ad.is_active ? 'default' : 'secondary'} className="text-xs mt-1">
                        {ad.is_active ? 'Active' : 'Disabled'}
                      </Badge>
                    </div>
                  </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" onClick={() => toggleAdVideo(ad.id, ad.is_active)}>
                    {ad.is_active ? 'Disable' : 'Enable'}
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => deleteAdVideo(ad.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Booster Tiers */}
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
