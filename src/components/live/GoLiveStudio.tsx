import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Video, Mic, MicOff, VideoOff, Monitor, MonitorOff, Radio, Square, Users, Clock } from 'lucide-react';
import { useBroadcaster } from '@/hooks/useLiveStream';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import LiveChat from './LiveChat';
import DJMixer from './DJMixer';
import { toast } from '@/hooks/use-toast';

const GoLiveStudio: React.FC = () => {
  const { user } = useAuth();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [title, setTitle] = useState('Live Performance');
  const [artistName, setArtistName] = useState('DJ');
  const [isMuted, setIsMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const [devices, setDevices] = useState<{ video: MediaDeviceInfo[]; audio: MediaDeviceInfo[] }>({ video: [], audio: [] });
  const [selectedVideo, setSelectedVideo] = useState('');
  const [selectedAudio, setSelectedAudio] = useState('');
  const [liveDuration, setLiveDuration] = useState(0);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { isLive, localStream, screenStream, viewerCount, startMedia, startScreenShare, stopScreenShare, goLive, stopLive } = useBroadcaster(sessionId);

  // Get devices
  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then(devs => {
      setDevices({
        video: devs.filter(d => d.kind === 'videoinput'),
        audio: devs.filter(d => d.kind === 'audioinput'),
      });
    });
  }, []);

  // Preview local stream
  useEffect(() => {
    if (videoPreviewRef.current && localStream) {
      videoPreviewRef.current.srcObject = screenStream || localStream;
    }
  }, [localStream, screenStream]);

  // Timer
  useEffect(() => {
    if (isLive) {
      setLiveDuration(0);
      timerRef.current = setInterval(() => setLiveDuration(d => d + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isLive]);

  const handleStartPreview = async () => {
    await startMedia(selectedVideo || undefined, selectedAudio || undefined);
  };

  const handleGoLive = async () => {
    if (!user) { toast({ title: 'Please sign in', variant: 'destructive' }); return; }
    // Create session
    const { data, error } = await supabase.from('live_sessions').insert({
      title,
      artist_name: artistName,
      status: 'live',
      started_at: new Date().toISOString(),
      created_by: user.id,
    }).select().single();

    if (error || !data) { toast({ title: 'Failed to create session', variant: 'destructive' }); return; }
    setSessionId(data.id);
    // Wait for state, then go live
    setTimeout(() => goLive(), 100);
    toast({ title: '🔴 You are now LIVE!' });
  };

  // Fix: goLive depends on sessionId, so call it after setting
  useEffect(() => {
    if (sessionId && !isLive) {
      goLive();
    }
  }, [sessionId]);

  const handleStopLive = async () => {
    await stopLive();
    toast({ title: 'Stream ended' });
  };

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
      setIsMuted(!isMuted);
    }
  };

  const toggleCamera = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
      setIsCamOff(!isCamOff);
    }
  };

  const formatDuration = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Radio className="h-5 w-5 text-primary" />
            Live Studio
          </h2>
          <p className="text-sm text-muted-foreground">Go live and perform for your audience</p>
        </div>
        {isLive && (
          <div className="flex items-center gap-3">
            <Badge variant="destructive" className="animate-pulse">🔴 LIVE</Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />{formatDuration(liveDuration)}
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Users className="h-3 w-3" />{viewerCount} viewers
            </Badge>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Column: Preview + Controls */}
        <div className="lg:col-span-2 space-y-4">
          {/* Video Preview */}
          <Card className="border-border/50 bg-card/80 backdrop-blur overflow-hidden">
            <div className="relative aspect-video bg-black rounded-t-lg">
              <video ref={videoPreviewRef} autoPlay muted playsInline className="w-full h-full object-cover" />
              {!localStream && (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                  <div className="text-center space-y-2">
                    <Video className="h-12 w-12 mx-auto opacity-30" />
                    <p className="text-sm">Click "Start Preview" to begin</p>
                  </div>
                </div>
              )}
              {isLive && (
                <div className="absolute top-3 left-3">
                  <Badge variant="destructive" className="animate-pulse text-xs">🔴 LIVE</Badge>
                </div>
              )}
            </div>
            <CardContent className="p-3">
              {/* Device Selection */}
              {!isLive && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Performance title" className="h-9 text-sm" />
                  <Input value={artistName} onChange={e => setArtistName(e.target.value)} placeholder="Artist name" className="h-9 text-sm" />
                  <Select value={selectedVideo} onValueChange={setSelectedVideo}>
                    <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select Camera" /></SelectTrigger>
                    <SelectContent>
                      {devices.video.map(d => <SelectItem key={d.deviceId} value={d.deviceId}>{d.label || 'Camera'}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={selectedAudio} onValueChange={setSelectedAudio}>
                    <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select Mic" /></SelectTrigger>
                    <SelectContent>
                      {devices.audio.map(d => <SelectItem key={d.deviceId} value={d.deviceId}>{d.label || 'Microphone'}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Control Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                {!localStream && (
                  <Button onClick={handleStartPreview} variant="outline" size="sm">
                    <Video className="h-4 w-4 mr-1" /> Start Preview
                  </Button>
                )}
                {localStream && !isLive && (
                  <Button onClick={handleGoLive} className="bg-red-600 hover:bg-red-700 text-white" size="sm">
                    <Radio className="h-4 w-4 mr-1" /> Go Live
                  </Button>
                )}
                {isLive && (
                  <>
                    <Button onClick={handleStopLive} variant="destructive" size="sm">
                      <Square className="h-4 w-4 mr-1" /> End Stream
                    </Button>
                    <Button onClick={toggleMute} variant="outline" size="sm">
                      {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    </Button>
                    <Button onClick={toggleCamera} variant="outline" size="sm">
                      {isCamOff ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4" />}
                    </Button>
                    <Button onClick={screenStream ? stopScreenShare : startScreenShare} variant="outline" size="sm">
                      {screenStream ? <MonitorOff className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* DJ Mixer */}
          <DJMixer />
        </div>

        {/* Sidebar: Chat */}
        <div className="lg:col-span-1">
          {sessionId ? (
            <LiveChat sessionId={sessionId} isAdmin />
          ) : (
            <Card className="border-border/50 bg-card/80 backdrop-blur h-64 flex items-center justify-center">
              <p className="text-sm text-muted-foreground">Chat will appear when you go live</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default GoLiveStudio;
