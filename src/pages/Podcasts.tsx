import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import {
  Play, Pause, Heart, MessageSquare, Share2, Download,
  Radio, Clock, Search, Send, Trash2,
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

const Podcasts: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [newComment, setNewComment] = useState<Record<string, string>>({});
  const [likes, setLikes] = useState<Record<string, boolean>>({});
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});
  const audioRefs = React.useRef<Record<string, HTMLAudioElement | null>>({});

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any).from('podcasts').select('*')
        .eq('published', true).order('created_at', { ascending: false });
      setPodcasts((data as Podcast[]) || []);
      setLoading(false);
      if (user) {
        const { data: liked } = await (supabase as any).from('podcast_likes')
          .select('podcast_id').eq('user_id', user.id);
        if (liked) setLikes(Object.fromEntries(liked.map((l: any) => [l.podcast_id, true])));
      }
    })();
  }, [user]);

  const loadComments = async (id: string) => {
    const { data } = await (supabase as any).from('podcast_comments')
      .select('*').eq('podcast_id', id).order('created_at', { ascending: false });
    setComments(c => ({ ...c, [id]: (data as Comment[]) || [] }));
  };

  const togglePlay = async (p: Podcast) => {
    const el = audioRefs.current[p.id];
    if (!el) return;
    Object.entries(audioRefs.current).forEach(([id, a]) => { if (id !== p.id && a) { a.pause(); } });
    if (el.paused) {
      await el.play().catch(() => {});
      setActiveId(p.id);
      await (supabase as any).rpc('increment_podcast_view', { _id: p.id });
      setPodcasts(ps => ps.map(x => x.id === p.id ? { ...x, view_count: x.view_count + 1 } : x));
    } else {
      el.pause();
      setActiveId(null);
    }
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
        toast.success('Link copied');
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
    await (supabase as any).from('podcast_comments').delete().eq('id', id);
    setComments(c => ({ ...c, [podcastId]: (c[podcastId] || []).filter(x => x.id !== id) }));
    setPodcasts(ps => ps.map(x => x.id === podcastId ? { ...x, comment_count: Math.max(0, x.comment_count - 1) } : x));
  };

  const filtered = podcasts.filter(p =>
    !search || p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase()));

  useEffect(() => {
    document.title = 'Podcasts — Bongo Old Skool';
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">

      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-4xl md:text-5xl font-heading bg-gradient-to-r from-gold to-yellow-600 bg-clip-text text-transparent mb-2">
          Bongo Podcasts
        </h1>
        <p className="text-muted-foreground">Stories, interviews & throwback discussions from the golden era of Bongo Flava.</p>
      </motion.div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
        <Input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search episodes…" className="pl-9"/>
      </div>

      {loading ? <p className="text-center text-muted-foreground py-12">Loading…</p>
        : filtered.length === 0 ? (
          <Card className="p-12 text-center">
            <Radio className="h-12 w-12 mx-auto text-muted-foreground mb-3"/>
            <p className="text-muted-foreground">No podcasts published yet. Check back soon!</p>
          </Card>
        ) : (
        <div className="space-y-4">
          {filtered.map((p, i) => {
            const isActive = activeId === p.id;
            const isOpen = openComments[p.id];
            return (
              <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}>
                <Card className="overflow-hidden">
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
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3"/>{fmt(p.duration_seconds || 0)}</span>
                        <span>{p.view_count} plays</span>
                        {p.tags && p.tags.length > 0 && p.tags.slice(0, 3).map(t =>
                          <Badge key={t} variant="secondary" className="text-[10px]">#{t}</Badge>)}
                      </div>

                      <audio ref={el => (audioRefs.current[p.id] = el)} src={p.audio_url}
                        controls preload="none" className="w-full h-10"
                        onEnded={() => setActiveId(null)}/>

                      <div className="flex flex-wrap gap-2 mt-3">
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
                                {user?.id === c.user_id && (
                                  <button onClick={() => deleteComment(c.id, p.id)} className="ml-auto text-muted-foreground hover:text-destructive">
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
