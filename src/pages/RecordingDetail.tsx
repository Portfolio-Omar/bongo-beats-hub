import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Eye, Download, Share2, MessageSquare, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { format, formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

const RecordingDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const { data: recording, isLoading } = useQuery({
    queryKey: ['recording', id],
    queryFn: async () => {
      const { data } = await supabase.from('live_recordings').select('*').eq('id', id!).maybeSingle();
      return data;
    },
    enabled: !!id,
  });

  // Top chat contributors during the original session
  const { data: topChats = [] } = useQuery({
    queryKey: ['recording-top-chats', recording?.session_id],
    queryFn: async () => {
      if (!recording?.session_id) return [];
      const { data } = await supabase
        .from('live_chat_messages')
        .select('user_name, user_avatar')
        .eq('session_id', recording.session_id)
        .limit(500);
      const counts = new Map<string, { name: string; avatar: string | null; count: number }>();
      (data || []).forEach((m: any) => {
        const k = m.user_name || 'Anon';
        const cur = counts.get(k) || { name: k, avatar: m.user_avatar, count: 0 };
        cur.count++;
        counts.set(k, cur);
      });
      return Array.from(counts.values()).sort((a, b) => b.count - a.count).slice(0, 10);
    },
    enabled: !!recording?.session_id,
  });

  const { data: analytics = [] } = useQuery({
    queryKey: ['recording-analytics', recording?.session_id],
    queryFn: async () => {
      if (!recording?.session_id) return [];
      const { data } = await supabase
        .from('live_analytics')
        .select('*')
        .eq('session_id', recording.session_id)
        .order('snapshot_at', { ascending: true });
      return data || [];
    },
    enabled: !!recording?.session_id,
  });

  if (isLoading) return <div className="container mx-auto py-12 text-center">Loading…</div>;
  if (!recording) return <div className="container mx-auto py-12 text-center">Recording not found.</div>;

  const shareUrl = `${window.location.origin}/recordings/${recording.id}`;
  const handleShare = async () => {
    try {
      if (navigator.share) await navigator.share({ title: recording.title, url: shareUrl });
      else { await navigator.clipboard.writeText(shareUrl); toast.success('Link copied!'); }
    } catch {}
  };

  const peakViewers = analytics.reduce((m: number, a: any) => Math.max(m, a.viewer_count || 0), 0);
  const totalReactions = analytics.reduce((s: number, a: any) => s + (a.reactions_count || 0), 0);
  const totalChats = analytics.reduce((s: number, a: any) => s + (a.chat_messages_count || 0), 0);

  return (
    <div className="container mx-auto px-4 py-6 space-y-6 max-w-5xl">
      <Link to="/live" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> Back to Live
      </Link>

      <Card className="overflow-hidden">
        <video src={recording.recording_url} controls className="w-full aspect-video bg-black" />
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold">{recording.title}</h1>
              {recording.description && <p className="text-sm text-muted-foreground mt-1">{recording.description}</p>}
              <p className="text-xs text-muted-foreground mt-2">
                {format(new Date(recording.created_at), 'PPp')} • {formatDistanceToNow(new Date(recording.created_at), { addSuffix: true })}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-1" /> Share
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href={recording.recording_url} download={`${recording.title}.webm`}>
                  <Download className="h-4 w-4 mr-1" /> Download
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Total Views</div><div className="text-2xl font-bold flex items-center gap-1"><Eye className="h-5 w-5 text-primary" />{recording.view_count || 0}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Peak Live Viewers</div><div className="text-2xl font-bold">{peakViewers}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Chats / Reactions</div><div className="text-2xl font-bold">{totalChats} / {totalReactions}</div></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4" /> Viewers Over Time</CardTitle></CardHeader>
          <CardContent>
            {analytics.length === 0 ? (
              <p className="text-sm text-muted-foreground">No analytics captured.</p>
            ) : (
              <div className="space-y-1">
                {analytics.map((a: any) => (
                  <div key={a.id} className="flex items-center gap-2 text-xs">
                    <span className="w-24 text-muted-foreground">{format(new Date(a.snapshot_at), 'HH:mm:ss')}</span>
                    <div className="flex-1 h-2 bg-muted rounded">
                      <div className="h-full bg-primary rounded" style={{ width: `${Math.min(100, (a.viewer_count / Math.max(peakViewers, 1)) * 100)}%` }} />
                    </div>
                    <span className="w-10 text-right font-semibold">{a.viewer_count}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><MessageSquare className="h-4 w-4" /> Top Chatters</CardTitle></CardHeader>
          <CardContent>
            {topChats.length === 0 ? (
              <p className="text-sm text-muted-foreground">No chat activity recorded.</p>
            ) : (
              <div className="space-y-2">
                {topChats.map((u, i) => (
                  <div key={u.name} className="flex items-center gap-2 text-sm">
                    <Badge variant="secondary" className="w-6 justify-center">#{i + 1}</Badge>
                    <span className="flex-1 truncate">{u.name}</span>
                    <span className="text-xs text-muted-foreground">{u.count} msgs</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RecordingDetail;
