import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageCircle, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface BlogComment {
  id: string;
  blog_id: string;
  user_id: string;
  name: string;
  comment: string;
  created_at: string;
}

interface BlogCommentsProps {
  blogId: string;
}

const BlogComments: React.FC<BlogCommentsProps> = ({ blogId }) => {
  const { user, isAuthenticated } = useAuth();
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [blogId]);

  const fetchComments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('blog_comments')
      .select('*')
      .eq('blog_id', blogId)
      .order('created_at', { ascending: false });

    if (!error && data) setComments(data as BlogComment[]);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated || !user) {
      toast.error('Please sign in to comment');
      return;
    }
    const trimmed = newComment.trim();
    if (!trimmed || trimmed.length > 1000) {
      toast.error('Comment must be 1-1000 characters');
      return;
    }

    setSubmitting(true);
    const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';

    const { error } = await supabase.from('blog_comments').insert({
      blog_id: blogId,
      user_id: user.id,
      name,
      comment: trimmed,
    });

    if (error) {
      toast.error('Failed to post comment');
    } else {
      toast.success('Comment posted!');
      setNewComment('');
      fetchComments();
    }
    setSubmitting(false);
  };

  const handleDelete = async (commentId: string) => {
    const { error } = await supabase.from('blog_comments').delete().eq('id', commentId);
    if (!error) {
      setComments(prev => prev.filter(c => c.id !== commentId));
      toast.success('Comment deleted');
    }
  };

  return (
    <div className="mt-10 border-t border-border pt-8">
      <h3 className="text-2xl font-heading font-bold mb-6 flex items-center gap-2">
        <MessageCircle className="h-6 w-6 text-primary" />
        Comments ({comments.length})
      </h3>

      {/* Comment Form */}
      {isAuthenticated ? (
        <form onSubmit={handleSubmit} className="mb-8">
          <Textarea
            placeholder="Share your thoughts on this article..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            maxLength={1000}
            className="mb-3 min-h-[100px] resize-none"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{newComment.length}/1000</span>
            <Button type="submit" disabled={submitting || !newComment.trim()} size="sm">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Post Comment
            </Button>
          </div>
        </form>
      ) : (
        <div className="bg-muted/50 rounded-lg p-4 mb-8 text-center">
          <p className="text-muted-foreground text-sm">Sign in to join the conversation</p>
        </div>
      )}

      {/* Comments List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No comments yet. Be the first to share your thoughts!</p>
      ) : (
        <div className="space-y-5">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-3 group">
              <Avatar className="h-9 w-9 shrink-0">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                  {c.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm">{c.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(c.created_at), 'MMM d, yyyy · h:mm a')}
                  </span>
                </div>
                <p className="text-sm text-foreground/90 whitespace-pre-wrap break-words">{c.comment}</p>
              </div>
              {user?.id === c.user_id && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 shrink-0"
                  onClick={() => handleDelete(c.id)}
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BlogComments;
