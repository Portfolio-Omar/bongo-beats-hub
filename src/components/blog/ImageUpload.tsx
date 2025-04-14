
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface ImageUploadProps {
  imageUrl: string | null;
  onImageChange: (url: string | null) => void;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ imageUrl, onImageChange }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    const fileSize = file.size / 1024 / 1024; // Convert to MB
    
    // Check if file is an image
    if (!file.type.match('image.*')) {
      toast.error('Please select an image file');
      return;
    }
    
    // Check file size (limit to 2MB)
    if (fileSize > 2) {
      toast.error('Image size should not exceed 2MB');
      return;
    }
    
    try {
      setUploading(true);
      setUploadProgress(10);
      
      // Start progress simulation
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return 95;
          }
          return prev + 5;
        });
      }, 100);
      
      const fileName = `${Date.now()}-${file.name}`;
      
      // Check if blog-images bucket exists, create if not
      const { error: bucketError } = await supabase.storage.getBucket('blog-images');
      if (bucketError) {
        // Create bucket if it doesn't exist
        await supabase.storage.createBucket('blog-images', {
          public: true,
        });
      }
      
      // Upload file
      const { error: uploadError } = await supabase
        .storage
        .from('blog-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });
        
      if (uploadError) {
        throw uploadError;
      }
      
      // Get public URL
      const { data } = supabase
        .storage
        .from('blog-images')
        .getPublicUrl(fileName);
        
      if (data) {
        clearInterval(progressInterval);
        setUploadProgress(100);
        onImageChange(data.publicUrl);
        toast.success('Image uploaded successfully');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };
  
  const handleRemoveImage = () => {
    onImageChange(null);
  };
  
  return (
    <div className="space-y-4">
      {imageUrl ? (
        <div className="relative rounded-md overflow-hidden border border-border">
          <img 
            src={imageUrl} 
            alt="Featured" 
            className="w-full h-48 object-cover"
          />
          <Button 
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 bg-background/80 hover:bg-background"
            onClick={handleRemoveImage}
          >
            <X size={18} />
          </Button>
        </div>
      ) : (
        <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
          <div className="flex flex-col items-center">
            <ImageIcon className="h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-muted-foreground mb-4">Upload a featured image (max 2MB)</p>
            <label htmlFor="image-upload">
              <div className="bg-primary text-primary-foreground px-4 py-2 rounded-md cursor-pointer hover:bg-primary/90 inline-flex items-center">
                <Upload className="mr-2 h-4 w-4" />
                <span>Choose Image</span>
              </div>
              <Input
                id="image-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
                disabled={uploading}
              />
            </label>
          </div>
        </div>
      )}
      
      {uploadProgress > 0 && (
        <div className="w-full">
          <div className="h-2 bg-secondary rounded-full">
            <div 
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-xs text-center mt-1 text-muted-foreground">
            {uploadProgress < 100 ? `Uploading: ${uploadProgress}%` : 'Upload Complete'}
          </p>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
