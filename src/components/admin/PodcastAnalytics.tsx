import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { BarChart3, TrendingUp, Users, Repeat, PlayCircle, Headphones } from 'lucide-react';

type Podcast = {
  id: string;
  title: string;
  duration_seconds: number | null;
  view_count: number;
  like_count: number;
  comment_count: number;
  download_count: number;
};

type Event = {
  podcast_id: string;
  user_id: string | null;
  position_from: number;
  position_to: number;
  event_type: string;
  completed: boolean;
  created_at: string;
};

const PodcastAnalytics: React.FC = () => {
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any)
        .from('podcasts')
        .select('id,title,duration_seconds,view_count,like_count,comment_count,download_count')
        .order('created_at', { ascending: false });
      setPodcasts((data as Podcast[]) || []);
      if (data?.[0]?.id) setSelectedId(data[0].id);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    (async () => {
      const { data } = await (supabase as any)
        .from('podcast_listen_events')
        .select('*')
        .eq('podcast_id', selectedId)
        .order('created_at', { ascending: false })
        .limit(2000);
      setEvents((data as Event[]) || []);
    })();
  }, [selectedId]);

  const current = podcasts.find(p => p.id === selectedId);

  const stats = useMemo(() => {
    if (!current || events.length === 0) {
      return { uniqueListeners: 0, avgListen: 0, completionRate: 0, replayHotspots: [] as number[], buckets: [] as number[], dropPct: 0 };
    }
    const dur = Math.max(current.duration_seconds || 1, 1);
    const bucketCount = 20;
    const buckets = new Array(bucketCount).fill(0);
    let totalListened = 0;
    const sessions = new Map<string, number>();
    const completed = new Set<string>();
    events.forEach(e => {
      const span = Math.max(0, e.position_to - e.position_from);
      totalListened += span;
      const sKey = (e.user_id || 'anon') + ':' + e.created_at.slice(0, 10);
      sessions.set(sKey, (sessions.get(sKey) || 0) + span);
      if (e.completed) completed.add(sKey);
      const startB = Math.floor((e.position_from / dur) * bucketCount);
      const endB = Math.min(bucketCount - 1, Math.floor((e.position_to / dur) * bucketCount));
      for (let i = Math.max(0, startB); i <= endB; i++) buckets[i] += 1;
    });
    const uniqueListeners = sessions.size;
    const avgListen = uniqueListeners ? totalListened / uniqueListeners : 0;
    const completionRate = uniqueListeners ? (completed.size / uniqueListeners) * 100 : 0;
    const max = Math.max(...buckets, 1);
    const top = [...buckets.map((v, i) => ({ v, i }))].sort((a, b) => b.v - a.v).slice(0, 3).map(x => x.i);
    // Drop-off after midpoint: % decrease from peak to last bucket
    const peak = Math.max(...buckets);
    const last = buckets[buckets.length - 1] || 0;
    const dropPct = peak ? ((peak - last) / peak) * 100 : 0;
    return { uniqueListeners, avgListen, completionRate, replayHotspots: top, buckets, dropPct, max };
  }, [events, current]);

  const fmt = (s: number) => `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;

  if (loading) return <p className="text-sm text-muted-foreground">Loading analytics…</p>;
  if (podcasts.length === 0) return <p className="text-sm text-muted-foreground">No podcasts yet.</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <BarChart3 className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Creator Analytics</h3>
        <div className="ml-auto">
          <Select value={selectedId} onValueChange={setSelectedId}>
            <SelectTrigger className="w-[280px] h-9 text-sm"><SelectValue/></SelectTrigger>
            <SelectContent>
              {podcasts.map(p => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={<PlayCircle className="h-4 w-4"/>} label="Total plays" value={current?.view_count ?? 0}/>
        <StatCard icon={<Users className="h-4 w-4"/>} label="Unique listeners" value={stats.uniqueListeners}/>
        <StatCard icon={<Headphones className="h-4 w-4"/>} label="Avg listen" value={fmt(stats.avgListen)}/>
        <StatCard icon={<TrendingUp className="h-4 w-4"/>} label="Completion rate" value={`${stats.completionRate.toFixed(0)}%`}/>
      </div>

      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="font-medium text-sm">Listen heatmap (drop-off curve)</div>
          <Badge variant="outline" className="text-[10px]">Drop-off: {stats.dropPct.toFixed(0)}%</Badge>
        </div>
        <div className="flex items-end gap-1 h-32">
          {stats.buckets.map((v, i) => {
            const h = stats.max ? (v / stats.max) * 100 : 0;
            const hot = stats.replayHotspots.includes(i);
            return (
              <div key={i} className="flex-1 flex flex-col items-center justify-end">
                <div
                  className={`w-full rounded-t ${hot ? 'bg-primary' : 'bg-primary/30'} transition-all`}
                  style={{ height: `${Math.max(2, h)}%` }}
                  title={`Segment ${i + 1}: ${v} listens`}
                />
              </div>
            );
          })}
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>Start</span>
          <span>Middle</span>
          <span>End</span>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Repeat className="h-4 w-4 text-primary"/>
          <div className="font-medium text-sm">Most replayed sections</div>
        </div>
        <div className="text-sm space-y-1">
          {stats.replayHotspots.length === 0 ? (
            <p className="text-muted-foreground text-xs">Not enough data yet.</p>
          ) : stats.replayHotspots.map((b, idx) => {
            const start = Math.round(((b) / 20) * (current?.duration_seconds || 0));
            const end = Math.round(((b + 1) / 20) * (current?.duration_seconds || 0));
            return (
              <div key={idx} className="flex items-center justify-between border-b last:border-0 py-1.5">
                <span>#{idx + 1} · Segment {b + 1}</span>
                <span className="text-muted-foreground text-xs">{fmt(start)} – {fmt(end)}</span>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-4">
        <div className="font-medium text-sm mb-2">Engagement</div>
        <div className="grid grid-cols-3 gap-3 text-sm">
          <Mini label="Likes" value={current?.like_count ?? 0}/>
          <Mini label="Comments" value={current?.comment_count ?? 0}/>
          <Mini label="Downloads" value={current?.download_count ?? 0}/>
        </div>
      </Card>
    </div>
  );
};

const StatCard: React.FC<{icon: React.ReactNode; label: string; value: React.ReactNode}> = ({icon, label, value}) => (
  <Card className="p-3">
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">{icon}{label}</div>
    <div className="text-xl font-semibold mt-1">{value}</div>
  </Card>
);
const Mini: React.FC<{label: string; value: React.ReactNode}> = ({label, value}) => (
  <div className="rounded-lg border p-3">
    <div className="text-xs text-muted-foreground">{label}</div>
    <div className="text-lg font-semibold">{value}</div>
  </div>
);

export default PodcastAnalytics;
