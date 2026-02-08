import React, { useEffect, useState } from 'react';
import { useAudio } from '@/context/AudioContext';
import { useAuth } from '@/context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { 
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, 
  Repeat, Shuffle, Heart, ChevronUp, Disc
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const EnhancedAudioPlayer: React.FC = () => {
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isShuffled,
    isRepeating,
    togglePlayPause,
    playNext,
    playPrevious,
    setVolume,
    toggleMute,
    toggleShuffle,
    toggleRepeat,
    seekTo
  } = useAudio();

  const [isLiked, setIsLiked] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Hide player on player page
  const isPlayerPage = location.pathname === '/player';

  useEffect(() => {
    if (currentSong && user) {
      checkIfLiked();
    }
  }, [currentSong, user]);

  const checkIfLiked = async () => {
    if (!currentSong || !user) return;
    
    try {
      const { data } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('song_id', currentSong.id)
        .single();

      setIsLiked(!!data);
    } catch {
      setIsLiked(false);
    }
  };

  const toggleFavorite = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to add favorites');
      navigate('/auth');
      return;
    }

    if (!currentSong || !user) return;

    try {
      if (isLiked) {
        await supabase.from('favorites').delete().eq('user_id', user.id).eq('song_id', currentSong.id);
        setIsLiked(false);
        toast.success('Removed from favorites');
      } else {
        await supabase.from('favorites').insert([{ user_id: user.id, song_id: currentSong.id }]);
        setIsLiked(true);
        toast.success('Added to favorites');
      }
    } catch {
      toast.error('Failed to update favorites');
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleOpenPlayer = () => {
    navigate('/player');
  };

  if (!currentSong || isPlayerPage) return null;

  const progressPercentage = duration ? (currentTime / duration) * 100 : 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-t border-border/50 shadow-2xl"
      >
        {/* Progress indicator */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-muted">
          <motion.div
            className="h-full bg-primary"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {/* Main player bar */}
        <div className="p-3 md:p-4">
          <div className="flex items-center gap-3 md:gap-4">
            {/* Song info with click to expand */}
            <motion.div 
              className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
              whileHover={{ scale: 1.02 }}
              onClick={handleOpenPlayer}
            >
              <motion.div 
                className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0 relative"
                animate={{ rotate: isPlaying ? 360 : 0 }}
                transition={{ duration: 10, repeat: isPlaying ? Infinity : 0, ease: "linear" }}
              >
                {currentSong.cover_url ? (
                  <img 
                    src={currentSong.cover_url} 
                    alt={`${currentSong.title} cover`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
                    <Disc className="h-6 w-6 text-primary/70" />
                  </div>
                )}
              </motion.div>
              
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm truncate">{currentSong.title}</p>
                <p className="text-xs text-muted-foreground truncate">{currentSong.artist}</p>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full md:hidden"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenPlayer();
                }}
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
            </motion.div>

            {/* Media controls */}
            <div className="flex items-center gap-1 md:gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleShuffle}
                className={`h-8 w-8 md:h-10 md:w-10 rounded-full hidden sm:flex ${isShuffled ? 'text-primary bg-primary/10' : ''}`}
              >
                <Shuffle className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={playPrevious}
                className="h-8 w-8 md:h-10 md:w-10 rounded-full"
              >
                <SkipBack className="h-4 w-4" />
              </Button>
              
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  size="icon"
                  onClick={togglePlayPause}
                  className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-primary hover:bg-primary/90 shadow-lg"
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={isPlaying ? 'pause' : 'play'}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
                    </motion.div>
                  </AnimatePresence>
                </Button>
              </motion.div>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={playNext}
                className="h-8 w-8 md:h-10 md:w-10 rounded-full"
              >
                <SkipForward className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleRepeat}
                className={`h-8 w-8 md:h-10 md:w-10 rounded-full hidden sm:flex ${isRepeating ? 'text-primary bg-primary/10' : ''}`}
              >
                <Repeat className="h-4 w-4" />
              </Button>
            </div>

            {/* Volume & Like */}
            <div className="hidden md:flex items-center gap-2 min-w-0 flex-1 max-w-xs justify-end">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleFavorite}
                className="h-10 w-10 rounded-full flex-shrink-0"
              >
                <Heart className={`h-4 w-4 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMute}
                className="h-10 w-10 rounded-full flex-shrink-0"
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
              
              <Slider
                value={[isMuted ? 0 : volume * 100]}
                onValueChange={(value) => setVolume(value[0] / 100)}
                max={100}
                step={1}
                className="w-20"
              />

              <div className="text-xs text-muted-foreground flex-shrink-0 font-mono ml-2">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>
          </div>

          {/* Mobile progress slider */}
          <div className="mt-2 md:hidden">
            <Slider
              value={[currentTime]}
              onValueChange={(value) => seekTo(value[0])}
              max={duration || 100}
              step={1}
              className="w-full"
            />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default EnhancedAudioPlayer;
