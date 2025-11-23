import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImageUpload } from './ImageUpload';
import { RichTextEditor } from './RichTextEditor';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Save, Eye } from 'lucide-react';

interface BlogEditorProps {
  onSuccess?: () => void;
  editingBlog?: any;
  onCancel?: () => void;
}

export const BlogEditor: React.FC<BlogEditorProps> = ({ onSuccess, editingBlog, onCancel }) => {
  const [title, setTitle] = useState(editingBlog?.title || '');
  const [excerpt, setExcerpt] = useState(editingBlog?.excerpt || '');
  const [content, setContent] = useState(editingBlog?.content || '');
  const [featuredImage, setFeaturedImage] = useState(editingBlog?.featured_image_url || '');
  const [status, setStatus] = useState(editingBlog?.status || 'draft');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error('Title and content are required');
      return;
    }

    setIsSubmitting(true);

    try {
      const blogData = {
        title,
        excerpt: excerpt || '',
        content,
        featured_image_url: featuredImage,
        status,
        date: new Date().toISOString(),
      };

      if (editingBlog) {
        const { error } = await supabase
          .from('blogs')
          .update(blogData)
          .eq('id', editingBlog.id);

        if (error) throw error;
        toast.success('Blog updated successfully');
      } else {
        const { error } = await supabase
          .from('blogs')
          .insert([blogData]);

        if (error) throw error;
        toast.success('Blog created successfully');
      }

      if (onSuccess) onSuccess();
      
      // Reset form if creating new
      if (!editingBlog) {
        setTitle('');
        setExcerpt('');
        setContent('');
        setFeaturedImage('');
        setStatus('draft');
      }
    } catch (error) {
      console.error('Error saving blog:', error);
      toast.error('Failed to save blog');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{editingBlog ? 'Edit Blog Post' : 'Create New Blog Post'}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter blog title"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="excerpt">Short Description</Label>
          <Textarea
            id="excerpt"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="A brief description of your blog post"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label>Featured Image</Label>
          <ImageUpload
            imageUrl={featuredImage || null}
            onImageChange={setFeaturedImage}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="content">Content *</Label>
          <RichTextEditor
            value={content}
            onChange={setContent}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {editingBlog ? 'Update' : 'Publish'}
              </>
            )}
          </Button>
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
