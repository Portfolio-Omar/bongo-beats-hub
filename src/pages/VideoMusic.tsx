import React, { useState, useRef } from 'react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Video, ChevronUp, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { supabase, rpcFunctions } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { MusicVideo } from '@/types/music-videos';

const VideoMusic: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
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
            className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4"
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
              className="pl-10"
            />
          </div>
        </motion.div>

        {/* Video Player Interface */}
        <div className="flex flex-col items-center justify-center">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              <span className="ml-2 text-muted-foreground">Loading videos...</span>
            </div>
          ) : filteredVideos.length > 0 ? (
            <div className="relative w-full max-w-md aspect-[9/16] bg-black rounded-lg overflow-hidden shadow-xl">
              {/* Navigation controls */}
              <div className="absolute left-0 right-0 top-4 z-20 flex justify-center pointer-events-none">
                <Button
                  variant="outline" 
                  size="icon" 
                  className="bg-background/50 backdrop-blur-sm pointer-events-auto"
                  onClick={() => handleScroll('up')}
                  disabled={currentVideoIndex === 0}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
              </div>

              <div className="absolute left-0 right-0 bottom-4 z-20 flex justify-center pointer-events-none">
                <Button
                  variant="outline" 
                  size="icon" 
                  className="bg-background/50 backdrop-blur-sm pointer-events-auto"
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
              {filteredVideos.map((video, index) => (
                <div 
                  key={video.id}
                  className={`absolute inset-0 transition-all duration-500 ${index === currentVideoIndex ? 'opacity-100 z-0' : 'opacity-0 -z-10'}`}
                >
                  <video
                    ref={el => { videoRefs.current[index] = el; }}
                    src={video.video_url}
                    poster={video.thumbnail_url || undefined}
                    className="w-full h-full object-cover"
                    loop
                    playsInline
                    onClick={() => handleVideoClick(index)}
                    onPlay={() => handleVideoView(video.id)}
                  />
                </div>
              ))}
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
