import React from 'react';
import { Button } from '@/components/ui/button';
import { Share2, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface BlogShareButtonsProps {
  title: string;
  slug: string;
}

const BlogShareButtons: React.FC<BlogShareButtonsProps> = ({ title, slug }) => {
  const [copied, setCopied] = React.useState(false);
  const url = `https://oldskoool.netlify.app/blog/${slug}`;
  const encoded = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const copyLink = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('Link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const socials = [
    { name: 'WhatsApp', color: 'bg-[#25D366]', href: `https://wa.me/?text=${encodedTitle}%20${encoded}` },
    { name: 'Twitter', color: 'bg-[#1DA1F2]', href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encoded}` },
    { name: 'Facebook', color: 'bg-[#1877F2]', href: `https://www.facebook.com/sharer/sharer.php?u=${encoded}` },
  ];

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm text-muted-foreground flex items-center gap-1">
        <Share2 className="h-4 w-4" /> Share:
      </span>
      {socials.map((s) => (
        <a key={s.name} href={s.href} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm" className="text-xs h-8">
            {s.name}
          </Button>
        </a>
      ))}
      <Button variant="outline" size="sm" className="text-xs h-8 gap-1" onClick={copyLink}>
        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        {copied ? 'Copied' : 'Copy Link'}
      </Button>
    </div>
  );
};

export default BlogShareButtons;
