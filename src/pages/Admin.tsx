
import React, { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  ListMusic, Users, Save
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';

interface SongType {
  id: string;
  title: string;
  artist: string;
  genre: string;
  year: string;
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

// Mock data
const initialSongs: SongType[] = [
  { id: '1', title: 'Malaika', artist: 'Fadhili William', genre: 'Classic', year: '1960' },
  { id: '2', title: 'Jambo Bwana', artist: 'Them Mushrooms', genre: 'Benga', year: '1982' },
  { id: '3', title: 'Dunia Ina Mambo', artist: 'Remmy Ongala', genre: 'Soukous', year: '1988' },
];

const initialBlogs: BlogType[] = [
  { 
    id: '1', 
    title: 'The Evolution of Bongo Flava', 
    content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit...', 
    date: '2023-05-15', 
    status: 'published' 
  },
  { 
    id: '2', 
    title: 'Forgotten Pioneers of Kenyan Benga', 
    content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit...', 
    date: '2023-04-22', 
    status: 'published' 
  },
  { 
    id: '3', 
    title: 'The Future of East African Music', 
    content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit...', 
    date: '2023-06-01', 
    status: 'draft' 
  },
];

const initialPolls: PollType[] = [
  {
    id: '1',
    title: 'Greatest Kenyan Artist of All Time',
    description: 'Vote for who you think is the most influential Kenyan musician in history.',
    options: ['Fadhili William', 'Ayub Ogada', 'Daudi Kabaka', 'Fundi Konde'],
    startDate: '2023-06-01',
    endDate: '2023-06-30',
    status: 'active'
  },
  {
    id: '2',
    title: 'Favorite Bongo Era',
    description: 'Which period of Bongo music do you enjoy the most?',
    options: ['1960s-1970s', '1980s-1990s', '2000s-2010s'],
    startDate: '2023-05-15',
    endDate: '2023-06-15',
    status: 'active'
  },
  {
    id: '3',
    title: 'Most Anticipated Feature',
    description: 'What feature would you like to see added to the platform next?',
    options: ['Artist Profiles', 'Music Reviews', 'Playlists', 'Live Events'],
    startDate: '2023-06-10',
    endDate: '2023-07-10',
    status: 'scheduled'
  },
];

const initialMessages: MessageType[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    subject: 'Collaboration Opportunity',
    message: 'Hello, I am interested in collaborating with your platform to promote traditional Kenyan music...',
    date: '2023-05-28',
    read: false
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    email: 'sarah@example.com',
    subject: 'Technical Issue',
    message: 'I am having trouble streaming music on your platform. The player seems to be stuck loading...',
    date: '2023-05-26',
    read: true
  },
  {
    id: '3',
    name: 'Michael Wanjala',
    email: 'michael@example.com',
    subject: 'Song Request',
    message: 'I would like to request that you add songs from the artist Samba Mapangala to your collection...',
    date: '2023-05-22',
    read: false
  },
];

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
  const [songs, setSongs] = useState<SongType[]>(initialSongs);
  const [blogs, setBlogs] = useState<BlogType[]>(initialBlogs);
  const [polls, setPolls] = useState<PollType[]>(initialPolls);
  const [messages, setMessages] = useState<MessageType[]>(initialMessages);
  
  // New item states
  const [newSong, setNewSong] = useState<Partial<SongType>>({ title: '', artist: '', genre: '', year: '' });
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Handle song upload
  const handleSongUpload = () => {
    if (!newSong.title || !newSong.artist) {
      toast.error('Please provide at least a title and artist');
      return;
    }
    
    if (!selectedFile) {
      toast.error('Please select an audio file');
      return;
    }
    
    const newSongObj: SongType = {
      id: Date.now().toString(),
      title: newSong.title || '',
      artist: newSong.artist || '',
      genre: newSong.genre || '',
      year: newSong.year || '',
    };
    
    setSongs([...songs, newSongObj]);
    setNewSong({ title: '', artist: '', genre: '', year: '' });
    setSelectedFile(null);
    
    toast.success('Song uploaded successfully');
  };
  
  // Handle song delete
  const handleDeleteSong = (id: string) => {
    setSongs(songs.filter(song => song.id !== id));
    toast.success('Song deleted successfully');
  };
  
  // Handle blog create/publish
  const handleSaveBlog = (status: 'draft' | 'published') => {
    if (!newBlog.title || !newBlog.content) {
      toast.error('Please provide a title and content');
      return;
    }
    
    const newBlogObj: BlogType = {
      id: Date.now().toString(),
      title: newBlog.title || '',
      content: newBlog.content || '',
      date: new Date().toISOString().split('T')[0],
      status: status,
    };
    
    setBlogs([...blogs, newBlogObj]);
    setNewBlog({ title: '', content: '', status: 'draft' });
    
    toast.success(`Blog ${status === 'published' ? 'published' : 'saved as draft'} successfully`);
  };
  
  // Handle blog delete
  const handleDeleteBlog = (id: string) => {
    setBlogs(blogs.filter(blog => blog.id !== id));
    toast.success('Blog deleted successfully');
  };
  
  // Handle blog publish
  const handlePublishBlog = (id: string) => {
    setBlogs(blogs.map(blog => 
      blog.id === id ? { ...blog, status: 'published' } : blog
    ));
    toast.success('Blog published successfully');
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
  const handleCreatePoll = (status: 'draft' | 'scheduled') => {
    if (!newPoll.title || !newPoll.description || !newPoll.startDate || !newPoll.endDate) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    if ((newPoll.options?.filter(o => o.trim() !== '').length || 0) < 2) {
      toast.error('Please provide at least 2 valid options');
      return;
    }
    
    const newPollObj: PollType = {
      id: Date.now().toString(),
      title: newPoll.title || '',
      description: newPoll.description || '',
      options: (newPoll.options || []).filter(o => o.trim() !== ''),
      startDate: newPoll.startDate || '',
      endDate: newPoll.endDate || '',
      status: status,
    };
    
    setPolls([...polls, newPollObj]);
    setNewPoll({
      title: '',
      description: '',
      options: ['', ''],
      startDate: '',
      endDate: '',
      status: 'draft'
    });
    
    toast.success(`Poll ${status === 'scheduled' ? 'scheduled' : 'saved as draft'} successfully`);
  };
  
  // Handle poll delete
  const handleDeletePoll = (id: string) => {
    setPolls(polls.filter(poll => poll.id !== id));
    toast.success('Poll deleted successfully');
  };
  
  // Handle message mark as read
  const handleMarkMessageAsRead = (id: string) => {
    setMessages(messages.map(message => 
      message.id === id ? { ...message, read: true } : message
    ));
  };
  
  // Handle message delete
  const handleDeleteMessage = (id: string) => {
    setMessages(messages.filter(message => message.id !== id));
    setSelectedMessage(null);
    toast.success('Message deleted successfully');
  };
  
  // File input change handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
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
            <TabsList className="grid grid-cols-4 w-full mb-8">
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
                          value={newSong.genre}
                          onChange={(e) => setNewSong({ ...newSong, genre: e.target.value })}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="song-year">Year</Label>
                        <Input
                          id="song-year"
                          placeholder="Year"
                          value={newSong.year}
                          onChange={(e) => setNewSong({ ...newSong, year: e.target.value })}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="song-file">Audio File *</Label>
                        <div className="flex items-center justify-center w-full">
                          <label
                            htmlFor="song-file"
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
                              id="song-file"
                              type="file"
                              accept="audio/*"
                              className="hidden"
                              onChange={handleFileChange}
                            />
                          </label>
                        </div>
                        {selectedFile && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Selected file: {selectedFile.name}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full" onClick={handleSongUpload}>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Song
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
                    <div className="rounded-md border">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b bg-secondary">
                            <th className="h-10 px-4 text-left font-medium">Title</th>
                            <th className="h-10 px-4 text-left font-medium">Artist</th>
                            <th className="h-10 px-4 text-left font-medium hidden md:table-cell">Genre</th>
                            <th className="h-10 px-4 text-left font-medium hidden md:table-cell">Year</th>
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
                                <td className="p-4 text-right">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteSong(song.id)}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={5} className="p-4 text-center text-muted-foreground">
                                No songs available
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
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
                                    {blog.status === 'published' ? 'Published' : 'Draft'}
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
                                    onClick={() => handleDeletePoll(poll.id)}
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
                    <div className="space-y-2">
                      {messages.length > 0 ? (
                        messages.map(message => (
                          <div
                            key={message.id}
                            className={`p-3 rounded-lg cursor-pointer hover:bg-secondary/50 border ${
                              selectedMessage?.id === message.id ? 'bg-secondary' : ''
                            } ${!message.read ? 'border-primary' : 'border-border'}`}
                            onClick={() => {
                              setSelectedMessage(message);
                              if (!message.read) {
                                handleMarkMessageAsRead(message.id);
                              }
                            }}
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
                            onClick={() => handleDeleteMessage(selectedMessage.id)}
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
