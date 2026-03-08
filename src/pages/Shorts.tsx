import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MessageCircle, Share2, Play, Pause, Volume2, VolumeX, Plus, Upload, Loader2, X, Send, ChevronUp, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Link } from 'react-router-dom';

interface Short {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  uploaded_by: string | null;
  view_count: number;
  like_count: number;
  published: boolean;
  created_at: string;
}

interface ShortComment {
  id: string;
  short_id: string;
  user_id: string;
  user_name: string;
  user_avatar: string | null;
  comment: string;
  created_at: string;
}

// ─── Upload Dialog (available to all authenticated users) ───
const UploadDialog: React.FC<{ open: boolean; onClose: () => void; onUploaded: () => void }> = ({ open, onClose, onUploaded }) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    if (!file || !title.trim() || !user) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('shorts').upload(path, file);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('shorts').getPublicUrl(path);

      const { error } = await supabase.from('shorts').insert({
        title: title.trim(),
        description: description.trim() || null,
        video_url: urlData.publicUrl,
        uploaded_by: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Admin',
        published: true,
      });
      if (error) throw error;
      toast.success('Short uploaded!');
      setTitle(''); setDescription(''); setFile(null);
      onUploaded();
      onClose();
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>Upload Short</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <Input placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} />
          <Textarea placeholder="Description (optional)" value={description} onChange={e => setDescription(e.target.value)} rows={2} />
          <Input type="file" accept="video/*" onChange={e => setFile(e.target.files?.[0] || null)} />
          <Button onClick={handleUpload} disabled={uploading || !file || !title.trim()} className="w-full">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
            Upload
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ─── Comments Sheet ───
const CommentsSheet: React.FC<{ shortId: string; open: boolean; onClose: () => void }> = ({ shortId, open, onClose }) => {
  const { user, isAuthenticated } = useAuth();
  const [comments, setComments] = useState<ShortComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase.from('short_comments').select('*').eq('short_id', shortId).order('created_at', { ascending: true });
      if (data) setComments(data as ShortComment[]);
      setLoading(false);
    };
    fetch();

    const channel = supabase.channel(`short-comments-${shortId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'short_comments', filter: `short_id=eq.${shortId}` }, (payload) => {
        setComments(prev => [...prev, payload.new as ShortComment]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [shortId, open]);

  const sendComment = async () => {
    if (!user || !newComment.trim()) return;
    const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
    await supabase.from('short_comments').insert({
      short_id: shortId, user_id: user.id, user_name: userName,
      user_avatar: user.user_metadata?.avatar_url || null, comment: newComment.trim(),
    });
    setNewComment('');
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[60vh] rounded-t-2xl">
        <SheetHeader><SheetTitle>Comments</SheetTitle></SheetHeader>
        <ScrollArea className="flex-1 h-[calc(100%-100px)] mt-2">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : comments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No comments yet</p>
          ) : (
            <div className="space-y-3 pr-4">
              {comments.map(c => (
                <div key={c.id} className="flex gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={c.user_avatar || ''} />
                    <AvatarFallback className="text-xs bg-primary/10">{c.user_name.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-semibold">{c.user_name}</span>
                      <span className="text-[10px] text-muted-foreground">{format(new Date(c.created_at), 'MMM d, h:mm a')}</span>
                    </div>
                    <p className="text-sm">{c.comment}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        {isAuthenticated && (
          <div className="flex gap-2 pt-2 border-t border-border mt-2">
            <Input placeholder="Add a comment..." value={newComment} onChange={e => setNewComment(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendComment()} className="flex-1" />
            <Button size="icon" onClick={sendComment} disabled={!newComment.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

// ─── Single Short Card ───
const ShortCard: React.FC<{ short: Short; isActive: boolean }> = ({ short, isActive }) => {
  const { user, isAuthenticated } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(short.like_count);
  const [commentsOpen, setCommentsOpen] = useState(false);

  useEffect(() => {
    if (!videoRef.current) return;
    if (isActive) {
      videoRef.current.play().then(() => setPlaying(true)).catch(() => {});
    } else {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      setPlaying(false);
    }
  }, [isActive]);

  useEffect(() => {
    if (!user) return;
    supabase.from('short_likes').select('id').eq('short_id', short.id).eq('user_id', user.id).maybeSingle()
      .then(({ data }) => { if (data) setLiked(true); });
  }, [user, short.id]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (playing) { videoRef.current.pause(); } else { videoRef.current.play(); }
    setPlaying(!playing);
  };

  const toggleLike = async () => {
    if (!user || !isAuthenticated) { toast.error('Sign in to like'); return; }
    if (liked) {
      await supabase.from('short_likes').delete().eq('short_id', short.id).eq('user_id', user.id);
      setLiked(false);
      setLikeCount(c => c - 1);
    } else {
      await supabase.from('short_likes').insert({ short_id: short.id, user_id: user.id });
      setLiked(true);
      setLikeCount(c => c + 1);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({ title: short.title, url: window.location.href });
    } catch {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied!');
    }
  };

  return (
    <div className="relative h-full w-full snap-start snap-always bg-black flex items-center justify-center">
      <video
        ref={videoRef}
        src={short.video_url}
        className="h-full w-full object-contain"
        loop
        muted={muted}
        playsInline
        onClick={togglePlay}
      />

      {/* Play/Pause overlay */}
      <AnimatePresence>
        {!playing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
            <Play className="h-16 w-16 text-white/80" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Right sidebar actions */}
      <div className="absolute right-3 bottom-24 flex flex-col items-center gap-5">
        <button onClick={toggleLike} className="flex flex-col items-center gap-1">
          <Heart className={cn('h-7 w-7 transition-colors', liked ? 'fill-red-500 text-red-500' : 'text-white')} />
          <span className="text-white text-xs font-semibold">{likeCount}</span>
        </button>
        <button onClick={() => setCommentsOpen(true)} className="flex flex-col items-center gap-1">
          <MessageCircle className="h-7 w-7 text-white" />
          <span className="text-white text-xs font-semibold">Comments</span>
        </button>
        <button onClick={handleShare} className="flex flex-col items-center gap-1">
          <Share2 className="h-7 w-7 text-white" />
          <span className="text-white text-xs font-semibold">Share</span>
        </button>
        <button onClick={() => setMuted(!muted)} className="flex flex-col items-center gap-1">
          {muted ? <VolumeX className="h-6 w-6 text-white" /> : <Volume2 className="h-6 w-6 text-white" />}
        </button>
      </div>

      {/* Bottom info */}
      <div className="absolute left-4 bottom-8 right-16">
        <p className="text-white font-bold text-lg drop-shadow-lg">{short.title}</p>
        {short.description && (
          <p className="text-white/80 text-sm mt-1 line-clamp-2 drop-shadow">{short.description}</p>
        )}
        {short.uploaded_by && (
          <p className="text-white/60 text-xs mt-1">@{short.uploaded_by}</p>
        )}
      </div>

      <CommentsSheet shortId={short.id} open={commentsOpen} onClose={() => setCommentsOpen(false)} />
    </div>
  );
};

// ─── Main Shorts Page ───
const Shorts: React.FC = () => {
  const { user } = useAuth();
  const [shorts, setShorts] = useState<Short[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showUpload, setShowUpload] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetchShorts();
    if (user) {
      supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' }).then(({ data }) => {
        if (data) setIsAdmin(true);
      });
    }
  }, [user]);

  const fetchShorts = async () => {
    setLoading(true);
    const { data } = await supabase.from('shorts').select('*').eq('published', true).order('created_at', { ascending: false });
    if (data) setShorts(data as Short[]);
    setLoading(false);
  };

  const handleScroll = () => {
    if (!containerRef.current) return;
    const scrollTop = containerRef.current.scrollTop;
    const height = containerRef.current.clientHeight;
    const newIndex = Math.round(scrollTop / height);
    if (newIndex !== activeIndex) setActiveIndex(newIndex);
  };

  const scrollTo = (direction: 'up' | 'down') => {
    if (!containerRef.current) return;
    const height = containerRef.current.clientHeight;
    const newIndex = direction === 'up' ? Math.max(0, activeIndex - 1) : Math.min(shorts.length - 1, activeIndex + 1);
    containerRef.current.scrollTo({ top: newIndex * height, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-black">
        <Loader2 className="h-10 w-10 animate-spin text-white" />
      </div>
    );
  }

  if (shorts.length === 0) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-black text-white gap-4">
        <Play className="h-16 w-16 opacity-50" />
        <p className="text-lg">No shorts yet</p>
        {isAdmin && (
          <Button onClick={() => setShowUpload(true)} variant="secondary">
            <Plus className="h-4 w-4 mr-2" /> Upload First Short
          </Button>
        )}
        <AdminUploadDialog open={showUpload} onClose={() => setShowUpload(false)} onUploaded={fetchShorts} />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)] relative bg-black">
      {/* Admin upload button */}
      {isAdmin && (
        <Button
          onClick={() => setShowUpload(true)}
          size="icon"
          className="absolute top-4 right-4 z-30 rounded-full bg-white/20 hover:bg-white/30 text-white"
        >
          <Plus className="h-5 w-5" />
        </Button>
      )}

      {/* Navigation arrows (desktop) */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 hidden md:flex flex-col gap-2">
        <Button variant="ghost" size="icon" onClick={() => scrollTo('up')} disabled={activeIndex === 0}
          className="rounded-full bg-white/10 text-white hover:bg-white/20">
          <ChevronUp className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => scrollTo('down')} disabled={activeIndex === shorts.length - 1}
          className="rounded-full bg-white/10 text-white hover:bg-white/20">
          <ChevronDown className="h-5 w-5" />
        </Button>
      </div>

      {/* Video feed */}
      <div
        ref={containerRef}
        className="h-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
        onScroll={handleScroll}
        style={{ scrollbarWidth: 'none' }}
      >
        {shorts.map((short, i) => (
          <div key={short.id} className="h-full w-full">
            <ShortCard short={short} isActive={i === activeIndex} />
          </div>
        ))}
      </div>

      <AdminUploadDialog open={showUpload} onClose={() => setShowUpload(false)} onUploaded={fetchShorts} />
    </div>
  );
};

export default Shorts;
