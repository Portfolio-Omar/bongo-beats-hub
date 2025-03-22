import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { 
  Music, Lock, Upload, FileText, BarChart3, 
  MessageSquare, Plus, Trash2, Calendar, Eye, Edit,
  ListMusic, Users, Save, Mail, Download
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import FeedbackTab from '@/components/admin/FeedbackTab';

interface SongType {
  id: string;
  title: string;
  artist: string;
  genre: string | null;
  year: string | null;
  audio_url?: string;
  cover_url?: string | null;
  published: boolean;
}

interface BlogType {
  id: string;
  title: string;
  content: string;
  date: string;
  status: 'draft' | 'published';
}

interface PollType {
  id: string;
  title: string;
  description: string;
  options: string[];
  startDate: string;
  endDate: string;
  status: 'draft' | 'scheduled' | 'active' | 'ended';
}

interface MessageType {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  date: string;
  read: boolean;
}

// Admin Login Component
const AdminLogin: React.FC = () => {
  const [pin, setPin] = useState('');
  const { authenticateAdmin } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await authenticateAdmin(pin);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <motion.div 
          className="max-w-md mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card>
            <CardHeader className="space-y-1">
              <div className="flex items-center justify-center mb-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Lock className="h-6 w-6 text-primary" />
                </div>
              </div>
              <CardTitle className="text-2xl font-display text-center">Admin Access</CardTitle>
              <CardDescription className="text-center">
                Enter your PIN to access the admin panel
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pin">PIN</Label>
                    <Input
                      id="pin"
                      type="password"
                      placeholder="Enter your PIN"
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <span className="flex items-center">
                        <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                        Authenticating...
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <Lock className="mr-2 h-4 w-4" />
                        Login
                      </span>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
            <CardFooter className="border-t border-border pt-6">
              <p className="text-xs text-center text-muted-foreground w-full">
                This area is restricted to administrators only. If you need access, please contact the site owner.
              </p>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </Layout>
  );
};

