
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Heart, MessageSquare, Share2, Play } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import MusicPlayer from './MusicPlayer';

interface Comment {
  id: string;
  name: string;
  comment: string;
  created_at: string;
}

interface Reaction {
  reaction_type: string;
  count: number;
}

interface Song {
  id: string;
  title: string;
  artist: string;
  cover_url: string;
  audio_url: string;
}

const SongOfTheWeek: React.FC = () => {
  const [featuredSong, setFeaturedSong] = useState<Song | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [totalReactions, setTotalReactions] = useState(0);
  const [name, setName] = useState('');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlayerVisible, setIsPlayerVisible] = useState(false);

  useEffect(() => {
    fetchFeaturedSong();
  }, []);

  const fetchFeaturedSong = async () => {
    try {
      setIsLoading(true);
      const { data: songOfWeekData, error: songOfWeekError } = await supabase
        .from('song_of_the_week')
        .select('song_id')
        .eq('active', true)
        .order('feature_date', { ascending: false })
        .limit(1)
        .single();

      if (songOfWeekError) {
        console.error('Error fetching song of the week:', songOfWeekError);
        const { data: randomSong, error: randomSongError } = await supabase
          .from('songs')
          .select('id, title, artist, cover_url, audio_url')
          .eq('published', true)
          .limit(1)
          .single();

        if (randomSongError) {
          console.error('Error fetching random song:', randomSongError);
          setIsLoading(false);
          return;
        }

        setFeaturedSong(randomSong);
        await fetchCommentsAndReactions(randomSong.id);
      } else {
        const { data: songData, error: songError } = await supabase
          .from('songs')
          .select('id, title, artist, cover_url, audio_url')
          .eq('id', songOfWeekData.song_id)
          .single();

        if (songError) {
          console.error('Error fetching song details:', songError);
          setIsLoading(false);
          return;
        }

        setFeaturedSong(songData);
        await fetchCommentsAndReactions(songData.id);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error in fetchFeaturedSong:', error);
      setIsLoading(false);
    }
  };

  const fetchCommentsAndReactions = async (songId: string) => {
    try {
      const { data: commentsData, error: commentsError } = await supabase
        .from('song_comments')
        .select('*')
        .eq('song_id', songId)
        .order('created_at', { ascending: false });

      if (commentsError) {
        console.error('Error fetching comments:', commentsError);
      } else {
        setComments(commentsData);
      }

      // For reaction counts, we need to manually count them
      const { data: reactionsData, error: reactionsError } = await supabase
        .from('song_reactions')
        .select('*')
        .eq('song_id', songId);

      if (reactionsError) {
        console.error('Error fetching reactions:', reactionsError);
      } else {
        // Process the reactions to count by type
        const reactionCounts: Record<string, number> = {};
        reactionsData.forEach(reaction => {
          const type = reaction.reaction_type;
          reactionCounts[type] = (reactionCounts[type] || 0) + 1;
        });
        
        // Convert to array format expected by the component
        const processedReactions = Object.entries(reactionCounts).map(
          ([reaction_type, count]) => ({ reaction_type, count })
        );
        
        setReactions(processedReactions);
        const total = processedReactions.reduce((acc, curr) => acc + curr.count, 0);
        setTotalReactions(total);
      }
    } catch (error) {
      console.error('Error in fetchCommentsAndReactions:', error);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !comment.trim()) {
      toast.error('Please enter your name and comment');
      return;
    }

    if (!featuredSong) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('song_comments')
        .insert({
          song_id: featuredSong.id,
          name,
          comment
        });

      if (error) {
        toast.error('Failed to submit comment');
        console.error('Error submitting comment:', error);
      } else {
        toast.success('Comment submitted successfully');
        setComment('');
        fetchCommentsAndReactions(featuredSong.id);
      }
    } catch (error) {
      console.error('Error in handleCommentSubmit:', error);
      toast.error('An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReaction = async (reactionType: string) => {
    if (!featuredSong) return;

    try {
      const { error } = await supabase
        .from('song_reactions')
        .insert({
          song_id: featuredSong.id,
          name: name || 'Anonymous',
          reaction_type: reactionType
        });

      if (error) {
        toast.error('Failed to add reaction');
        console.error('Error adding reaction:', error);
      } else {
        toast.success('Thanks for your reaction!');
        fetchCommentsAndReactions(featuredSong.id);
      }
    } catch (error) {
      console.error('Error in handleReaction:', error);
      toast.error('An error occurred');
    }
  };

  const toggleMusicPlayer = () => {
    setIsPlayerVisible(!isPlayerVisible);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-pulse text-center">
          <p className="text-muted-foreground">Loading song of the week...</p>
        </div>
      </div>
    );
  }

  if (!featuredSong) {
    return (
      <div className="flex justify-center items-center h-40">
        <p className="text-muted-foreground">No featured song available</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full max-w-4xl mx-auto my-12"
    >
      <h2 className="text-3xl font-bold text-center mb-8">Song of the Week</h2>
      
      <Card className="shadow-lg border-accent/50">
        <CardHeader className="pb-2">
          <div className="flex items-start gap-4">
            <div className="h-24 w-24 rounded-md overflow-hidden relative group">
              <img 
                src={featuredSong.cover_url || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200&q=80'} 
                alt={featuredSong.title} 
                className="h-full w-full object-cover"
              />
              <div 
                className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                onClick={toggleMusicPlayer}
              >
                <Play className="h-12 w-12 text-white" />
              </div>
            </div>
            <div>
              <CardTitle className="text-xl">{featuredSong.title}</CardTitle>
              <CardDescription>{featuredSong.artist}</CardDescription>
              <div className="flex gap-4 mt-2">
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="p-1 h-8 text-red-500 hover:text-red-600 hover:bg-red-100/10"
                  onClick={() => handleReaction('love')}
                >
                  <Heart className="h-5 w-5 mr-1" />
                  <span>{reactions.find(r => r.reaction_type === 'love')?.count || 0}</span>
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="p-1 h-8"
                  onClick={() => handleReaction('comment')}
                >
                  <MessageSquare className="h-5 w-5 mr-1" />
                  <span>{comments.length}</span>
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="p-1 h-8"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    toast.success('Link copied to clipboard!');
                  }}
                >
                  <Share2 className="h-5 w-5 mr-1" />
                  <span>Share</span>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="p-1 h-8"
                  onClick={toggleMusicPlayer}
                >
                  <Play className="h-5 w-5 mr-1" />
                  <span>Play</span>
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        
        {isPlayerVisible && (
          <CardContent className="pt-2 border-t border-border mt-3">
            <div className="mt-4">
              <MusicPlayer
                song={{
                  id: featuredSong.id,
                  title: featuredSong.title,
                  artist: featuredSong.artist,
                  coverUrl: featuredSong.cover_url || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200&q=80',
                  audioUrl: featuredSong.audio_url
                }}
              />
            </div>
          </CardContent>
        )}
        
        <CardContent className={`pt-2 ${isPlayerVisible ? 'mt-4' : ''}`}>
          <div className="mt-4">
            <div className="flex flex-col gap-1">
              <h3 className="text-sm font-medium">Fan Reactions</h3>
              {totalReactions > 0 ? (
                reactions.map((reaction) => (
                  <div key={reaction.reaction_type} className="flex items-center gap-2 mb-1">
                    <span className="text-xs w-16">{reaction.reaction_type}</span>
                    <Progress 
                      value={(reaction.count / totalReactions) * 100} 
                      className="h-2" 
                      indicatorClassName={
                        reaction.reaction_type === 'love' ? 'bg-red-500' : 
                        reaction.reaction_type === 'fire' ? 'bg-orange-500' : 
                        'bg-blue-500'
                      }
                    />
                    <span className="text-xs">{reaction.count}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Be the first to react!</p>
              )}
            </div>
            
            <div className="mt-6">
              <h3 className="text-sm font-medium mb-3">Add Your Comment</h3>
              <form onSubmit={handleCommentSubmit}>
                <div className="space-y-3">
                  <Input
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full"
                    required
                  />
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Add a comment..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="flex-grow"
                      required
                    />
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Posting...' : 'Post'}
                    </Button>
                  </div>
                </div>
              </form>
            </div>
            
            <div className="mt-6 space-y-4">
              <h3 className="text-sm font-medium mb-2">Comments ({comments.length})</h3>
              {comments.length > 0 ? (
                comments.map((comment) => (
                  <div key={comment.id} className="border-b border-border pb-3">
                    <div className="flex justify-between">
                      <h4 className="font-medium">{comment.name}</h4>
                      <span className="text-xs text-muted-foreground">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm mt-1">{comment.comment}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No comments yet. Be the first to comment!</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default SongOfTheWeek;
