
import React from 'react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import { Search, Calendar, ArrowRight, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

// Mock blog data
const blogs = [
  {
    id: '1',
    title: 'The Evolution of Bongo Flava',
    excerpt: 'Tracing the roots and development of Tanzania\'s most popular music genre from the 1980s to present day.',
    content: 'Full content of the blog post would go here...',
    imageUrl: 'https://images.unsplash.com/photo-1461784180009-27c1303a64c8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500&q=80',
    date: 'May 15, 2023',
    readTime: '5 min read',
    category: 'History',
    featured: true
  },
  {
    id: '2',
    title: 'Forgotten Pioneers of Kenyan Benga',
    excerpt: 'Rediscovering the influential artists who shaped Kenya\'s musical identity during the post-independence era.',
    content: 'Full content of the blog post would go here...',
    imageUrl: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500&q=80',
    date: 'April 22, 2023',
    readTime: '7 min read',
    category: 'Artists',
    featured: true
  },
  {
    id: '3',
    title: 'The Impact of Colonial Era on East African Music',
    excerpt: 'Examining how European colonization influenced and transformed the traditional sounds of East Africa.',
    content: 'Full content of the blog post would go here...',
    imageUrl: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500&q=80',
    date: 'March 10, 2023',
    readTime: '6 min read',
    category: 'History',
    featured: false
  },
  {
    id: '4',
    title: 'Iconic Venues: Where East African Music Thrived',
    excerpt: 'A tour of the historic music venues that served as incubators for talent and cultural exchange in the region.',
    content: 'Full content of the blog post would go here...',
    imageUrl: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500&q=80',
    date: 'February 28, 2023',
    readTime: '4 min read',
    category: 'Culture',
    featured: false
  },
  {
    id: '5',
    title: 'The Role of Radio in Popularizing East African Music',
    excerpt: 'How radio broadcasts helped spread and preserve the musical traditions of Kenya and Tanzania.',
    content: 'Full content of the blog post would go here...',
    imageUrl: 'https://images.unsplash.com/photo-1487180144351-b8472da7d491?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500&q=80',
    date: 'January 15, 2023',
    readTime: '5 min read',
    category: 'Media',
    featured: false
  }
];

const categories = ['All', 'History', 'Artists', 'Culture', 'Media'];

const Blog: React.FC = () => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [activeCategory, setActiveCategory] = React.useState('All');
  
  const filteredBlogs = blogs.filter(blog => {
    const matchesSearch = blog.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          blog.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || blog.category === activeCategory;
    return matchesSearch && matchesCategory;
  });
  
  // Featured blogs
  const featuredBlogs = blogs.filter(blog => blog.featured);
  
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
        
        {/* Featured Articles */}
        {featuredBlogs.length > 0 && (
          <motion.div 
            className="mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h2 className="text-2xl font-display font-bold mb-6">Featured Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {featuredBlogs.map((blog, index) => (
                <motion.div 
                  key={blog.id}
                  className="music-card overflow-hidden"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 + (index * 0.1) }}
                >
                  <div className="relative h-56 mb-6 overflow-hidden rounded-lg">
                    <img 
                      src={blog.imageUrl} 
                      alt={blog.title} 
                      className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                    <div className="absolute top-4 left-4 bg-primary text-white text-xs font-medium px-2 py-1 rounded">
                      {blog.category}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{blog.date}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{blog.readTime}</span>
                    </div>
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
          </motion.div>
        )}
        
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
        
        {/* Articles Grid */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          {filteredBlogs.map((blog, index) => (
            <motion.div 
              key={blog.id}
              className="music-card overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 * index }}
            >
              <div className="relative h-48 mb-6 overflow-hidden rounded-lg">
                <img 
                  src={blog.imageUrl} 
                  alt={blog.title} 
                  className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                />
                <div className="absolute top-3 left-3 bg-primary/90 text-white text-xs font-medium px-2 py-1 rounded">
                  {blog.category}
                </div>
              </div>
              <div className="flex items-center gap-4 mb-3">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>{blog.date}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{blog.readTime}</span>
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2 line-clamp-1">{blog.title}</h3>
              <p className="text-muted-foreground mb-4 line-clamp-2">{blog.excerpt}</p>
              <Button asChild variant="ghost" className="p-0 h-auto font-medium">
                <Link to={`/blog/${blog.id}`} className="flex items-center text-primary hover:text-primary/80">
                  Read More
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </motion.div>
          ))}
        </motion.div>
        
        {filteredBlogs.length === 0 && (
          <div className="text-center py-12">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <h3 className="text-xl font-medium mb-2">No articles found</h3>
              <p className="text-muted-foreground mb-4">Try adjusting your search or category filter</p>
              <Button onClick={() => {setSearchQuery(''); setActiveCategory('All');}}>
                Reset Filters
              </Button>
            </motion.div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Blog;
