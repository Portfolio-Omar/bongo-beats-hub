import React, { useState, useEffect, useRef } from 'react';
import { useAudio } from '@/context/AudioContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic2, Search, Loader2, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

interface LyricLine {
  time: number; // seconds
  text: string;
}

// Simple LRC parser
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

// Generate placeholder lyrics with timestamps spread across the song duration
function generatePlaceholderLyrics(title: string, artist: string, duration: number): LyricLine[] {
  const lines = [
    `♪ ${title}`,
    `by ${artist}`,
    '',
    '♫ Music playing...',
    '',
    'Lyrics not available for this song.',
    '',
    'You can search for lyrics online',
    `or add them manually.`,
    '',
    `♪ ${title} ♪`,
  ];
  
  const interval = Math.max(duration / (lines.length + 1), 3);
  return lines.map((text, i) => ({
    time: interval * (i + 1),
    text,
  }));
}

const LyricsDisplay: React.FC = () => {
  const { currentSong, currentTime, duration, isPlaying } = useAudio();
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [activeLine, setActiveLine] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [hasRealLyrics, setHasRealLyrics] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [customLyrics, setCustomLyrics] = useState('');
  const [showPaste, setShowPaste] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Load lyrics when song changes
  useEffect(() => {
    if (!currentSong) return;
    
    setIsLoading(true);
    setHasRealLyrics(false);
    
    // Check localStorage for saved lyrics
    const savedKey = `lyrics_${currentSong.id}`;
    const saved = localStorage.getItem(savedKey);
    
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.lrc) {
          const parsedLines = parseLRC(parsed.lrc);
          if (parsedLines.length > 0) {
            setLyrics(parsedLines);
            setHasRealLyrics(true);
            setIsLoading(false);
            return;
          }
        }
      } catch {}
    }

    // Use placeholder
    const d = duration > 0 ? duration : 180;
    setLyrics(generatePlaceholderLyrics(currentSong.title, currentSong.artist, d));
    setIsLoading(false);
  }, [currentSong, duration]);

  // Track active line
  useEffect(() => {
    if (lyrics.length === 0) return;
    
    let active = -1;
    for (let i = lyrics.length - 1; i >= 0; i--) {
      if (currentTime >= lyrics[i].time) {
        active = i;
        break;
      }
    }
    
    if (active !== activeLine) {
      setActiveLine(active);
      // Auto-scroll to active line
      if (active >= 0 && lineRefs.current[active]) {
        lineRefs.current[active]?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    }
  }, [currentTime, lyrics, activeLine]);

  // Handle pasting LRC lyrics
  const handleSaveLyrics = () => {
    if (!currentSong || !customLyrics.trim()) return;
    
    const parsed = parseLRC(customLyrics);
    if (parsed.length > 0) {
      setLyrics(parsed);
      setHasRealLyrics(true);
      localStorage.setItem(`lyrics_${currentSong.id}`, JSON.stringify({ lrc: customLyrics }));
    } else {
      // Plain text — create timed lines
      const lines = customLyrics.split('\n').filter(l => l.trim());
      const interval = Math.max((duration || 180) / (lines.length + 1), 2);
      const timedLines = lines.map((text, i) => ({
        time: interval * (i + 1),
        text: text.trim(),
      }));
      setLyrics(timedLines);
      setHasRealLyrics(true);
      // Convert to LRC for storage
      const lrc = timedLines.map(l => {
        const m = Math.floor(l.time / 60);
        const s = Math.floor(l.time % 60);
        const ms = Math.floor((l.time % 1) * 100);
        return `[${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms).padStart(2, '0')}]${l.text}`;
      }).join('\n');
      localStorage.setItem(`lyrics_${currentSong.id}`, JSON.stringify({ lrc }));
    }
    setShowPaste(false);
    setCustomLyrics('');
  };

  if (!currentSong) return null;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Mic2 className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Lyrics</h3>
          {!hasRealLyrics && (
            <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">No lyrics</span>
          )}
        </div>
        <button
          onClick={() => setShowPaste(!showPaste)}
          className="text-[10px] text-primary hover:underline"
        >
          {showPaste ? 'Cancel' : 'Paste LRC'}
        </button>
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
            <button
              onClick={handleSaveLyrics}
              className="mt-1 text-xs bg-primary text-primary-foreground px-3 py-1 rounded-full hover:bg-primary/90 transition-colors"
            >
              Save Lyrics
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lyrics scroll area */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
          {lyrics.map((line, i) => (
            <div
              key={i}
              ref={el => { lineRefs.current[i] = el; }}
              className="cursor-pointer transition-all duration-300"
            >
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LyricsDisplay;
