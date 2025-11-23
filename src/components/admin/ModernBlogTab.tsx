import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Trash2, Edit2, Plus, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { BlogEditor } from '@/components/blog/BlogEditor';
import { motion } from 'framer-motion';

const ModernBlogTab: React.FC = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState<any>(null);
  const [blogToDelete, setBlogToDelete] = useState<string | null>(null);

  const { data: blogs, isLoading } = useQuery({
    queryKey: ['blogs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blogs')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) {
        console.error('Error fetching blogs:', error);
        toast.error('Failed to load blogs');
        throw error;
      }
      
      return data;
    }
  });

  const deleteBlogMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data: blog } = await supabase
        .from('blogs')
        .select('featured_image_url')
        .eq('id', id)
        .single();
        
      if (blog?.featured_image_url && blog.featured_image_url.includes('blog-images')) {
        const imagePath = blog.featured_image_url.split('/').pop();
        if (imagePath) {
          await supabase.storage.from('blog-images').remove([imagePath]);
        }
      }
      
      const { error } = await supabase
        .from('blogs')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blogs'] });
      toast.success('Blog deleted successfully');
      setBlogToDelete(null);
    },
    onError: (error) => {
      console.error('Error deleting blog:', error);
      toast.error('Failed to delete blog');
      setBlogToDelete(null);
    }
  });

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['blogs'] });
    setIsDialogOpen(false);
    setEditingBlog(null);
  };

  const handleEdit = (blog: any) => {
    setEditingBlog(blog);
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-heading font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Blog Management
          </h2>
          <p className="text-muted-foreground mt-1">Create and manage blog posts</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Blog Post
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {blogs?.map((blog, index) => (
          <motion.div
            key={blog.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="group relative bg-card rounded-xl overflow-hidden border border-border/40 hover:border-primary/50 transition-all hover:shadow-lg"
          >
            {blog.featured_image_url ? (
              <div className="aspect-video overflow-hidden bg-gradient-to-br from-primary/10 to-secondary/10">
                <img
                  src={blog.featured_image_url}
                  alt={blog.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            ) : (
              <div className="aspect-video bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                <FileText className="h-12 w-12 text-muted-foreground" />
              </div>
            )}
            
            <div className="p-6 space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant={blog.status === 'published' ? 'default' : 'secondary'}>
                  {blog.status}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(blog.date), 'MMM d, yyyy')}
                </span>
              </div>
              
              <h3 className="font-heading font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
                {blog.title}
              </h3>
              
              {blog.excerpt && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {blog.excerpt}
                </p>
              )}
              
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(blog)}
                  className="flex-1"
                >
                  <Edit2 className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setBlogToDelete(blog.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {blogs?.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No blog posts yet</p>
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) setEditingBlog(null);
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingBlog ? 'Edit Blog Post' : 'Create New Blog Post'}</DialogTitle>
          </DialogHeader>
          <BlogEditor
            editingBlog={editingBlog}
            onSuccess={handleSuccess}
            onCancel={() => {
              setIsDialogOpen(false);
              setEditingBlog(null);
            }}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!blogToDelete} onOpenChange={() => setBlogToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Blog Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this blog post? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => blogToDelete && deleteBlogMutation.mutate(blogToDelete)}
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

export default ModernBlogTab;
