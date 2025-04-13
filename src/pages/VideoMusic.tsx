
import React, { useState, useRef, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Video, ChevronUp, ChevronDown, VolumeX, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { supabase, rpcFunctions } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { MusicVideo } from '@/types/music-videos';

const VideoMusic: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  // Fetch videos from Supabase
  const { data: videos, isLoading, error } = useQuery({
    queryKey: ['music_videos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('music_videos')
        .select('*')
        .eq('published', true)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching videos:', error);
        toast.error('Failed to load music videos');
        throw error;
      }
      
      return data as MusicVideo[];
    }
  });

  // Filter videos based on search query
  const filteredVideos = videos ? videos.filter(video => 
    video.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    video.artist.toLowerCase().includes(searchQuery.toLowerCase())
  ) : [];

  // Reset current video index when filtered videos change
  useEffect(() => {
    if (filteredVideos.length > 0 && currentVideoIndex >= filteredVideos.length) {
      setCurrentVideoIndex(0);
    }
  }, [filteredVideos, currentVideoIndex]);

  const handleVideoClick = (index: number) => {
    // Pause the currently playing video if any
    if (videoRefs.current[currentVideoIndex]) {
      videoRefs.current[currentVideoIndex]?.pause();
    }

    // Update current video index
    setCurrentVideoIndex(index);
    
    // Play or pause the selected video
    if (videoRefs.current[index]) {
      const video = videoRefs.current[index];
      if (video?.paused) {
        video.play();
        setIsPlaying(true);
      } else {
        video?.pause();
        setIsPlaying(false);
      }
    }
  };

  const togglePlayPause = () => {
    if (!filteredVideos.length) return;
    
    const video = videoRefs.current[currentVideoIndex];
    if (!video) return;
    
    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };
  
  const toggleMute = () => {
    if (!filteredVideos.length) return;
    
    const video = videoRefs.current[currentVideoIndex];
    if (!video) return;
    
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  // Handle video view count
  const handleVideoView = async (videoId: string) => {
    try {
      // Update view count in Supabase
      await rpcFunctions.incrementVideoView(videoId);
    } catch (error) {
      console.error('Error updating view count:', error);
      // Continue without showing error to user
    }
  };

  const handleScroll = (direction: 'up' | 'down') => {
    if (direction === 'up' && currentVideoIndex > 0) {
      setCurrentVideoIndex(currentVideoIndex - 1);
    } else if (direction === 'down' && currentVideoIndex < (filteredVideos.length - 1)) {
      setCurrentVideoIndex(currentVideoIndex + 1);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-secondary/5 to-primary/5"></div>
          <motion.div 
            className="absolute top-1/3 right-1/4 w-96 h-96 rounded-full bg-primary/10 blur-3xl"
            animate={{
              x: [0, 30, 0, -30, 0],
              y: [0, -30, 0, 30, 0],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              repeatType: "loop"
            }}
          />
          <motion.div 
            className="absolute bottom-1/4 left-1/4 w-64 h-64 rounded-full bg-secondary/10 blur-3xl"
            animate={{
              x: [0, -20, 0, 20, 0],
              y: [0, 20, 0, -20, 0],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              repeatType: "loop"
            }}
          />
        </div>

        <div className="text-center mb-12">
          <motion.h1 
            className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Music Videos
          </motion.h1>
          <motion.p 
            className="text-muted-foreground max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Explore our collection of short music videos, swipe up and down to discover more.
          </motion.p>
        </div>

        {/* Search */}
        <motion.div 
          className="mb-8 flex justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by title or artist..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary/50"
            />
          </div>
        </motion.div>

        {/* Video Player Interface */}
        <div className="flex flex-col items-center justify-center">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
              <span className="text-muted-foreground">Loading videos...</span>
            </div>
          ) : filteredVideos.length > 0 ? (
            <div className="relative w-full max-w-md aspect-[9/16] bg-black rounded-lg overflow-hidden shadow-xl">
              {/* Navigation controls */}
              <div className="absolute left-0 right-0 top-4 z-20 flex justify-center pointer-events-none">
                <Button
                  variant="outline" 
                  size="icon" 
                  className="bg-background/50 backdrop-blur-sm pointer-events-auto hover:bg-background/80 transition-colors"
                  onClick={() => handleScroll('up')}
                  disabled={currentVideoIndex === 0}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
              </div>

              <div className="absolute left-0 right-0 bottom-4 z-20 flex justify-center pointer-events-none gap-2">
                <Button
                  variant="outline" 
                  size="icon"
                  className="bg-background/50 backdrop-blur-sm pointer-events-auto hover:bg-background/80 transition-colors"
                  onClick={toggleMute}
                >
                  {isMuted ? (
                    <VolumeX className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </Button>

                <Button
                  variant="outline" 
                  size="icon" 
                  className="bg-background/50 backdrop-blur-sm pointer-events-auto hover:bg-background/80 transition-colors"
                  onClick={() => handleScroll('down')}
                  disabled={currentVideoIndex === filteredVideos.length - 1}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>

              {/* Video info overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-transparent z-10 text-white">
                <h3 className="font-bold text-lg">{filteredVideos[currentVideoIndex]?.title}</h3>
                <p className="text-sm opacity-80">{filteredVideos[currentVideoIndex]?.artist}</p>
                <div className="flex items-center mt-1">
                  <Video className="h-3 w-3 mr-1" />
                  <span className="text-xs">{filteredVideos[currentVideoIndex]?.view_count || 0} views</span>
                </div>
              </div>

              {/* Videos - Only render current video for performance */}
              <AnimatePresence mode="wait">
                {filteredVideos.map((video, index) => (
                  <motion.div 
                    key={video.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: index === currentVideoIndex ? 1 : 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`absolute inset-0 ${index === currentVideoIndex ? 'z-0' : '-z-10'}`}
                  >
                    <video
                      ref={el => { videoRefs.current[index] = el; }}
                      src={video.video_url}
                      poster={video.thumbnail_url || undefined}
                      className="w-full h-full object-cover"
                      loop
                      playsInline
                      muted={isMuted}
                      onClick={() => togglePlayPause()}
                      onPlay={() => {
                        setIsPlaying(true);
                        handleVideoView(video.id);
                      }}
                      onPause={() => setIsPlaying(false)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Play/pause overlay */}
              <div 
                className="absolute inset-0 flex items-center justify-center z-5 cursor-pointer"
                onClick={togglePlayPause}
              >
                {!isPlaying && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="h-16 w-16 bg-background/30 backdrop-blur-sm rounded-full flex items-center justify-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-10 h-10">
                      <path fillRule="evenodd" d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd" />
                    </svg>
                  </motion.div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-16">
              <Video className="h-16 w-16 mx-auto text-muted-foreground opacity-50 mb-4" />
              <h3 className="text-lg font-medium mb-2">No videos found</h3>
              <p className="text-muted-foreground">Try adjusting your search criteria</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default VideoMusic;
