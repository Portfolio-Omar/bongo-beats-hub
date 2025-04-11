import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SetSongOfWeek } from '@/components/admin/SetSongOfWeek';
import { FeedbackTab } from '@/components/admin/FeedbackTab';
import { BlogTab } from '@/components/admin/BlogTab';
import VideoMusicTab from '@/components/admin/VideoMusicTab';

const Admin: React.FC = () => {
  const { isAuthenticated, login, logout } = useAuth();
  const [password, setPassword] = useState('');

  useEffect(() => {
    // Check if already authenticated on mount
    if (localStorage.getItem('isAuthenticated') === 'true') {
      login();
    }
  }, [login]);

  const handleLogin = async () => {
    if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      login();
      localStorage.setItem('isAuthenticated', 'true');
      toast.success('Admin access granted');
    } else {
      toast.error('Incorrect password');
    }
    setPassword('');
  };

  const handleLogout = () => {
    logout();
    localStorage.removeItem('isAuthenticated');
    toast.success('Admin logged out');
  };

return (
  <Layout>
    <div className="container py-12">
      {!isAuthenticated ? (
        <div className="max-w-md mx-auto bg-card p-8 rounded-xl shadow-md">
          <h2 className="text-2xl font-semibold mb-6 text-center">Admin Login</h2>
          <div className="space-y-4">
            <div>
              <Input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button className="w-full" onClick={handleLogin}>
              Login
            </Button>
          </div>
        </div>
      ) : (
        <Tabs defaultValue="songs" className="space-y-6">
          <div className="overflow-x-auto pb-2">
            <TabsList>
              <TabsTrigger value="songs">Songs</TabsTrigger>
              <TabsTrigger value="videos">Music Videos</TabsTrigger>
              <TabsTrigger value="blog">Blog Posts</TabsTrigger>
              <TabsTrigger value="featured">Featured</TabsTrigger>
              <TabsTrigger value="feedback">Feedback</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="songs" className="space-y-8">
            <SetSongOfWeek />
          </TabsContent>
          
          <TabsContent value="videos">
            <VideoMusicTab />
          </TabsContent>
          
          <TabsContent value="blog">
            <BlogTab />
          </TabsContent>
          
          <TabsContent value="featured">
            <SetSongOfWeek />
          </TabsContent>
          
          <TabsContent value="feedback">
            <FeedbackTab />
          </TabsContent>
        </Tabs>
      )}
    </div>
  </Layout>
);
};

export default Admin;
