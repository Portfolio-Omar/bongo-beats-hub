
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
import { Loader2, Upload, Video, Trash2, Eye, AlertCircle } from 'lucide-react';
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

interface MusicVideoUpload {
  title: string;
  artist: string;
  video: File | null;
  thumbnail: File | null;
}

interface MusicVideo {
  id: string;
  title: string;
  artist: string;
  video_url: string;
  thumbnail_url: string | null;
  view_count: number;
  published: boolean;
  created_at: string;
}

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

  // Handle video upload
  const handleUpload = async () => {
    const { title, artist, video, thumbnail } = uploadData;
    
    if (!title || !artist || !video) {
      toast.error('Please fill in all required fields and select a video');
      return;
    }

    setIsUploading(true);

    try {
      // Upload video file
      const videoFileName = `${Date.now()}-${video.name}`;
      const { error: videoUploadError, data: videoData } = await supabase.storage
        .from('music_videos')
        .upload(videoFileName, video);

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

      // Reset form and refresh data
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
        <h3 className="text-lg font-medium">Upload New Music Video</h3>
        
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
                className="flex-1"
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
              className="flex-1"
            />
          </div>
        </div>
        
        <div className="pt-2">
          <Button 
            onClick={handleUpload} 
            disabled={isUploading || !uploadData.title || !uploadData.artist || !uploadData.video}
            className="w-full sm:w-auto"
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
        <h3 className="text-lg font-medium mb-4">Manage Music Videos</h3>
        
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
                  <TableRow key={video.id}>
                    <TableCell>
                      <div className="h-14 w-14 bg-secondary rounded-md overflow-hidden relative">
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
                      <Switch
                        checked={video.published}
                        onCheckedChange={(checked) => togglePublishedMutation.mutate({ id: video.id, published: checked })}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          asChild
                        >
                          <a href={video.video_url} target="_blank" rel="noopener noreferrer">
                            <Eye className="h-4 w-4" />
                          </a>
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
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
