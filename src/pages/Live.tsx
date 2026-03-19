import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Maximize, Minimize, Radio, Users, Clock, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useViewer } from '@/hooks/useLiveStream';
import LiveChat from '@/components/live/LiveChat';
import LiveReactions from '@/components/live/LiveReactions';
import { format } from 'date-fns';

interface LiveSession {
  id: string;
  title: string;
  artist_name: string;
  status: string;
  started_at: string | null;
  ended_at: string | null;
  viewer_count: number;
  scheduled_for: string | null;
  thumbnail_url: string | null;
  recording_url: string | null;
  created_at: string;
}

const Live: React.FC = () => {
  const [activeSession, setActiveSession] = useState<LiveSession | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { remoteStream, connected, connect, disconnect } = useViewer(activeSession?.id || null);

  // Fetch live sessions
  const { data: liveSessions } = useQuery({
    queryKey: ['live-sessions'],
    queryFn: async () => {
      const { data } = await supabase
        .from('live_sessions')
        .select('*')
        .in('status', ['live', 'scheduled'])
        .order('created_at', { ascending: false });
      return (data || []) as LiveSession[];
    },
    refetchInterval: 5000,
  });

  // Past sessions
  const { data: pastSessions } = useQuery({
    queryKey: ['past-live-sessions'],
    queryFn: async () => {
      const { data } = await supabase
        .from('live_sessions')
        .select('*')
        .eq('status', 'ended')
        .order('ended_at', { ascending: false })
        .limit(10);
      return (data || []) as LiveSession[];
    },
  });

  // Auto-select active live session
  useEffect(() => {
    const live = liveSessions?.find(s => s.status === 'live');
    if (live && !activeSession) {
      setActiveSession(live);
    }
  }, [liveSessions]);

  // Connect to stream when session is set
  useEffect(() => {
    if (activeSession?.status === 'live') {
      connect();
      return () => disconnect();
    }
  }, [activeSession?.id]);

  // Set video source
  useEffect(() => {
    if (videoRef.current && remoteStream) {
      videoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Elapsed timer
  useEffect(() => {
    if (!activeSession?.started_at) return;
    const start = new Date(activeSession.started_at).getTime();
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [activeSession?.started_at]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const formatDuration = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const liveSession = liveSessions?.find(s => s.status === 'live');
  const scheduledSessions = liveSessions?.filter(s => s.status === 'scheduled') || [];

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Radio className="h-8 w-8 text-primary" />
          Live Performances
        </h1>
        <p className="text-muted-foreground mt-1">Watch live DJ sets and performances</p>
      </motion.div>

      {liveSession ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Main Video */}
          <div className="lg:col-span-2">
            <Card ref={containerRef} className="border-border/50 bg-card/80 backdrop-blur overflow-hidden relative">
              <div className="relative aspect-video bg-black">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />

                {/* Overlay */}
                <div className="absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-black/60 to-transparent">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive" className="animate-pulse text-xs">🔴 LIVE</Badge>
                      <span className="text-white text-sm font-semibold">{liveSession.artist_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs bg-black/50 text-white border-0">
                        <Users className="h-3 w-3 mr-1" />viewers
                      </Badge>
                      <Badge variant="secondary" className="text-xs bg-black/50 text-white border-0">
                        <Clock className="h-3 w-3 mr-1" />{formatDuration(elapsed)}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Bottom overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-semibold text-lg">{liveSession.title}</h3>
                    </div>
                    <Button size="icon" variant="ghost" onClick={toggleFullscreen} className="text-white hover:bg-white/20">
                      {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
                    </Button>
                  </div>
                </div>

                {/* Connection status */}
                {!connected && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className="text-center text-white space-y-2">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto" />
                      <p className="text-sm">Connecting to stream...</p>
                    </div>
                  </div>
                )}

                {/* Reactions overlay */}
                <LiveReactions sessionId={liveSession.id} />
              </div>

              {/* Reactions bar */}
              <CardContent className="p-3 flex items-center justify-between">
                <LiveReactions sessionId={liveSession.id} />
              </CardContent>
            </Card>
          </div>

          {/* Chat */}
          <div className="lg:col-span-1 min-h-[400px]">
            <LiveChat sessionId={liveSession.id} />
          </div>
        </div>
      ) : (
        <Card className="border-border/50 bg-card/80 backdrop-blur">
          <CardContent className="py-16 text-center">
            <Radio className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Live Performance Right Now</h3>
            <p className="text-muted-foreground">Check back later or browse past performances below</p>
          </CardContent>
        </Card>
      )}

      {/* Scheduled */}
      {scheduledSessions.length > 0 && (
        <section>
          <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" /> Upcoming
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {scheduledSessions.map(session => (
              <Card key={session.id} className="border-border/50 bg-card/80 backdrop-blur">
                <CardContent className="p-4">
                  <Badge variant="secondary" className="mb-2 text-xs">Scheduled</Badge>
                  <h3 className="font-semibold">{session.title}</h3>
                  <p className="text-sm text-muted-foreground">{session.artist_name}</p>
                  {session.scheduled_for && (
                    <p className="text-xs text-primary mt-1">{format(new Date(session.scheduled_for), 'PPp')}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Past Performances */}
      {pastSessions && pastSessions.length > 0 && (
        <section>
          <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" /> Past Performances
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {pastSessions.map(session => (
              <Card key={session.id} className="border-border/50 bg-card/80 backdrop-blur hover:border-primary/30 transition-colors cursor-pointer">
                <CardContent className="p-4">
                  <Badge variant="outline" className="mb-2 text-xs">Ended</Badge>
                  <h3 className="font-semibold">{session.title}</h3>
                  <p className="text-sm text-muted-foreground">{session.artist_name}</p>
                  {session.ended_at && (
                    <p className="text-xs text-muted-foreground mt-1">{format(new Date(session.ended_at), 'PPp')}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default Live;
