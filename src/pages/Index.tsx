import React from 'react';
import Layout from '@/components/layout/Layout';
import Hero from '@/components/ui-custom/Hero';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { 
  Music2, Radio, CalendarDays, BookOpen, BarChart,
  Share2, Clock, ArrowRight, Shield, FileText, BarChart2, MessageSquare
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const featuredPlaylists = [
  {
    id: '1',
    title: 'Golden Era Bongo',
    description: 'The best tracks from the 70s and 80s Tanzanian scene',
    imageUrl: 'https://images.unsplash.com/photo-1458560871784-56d23406c091?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=500&q=80',
    count: '24 tracks'
  },
  {
    id: '2',
    title: 'Kenyan Classics',
    description: 'Timeless benga and rumba hits from Kenya',
    imageUrl: 'https://images.unsplash.com/photo-1571330735066-03aaa9429d89?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=500&q=80',
    count: '18 tracks'
  },
  {
    id: '3',
    title: 'East African Legends',
    description: 'Celebrating the pioneers who shaped the sound',
    imageUrl: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=500&q=80',
    count: '32 tracks'
  }
];

const recentBlogs = [
  {
    id: '1',
    title: 'The Evolution of Bongo Flava',
    excerpt: 'Tracing the roots and development of Tanzania\'s most popular music genre from the 1980s to present day.',
    imageUrl: 'https://images.unsplash.com/photo-1461784180009-27c1303a64c8?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=300&q=80',
    date: 'May 15, 2023'
  },
  {
    id: '2',
    title: 'Forgotten Pioneers of Kenyan Benga',
    excerpt: 'Rediscovering the influential artists who shaped Kenya\'s musical identity during the post-independence era.',
    imageUrl: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=300&q=80',
    date: 'April 22, 2023'
  }
];

const Index: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };
  
  return (
    <Layout>
      <Hero />
      
      {/* Features Section */}
      <section className="py-20 bg-accent/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">Discover Our Platform</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Immerse yourself in the rich cultural heritage of East African music through our comprehensive platform.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Music2 className="h-10 w-10" />,
                title: 'Curated Library',
                description: 'Access a handpicked collection of classic Bongo and Kenyan tracks, organized for easy discovery.'
              },
              {
                icon: <Radio className="h-10 w-10" />,
                title: 'Live Streaming',
                description: 'Tune in to our live stream for a continuous journey through East African musical history.'
              },
              {
                icon: <Share2 className="h-10 w-10" />,
                title: 'Shareable Links',
                description: 'Share your favorite tracks and playlists with friends and fellow music enthusiasts.'
              },
              {
                icon: <BookOpen className="h-10 w-10" />,
                title: 'Informative Blog',
                description: 'Dive deep into articles about artists, genres, and the cultural impact of East African music.'
              },
              {
                icon: <BarChart className="h-10 w-10" />,
                title: 'Interactive Polls',
                description: 'Participate in community polls to share your opinions on various music-related topics.'
              },
              {
                icon: <CalendarDays className="h-10 w-10" />,
                title: 'Regular Updates',
                description: 'Enjoy fresh content with new music, articles, and features added regularly.'
              }
            ].map((feature, index) => (
              <motion.div 
                key={index}
                className="music-card flex flex-col items-center text-center p-6"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="mb-4 text-primary">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Admin Panel Section (only visible when authenticated) */}
      {isAuthenticated && (
        <section className="py-16 bg-gradient-to-r from-primary/5 to-accent/10">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <Shield className="h-8 w-8 text-primary" />
              <h2 className="font-display text-3xl md:text-4xl font-bold">Admin Dashboard</h2>
            </div>
            
            <Card className="mb-10">
              <CardHeader>
                <CardTitle>Quick Management</CardTitle>
                <CardDescription>
                  Access key management features for your platform from this dashboard.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <Button asChild variant="outline" className="h-auto py-6 flex flex-col gap-2">
                    <Link to="/admin" className="w-full">
                      <Shield className="h-8 w-8 mb-2" />
                      <span>Admin Panel</span>
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="h-auto py-6 flex flex-col gap-2">
                    <Link to="/music" className="w-full">
                      <Music2 className="h-8 w-8 mb-2" />
                      <span>Manage Music</span>
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="h-auto py-6 flex flex-col gap-2">
                    <Link to="/blog" className="w-full">
                      <FileText className="h-8 w-8 mb-2" />
                      <span>Manage Blogs</span>
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="h-auto py-6 flex flex-col gap-2">
                    <Link to="/polls" className="w-full">
                      <BarChart2 className="h-8 w-8 mb-2" />
                      <span>Manage Polls</span>
                    </Link>
                  </Button>
                </div>
                
                <Tabs defaultValue="feedback">
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="feedback">Recent Feedback</TabsTrigger>
                    <TabsTrigger value="messages">New Messages</TabsTrigger>
                  </TabsList>
                  <TabsContent value="feedback" className="p-4 bg-accent/10 rounded-md">
                    <p className="text-center text-muted-foreground py-4">
                      View recent user feedback from the Feedback page
                    </p>
                    <Button asChild variant="default" className="w-full">
                      <Link to="/admin">
                        <MessageSquare className="mr-2 h-4 w-4" />
                        View All Feedback
                      </Link>
                    </Button>
                  </TabsContent>
                  <TabsContent value="messages" className="p-4 bg-accent/10 rounded-md">
                    <p className="text-center text-muted-foreground py-4">
                      View messages from users via the contact form
                    </p>
                    <Button asChild variant="default" className="w-full">
                      <Link to="/admin">
                        <MessageSquare className="mr-2 h-4 w-4" />
                        View All Messages
                      </Link>
                    </Button>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </section>
      )}
      
      {/* Featured Playlists */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12">
            <div>
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-2">Featured Collections</h2>
              <p className="text-muted-foreground max-w-2xl">
                Explore our carefully curated playlists celebrating the rich diversity of East African music.
              </p>
            </div>
            <Button asChild variant="ghost" className="mt-4 md:mt-0">
              <Link to="/music" className="flex items-center">
                View All Collections
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
          >
            {featuredPlaylists.map((playlist) => (
              <motion.div 
                key={playlist.id} 
                className="group relative overflow-hidden rounded-xl"
                variants={item}
              >
                <div className="aspect-square overflow-hidden">
                  <img 
                    src={playlist.imageUrl} 
                    alt={playlist.title} 
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6 flex flex-col justify-end">
                  <h3 className="text-xl font-semibold text-white mb-2">{playlist.title}</h3>
                  <p className="text-white/80 text-sm mb-4">{playlist.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-white/70 flex items-center">
                      <Music2 className="h-3 w-3 mr-1" />
                      {playlist.count}
                    </span>
                    <Button size="sm" asChild className="opacity-0 translate-y-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
                      <Link to={`/music/playlist/${playlist.id}`}>
                        Explore
                      </Link>
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
      
      {/* Recent Blogs */}
      <section className="py-20 bg-accent/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12">
            <div>
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-2">Latest Articles</h2>
              <p className="text-muted-foreground max-w-2xl">
                Dive into stories, histories, and insights about East African music and culture.
              </p>
            </div>
            <Button asChild variant="ghost" className="mt-4 md:mt-0">
              <Link to="/blog" className="flex items-center">
                View All Articles
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {recentBlogs.map((blog, index) => (
              <motion.div 
                key={blog.id}
                className="music-card overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="relative h-48 mb-6 overflow-hidden rounded-lg">
                  <img 
                    src={blog.imageUrl} 
                    alt={blog.title} 
                    className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="h-3 w-3 text-primary" />
                  <span className="text-xs text-muted-foreground">{blog.date}</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">{blog.title}</h3>
                <p className="text-muted-foreground mb-4">{blog.excerpt}</p>
                <Button asChild variant="ghost" className="p-0 h-auto font-medium">
                  <Link to={`/blog/${blog.id}`} className="flex items-center text-primary hover:text-primary/80">
                    Read More
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/10 z-0" />
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />
        
        <div className="container relative z-10 mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block rounded-full bg-accent px-3 py-1 text-xs font-medium text-primary mb-4">
              Join Our Community
            </span>
          </motion.div>
          
          <motion.h2 
            className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-6 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Ready to Embark on a Musical Journey Through East Africa?
          </motion.h2>
          
          <motion.p 
            className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Explore our extensive library of classic Bongo and Kenyan music, 
            participate in community discussions, and help preserve this rich cultural heritage.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Button asChild size="lg" className="gap-2 px-8">
              <Link to="/music">
                <Music2 className="h-5 w-5" />
                Start Listening
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
