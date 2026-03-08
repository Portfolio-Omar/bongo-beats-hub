import React, { useState, useRef } from 'react';
import { Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface VoiceNotePlayerProps {
  url: string;
  duration?: number;
  isOwn: boolean;
}

const VoiceNotePlayer: React.FC<VoiceNotePlayerProps> = ({ url, duration, isOwn }) => {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const toggle = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(url);
      audioRef.current.ontimeupdate = () => {
        if (audioRef.current) {
          setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
        }
      };
      audioRef.current.onended = () => {
        setPlaying(false);
        setProgress(0);
      };
    }
    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setPlaying(!playing);
  };

  const formatDuration = (secs?: number) => {
    if (!secs) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.round(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className={cn(
      'flex items-center gap-2 p-2 rounded-lg min-w-[180px]',
      isOwn ? 'bg-primary-foreground/10' : 'bg-background/50'
    )}>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0"
        onClick={toggle}
      >
        {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </Button>
      <div className="flex-1 space-y-1">
        <div className="h-1 rounded-full bg-muted-foreground/20 overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              isOwn ? 'bg-primary-foreground/60' : 'bg-primary'
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-[10px] opacity-60">{formatDuration(duration)}</span>
      </div>
    </div>
  );
};

export default VoiceNotePlayer;
