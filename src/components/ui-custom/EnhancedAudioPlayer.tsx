import React, { useEffect, useState } from 'react';
import { useAudio } from '@/context/AudioContext';
import { useAuth } from '@/context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMediaSession } from '@/hooks/useMediaSession';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { 
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, 
  Repeat, Shuffle, Heart, ChevronUp, Disc, SlidersHorizontal
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import AudioFXPanel from './AudioFXPanel';

const EnhancedAudioPlayer: React.FC = () => {
  const {
    currentSong, isPlaying, currentTime, duration, volume, isMuted,
    isShuffled, isRepeating, togglePlayPause, playNext, playPrevious,
    setVolume, toggleMute, toggleShuffle, toggleRepeat, seekTo, audioRef,
  } = useAudio();

  useMediaSession();

  const [isLiked, setIsLiked] = useState(false);
  const [showFXPanel, setShowFXPanel] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isPlayerPage = location.pathname === '/player';

  useEffect(() => {
    if (currentSong && user) checkIfLiked();
  }, [currentSong, user]);

  const checkIfLiked = async () => {
    if (!currentSong || !user) return;
    try {
      const { data } = await supabase.from('favorites').select('id').eq('user_id', user.id).eq('song_id', currentSong.id).single();
      setIsLiked(!!data);
    } catch { setIsLiked(false); }
  };

  const toggleFavorite = async () => {
    if (!isAuthenticated) { toast.error('Please sign in to add favorites'); navigate('/auth'); return; }
    if (!currentSong || !user) return;
    try {
      if (isLiked) {
        await supabase.from('favorites').delete().eq('user_id', user.id).eq('song_id', currentSong.id);
        setIsLiked(false); toast.success('Removed from favorites');
      } else {
        await supabase.from('favorites').insert([{ user_id: user.id, song_id: currentSong.id }]);
        setIsLiked(true); toast.success('Added to favorites');
      }
    } catch { toast.error('Failed to update favorites'); }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (!currentSong || isPlayerPage) return null;

  const progress = duration ? (currentTime / duration) * 100 : 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-t border-border/50 shadow-2xl"
      >
        {/* Progress */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-muted">
          <motion.div className="h-full bg-primary" style={{ width: `${progress}%` }} />
        </div>

        {/* FX Panel (collapsible) */}
        <AnimatePresence>
          {showFXPanel && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-b border-border/30"
            >
              <AudioFXPanel audioElement={audioRef.current} compact />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main bar */}
        <div className="p-2 sm:p-3 md:p-4">
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
            {/* Song info */}
            <motion.div
              className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 cursor-pointer"
              whileHover={{ scale: 1.02 }}
              onClick={() => navigate('/player')}
            >
              <motion.div
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0"
                animate={{ rotate: isPlaying ? 360 : 0 }}
                transition={{ duration: 10, repeat: isPlaying ? Infinity : 0, ease: "linear" }}
              >
                {currentSong.cover_url ? (
                  <img src={currentSong.cover_url} alt={currentSong.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
                    <Disc className="h-5 w-5 text-primary/70" />
                  </div>
                )}
              </motion.div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-xs sm:text-sm truncate">{currentSong.title}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{currentSong.artist}</p>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full md:hidden flex-shrink-0"
                onClick={(e) => { e.stopPropagation(); navigate('/player'); }}>
                <ChevronUp className="h-3.5 w-3.5" />
              </Button>
            </motion.div>

            {/* Controls */}
            <div className="flex items-center gap-0.5 sm:gap-1 md:gap-2">
              <Button variant="ghost" size="icon" onClick={toggleShuffle}
                className={`h-7 w-7 sm:h-8 sm:w-8 rounded-full hidden sm:flex ${isShuffled ? 'text-primary bg-primary/10' : 'text-muted-foreground'}`}>
                <Shuffle className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              </Button>

              <Button variant="ghost" size="icon" onClick={playPrevious} className="h-7 w-7 sm:h-8 sm:w-8 md:h-10 md:w-10 rounded-full">
                <SkipBack className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>

              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button size="icon" onClick={togglePlayPause}
                  className="h-9 w-9 sm:h-10 sm:w-10 md:h-12 md:w-12 rounded-full bg-primary hover:bg-primary/90 shadow-lg">
                  <AnimatePresence mode="wait">
                    <motion.div key={isPlaying ? 'p' : 'l'} initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ duration: 0.15 }}>
                      {isPlaying ? <Pause className="h-4 w-4 sm:h-5 sm:w-5" /> : <Play className="h-4 w-4 sm:h-5 sm:w-5 ml-0.5" />}
                    </motion.div>
                  </AnimatePresence>
                </Button>
              </motion.div>

              <Button variant="ghost" size="icon" onClick={playNext} className="h-7 w-7 sm:h-8 sm:w-8 md:h-10 md:w-10 rounded-full">
                <SkipForward className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>

              <Button variant="ghost" size="icon" onClick={toggleRepeat}
                className={`h-7 w-7 sm:h-8 sm:w-8 rounded-full hidden sm:flex ${isRepeating ? 'text-primary bg-primary/10' : 'text-muted-foreground'}`}>
                <Repeat className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              </Button>

              {/* FX toggle */}
              <Button variant="ghost" size="icon" onClick={() => setShowFXPanel(!showFXPanel)}
                className={`h-7 w-7 sm:h-8 sm:w-8 rounded-full ${showFXPanel ? 'text-primary bg-primary/10' : 'text-muted-foreground'}`}>
                <SlidersHorizontal className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              </Button>
            </div>

            {/* Volume & Like - desktop */}
            <div className="hidden md:flex items-center gap-2 min-w-0 flex-1 max-w-xs justify-end">
              <Button variant="ghost" size="icon" onClick={toggleFavorite} className="h-8 w-8 rounded-full flex-shrink-0">
                <Heart className={`h-3.5 w-3.5 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
              </Button>
              <Button variant="ghost" size="icon" onClick={toggleMute} className="h-8 w-8 rounded-full flex-shrink-0">
                {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
              </Button>
              <Slider value={[isMuted ? 0 : volume * 100]} onValueChange={(v) => setVolume(v[0] / 100)} max={100} step={1} className="w-20" />
              <div className="text-[10px] text-muted-foreground flex-shrink-0 font-mono ml-1">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>
          </div>

          {/* Mobile progress & extra controls */}
          <div className="mt-1.5 md:hidden">
            <Slider value={[currentTime]} onValueChange={(v) => seekTo(v[0])} max={duration || 100} step={1} className="w-full" />
            <div className="flex items-center justify-between mt-1">
              <span className="text-[10px] text-muted-foreground font-mono">{formatTime(currentTime)}</span>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={toggleShuffle}
                  className={`h-6 w-6 rounded-full sm:hidden ${isShuffled ? 'text-primary' : 'text-muted-foreground'}`}>
                  <Shuffle className="h-2.5 w-2.5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={toggleRepeat}
                  className={`h-6 w-6 rounded-full sm:hidden ${isRepeating ? 'text-primary' : 'text-muted-foreground'}`}>
                  <Repeat className="h-2.5 w-2.5" />
                </Button>
              </div>
              <span className="text-[10px] text-muted-foreground font-mono">{formatTime(duration)}</span>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default EnhancedAudioPlayer;
