import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Maximize, Minimize, Radio, Users, Clock, Eye, Play } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useViewer } from '@/hooks/useLiveStream';
import LiveChat from '@/components/live/LiveChat';
import LiveReactions from '@/components/live/LiveReactions';
import CountdownTimer from '@/components/live/CountdownTimer';
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
  const [playingRecording, setPlayingRecording] = useState<LiveSession | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const replayVideoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { remoteStream, connected, connect, disconnect } = useViewer(activeSession?.id || null);

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

  const { data: pastSessions } = useQuery({
    queryKey: ['past-live-sessions'],
    queryFn: async () => {
      const { data } = await supabase
        .from('live_sessions')
        .select('*')
        .eq('status', 'ended')
        .order('ended_at', { ascending: false })
        .limit(20);
      return (data || []) as LiveSession[];
    },
  });

  useEffect(() => {
    const live = liveSessions?.find(s => s.status === 'live');
    if (live && !activeSession) {
      setActiveSession(live);
    }
  }, [liveSessions]);

  useEffect(() => {
    if (activeSession?.status === 'live') {
      connect();
      return () => disconnect();
    }
  }, [activeSession?.id]);

  useEffect(() => {
    if (videoRef.current && remoteStream) {
      videoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

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

  const getDurationBetween = (start: string | null, end: string | null) => {
    if (!start || !end) return '';
    const diff = Math.floor((new Date(end).getTime() - new Date(start).getTime()) / 1000);
    return formatDuration(diff);
  };

  const liveSession = liveSessions?.find(s => s.status === 'live');
  const scheduledSessions = liveSessions?.filter(s => s.status === 'scheduled') || [];

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Radio className="h-8 w-8 text-primary" />
          Live Performances
        </h1>
        <p className="text-muted-foreground mt-1">Watch live DJ sets and performances</p>
      </motion.div>

      {liveSession ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <Card ref={containerRef} className="border-border/50 bg-card/80 backdrop-blur overflow-hidden relative">
              <div className="relative aspect-video bg-black">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
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
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white font-semibold text-lg">{liveSession.title}</h3>
                    <Button size="icon" variant="ghost" onClick={toggleFullscreen} className="text-white hover:bg-white/20">
                      {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
                    </Button>
                  </div>
                </div>
                {!connected && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className="text-center text-white space-y-2">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto" />
                      <p className="text-sm">Connecting to stream...</p>
                    </div>
                  </div>
                )}
                <LiveReactions sessionId={liveSession.id} />
              </div>
              <CardContent className="p-3 flex items-center justify-between">
                <LiveReactions sessionId={liveSession.id} />
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-1 min-h-[400px]">
            <LiveChat sessionId={liveSession.id} />
          </div>
        </div>
      ) : playingRecording ? (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-border/50 bg-card/80 backdrop-blur overflow-hidden">
            <div className="relative aspect-video bg-black">
              <video
                ref={replayVideoRef}
                src={playingRecording.recording_url || ''}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
              <div className="absolute top-3 left-3 flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">📼 Replay</Badge>
                <span className="text-white text-sm font-semibold">{playingRecording.artist_name}</span>
              </div>
            </div>
            <CardContent className="p-3 flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{playingRecording.title}</h3>
                <p className="text-xs text-muted-foreground">
                  {playingRecording.ended_at && format(new Date(playingRecording.ended_at), 'PPp')}
                  {playingRecording.started_at && playingRecording.ended_at && ` • ${getDurationBetween(playingRecording.started_at, playingRecording.ended_at)}`}
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={() => setPlayingRecording(null)}>
                Close
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <Card className="border-border/50 bg-card/80 backdrop-blur">
          <CardContent className="py-16 text-center">
            <Radio className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Live Performance Right Now</h3>
            <p className="text-muted-foreground">Check back later or browse past performances below</p>
          </CardContent>
        </Card>
      )}

      {/* Scheduled with countdown */}
      {scheduledSessions.length > 0 && (
        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" /> Upcoming Performances
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {scheduledSessions.map(session => (
              <motion.div key={session.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <Card className="border-border/50 bg-card/80 backdrop-blur hover:border-primary/30 transition-colors">
                  <CardContent className="p-4 space-y-2">
                    <Badge variant="secondary" className="text-xs">Scheduled</Badge>
                    <h3 className="font-semibold">{session.title}</h3>
                    <p className="text-sm text-muted-foreground">{session.artist_name}</p>
                    {session.scheduled_for && (
                      <>
                        <p className="text-xs text-primary">{format(new Date(session.scheduled_for), 'PPp')}</p>
                        <CountdownTimer targetDate={session.scheduled_for} />
                      </>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}

      {/* Past Performances */}
      {pastSessions && pastSessions.length > 0 && (
        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" /> Past Performances
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {pastSessions.map(session => (
              <Card
                key={session.id}
                className={`border-border/50 bg-card/80 backdrop-blur hover:border-primary/30 transition-colors ${session.recording_url ? 'cursor-pointer' : ''}`}
                onClick={() => session.recording_url && setPlayingRecording(session)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="text-xs">
                      {session.recording_url ? '📼 Replay Available' : 'Ended'}
                    </Badge>
                    {session.recording_url && (
                      <Play className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <h3 className="font-semibold">{session.title}</h3>
                  <p className="text-sm text-muted-foreground">{session.artist_name}</p>
                  {session.ended_at && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(session.ended_at), 'PPp')}
                      {session.started_at && ` • ${getDurationBetween(session.started_at, session.ended_at)}`}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.section>
      )}
    </div>
  );
};

export default Live;
