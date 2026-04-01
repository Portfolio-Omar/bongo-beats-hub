import React, { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, Music, Play, Pause, Volume2, VolumeX, Loader2, 
  Image as ImageIcon, Video, Scissors, Search, Check, X, Eye
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

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const MAX_DURATION = 60; // 1 minute

const CreateShort: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Media state
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string>('');
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [mediaDuration, setMediaDuration] = useState(0);

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
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
      };
    } else {
      setMediaDuration(15); // Default 15s for images
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

  // Update audio volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = audioVolume[0] / 100;
    }
  }, [audioVolume]);

  // Toggle preview mode
  const handlePreview = () => {
    setPreviewMode(!previewMode);
    if (!previewMode) {
      // Start playing both video and audio together
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
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

  // Publish short
  const handlePublish = async () => {
    if (!mediaFile || !title.trim() || !user) {
      toast.error('Please add media and a title');
      return;
    }

    setPublishing(true);
    try {
      // Upload media file
      const ext = mediaFile.name.split('.').pop();
      const path = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('shorts').upload(path, mediaFile);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('shorts').getPublicUrl(path);
      const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';

      // If it's an image, we need to create a video with the audio
      // For now, upload as-is and let the player handle combining
      let finalVideoUrl = urlData.publicUrl;

      // If image + audio selected, create a canvas-recorded video
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

      // Send email to user
      sendEmail('short_published', user.email, { 
        name: userName, 
        title: title.trim() 
      });

      // Notify admin
      sendEmail('admin_new_short', undefined, { 
        uploader: userName, 
        title: title.trim(),
        email: user.email 
      });

      toast.success('Short published successfully!');
      navigate('/shorts');
    } catch (err) {
      console.error('Publish error:', err);
      toast.error('Failed to publish short');
    } finally {
      setPublishing(false);
    }
  };

  // Create video from image + audio using canvas recording
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

        // Draw image scaled to fill
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
          const path = `created_${Date.now()}.webm`;
          const { error } = await supabase.storage.from('shorts').upload(path, file);
          if (error) { reject(error); return; }
          const { data } = supabase.storage.from('shorts').getPublicUrl(path);
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
          ctx.fillStyle = '#000';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
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
    <div className="container max-w-4xl py-6 sm:py-12">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
        Create Short
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
              <Input
                type="file"
                accept="image/*,video/*"
                onChange={handleMediaSelect}
                className="hidden"
                id="media-upload"
              />
              <label htmlFor="media-upload" className="cursor-pointer space-y-2 block">
                <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Upload image or video (max 20MB, 1 min)
                </p>
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
              <div className="aspect-[9/16] relative bg-black max-h-[400px] mx-auto">
                {mediaType === 'video' ? (
                  <video
                    ref={videoRef}
                    src={mediaPreview}
                    className="w-full h-full object-contain"
                    loop
                    muted={muteOriginal}
                    playsInline
                  />
                ) : (
                  <img
                    src={mediaPreview}
                    className="w-full h-full object-contain"
                    alt="Preview"
                  />
                )}
                {/* Preview overlay controls */}
                <div className="absolute bottom-2 left-2 right-2 flex justify-between">
                  <Button size="sm" variant="secondary" className="bg-black/50 text-white" onClick={handlePreview}>
                    {previewMode ? <Pause className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
                    {previewMode ? 'Stop' : 'Preview'}
                  </Button>
                  {mediaType === 'video' && (
                    <Button size="sm" variant="secondary" className="bg-black/50 text-white"
                      onClick={() => setMuteOriginal(!muteOriginal)}>
                      {muteOriginal ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Audio & Details */}
        <div className="space-y-4">
          {/* Audio selection */}
          <div className="bg-card border border-border rounded-xl p-4 space-y-4">
            <h2 className="font-semibold flex items-center gap-2">
              <Music className="h-4 w-4 text-primary" /> Add Audio
            </h2>

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
                  <label className="text-xs text-muted-foreground mb-1 block">Start at (seconds)</label>
                  <Slider value={audioStart} onValueChange={setAudioStart} max={180} step={1} />
                  <span className="text-xs text-muted-foreground">{audioStart[0]}s</span>
                </div>
              </div>
            )}

            {/* Song search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search songs..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9"
              />
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

          {/* Details */}
          <div className="bg-card border border-border rounded-xl p-4 space-y-4">
            <h2 className="font-semibold flex items-center gap-2">
              <Scissors className="h-4 w-4 text-primary" /> Details
            </h2>
            <Input
              placeholder="Title *"
              value={title}
              onChange={e => setTitle(e.target.value)}
              maxLength={100}
            />
            <Textarea
              placeholder="Description (optional)"
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              maxLength={500}
            />
          </div>

          {/* Publish */}
          <Button
            onClick={handlePublish}
            disabled={publishing || !mediaFile || !title.trim()}
            className="w-full"
            size="lg"
          >
            {publishing ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Publishing...</>
            ) : (
              <><Upload className="h-4 w-4 mr-2" /> Publish Short</>
            )}
          </Button>
        </div>
      </div>

      {/* Hidden audio element for preview */}
      {selectedSong && (
        <audio
          ref={audioRef}
          src={selectedSong.audio_url}
          onEnded={() => setAudioPlaying(false)}
          preload="metadata"
        />
      )}
    </div>
  );
};

export default CreateShort;
