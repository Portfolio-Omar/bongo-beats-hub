
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Plus, Trash2, Eye, EyeOff, Calendar, Image } from 'lucide-react';
import { format } from 'date-fns';
import RichTextEditor from '../blog/RichTextEditor';
import ImageUpload from '../blog/ImageUpload';
import TagInput from '../blog/TagInput';
import MarkdownPreview from '../blog/MarkdownPreview';
import CategorySelector from '../blog/CategorySelector';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

interface BlogType {
  id: string;
  title: string;
  content: string;
  rich_content?: any;
  date: string;
  status: 'draft' | 'published';
  featured_image_url?: string | null;
  slug?: string | null;
  tags?: string[] | null;
  category?: string | null;
}

const BlogTab: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('editor');
  const [newBlog, setNewBlog] = useState<Partial<BlogType>>({ 
    title: '', 
    content: '', 
    status: 'draft',
    tags: [],
  });
  const [blogs, setBlogs] = useState<BlogType[]>([]);
  const [loadingBlogs, setLoadingBlogs] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  
  // Generate slug from title
  const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

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
      
      // Generate slug if not provided
      const slug = generateSlug(newBlog.title);
      
      // Save blog data
      const { data, error } = await supabase
        .from('blogs')
        .insert({
          title: newBlog.title,
          content: newBlog.content,
          date: format(new Date(), 'yyyy-MM-dd'),
          status: status,
          featured_image_url: newBlog.featured_image_url || null,
          slug: slug,
          tags: newBlog.tags || [],
        })
        .select();
        
      if (error) {
        console.error('Error saving blog:', error);
        toast.error('Failed to save blog: ' + error.message);
        throw error;
      }
      
      if (data && data[0] && selectedCategory) {
        // Save category relation
        await supabase
          .from('blog_category_relations')
          .insert({
            blog_id: data[0].id,
            category_id: selectedCategory
          });
      }
      
      // Set progress to 100% and clear interval
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Reset form after success
      setTimeout(() => {
        setNewBlog({ title: '', content: '', status: 'draft', tags: [] });
        setSelectedCategory(null);
        setUploadProgress(0);
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
  
  // Delete blog
  const handleDeleteBlog = async (id: string) => {
    try {
      // Get the blog to find if it has a featured image
      const { data: blog } = await supabase
        .from('blogs')
        .select('featured_image_url')
        .eq('id', id)
        .single();
        
      // Delete from storage if image exists and contains blog-images
      if (blog?.featured_image_url && blog.featured_image_url.includes('blog-images')) {
        const imagePath = blog.featured_image_url.split('/').pop();
        if (imagePath) {
          await supabase.storage.from('blog-images').remove([imagePath]);
        }
      }
      
      // Delete category relations
      await supabase
        .from('blog_category_relations')
        .delete()
        .eq('blog_id', id);
        
      // Delete the blog record
      const { error } = await supabase
        .from('blogs')
        .delete()
        .eq('id', id);
        
      if (error) {
        throw error;
      }
      
      setShowDeleteConfirm(null);
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
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="editor">Editor</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>
            
            <TabsContent value="editor" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="blog-title">Title *</Label>
                <Input
                  id="blog-title"
                  placeholder="Blog title"
                  value={newBlog.title || ''}
                  onChange={(e) => setNewBlog({ ...newBlog, title: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="blog-category">Category</Label>
                <CategorySelector 
                  selectedCategory={selectedCategory}
                  onCategoryChange={setSelectedCategory}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Featured Image (Optional, Max 2MB)</Label>
                <ImageUpload
                  imageUrl={newBlog.featured_image_url || null}
                  onImageChange={(url) => setNewBlog({ ...newBlog, featured_image_url: url })}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Tags</Label>
                <TagInput
                  tags={newBlog.tags || []}
                  onChange={(tags) => setNewBlog({ ...newBlog, tags })}
                  placeholder="Add tags and press Enter"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="blog-content">Content *</Label>
                <RichTextEditor
                  value={newBlog.content || ''}
                  onChange={(value) => setNewBlog({ ...newBlog, content: value })}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="preview">
              <div className="border rounded-md p-4">
                {newBlog.title ? (
                  <h1 className="text-2xl font-bold mb-2">{newBlog.title}</h1>
                ) : (
                  <div className="h-8 bg-muted/50 rounded w-2/3 mb-2"></div>
                )}
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <Calendar size={14} />
                  <span>{format(new Date(), 'MMM d, yyyy')}</span>
                  
                  {newBlog.tags && newBlog.tags.length > 0 && (
                    <div className="flex gap-1 ml-2">
                      {newBlog.tags.map((tag, i) => (
                        <span key={i} className="bg-secondary text-xs px-2 py-0.5 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                
                {newBlog.featured_image_url && (
                  <div className="mb-4">
                    <img
                      src={newBlog.featured_image_url}
                      alt="Featured"
                      className="w-full h-48 object-cover rounded-md"
                    />
                  </div>
                )}
                
                {newBlog.content ? (
                  <MarkdownPreview content={newBlog.content} />
                ) : (
                  <div className="space-y-2">
                    <div className="h-4 bg-muted/50 rounded w-full"></div>
                    <div className="h-4 bg-muted/50 rounded w-5/6"></div>
                    <div className="h-4 bg-muted/50 rounded w-4/6"></div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
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
                Saving: {uploadProgress}%
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
                            {blog.featured_image_url ? (
                              <div className="h-10 w-10 rounded overflow-hidden bg-secondary">
                                <img 
                                  src={blog.featured_image_url} 
                                  alt={blog.title} 
                                  className="h-full w-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="h-10 w-10 rounded bg-secondary flex items-center justify-center">
                                <Image className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                            <span className="font-medium">{blog.title}</span>
                          </div>
                        </td>
                        <td className="p-4 hidden md:table-cell">{format(new Date(blog.date), 'MMM d, yyyy')}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            blog.status === 'published' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
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
                              title="Publish"
                            >
                              <Eye className="h-4 w-4 text-primary" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setShowDeleteConfirm(blog.id)}
                            title="Delete"
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
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={!!showDeleteConfirm} onOpenChange={(open) => !open && setShowDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Blog</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this blog? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => showDeleteConfirm && handleDeleteBlog(showDeleteConfirm)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BlogTab;
