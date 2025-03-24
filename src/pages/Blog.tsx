
import React, { useEffect, useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import { Search, Calendar, ArrowRight, Clock, Loader2, ThumbsUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  date: string;
  featured_image_url?: string | null;
  slug?: string | null;
  status: 'draft' | 'published';
  category?: string;
  featured?: boolean;
}

const categories = ['All', 'History', 'Artists', 'Culture', 'Media'];

const Blog: React.FC = () => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [activeCategory, setActiveCategory] = React.useState('All');
  const [isLoading, setIsLoading] = React.useState(true);
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  
  // Fetch blogs on component mount
  useEffect(() => {
    const fetchBlogs = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('blogs')
          .select('*')
          .eq('status', 'published')
          .order('date', { ascending: false });
          
        if (error) {
          console.error('Error fetching blogs:', error);
          toast.error('Failed to load blog posts');
          throw error;
        }
        
        // Process the blogs to add category and featured flags
        // Cast the status to ensure it matches the BlogPost type
        const processedBlogs = data.map((blog, index) => ({
          ...blog,
          status: blog.status as 'draft' | 'published', // Add type casting here
          category: categories[Math.floor(Math.random() * (categories.length - 1)) + 1],
          excerpt: blog.content.substring(0, 150) + '...',
          featured: index < 3 // Mark first 3 as featured
        }));
        
        setBlogs(processedBlogs);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchBlogs();
  }, []);
  
  // Filter blogs based on search query and category
  const filteredBlogs = blogs.filter(blog => {
    const matchesSearch = blog.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          blog.content?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || blog.category === activeCategory;
    return matchesSearch && matchesCategory;
  });
  
  // Featured blogs
  const featuredBlogs = blogs.filter(blog => blog.featured);
  
  const getFormattedDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMMM dd, yyyy');
    } catch (error) {
      return dateString;
    }
  };
  
  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.h1 
            className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Blog & Articles
          </motion.h1>
          <motion.p 
            className="text-muted-foreground max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Dive into stories, histories, and insights about East African music and culture.
          </motion.p>
        </div>
        
        {/* Search and Filters */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2 flex-wrap">
              {categories.map(category => (
                <Button
                  key={category}
                  variant={activeCategory === category ? "default" : "outline"}
                  onClick={() => setActiveCategory(category)}
                  size="sm"
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </motion.div>
        
        {/* Featured Blogs Section */}
        {featuredBlogs.length > 0 && (
          <motion.div 
            className="mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h2 className="text-2xl font-bold font-display mb-6">Featured Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredBlogs.map((blog) => (
                <Card key={blog.id} className="overflow-hidden h-full flex flex-col hover:shadow-md transition-shadow">
                  <div className="relative h-48 overflow-hidden">
                    {blog.featured_image_url ? (
                      <img 
                        src={blog.featured_image_url} 
                        alt={blog.title} 
                        className="w-full h-full object-cover transition-transform hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                        <span className="text-primary font-medium">East African Music</span>
                      </div>
                    )}
                    <div className="absolute top-3 left-3">
                      <span className="bg-primary text-primary-foreground text-xs font-medium px-2 py-1 rounded">
                        {blog.category || 'General'}
                      </span>
                    </div>
                  </div>
                  <CardContent className="flex-grow pt-6">
                    <h3 className="text-xl font-bold mb-2 line-clamp-2">{blog.title}</h3>
                    <p className="text-muted-foreground text-sm mb-4 line-clamp-3">{blog.excerpt}</p>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3 mr-1" />
                      <span>{getFormattedDate(blog.date)}</span>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Link to={`/blog/${blog.slug || blog.id}`} className="text-primary font-medium text-sm flex items-center">
                      Read More <ArrowRight className="h-3 w-3 ml-1" />
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </motion.div>
        )}
        
        {/* All Blog Posts or Filtered Results */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h2 className="text-2xl font-bold font-display mb-6">
            {activeCategory === 'All' ? 'All Articles' : `${activeCategory} Articles`}
          </h2>
          
          {isLoading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Loading articles...</p>
            </div>
          ) : filteredBlogs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {filteredBlogs.map((blog) => (
                <Card key={blog.id} className="flex flex-col md:flex-row overflow-hidden hover:shadow-md transition-shadow">
                  <div className="md:w-1/3 h-40 md:h-auto overflow-hidden">
                    {blog.featured_image_url ? (
                      <img 
                        src={blog.featured_image_url} 
                        alt={blog.title} 
                        className="w-full h-full object-cover transition-transform hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/30 flex items-center justify-center">
                        <span className="text-primary text-sm font-medium">East African Music</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col flex-grow p-6">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium px-2 py-1 rounded bg-secondary">
                          {blog.category || 'General'}
                        </span>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3 mr-1" />
                          <span>{getFormattedDate(blog.date)}</span>
                        </div>
                      </div>
                      <h3 className="text-lg font-bold mb-2">{blog.title}</h3>
                      <p className="text-muted-foreground text-sm mb-4 line-clamp-2">{blog.excerpt}</p>
                    </div>
                    <div className="mt-auto">
                      <Link to={`/blog/${blog.slug || blog.id}`} className="text-primary font-medium text-sm flex items-center">
                        Read More <ArrowRight className="h-3 w-3 ml-1" />
                      </Link>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <h3 className="text-xl font-medium mb-2">No articles found</h3>
                <p className="text-muted-foreground mb-4">Try adjusting your search or filter criteria</p>
                <Button onClick={() => {setSearchQuery(''); setActiveCategory('All');}}>
                  Reset Filters
                </Button>
              </motion.div>
            </div>
          )}
        </motion.div>
      </div>
    </Layout>
  );
};

export default Blog;
