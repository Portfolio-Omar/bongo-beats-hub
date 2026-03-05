import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAudio } from '@/context/AudioContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, 
  Repeat, Shuffle, Download, Share, Heart, ChevronDown,
  Music, Disc, ListMusic, X, GripVertical, Lock
} from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Song } from '@/types/music';
import logo from '@/assets/logo.png';

const Player: React.FC = () => {
  const navigate = useNavigate();
  const {
    currentSong,
    isPlaying,
    playlist,
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
    seekTo,
    playSong,
    setPlaylist,
    removeFromQueue,
  } = useAudio();

  const [isLiked, setIsLiked] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!currentSong) {
      navigate('/music');
    }
  }, [currentSong, navigate]);

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
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Failed to update favorites');
    }
  };

  const handleDownload = async () => {
    if (!currentSong) return;
    try {
      await supabase.from('songs').update({ download_count: (currentSong.download_count || 0) + 1 }).eq('id', currentSong.id);
      const link = document.createElement('a');
      link.href = currentSong.audio_url;
      link.download = `${currentSong.artist} - ${currentSong.title}.mp3`;
      link.click();
      toast.success(`Download started: ${currentSong.title}`);
    } catch {
      toast.error("Unable to download the song");
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
      toast.success("Song link copied to clipboard");
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleQueueReorder = (newOrder: Song[]) => {
    setPlaylist(newOrder);
  };

  const handleRemoveFromQueue = (songId: string) => {
    removeFromQueue(songId);
    toast.success('Removed from queue');
  };

  const handlePlayFromQueue = (song: Song) => {
    playSong(song, playlist);
  };

  if (!currentSong) return null;

  const _progressPercentage = duration ? (currentTime / duration) * 100 : 0;
  const currentIndex = playlist.findIndex(s => s.id === currentSong.id);
  const upcomingSongs = playlist.slice(currentIndex + 1);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-gradient-to-b from-background via-background to-background/95"
    >
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        {currentSong.cover_url && (
          <motion.div
            className="absolute inset-0"
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.15 }}
            transition={{ duration: 0.5 }}
          >
            <img
              src={currentSong.cover_url}
              alt=""
              className="w-full h-full object-cover blur-3xl"
            />
          </motion.div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between p-4 md:p-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="rounded-full"
        >
          <ChevronDown className="h-6 w-6" />
        </Button>
        <p className="text-sm text-muted-foreground">Now Playing</p>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowQueue(!showQueue)}
          className={`rounded-full ${showQueue ? 'bg-primary/10 text-primary' : ''}`}
        >
          <ListMusic className="h-5 w-5" />
        </Button>
      </div>

      <div className="relative z-10 flex flex-col lg:flex-row h-[calc(100vh-80px)] overflow-hidden">
        {/* Main Player */}
        <div className={`flex-1 flex flex-col items-center justify-center px-6 pb-8 ${showQueue ? 'lg:pr-0' : ''}`}>
          {/* Album Art */}
          <motion.div
            className="relative w-64 h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 mb-8"
            animate={{ rotate: isPlaying ? 360 : 0 }}
            transition={{ duration: 20, repeat: isPlaying ? Infinity : 0, ease: "linear" }}
          >
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 blur-2xl" />
            <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-primary/30 shadow-2xl">
              {currentSong.cover_url ? (
                <img
                  src={currentSong.cover_url}
                  alt={currentSong.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
                  <Disc className="w-24 h-24 text-primary/50" />
                </div>
              )}
              {/* Vinyl center */}
              <div className="absolute top-1/2 left-1/2 w-16 h-16 bg-background rounded-full transform -translate-x-1/2 -translate-y-1/2 border-4 border-primary/20 flex items-center justify-center">
                <div className="w-4 h-4 rounded-full bg-primary/50" />
              </div>
            </div>
          </motion.div>

          {/* Song Info */}
          <div className="text-center mb-8 max-w-md">
            <motion.h1
              className="text-2xl md:text-3xl font-bold mb-2"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              key={currentSong.id}
            >
              {currentSong.title}
            </motion.h1>
            <motion.p
              className="text-lg text-muted-foreground mb-4"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              {currentSong.artist}
            </motion.p>
            <div className="flex items-center justify-center gap-2">
              {currentSong.genre && (
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  <Music className="w-3 h-3 mr-1" />
                  {currentSong.genre}
                </Badge>
              )}
              {currentSong.year && (
                <Badge variant="outline">{currentSong.year}</Badge>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full max-w-md mb-6">
            <Slider
              value={[currentTime]}
              onValueChange={(value) => seekTo(value[0])}
              max={duration || 100}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-2 font-mono">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Main Controls */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleShuffle}
                className={`h-12 w-12 rounded-full ${isShuffled ? 'text-primary bg-primary/10' : ''}`}
              >
                <Shuffle className="h-5 w-5" />
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button
                variant="ghost"
                size="icon"
                onClick={playPrevious}
                className="h-14 w-14 rounded-full"
              >
                <SkipBack className="h-6 w-6" />
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                size="icon"
                onClick={togglePlayPause}
                className="h-20 w-20 rounded-full bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30"
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={isPlaying ? 'pause' : 'play'}
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 90 }}
                    transition={{ duration: 0.2 }}
                  >
                    {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8 ml-1" />}
                  </motion.div>
                </AnimatePresence>
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button
                variant="ghost"
                size="icon"
                onClick={playNext}
                className="h-14 w-14 rounded-full"
              >
                <SkipForward className="h-6 w-6" />
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleRepeat}
                className={`h-12 w-12 rounded-full ${isRepeating ? 'text-primary bg-primary/10' : ''}`}
              >
                <Repeat className="h-5 w-5" />
              </Button>
            </motion.div>
          </div>

          {/* Volume & Actions */}
          <div className="flex items-center justify-between w-full max-w-md gap-4">
            <div className="flex items-center gap-2 flex-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMute}
                className="h-10 w-10 rounded-full"
              >
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </Button>
              <Slider
                value={[isMuted ? 0 : volume * 100]}
                onValueChange={(value) => setVolume(value[0] / 100)}
                max={100}
                step={1}
                className="w-24"
              />
            </div>

            <div className="flex items-center gap-2">
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleFavorite}
                  className="h-10 w-10 rounded-full"
                >
                  <Heart className={`h-5 w-5 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDownload}
                  className="h-10 w-10 rounded-full"
                >
                  <Download className="h-5 w-5" />
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleShare}
                  className="h-10 w-10 rounded-full"
                >
                  <Share className="h-5 w-5" />
                </Button>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Queue Panel */}
        <AnimatePresence>
          {showQueue && (
            <motion.div
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              className="w-full lg:w-96 bg-card/50 backdrop-blur-xl border-l border-border/50 flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b border-border/50">
                <h2 className="font-semibold">Queue ({playlist.length})</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowQueue(false)}
                  className="lg:hidden"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <ScrollArea className="flex-1">
                <div className="p-4">
                  {/* Now Playing */}
                  <div className="mb-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Now Playing</p>
                    <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-lg">
                      <img
                        src={currentSong.cover_url || '/placeholder.svg'}
                        alt=""
                        className="w-12 h-12 rounded object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{currentSong.title}</p>
                        <p className="text-sm text-muted-foreground truncate">{currentSong.artist}</p>
                      </div>
                      <div className="w-8 h-8 flex items-center justify-center">
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                          className="w-3 h-3 bg-primary rounded-full"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Up Next */}
                  {upcomingSongs.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Up Next</p>
                      <Reorder.Group axis="y" values={playlist} onReorder={handleQueueReorder} className="space-y-2">
                        {upcomingSongs.map((song) => (
                          <Reorder.Item
                            key={song.id}
                            value={song}
                            className="flex items-center gap-3 p-3 bg-card/50 rounded-lg cursor-grab active:cursor-grabbing group"
                          >
                            <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                            <img
                              src={song.cover_url || '/placeholder.svg'}
                              alt=""
                              className="w-10 h-10 rounded object-cover"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{song.title}</p>
                              <p className="text-xs text-muted-foreground truncate">{song.artist}</p>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handlePlayFromQueue(song)}
                              >
                                <Play className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive"
                                onClick={() => handleRemoveFromQueue(song.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </Reorder.Item>
                        ))}
                      </Reorder.Group>
                    </div>
                  )}

                  {upcomingSongs.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <ListMusic className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No more songs in queue</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default Player;
