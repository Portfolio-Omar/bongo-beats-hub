import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, RotateCcw, X, Headphones } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAudio } from '@/context/AudioContext';
import { Song } from '@/types/music';

interface ContinueState {
  song: Song;
  queue: Song[];
  position: number;
  duration: number;
  savedAt: number;
}

const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const ContinueListening: React.FC = () => {
  const { playSong, currentSong } = useAudio();
  const [state, setState] = useState<ContinueState | null>(null);
  const [dismissedId, setDismissedId] = useState<string | null>(null);

  useEffect(() => {
    const load = () => {
      try {
        const raw = localStorage.getItem('continueListening');
        if (!raw) { setState(null); return; }
        const parsed = JSON.parse(raw) as ContinueState;
        if (!parsed?.song?.id || Date.now() - (parsed.savedAt || 0) > MAX_AGE_MS) {
          setState(null);
          return;
        }
        setState(parsed);
      } catch { setState(null); }
    };
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!state || !state.song) return null;
  if (dismissedId === state.song.id) return null;
  if (currentSong?.id === state.song.id) return null;

  const queue = [state.song, ...(state.queue || [])];
  const progress = state.duration > 0 ? Math.min(100, (state.position / state.duration) * 100) : 0;
  const resumeAt = state.duration > 0 && state.position >= state.duration - 3 ? 0 : state.position;

  return (
    <section className="py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <Card className="border-gold/30 bg-gradient-to-r from-gold/10 via-card to-card shadow-lg">
            <CardContent className="p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 shadow-lg">
                  {state.song.cover_url ? (
                    <img src={state.song.cover_url} alt={state.song.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gold/30 to-gold/10 flex items-center justify-center">
                      <Headphones className="w-8 h-8 text-gold" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 w-full">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gold">Continue Listening</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground"
                      onClick={() => setDismissedId(state.song.id)}
                      aria-label="Dismiss"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <h3 className="font-heading font-bold text-lg truncate">{state.song.title}</h3>
                  <p className="text-sm text-muted-foreground truncate">{state.song.artist}</p>

                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-10 text-right">{formatTime(resumeAt)}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-gold rounded-full" style={{ width: `${progress}%` }} />
                    </div>
                    {state.duration > 0 && (
                      <span className="text-xs text-muted-foreground w-10">{formatTime(state.duration)}</span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <Button
                      size="sm"
                      className="bg-gold hover:bg-gold/90 text-gold-foreground"
                      onClick={() => playSong(state.song, queue, resumeAt)}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      {resumeAt > 0 ? `Resume from ${formatTime(resumeAt)}` : 'Play again'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-gold/40 hover:bg-gold/10"
                      onClick={() => playSong(state.song, queue, 0)}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Start Over
                    </Button>
                    {queue.length > 1 && (
                      <p className="text-xs text-muted-foreground">Queue: {queue.length} songs</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
};

export default ContinueListening;
