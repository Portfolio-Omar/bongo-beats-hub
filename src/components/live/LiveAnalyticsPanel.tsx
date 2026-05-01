import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Users, Heart, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  sessionId: string;
  viewerCount: number;
}

const LiveAnalyticsPanel: React.FC<Props> = ({ sessionId, viewerCount }) => {
  const [peak, setPeak] = useState(0);
  const [reactions, setReactions] = useState(0);
  const [chatCount, setChatCount] = useState(0);

  // Track peak
  useEffect(() => {
    if (viewerCount > peak) setPeak(viewerCount);
  }, [viewerCount, peak]);

  // Snapshot every 30s
  useEffect(() => {
    if (!sessionId) return;
    const tick = async () => {
      const [{ count: rxn }, { count: chat }] = await Promise.all([
        supabase.from('live_reactions').select('*', { count: 'exact', head: true }).eq('session_id', sessionId),
        supabase.from('live_chat_messages').select('*', { count: 'exact', head: true }).eq('session_id', sessionId),
      ]);
      setReactions(rxn || 0);
      setChatCount(chat || 0);
      await supabase.from('live_analytics').insert({
        session_id: sessionId,
        viewer_count: viewerCount,
        reactions_count: rxn || 0,
        chat_messages_count: chat || 0,
      });
    };
    tick();
    const interval = setInterval(tick, 30000);
    return () => clearInterval(interval);
  }, [sessionId, viewerCount]);

  const engagement = viewerCount > 0 ? Math.round(((reactions + chatCount) / viewerCount) * 10) / 10 : 0;

  const stats = [
    { icon: Users, label: 'Live Now', value: viewerCount, color: 'text-blue-500' },
    { icon: TrendingUp, label: 'Peak', value: peak, color: 'text-green-500' },
    { icon: Heart, label: 'Reactions', value: reactions, color: 'text-pink-500' },
    { icon: MessageSquare, label: 'Chat msgs', value: chatCount, color: 'text-purple-500' },
  ];

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" /> Listener Analytics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {stats.map(s => (
            <div key={s.label} className="p-2 rounded bg-accent/30 text-center">
              <s.icon className={`h-4 w-4 mx-auto ${s.color}`} />
              <div className="text-lg font-bold mt-1">{s.value}</div>
              <div className="text-[10px] text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
        <div className="mt-2 text-xs text-center text-muted-foreground">
          Engagement rate: <span className="font-bold text-primary">{engagement}x</span> per viewer
        </div>
      </CardContent>
    </Card>
  );
};

export default LiveAnalyticsPanel;
