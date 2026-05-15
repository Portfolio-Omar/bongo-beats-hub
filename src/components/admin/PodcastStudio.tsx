import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Mic, Square, Pause, Play, Upload, Trash2, Music2, Save,
  Headphones, Radio, Volume2, Sparkles, Wand2,
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Podcast = {
  id: string;
  title: string;
  description: string | null;
  audio_url: string;
  cover_url: string | null;
  duration_seconds: number | null;
  published: boolean;
  view_count: number;
  download_count: number;
  like_count: number;
  comment_count: number;
  created_at: string;
};

const fmt = (s: number) => {
  if (!isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

const PodcastStudio: React.FC = () => {
  // Recording state
  const [recording, setRecording] = useState(false);
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [level, setLevel] = useState(0);

  // Background music
  const [bgFile, setBgFile] = useState<File | null>(null);
  const [bgUrl, setBgUrl] = useState<string | null>(null);
  const [bgVolume, setBgVolume] = useState(0.25);
  const [micVolume, setMicVolume] = useState(1);
  const bgAudioRef = useRef<HTMLAudioElement | null>(null);

  // Web Audio refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const micGainRef = useRef<GainNode | null>(null);
  const bgGainRef = useRef<GainNode | null>(null);
  const destRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);

  // Upload form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);

  const [items, setItems] = useState<Podcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [bitrate, setBitrate] = useState<number>(192000);
  const [aiLoading, setAiLoading] = useState(false);

  const loadPodcasts = async () => {
    setLoading(true);
    const { data } = await (supabase as any).from('podcasts').select('*').order('created_at', { ascending: false });
    setItems((data as Podcast[]) || []);
    setLoading(false);
  };
  useEffect(() => { loadPodcasts(); }, []);

  useEffect(() => () => {
    cleanupAudio();
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (bgUrl) URL.revokeObjectURL(bgUrl);
  }, []);

  const cleanupAudio = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (timerRef.current) window.clearInterval(timerRef.current);
    micStreamRef.current?.getTracks().forEach(t => t.stop());
    micStreamRef.current = null;
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close().catch(() => {});
    }
    audioCtxRef.current = null;
    bgAudioRef.current?.pause();
  };

  const setupMixer = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 48000,
        channelCount: 2,
      } as MediaTrackConstraints,
    });
    micStreamRef.current = stream;
    const ctx = new AudioContext({ sampleRate: 48000 });
    audioCtxRef.current = ctx;

    const micSrc = ctx.createMediaStreamSource(stream);
    const micGain = ctx.createGain();
    micGain.gain.value = micVolume;
    micGainRef.current = micGain;

    const dest = ctx.createMediaStreamDestination();
    destRef.current = dest;

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    analyserRef.current = analyser;

    micSrc.connect(micGain);
    micGain.connect(dest);
    micGain.connect(analyser);

    // Background music
    if (bgAudioRef.current) {
      const bgSrc = ctx.createMediaElementSource(bgAudioRef.current);
      const bgGain = ctx.createGain();
      bgGain.gain.value = bgVolume;
      bgGainRef.current = bgGain;
      bgSrc.connect(bgGain);
      bgGain.connect(dest);
      bgGain.connect(ctx.destination); // monitor BG music
    }

    // Visualize mic level
    const buf = new Uint8Array(analyser.frequencyBinCount);
    const tick = () => {
      analyser.getByteTimeDomainData(buf);
      let max = 0;
      for (let i = 0; i < buf.length; i++) {
        const v = Math.abs(buf[i] - 128) / 128;
        if (v > max) max = v;
      }
      setLevel(max);
      rafRef.current = requestAnimationFrame(tick);
    };
    tick();
  };

  const startRecording = async () => {
    try {
      if (previewUrl) { URL.revokeObjectURL(previewUrl); setPreviewUrl(null); setPreviewBlob(null); }
      await setupMixer();
      const dest = destRef.current!;
      const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';
      const rec = new MediaRecorder(dest.stream, { mimeType: mime, audioBitsPerSecond: 192000 });
      chunksRef.current = [];
      rec.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        setPreviewBlob(blob);
        cleanupAudio();
        setLevel(0);
      };
      rec.start(1000);
      recorderRef.current = rec;
      setRecording(true);
      setPaused(false);
      setElapsed(0);
      const start = Date.now();
      timerRef.current = window.setInterval(() => setElapsed((Date.now() - start) / 1000), 200);
      toast.success('Recording started');
    } catch (e) {
      console.error(e);
      toast.error('Microphone access denied');
      cleanupAudio();
    }
  };

  const togglePause = () => {
    const rec = recorderRef.current;
    if (!rec) return;
    if (rec.state === 'recording') {
      rec.pause();
      setPaused(true);
      bgAudioRef.current?.pause();
    } else if (rec.state === 'paused') {
      rec.resume();
      setPaused(false);
      bgAudioRef.current?.play().catch(() => {});
    }
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
    setRecording(false);
    setPaused(false);
    if (timerRef.current) window.clearInterval(timerRef.current);
  };

  const playBg = async () => {
    if (!bgAudioRef.current || !bgUrl) return;
    try { await bgAudioRef.current.play(); } catch {}
  };
  const pauseBg = () => bgAudioRef.current?.pause();

  useEffect(() => { if (bgGainRef.current) bgGainRef.current.gain.value = bgVolume; }, [bgVolume]);
  useEffect(() => { if (micGainRef.current) micGainRef.current.gain.value = micVolume; }, [micVolume]);
  useEffect(() => {
    if (!bgFile) return;
    const u = URL.createObjectURL(bgFile);
    setBgUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [bgFile]);

  const onUploadAudioFile = (f: File | null) => {
    setAudioFile(f);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (f) {
      setPreviewBlob(f);
      setPreviewUrl(URL.createObjectURL(f));
    } else {
      setPreviewBlob(null);
      setPreviewUrl(null);
    }
  };

  const publish = async (publishNow: boolean) => {
    if (!previewBlob) { toast.error('Record or upload an audio file first'); return; }
    if (!title.trim()) { toast.error('Title required'); return; }
    setUploading(true);
    try {
      const id = crypto.randomUUID();
      const ext = (previewBlob.type.includes('mpeg') || previewBlob.type.includes('mp3')) ? 'mp3'
        : (previewBlob.type.includes('wav') ? 'wav' : 'webm');
      const audioPath = `${id}/audio.${ext}`;
      const { error: aErr } = await supabase.storage.from('podcasts').upload(audioPath, previewBlob, {
        contentType: previewBlob.type || 'audio/webm', upsert: true,
      });
      if (aErr) throw aErr;
      const { data: aPub } = supabase.storage.from('podcasts').getPublicUrl(audioPath);

      let coverUrl: string | null = null;
      if (coverFile) {
        const cExt = coverFile.name.split('.').pop() || 'jpg';
        const cPath = `${id}/cover.${cExt}`;
        const { error: cErr } = await supabase.storage.from('podcasts').upload(cPath, coverFile, {
          contentType: coverFile.type, upsert: true,
        });
        if (!cErr) {
          const { data: cPub } = supabase.storage.from('podcasts').getPublicUrl(cPath);
          coverUrl = cPub.publicUrl;
        }
      }

      // Get duration
      let dur: number | null = null;
      try {
        const a = new Audio(previewUrl!);
        await new Promise<void>((res) => {
          a.addEventListener('loadedmetadata', () => res(), { once: true });
          setTimeout(() => res(), 4000);
        });
        if (isFinite(a.duration)) dur = Math.round(a.duration);
      } catch {}

      const { data: { user } } = await supabase.auth.getUser();
      const { error: insErr } = await (supabase as any).from('podcasts').insert({
        title: title.trim(),
        description: description.trim() || null,
        audio_url: aPub.publicUrl,
        cover_url: coverUrl,
        duration_seconds: dur,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        author_name: 'Bongo Old Skool',
        author_id: user?.id || null,
        published: publishNow,
      });
      if (insErr) throw insErr;

      toast.success(publishNow ? 'Podcast published!' : 'Podcast saved as draft');
      setTitle(''); setDescription(''); setTags(''); setCoverFile(null);
      setPreviewBlob(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      setAudioFile(null);
      loadPodcasts();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Publish failed');
    } finally {
      setUploading(false);
    }
  };

  const togglePublish = async (p: Podcast) => {
    const { error } = await (supabase as any).from('podcasts')
      .update({ published: !p.published }).eq('id', p.id);
    if (error) toast.error(error.message);
    else { toast.success(!p.published ? 'Published' : 'Unpublished'); loadPodcasts(); }
  };
  const remove = async (p: Podcast) => {
    if (!confirm(`Delete "${p.title}"?`)) return;
    const { error } = await (supabase as any).from('podcasts').delete().eq('id', p.id);
    if (error) toast.error(error.message);
    else { toast.success('Deleted'); loadPodcasts(); }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Radio className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Podcast Studio</h3>
          {recording && <Badge className="bg-red-500 text-white animate-pulse">REC {fmt(elapsed)}</Badge>}
        </div>

        {/* Recording controls */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <Label className="text-sm font-medium">Live recording</Label>
            <div className="flex gap-2 flex-wrap">
              {!recording ? (
                <Button onClick={startRecording} className="gap-2 bg-red-500 hover:bg-red-600 text-white">
                  <Mic className="h-4 w-4" /> Start recording
                </Button>
              ) : (
                <>
                  <Button onClick={togglePause} variant="secondary" className="gap-2">
                    {paused ? <Play className="h-4 w-4"/> : <Pause className="h-4 w-4"/>}
                    {paused ? 'Resume' : 'Pause'}
                  </Button>
                  <Button onClick={stopRecording} variant="destructive" className="gap-2">
                    <Square className="h-4 w-4"/> Stop
                  </Button>
                </>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Volume2 className="h-3 w-3"/> Mic gain
                </span>
                <span>{Math.round(micVolume * 100)}%</span>
              </div>
              <Slider value={[micVolume * 100]} onValueChange={(v) => setMicVolume(v[0] / 100)} max={200} step={1}/>
              <div className="h-2 rounded bg-muted overflow-hidden">
                <div className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 transition-all"
                     style={{ width: `${Math.min(100, level * 140)}%` }}/>
              </div>
            </div>
          </div>

          {/* Background music */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Music2 className="h-4 w-4"/> Background music (optional)
            </Label>
            <Input type="file" accept="audio/*" onChange={(e) => setBgFile(e.target.files?.[0] || null)}/>
            {bgUrl && (
              <>
                <audio ref={bgAudioRef} src={bgUrl} loop crossOrigin="anonymous" />
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={playBg}><Play className="h-3 w-3 mr-1"/>Play BG</Button>
                  <Button size="sm" variant="outline" onClick={pauseBg}><Pause className="h-3 w-3 mr-1"/>Pause BG</Button>
                </div>
              </>
            )}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Headphones className="h-3 w-3"/> BG volume
                </span>
                <span>{Math.round(bgVolume * 100)}%</span>
              </div>
              <Slider value={[bgVolume * 100]} onValueChange={(v) => setBgVolume(v[0] / 100)} max={100} step={1}/>
              <p className="text-[11px] text-muted-foreground">Keep BG music below 30% for clear voice.</p>
            </div>
          </div>
        </div>

        {/* Or upload existing audio */}
        <div className="border-t pt-4">
          <Label className="text-sm font-medium">Or upload existing audio file</Label>
          <Input type="file" accept="audio/*" className="mt-1"
            onChange={(e) => onUploadAudioFile(e.target.files?.[0] || null)}/>
        </div>

        {/* Preview */}
        {previewUrl && (
          <div className="border rounded-lg p-3 bg-muted/30 space-y-2">
            <Label className="text-xs">Preview</Label>
            <audio src={previewUrl} controls className="w-full"/>
          </div>
        )}

        {/* Metadata */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>Title *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Episode title"/>
          </div>
          <div>
            <Label>Tags (comma separated)</Label>
            <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="bongo, throwback, interview"/>
          </div>
          <div className="md:col-span-2">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
              placeholder="What's this episode about?"/>
          </div>
          <div>
            <Label>Cover image (optional)</Label>
            <Input type="file" accept="image/*" onChange={(e) => setCoverFile(e.target.files?.[0] || null)}/>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button disabled={uploading} onClick={() => publish(true)} className="gap-2">
            <Upload className="h-4 w-4"/> {uploading ? 'Uploading…' : 'Publish'}
          </Button>
          <Button disabled={uploading} variant="outline" onClick={() => publish(false)} className="gap-2">
            <Save className="h-4 w-4"/> Save as draft
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">All Podcasts ({items.length})</h3>
        {loading ? <p className="text-sm text-muted-foreground">Loading…</p> :
          items.length === 0 ? <p className="text-sm text-muted-foreground">No podcasts yet.</p> :
          <div className="space-y-3">
            {items.map(p => (
              <div key={p.id} className="border rounded-lg p-3 flex items-start gap-3">
                {p.cover_url
                  ? <img src={p.cover_url} alt="" className="w-16 h-16 rounded object-cover" />
                  : <div className="w-16 h-16 rounded bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center"><Radio className="h-6 w-6 text-primary"/></div>}
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{p.title}</div>
                  <div className="text-xs text-muted-foreground flex flex-wrap gap-2 mt-1">
                    <span>{fmt(p.duration_seconds || 0)}</span>
                    <span>· {p.view_count} plays</span>
                    <span>· {p.like_count} likes</span>
                    <span>· {p.comment_count} comments</span>
                    {p.published ? <Badge variant="secondary" className="text-[10px]">Published</Badge>
                      : <Badge variant="outline" className="text-[10px]">Draft</Badge>}
                  </div>
                  <audio src={p.audio_url} controls className="w-full mt-2 h-8"/>
                </div>
                <div className="flex flex-col gap-1">
                  <Button size="sm" variant="outline" onClick={() => togglePublish(p)}>
                    {p.published ? 'Unpublish' : 'Publish'}
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => remove(p)}>
                    <Trash2 className="h-3 w-3"/>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        }
      </Card>
    </div>
  );
};

export default PodcastStudio;
