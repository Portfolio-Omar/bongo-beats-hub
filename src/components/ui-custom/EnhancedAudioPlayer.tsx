import React, { useEffect, useState } from 'react';
import { useAudio } from '@/context/AudioContext';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { 
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, 
  Repeat, Shuffle, Download, Share, Heart, ChevronUp, ChevronDown,
  Music, Disc
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

  const [isExpanded, setIsExpanded] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentSong && user) {
      checkIfLiked();
    }
  }, [currentSong, user]);

  const checkIfLiked = async () => {
    if (!currentSong || !user) return;
    
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('song_id', currentSong.id)
        .single();

      setIsLiked(!!data);
    } catch (error) {
      // Not in favorites
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
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('song_id', currentSong.id);

        if (error) throw error;
        setIsLiked(false);
        toast.success('Removed from favorites');
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert([{ user_id: user.id, song_id: currentSong.id }]);

        if (error) throw error;
        setIsLiked(true);
        toast.success('Added to favorites');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Failed to update favorites');
    }
  };

  if (!currentSong) return null;

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleDownload = async () => {
    if (!currentSong) return;
    
    try {
      // Update download count
      const { error } = await supabase
        .from('songs')
        .update({ download_count: (currentSong.download_count || 0) + 1 })
        .eq('id', currentSong.id);

      if (error) throw error;

      // Trigger download
      const link = document.createElement('a');
      link.href = currentSong.audio_url;
      link.download = `${currentSong.artist} - ${currentSong.title}.mp3`;
      link.click();

      toast({
        title: "Download started",
        description: `${currentSong.title} by ${currentSong.artist}`,
      });
    } catch (error) {
      console.error('Error downloading song:', error);
      toast({
        title: "Download failed",
        description: "Unable to download the song",
        variant: "destructive",
      });
    }
  };

  const handleShare = async () => {
    if (navigator.share && currentSong) {
      try {
        await navigator.share({
          title: `${currentSong.title} by ${currentSong.artist}`,
          text: `Check out this song: ${currentSong.title} by ${currentSong.artist}`,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else if (currentSong) {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied",
        description: "Song link copied to clipboard",
      });
    }
  };

  const progressPercentage = duration ? (currentTime / duration) * 100 : 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-background via-background/98 to-background/95 backdrop-blur-xl border-t border-border/50 shadow-2xl"
      >
        {/* Animated background wave */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary"
            style={{ 
              scaleX: progressPercentage / 100,
              transformOrigin: 'left'
            }}
            animate={{
              background: [
                'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)), hsl(var(--primary)))',
                'linear-gradient(90deg, hsl(var(--accent)), hsl(var(--primary)), hsl(var(--accent)))',
                'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)), hsl(var(--primary)))'
              ]
            }}
            transition={{ duration: 3, repeat: Infinity }}
          />
        </div>

        {/* Expanded view */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden border-b border-border/50"
            >
              <div className="p-6">
                <div className="flex flex-col lg:flex-row items-center gap-6">
                  {/* Enhanced Album Art */}
                  <motion.div 
                    className="relative w-32 h-32 lg:w-40 lg:h-40 rounded-2xl overflow-hidden shadow-2xl group"
                    whileHover={{ scale: 1.05 }}
                  >
                    {currentSong.cover_url ? (
                      <img 
                        src={currentSong.cover_url} 
                        alt={`${currentSong.title} cover`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
                        <motion.div
                          animate={{ rotate: isPlaying ? 360 : 0 }}
                          transition={{ duration: 3, repeat: isPlaying ? Infinity : 0, ease: "linear" }}
                        >
                          <Disc className="w-16 h-16 text-primary/70" />
                        </motion.div>
                      </div>
                    )}
                    
                    {/* Vinyl effect overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent" />
                    
                    {/* Center dot */}
                    <motion.div 
                      className="absolute top-1/2 left-1/2 w-4 h-4 bg-background rounded-full transform -translate-x-1/2 -translate-y-1/2"
                      animate={{ rotate: isPlaying ? 360 : 0 }}
                      transition={{ duration: 3, repeat: isPlaying ? Infinity : 0, ease: "linear" }}
                    />
                  </motion.div>

                  {/* Song Info */}
                  <div className="flex-1 text-center lg:text-left">
                    <motion.h3 
                      className="text-2xl lg:text-3xl font-bold mb-2"
                      whileHover={{ scale: 1.02 }}
                    >
                      {currentSong.title}
                    </motion.h3>
                    <motion.p 
                      className="text-xl text-muted-foreground mb-4"
                      whileHover={{ scale: 1.02 }}
                    >
                      {currentSong.artist}
                    </motion.p>
                    
                    <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                      {currentSong.genre && (
                        <motion.div whileHover={{ scale: 1.05 }}>
                          <Badge variant="secondary" className="text-sm px-3 py-1">
                            <Music className="w-3 h-3 mr-1" />
                            {currentSong.genre}
                          </Badge>
                        </motion.div>
                      )}
                      <motion.div whileHover={{ scale: 1.05 }}>
                        <Badge variant="outline" className="text-sm px-3 py-1">
                          <Download className="w-3 h-3 mr-1" />
                          {currentSong.download_count || 0} downloads
                        </Badge>
                      </motion.div>
                    </div>
                  </div>

                  {/* Enhanced Controls */}
                  <div className="flex items-center gap-3">
                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsLiked(!isLiked)}
                        className="h-12 w-12 rounded-full"
                      >
                        <Heart className={`h-5 w-5 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                      </Button>
                    </motion.div>
                    
                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleDownload}
                        className="h-12 w-12 rounded-full"
                      >
                        <Download className="h-5 w-5" />
                      </Button>
                    </motion.div>
                    
                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleShare}
                        className="h-12 w-12 rounded-full"
                      >
                        <Share className="h-5 w-5" />
                      </Button>
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main player bar */}
        <div className="p-4">
          <div className="flex items-center gap-4">
            {/* Toggle expand button */}
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-10 w-10 rounded-full sm:hidden"
              >
                {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
              </Button>
            </motion.div>

            {/* Compact song info with animated cover */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <motion.div 
                className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0 relative group"
                whileHover={{ scale: 1.05 }}
              >
                {currentSong.cover_url ? (
                  <img 
                    src={currentSong.cover_url} 
                    alt={`${currentSong.title} cover`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
                    <motion.div
                      animate={{ rotate: isPlaying ? 360 : 0 }}
                      transition={{ duration: 4, repeat: isPlaying ? Infinity : 0, ease: "linear" }}
                    >
                      <Music className="h-4 w-4 text-primary/70" />
                    </motion.div>
                  </div>
                )}
              </motion.div>
              
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm truncate">{currentSong.title}</p>
                <p className="text-xs text-muted-foreground truncate">{currentSong.artist}</p>
              </div>
            </div>

            {/* Enhanced Media controls */}
            <div className="flex items-center gap-2">
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleShuffle}
                  className={`h-10 w-10 rounded-full hidden sm:flex ${isShuffled ? 'text-primary bg-primary/10' : ''}`}
                >
                  <Shuffle className="h-4 w-4" />
                </Button>
              </motion.div>
              
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={playPrevious}
                  className="h-10 w-10 rounded-full"
                >
                  <SkipBack className="h-4 w-4" />
                </Button>
              </motion.div>
              
              <motion.div 
                whileHover={{ scale: 1.05 }} 
                whileTap={{ scale: 0.95 }}
                className="relative"
              >
                <Button
                  variant="default"
                  size="icon"
                  onClick={togglePlayPause}
                  className="h-12 w-12 rounded-full bg-gradient-to-r from-primary to-accent shadow-lg"
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={isPlaying ? 'pause' : 'play'}
                      initial={{ scale: 0, rotate: -90 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, rotate: 90 }}
                      transition={{ duration: 0.2 }}
                    >
                      {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
                    </motion.div>
                  </AnimatePresence>
                </Button>
                
                {/* Pulse effect when playing */}
                {isPlaying && (
                  <motion.div
                    className="absolute inset-0 rounded-full bg-primary"
                    animate={{ scale: [1, 1.4], opacity: [0.5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}
              </motion.div>
              
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={playNext}
                  className="h-10 w-10 rounded-full"
                >
                  <SkipForward className="h-4 w-4" />
                </Button>
              </motion.div>
              
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleRepeat}
                  className={`h-10 w-10 rounded-full hidden sm:flex ${isRepeating ? 'text-primary bg-primary/10' : ''}`}
                >
                  <Repeat className="h-4 w-4" />
                </Button>
              </motion.div>
            </div>

            {/* Enhanced Volume control */}
            <div className="hidden md:flex items-center gap-3 min-w-0 flex-1 max-w-xs">
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleMute}
                  className="h-10 w-10 rounded-full flex-shrink-0"
                >
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
              </motion.div>
              
              <div className="relative flex-1">
                <Slider
                  value={[isMuted ? 0 : volume * 100]}
                  onValueChange={(value) => setVolume(value[0] / 100)}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>

            {/* Time display */}
            <div className="text-xs text-muted-foreground hidden lg:block flex-shrink-0 font-mono">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>

          {/* Enhanced Progress bar */}
          <div className="mt-3 relative">
            <Slider
              value={[currentTime]}
              onValueChange={(value) => seekTo(value[0])}
              max={duration || 100}
              step={1}
              className="w-full"
            />
            
            {/* Visual progress indicator */}
            <div className="absolute top-0 left-0 h-full pointer-events-none">
              <motion.div
                className="h-full bg-gradient-to-r from-primary via-accent to-primary rounded-full opacity-30"
                style={{ width: `${progressPercentage}%` }}
                animate={{
                  background: [
                    'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)), hsl(var(--primary)))',
                    'linear-gradient(90deg, hsl(var(--accent)), hsl(var(--primary)), hsl(var(--accent)))',
                    'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)), hsl(var(--primary)))'
                  ]
                }}
                transition={{ duration: 3, repeat: Infinity }}
              />
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default EnhancedAudioPlayer;