
import React, { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import SetSongOfWeek from '@/components/admin/SetSongOfWeek';
import FeedbackTab from '@/components/admin/FeedbackTab';
import BlogTab from '@/components/admin/BlogTab';
import VideoMusicTab from '@/components/admin/VideoMusicTab';
import BatchUploadSongs from '@/components/admin/BatchUploadSongs';
import { motion } from 'framer-motion';
import { 
  Music, Video, FileText, MessageSquare, 
  Upload, Lock, LogOut 
} from 'lucide-react';

const Admin: React.FC = () => {
  const { isAuthenticated, authenticateAdmin, logout } = useAuth();
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      const success = await authenticateAdmin(password);
      if (success) {
        toast.success('Admin access granted');
      } else {
        toast.error('Incorrect password');
      }
      setPassword('');
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed. Please try again.');
      setPassword('');
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <Layout>
      <div className="container py-12">
        {!isAuthenticated ? (
          <motion.div 
            className="max-w-md mx-auto bg-card p-8 rounded-xl shadow-md border border-border/40"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="mx-auto w-16 h-16 mb-4 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center"
            >
              <Lock className="h-8 w-8 text-primary" />
            </motion.div>
            <h2 className="text-2xl font-semibold mb-6 text-center text-gradient bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Admin Login</h2>
            <div className="space-y-4">
              <div>
                <Input
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleLogin();
                    }
                  }}
                  className="transition-all duration-300 focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <Button 
                className="w-full transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90" 
                onClick={handleLogin}
              >
                Login
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            className="space-y-6"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            <motion.div 
              className="flex justify-between items-center"
              variants={itemVariants}
            >
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Admin Dashboard</h1>
              <Button 
                variant="outline" 
                onClick={logout}
                className="flex items-center gap-2 hover:bg-destructive/10 hover:text-destructive transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </motion.div>
            
            <motion.div 
              className="p-1 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-lg"
              variants={itemVariants}
            >
              <Tabs defaultValue="songs" className="bg-background rounded-md">
                <div className="overflow-x-auto pb-2 pt-4 px-4">
                  <TabsList className="h-12 bg-muted/80 backdrop-blur-sm">
                    <TabsTrigger value="songs" className="flex items-center gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary transition-all">
                      <Music className="h-4 w-4" />
                      <span>Songs</span>
                    </TabsTrigger>
                    <TabsTrigger value="videos" className="flex items-center gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary transition-all">
                      <Video className="h-4 w-4" />
                      <span>Music Videos</span>
                    </TabsTrigger>
                    <TabsTrigger value="blog" className="flex items-center gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary transition-all">
                      <FileText className="h-4 w-4" />
                      <span>Blog Posts</span>
                    </TabsTrigger>
                    <TabsTrigger value="feedback" className="flex items-center gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary transition-all">
                      <MessageSquare className="h-4 w-4" />
                      <span>Feedback</span>
                    </TabsTrigger>
                    <TabsTrigger value="uploads" className="flex items-center gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary transition-all">
                      <Upload className="h-4 w-4" />
                      <span>Upload Songs</span>
                    </TabsTrigger>
                  </TabsList>
                </div>
                
                <div className="p-4">
                  <TabsContent value="songs" className="mt-0">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <SetSongOfWeek />
                    </motion.div>
                  </TabsContent>
                  
                  <TabsContent value="videos" className="mt-0">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <VideoMusicTab />
                    </motion.div>
                  </TabsContent>
                  
                  <TabsContent value="blog" className="mt-0">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <BlogTab />
                    </motion.div>
                  </TabsContent>
                  
                  <TabsContent value="feedback" className="mt-0">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <FeedbackTab />
                    </motion.div>
                  </TabsContent>
                  
                  <TabsContent value="uploads" className="mt-0">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <BatchUploadSongs />
                    </motion.div>
                  </TabsContent>
                </div>
              </Tabs>
            </motion.div>
          </motion.div>
        )}
      </div>
    </Layout>
  );
};

export default Admin;
