import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  Headphones, Radio, Volume2, Wand2, Sparkles, SkipForward, Search, Lightbulb,
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import PodcastAnalytics from './PodcastAnalytics';

type Podcast = {
  id: string; title: string; description: string | null; audio_url: string; cover_url: string | null;
  duration_seconds: number | null; published: boolean; view_count: number; download_count: number;
  like_count: number; comment_count: number; created_at: string;
};
type LibSong = { id: string; title: string; artist: string; genre: string | null; audio_url: string; cover_url: string | null };

const fmt = (s: number) => {
  if (!isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60); const sec = Math.floor(s % 60);
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

  // Library-backed background music
  const [library, setLibrary] = useState<LibSong[]>([]);
  const [libSearch, setLibSearch] = useState('');
  const [selectedSong, setSelectedSong] = useState<LibSong | null>(null);
  const [bgVolume, setBgVolume] = useState(0.25);
  const [micVolume, setMicVolume] = useState(1);
  const [bgPlaying, setBgPlaying] = useState(false);
  const [bgTime, setBgTime] = useState(0);
  const [bgDuration, setBgDuration] = useState(0);
  const bgAudioRef = useRef<HTMLAudioElement | null>(null);

  // Web Audio refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const micGainRef = useRef<GainNode | null>(null);
  const bgGainRef = useRef<GainNode | null>(null);
  const bgSrcNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
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

  const [items, setItems] = useState<Podcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [bitrate, setBitrate] = useState<number>(192000);
  const [aiLoading, setAiLoading] = useState<null | 'meta' | 'topic' | 'song'>(null);
  const [topicHint, setTopicHint] = useState<{topic: string; angle: string; talking_points: string[]} | null>(null);

  const loadPodcasts = async () => {
    setLoading(true);
    const { data } = await (supabase as any).from('podcasts').select('*').order('created_at', { ascending: false });
    setItems((data as Podcast[]) || []);
    setLoading(false);
  };

  const loadLibrary = async () => {
    const { data } = await supabase
      .from('songs')
      .select('id,title,artist,genre,audio_url,cover_url')
      .eq('published', true)
      .order('title', { ascending: true })
      .limit(500);
    setLibrary((data as LibSong[]) || []);
  };

  useEffect(() => { loadPodcasts(); loadLibrary(); }, []);

  useEffect(() => () => {
    cleanupAudio();
    if (previewUrl) URL.revokeObjectURL(previewUrl);
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
    bgSrcNodeRef.current = null;
    bgAudioRef.current?.pause();
  };

  const setupMixer = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true, noiseSuppression: true, autoGainControl: true,
        sampleRate: 48000, channelCount: 2,
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

    if (bgAudioRef.current && selectedSong) {
      try {
        const bgSrc = ctx.createMediaElementSource(bgAudioRef.current);
        bgSrcNodeRef.current = bgSrc;
        const bgGain = ctx.createGain();
        bgGain.gain.value = bgVolume;
        bgGainRef.current = bgGain;
        bgSrc.connect(bgGain);
        bgGain.connect(dest);
        bgGain.connect(ctx.destination); // monitor
      } catch (e) { console.warn('BG wire failed', e); }
    }

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
      const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm';
      const rec = new MediaRecorder(dest.stream, { mimeType: mime, audioBitsPerSecond: bitrate });
      chunksRef.current = [];
      rec.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url); setPreviewBlob(blob);
        cleanupAudio(); setLevel(0);
      };
      rec.start(1000);
      recorderRef.current = rec;
      setRecording(true); setPaused(false); setElapsed(0);
      const start = Date.now();
      timerRef.current = window.setInterval(() => setElapsed((Date.now() - start) / 1000), 200);
      toast.success('Recording started');
    } catch (e) {
      console.error(e); toast.error('Microphone access denied'); cleanupAudio();
    }
  };

  const togglePause = () => {
    const rec = recorderRef.current; if (!rec) return;
    if (rec.state === 'recording') { rec.pause(); setPaused(true); bgAudioRef.current?.pause(); }
    else if (rec.state === 'paused') { rec.resume(); setPaused(false); bgAudioRef.current?.play().catch(() => {}); }
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
    setRecording(false); setPaused(false);
    if (timerRef.current) window.clearInterval(timerRef.current);
  };

  // BG controls
  const playBg = async () => { try { await bgAudioRef.current?.play(); setBgPlaying(true); } catch {} };
  const pauseBg = () => { bgAudioRef.current?.pause(); setBgPlaying(false); };
  const seekBg = (v: number) => { if (bgAudioRef.current) bgAudioRef.current.currentTime = v; };

  useEffect(() => { if (bgGainRef.current) bgGainRef.current.gain.value = bgVolume; }, [bgVolume]);
  useEffect(() => { if (micGainRef.current) micGainRef.current.gain.value = micVolume; }, [micVolume]);

  useEffect(() => {
    const a = bgAudioRef.current; if (!a) return;
    const onT = () => setBgTime(a.currentTime || 0);
    const onM = () => setBgDuration(a.duration || 0);
    const onE = () => setBgPlaying(false);
    a.addEventListener('timeupdate', onT);
    a.addEventListener('loadedmetadata', onM);
    a.addEventListener('ended', onE);
    return () => {
      a.removeEventListener('timeupdate', onT);
      a.removeEventListener('loadedmetadata', onM);
      a.removeEventListener('ended', onE);
    };
  }, [selectedSong]);

  const filteredLib = useMemo(() => {
    const q = libSearch.toLowerCase().trim();
    const list = q ? library.filter(s => s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q)) : library;
    return list.slice(0, 60);
  }, [libSearch, library]);

  const onPickAudioFile = (f: File | null) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (f) { setPreviewBlob(f); setPreviewUrl(URL.createObjectURL(f)); }
    else { setPreviewBlob(null); setPreviewUrl(null); }
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
        audio_url: aPub.publicUrl, cover_url: coverUrl, duration_seconds: dur,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        author_name: 'Bongo Old Skool', author_id: user?.id || null,
        published: publishNow,
      });
      if (insErr) throw insErr;

      toast.success(publishNow ? 'Podcast published!' : 'Podcast saved as draft');
      setTitle(''); setDescription(''); setTags(''); setCoverFile(null);
      setPreviewBlob(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      loadPodcasts();
    } catch (e: any) {
      console.error(e); toast.error(e.message || 'Publish failed');
    } finally { setUploading(false); }
  };

  const togglePublish = async (p: Podcast) => {
    const { error } = await (supabase as any).from('podcasts').update({ published: !p.published }).eq('id', p.id);
    if (error) toast.error(error.message);
    else { toast.success(!p.published ? 'Published' : 'Unpublished'); loadPodcasts(); }
  };
  const remove = async (p: Podcast) => {
    if (!confirm(`Delete "${p.title}"?`)) return;
    const { error } = await (supabase as any).from('podcasts').delete().eq('id', p.id);
    if (error) toast.error(error.message);
    else { toast.success('Deleted'); loadPodcasts(); }
  };

  const aiMeta = async () => {
    setAiLoading('meta');
    try {
      const { data, error } = await supabase.functions.invoke('podcast-ai-assist', {
        body: { mode: 'metadata', topic: topicHint?.topic || title || tags, currentTitle: title },
      });
      if (error) throw error;
      const r: any = data;
      if (r?.title) setTitle(r.title);
      if (r?.description) setDescription((r.description || '') + (Array.isArray(r.notes) ? `\n\nHighlights:\n• ${r.notes.join('\n• ')}` : ''));
      if (Array.isArray(r?.tags)) setTags(r.tags.join(', '));
      toast.success('AI metadata generated');
    } catch (e: any) { toast.error(e?.message || 'AI assist failed'); }
    finally { setAiLoading(null); }
  };

  const aiTopic = async () => {
    setAiLoading('topic');
    try {
      const { data, error } = await supabase.functions.invoke('podcast-ai-assist', { body: { mode: 'topic' } });
      if (error) throw error;
      const r: any = data;
      if (r?.topic) { setTopicHint({ topic: r.topic, angle: r.angle, talking_points: r.talking_points || [] }); toast.success('Topic suggested'); }
    } catch (e: any) { toast.error(e?.message || 'AI topic failed'); }
    finally { setAiLoading(null); }
  };

  const aiSong = async () => {
    if (library.length === 0) { toast.error('No songs in library'); return; }
    setAiLoading('song');
    try {
      const { data, error } = await supabase.functions.invoke('podcast-ai-assist', {
        body: { mode: 'song-pick', currentTitle: title, topic: topicHint?.topic, availableSongs: library.map(s => ({ title: s.title, artist: s.artist, genre: s.genre })) },
      });
      if (error) throw error;
      const r: any = data;
      const match = library.find(s => s.title.toLowerCase() === (r?.title || '').toLowerCase() && s.artist.toLowerCase() === (r?.artist || '').toLowerCase())
        || library.find(s => s.title.toLowerCase() === (r?.title || '').toLowerCase());
      if (match) { setSelectedSong(match); toast.success(`Picked: ${match.title} — ${match.artist}`); }
      else toast.error('AI suggestion not found in library');
    } catch (e: any) { toast.error(e?.message || 'AI song pick failed'); }
    finally { setAiLoading(null); }
  };

  return (
    <Tabs defaultValue="studio" className="space-y-4">
      <TabsList>
        <TabsTrigger value="studio">Studio</TabsTrigger>
        <TabsTrigger value="library">Episodes</TabsTrigger>
        <TabsTrigger value="analytics">Analytics</TabsTrigger>
      </TabsList>

      <TabsContent value="studio" className="space-y-6">
        <Card className="p-6 space-y-5">
          <div className="flex items-center gap-2 flex-wrap">
            <Radio className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Podcast Studio</h3>
            {recording && <Badge className="bg-red-500 text-white animate-pulse">REC {fmt(elapsed)}</Badge>}
            <div className="ml-auto flex gap-2 flex-wrap">
              <Button size="sm" variant="outline" disabled={aiLoading==='topic'} onClick={aiTopic} className="gap-1.5">
                <Lightbulb className="h-3.5 w-3.5"/>{aiLoading==='topic' ? 'Thinking…' : 'AI: suggest topic'}
              </Button>
              <Button size="sm" variant="outline" disabled={aiLoading==='song'} onClick={aiSong} className="gap-1.5">
                <Sparkles className="h-3.5 w-3.5"/>{aiLoading==='song' ? 'Picking…' : 'AI: pick song'}
              </Button>
            </div>
          </div>

          {topicHint && (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm space-y-1">
              <div className="font-medium">💡 Topic: {topicHint.topic}</div>
              {topicHint.angle && <div className="text-xs text-muted-foreground">{topicHint.angle}</div>}
              {topicHint.talking_points?.length > 0 && (
                <ul className="text-xs list-disc ml-5 mt-1 space-y-0.5">
                  {topicHint.talking_points.map((p, i) => <li key={i}>{p}</li>)}
                </ul>
              )}
            </div>
          )}

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
                  <span className="text-muted-foreground flex items-center gap-1"><Volume2 className="h-3 w-3"/> Mic gain</span>
                  <span>{Math.round(micVolume * 100)}%</span>
                </div>
                <Slider value={[micVolume * 100]} onValueChange={(v) => setMicVolume(v[0] / 100)} max={200} step={1}/>
                <div className="h-2 rounded bg-muted overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 transition-all"
                       style={{ width: `${Math.min(100, level * 140)}%` }}/>
                </div>
              </div>
            </div>

            {/* Background music from LIBRARY */}
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Music2 className="h-4 w-4"/> Background music (from library)
              </Label>

              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground"/>
                <Input className="pl-7 h-9" placeholder="Search songs..." value={libSearch} onChange={e => setLibSearch(e.target.value)}/>
              </div>

              <div className="border rounded-lg max-h-40 overflow-y-auto divide-y">
                {filteredLib.length === 0 && <div className="p-3 text-xs text-muted-foreground">No songs.</div>}
                {filteredLib.map(s => (
                  <button key={s.id} onClick={() => setSelectedSong(s)}
                    className={`w-full flex items-center gap-2 p-2 text-left hover:bg-muted/60 transition ${selectedSong?.id===s.id ? 'bg-primary/10':''}`}>
                    <img src={s.cover_url || '/placeholder.svg'} alt="" className="w-8 h-8 rounded object-cover"/>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium truncate">{s.title}</div>
                      <div className="text-[10px] text-muted-foreground truncate">{s.artist}</div>
                    </div>
                    {selectedSong?.id===s.id && <Badge variant="secondary" className="text-[9px]">Selected</Badge>}
                  </button>
                ))}
              </div>

              {selectedSong && (
                <>
                  <audio
                    key={selectedSong.id}
                    ref={bgAudioRef}
                    src={selectedSong.audio_url}
                    loop
                    crossOrigin="anonymous"
                  />
                  <div className="rounded-lg border p-2 space-y-2 bg-muted/30">
                    <div className="flex items-center gap-2">
                      <Button size="icon" variant="outline" className="h-8 w-8" onClick={bgPlaying ? pauseBg : playBg}>
                        {bgPlaying ? <Pause className="h-3.5 w-3.5"/> : <Play className="h-3.5 w-3.5"/>}
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => seekBg(Math.min(bgDuration, bgTime + 15))}>
                        <SkipForward className="h-3.5 w-3.5"/>
                      </Button>
                      <div className="text-[10px] text-muted-foreground tabular-nums">{fmt(bgTime)} / {fmt(bgDuration)}</div>
                    </div>
                    <Slider value={[bgTime]} max={Math.max(bgDuration, 1)} step={0.5}
                      onValueChange={(v) => seekBg(v[0])} />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground flex items-center gap-1"><Headphones className="h-3 w-3"/> BG volume</span>
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
            <Input type="file" accept="audio/*" className="mt-1" onChange={(e) => onPickAudioFile(e.target.files?.[0] || null)}/>
          </div>

          {previewUrl && (
            <div className="border rounded-lg p-3 bg-muted/30 space-y-2">
              <Label className="text-xs">Preview</Label>
              <audio src={previewUrl} controls className="w-full"/>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2 flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground">Recording bitrate</Label>
                <Select value={String(bitrate)} onValueChange={(v) => setBitrate(Number(v))}>
                  <SelectTrigger className="w-[160px] h-8 text-xs"><SelectValue/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="96000">96 kbps · Voice</SelectItem>
                    <SelectItem value="128000">128 kbps · Standard</SelectItem>
                    <SelectItem value="192000">192 kbps · High</SelectItem>
                    <SelectItem value="256000">256 kbps · Studio</SelectItem>
                    <SelectItem value="320000">320 kbps · Max</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="button" variant="outline" size="sm" disabled={aiLoading==='meta'} onClick={aiMeta} className="gap-2">
                <Wand2 className="h-3.5 w-3.5"/> {aiLoading==='meta' ? 'Thinking…' : 'AI: title, description & tags'}
              </Button>
            </div>
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
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="What's this episode about?"/>
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
      </TabsContent>

      <TabsContent value="library">
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
                      {p.published ? <Badge variant="secondary" className="text-[10px]">Published</Badge> : <Badge variant="outline" className="text-[10px]">Draft</Badge>}
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
      </TabsContent>

      <TabsContent value="analytics">
        <Card className="p-6">
          <PodcastAnalytics />
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default PodcastStudio;
