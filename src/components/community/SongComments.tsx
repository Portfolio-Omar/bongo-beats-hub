import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

interface SongCommentsProps {
  songId: string;
}

const SongComments: React.FC<SongCommentsProps> = ({ songId }) => {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [comment, setComment] = useState('');
  const [showForm, setShowForm] = useState(false);

  const { data: comments } = useQuery({
    queryKey: ['song-comments', songId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('song_comments')
        .select('*')
        .eq('song_id', songId)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    }
  });

  const addComment = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('song_comments')
        .insert({ song_id: songId, name: name.trim(), comment: comment.trim() });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['song-comments', songId] });
      setComment('');
      setName('');
      setShowForm(false);
      toast.success('Comment added!');
    },
    onError: () => toast.error('Failed to add comment')
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !comment.trim()) {
      toast.error('Name and comment are required');
      return;
    }
    addComment.mutate();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <MessageCircle className="h-4 w-4" />
          Comments {comments?.length ? `(${comments.length})` : ''}
        </h3>
        <Button variant="outline" size="sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'Add Comment'}
        </Button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            onSubmit={handleSubmit}
            className="space-y-3 overflow-hidden"
          >
            <Input
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border-border/50"
            />
            <Textarea
              placeholder="Write a comment..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="border-border/50"
            />
            <Button type="submit" size="sm" disabled={addComment.isPending}>
              <Send className="h-3 w-3 mr-1" />
              Post
            </Button>
          </motion.form>
        )}
      </AnimatePresence>

      <ScrollArea className="max-h-64">
        <div className="space-y-3">
          {comments?.map((c) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex gap-3 p-3 rounded-lg bg-muted/30"
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                  {c.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium">{c.name}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {c.created_at ? formatDistanceToNow(new Date(c.created_at), { addSuffix: true }) : ''}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{c.comment}</p>
              </div>
            </motion.div>
          ))}
          {(!comments || comments.length === 0) && (
            <p className="text-sm text-muted-foreground text-center py-4">No comments yet. Be the first!</p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default SongComments;
