
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import FeedbackTab from '@/components/admin/FeedbackTab';
import BlogTab from '@/components/admin/BlogTab';
import BatchUploadSongs from '@/components/admin/BatchUploadSongs';
import SongsManagementTab from '@/components/admin/SongsManagementTab';
import RequestedSongsTab from '@/components/admin/RequestedSongsTab';
import { motion } from 'framer-motion';
import { 
  Music, FileText, MessageSquare, 
  Upload, Lock
} from 'lucide-react';

const Admin: React.FC = () => {
  const { isAuthenticated } = useAuth();

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
            <h2 className="text-2xl font-semibold mb-6 text-center">
              Sign In Required
            </h2>
            <p className="text-center text-muted-foreground">
              Please sign in to continue
            </p>
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
                    <TabsTrigger value="requests" className="flex items-center gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary transition-all">
                      <Upload className="h-4 w-4" />
                      <span>Requested Songs</span>
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
                      <SongsManagementTab />
                    </motion.div>
                  </TabsContent>
                  
                  <TabsContent value="requests" className="mt-0">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <RequestedSongsTab />
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
