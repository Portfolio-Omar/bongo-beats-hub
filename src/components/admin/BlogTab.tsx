
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Plus, Trash2, Eye, Upload, Image } from 'lucide-react';
import { format } from 'date-fns';

interface BlogType {
  id: string;
  title: string;
  content: string;
  date: string;
  status: 'draft' | 'published';
  featured_image_url?: string;
  slug?: string;
}

const BlogTab: React.FC = () => {
  const [newBlog, setNewBlog] = useState<Partial<BlogType>>({ 
    title: '', 
    content: '', 
    status: 'draft' 
  });
  const [blogs, setBlogs] = useState<BlogType[]>([]);
  const [loadingBlogs, setLoadingBlogs] = useState(false);
  const [featuredImage, setFeaturedImage] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [categories] = useState(['History', 'Artists', 'Culture', 'Media', 'General']);
  const [selectedCategory, setSelectedCategory] = useState('General');
  
  // Fetch blogs
  const fetchBlogs = async () => {
    setLoadingBlogs(true);
    try {
      const { data, error } = await supabase
        .from('blogs')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) {
        console.error('Error fetching blogs:', error);
        toast.error('Failed to load blogs');
        throw error;
      }
      
      setBlogs(data as BlogType[]);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoadingBlogs(false);
    }
  };
  
  useEffect(() => {
    fetchBlogs();
  }, []);
  
  // Handle image file change
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Check file size (2MB limit)
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image is too large. Maximum size is 2MB.');
        return;
      }
      setFeaturedImage(file);
    }
  };
  
  // Generate slug from title
  const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };
  
  // Handle blog create/publish
  const handleSaveBlog = async (status: 'draft' | 'published') => {
    if (!newBlog.title || !newBlog.content) {
      toast.error('Please provide a title and content');
      return;
    }
    
    try {
      setUploading(true);
      setUploadProgress(0);
      
      // Start progress simulation
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 5;
        });
      }, 300);
      
      // Generate slug
      const slug = generateSlug(newBlog.title);
      
      // Upload featured image if provided
      let imageUrl = null;
      if (featuredImage) {
        const fileName = `${Date.now()}-${featuredImage.name}`;
        const { error: uploadError } = await supabase
          .storage
          .from('blog-images')
          .upload(fileName, featuredImage, {
            cacheControl: '3600',
            upsert: false
          });
          
        if (uploadError) {
          console.error('Error uploading image:', uploadError);
          toast.error('Failed to upload image');
          throw uploadError;
        }
        
        const { data: imageData } = supabase
          .storage
          .from('blog-images')
          .getPublicUrl(fileName);
          
        imageUrl = imageData.publicUrl;
      }
      
      // Save blog data
      const { data, error } = await supabase
        .from('blogs')
        .insert({
          title: newBlog.title,
          content: newBlog.content,
          date: format(new Date(), 'yyyy-MM-dd'),
          status: status,
          featured_image_url: imageUrl,
          slug: slug
        })
        .select();
        
      if (error) {
        console.error('Error saving blog:', error);
        toast.error('Failed to save blog: ' + error.message);
        throw error;
      }
      
      // Set progress to 100% and clear interval
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Reset form after success
      setTimeout(() => {
        setNewBlog({ title: '', content: '', status: 'draft' });
        setFeaturedImage(null);
        setUploadProgress(0);
        setSelectedCategory('General');
        fetchBlogs();
        toast.success(`Blog ${status === 'published' ? 'published' : 'saved as draft'} successfully`);
      }, 500);
      
    } catch (error) {
      console.error('Blog save error:', error);
      toast.error(`Failed to ${status === 'published' ? 'publish' : 'save'} blog`);
    } finally {
      setUploading(false);
    }
  };
  
  // Delete blog mutation
  const handleDeleteBlog = async (id: string) => {
    try {
      // Get the blog to find if it has a featured image
      const { data: blog } = await supabase
        .from('blogs')
        .select('featured_image_url')
        .eq('id', id)
        .single();
        
      // Delete from storage if image exists
      if (blog?.featured_image_url) {
        const imagePath = blog.featured_image_url.split('/').pop();
        if (imagePath) {
          await supabase.storage.from('blog-images').remove([imagePath]);
        }
      }
      
      // Delete the blog record
      const { error } = await supabase
        .from('blogs')
        .delete()
        .eq('id', id);
        
      if (error) {
        throw error;
      }
      
      fetchBlogs();
      toast.success('Blog deleted successfully');
    } catch (error) {
      console.error('Error deleting blog:', error);
      toast.error('Failed to delete blog');
    }
  };
  
  // Publish blog
  const handlePublishBlog = async (id: string) => {
    try {
      const { error } = await supabase
        .from('blogs')
        .update({ status: 'published' })
        .eq('id', id);
        
      if (error) {
        throw error;
      }
      
      fetchBlogs();
      toast.success('Blog published successfully');
    } catch (error) {
      console.error('Error publishing blog:', error);
      toast.error('Failed to publish blog');
    }
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* Blog Form */}
      <Card className="md:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Create Blog
          </CardTitle>
          <CardDescription>Write and publish blog articles</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="blog-title">Title *</Label>
              <Input
                id="blog-title"
                placeholder="Blog title"
                value={newBlog.title}
                onChange={(e) => setNewBlog({ ...newBlog, title: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="blog-category">Category</Label>
              <Select 
                value={selectedCategory} 
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="blog-image">Featured Image (Optional, Max 2MB)</Label>
              <div className="flex items-center justify-center w-full">
                <label
                  htmlFor="blog-image"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-secondary/50 hover:bg-secondary border-border"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Image className="w-8 h-8 mb-2 text-muted-foreground" />
                    <p className="mb-2 text-sm text-muted-foreground">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground">
                      JPG, PNG, or WEBP (MAX. 2MB)
                    </p>
                  </div>
                  <Input
                    id="blog-image"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </label>
              </div>
              {featuredImage && (
                <p className="text-xs text-muted-foreground mt-2">
                  Selected image: {featuredImage.name} ({(featuredImage.size / (1024 * 1024)).toFixed(2)} MB)
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="blog-content">Content *</Label>
              <Textarea
                id="blog-content"
                placeholder="Write your blog content here..."
                value={newBlog.content}
                onChange={(e) => setNewBlog({ ...newBlog, content: e.target.value })}
                rows={10}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col">
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="w-full mb-4">
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-xs text-center mt-1 text-muted-foreground">
                Uploading: {uploadProgress}%
              </p>
            </div>
          )}
          <div className="flex gap-2 w-full">
            <Button
              className="flex-1"
              variant="outline"
              onClick={() => handleSaveBlog('draft')}
              disabled={uploading}
            >
              Save as Draft
            </Button>
            <Button 
              className="flex-1"
              onClick={() => handleSaveBlog('published')}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                  Publishing...
                </>
              ) : (
                'Publish'
              )}
            </Button>
          </div>
        </CardFooter>
      </Card>
      
      {/* Blog List */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Manage Blogs
          </CardTitle>
          <CardDescription>View and manage all blog posts</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingBlogs ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin h-6 w-6 border-2 border-current border-t-transparent rounded-full mr-2" />
              <span>Loading blogs...</span>
            </div>
          ) : (
            <div className="rounded-md border">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-secondary">
                    <th className="h-10 px-4 text-left font-medium">Title</th>
                    <th className="h-10 px-4 text-left font-medium hidden md:table-cell">Date</th>
                    <th className="h-10 px-4 text-left font-medium">Status</th>
                    <th className="h-10 px-4 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {blogs.length > 0 ? (
                    blogs.map(blog => (
                      <tr key={blog.id} className="border-b hover:bg-secondary/50">
                        <td className="p-4">
                          <div className="flex items-center space-x-3">
                            {blog.featured_image_url && (
                              <div className="h-10 w-10 rounded overflow-hidden bg-secondary">
                                <img 
                                  src={blog.featured_image_url} 
                                  alt={blog.title} 
                                  className="h-full w-full object-cover"
                                />
                              </div>
                            )}
                            <span className={`${blog.featured_image_url ? '' : 'ml-0'}`}>{blog.title}</span>
                          </div>
                        </td>
                        <td className="p-4 hidden md:table-cell">{blog.date}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            blog.status === 'published' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {blog.status.charAt(0).toUpperCase() + blog.status.slice(1)}
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-1">
                          {blog.status === 'draft' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handlePublishBlog(blog.id)}
                            >
                              <Eye className="h-4 w-4 text-primary" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteBlog(blog.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-muted-foreground">
                        No blogs available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BlogTab;
