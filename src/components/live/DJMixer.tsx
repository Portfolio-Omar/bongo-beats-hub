import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Play, Pause, Volume2, Disc3, Music, Waves, GripVertical, SkipForward, SkipBack, Repeat, Shuffle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Song } from '@/types/music';

interface DeckState {
  song: Song | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  bass: number;
  mid: number;
  treble: number;
  gain: number;
  echo: number;
  reverb: number;
  lpf: number;
}

const defaultDeck: DeckState = {
  song: null, isPlaying: false, currentTime: 0, duration: 0,
  volume: 0.8, bass: 0, mid: 0, treble: 0, gain: 1,
  echo: 0, reverb: 0, lpf: 22050,
};

interface AudioNodes {
  gain: GainNode;
  bass: BiquadFilterNode;
  mid: BiquadFilterNode;
  treble: BiquadFilterNode;
  delay: DelayNode;
  delayGain: GainNode;
  feedback: GainNode;
  convolver: ConvolverNode;
  reverbGain: GainNode;
  dryGain: GainNode;
  lpf: BiquadFilterNode;
}

function createImpulse(ctx: AudioContext, duration = 2, decay = 2): AudioBuffer {
  const rate = ctx.sampleRate;
  const length = rate * duration;
  const buf = ctx.createBuffer(2, length, rate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buf.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
    }
  }
  return buf;
}

