import React, { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Upload, Music, Play, Pause, Volume2, VolumeX, Loader2, 
  Image as ImageIcon, Video, Scissors, Search, Check, X, Eye,
  Type, Palette, Sparkles, RotateCcw, FlipHorizontal, Crop,
  ZoomIn, Sun, Contrast, SlidersHorizontal
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { sendEmail } from '@/lib/send-email';

interface Song {
  id: string;
  title: string;
  artist: string;
  audio_url: string;
  cover_url: string | null;
}

interface TextOverlay {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  fontFamily: string;
}

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const MAX_DURATION = 60;

const FILTERS = [
  { name: 'None', value: 'none', css: '' },
  { name: 'Warm', value: 'warm', css: 'sepia(0.3) saturate(1.4) brightness(1.1)' },
  { name: 'Cool', value: 'cool', css: 'saturate(0.8) hue-rotate(20deg) brightness(1.05)' },
  { name: 'Vintage', value: 'vintage', css: 'sepia(0.5) contrast(1.1) brightness(0.9)' },
  { name: 'B&W', value: 'bw', css: 'grayscale(1) contrast(1.2)' },
  { name: 'Vivid', value: 'vivid', css: 'saturate(1.8) contrast(1.1)' },
  { name: 'Fade', value: 'fade', css: 'saturate(0.6) brightness(1.2) contrast(0.9)' },
  { name: 'Drama', value: 'drama', css: 'contrast(1.4) saturate(1.2) brightness(0.95)' },
];

const FONT_FAMILIES = ['Arial', 'Georgia', 'Impact', 'Courier New', 'Comic Sans MS'];
const TEXT_COLORS = ['#ffffff', '#000000', '#ff0000', '#ffff00', '#00ff00', '#00bfff', '#ff69b4', '#ffa500'];

const CreateShort: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Media state
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string>('');
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [mediaDuration, setMediaDuration] = useState(0);

  // Video trimming
  const [trimStart, setTrimStart] = useState([0]);
  const [trimEnd, setTrimEnd] = useState([60]);
  const [videoDurationRaw, setVideoDurationRaw] = useState(0);

  // Filters & adjustments
  const [selectedFilter, setSelectedFilter] = useState('none');
  const [brightness, setBrightness] = useState([100]);
  const [contrast, setContrast] = useState([100]);
  const [saturation, setSaturation] = useState([100]);

  // Text overlays
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  const [newText, setNewText] = useState('');
  const [textColor, setTextColor] = useState('#ffffff');
  const [textFontSize, setTextFontSize] = useState([32]);
  const [textFont, setTextFont] = useState('Arial');

  // Flip/rotate
  const [flipH, setFlipH] = useState(false);
  const [rotation, setRotation] = useState(0);

  // Audio state
  const [songs, setSongs] = useState<Song[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [muteOriginal, setMuteOriginal] = useState(true);
  const [audioVolume, setAudioVolume] = useState([80]);
  const [audioStart, setAudioStart] = useState([0]);

  // Publishing state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Fetch songs
  useEffect(() => {
    const fetchSongs = async () => {
      const { data } = await supabase
        .from('songs')
        .select('id, title, artist, audio_url, cover_url')
        .eq('published', true)
        .order('title');
      if (data) setSongs(data);
    };
    fetchSongs();
  }, []);

  const filteredSongs = songs.filter(s =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.artist.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle media file selection
  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast.error('File too large. Maximum 20MB allowed.');
      return;
    }

    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');

    if (!isVideo && !isImage) {
      toast.error('Please upload an image or video file.');
      return;
    }

    setMediaFile(file);
    setMediaType(isVideo ? 'video' : 'image');
    setMediaPreview(URL.createObjectURL(file));

    if (isVideo) {
      const video = document.createElement('video');
      video.src = URL.createObjectURL(file);
      video.onloadedmetadata = () => {
        if (video.duration > MAX_DURATION) {
          toast.error('Video must be 1 minute or less.');
          setMediaFile(null);
          setMediaPreview('');
          setMediaType(null);
          return;
        }
        setMediaDuration(video.duration);
        setVideoDurationRaw(video.duration);
        setTrimStart([0]);
        setTrimEnd([Math.floor(video.duration)]);
      };
    } else {
      setMediaDuration(15);
      setVideoDurationRaw(0);
    }
  };

  // Play/pause audio preview
  const toggleAudioPreview = () => {
    if (!audioRef.current) return;
    if (audioPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.currentTime = audioStart[0];
      audioRef.current.play();
    }
    setAudioPlaying(!audioPlaying);
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = audioVolume[0] / 100;
    }
  }, [audioVolume]);

  // Get combined CSS filter string
  const getCombinedFilter = useCallback(() => {
    const filterObj = FILTERS.find(f => f.value === selectedFilter);
    const base = filterObj?.css || '';
    const adjustments = `brightness(${brightness[0] / 100}) contrast(${contrast[0] / 100}) saturate(${saturation[0] / 100})`;
    return `${base} ${adjustments}`.trim();
  }, [selectedFilter, brightness, contrast, saturation]);

  // Get transform string
  const getTransform = useCallback(() => {
    const parts: string[] = [];
    if (flipH) parts.push('scaleX(-1)');
    if (rotation) parts.push(`rotate(${rotation}deg)`);
    return parts.join(' ') || 'none';
  }, [flipH, rotation]);

  // Add text overlay
  const addTextOverlay = () => {
    if (!newText.trim()) return;
    setTextOverlays(prev => [...prev, {
      id: Date.now().toString(),
      text: newText.trim(),
      x: 50, y: 50,
      fontSize: textFontSize[0],
      color: textColor,
      fontFamily: textFont,
    }]);
    setNewText('');
  };

  const removeTextOverlay = (id: string) => {
    setTextOverlays(prev => prev.filter(t => t.id !== id));
  };

  // Toggle preview mode
  const handlePreview = () => {
    setPreviewMode(!previewMode);
    if (!previewMode) {
      if (videoRef.current) {
        videoRef.current.currentTime = trimStart[0];
        videoRef.current.muted = muteOriginal;
        videoRef.current.play();
      }
      if (audioRef.current && selectedSong) {
        audioRef.current.currentTime = audioStart[0];
        audioRef.current.volume = audioVolume[0] / 100;
        audioRef.current.play();
        setAudioPlaying(true);
      }
    } else {
      if (videoRef.current) videoRef.current.pause();
      if (audioRef.current) { audioRef.current.pause(); setAudioPlaying(false); }
    }
  };

  // Enforce trim end during preview
  useEffect(() => {
    const video = videoRef.current;
    if (!video || mediaType !== 'video') return;
    const handleTime = () => {
      if (video.currentTime >= trimEnd[0]) {
        video.pause();
        video.currentTime = trimStart[0];
      }
    };
    video.addEventListener('timeupdate', handleTime);
    return () => video.removeEventListener('timeupdate', handleTime);
  }, [trimEnd, trimStart, mediaType]);

  // Publish short
  const handlePublish = async () => {
    if (!mediaFile || !title.trim() || !user) {
      toast.error('Please add media and a title');
      return;
    }

    setPublishing(true);
    try {
      const ext = mediaFile.name.split('.').pop();
      const path = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('shorts').upload(path, mediaFile);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('shorts').getPublicUrl(path);
      const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';

      let finalVideoUrl = urlData.publicUrl;

      if (mediaType === 'image' && selectedSong) {
        toast.info('Creating video from image and audio...');
        finalVideoUrl = await createVideoFromImage(urlData.publicUrl, selectedSong.audio_url);
      }

      const { error } = await supabase.from('shorts').insert({
        title: title.trim(),
        description: description.trim() || null,
        video_url: finalVideoUrl,
        uploaded_by: userName,
        published: true,
      });
      if (error) throw error;

      sendEmail('short_published', user.email, { name: userName, title: title.trim() });
      sendEmail('admin_new_short', undefined, { uploader: userName, title: title.trim(), email: user.email });

      toast.success('Short published successfully!');
      navigate('/shorts');
    } catch (err) {
      console.error('Publish error:', err);
      toast.error('Failed to publish short');
    } finally {
      setPublishing(false);
    }
  };

  const createVideoFromImage = async (imageUrl: string, audioUrl: string): Promise<string> => {
    return new Promise(async (resolve, reject) => {
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = imageUrl;
        await new Promise<void>((r, rj) => { img.onload = () => r(); img.onerror = () => rj(new Error('Image load failed')); });

        const canvas = document.createElement('canvas');
        canvas.width = 720;
        canvas.height = 1280;
        const ctx = canvas.getContext('2d')!;

        const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
        const x = (canvas.width - img.width * scale) / 2;
        const y = (canvas.height - img.height * scale) / 2;

        const audio = new Audio(audioUrl);
        audio.crossOrigin = 'anonymous';
        audio.volume = audioVolume[0] / 100;
        await new Promise<void>((r) => { audio.oncanplaythrough = () => r(); audio.load(); });

        const canvasStream = canvas.captureStream(30);
        let combinedStream: MediaStream = canvasStream;

        try {
          const audioCtx = new AudioContext();
          const source = audioCtx.createMediaElementSource(audio);
          const dest = audioCtx.createMediaStreamDestination();
          source.connect(dest);
          source.connect(audioCtx.destination);
          combinedStream = new MediaStream([
            ...canvasStream.getVideoTracks(),
            ...dest.stream.getAudioTracks()
          ]);
        } catch { /* audio capture may fail */ }

        const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
          ? 'video/webm;codecs=vp8,opus' : 'video/webm';
        const recorder = new MediaRecorder(combinedStream, { mimeType });
        const chunks: Blob[] = [];
        recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };

        recorder.onstop = async () => {
          const blob = new Blob(chunks, { type: 'video/webm' });
          const file = new File([blob], `short_${Date.now()}.webm`, { type: 'video/webm' });
          const uploadPath = `created_${Date.now()}.webm`;
          const { error } = await supabase.storage.from('shorts').upload(uploadPath, file);
          if (error) { reject(error); return; }
          const { data } = supabase.storage.from('shorts').getPublicUrl(uploadPath);
          resolve(data.publicUrl);
        };

        recorder.start();
        audio.currentTime = audioStart[0];
        audio.play();

        const duration = Math.min(mediaDuration || 15, MAX_DURATION) * 1000;
        const startTime = Date.now();

        const drawFrame = () => {
          const elapsed = Date.now() - startTime;
          if (elapsed >= duration) {
            audio.pause();
            if (recorder.state === 'recording') recorder.stop();
            return;
          }
          ctx.save();
          ctx.fillStyle = '#000';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Apply filter via canvas filter property
          ctx.filter = getCombinedFilter();
          
          // Apply transforms
          ctx.translate(canvas.width / 2, canvas.height / 2);
          if (flipH) ctx.scale(-1, 1);
          if (rotation) ctx.rotate((rotation * Math.PI) / 180);
          ctx.translate(-canvas.width / 2, -canvas.height / 2);
          
          ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
          ctx.restore();

          // Draw text overlays
          textOverlays.forEach(overlay => {
            ctx.save();
            ctx.font = `bold ${overlay.fontSize}px ${overlay.fontFamily}`;
            ctx.fillStyle = overlay.color;
            ctx.textAlign = 'center';
            ctx.shadowColor = 'rgba(0,0,0,0.7)';
            ctx.shadowBlur = 4;
            ctx.fillText(overlay.text, (overlay.x / 100) * canvas.width, (overlay.y / 100) * canvas.height);
            ctx.restore();
          });

          requestAnimationFrame(drawFrame);
        };
        drawFrame();
      } catch (err) {
        reject(err);
      }
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="container py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Sign In Required</h1>
        <p className="text-muted-foreground mb-4">You need to sign in to create shorts.</p>
        <Button onClick={() => navigate('/auth')}>Sign In</Button>
      </div>
    );
  }

  return (
    <div className="container max-w-5xl py-6 sm:py-12">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
        🎬 Create Short
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Media & Preview */}
        <div className="space-y-4">
          {/* Media upload */}
          <div className="bg-card border border-border rounded-xl p-4 space-y-4">
            <h2 className="font-semibold flex items-center gap-2">
              {mediaType === 'video' ? <Video className="h-4 w-4 text-primary" /> : <ImageIcon className="h-4 w-4 text-primary" />}
              Upload Media
            </h2>
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
              <Input type="file" accept="image/*,video/*" onChange={handleMediaSelect} className="hidden" id="media-upload" />
              <label htmlFor="media-upload" className="cursor-pointer space-y-2 block">
                <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Upload image or video (max 20MB, 1 min)</p>
                {mediaFile && (
                  <Badge variant="secondary" className="mt-2">
                    {mediaFile.name} ({(mediaFile.size / (1024 * 1024)).toFixed(1)}MB)
                  </Badge>
                )}
              </label>
            </div>
          </div>

          {/* Preview */}
          {mediaPreview && (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="aspect-[9/16] relative bg-black max-h-[450px] mx-auto overflow-hidden">
                <div style={{ filter: getCombinedFilter(), transform: getTransform() }} className="w-full h-full">
                  {mediaType === 'video' ? (
                    <video ref={videoRef} src={mediaPreview} className="w-full h-full object-contain" loop muted={muteOriginal} playsInline />
                  ) : (
                    <img src={mediaPreview} className="w-full h-full object-contain" alt="Preview" />
                  )}
                </div>

                {/* Text overlays on preview */}
                {textOverlays.map(overlay => (
                  <div
                    key={overlay.id}
                    className="absolute pointer-events-none"
                    style={{
                      left: `${overlay.x}%`, top: `${overlay.y}%`,
                      transform: 'translate(-50%, -50%)',
                      fontSize: `${overlay.fontSize * 0.5}px`,
                      color: overlay.color,
                      fontFamily: overlay.fontFamily,
                      fontWeight: 'bold',
                      textShadow: '2px 2px 4px rgba(0,0,0,0.7)',
                    }}
                  >
                    {overlay.text}
                  </div>
                ))}

                {/* Preview controls */}
                <div className="absolute bottom-2 left-2 right-2 flex justify-between">
                  <Button size="sm" variant="secondary" className="bg-black/50 text-white" onClick={handlePreview}>
                    {previewMode ? <Pause className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
                    {previewMode ? 'Stop' : 'Preview'}
                  </Button>
                  {mediaType === 'video' && (
                    <Button size="sm" variant="secondary" className="bg-black/50 text-white" onClick={() => setMuteOriginal(!muteOriginal)}>
                      {muteOriginal ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Tools & Details */}
        <div className="space-y-4">
          <Tabs defaultValue="audio" className="w-full">
            <TabsList className="w-full grid grid-cols-4">
              <TabsTrigger value="audio" className="text-xs gap-1"><Music className="h-3 w-3" /> Audio</TabsTrigger>
              <TabsTrigger value="edit" className="text-xs gap-1"><SlidersHorizontal className="h-3 w-3" /> Edit</TabsTrigger>
              <TabsTrigger value="text" className="text-xs gap-1"><Type className="h-3 w-3" /> Text</TabsTrigger>
              <TabsTrigger value="filters" className="text-xs gap-1"><Sparkles className="h-3 w-3" /> Filters</TabsTrigger>
            </TabsList>

            {/* Audio Tab */}
            <TabsContent value="audio" className="space-y-4">
              <div className="bg-card border border-border rounded-xl p-4 space-y-4">
                {selectedSong ? (
                  <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
                    <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Music className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{selectedSong.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{selectedSong.artist}</p>
                    </div>
                    <Button size="icon" variant="ghost" onClick={toggleAudioPreview}>
                      {audioPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => { setSelectedSong(null); if (audioRef.current) audioRef.current.pause(); setAudioPlaying(false); }}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : null}

                {selectedSong && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Volume</label>
                      <Slider value={audioVolume} onValueChange={setAudioVolume} max={100} step={1} />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Start at ({audioStart[0]}s)</label>
                      <Slider value={audioStart} onValueChange={setAudioStart} max={180} step={1} />
                    </div>
                  </div>
                )}

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search songs..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" />
                </div>

                <ScrollArea className="h-48">
                  <div className="space-y-1">
                    {filteredSongs.slice(0, 50).map(song => (
                      <button
                        key={song.id}
                        onClick={() => { setSelectedSong(song); setAudioPlaying(false); }}
                        className={`w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors hover:bg-muted/50 ${
                          selectedSong?.id === song.id ? 'bg-primary/10 border border-primary/20' : ''
                        }`}
                      >
                        <div className="w-8 h-8 rounded bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {song.cover_url ? (
                            <img src={song.cover_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Music className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{song.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{song.artist}</p>
                        </div>
                        {selectedSong?.id === song.id && <Check className="h-4 w-4 text-primary flex-shrink-0" />}
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </TabsContent>

            {/* Edit Tab - Trimming, Adjustments, Transform */}
            <TabsContent value="edit" className="space-y-4">
              {/* Video Trimming */}
              {mediaType === 'video' && videoDurationRaw > 0 && (
                <div className="bg-card border border-border rounded-xl p-4 space-y-3">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <Scissors className="h-4 w-4 text-primary" /> Trim Video
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs text-muted-foreground">Start: {trimStart[0].toFixed(1)}s</label>
                      <Slider value={trimStart} onValueChange={(v) => { setTrimStart(v); if (v[0] >= trimEnd[0]) setTrimEnd([v[0] + 1]); }} max={videoDurationRaw} step={0.1} />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">End: {trimEnd[0].toFixed(1)}s</label>
                      <Slider value={trimEnd} onValueChange={(v) => { setTrimEnd(v); if (v[0] <= trimStart[0]) setTrimStart([v[0] - 1]); }} max={videoDurationRaw} step={0.1} />
                    </div>
                    <p className="text-xs text-muted-foreground">Duration: {(trimEnd[0] - trimStart[0]).toFixed(1)}s</p>
                  </div>
                </div>
              )}

              {/* Adjustments */}
              <div className="bg-card border border-border rounded-xl p-4 space-y-3">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 text-primary" /> Adjustments
                </h3>
                <div className="space-y-2">
                  <div>
                    <label className="text-xs text-muted-foreground flex items-center gap-1"><Sun className="h-3 w-3" /> Brightness: {brightness[0]}%</label>
                    <Slider value={brightness} onValueChange={setBrightness} min={50} max={150} step={1} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground flex items-center gap-1"><Contrast className="h-3 w-3" /> Contrast: {contrast[0]}%</label>
                    <Slider value={contrast} onValueChange={setContrast} min={50} max={150} step={1} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground flex items-center gap-1"><Palette className="h-3 w-3" /> Saturation: {saturation[0]}%</label>
                    <Slider value={saturation} onValueChange={setSaturation} min={0} max={200} step={1} />
                  </div>
                </div>
              </div>

              {/* Transform */}
              <div className="bg-card border border-border rounded-xl p-4 space-y-3">
                <h3 className="font-semibold text-sm">Transform</h3>
                <div className="flex gap-2">
                  <Button size="sm" variant={flipH ? 'default' : 'outline'} onClick={() => setFlipH(!flipH)} className="gap-1">
                    <FlipHorizontal className="h-4 w-4" /> Flip
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setRotation(r => (r + 90) % 360)} className="gap-1">
                    <RotateCcw className="h-4 w-4" /> Rotate
                  </Button>
                  {(flipH || rotation !== 0) && (
                    <Button size="sm" variant="ghost" onClick={() => { setFlipH(false); setRotation(0); }} className="text-xs">
                      Reset
                    </Button>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Text Tab */}
            <TabsContent value="text" className="space-y-4">
              <div className="bg-card border border-border rounded-xl p-4 space-y-3">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Type className="h-4 w-4 text-primary" /> Add Text Overlay
                </h3>
                <Input placeholder="Enter text..." value={newText} onChange={e => setNewText(e.target.value)} maxLength={50} />
                <div className="flex gap-1 flex-wrap">
                  {TEXT_COLORS.map(c => (
                    <button key={c} onClick={() => setTextColor(c)}
                      className={`w-7 h-7 rounded-full border-2 transition-all ${textColor === c ? 'border-primary scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Font Size: {textFontSize[0]}px</label>
                  <Slider value={textFontSize} onValueChange={setTextFontSize} min={16} max={64} step={1} />
                </div>
                <div className="flex gap-1 flex-wrap">
                  {FONT_FAMILIES.map(f => (
                    <button key={f} onClick={() => setTextFont(f)}
                      className={`px-2 py-1 text-xs rounded border transition-colors ${textFont === f ? 'border-primary bg-primary/10' : 'border-border'}`}
                      style={{ fontFamily: f }}>{f.split(' ')[0]}</button>
                  ))}
                </div>
                <Button size="sm" onClick={addTextOverlay} disabled={!newText.trim()} className="w-full gap-1">
                  <Type className="h-3 w-3" /> Add Text
                </Button>

                {textOverlays.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-border">
                    <p className="text-xs text-muted-foreground">Added texts:</p>
                    {textOverlays.map(t => (
                      <div key={t.id} className="flex items-center justify-between bg-muted/50 px-3 py-1.5 rounded">
                        <span className="text-sm truncate" style={{ color: t.color, fontFamily: t.fontFamily }}>{t.text}</span>
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => removeTextOverlay(t.id)}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Filters Tab */}
            <TabsContent value="filters" className="space-y-4">
              <div className="bg-card border border-border rounded-xl p-4">
                <h3 className="font-semibold text-sm flex items-center gap-2 mb-3">
                  <Sparkles className="h-4 w-4 text-primary" /> Filters
                </h3>
                <div className="grid grid-cols-4 gap-2">
                  {FILTERS.map(filter => (
                    <button
                      key={filter.value}
                      onClick={() => setSelectedFilter(filter.value)}
                      className={`p-2 rounded-lg border text-center transition-all ${
                        selectedFilter === filter.value ? 'border-primary bg-primary/10 ring-1 ring-primary' : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="w-full aspect-square rounded bg-muted mb-1 overflow-hidden">
                        {mediaPreview ? (
                          <img src={mediaPreview} alt="" className="w-full h-full object-cover" style={{ filter: filter.css || 'none' }} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center" style={{ filter: filter.css || 'none' }}>
                            <Palette className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] font-medium">{filter.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Details */}
          <div className="bg-card border border-border rounded-xl p-4 space-y-4">
            <h2 className="font-semibold flex items-center gap-2">
              <Scissors className="h-4 w-4 text-primary" /> Details
            </h2>
            <Input placeholder="Title *" value={title} onChange={e => setTitle(e.target.value)} maxLength={100} />
            <Textarea placeholder="Description (optional)" value={description} onChange={e => setDescription(e.target.value)} rows={2} maxLength={500} />
          </div>

          {/* Publish */}
          <Button onClick={handlePublish} disabled={publishing || !mediaFile || !title.trim()} className="w-full" size="lg">
            {publishing ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Publishing...</>
            ) : (
              <><Upload className="h-4 w-4 mr-2" /> Publish Short</>
            )}
          </Button>
        </div>
      </div>

      {/* Hidden audio element */}
      {selectedSong && (
        <audio ref={audioRef} src={selectedSong.audio_url} onEnded={() => setAudioPlaying(false)} preload="metadata" />
      )}
    </div>
  );
};

export default CreateShort;
