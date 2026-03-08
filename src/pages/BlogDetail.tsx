import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Calendar, Clock, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';

interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  date: string;
  featured_image_url?: string | null;
  slug?: string | null;
  status: string;
  author?: string | null;
  tags?: string[] | null;
  rich_content?: any;
}

const BlogDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [blog, setBlog] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [relatedBlogs, setRelatedBlogs] = useState<BlogPost[]>([]);

  useEffect(() => {
    if (slug) fetchBlog();
  }, [slug]);

  const fetchBlog = async () => {
    setLoading(true);
    // Try by slug first, then by id
    let { data } = await supabase
      .from('blogs')
      .select('*')
      .eq('slug', slug!)
      .eq('status', 'published')
      .maybeSingle();

    if (!data) {
      const res = await supabase
        .from('blogs')
        .select('*')
        .eq('id', slug!)
        .eq('status', 'published')
        .maybeSingle();
      data = res.data;
    }

    if (data) {
      setBlog(data as BlogPost);
      // Fetch related
      const { data: related } = await supabase
        .from('blogs')
        .select('*')
        .eq('status', 'published')
        .neq('id', data.id)
        .order('date', { ascending: false })
        .limit(3);
      if (related) setRelatedBlogs(related as BlogPost[]);
    }
    setLoading(false);
  };

  const getFormattedDate = (dateString: string) => {
    try { return format(new Date(dateString), 'MMMM dd, yyyy'); }
    catch { return dateString; }
  };

  const estimateReadTime = (content: string) => {
    const words = content.split(/\s+/).length;
    return Math.max(1, Math.ceil(words / 200));
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="h-64 w-full rounded-xl mb-6" />
        <Skeleton className="h-10 w-3/4 mb-4" />
        <Skeleton className="h-4 w-1/2 mb-8" />
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-4 w-full" />)}
        </div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold mb-4">Article Not Found</h2>
        <p className="text-muted-foreground mb-6">The article you're looking for doesn't exist or has been removed.</p>
        <Button asChild><Link to="/blog"><ArrowLeft className="mr-2 h-4 w-4" />Back to Blog</Link></Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        {/* Back button */}
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/blog"><ArrowLeft className="mr-2 h-4 w-4" />Back to Articles</Link>
        </Button>

        {/* Featured Image */}
        {blog.featured_image_url && (
          <div className="rounded-xl overflow-hidden mb-8 max-h-[500px]">
            <img src={blog.featured_image_url} alt={blog.title} className="w-full h-full object-cover" />
          </div>
        )}

        {/* Tags */}
        {blog.tags && blog.tags.length > 0 && (
          <div className="flex gap-2 mb-4 flex-wrap">
            {blog.tags.map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
            ))}
          </div>
        )}

        {/* Title */}
        <h1 className="text-3xl md:text-5xl font-heading font-bold mb-4 leading-tight">{blog.title}</h1>

        {/* Meta */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-8 pb-6 border-b border-border">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>{getFormattedDate(blog.date)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{estimateReadTime(blog.content)} min read</span>
          </div>
          {blog.author && (
            <div className="flex items-center gap-1">
              <User className="h-4 w-4" />
              <span>{blog.author}</span>
            </div>
          )}
        </div>

        {/* Content */}
        <article className="prose prose-lg dark:prose-invert max-w-none mb-12">
          <ReactMarkdown>{blog.content}</ReactMarkdown>
        </article>

        {/* Related Articles */}
        {relatedBlogs.length > 0 && (
          <div className="border-t border-border pt-8">
            <h3 className="text-2xl font-heading font-bold mb-6">Related Articles</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {relatedBlogs.map(related => (
                <Link key={related.id} to={`/blog/${related.slug || related.id}`}
                  className="group block rounded-lg border border-border overflow-hidden hover:border-primary/50 transition-colors">
                  {related.featured_image_url ? (
                    <img src={related.featured_image_url} alt={related.title}
                      className="w-full h-32 object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <div className="w-full h-32 bg-gradient-to-br from-primary/10 to-primary/30 flex items-center justify-center">
                      <span className="text-primary text-sm">Bongo Old Skool</span>
                    </div>
                  )}
                  <div className="p-4">
                    <h4 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">{related.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{getFormattedDate(related.date)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default BlogDetail;
