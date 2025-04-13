
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
import { Loader2, Upload, Video, Trash2, Eye } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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
import { MusicVideo } from '@/types/music-videos';

const VideoMusicTab: React.FC = () => {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [video, setVideo] = useState<File | null>(null);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState<string | null>(null);
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

  // Handle file input changes
  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setVideo(e.target.files[0]);
    }
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setThumbnail(e.target.files[0]);
    }
  };

  // Simplified video upload
  const handleUpload = async () => {
    if (!title || !artist || !video) {
      toast.error('Please fill in all required fields and select a video');
      return;
    }

    setIsUploading(true);
    toast.info('Uploading video... This may take a few moments');

    try {
      console.log("Starting video upload process");
      
      // 1. Upload video file
      const videoFileName = `${Date.now()}-${video.name}`;
      const { error: videoUploadError } = await supabase.storage
        .from('music_videos')
        .upload(videoFileName, video);

      if (videoUploadError) {
        console.error("Video upload error:", videoUploadError);
        throw videoUploadError;
      }

      console.log("Video uploaded successfully, getting URL");
      
      // 2. Get video URL
      const { data: videoUrl } = supabase.storage
        .from('music_videos')
        .getPublicUrl(videoFileName);

      // 3. Upload thumbnail if provided
      let thumbnailUrl = null;
      if (thumbnail) {
        console.log("Uploading thumbnail");
        const thumbnailFileName = `thumbnails/${Date.now()}-${thumbnail.name}`;
        const { error: thumbnailUploadError } = await supabase.storage
          .from('music_videos')
          .upload(thumbnailFileName, thumbnail);

        if (thumbnailUploadError) {
          console.error("Thumbnail upload error:", thumbnailUploadError);
        } else {
          const { data: thumbUrl } = supabase.storage
            .from('music_videos')
            .getPublicUrl(thumbnailFileName);
          thumbnailUrl = thumbUrl.publicUrl;
          console.log("Thumbnail URL:", thumbnailUrl);
        }
      }

      console.log("Inserting record into database");
      
      // 4. Insert record in database - using RLS policy for admin
      const { error: dbError } = await supabase
        .from('music_videos')
        .insert({
          title,
          artist,
          video_url: videoUrl.publicUrl,
          thumbnail_url: thumbnailUrl,
          view_count: 0,
          published: true // Default to published
        });

      if (dbError) {
        console.error("Database insertion error:", dbError);
        throw dbError;
      }

      console.log("Video upload completed successfully");
      
      // 5. Reset form and refresh data
      setTitle('');
      setArtist('');
      setVideo(null);
      setThumbnail(null);
      if (videoInputRef.current) videoInputRef.current.value = '';
      if (thumbnailInputRef.current) thumbnailInputRef.current.value = '';
      
      queryClient.invalidateQueries({ queryKey: ['admin_music_videos'] });
      queryClient.invalidateQueries({ queryKey: ['music_videos'] });
      
      toast.success('Music video uploaded successfully');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(`Upload failed: ${error.message}`);
    } finally {
      setIsUploading(false);
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
      queryClient.invalidateQueries({ queryKey: ['music_videos'] });
      toast.success(`Video ${data.published ? 'published' : 'unpublished'} successfully`);
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

  return (
    <div className="space-y-6">
      <div className="bg-card p-6 rounded-lg border space-y-4">
        <h3 className="text-lg font-medium flex items-center gap-2">
          <Upload className="h-5 w-5 text-primary" />
          Upload New Music Video
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter video title"
              className="transition-all focus:border-primary"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="artist">Artist *</Label>
            <Input
              id="artist"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder="Enter artist name"
              className="transition-all focus:border-primary"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="video">Video File *</Label>
            <Input
              id="video"
              type="file"
              ref={videoInputRef}
              accept="video/mp4,video/webm,video/quicktime"
              onChange={handleVideoChange}
              className="transition-all focus:border-primary"
              disabled={isUploading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="thumbnail">Thumbnail (Optional)</Label>
            <Input
              id="thumbnail"
              type="file"
              ref={thumbnailInputRef}
              accept="image/jpeg,image/png,image/webp"
              onChange={handleThumbnailChange}
              className="transition-all focus:border-primary"
              disabled={isUploading}
            />
          </div>
        </div>
        
        <div className="pt-2">
          <Button 
            onClick={handleUpload} 
            disabled={isUploading || !title || !artist || !video}
            className="w-full sm:w-auto bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-all"
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
      </div>
      
      <div className="bg-card p-6 rounded-lg border space-y-4">
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
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => window.open(video.video_url, '_blank')}
                          className="hover:text-primary hover:border-primary/50"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => setVideoToDelete(video.id)}
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
      </div>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!videoToDelete} onOpenChange={(open) => !open && setVideoToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the music video. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => videoToDelete && deleteVideoMutation.mutate(videoToDelete)}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default VideoMusicTab;
