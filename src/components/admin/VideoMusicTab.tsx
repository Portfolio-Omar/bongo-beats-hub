
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Upload, Video, Trash2, Eye, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, rpcFunctions } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { motion } from 'framer-motion';
import { MusicVideo, MusicVideoUpload } from '@/types/music-videos';

const VideoMusicTab: React.FC = () => {
  const queryClient = useQueryClient();
  const [uploadData, setUploadData] = useState<MusicVideoUpload>({
    title: '',
    artist: '',
    video: null,
    thumbnail: null,
  });
  const [isUploading, setIsUploading] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStep, setUploadStep] = useState<'idle' | 'uploading' | 'processing' | 'complete'>('idle');
  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  // Fetch videos from Supabase
  const { data: videos, isLoading } = useQuery({
    queryKey: ['admin_music_videos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('music_videos')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching videos:', error);
        toast.error('Failed to load music videos');
        throw error;
      }
      
      return data as MusicVideo[];
    }
  });

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUploadData(prev => ({ ...prev, [name]: value }));
  };

  // Handle file input changes
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'video' | 'thumbnail') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadData(prev => ({ ...prev, [type]: file }));
    }
  };

  // Handle video upload with progress tracking
  const handleUpload = async () => {
    const { title, artist, video, thumbnail } = uploadData;
    
    if (!title || !artist || !video) {
      toast.error('Please fill in all required fields and select a video');
      return;
    }

    setIsUploading(true);
    setUploadStep('uploading');
    setUploadProgress(0);

    try {
      // Upload video file with progress tracking
      const videoFileName = `${Date.now()}-${video.name}`;
      
      // Create a virtual progress tracker
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev < 80) return prev + Math.random() * 5;
          return prev;
        });
      }, 300);
      
      const { error: videoUploadError, data: videoData } = await supabase.storage
        .from('music_videos')
        .upload(videoFileName, video);

      clearInterval(progressInterval);
      setUploadProgress(80);
      setUploadStep('processing');

      if (videoUploadError) throw videoUploadError;

      // Get video URL
      const { data: videoUrl } = supabase.storage
        .from('music_videos')
        .getPublicUrl(videoFileName);

      // Upload thumbnail if provided
      let thumbnailUrl = null;
      if (thumbnail) {
        const thumbnailFileName = `thumbnails/${Date.now()}-${thumbnail.name}`;
        const { error: thumbnailUploadError, data: thumbnailData } = await supabase.storage
          .from('music_videos')
          .upload(thumbnailFileName, thumbnail);

        if (!thumbnailUploadError) {
          const { data: thumbUrl } = supabase.storage
            .from('music_videos')
            .getPublicUrl(thumbnailFileName);
          thumbnailUrl = thumbUrl.publicUrl;
        }
      }

      setUploadProgress(90);

      // Insert record in database
      const { error: dbError } = await supabase
        .from('music_videos')
        .insert({
          title,
          artist,
          video_url: videoUrl.publicUrl,
          thumbnail_url: thumbnailUrl,
          view_count: 0,
          published: false
        });

      if (dbError) throw dbError;

      setUploadProgress(100);
      setUploadStep('complete');

      // Reset form and refresh data after a short delay to show completion
      setTimeout(() => {
        setUploadData({
          title: '',
          artist: '',
          video: null,
          thumbnail: null,
        });
        if (videoInputRef.current) videoInputRef.current.value = '';
        if (thumbnailInputRef.current) thumbnailInputRef.current.value = '';
        
        queryClient.invalidateQueries({ queryKey: ['admin_music_videos'] });
        toast.success('Music video uploaded successfully');
        setIsUploading(false);
        setUploadStep('idle');
        setUploadProgress(0);
      }, 1000);
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(`Upload failed: ${error.message}`);
      setIsUploading(false);
      setUploadStep('idle');
      setUploadProgress(0);
    }
  };

  // Toggle published status
  const togglePublishedMutation = useMutation({
    mutationFn: async ({ id, published }: { id: string, published: boolean }) => {
      const { error } = await supabase
        .from('music_videos')
        .update({ published })
        .eq('id', id);
      
      if (error) throw error;
      return { id, published };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin_music_videos'] });
      toast.success(`Video ${data.published ? 'published' : 'unpublished'} successfully`);
      
      // Also invalidate the main videos page query
      queryClient.invalidateQueries({ queryKey: ['music_videos'] });
    },
    onError: (error) => {
      console.error('Error updating video:', error);
      toast.error('Failed to update video status');
    }
  });

  // Delete video
  const deleteVideoMutation = useMutation({
    mutationFn: async (id: string) => {
      // Get video URL to delete from storage
      const { data: video, error: fetchError } = await supabase
        .from('music_videos')
        .select('video_url, thumbnail_url')
        .eq('id', id)
        .single();
      
      if (fetchError) throw fetchError;
      
      // Delete from database first
      const { error: dbError } = await supabase
        .from('music_videos')
        .delete()
        .eq('id', id);
      
      if (dbError) throw dbError;
      
      // Extract file paths from URLs
      const videoPath = video.video_url.split('/').pop();
      
      // Delete video from storage
      if (videoPath) {
        await supabase.storage
          .from('music_videos')
          .remove([videoPath]);
      }
      
      // Delete thumbnail if exists
      if (video.thumbnail_url) {
        const thumbnailPath = video.thumbnail_url.split('/').pop();
        if (thumbnailPath) {
          await supabase.storage
            .from('music_videos')
            .remove([`thumbnails/${thumbnailPath}`]);
        }
      }
      
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_music_videos'] });
      queryClient.invalidateQueries({ queryKey: ['music_videos'] });
      toast.success('Video deleted successfully');
      setVideoToDelete(null);
    },
    onError: (error) => {
      console.error('Error deleting video:', error);
      toast.error('Failed to delete video');
      setVideoToDelete(null);
    }
  });
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <motion.div 
        className="bg-card p-6 rounded-lg border space-y-4 relative overflow-hidden"
        variants={itemVariants}
      >
        {/* Background gradients */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full filter blur-2xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-secondary/5 rounded-full filter blur-2xl translate-y-1/2 -translate-x-1/2"></div>
        
        <h3 className="text-lg font-medium flex items-center gap-2">
          <Upload className="h-5 w-5 text-primary" />
          Upload New Music Video
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              name="title"
              value={uploadData.title}
              onChange={handleInputChange}
              placeholder="Enter video title"
              required
              className="transition-all focus:ring-1 focus:ring-primary/30 focus:border-primary/50"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="artist">Artist *</Label>
            <Input
              id="artist"
              name="artist"
              value={uploadData.artist}
              onChange={handleInputChange}
              placeholder="Enter artist name"
              required
              className="transition-all focus:ring-1 focus:ring-primary/30 focus:border-primary/50"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="video">Video File *</Label>
            <div className="flex items-center gap-2">
              <Input
                id="video"
                type="file"
                ref={videoInputRef}
                accept="video/mp4,video/webm,video/quicktime"
                onChange={(e) => handleFileChange(e, 'video')}
                required
                className="flex-1 transition-all focus:ring-1 focus:ring-primary/30 focus:border-primary/50"
                disabled={isUploading}
              />
              {uploadData.video && (
                <div className="text-xs text-muted-foreground">
                  {Math.round(uploadData.video.size / 1024 / 1024 * 10) / 10} MB
                </div>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="thumbnail">Thumbnail (Optional)</Label>
            <Input
              id="thumbnail"
              type="file"
              ref={thumbnailInputRef}
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => handleFileChange(e, 'thumbnail')}
              className="flex-1 transition-all focus:ring-1 focus:ring-primary/30 focus:border-primary/50"
              disabled={isUploading}
            />
          </div>
        </div>
        
        {isUploading && (
          <div className="w-full bg-muted rounded-full h-2 mt-2 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-300 ease-out"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        )}
        
        {isUploading && (
          <div className="flex items-center justify-center">
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              {uploadStep === 'uploading' && (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span>Uploading video... {Math.round(uploadProgress)}%</span>
                </>
              )}
              {uploadStep === 'processing' && (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span>Processing video...</span>
                </>
              )}
              {uploadStep === 'complete' && (
                <>
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Upload complete!</span>
                </>
              )}
            </div>
          </div>
        )}
        
        <div className="pt-2">
          <Button 
            onClick={handleUpload} 
            disabled={isUploading || !uploadData.title || !uploadData.artist || !uploadData.video}
            className="w-full sm:w-auto bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 transition-all"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload Video
              </>
            )}
          </Button>
        </div>
      </motion.div>
      
      <motion.div 
        className="bg-card p-6 rounded-lg border space-y-4"
        variants={itemVariants}
      >
        <h3 className="text-lg font-medium flex items-center gap-2">
          <Video className="h-5 w-5 text-primary" />
          Manage Music Videos
        </h3>
        
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : videos && videos.length > 0 ? (
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Preview</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Artist</TableHead>
                  <TableHead className="text-right">Views</TableHead>
                  <TableHead>Published</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {videos.map((video) => (
                  <TableRow key={video.id} className="transition-colors hover:bg-muted/50">
                    <TableCell>
                      <div className="h-14 w-14 bg-secondary/10 rounded-md overflow-hidden relative">
                        {video.thumbnail_url ? (
                          <img 
                            src={video.thumbnail_url} 
                            alt={video.title} 
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Video className="h-6 w-6 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-muted-foreground" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{video.title}</TableCell>
                    <TableCell>{video.artist}</TableCell>
                    <TableCell className="text-right">{video.view_count}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Switch
                          checked={video.published}
                          onCheckedChange={(checked) => togglePublishedMutation.mutate({ id: video.id, published: checked })}
                          className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-primary data-[state=checked]:to-secondary"
                        />
                        <span className="ml-2 text-xs text-muted-foreground">
                          {video.published ? 'Public' : 'Draft'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          asChild
                          className="hover:text-primary hover:border-primary/50 transition-colors"
                        >
                          <a href={video.video_url} target="_blank" rel="noopener noreferrer">
                            <Eye className="h-4 w-4" />
                          </a>
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => setVideoToDelete(video.id)}
                          className="hover:bg-destructive/90 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8">
            <Video className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-4" />
            <h3 className="text-lg font-medium mb-2">No videos found</h3>
            <p className="text-muted-foreground">Upload your first music video using the form above</p>
          </div>
        )}
      </motion.div>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!videoToDelete} onOpenChange={(open) => !open && setVideoToDelete(null)}>
        <AlertDialogContent className="border border-destructive/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Are you sure?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the music video. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => videoToDelete && deleteVideoMutation.mutate(videoToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
};

export default VideoMusicTab;
