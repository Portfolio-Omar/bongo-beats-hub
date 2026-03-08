import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAudio } from '@/context/AudioContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic2, Loader2, Wand2, MicVocal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface LyricLine {
  time: number;
  text: string;
  words?: { word: string; startTime: number; endTime: number }[];
}

// Parse LRC format
function parseLRC(lrc: string): LyricLine[] {
  const lines: LyricLine[] = [];
  const regex = /\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\](.*)/;

  lrc.split('\n').forEach(line => {
    const match = line.match(regex);
    if (match) {
      const minutes = parseInt(match[1]);
      const seconds = parseInt(match[2]);
      const ms = match[3] ? parseInt(match[3].padEnd(3, '0')) : 0;
      const time = minutes * 60 + seconds + ms / 1000;
      const text = match[4].trim();
      if (text) lines.push({ time, text });
    }
  });

  return lines.sort((a, b) => a.time - b.time);
}

// Generate word-level timestamps for karaoke mode
function generateWordTimings(lines: LyricLine[]): LyricLine[] {
  return lines.map((line, i) => {
    const nextTime = i < lines.length - 1 ? lines[i + 1].time : line.time + 5;
    const lineDuration = nextTime - line.time;
    const words = line.text.split(/\s+/).filter(w => w.length > 0);
    if (words.length === 0) return { ...line, words: [] };

    const wordDuration = lineDuration / words.length;
    const wordTimings = words.map((word, wi) => ({
      word,
      startTime: line.time + wi * wordDuration,
      endTime: line.time + (wi + 1) * wordDuration,
    }));

    return { ...line, words: wordTimings };
  });
}

function generatePlaceholderLyrics(title: string, artist: string, duration: number): LyricLine[] {
  const lines = [
    `♪ ${title}`, `by ${artist}`, '', '♫ Music playing...', '',
    'Lyrics not available yet.', '', 'Click "Auto-Fetch" to search for lyrics,',
    'or paste them manually.', '', `♪ ${title} ♪`,
  ];
  const interval = Math.max(duration / (lines.length + 1), 3);
  return lines.map((text, i) => ({ time: interval * (i + 1), text }));
}