const DJMixer: React.FC = () => {
  const [deckA, setDeckA] = useState<DeckState>(defaultDeck);
  const [deckB, setDeckB] = useState<DeckState>(defaultDeck);
  const [crossfader, setCrossfader] = useState(50);
  const [masterVolume, setMasterVolume] = useState(80);
  const [showFX, setShowFX] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [draggedSong, setDraggedSong] = useState<Song | null>(null);
  const [queueA, setQueueA] = useState<Song[]>([]);
  const [queueB, setQueueB] = useState<Song[]>([]);
  const [autoplay, setAutoplay] = useState(true);

  const audioARef = useRef<HTMLAudioElement | null>(null);
  const audioBRef = useRef<HTMLAudioElement | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const nodesARef = useRef<AudioNodes | null>(null);
  const nodesBRef = useRef<AudioNodes | null>(null);
  const sourceARef = useRef<MediaElementAudioSourceNode | null>(null);
  const sourceBRef = useRef<MediaElementAudioSourceNode | null>(null);

  const { data: songs } = useQuery({
    queryKey: ['dj-songs'],
    queryFn: async () => {
      const { data } = await supabase.from('songs').select('*').eq('published', true).order('title');
      return (data || []) as Song[];
    },
  });

  const filteredSongs = songs?.filter(s =>
    !searchQuery || `${s.artist} ${s.title}`.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const initAudioCtx = useCallback(() => {
    if (ctxRef.current) return ctxRef.current;
    const ctx = new AudioContext();
    ctxRef.current = ctx;
    return ctx;
  }, []);

  const createChain = useCallback((audio: HTMLAudioElement, ctx: AudioContext, sourceRef: React.MutableRefObject<MediaElementAudioSourceNode | null>): AudioNodes | null => {
    if (sourceRef.current) return null;
    const source = ctx.createMediaElementSource(audio);
    sourceRef.current = source;

    const gain = ctx.createGain();
    const bass = ctx.createBiquadFilter(); bass.type = 'lowshelf'; bass.frequency.value = 200;
    const mid = ctx.createBiquadFilter(); mid.type = 'peaking'; mid.frequency.value = 1000; mid.Q.value = 1;
    const treble = ctx.createBiquadFilter(); treble.type = 'highshelf'; treble.frequency.value = 3000;
    const delay = ctx.createDelay(1.0); delay.delayTime.value = 0.3;
    const feedback = ctx.createGain(); feedback.gain.value = 0;
    const delayGain = ctx.createGain(); delayGain.gain.value = 0;
    const convolver = ctx.createConvolver();
    convolver.buffer = createImpulse(ctx);
    const reverbGain = ctx.createGain(); reverbGain.gain.value = 0;
    const dryGain = ctx.createGain(); dryGain.gain.value = 1;
    const lpf = ctx.createBiquadFilter(); lpf.type = 'lowpass'; lpf.frequency.value = 22050; lpf.Q.value = 1;

    source.connect(bass).connect(mid).connect(treble).connect(lpf);
    lpf.connect(dryGain).connect(gain).connect(ctx.destination);
    lpf.connect(delay).connect(feedback).connect(delay);
    delay.connect(delayGain).connect(gain);
    lpf.connect(convolver).connect(reverbGain).connect(gain);

    return { gain, bass, mid, treble, delay, delayGain, feedback, convolver, reverbGain, dryGain, lpf };
  }, []);

  const loadToDeck = useCallback((deck: 'A' | 'B', song: Song) => {
    const setDeck = deck === 'A' ? setDeckA : setDeckB;
    const audioRef = deck === 'A' ? audioARef : audioBRef;
    const nodesRef = deck === 'A' ? nodesARef : nodesBRef;
    const sourceRef = deck === 'A' ? sourceARef : sourceBRef;

    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.crossOrigin = 'anonymous';
      audioRef.current.preload = 'auto';
    }

    const audio = audioRef.current;
    audio.src = song.audio_url;
    audio.load();

    const ctx = initAudioCtx();
    if (!nodesRef.current) {
      nodesRef.current = createChain(audio, ctx, sourceRef);
    }

    audio.onloadedmetadata = () => {
      setDeck(prev => ({ ...prev, song, duration: audio.duration, currentTime: 0 }));
    };
    audio.ontimeupdate = () => {
      setDeck(prev => ({ ...prev, currentTime: audio.currentTime }));
    };
    audio.onended = () => {
      setDeck(prev => ({ ...prev, isPlaying: false, currentTime: 0 }));
      // Autoplay next from queue
      if (autoplay) {
        const queue = deck === 'A' ? queueA : queueB;
        const setQueue = deck === 'A' ? setQueueA : setQueueB;
        if (queue.length > 0) {
          const [next, ...rest] = queue;
          setQueue(rest);
          setTimeout(() => {
            loadToDeck(deck, next);
            setTimeout(() => togglePlay(deck), 300);
          }, 200);
        }
      }
    };

    setDeck(prev => ({ ...prev, song, isPlaying: false, currentTime: 0 }));
  }, [initAudioCtx, createChain, autoplay, queueA, queueB]);

  const togglePlay = useCallback((deck: 'A' | 'B') => {
    const audio = deck === 'A' ? audioARef.current : audioBRef.current;
    const setDeck = deck === 'A' ? setDeckA : setDeckB;
    if (!audio) return;

    if (audio.paused) {
      if (ctxRef.current?.state === 'suspended') ctxRef.current.resume();
      audio.play().then(() => setDeck(prev => ({ ...prev, isPlaying: true })));
    } else {
      audio.pause();
      setDeck(prev => ({ ...prev, isPlaying: false }));
    }
  }, []);

  const seekDeck = useCallback((deck: 'A' | 'B', time: number) => {
    const audio = deck === 'A' ? audioARef.current : audioBRef.current;
    if (audio) audio.currentTime = time;
  }, []);

  // Apply volumes based on crossfader + deck volumes + master
  useEffect(() => {
    const masterGain = masterVolume / 100;
    const crossA = Math.min(1, (100 - crossfader) / 50);
    const crossB = Math.min(1, crossfader / 50);
    if (audioARef.current) audioARef.current.volume = deckA.volume * crossA * masterGain;
    if (audioBRef.current) audioBRef.current.volume = deckB.volume * crossB * masterGain;
  }, [crossfader, masterVolume, deckA.volume, deckB.volume]);

  // Apply EQ + FX for deck A
  useEffect(() => {
    const n = nodesARef.current;
    if (!n) return;
    n.bass.gain.value = deckA.bass;
    n.mid.gain.value = deckA.mid;
    n.treble.gain.value = deckA.treble;
    n.gain.gain.value = deckA.gain;
    n.delayGain.gain.value = deckA.echo;
    n.feedback.gain.value = Math.min(deckA.echo * 0.6, 0.85);
    n.reverbGain.gain.value = deckA.reverb;
    n.dryGain.gain.value = Math.max(0.3, 1 - deckA.reverb * 0.5);
    n.lpf.frequency.value = deckA.lpf;
  }, [deckA.bass, deckA.mid, deckA.treble, deckA.gain, deckA.echo, deckA.reverb, deckA.lpf]);

  // Apply EQ + FX for deck B
  useEffect(() => {
    const n = nodesBRef.current;
    if (!n) return;
    n.bass.gain.value = deckB.bass;
    n.mid.gain.value = deckB.mid;
    n.treble.gain.value = deckB.treble;
    n.gain.gain.value = deckB.gain;
    n.delayGain.gain.value = deckB.echo;
    n.feedback.gain.value = Math.min(deckB.echo * 0.6, 0.85);
    n.reverbGain.gain.value = deckB.reverb;
    n.dryGain.gain.value = Math.max(0.3, 1 - deckB.reverb * 0.5);
    n.lpf.frequency.value = deckB.lpf;
  }, [deckB.bass, deckB.mid, deckB.treble, deckB.gain, deckB.echo, deckB.reverb, deckB.lpf]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const handleDragStart = (song: Song) => {
    setDraggedSong(song);
  };

  const handleDropOnDeck = (deck: 'A' | 'B') => {
    if (draggedSong) {
      loadToDeck(deck, draggedSong);
      setDraggedSong(null);
    }
  };

  const handleDropOnQueue = (deck: 'A' | 'B') => {
    if (draggedSong) {
      if (deck === 'A') setQueueA(prev => [...prev, draggedSong]);
      else setQueueB(prev => [...prev, draggedSong]);
      setDraggedSong(null);
    }
  };

  const removeFromQueue = (deck: 'A' | 'B', index: number) => {
    if (deck === 'A') setQueueA(prev => prev.filter((_, i) => i !== index));
    else setQueueB(prev => prev.filter((_, i) => i !== index));
  };

  const skipToNext = (deck: 'A' | 'B') => {
    const queue = deck === 'A' ? queueA : queueB;
    const setQueue = deck === 'A' ? setQueueA : setQueueB;
    if (queue.length > 0) {
      const [next, ...rest] = queue;
      setQueue(rest);
      loadToDeck(deck, next);
      setTimeout(() => togglePlay(deck), 300);
    }
  };

  const DeckUI = ({ deck, label, setDeck, deckKey }: { deck: DeckState; label: string; setDeck: React.Dispatch<React.SetStateAction<DeckState>>; deckKey: 'A' | 'B' }) => {
    const queue = deckKey === 'A' ? queueA : queueB;

    return (
      <div
        className="space-y-3"
        onDragOver={(e) => e.preventDefault()}
        onDrop={() => handleDropOnDeck(deckKey)}
      >
        <div className="flex items-center justify-between">
          <Badge variant={deck.isPlaying ? "default" : "secondary"} className="text-xs font-bold">
            <Disc3 className={`h-3 w-3 mr-1 ${deck.isPlaying ? 'animate-spin' : ''}`} />
            DECK {label}
          </Badge>
          <span className="text-xs text-muted-foreground font-mono">
            {formatTime(deck.currentTime)} / {formatTime(deck.duration)}
          </span>
        </div>

        <div className="bg-background/50 rounded px-2 py-1.5 text-xs truncate border border-border/50 min-h-[28px]">
          {deck.song ? (
            <span className="flex items-center gap-1">
              {deck.isPlaying && <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />}
              {deck.song.artist} — {deck.song.title}
            </span>
          ) : (
            <span className="text-muted-foreground italic">Drop a track here</span>
          )}
        </div>

        <Slider value={[deck.currentTime]} max={deck.duration || 100} step={0.1} onValueChange={([v]) => seekDeck(deckKey, v)} className="cursor-pointer" />

        <div className="flex items-center gap-1.5 justify-center">
          <Button size="icon" variant="ghost" onClick={() => seekDeck(deckKey, 0)} className="h-8 w-8">
            <SkipBack className="h-3.5 w-3.5" />
          </Button>
          <Button size="icon" variant={deck.isPlaying ? "default" : "outline"} onClick={() => togglePlay(deckKey)} className="h-10 w-10 rounded-full">
            {deck.isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button size="icon" variant="ghost" onClick={() => skipToNext(deckKey)} className="h-8 w-8" disabled={queue.length === 0}>
            <SkipForward className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Volume2 className="h-3 w-3" /> Vol
          </div>
          <Slider value={[deck.volume * 100]} max={100} onValueChange={([v]) => setDeck(prev => ({ ...prev, volume: v / 100 }))} />
        </div>

        {/* EQ */}
        <div className="grid grid-cols-3 gap-2 text-center">
          {([
            { label: 'BASS', key: 'bass' as const },
            { label: 'MID', key: 'mid' as const },
            { label: 'TREBLE', key: 'treble' as const },
          ]).map(({ label: eqLabel, key }) => (
            <div key={key} className="space-y-1">
              <span className="text-[10px] text-muted-foreground font-bold">{eqLabel}</span>
              <Slider
                orientation="vertical"
                value={[deck[key] + 12]}
                max={24}
                className="h-16 mx-auto"
                onValueChange={([v]) => setDeck(prev => ({ ...prev, [key]: v - 12 }))}
              />
            </div>
          ))}
        </div>

        {/* Gain */}
        <div className="space-y-1">
          <span className="text-[10px] text-muted-foreground font-bold">GAIN</span>
          <Slider value={[deck.gain * 50]} max={100} onValueChange={([v]) => setDeck(prev => ({ ...prev, gain: v / 50 }))} />
        </div>

        {/* FX Section */}
        {showFX && (
          <div className="space-y-2 pt-2 border-t border-border/30">
            <div className="space-y-1">
              <span className="text-[10px] text-muted-foreground font-bold">ECHO</span>
              <Slider value={[deck.echo * 100]} max={100} onValueChange={([v]) => setDeck(prev => ({ ...prev, echo: v / 100 }))} />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-muted-foreground font-bold">REVERB</span>
              <Slider value={[deck.reverb * 100]} max={100} onValueChange={([v]) => setDeck(prev => ({ ...prev, reverb: v / 100 }))} />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-muted-foreground font-bold">LPF CUTOFF</span>
              <Slider
                value={[Math.log2(deck.lpf / 200) / Math.log2(22050 / 200) * 100]}
                max={100}
                onValueChange={([v]) => {
                  const freq = 200 * Math.pow(22050 / 200, v / 100);
                  setDeck(prev => ({ ...prev, lpf: freq }));
                }}
              />
            </div>
          </div>
        )}

        {/* Queue */}
        <div
          className="border border-dashed border-border/50 rounded p-1.5 min-h-[40px]"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.stopPropagation(); handleDropOnQueue(deckKey); }}
        >
          <span className="text-[10px] text-muted-foreground font-bold block mb-1">
            QUEUE ({queue.length})
          </span>
          {queue.length === 0 ? (
            <p className="text-[10px] text-muted-foreground/50 italic">Drop tracks here to queue</p>
          ) : (
            <div className="space-y-0.5 max-h-20 overflow-y-auto">
              {queue.map((s, i) => (
                <div key={`${s.id}-${i}`} className="flex items-center gap-1 text-[10px] bg-accent/30 rounded px-1 py-0.5">
                  <span className="text-muted-foreground">{i + 1}.</span>
                  <span className="flex-1 truncate">{s.title}</span>
                  <button onClick={() => removeFromQueue(deckKey, i)} className="text-destructive hover:text-destructive/80 text-[10px]">✕</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Music className="h-4 w-4 text-primary" />
            DJ Mixer
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button size="sm" variant={autoplay ? "default" : "outline"} onClick={() => setAutoplay(!autoplay)} className="h-7 text-xs">
              <Repeat className="h-3 w-3 mr-1" /> Auto
            </Button>
            <Button size="sm" variant={showFX ? "default" : "outline"} onClick={() => setShowFX(!showFX)} className="h-7 text-xs">
              <Waves className="h-3 w-3 mr-1" /> FX
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <DeckUI deck={deckA} label="A" setDeck={setDeckA} deckKey="A" />
          <DeckUI deck={deckB} label="B" setDeck={setDeckB} deckKey="B" />
        </div>

        {/* Crossfader */}
        <div className="space-y-1 px-4">
          <div className="flex justify-between text-[10px] text-muted-foreground font-bold">
            <span>A</span><span>CROSSFADER</span><span>B</span>
          </div>
          <Slider value={[crossfader]} max={100} onValueChange={([v]) => setCrossfader(v)} />
        </div>

        {/* Master Volume */}
        <div className="space-y-1 px-4">
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold">
            <Volume2 className="h-3 w-3" /> MASTER VOLUME
          </div>
          <Slider value={[masterVolume]} max={100} onValueChange={([v]) => setMasterVolume(v)} />
        </div>

        {/* Song Library with drag */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground font-bold">TRACK LIBRARY</span>
            <span className="text-[10px] text-muted-foreground">{filteredSongs.length} tracks</span>
          </div>
          <input
            type="text"
            placeholder="Search tracks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-7 px-2 text-xs bg-background/50 border border-border/50 rounded focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
          <ScrollArea className="h-48">
            <div className="space-y-0.5 pr-2">
              {filteredSongs.map(song => (
                <div
                  key={song.id}
                  draggable
                  onDragStart={() => handleDragStart(song)}
                  onDragEnd={() => setDraggedSong(null)}
                  className="flex items-center gap-2 text-xs p-1.5 rounded hover:bg-accent/50 cursor-grab active:cursor-grabbing group border border-transparent hover:border-border/30 transition-colors"
                >
                  <GripVertical className="h-3 w-3 text-muted-foreground/40 shrink-0" />
                  {song.cover_url ? (
                    <img src={song.cover_url} alt="" className="h-7 w-7 rounded object-cover shrink-0" />
                  ) : (
                    <div className="h-7 w-7 rounded bg-primary/10 flex items-center justify-center shrink-0">
                      <Music className="h-3 w-3 text-primary/50" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium">{song.title}</p>
                    <p className="truncate text-[10px] text-muted-foreground">{song.artist}</p>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 flex gap-0.5 shrink-0">
                    <Button size="sm" variant="ghost" className="h-6 px-1.5 text-[10px]" onClick={() => loadToDeck('A', song)}>A</Button>
                    <Button size="sm" variant="ghost" className="h-6 px-1.5 text-[10px]" onClick={() => loadToDeck('B', song)}>B</Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
};

export default DJMixer;