// Admin Dashboard Component
const AdminDashboard: React.FC = () => {
  const { logout } = useAuth();
  const queryClient = useQueryClient();
  
  // New item states
  const [newSong, setNewSong] = useState<Partial<SongType>>({ 
    title: '', 
    artist: '', 
    genre: '', 
    year: '', 
    published: false 
  });
  const [newBlog, setNewBlog] = useState<Partial<BlogType>>({ title: '', content: '', status: 'draft' });
  const [newPoll, setNewPoll] = useState<Partial<PollType>>({
    title: '',
    description: '',
    options: ['', ''],
    startDate: '',
    endDate: '',
    status: 'draft'
  });
  
  // Selected item states
  const [selectedMessage, setSelectedMessage] = useState<MessageType | null>(null);
  
  // File upload state
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Fetch songs from Supabase
  const { data: songs = [], isLoading: loadingSongs, refetch: refetchSongs } = useQuery({
    queryKey: ['admin-songs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('songs')
        .select('*');
      
      if (error) {
        console.error('Error fetching songs:', error);
        toast.error('Failed to load songs');
        throw error;
      }
      
      return data as SongType[];
    }
  });
  
  // Fetch blogs from Supabase
  const { data: blogs = [], isLoading: loadingBlogs, refetch: refetchBlogs } = useQuery({
    queryKey: ['admin-blogs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blogs')
        .select('*');
      
      if (error) {
        console.error('Error fetching blogs:', error);
        toast.error('Failed to load blogs');
        throw error;
      }
      
      return data as BlogType[];
    }
  });
  
  // Fetch polls from Supabase
  const { data: polls = [], isLoading: loadingPolls, refetch: refetchPolls } = useQuery({
    queryKey: ['admin-polls'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('polls')
        .select('*');
      
      if (error) {
        console.error('Error fetching polls:', error);
        toast.error('Failed to load polls');
        throw error;
      }
      
      const formattedPolls = await Promise.all(data.map(async (poll) => {
        const { data: options } = await supabase
          .from('poll_options')
          .select('text')
          .eq('poll_id', poll.id);
          
        return {
          ...poll,
          options: options?.map(opt => opt.text) || [],
          startDate: poll.start_date,
          endDate: poll.end_date,
          status: poll.status,
        };
      }));
      
      return formattedPolls as unknown as PollType[];
    }
  });
  
  // Fetch messages from Supabase
  const { data: messages = [], isLoading: loadingMessages, refetch: refetchMessages } = useQuery({
    queryKey: ['admin-messages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*');
      
      if (error) {
        console.error('Error fetching messages:', error);
        toast.error('Failed to load messages');
        throw error;
      }
      
      return data as MessageType[];
    }
  });
  
  // Delete song mutation
  const deleteSongMutation = useMutation({
    mutationFn: async (id: string) => {
      // Get the song to find audio and cover URLs
      const { data: song } = await supabase
        .from('songs')
        .select('audio_url, cover_url')
        .eq('id', id)
        .single();
        
      // Delete from storage if files exist
      if (song) {
        if (song.audio_url) {
          const audioPath = song.audio_url.split('/').pop();
          if (audioPath) {
            await supabase.storage.from('music').remove([audioPath]);
          }
        }
        
        if (song.cover_url) {
          const coverPath = song.cover_url.split('/').pop();
          if (coverPath) {
            await supabase.storage.from('covers').remove([coverPath]);
          }
        }
      }
      
      // Delete the song record
      const { error } = await supabase
        .from('songs')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-songs'] });
      toast.success('Song deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting song:', error);
      toast.error('Failed to delete song');
    }
  });
  
  // Toggle song publish status mutation
  const toggleSongPublishStatusMutation = useMutation({
    mutationFn: async ({ id, published }: { id: string, published: boolean }) => {
      const { error } = await supabase
        .from('songs')
        .update({ published })
        .eq('id', id);
        
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-songs'] });
      toast.success(`Song ${variables.published ? 'published' : 'unpublished'} successfully`);
    },
    onError: (error) => {
      console.error('Error updating song publish status:', error);
      toast.error('Failed to update song status');
    }
  });
  
  // Delete blog mutation
  const deleteBlogMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('blogs')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blogs'] });
      toast.success('Blog deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting blog:', error);
      toast.error('Failed to delete blog');
    }
  });
  
  // Publish blog mutation
  const publishBlogMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('blogs')
        .update({ status: 'published' })
        .eq('id', id);
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blogs'] });
      toast.success('Blog published successfully');
    },
    onError: (error) => {
      console.error('Error publishing blog:', error);
      toast.error('Failed to publish blog');
    }
  });
  
  // Delete poll mutation
  const deletePollMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('polls')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-polls'] });
      toast.success('Poll deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting poll:', error);
      toast.error('Failed to delete poll');
    }
  });
  
  // Mark message as read mutation
  const markMessageAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('messages')
        .update({ read: true })
        .eq('id', id);
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-messages'] });
    },
    onError: (error) => {
      console.error('Error marking message as read:', error);
    }
  });
  
  // Delete message mutation
  const deleteMessageMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-messages'] });
      setSelectedMessage(null);
      toast.success('Message deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
    }
  });
  
  // Handle song upload
  const handleSongUpload = async () => {
    if (!newSong.title || !newSong.artist) {
      toast.error('Please provide at least a title and artist');
      return;
    }
    
    if (!audioFile) {
      toast.error('Please select an audio file');
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
      
      console.log('Uploading audio file:', audioFile.name);
      // Upload audio file to Supabase Storage
      const audioFileName = `${Date.now()}-${audioFile.name}`;
      const { data: audioData, error: audioError } = await supabase
        .storage
        .from('music')
        .upload(audioFileName, audioFile, {
          cacheControl: '3600',
          upsert: false
        });
        
      if (audioError) {
        console.error('Audio upload error:', audioError);
        throw audioError;
      }
      
      console.log('Audio uploaded successfully:', audioData);
      
      // Get public URL for audio
      const { data: audioUrl } = supabase
        .storage
        .from('music')
        .getPublicUrl(audioFileName);
        
      console.log('Audio URL:', audioUrl);
      
      // Upload cover image if provided
      let coverUrl = null;
      if (coverFile) {
        console.log('Uploading cover file:', coverFile.name);
        const coverFileName = `${Date.now()}-${coverFile.name}`;
        const { data: coverData, error: coverError } = await supabase
          .storage
          .from('covers')
          .upload(coverFileName, coverFile, {
            cacheControl: '3600',
            upsert: false
          });
          
        if (coverError) {
          console.error('Error uploading cover image:', coverError);
        } else {
          console.log('Cover uploaded successfully:', coverData);
          const { data: coverUrlData } = supabase
            .storage
            .from('covers')
            .getPublicUrl(coverFileName);
            
          coverUrl = coverUrlData.publicUrl;
          console.log('Cover URL:', coverUrl);
        }
      }
      
      console.log('Saving song data to database');
      // Save song data to Supabase
      const { data, error } = await supabase
        .from('songs')
        .insert({
          title: newSong.title,
          artist: newSong.artist,
          genre: newSong.genre || null,
          year: newSong.year || null,
          cover_url: coverUrl,
          audio_url: audioUrl.publicUrl,
          duration: '00:00', // This would ideally be calculated from the audio file
          published: newSong.published || false
        });
        
      if (error) {
        console.error('Database insert error:', error);
        throw error;
      }
      
      console.log('Song saved successfully:', data);
      
      // Set progress to 100% and clear interval
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Reset form after a short delay
      setTimeout(() => {
        setNewSong({ title: '', artist: '', genre: '', year: '', published: false });
        setAudioFile(null);
        setCoverFile(null);
        setUploadProgress(0);
        refetchSongs();
        toast.success('Song uploaded successfully');
      }, 500);
      
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('Failed to upload song: ' + (error.message || 'Unknown error'));
    } finally {
      setUploading(false);
    }
  };
  
  // Handle blog create/publish
  const handleSaveBlog = async (status: 'draft' | 'published') => {
    if (!newBlog.title || !newBlog.content) {
      toast.error('Please provide a title and content');
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('blogs')
        .insert({
          title: newBlog.title,
          content: newBlog.content,
          date: new Date().toISOString().split('T')[0],
          status: status
        });
        
      if (error) {
        throw error;
      }
      
      setNewBlog({ title: '', content: '', status: 'draft' });
      refetchBlogs();
      
      toast.success(`Blog ${status === 'published' ? 'published' : 'saved as draft'} successfully`);
    } catch (error) {
      console.error('Blog save error:', error);
      toast.error(`Failed to ${status === 'published' ? 'publish' : 'save'} blog`);
    }
  };
  
  // Handle poll option change
  const handlePollOptionChange = (index: number, value: string) => {
    const updatedOptions = [...(newPoll.options || [])];
    updatedOptions[index] = value;
    setNewPoll({ ...newPoll, options: updatedOptions });
  };
  
  // Handle add poll option
  const handleAddPollOption = () => {
    if ((newPoll.options?.length || 0) >= 6) {
      toast.error('Maximum 6 options allowed');
      return;
    }
    setNewPoll({ 
      ...newPoll, 
      options: [...(newPoll.options || []), ''] 
    });
  };
  
  // Handle remove poll option
  const handleRemovePollOption = (index: number) => {
    if ((newPoll.options?.length || 0) <= 2) {
      toast.error('Minimum 2 options required');
      return;
    }
    const updatedOptions = [...(newPoll.options || [])];
    updatedOptions.splice(index, 1);
    setNewPoll({ ...newPoll, options: updatedOptions });
  };
  
  // Handle poll create
  const handleCreatePoll = async (status: 'draft' | 'scheduled') => {
    if (!newPoll.title || !newPoll.description || !newPoll.startDate || !newPoll.endDate) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    if ((newPoll.options?.filter(o => o.trim() !== '').length || 0) < 2) {
      toast.error('Please provide at least 2 valid options');
      return;
    }
    
    try {
      // Insert poll
      const { data: pollData, error: pollError } = await supabase
        .from('polls')
        .insert({
          title: newPoll.title,
          description: newPoll.description,
          start_date: newPoll.startDate,
          end_date: newPoll.endDate,
          status: status
        })
        .select();
        
      if (pollError) {
        throw pollError;
      }
      
      if (pollData && pollData.length > 0) {
        const pollId = pollData[0].id;
        
        // Insert poll options
        const options = (newPoll.options || []).filter(opt => opt.trim() !== '');
        const optionsToInsert = options.map(text => ({
          poll_id: pollId,
          text: text
        }));
        
        const { error: optionsError } = await supabase
          .from('poll_options')
          .insert(optionsToInsert);
          
        if (optionsError) {
          throw optionsError;
        }
      }
      
      // Reset form
      setNewPoll({
        title: '',
        description: '',
        options: ['', ''],
        startDate: '',
        endDate: '',
        status: 'draft'
      });
      
      refetchPolls();
      
      toast.success(`Poll ${status === 'scheduled' ? 'scheduled' : 'saved as draft'} successfully`);
    } catch (error) {
      console.error('Poll create error:', error);
      toast.error(`Failed to ${status === 'scheduled' ? 'schedule' : 'save'} poll`);
    }
  };
  
  // File input change handlers
  const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Audio file is too large. Maximum size is 10MB.');
        return;
      }
      setAudioFile(file);
    }
  };
  
  const handleCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Check file size (2MB limit)
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Cover image is too large. Maximum size is 2MB.');
        return;
      }
      setCoverFile(file);
    }
  };
  
  // Handle message click
  const handleMessageClick = (message: MessageType) => {
    setSelectedMessage(message);
    if (!message.read) {
      markMessageAsReadMutation.mutate(message.id);
    }
  };
  
  // Dashboard stats
  const stats = [
    { title: 'Total Songs', value: songs.length, icon: <Music className="h-5 w-5 text-primary" /> },
    { title: 'Published Blogs', value: blogs.filter(b => b.status === 'published').length, icon: <FileText className="h-5 w-5 text-primary" /> },
    { title: 'Active Polls', value: polls.filter(p => p.status === 'active').length, icon: <BarChart3 className="h-5 w-5 text-primary" /> },
    { title: 'Unread Messages', value: messages.filter(m => !m.read).length, icon: <MessageSquare className="h-5 w-5 text-primary" /> },
  ];
  
  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <motion.div 
          className="flex flex-col-reverse md:flex-row justify-between items-start md:items-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-display font-bold mt-4 md:mt-0">Admin Dashboard</h1>
          <Button variant="outline" onClick={logout}>Logout</Button>
        </motion.div>
        
        {/* Stats Cards */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardContent className="flex items-center justify-between p-6">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
                </div>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  {stat.icon}
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>
        
        {/* Admin Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Tabs defaultValue="songs" className="w-full">
            <TabsList className="grid grid-cols-5 w-full mb-8">
              <TabsTrigger value="songs" className="flex items-center gap-2">
                <Music className="h-4 w-4" />
                <span className="hidden sm:inline">Songs</span>
              </TabsTrigger>
              <TabsTrigger value="blogs" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Blogs</span>
              </TabsTrigger>
              <TabsTrigger value="polls" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Polls</span>
              </TabsTrigger>
              <TabsTrigger value="messages" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline">Messages</span>
              </TabsTrigger>
              <TabsTrigger value="feedback" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline">Feedback</span>
              </TabsTrigger>
            </TabsList>
            
            {/* Songs Tab */}
            <TabsContent value="songs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Upload Form */}
                <Card className="md:col-span-1">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Upload className="h-5 w-5" />
                      Upload Song
                    </CardTitle>
                    <CardDescription>Add new songs to the platform</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="song-title">Title *</Label>
                        <Input
                          id="song-title"
                          placeholder="Song title"
                          value={newSong.title}
                          onChange={(e) => setNewSong({ ...newSong, title: e.target.value })}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="song-artist">Artist *</Label>
                        <Input
                          id="song-artist"
                          placeholder="Artist name"
                          value={newSong.artist}
                          onChange={(e) => setNewSong({ ...newSong, artist: e.target.value })}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="song-genre">Genre</Label>
                        <Input
                          id="song-genre"
                          placeholder="Genre"
                          value={newSong.genre || ''}
                          onChange={(e) => setNewSong({ ...newSong, genre: e.target.value })}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="song-year">Year</Label>
                        <Input
                          id="song-year"
                          placeholder="Year"
                          value={newSong.year || ''}
                          onChange={(e) => setNewSong({ ...newSong, year: e.target.value })}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="audio-file">Audio File * (Max 10MB)</Label>
                        <div className="flex items-center justify-center w-full">
                          <label
                            htmlFor="audio-file"
                            className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-secondary/50 hover:bg-secondary border-border"
                          >
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                              <p className="mb-2 text-sm text-muted-foreground">
                                <span className="font-semibold">Click to upload</span> or drag and drop
                              </p>
                              <p className="text-xs text-muted-foreground">
                                MP3, WAV, OGG, or FLAC (MAX. 10MB)
                              </p>
                            </div>
                            <Input
                              id="audio-file"
                              type="file"
                              accept="audio/*"
                              className="hidden"
                              onChange={handleAudioFileChange}
                            />
                          </label>
                        </div>
                        {audioFile && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Selected file: {audioFile.name} ({(audioFile.size / (1024 * 1024)).toFixed(2)} MB)
                          </p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="cover-file">Cover Image (Optional, Max 2MB)</Label>
                        <div className="flex items-center justify-center w-full">
                          <label
                            htmlFor="cover-file"
                            className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-secondary/50 hover:bg-secondary border-border"
                          >
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                              <p className="mb-2 text-sm text-muted-foreground">
                                <span className="font-semibold">Click to upload</span> or drag and drop
                              </p>
                              <p className="text-xs text-muted-foreground">
                                JPG, PNG, or WEBP (MAX. 2MB)
                              </p>
                            </div>
                            <Input
                              id="cover-file"
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleCoverFileChange}
                            />
                          </label>
                        </div>
                        {coverFile && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Selected file: {coverFile.name} ({(coverFile.size / (1024 * 1024)).toFixed(2)} MB)
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="publish-now" 
                          checked={newSong.published}
                          onCheckedChange={(checked) => setNewSong({ ...newSong, published: checked as boolean })}
                        />
                        <Label htmlFor="publish-now">Publish immediately after upload</Label>
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
                    <Button 
                      className="w-full" 
                      onClick={handleSongUpload} 
                      disabled={uploading || !audioFile}
                    >
                      {uploading ? (
                        <>
                          <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Upload Song
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
                
                {/* Song List */}
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ListMusic className="h-5 w-5" />
                      Manage Songs
                    </CardTitle>
                    <CardDescription>View and manage the song collection</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingSongs ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="animate-spin h-6 w-6 border-2 border-current border-t-transparent rounded-full mr-2" />
                        <span>Loading songs...</span>
                      </div>
                    ) : (
                      <div className="rounded-md border">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b bg-secondary">
                              <th className="h-10 px-4 text-left font-medium">Title</th>
                              <th className="h-10 px-4 text-left font-medium">Artist</th>
                              <th className="h-10 px-4 text-left font-medium hidden md:table-cell">Genre</th>
                              <th className="h-10 px-4 text-left font-medium hidden md:table-cell">Year</th>
                              <th className="h-10 px-4 text-left font-medium">Status</th>
                              <th className="h-10 px-4 text-right font-medium">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {songs.length > 0 ? (
                              songs.map(song => (
                                <tr key={song.id} className="border-b hover:bg-secondary/50">
                                  <td className="p-4">{song.title}</td>
                                  <td className="p-4">{song.artist}</td>
                                  <td className="p-4 hidden md:table-cell">{song.genre || '-'}</td>
                                  <td className="p-4 hidden md:table-cell">{song.year || '-'}</td>
                                  <td className="p-4">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                      song.published 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                      {song.published ? 'Published' : 'Draft'}
                                    </span>
                                  </td>
                                  <td className="p-4 text-right flex justify-end items-center space-x-1">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => toggleSongPublishStatusMutation.mutate({ 
                                        id: song.id, 
                                        published: !song.published 
                                      })}
                                      disabled={toggleSongPublishStatusMutation.isPending}
                                      title={song.published ? "Unpublish" : "Publish"}
                                    >
                                      <Eye className={`h-4 w-4 ${song.published ? 'text-green-600' : 'text-yellow-600'}`} />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => {
                                        if (song.audio_url) {
                                          const link = document.createElement('a');
                                          link.href = song.audio_url;
                                          link.download = `${song.title} - ${song.artist}.mp3`;
                                          document.body.appendChild(link);
                                          link.click();
                                          document.body.removeChild(link);
                                        }
                                      }}
                                      disabled={!song.audio_url}
                                    >
                                      <Download className="h-4 w-4 text-primary" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => deleteSongMutation.mutate(song.id)}
                                      disabled={deleteSongMutation.isPending}
                                    >
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={6} className="p-4 text-center text-muted-foreground">
                                  No songs available
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
            </TabsContent>
            
            {/* Blogs Tab */}
            <TabsContent value="blogs">
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
                  <CardFooter className="flex gap-2">
                    <Button
                      className="flex-1"
                      variant="outline"
                      onClick={() => handleSaveBlog('draft')}
                    >
                      Save as Draft
                    </Button>
                    <Button 
                      className="flex-1"
                      onClick={() => handleSaveBlog('published')}
                    >
                      Publish
                    </Button>
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
                                  <td className="p-4">{blog.title}</td>
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
                                        onClick={() => publishBlogMutation.mutate(blog.id)}
                                        disabled={publishBlogMutation.isPending}
                                      >
                                        <Eye className="h-4 w-4 text-primary" />
                                      </Button>
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => deleteBlogMutation.mutate(blog.id)}
                                      disabled={deleteBlogMutation.isPending}
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
            </TabsContent>
            
            {/* Polls Tab */}
            <TabsContent value="polls">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Poll Form */}
                <Card className="md:col-span-1">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Create Poll
                    </CardTitle>
                    <CardDescription>Create and schedule community polls</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="poll-title">Title *</Label>
                        <Input
                          id="poll-title"
                          placeholder="Poll title"
                          value={newPoll.title}
                          onChange={(e) => setNewPoll({ ...newPoll, title: e.target.value })}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="poll-description">Description *</Label>
                        <Textarea
                          id="poll-description"
                          placeholder="Brief description of the poll"
                          value={newPoll.description}
                          onChange={(e) => setNewPoll({ ...newPoll, description: e.target.value })}
                          rows={3}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Options *</Label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleAddPollOption}
                            className="h-8 text-xs"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add Option
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {newPoll.options?.map((option, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <Input
                                placeholder={`Option ${index + 1}`}
                                value={option}
                                onChange={(e) => handlePollOptionChange(index, e.target.value)}
                              />
                              {newPoll.options && newPoll.options.length > 2 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRemovePollOption(index)}
                                  className="h-8 w-8"
                                >
                                  <Trash2 className="h-3 w-3 text-destructive" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="poll-start-date">Start Date *</Label>
                          <Input
                            id="poll-start-date"
                            type="date"
                            value={newPoll.startDate}
                            onChange={(e) => setNewPoll({ ...newPoll, startDate: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="poll-end-date">End Date *</Label>
                          <Input
                            id="poll-end-date"
                            type="date"
                            value={newPoll.endDate}
                            onChange={(e) => setNewPoll({ ...newPoll, endDate: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex gap-2">
                    <Button
                      className="flex-1"
                      variant="outline"
                      onClick={() => handleCreatePoll('draft')}
                    >
                      Save as Draft
                    </Button>
                    <Button 
                      className="flex-1"
                      onClick={() => handleCreatePoll('scheduled')}
                    >
                      Schedule
                    </Button>
                  </CardFooter>
                </Card>
                
                {/* Poll List */}
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Manage Polls
                    </CardTitle>
                    <CardDescription>View and manage all polls</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingPolls ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="animate-spin h-6 w-6 border-2 border-current border-t-transparent rounded-full mr-2" />
                        <span>Loading polls...</span>
                      </div>
                    ) : (
                      <div className="rounded-md border">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b bg-secondary">
                              <th className="h-10 px-4 text-left font-medium">Title</th>
                              <th className="h-10 px-4 text-left font-medium hidden md:table-cell">Date Range</th>
                              <th className="h-10 px-4 text-left font-medium">Status</th>
                              <th className="h-10 px-4 text-right font-medium">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {polls.length > 0 ? (
                              polls.map(poll => (
                                <tr key={poll.id} className="border-b hover:bg-secondary/50">
                                  <td className="p-4">{poll.title}</td>
                                  <td className="p-4 hidden md:table-cell text-sm">
                                    {poll.startDate} to {poll.endDate}
                                  </td>
                                  <td className="p-4">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                      poll.status === 'active' 
                                        ? 'bg-green-100 text-green-800' 
                                        : poll.status === 'scheduled'
                                        ? 'bg-blue-100 text-blue-800'
                                        : poll.status === 'ended'
                                        ? 'bg-gray-100 text-gray-800'
                                        : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                      {poll.status.charAt(0).toUpperCase() + poll.status.slice(1)}
                                    </span>
                                  </td>
                                  <td className="p-4 text-right">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => deletePollMutation.mutate(poll.id)}
                                      disabled={deletePollMutation.isPending}
                                    >
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={4} className="p-4 text-center text-muted-foreground">
                                  No polls available
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
            </TabsContent>
            
            {/* Messages Tab */}
            <TabsContent value="messages">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Message List */}
                <Card className="md:col-span-1">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      Messages
                    </CardTitle>
                    <CardDescription>View contact form submissions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingMessages ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="animate-spin h-6 w-6 border-2 border-current border-t-transparent rounded-full mr-2" />
                        <span>Loading messages...</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {messages.length > 0 ? (
                          messages.map(message => (
                            <div
                              key={message.id}
                              className={`p-3 rounded-lg cursor-pointer hover:bg-secondary/50 border ${
                                selectedMessage?.id === message.id ? 'bg-secondary' : ''
                              } ${!message.read ? 'border-primary' : 'border-border'}`}
                              onClick={() => handleMessageClick(message)}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <h3 className="font-medium text-sm">{message.name}</h3>
                                <span className="text-xs text-muted-foreground">{message.date}</span>
                              </div>
                              <p className="text-xs line-clamp-1">{message.subject}</p>
                              {!message.read && (
                                <div className="mt-2 flex items-center">
                                  <div className="h-2 w-2 rounded-full bg-primary mr-1"></div>
                                  <span className="text-xs text-primary">New message</span>
                                </div>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-6 text-muted-foreground">
                            No messages available
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {/* Message Details */}
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      Message Details
                    </CardTitle>
                    <CardDescription>View the complete message</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {selectedMessage ? (
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-lg font-medium">{selectedMessage.subject}</h3>
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Users className="h-3.5 w-3.5" />
                              <span>{selectedMessage.name}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Mail className="h-3.5 w-3.5" />
                              <span>{selectedMessage.email}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              <span>{selectedMessage.date}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-4 rounded-lg bg-secondary/50 border border-border min-h-[200px]">
                          <p>{selectedMessage.message}</p>
                        </div>
                        
                        <div className="flex justify-end">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteMessageMutation.mutate(selectedMessage.id)}
                            disabled={deleteMessageMutation.isPending}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Message
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">No message selected</h3>
                        <p className="text-muted-foreground">
                          Select a message from the list to view its contents
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            {/* Feedback Tab */}
            <TabsContent value="feedback">
              <FeedbackTab />
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </Layout>
  );
};

const Admin: React.FC = () => {
  const { isAuthenticated } = useAuth();
  
  return isAuthenticated ? <AdminDashboard /> : <AdminLogin />;
};

export default Admin;
