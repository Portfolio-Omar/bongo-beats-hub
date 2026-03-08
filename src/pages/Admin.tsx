import React from 'react';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/context/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import FeedbackTab from '@/components/admin/FeedbackTab';
import ModernBlogTab from '@/components/admin/ModernBlogTab';
import BatchUploadSongs from '@/components/admin/BatchUploadSongs';
import SongsManagementTab from '@/components/admin/SongsManagementTab';
import RequestedSongsTab from '@/components/admin/RequestedSongsTab';
import StatisticsDashboard from '@/components/admin/StatisticsDashboard';
import MonetizationTab from '@/components/admin/MonetizationTab';
import PromotionsTab from '@/components/admin/PromotionsTab';
import SecurityTab from '@/components/admin/SecurityTab';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { 
  Music, FileText, MessageSquare, 
  Upload, Lock, BarChart3, Wallet, Megaphone, ShieldX, Shield
} from 'lucide-react';

const Admin: React.FC = () => {
  const { isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="container py-12">
          <motion.div className="max-w-md mx-auto bg-card p-8 rounded-xl shadow-md border border-border/40"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="mx-auto w-16 h-16 mb-4 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold mb-6 text-center">Sign In Required</h2>
            <p className="text-center text-muted-foreground mb-4">Please sign in to continue</p>
            <Button className="w-full" onClick={() => navigate('/auth')}>Sign In</Button>
          </motion.div>
        </div>
      </Layout>
    );
  }

  if (!isAdmin) {
    return (
      <Layout>
        <div className="container py-12">
          <motion.div className="max-w-md mx-auto bg-card p-8 rounded-xl shadow-md border border-destructive/40"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="mx-auto w-16 h-16 mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
              <ShieldX className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="text-2xl font-semibold mb-4 text-center">Access Denied</h2>
            <p className="text-center text-muted-foreground mb-4">You don't have admin privileges to access this page.</p>
            <Button className="w-full" variant="outline" onClick={() => navigate('/')}>Go Home</Button>
          </motion.div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-12">
        <motion.div className="space-y-6" variants={containerVariants} initial="hidden" animate="show">
          <motion.div className="flex justify-between items-center" variants={itemVariants}>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Admin Dashboard</h1>
          </motion.div>
          
          <motion.div className="p-1 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-lg" variants={itemVariants}>
            <Tabs defaultValue="songs" className="bg-background rounded-md">
              <div className="overflow-x-auto pb-2 pt-4 px-4">
                <TabsList className="h-12 bg-muted/80 backdrop-blur-sm flex-wrap">
                  <TabsTrigger value="statistics" className="flex items-center gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                    <BarChart3 className="h-4 w-4" /><span>Statistics</span>
                  </TabsTrigger>
                  <TabsTrigger value="songs" className="flex items-center gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                    <Music className="h-4 w-4" /><span>Songs</span>
                  </TabsTrigger>
                  <TabsTrigger value="requests" className="flex items-center gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                    <Upload className="h-4 w-4" /><span>Requested Songs</span>
                  </TabsTrigger>
                  <TabsTrigger value="blog" className="flex items-center gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                    <FileText className="h-4 w-4" /><span>Blog Posts</span>
                  </TabsTrigger>
                  <TabsTrigger value="feedback" className="flex items-center gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                    <MessageSquare className="h-4 w-4" /><span>Feedback</span>
                  </TabsTrigger>
                  <TabsTrigger value="uploads" className="flex items-center gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                    <Upload className="h-4 w-4" /><span>Upload Songs</span>
                  </TabsTrigger>
                  <TabsTrigger value="monetization" className="flex items-center gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                    <Wallet className="h-4 w-4" /><span>Monetization</span>
                  </TabsTrigger>
                  <TabsTrigger value="promotions" className="flex items-center gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                    <Megaphone className="h-4 w-4" /><span>Promotions & Boosters</span>
                  </TabsTrigger>
                  <TabsTrigger value="security" className="flex items-center gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                    <Shield className="h-4 w-4" /><span>Security</span>
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <div className="p-4">
                <TabsContent value="statistics" className="mt-0"><StatisticsDashboard /></TabsContent>
                <TabsContent value="songs" className="mt-0"><SongsManagementTab /></TabsContent>
                <TabsContent value="requests" className="mt-0"><RequestedSongsTab /></TabsContent>
                <TabsContent value="blog" className="mt-0"><ModernBlogTab /></TabsContent>
                <TabsContent value="feedback" className="mt-0"><FeedbackTab /></TabsContent>
                <TabsContent value="uploads" className="mt-0"><BatchUploadSongs /></TabsContent>
                <TabsContent value="monetization" className="mt-0"><MonetizationTab /></TabsContent>
                <TabsContent value="promotions" className="mt-0"><PromotionsTab /></TabsContent>
              </div>
            </Tabs>
          </motion.div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default Admin;
