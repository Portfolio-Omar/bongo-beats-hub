
import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, 
  Repeat, Shuffle, Share2, Heart
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface MusicPlayerWithFadeProps {
  song: {
    id: string;
    title: string;
    artist: string;
    coverUrl: string;
    audioUrl: string;
  };
  songs?: Array<{
    id: string;
    title: string;
    artist: string;
    coverUrl: string;
    audioUrl: string;
  }>;
  onPlayNext?: () => void;
  onPlayPrevious?: () => void;
  onSongEnd?: () => void;
}

const MusicPlayerWithFade: React.FC<MusicPlayerWithFadeProps> = ({ 
  song, 
  songs = [], 
  onPlayNext, 
  onPlayPrevious, 
  onSongEnd 
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [prevVolume, setPrevVolume] = useState(0.7);
  const [isRepeatEnabled, setIsRepeatEnabled] = useState(false);
  const [isShuffleEnabled, setIsShuffleEnabled] = useState(false);
  const [isFading, setIsFading] = useState(false);
  const [nextSong, setNextSong] = useState<typeof song | null>(null);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const fadeIntervalRef = useRef<number | null>(null);
  
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      // Auto-play when a new song is loaded with fade in
      if (song) {
        audio.volume = 0;
        audio.play().catch(err => console.error("Could not autoplay:", err));
        setIsPlaying(true);
        fadeIn();
      }
    };
    
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      
      // Start fade out when approaching the end (5 seconds before)
      if (duration > 0 && audio.currentTime > duration - 5 && !isFading) {
        // Only fade out if we're going to play another song automatically
        if (isRepeatEnabled || onSongEnd) {
          fadeOut();
        }
      }
    };
    
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      
      if (isRepeatEnabled) {
        // Replay the current song with fade effect
        audio.currentTime = 0;
        fadeIn();
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
      if (fadeIntervalRef.current) {
        clearInterval(fadeIntervalRef.current);
      }
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [song, duration, isRepeatEnabled, onSongEnd, isFading]);
  
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
  
  const fadeIn = () => {
    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
    }
    
    const audio = audioRef.current;
    if (!audio) return;
    
    setIsFading(true);
    
    let currentVol = 0;
    audio.volume = currentVol;
    
    fadeIntervalRef.current = window.setInterval(() => {
      currentVol = Math.min(currentVol + 0.05, isMuted ? 0 : volume);
      if (audio) audio.volume = currentVol;
      
      if (currentVol >= (isMuted ? 0 : volume)) {
        if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
        setIsFading(false);
      }
    }, 100);
  };
  
  const fadeOut = () => {
    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
    }
    
    const audio = audioRef.current;
    if (!audio) return;
    
    setIsFading(true);
    
    let currentVol = isMuted ? 0 : volume;
    
    fadeIntervalRef.current = window.setInterval(() => {
      currentVol = Math.max(currentVol - 0.05, 0);
      if (audio) audio.volume = currentVol;
      
      if (currentVol <= 0) {
        if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
      }
    }, 100);
  };
  
  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;
    
    if (!isPlaying) {
      // Fade in when starting playback
      fadeIn();
    } else {
      // Fade out when pausing
      fadeOut();
      // We need to actually pause after the fade completes
      setTimeout(() => {
        if (audio) audio.pause();
      }, 1000);
    }
    
    setIsPlaying(!isPlaying);
  };
  
  const toggleMute = () => {
    if (isMuted) {
      // Unmuting - restore previous volume with fade
      setIsMuted(false);
      fadeIn();
    } else {
      // Muting - fade out then mute
      setPrevVolume(volume);
      fadeOut();
      setIsMuted(true);
    }
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
    const newVolume = value[0];
    setVolume(newVolume);
    
    const audio = audioRef.current;
    if (!audio) return;
    
    // Apply volume change with a small fade effect
    if (isMuted && newVolume > 0) {
      setIsMuted(false);
      fadeIn();
    } else if (!isMuted) {
      // Apply the new volume with a mini-fade
      let currentVol = audio.volume;
      const step = (newVolume - currentVol) / 5;
      
      let count = 0;
      const miniInterval = setInterval(() => {
        count++;
        currentVol += step;
        audio.volume = Math.max(0, Math.min(1, currentVol));
        
        if (count >= 5) {
          clearInterval(miniInterval);
          audio.volume = newVolume;
        }
      }, 30);
    }
  };
  
  const handleSkip = (direction: 'next' | 'previous') => {
    // Fade out current song
    fadeOut();
    
    // Give time for fade out before changing
    setTimeout(() => {
      if (direction === 'next') {
        if (onPlayNext) {
          onPlayNext();
        } else {
          toast.info('Next track not available in demo');
        }
      } else {
        if (onPlayPrevious) {
          onPlayPrevious();
        } else {
          toast.info('Previous track not available in demo');
        }
      }
    }, 500);
  };
  
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };
  
  return (
    <div className="music-card w-full max-w-4xl mx-auto overflow-hidden">
      <audio ref={audioRef} src={song.audioUrl} preload="metadata" />
      
      <AnimatePresence mode="wait">
        <motion.div 
          key={song.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row gap-6"
        >
          {/* Album Art */}
          <div className="w-full md:w-48 h-48 rounded-lg overflow-hidden shadow-md flex-shrink-0">
            <img 
              src={song.coverUrl} 
              alt={`${song.title} cover`} 
              className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
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
                  onClick={() => handleSkip('previous')}
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
                  onClick={() => handleSkip('next')}
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
                <Button
                  variant="ghost"
                  size="icon"
                  className={`${isLiked ? 'text-red-500' : 'text-muted-foreground'} hover:text-red-500`}
                  onClick={toggleLike}
                >
                  <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                </Button>
                
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
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default MusicPlayerWithFade;