const LyricsDisplay: React.FC = () => {
  const { currentSong, currentTime, duration, isPlaying } = useAudio();
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [activeLine, setActiveLine] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [hasRealLyrics, setHasRealLyrics] = useState(false);
  const [karaokeMode, setKaraokeMode] = useState(false);
  const [customLyrics, setCustomLyrics] = useState('');
  const [showPaste, setShowPaste] = useState(false);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Load lyrics when song changes
  useEffect(() => {
    if (!currentSong) return;
    setIsLoading(true);
    setHasRealLyrics(false);

    const savedKey = `lyrics_${currentSong.id}`;
    const saved = localStorage.getItem(savedKey);

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.lrc) {
          const parsedLines = parseLRC(parsed.lrc);
          if (parsedLines.length > 0) {
            setLyrics(generateWordTimings(parsedLines));
            setHasRealLyrics(true);
            setIsLoading(false);
            return;
          }
        }
      } catch {}
    }

    const d = duration > 0 ? duration : 180;
    setLyrics(generateWordTimings(generatePlaceholderLyrics(currentSong.title, currentSong.artist, d)));
    setIsLoading(false);

    // Auto-fetch lyrics
    autoFetchLyrics();
  }, [currentSong?.id]);

  const autoFetchLyrics = useCallback(async () => {
    if (!currentSong) return;
    const savedKey = `lyrics_${currentSong.id}`;
    if (localStorage.getItem(savedKey)) return; // Already have lyrics

    setIsFetching(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-lyrics', {
        body: { title: currentSong.title, artist: currentSong.artist, duration: duration || 180 },
      });

      if (error) throw error;
      if (data?.success && data?.lrc) {
        const parsedLines = parseLRC(data.lrc);
        if (parsedLines.length > 2) {
          const withWords = generateWordTimings(parsedLines);
          setLyrics(withWords);
          setHasRealLyrics(true);
          localStorage.setItem(savedKey, JSON.stringify({ lrc: data.lrc }));
          toast.success('Lyrics loaded!');
        }
      }
    } catch (e: any) {
      console.error('Auto-fetch lyrics failed:', e);
    } finally {
      setIsFetching(false);
    }
  }, [currentSong, duration]);

  // Track active line
  useEffect(() => {
    if (lyrics.length === 0) return;
    let active = -1;
    for (let i = lyrics.length - 1; i >= 0; i--) {
      if (currentTime >= lyrics[i].time) { active = i; break; }
    }
    if (active !== activeLine) {
      setActiveLine(active);
      if (active >= 0 && lineRefs.current[active]) {
        lineRefs.current[active]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentTime, lyrics, activeLine]);

  const handleManualFetch = async () => {
    if (!currentSong) return;
    // Clear cached to force re-fetch
    localStorage.removeItem(`lyrics_${currentSong.id}`);
    setHasRealLyrics(false);
    await autoFetchLyrics();
  };

  const handleSaveLyrics = () => {
    if (!currentSong || !customLyrics.trim()) return;
    const parsed = parseLRC(customLyrics);
    if (parsed.length > 0) {
      setLyrics(generateWordTimings(parsed));
      setHasRealLyrics(true);
      localStorage.setItem(`lyrics_${currentSong.id}`, JSON.stringify({ lrc: customLyrics }));
    } else {
      const lines = customLyrics.split('\n').filter(l => l.trim());
      const interval = Math.max((duration || 180) / (lines.length + 1), 2);
      const timedLines = lines.map((text, i) => ({ time: interval * (i + 1), text: text.trim() }));
      const lrc = timedLines.map(l => {
        const m = Math.floor(l.time / 60);
        const s = Math.floor(l.time % 60);
        const ms = Math.floor((l.time % 1) * 100);
        return `[${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms).padStart(2, '0')}]${l.text}`;
      }).join('\n');
      setLyrics(generateWordTimings(timedLines as LyricLine[]));
      setHasRealLyrics(true);
      localStorage.setItem(`lyrics_${currentSong.id}`, JSON.stringify({ lrc }));
    }
    setShowPaste(false);
    setCustomLyrics('');
  };

  if (!currentSong) return null;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Mic2 className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Lyrics</h3>
          {isFetching && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
          {!hasRealLyrics && !isFetching && (
            <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">No lyrics</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant={karaokeMode ? 'default' : 'outline'}
            size="sm"
            className="h-6 px-2 text-[10px] rounded-full gap-1"
            onClick={() => setKaraokeMode(!karaokeMode)}
          >
            <MicVocal className="h-3 w-3" />
            Karaoke
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-6 px-2 text-[10px] rounded-full gap-1"
            onClick={handleManualFetch}
            disabled={isFetching}
          >
            <Wand2 className="h-3 w-3" />
            {isFetching ? 'Fetching...' : 'Auto-Fetch'}
          </Button>
          <button
            onClick={() => setShowPaste(!showPaste)}
            className="text-[10px] text-primary hover:underline px-1"
          >
            {showPaste ? 'Cancel' : 'Paste LRC'}
          </button>
        </div>
      </div>

      {/* Paste LRC input */}
      <AnimatePresence>
        {showPaste && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-3"
          >
            <textarea
              value={customLyrics}
              onChange={(e) => setCustomLyrics(e.target.value)}
              placeholder="Paste LRC lyrics or plain text here..."
              className="w-full h-24 text-xs bg-muted/50 border border-border rounded-lg p-2 resize-none focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <Button onClick={handleSaveLyrics} size="sm" className="mt-1 rounded-full text-xs h-7 px-3">
              Save Lyrics
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lyrics scroll area */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
          {lyrics.map((line, i) => (
            <div
              key={i}
              ref={el => { lineRefs.current[i] = el; }}
              className="cursor-pointer transition-all duration-300"
            >
              {karaokeMode && line.words && line.words.length > 0 ? (
                <KaraokeLine
                  line={line}
                  isActive={i === activeLine}
                  isPast={i < activeLine}
                  currentTime={currentTime}
                />
              ) : (
                <motion.p
                  animate={{
                    scale: i === activeLine ? 1.02 : 1,
                    opacity: i === activeLine ? 1 : i < activeLine ? 0.35 : 0.5,
                  }}
                  transition={{ duration: 0.3 }}
                  className={`text-sm leading-relaxed py-1 px-2 rounded transition-colors ${
                    i === activeLine
                      ? 'text-primary font-bold bg-primary/5'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {line.text || '♪'}
                </motion.p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Karaoke line with word-by-word highlighting
const KaraokeLine: React.FC<{
  line: LyricLine;
  isActive: boolean;
  isPast: boolean;
  currentTime: number;
}> = ({ line, isActive, isPast, currentTime }) => {
  return (
    <motion.div
      animate={{
        scale: isActive ? 1.03 : 1,
        opacity: isActive ? 1 : isPast ? 0.3 : 0.5,
      }}
      transition={{ duration: 0.2 }}
      className={`text-sm leading-relaxed py-1.5 px-2 rounded flex flex-wrap gap-x-1.5 ${
        isActive ? 'bg-primary/5' : ''
      }`}
    >
      {line.words?.map((w, wi) => {
        const progress = !isActive
          ? isPast ? 1 : 0
          : currentTime < w.startTime
            ? 0
            : currentTime >= w.endTime
              ? 1
              : (currentTime - w.startTime) / (w.endTime - w.startTime);

        return (
          <span
            key={wi}
            className="relative inline-block transition-transform duration-100"
            style={{
              transform: isActive && progress > 0 && progress < 1 ? 'scale(1.08)' : 'scale(1)',
            }}
          >
            {/* Background text (unhighlighted) */}
            <span className={`${isPast ? 'text-muted-foreground/40' : 'text-muted-foreground/60'}`}>
              {w.word}
            </span>
            {/* Overlay highlighted text using clip */}
            <span
              className="absolute inset-0 text-primary font-bold overflow-hidden whitespace-nowrap"
              style={{
                clipPath: `inset(0 ${(1 - progress) * 100}% 0 0)`,
              }}
            >
              {w.word}
            </span>
          </span>
        );
      })}
    </motion.div>
  );
};

export default LyricsDisplay;
