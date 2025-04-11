
import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, 
  Repeat, Shuffle, Share2, Heart, Download
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

interface MusicPlayerProps {
  song: {
    id: string;
    title: string;
    artist: string;
    coverUrl: string;
    audioUrl: string;
    downloadCount?: number;
  };
  songs?: Array<{
    id: string;
    title: string;
    artist: string;
    coverUrl: string;
    audioUrl: string;
    downloadCount?: number;
  }>;
  onPlayNext?: () => void;
  onPlayPrevious?: () => void;
  onSongEnd?: () => void;
}

const MusicPlayer: React.FC<MusicPlayerProps> = ({ song, songs = [], onPlayNext, onPlayPrevious, onSongEnd }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [prevVolume, setPrevVolume] = useState(0.7);
  const [isRepeatEnabled, setIsRepeatEnabled] = useState(false);
  const [isShuffleEnabled, setIsShuffleEnabled] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      // Auto-play when a new song is loaded
      if (song) {
        audio.play().catch(err => console.error("Could not autoplay:", err));
        setIsPlaying(true);
      }
    };
    
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };
    
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      
      if (isRepeatEnabled) {
        // Replay the current song
        audio.currentTime = 0;
        audio.play().catch(err => console.error("Could not replay:", err));
        setIsPlaying(true);
      } else if (onSongEnd) {
        // Move to the next song
        onSongEnd();
      }
    };
    
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    
    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [song, isRepeatEnabled, onSongEnd]);
  
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    if (isPlaying) {
      audio.play().catch(error => {
        console.error('Error playing audio:', error);
        setIsPlaying(false);
        toast.error('Could not play audio. Please try again.');
      });
    } else {
      audio.pause();
    }
  }, [isPlaying]);
  
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);
  
  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };
  
  const toggleMute = () => {
    setIsMuted(!isMuted);
  };
  
  const toggleLike = () => {
    setIsLiked(!isLiked);
    toast.success(isLiked ? 'Removed from favorites' : 'Added to favorites');
  };
  
  const toggleRepeat = () => {
    setIsRepeatEnabled(!isRepeatEnabled);
    toast.info(isRepeatEnabled ? 'Repeat disabled' : 'Repeat enabled');
  };
  
  const toggleShuffle = () => {
    setIsShuffleEnabled(!isShuffleEnabled);
    toast.info(isShuffleEnabled ? 'Shuffle disabled' : 'Shuffle enabled');
  };
  
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard!');
  };
  
  const handleTimeChange = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = value[0];
    setCurrentTime(value[0]);
  };
  
  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
    if (isMuted && value[0] > 0) {
      setIsMuted(false);
    }
  };
  
  const handlePrevious = () => {
    if (onPlayPrevious) {
      onPlayPrevious();
    } else {
      toast.info('Previous track not available in demo');
    }
  };
  
  const handleNext = () => {
    if (onPlayNext) {
      onPlayNext();
    } else {
      toast.info('Next track not available in demo');
    }
  };
  
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };
  
  return (
    <div className="music-card w-full max-w-4xl mx-auto overflow-hidden">
      <audio ref={audioRef} src={song.audioUrl} preload="metadata" />
      
      <div className="flex flex-col md:flex-row gap-6">
        {/* Album Art with animated glow effect */}
        <div className="w-full md:w-48 h-48 rounded-lg overflow-hidden shadow-md flex-shrink-0 relative group">
          {isPlaying && (
            <div className="absolute inset-0 z-0">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 animate-pulse"></div>
              <div className="absolute inset-2 rounded-lg blur-md bg-gradient-to-br from-primary/20 to-secondary/20 animate-pulse"></div>
            </div>
          )}
          <img 
            src={song.coverUrl} 
            alt={`${song.title} cover`} 
            className="w-full h-full object-cover transition-transform duration-700 hover:scale-110 relative z-10"
          />
        </div>
        
        {/* Player Controls */}
        <div className="flex flex-col justify-between flex-grow">
          <div>
            <h3 className="text-xl font-display font-semibold text-foreground mb-1">{song.title}</h3>
            <p className="text-sm text-muted-foreground mb-6">{song.artist}</p>
          </div>
          
          {/* Time Slider */}
          <div className="mb-4">
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={0.1}
              onValueChange={handleTimeChange}
              className="mb-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
          
          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className={`text-muted-foreground hover:text-primary ${isShuffleEnabled ? 'text-primary' : ''}`}
                onClick={toggleShuffle}
              >
                <Shuffle className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-primary"
                onClick={handlePrevious}
              >
                <SkipBack className="h-5 w-5" />
              </Button>
              
              <Button
                variant="outline"
                size="icon"
                className={`rounded-full h-12 w-12 ${
                  isPlaying ? 'bg-primary text-white hover:bg-primary/90' : 'hover:text-primary'
                }`}
                onClick={togglePlayPause}
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5 ml-0.5" />
                )}
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-primary"
                onClick={handleNext}
              >
                <SkipForward className="h-5 w-5" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className={`text-muted-foreground hover:text-primary ${isRepeatEnabled ? 'text-primary' : ''}`}
                onClick={toggleRepeat}
              >
                <Repeat className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex flex-col items-end">
                <Button
                  variant="ghost"
                  size="icon"
                  className={`${isLiked ? 'text-red-500' : 'text-muted-foreground'} hover:text-red-500`}
                  onClick={toggleLike}
                >
                  <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                </Button>
                
                {song.downloadCount !== undefined && song.downloadCount > 0 && (
                  <Badge variant="outline" className="text-[10px] px-2 py-0 h-4 flex items-center gap-0.5">
                    <Download className="h-2 w-2" />
                    {song.downloadCount}
                  </Badge>
                )}
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-primary"
                onClick={handleShare}
              >
                <Share2 className="h-4 w-4" />
              </Button>
              
              <div className="hidden sm:flex items-center gap-2 ml-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-primary"
                  onClick={toggleMute}
                >
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
                
                <Slider
                  value={[isMuted ? 0 : volume]}
                  max={1}
                  step={0.01}
                  onValueChange={handleVolumeChange}
                  className="w-20"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MusicPlayer;
