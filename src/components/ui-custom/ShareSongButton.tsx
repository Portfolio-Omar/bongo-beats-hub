import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Share2, Twitter, Facebook, MessageCircle, Link, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Song } from '@/types/music';

interface ShareSongButtonProps {
  song: Song;
  variant?: 'ghost' | 'outline' | 'default';
  size?: 'sm' | 'default' | 'icon';
  className?: string;
}

const ShareSongButton: React.FC<ShareSongButtonProps> = ({ 
  song, 
  variant = 'ghost', 
  size = 'icon',
  className = '' 
}) => {
  const [copied, setCopied] = useState(false);

  const shareText = `🎵 Check out "${song.title}" by ${song.artist} on Bongo Beats Hub!`;
  const shareUrl = `${window.location.origin}/music?song=${song.id}`;

  const handleTwitterShare = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');
  };

  const handleFacebookShare = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
    window.open(facebookUrl, '_blank', 'width=600,height=400');
  };

  const handleWhatsAppShare = () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${song.title} by ${song.artist}`,
          text: shareText,
          url: shareUrl,
        });
      } catch (error) {
        // User cancelled or error
      }
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={`hover:bg-primary/10 hover:text-primary ${className}`}
          onClick={(e) => e.stopPropagation()}
        >
          <Share2 className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 bg-card border-border z-50">
        <DropdownMenuItem onClick={handleTwitterShare} className="cursor-pointer">
          <Twitter className="h-4 w-4 mr-2 text-[#1DA1F2]" />
          Share on Twitter
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleFacebookShare} className="cursor-pointer">
          <Facebook className="h-4 w-4 mr-2 text-[#4267B2]" />
          Share on Facebook
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleWhatsAppShare} className="cursor-pointer">
          <MessageCircle className="h-4 w-4 mr-2 text-[#25D366]" />
          Share on WhatsApp
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopyLink} className="cursor-pointer">
          {copied ? (
            <Check className="h-4 w-4 mr-2 text-green-500" />
          ) : (
            <Link className="h-4 w-4 mr-2" />
          )}
          {copied ? 'Copied!' : 'Copy Link'}
        </DropdownMenuItem>
        {navigator.share && (
          <DropdownMenuItem onClick={handleNativeShare} className="cursor-pointer">
            <Share2 className="h-4 w-4 mr-2" />
            More Options...
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ShareSongButton;
