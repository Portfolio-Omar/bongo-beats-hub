import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MessageCircle, Share2, Play, Volume2, VolumeX, Plus, Upload, Loader2, Send, ChevronUp, ChevronDown, Download, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import logoImg from '@/assets/logo.png';

interface Short {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  uploaded_by: string | null;
  view_count: number;
  like_count: number;
  comment_count: number;
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

// ─── Upload Dialog ───
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
        uploaded_by: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
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
  const [viewCount, setViewCount] = useState(short.view_count);
  const [commentCount] = useState(short.comment_count || 0);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [showWatermark, setShowWatermark] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showDoubleTapHeart, setShowDoubleTapHeart] = useState(false);
  const [heartPosition, setHeartPosition] = useState({ x: 0, y: 0 });
  const lastTapRef = useRef(0);
  const viewTracked = useRef(false);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const [swipeHint, setSwipeHint] = useState<'left' | 'right' | null>(null);
  const logoImgRef = useRef<HTMLImageElement | null>(null);

  // Preload logo image for canvas watermark
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = logoImg;
    img.onload = () => { logoImgRef.current = img; };
  }, []);

  // Track view when video becomes active
  useEffect(() => {
    if (!videoRef.current) return;
    if (isActive) {
      videoRef.current.play().then(() => setPlaying(true)).catch(() => {});
      // Track view once per activation
      if (!viewTracked.current) {
        viewTracked.current = true;
        supabase.rpc('increment_short_view', { _short_id: short.id }).then(() => {
          setViewCount(c => c + 1);
        });
      }
    } else {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      setPlaying(false);
      setShowWatermark(false);
      viewTracked.current = false;
    }
  }, [isActive, short.id]);

  // Progress bar + watermark near end
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const handleTimeUpdate = () => {
      if (video.duration) {
        setProgress((video.currentTime / video.duration) * 100);
        setShowWatermark(video.currentTime >= video.duration - 3);
      }
    };
    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, []);

  useEffect(() => {
    if (!user) return;
    supabase.from('short_likes').select('id').eq('short_id', short.id).eq('user_id', user.id).maybeSingle()
      .then(({ data }) => { if (data) setLiked(true); });
  }, [user, short.id]);

  const handleVideoTap = (e: React.MouseEvent) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Double tap — like + heart animation
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setHeartPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      setShowDoubleTapHeart(true);
      setTimeout(() => setShowDoubleTapHeart(false), 900);

      if (!liked && user && isAuthenticated) {
        supabase.from('short_likes').insert({ short_id: short.id, user_id: user.id });
        setLiked(true);
        setLikeCount(c => c + 1);
      }
      lastTapRef.current = 0;
    } else {
      // Single tap — toggle play after delay
      lastTapRef.current = now;
      setTimeout(() => {
        if (lastTapRef.current === now) {
          if (!videoRef.current) return;
          if (playing) { videoRef.current.pause(); } else { videoRef.current.play(); }
          setPlaying(!playing);
        }
      }, DOUBLE_TAP_DELAY);
    }
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

  const handleDownload = async () => {
    try {
      toast.info('Preparing watermarked download...');

      // Create an offscreen video to capture a frame with watermark
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.src = short.video_url;
      video.muted = true;

      await new Promise<void>((resolve, reject) => {
        video.onloadeddata = () => resolve();
        video.onerror = () => reject(new Error('Video load failed'));
        video.load();
      });

      // Use MediaRecorder to record the video with watermark overlay
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 720;
      canvas.height = video.videoHeight || 1280;
      const ctx = canvas.getContext('2d')!;

      const stream = canvas.captureStream(30);
      // Also capture audio from the video
      let combinedStream = stream;
      try {
        const audioCtx = new AudioContext();
        const source = audioCtx.createMediaElementSource(video);
        const dest = audioCtx.createMediaStreamDestination();
        source.connect(dest);
        source.connect(audioCtx.destination);
        const audioTrack = dest.stream.getAudioTracks()[0];
        if (audioTrack) {
          combinedStream = new MediaStream([...stream.getVideoTracks(), audioTrack]);
        }
      } catch {
        // Audio capture may fail, continue without
      }

      const recorder = new MediaRecorder(combinedStream, { mimeType: 'video/webm' });
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };

      const downloadPromise = new Promise<void>((resolve) => {
        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'video/webm' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${short.title.replace(/[^a-z0-9]/gi, '_')}_bongo_oldskool.webm`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          resolve();
        };
      });

      recorder.start();
      video.currentTime = 0;
      await video.play();

      const drawFrame = () => {
        if (video.ended || video.paused) {
          recorder.stop();
          return;
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Draw persistent watermark (top-left)
        const logoSize = Math.round(canvas.width * 0.06);
        if (logoImgRef.current) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(20 + logoSize / 2, 20 + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(logoImgRef.current, 20, 20, logoSize, logoSize);
          ctx.restore();
        }
        ctx.font = `bold ${Math.round(canvas.width * 0.028)}px sans-serif`;
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.fillText('Bongo Old Skool', 20 + logoSize + 8, 20 + logoSize / 2 + 4);
        ctx.font = `${Math.round(canvas.width * 0.02)}px sans-serif`;
        ctx.fillText('oldskoool.netlify.app', 20 + logoSize + 8, 20 + logoSize / 2 + 20);

        // Draw bottom-center watermark
        const bottomText = 'Bongo Old Skool • oldskoool.netlify.app';
        ctx.font = `bold ${Math.round(canvas.width * 0.03)}px sans-serif`;
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        const metrics = ctx.measureText(bottomText);
        ctx.fillText(bottomText, (canvas.width - metrics.width) / 2, canvas.height - 30);

        requestAnimationFrame(drawFrame);
      };

      drawFrame();

      video.onended = () => {
        recorder.stop();
      };

      await downloadPromise;
      toast.success('Download complete!');
    } catch {
      // Fallback to plain download
      try {
        const response = await fetch(short.video_url);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${short.title.replace(/[^a-z0-9]/gi, '_')}.mp4`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('Download started (without watermark)');
      } catch {
        toast.error('Download failed');
      }
    }
  };

  // Swipe gesture handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    const dt = Date.now() - touchStartRef.current.time;
    touchStartRef.current = null;
    setSwipeHint(null);

    // Must be primarily horizontal, fast enough, and far enough
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5 && dt < 500) {
      if (dx < 0) {
        // Swipe left → share
        handleShare();
      } else {
        // Swipe right → comments
        setCommentsOpen(true);
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.touches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    if (Math.abs(dx) > 30) {
      setSwipeHint(dx < 0 ? 'left' : 'right');
    } else {
      setSwipeHint(null);
    }
  };

  const formatCount = (n: number) => {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toString();
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
        onClick={handleVideoTap}
      />

      {/* Double-tap heart animation */}
      <AnimatePresence>
        {showDoubleTapHeart && (
          <motion.div
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 1.5, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="absolute pointer-events-none z-30"
            style={{ left: heartPosition.x - 40, top: heartPosition.y - 40 }}
          >
            <Heart className="h-20 w-20 fill-red-500 text-red-500 drop-shadow-lg" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Play/Pause overlay */}
      <AnimatePresence>
        {!playing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
            <Play className="h-16 w-16 text-white/80" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Watermark at end of video */}
      <AnimatePresence>
        {showWatermark && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10"
          >
            <div className="bg-black/60 backdrop-blur-sm rounded-2xl p-6 flex flex-col items-center gap-3">
              <img src={logoImg} alt="Bongo Old Skool" className="h-16 w-16 rounded-full object-cover" />
              <span className="text-white font-bold text-xl tracking-wide">Bongo Old Skool</span>
              <a href="https://oldskoool.netlify.app" target="_blank" rel="noopener noreferrer" className="text-blue-400 text-xs hover:underline">oldskoool.netlify.app</a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Persistent small watermark */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 opacity-50">
        <a href="https://oldskoool.netlify.app" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
          <img src={logoImg} alt="" className="h-6 w-6 rounded-full object-cover" />
          <span className="text-white text-xs font-semibold drop-shadow">Bongo Old Skool</span>
        </a>
      </div>

      {/* Right sidebar actions */}
      <div className="absolute right-3 bottom-28 flex flex-col items-center gap-5">
        <button onClick={toggleLike} className="flex flex-col items-center gap-1">
          <Heart className={cn('h-7 w-7 transition-colors', liked ? 'fill-red-500 text-red-500' : 'text-white')} />
          <span className="text-white text-xs font-semibold">{formatCount(likeCount)}</span>
        </button>
        <button onClick={() => setCommentsOpen(true)} className="flex flex-col items-center gap-1">
          <MessageCircle className="h-7 w-7 text-white" />
          <span className="text-white text-xs font-semibold">{formatCount(commentCount)}</span>
        </button>
        <button onClick={handleShare} className="flex flex-col items-center gap-1">
          <Share2 className="h-7 w-7 text-white" />
          <span className="text-white text-xs font-semibold">Share</span>
        </button>
        <button onClick={handleDownload} className="flex flex-col items-center gap-1">
          <Download className="h-7 w-7 text-white" />
          <span className="text-white text-xs font-semibold">Save</span>
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
        <div className="flex items-center gap-3 mt-1">
          {short.uploaded_by && (
            <span className="text-white/60 text-xs">@{short.uploaded_by}</span>
          )}
          <span className="text-white/50 text-xs flex items-center gap-1">
            <Eye className="h-3 w-3" /> {formatCount(viewCount)}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-20">
        <div className="h-full bg-primary transition-[width] duration-200 ease-linear" style={{ width: `${progress}%` }} />
      </div>

      <CommentsSheet shortId={short.id} open={commentsOpen} onClose={() => setCommentsOpen(false)} />
    </div>
  );
};

// ─── Main Shorts Page ───
const Shorts: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [shorts, setShorts] = useState<Short[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showUpload, setShowUpload] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { fetchShorts(); }, [user]);

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
        {isAuthenticated && (
          <Button onClick={() => setShowUpload(true)} variant="secondary">
            <Plus className="h-4 w-4 mr-2" /> Upload First Short
          </Button>
        )}
        <UploadDialog open={showUpload} onClose={() => setShowUpload(false)} onUploaded={fetchShorts} />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)] relative bg-black">
      {isAuthenticated && (
        <Button onClick={() => setShowUpload(true)} size="icon"
          className="absolute top-4 right-4 z-30 rounded-full bg-white/20 hover:bg-white/30 text-white">
          <Plus className="h-5 w-5" />
        </Button>
      )}

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

      <div ref={containerRef} className="h-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
        onScroll={handleScroll} style={{ scrollbarWidth: 'none' }}>
        {shorts.map((short, i) => (
          <div key={short.id} className="h-full w-full">
            <ShortCard short={short} isActive={i === activeIndex} />
          </div>
        ))}
      </div>

      <UploadDialog open={showUpload} onClose={() => setShowUpload(false)} onUploaded={fetchShorts} />
    </div>
  );
};

export default Shorts;
