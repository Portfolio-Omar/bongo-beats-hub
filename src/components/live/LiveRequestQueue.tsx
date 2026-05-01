import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ListMusic, Check, X, Play, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface SongRequest {
  id: string;
  session_id: string;
  user_id: string;
  user_name: string;
  song_title: string;
  song_artist: string | null;
  message: string | null;
  status: string;
  position: number;
  created_at: string;
}

interface Props {
  sessionId: string;
  isAdmin?: boolean;
}

const LiveRequestQueue: React.FC<Props> = ({ sessionId, isAdmin = false }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [songTitle, setSongTitle] = useState('');
  const [songArtist, setSongArtist] = useState('');
  const [message, setMessage] = useState('');

  const { data: requests = [] } = useQuery({
    queryKey: ['live-requests', sessionId],
    queryFn: async () => {
      const { data } = await supabase
        .from('live_song_requests')
        .select('*')
        .eq('session_id', sessionId)
        .order('position', { ascending: true })
        .order('created_at', { ascending: true });
      return (data || []) as SongRequest[];
    },
    enabled: !!sessionId,
  });

  // Realtime subscription
  useEffect(() => {
    if (!sessionId) return;
    const ch = supabase
      .channel(`req-${sessionId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'live_song_requests',
        filter: `session_id=eq.${sessionId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['live-requests', sessionId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [sessionId, queryClient]);

  const submitRequest = async () => {
    if (!user) { toast.error('Please sign in to request a song'); return; }
    if (!songTitle.trim()) { toast.error('Enter a song title'); return; }
    const { error } = await supabase.from('live_song_requests').insert({
      session_id: sessionId,
      user_id: user.id,
      user_name: user.email?.split('@')[0] || 'Listener',
      song_title: songTitle.trim(),
      song_artist: songArtist.trim() || null,
      message: message.trim() || null,
      position: requests.length,
    });
    if (error) { toast.error('Failed to submit request'); return; }
    toast.success('🎵 Request sent to DJ!');
    setSongTitle(''); setSongArtist(''); setMessage('');
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('live_song_requests').update({ status }).eq('id', id);
    queryClient.invalidateQueries({ queryKey: ['live-requests', sessionId] });
  };

  const deleteRequest = async (id: string) => {
    await supabase.from('live_song_requests').delete().eq('id', id);
    queryClient.invalidateQueries({ queryKey: ['live-requests', sessionId] });
  };

  const pending = requests.filter(r => r.status === 'pending');
  const accepted = requests.filter(r => r.status === 'accepted');

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <ListMusic className="h-4 w-4 text-primary" />
          Live Request Queue
          <Badge variant="secondary" className="text-[10px]">{pending.length} pending</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!isAdmin && user && (
          <div className="space-y-1.5 p-2 rounded bg-accent/30">
            <Input value={songTitle} onChange={e => setSongTitle(e.target.value)}
              placeholder="Song title *" className="h-8 text-xs" />
            <Input value={songArtist} onChange={e => setSongArtist(e.target.value)}
              placeholder="Artist (optional)" className="h-8 text-xs" />
            <Input value={message} onChange={e => setMessage(e.target.value)}
              placeholder="Shoutout/message (optional)" className="h-8 text-xs" />
            <Button onClick={submitRequest} size="sm" className="w-full h-8">
              <Plus className="h-3 w-3 mr-1" /> Request Song
            </Button>
          </div>
        )}

        <ScrollArea className="max-h-72">
          <div className="space-y-1">
            {accepted.length > 0 && (
              <div className="text-[10px] font-bold text-green-500 px-1">UP NEXT</div>
            )}
            {accepted.map(r => (
              <div key={r.id} className="p-2 rounded bg-green-500/10 border border-green-500/30 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">🎵 {r.song_title}</div>
                    {r.song_artist && <div className="text-muted-foreground truncate">{r.song_artist}</div>}
                    <div className="text-[10px] text-muted-foreground">by {r.user_name}</div>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => updateStatus(r.id, 'played')} title="Mark played">
                        <Play className="h-3 w-3 text-primary" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => deleteRequest(r.id)}>
                        <X className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {pending.length > 0 && (
              <div className="text-[10px] font-bold text-muted-foreground px-1 mt-2">REQUESTS</div>
            )}
            {pending.map(r => (
              <div key={r.id} className="p-2 rounded bg-accent/40 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{r.song_title}</div>
                    {r.song_artist && <div className="text-muted-foreground truncate">{r.song_artist}</div>}
                    <div className="text-[10px] text-muted-foreground">by {r.user_name}</div>
                    {r.message && <div className="text-[10px] italic mt-0.5">"{r.message}"</div>}
                  </div>
                  {isAdmin ? (
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => updateStatus(r.id, 'accepted')} title="Accept">
                        <Check className="h-3 w-3 text-green-500" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => updateStatus(r.id, 'rejected')} title="Reject">
                        <X className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}

            {requests.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">No requests yet</p>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default LiveRequestQueue;
