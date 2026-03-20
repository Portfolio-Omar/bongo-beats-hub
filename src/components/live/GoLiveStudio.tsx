import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Video, Mic, MicOff, VideoOff, Monitor, MonitorOff, Radio, Square, Users, Clock, CalendarPlus, Download } from 'lucide-react';
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
  const [selectedVideo, setSelectedVideo] = useState('default');
  const [selectedAudio, setSelectedAudio] = useState('default');
  const [liveDuration, setLiveDuration] = useState(0);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const { isLive, localStream, screenStream, viewerCount, startMedia, startScreenShare, stopScreenShare, goLive, stopLive } = useBroadcaster(sessionId);

  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then(devs => {
      setDevices({
        video: devs.filter(d => d.kind === 'videoinput'),
        audio: devs.filter(d => d.kind === 'audioinput'),
      });
    });
  }, []);

  useEffect(() => {
    if (videoPreviewRef.current && localStream) {
      videoPreviewRef.current.srcObject = screenStream || localStream;
    }
  }, [localStream, screenStream]);

  useEffect(() => {
    if (isLive) {
      setLiveDuration(0);
      timerRef.current = setInterval(() => setLiveDuration(d => d + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isLive]);

  // Start recording when live starts
  useEffect(() => {
    if (isLive && localStream && !mediaRecorderRef.current) {
      startRecording();
    }
  }, [isLive, localStream]);

  const startRecording = () => {
    const stream = screenStream || localStream;
    if (!stream) return;

    try {
      recordedChunksRef.current = [];
      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/webm',
      });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        if (recordedChunksRef.current.length > 0) {
          const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
          await uploadRecording(blob);
        }
        setIsRecording(false);
      };

      recorder.start(1000); // record in 1s chunks
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (e) {
      console.error('Recording failed:', e);
    }
  };

  const uploadRecording = async (blob: Blob) => {
    if (!sessionId) return;

    try {
      const fileName = `recordings/${sessionId}-${Date.now()}.webm`;
      const { data, error } = await supabase.storage
        .from('music_videos')
        .upload(fileName, blob, { contentType: 'video/webm' });

      if (error) {
        console.error('Upload error:', error);
        // Offer local download as fallback
        offerDownload(blob);
        return;
      }

      const { data: urlData } = supabase.storage.from('music_videos').getPublicUrl(fileName);
      await supabase.from('live_sessions').update({
        recording_url: urlData.publicUrl,
      }).eq('id', sessionId);

      toast({ title: '🎬 Recording saved!', description: 'Available in Past Performances' });
    } catch (e) {
      console.error('Upload failed:', e);
      offerDownload(blob);
    }
  };

  const offerDownload = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `live-recording-${Date.now()}.webm`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Recording downloaded locally' });
  };

  const handleStartPreview = async () => {
    const videoId = selectedVideo === 'default' ? undefined : selectedVideo;
    const audioId = selectedAudio === 'default' ? undefined : selectedAudio;
    await startMedia(videoId, audioId);
  };

  const handleGoLive = async () => {
    if (!user) { toast({ title: 'Please sign in', variant: 'destructive' }); return; }
    const { data, error } = await supabase.from('live_sessions').insert({
      title,
      artist_name: artistName,
      status: 'live',
      started_at: new Date().toISOString(),
      created_by: user.id,
    }).select().single();

    if (error || !data) { toast({ title: 'Failed to create session', variant: 'destructive' }); return; }
    setSessionId(data.id);
    toast({ title: '🔴 You are now LIVE!' });
  };

  useEffect(() => {
    if (sessionId && !isLive) {
      goLive();
    }
  }, [sessionId]);

  const handleStopLive = async () => {
    // Stop recording first
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
    await stopLive();
    toast({ title: 'Stream ended' });
  };

  const handleSchedule = async () => {
    if (!user) { toast({ title: 'Please sign in', variant: 'destructive' }); return; }
    if (!scheduleDate || !scheduleTime) { toast({ title: 'Set date and time', variant: 'destructive' }); return; }
    const scheduledFor = new Date(`${scheduleDate}T${scheduleTime}`).toISOString();
    const { error } = await supabase.from('live_sessions').insert({
      title,
      artist_name: artistName,
      status: 'scheduled',
      scheduled_for: scheduledFor,
      created_by: user.id,
    });
    if (error) { toast({ title: 'Failed to schedule', variant: 'destructive' }); return; }
    toast({ title: '📅 Performance scheduled!' });
    setScheduleDate('');
    setScheduleTime('');
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
            {isRecording && (
              <Badge variant="outline" className="text-xs border-red-500/50 text-red-500">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse mr-1" />
                REC
              </Badge>
            )}
            <Badge variant="secondary" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />{formatDuration(liveDuration)}
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Users className="h-3 w-3" />{viewerCount} viewers
            </Badge>
          </div>
        )}
      </div>

      {/* Schedule Section */}
      {!isLive && (
        <Card className="border-border/50 bg-card/80 backdrop-blur">
          <CardContent className="p-4">
            <h3 className="text-sm font-bold flex items-center gap-2 mb-3">
              <CalendarPlus className="h-4 w-4 text-primary" /> Schedule a Performance
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Performance title" className="h-9 text-sm" />
              <Input value={artistName} onChange={e => setArtistName(e.target.value)} placeholder="Artist name" className="h-9 text-sm" />
              <Input type="date" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} className="h-9 text-sm" />
              <div className="flex gap-2">
                <Input type="time" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)} className="h-9 text-sm flex-1" />
                <Button size="sm" onClick={handleSchedule} variant="outline" className="h-9">
                  <CalendarPlus className="h-4 w-4 mr-1" /> Schedule
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
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
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <Badge variant="destructive" className="animate-pulse text-xs">🔴 LIVE</Badge>
                  {isRecording && (
                    <Badge variant="outline" className="text-xs bg-black/50 text-red-400 border-red-500/30">
                      REC
                    </Badge>
                  )}
                </div>
              )}
            </div>
            <CardContent className="p-3">
              {!isLive && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Performance title" className="h-9 text-sm" />
                  <Input value={artistName} onChange={e => setArtistName(e.target.value)} placeholder="Artist name" className="h-9 text-sm" />
                  <Select value={selectedVideo} onValueChange={setSelectedVideo}>
                    <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select Camera" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default Camera</SelectItem>
                      {devices.video.map(d => (
                        <SelectItem key={d.deviceId} value={d.deviceId || `video-${d.label || 'cam'}`}>
                          {d.label || 'Camera'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedAudio} onValueChange={setSelectedAudio}>
                    <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select Mic" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default Microphone</SelectItem>
                      {devices.audio.map(d => (
                        <SelectItem key={d.deviceId} value={d.deviceId || `audio-${d.label || 'mic'}`}>
                          {d.label || 'Microphone'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

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

          <DJMixer />
        </div>

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
