import React from 'react';
import { useAudio } from '@/context/AudioContext';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { 
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, 
  Repeat, Shuffle, Download, Share, Heart, ChevronUp, ChevronDown 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const PersistentAudioPlayer: React.FC = () => {
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

  const [isExpanded, setIsExpanded] = React.useState(false);
  const [isLiked, setIsLiked] = React.useState(false);

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

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border shadow-lg"
      >
        {/* Expanded view */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="p-4 border-b border-border">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Album Art */}
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    {currentSong.cover_url ? (
                      <img 
                        src={currentSong.cover_url} 
                        alt={`${currentSong.title} cover`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        ♪
                      </div>
                    )}
                  </div>

                  {/* Song Info */}
                  <div className="flex-1 text-center sm:text-left">
                    <h3 className="font-semibold text-lg truncate">{currentSong.title}</h3>
                    <p className="text-muted-foreground truncate">{currentSong.artist}</p>
                    <div className="flex flex-wrap gap-2 mt-1 justify-center sm:justify-start">
                      {currentSong.genre && (
                        <Badge variant="secondary" className="text-xs">
                          {currentSong.genre}
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        <Download className="w-3 h-3 mr-1" />
                        {currentSong.download_count || 0}
                      </Badge>
                    </div>
                  </div>

                  {/* Additional Controls */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsLiked(!isLiked)}
                      className="h-8 w-8"
                    >
                      <Heart className={`h-4 w-4 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleDownload}
                      className="h-8 w-8"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleShare}
                      className="h-8 w-8"
                    >
                      <Share className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main player bar */}
        <div className="p-3">
          <div className="flex items-center gap-3">
            {/* Toggle expand button (mobile) */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8 sm:hidden"
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </Button>

            {/* Compact song info */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-12 h-12 rounded-md overflow-hidden bg-muted flex-shrink-0 hidden sm:block">
                {currentSong.cover_url ? (
                  <img 
                    src={currentSong.cover_url} 
                    alt={`${currentSong.title} cover`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                    ♪
                  </div>
                )}
              </div>
              
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm truncate">{currentSong.title}</p>
                <p className="text-xs text-muted-foreground truncate">{currentSong.artist}</p>
              </div>
            </div>

            {/* Media controls */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleShuffle}
                className={`h-8 w-8 hidden sm:flex ${isShuffled ? 'text-primary' : ''}`}
              >
                <Shuffle className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={playPrevious}
                className="h-8 w-8"
              >
                <SkipBack className="h-4 w-4" />
              </Button>
              
              <Button
                variant="default"
                size="icon"
                onClick={togglePlayPause}
                className="h-10 w-10"
              >
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={playNext}
                className="h-8 w-8"
              >
                <SkipForward className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleRepeat}
                className={`h-8 w-8 hidden sm:flex ${isRepeating ? 'text-primary' : ''}`}
              >
                <Repeat className="h-4 w-4" />
              </Button>
            </div>

            {/* Volume and progress */}
            <div className="hidden md:flex items-center gap-2 min-w-0 flex-1 max-w-xs">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMute}
                className="h-8 w-8 flex-shrink-0"
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
              
              <Slider
                value={[isMuted ? 0 : volume * 100]}
                onValueChange={(value) => setVolume(value[0] / 100)}
                max={100}
                step={1}
                className="w-20 flex-shrink-0"
              />
            </div>

            {/* Time display */}
            <div className="text-xs text-muted-foreground hidden lg:block flex-shrink-0">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-2">
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

export default PersistentAudioPlayer;