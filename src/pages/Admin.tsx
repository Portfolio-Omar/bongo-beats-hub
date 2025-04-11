
import React, { useState, useEffect } from 'react';
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
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleLogin();
                    }
                  }}
                />
              </div>
              <Button className="w-full" onClick={handleLogin}>
                Login
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <Button variant="outline" onClick={logout}>Logout</Button>
            </div>
            
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
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Admin;
