import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Play, Pause, Heart, MessageSquare, Share2, Download,
  Radio, Clock, Search, Send, Trash2, SkipBack, SkipForward, Rss, Sparkles,
} from 'lucide-react';

type Podcast = {
  id: string;
  title: string;
  description: string | null;
  audio_url: string;
  cover_url: string | null;
  duration_seconds: number | null;
  tags: string[] | null;
  author_name: string | null;
  view_count: number;
  download_count: number;
  like_count: number;
  comment_count: number;
  created_at: string;
};
type Comment = {
  id: string; podcast_id: string; user_id: string; user_name: string;
  user_avatar: string | null; comment: string; created_at: string;
};

const fmt = (s: number) => {
  if (!isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

const SUPABASE_FN_BASE = 'https://fyspaszcchdknujhwpfs.supabase.co/functions/v1';

const Podcasts: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const [params, setParams] = useSearchParams();
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [tagFilter, setTagFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'liked' | 'longest'>('recent');
  const [autoplay, setAutoplay] = useState(true);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [newComment, setNewComment] = useState<Record<string, string>>({});
  const [likes, setLikes] = useState<Record<string, boolean>>({});
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});
  const [isAdmin, setIsAdmin] = useState(false);
  const audioRefs = useRef<Record<string, HTMLAudioElement | null>>({});
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Listen tracking refs
  const sessionIdRef = useRef<string>(Math.random().toString(36).slice(2) + Date.now().toString(36));
  const lastPosRef = useRef<Record<string, number>>({});
  const flushTimerRef = useRef<Record<string, number | null>>({});

  // Waveform refs
  const canvasRefs = useRef<Record<string, HTMLCanvasElement | null>>({});
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const wfRafRef = useRef<number | null>(null);
  const sourceMapRef = useRef<Map<HTMLAudioElement, MediaElementAudioSourceNode>>(new Map());

  useEffect(() => {
    document.title = 'Podcasts — Bongo Old Skool';
    (async () => {
      const { data } = await (supabase as any).from('podcasts').select('*')
        .eq('published', true).order('created_at', { ascending: false });
      setPodcasts((data as Podcast[]) || []);
      setLoading(false);
      if (user) {
        const { data: liked } = await (supabase as any).from('podcast_likes')
          .select('podcast_id').eq('user_id', user.id);
        if (liked) setLikes(Object.fromEntries(liked.map((l: any) => [l.podcast_id, true])));
        const { data: roleRow } = await (supabase as any).from('user_roles')
          .select('role').eq('user_id', user.id).eq('role', 'admin').maybeSingle();
        setIsAdmin(!!roleRow);
      }
    })();
  }, [user]);

  // Deep link: ?ep=<id> auto-plays the episode
  useEffect(() => {
    const ep = params.get('ep');
    if (!ep || podcasts.length === 0) return;
    const target = podcasts.find(p => p.id === ep);
    if (!target) return;
    setTimeout(() => {
      const card = cardRefs.current[ep];
      card?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const el = audioRefs.current[ep];
      if (el) {
        el.play().then(() => {
          setActiveId(ep);
          (supabase as any).rpc('increment_podcast_view', { _id: ep });
        }).catch(() => {});
      }
    }, 300);
  }, [params, podcasts]);

  // Listen tracking: flush a progress event every ~10s while playing
  const recordProgress = async (p: Podcast, completed = false) => {
    const el = audioRefs.current[p.id];
    if (!el) return;
    const to = el.currentTime || 0;
    const from = lastPosRef.current[p.id] ?? to;
    if (Math.abs(to - from) < 2 && !completed) return;
    lastPosRef.current[p.id] = to;
    try {
      await (supabase as any).from('podcast_listen_events').insert({
        podcast_id: p.id,
        user_id: user?.id || null,
        session_id: sessionIdRef.current,
        position_from: Math.max(0, from),
        position_to: to,
        event_type: completed ? 'complete' : 'progress',
        completed,
      });
    } catch {}
    // Continue-listening pointer
    try {
      if (to > 30 && (el.duration && to / el.duration < 0.95)) {
        localStorage.setItem('podcast:continue', JSON.stringify({
          id: p.id, title: p.title, position: to, at: Date.now(),
        }));
      } else if (completed) {
        localStorage.removeItem('podcast:continue');
      }
    } catch {}
  };

  const handleTimeUpdate = (p: Podcast) => {
    if (flushTimerRef.current[p.id]) return;
    flushTimerRef.current[p.id] = window.setTimeout(() => {
      flushTimerRef.current[p.id] = null;
      recordProgress(p);
    }, 10000) as unknown as number;
  };

  // Personalized "For You" — derive top tags from liked + history, recommend others
  const forYou = useMemo(() => {
    const interestTagCount = new Map<string, number>();
    podcasts.forEach(p => {
      if (likes[p.id]) p.tags?.forEach(t => interestTagCount.set(t, (interestTagCount.get(t) || 0) + 2));
    });
    if (interestTagCount.size === 0) return [] as Podcast[];
    const score = (p: Podcast) => {
      let s = 0;
      p.tags?.forEach(t => { s += interestTagCount.get(t) || 0; });
      s += Math.log10((p.view_count || 0) + 1);
      return s;
    };
    return [...podcasts]
      .filter(p => !likes[p.id])
      .map(p => ({ p, s: score(p) }))
      .filter(x => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 8)
      .map(x => x.p);
  }, [podcasts, likes]);

  // Continue listening from localStorage
  const continueItem = useMemo(() => {
    try {
      const raw = localStorage.getItem('podcast:continue');
      if (!raw) return null;
      const c = JSON.parse(raw);
      const p = podcasts.find(x => x.id === c.id);
      return p ? { p, position: c.position as number } : null;
    } catch { return null; }
  }, [podcasts]);

    const s = new Set<string>();
    podcasts.forEach(p => p.tags?.forEach(t => s.add(t)));
    return Array.from(s).sort();
  }, [podcasts]);

  const filtered = useMemo(() => {
    let list = podcasts.filter(p => {
      const q = search.toLowerCase();
      if (q && !(
        p.title.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.author_name?.toLowerCase().includes(q) ||
        p.tags?.some(t => t.toLowerCase().includes(q))
      )) return false;
      if (tagFilter !== 'all' && !(p.tags || []).includes(tagFilter)) return false;
      return true;
    });
    list = [...list].sort((a, b) => {
      if (sortBy === 'popular') return b.view_count - a.view_count;
      if (sortBy === 'liked') return b.like_count - a.like_count;
      if (sortBy === 'longest') return (b.duration_seconds || 0) - (a.duration_seconds || 0);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    return list;
  }, [podcasts, search, tagFilter, sortBy]);

  const loadComments = async (id: string) => {
    const { data } = await (supabase as any).from('podcast_comments')
      .select('*').eq('podcast_id', id).order('created_at', { ascending: false });
    setComments(c => ({ ...c, [id]: (data as Comment[]) || [] }));
  };

  const stopWaveform = () => {
    if (wfRafRef.current) cancelAnimationFrame(wfRafRef.current);
    wfRafRef.current = null;
  };

  const startWaveform = (id: string, el: HTMLAudioElement) => {
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
      const ctx = audioCtxRef.current;
      let src = sourceMapRef.current.get(el);
      if (!src) {
        src = ctx.createMediaElementSource(el);
        sourceMapRef.current.set(el, src);
      }
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      src.disconnect();
      src.connect(analyser);
      analyser.connect(ctx.destination);

      const canvas = canvasRefs.current[id];
      if (!canvas) return;
      const cctx = canvas.getContext('2d');
      if (!cctx) return;
      const data = new Uint8Array(analyser.frequencyBinCount);
      const draw = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(data);
        const w = canvas.width, h = canvas.height;
        cctx.clearRect(0, 0, w, h);
        const bars = 48;
        const step = Math.floor(data.length / bars);
        for (let i = 0; i < bars; i++) {
          const v = data[i * step] / 255;
          const bh = Math.max(2, v * h);
          const grad = cctx.createLinearGradient(0, h - bh, 0, h);
          grad.addColorStop(0, '#f0d78c');
          grad.addColorStop(1, '#b8860b');
          cctx.fillStyle = grad;
          const bw = w / bars - 2;
          cctx.fillRect(i * (w / bars), h - bh, bw, bh);
        }
        wfRafRef.current = requestAnimationFrame(draw);
      };
      draw();
    } catch (e) { /* CORS or already connected — ignore */ }
  };

  const playEpisode = async (p: Podcast) => {
    const el = audioRefs.current[p.id];
    if (!el) return;
    Object.entries(audioRefs.current).forEach(([id, a]) => { if (id !== p.id && a) { a.pause(); } });
    stopWaveform();
    try { await el.play(); } catch { return; }
    setActiveId(p.id);
    setParams(prev => { const n = new URLSearchParams(prev); n.set('ep', p.id); return n; }, { replace: true });
    await (supabase as any).rpc('increment_podcast_view', { _id: p.id });
    setPodcasts(ps => ps.map(x => x.id === p.id ? { ...x, view_count: x.view_count + 1 } : x));
    startWaveform(p.id, el);
  };

  const togglePlay = async (p: Podcast) => {
    const el = audioRefs.current[p.id];
    if (!el) return;
    if (el.paused) { await playEpisode(p); }
    else { el.pause(); setActiveId(null); stopWaveform(); }
  };

  const playByOffset = (offset: number) => {
    if (!activeId) return;
    const idx = filtered.findIndex(p => p.id === activeId);
    const next = filtered[idx + offset];
    if (next) playEpisode(next);
  };

  const handleEnded = (p: Podcast) => {
    setActiveId(null);
    stopWaveform();
    if (autoplay) playByOffset(1);
  };

  const toggleLike = async (p: Podcast) => {
    if (!isAuthenticated || !user) { toast.error('Sign in to like'); return; }
    const liked = likes[p.id];
    if (liked) {
      await (supabase as any).from('podcast_likes').delete().eq('podcast_id', p.id).eq('user_id', user.id);
      setLikes(s => ({ ...s, [p.id]: false }));
      setPodcasts(ps => ps.map(x => x.id === p.id ? { ...x, like_count: Math.max(0, x.like_count - 1) } : x));
    } else {
      await (supabase as any).from('podcast_likes').insert({ podcast_id: p.id, user_id: user.id });
      setLikes(s => ({ ...s, [p.id]: true }));
      setPodcasts(ps => ps.map(x => x.id === p.id ? { ...x, like_count: x.like_count + 1 } : x));
    }
  };

  const share = async (p: Podcast) => {
    const url = `${window.location.origin}/podcasts?ep=${p.id}`;
    try {
      if ((navigator as any).share) {
        await (navigator as any).share({ title: p.title, text: p.description || 'Listen on Bongo Old Skool', url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success('Episode link copied');
      }
    } catch {}
  };

  const download = async (p: Podcast) => {
    try {
      const r = await fetch(p.audio_url);
      const blob = await r.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${p.title}.${(blob.type.split('/')[1] || 'webm').split(';')[0]}`;
      a.click();
      URL.revokeObjectURL(a.href);
      await (supabase as any).rpc('increment_podcast_download', { _id: p.id });
      setPodcasts(ps => ps.map(x => x.id === p.id ? { ...x, download_count: x.download_count + 1 } : x));
    } catch (e) { toast.error('Download failed'); }
  };

  const submitComment = async (p: Podcast) => {
    if (!isAuthenticated || !user) { toast.error('Sign in to comment'); return; }
    const text = (newComment[p.id] || '').trim();
    if (!text) return;
    const userName = (user.user_metadata?.full_name as string) || user.email?.split('@')[0] || 'User';
    const { data, error } = await (supabase as any).from('podcast_comments').insert({
      podcast_id: p.id, user_id: user.id, user_name: userName,
      user_avatar: user.user_metadata?.avatar_url || null, comment: text,
    }).select().single();
    if (error) { toast.error(error.message); return; }
    setComments(c => ({ ...c, [p.id]: [data as Comment, ...(c[p.id] || [])] }));
    setNewComment(s => ({ ...s, [p.id]: '' }));
    setPodcasts(ps => ps.map(x => x.id === p.id ? { ...x, comment_count: x.comment_count + 1 } : x));
  };

  const deleteComment = async (id: string, podcastId: string) => {
    const { error } = await (supabase as any).from('podcast_comments').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    setComments(c => ({ ...c, [podcastId]: (c[podcastId] || []).filter(x => x.id !== id) }));
    setPodcasts(ps => ps.map(x => x.id === podcastId ? { ...x, comment_count: Math.max(0, x.comment_count - 1) } : x));
  };

  const copyRss = async () => {
    const url = `${SUPABASE_FN_BASE}/podcast-rss`;
    try { await navigator.clipboard.writeText(url); toast.success('RSS feed URL copied'); } catch {}
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-4xl md:text-5xl font-heading bg-gradient-to-r from-gold to-yellow-600 bg-clip-text text-transparent mb-2">
              Bongo Podcasts
            </h1>
            <p className="text-muted-foreground">Stories, interviews & throwback discussions from the golden era of Bongo Flava.</p>
          </div>
          <Button variant="outline" size="sm" onClick={copyRss} className="gap-2">
            <Rss className="h-4 w-4 text-orange-500"/> RSS Feed
          </Button>
        </div>
      </motion.div>

      <div className="grid md:grid-cols-[1fr_180px_180px_auto] gap-2 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
          <Input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search episodes, creators, topics, tags…" className="pl-9"/>
        </div>
        <Select value={tagFilter} onValueChange={setTagFilter}>
          <SelectTrigger><SelectValue placeholder="Tag"/></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All tags</SelectItem>
            {allTags.map(t => <SelectItem key={t} value={t}>#{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
          <SelectTrigger><SelectValue/></SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Most recent</SelectItem>
            <SelectItem value="popular">Most played</SelectItem>
            <SelectItem value="liked">Most liked</SelectItem>
            <SelectItem value="longest">Longest first</SelectItem>
          </SelectContent>
        </Select>
        <Button variant={autoplay ? 'default' : 'outline'} onClick={() => setAutoplay(a => !a)} className="gap-2">
          <Sparkles className="h-4 w-4"/> Autoplay {autoplay ? 'on' : 'off'}
        </Button>
      </div>

      {loading ? <p className="text-center text-muted-foreground py-12">Loading…</p>
        : filtered.length === 0 ? (
          <Card className="p-12 text-center">
            <Radio className="h-12 w-12 mx-auto text-muted-foreground mb-3"/>
            <p className="text-muted-foreground">No podcasts match your filters.</p>
          </Card>
        ) : (
        <div className="space-y-4">
          {filtered.map((p, i) => {
            const isActive = activeId === p.id;
            const isOpen = openComments[p.id];
            const myIdx = filtered.findIndex(x => x.id === p.id);
            return (
              <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }} ref={el => (cardRefs.current[p.id] = el)}>
                <Card className={`overflow-hidden transition-shadow ${isActive ? 'ring-2 ring-primary shadow-lg' : ''}`}>
                  <div className="p-4 md:p-5 flex flex-col md:flex-row gap-4">
                    <div className="relative w-full md:w-40 h-40 rounded-lg overflow-hidden flex-shrink-0 bg-gradient-to-br from-primary/30 to-primary/5">
                      {p.cover_url
                        ? <img src={p.cover_url} alt={p.title} className="w-full h-full object-cover" loading="lazy"/>
                        : <div className="w-full h-full flex items-center justify-center"><Radio className="h-12 w-12 text-primary/60"/></div>}
                      <button onClick={() => togglePlay(p)}
                        className="absolute inset-0 bg-black/0 hover:bg-black/40 flex items-center justify-center transition-all group">
                        <div className="bg-primary text-primary-foreground rounded-full p-4 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                          {isActive ? <Pause className="h-6 w-6"/> : <Play className="h-6 w-6 ml-0.5"/>}
                        </div>
                      </button>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h2 className="text-xl font-bold mb-1">{p.title}</h2>
                      {p.author_name && <p className="text-xs text-muted-foreground mb-2">By {p.author_name}</p>}
                      {p.description && <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{p.description}</p>}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3 flex-wrap">
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3"/>{fmt(p.duration_seconds || 0)}</span>
                        <span>{p.view_count} plays</span>
                        {p.tags && p.tags.length > 0 && p.tags.slice(0, 4).map(t =>
                          <Badge key={t} variant="secondary" className="text-[10px] cursor-pointer"
                            onClick={() => setTagFilter(t)}>#{t}</Badge>)}
                      </div>

                      {isActive && (
                        <canvas ref={el => (canvasRefs.current[p.id] = el)} width={520} height={48}
                          className="w-full h-12 mb-2 rounded bg-muted/30"/>
                      )}

                      <audio ref={el => (audioRefs.current[p.id] = el)} src={p.audio_url}
                        controls preload="none" className="w-full h-10" crossOrigin="anonymous"
                        onEnded={() => handleEnded(p)} onPause={() => { if (activeId === p.id) stopWaveform(); }}/>

                      <div className="flex flex-wrap gap-2 mt-3">
                        <Button size="sm" variant="outline" disabled={myIdx <= 0}
                          onClick={() => playEpisode(filtered[myIdx - 1])} className="gap-1">
                          <SkipBack className="h-3.5 w-3.5"/> Prev
                        </Button>
                        <Button size="sm" variant="outline" disabled={myIdx >= filtered.length - 1}
                          onClick={() => playEpisode(filtered[myIdx + 1])} className="gap-1">
                          Next <SkipForward className="h-3.5 w-3.5"/>
                        </Button>
                        <Button size="sm" variant={likes[p.id] ? 'default' : 'outline'} onClick={() => toggleLike(p)} className="gap-1">
                          <Heart className={`h-3.5 w-3.5 ${likes[p.id] ? 'fill-current' : ''}`}/> {p.like_count}
                        </Button>
                        <Button size="sm" variant="outline" className="gap-1"
                          onClick={() => { setOpenComments(s => ({ ...s, [p.id]: !s[p.id] })); if (!comments[p.id]) loadComments(p.id); }}>
                          <MessageSquare className="h-3.5 w-3.5"/> {p.comment_count}
                        </Button>
                        <Button size="sm" variant="outline" className="gap-1" onClick={() => share(p)}>
                          <Share2 className="h-3.5 w-3.5"/> Share
                        </Button>
                        <Button size="sm" variant="outline" className="gap-1" onClick={() => download(p)}>
                          <Download className="h-3.5 w-3.5"/> Download
                        </Button>
                      </div>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="border-t bg-muted/20 p-4 space-y-3">
                      {isAuthenticated ? (
                        <div className="flex gap-2">
                          <Textarea rows={2} placeholder="Share your thoughts…"
                            value={newComment[p.id] || ''}
                            onChange={(e) => setNewComment(s => ({ ...s, [p.id]: e.target.value }))}/>
                          <Button size="icon" onClick={() => submitComment(p)}><Send className="h-4 w-4"/></Button>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">Sign in to comment.</p>
                      )}
                      <div className="space-y-2 max-h-72 overflow-auto">
                        {(comments[p.id] || []).map(c => (
                          <div key={c.id} className="flex gap-2 text-sm">
                            <Avatar className="h-7 w-7">
                              {c.user_avatar && <AvatarImage src={c.user_avatar}/>}
                              <AvatarFallback className="text-xs">{c.user_name[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-xs">{c.user_name}</span>
                                <span className="text-[10px] text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</span>
                                {(user?.id === c.user_id || isAdmin) && (
                                  <button onClick={() => deleteComment(c.id, p.id)}
                                    title={isAdmin && user?.id !== c.user_id ? 'Moderate (delete)' : 'Delete'}
                                    className="ml-auto text-muted-foreground hover:text-destructive">
                                    <Trash2 className="h-3 w-3"/>
                                  </button>
                                )}
                              </div>
                              <p className="text-sm whitespace-pre-wrap break-words">{c.comment}</p>
                            </div>
                          </div>
                        ))}
                        {(comments[p.id]?.length ?? 0) === 0 &&
                          <p className="text-xs text-muted-foreground text-center py-4">Be the first to comment.</p>}
                      </div>
                    </div>
                  )}
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Podcasts;
