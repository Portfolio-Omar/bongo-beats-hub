import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Volume2, Disc3, Music } from 'lucide-react';
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
}

const defaultDeck: DeckState = {
  song: null, isPlaying: false, currentTime: 0, duration: 0,
  volume: 0.8, bass: 0, mid: 0, treble: 0, gain: 1,
};

const DJMixer: React.FC = () => {
  const [deckA, setDeckA] = useState<DeckState>(defaultDeck);
  const [deckB, setDeckB] = useState<DeckState>(defaultDeck);
  const [crossfader, setCrossfader] = useState(50);
  const [masterVolume, setMasterVolume] = useState(80);
  const [_queue, _setQueue] = useState<Song[]>([]);

  const audioARef = useRef<HTMLAudioElement | null>(null);
  const audioBRef = useRef<HTMLAudioElement | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const nodesARef = useRef<{ gain: GainNode; bass: BiquadFilterNode; mid: BiquadFilterNode; treble: BiquadFilterNode } | null>(null);
  const nodesBRef = useRef<{ gain: GainNode; bass: BiquadFilterNode; mid: BiquadFilterNode; treble: BiquadFilterNode } | null>(null);
  const sourceARef = useRef<MediaElementAudioSourceNode | null>(null);
  const sourceBRef = useRef<MediaElementAudioSourceNode | null>(null);

  const { data: songs } = useQuery({
    queryKey: ['dj-songs'],
    queryFn: async () => {
      const { data } = await supabase.from('songs').select('*').eq('published', true).order('title');
      return (data || []) as Song[];
    },
  });

  const initAudioCtx = useCallback(() => {
    if (ctxRef.current) return ctxRef.current;
    const ctx = new AudioContext();
    ctxRef.current = ctx;
    return ctx;
  }, []);

  const createChain = useCallback((audio: HTMLAudioElement, ctx: AudioContext, sourceRef: React.MutableRefObject<MediaElementAudioSourceNode | null>) => {
    if (sourceRef.current) return null;
    const source = ctx.createMediaElementSource(audio);
    sourceRef.current = source;
    const gain = ctx.createGain();
    const bass = ctx.createBiquadFilter(); bass.type = 'lowshelf'; bass.frequency.value = 200;
    const mid = ctx.createBiquadFilter(); mid.type = 'peaking'; mid.frequency.value = 1000; mid.Q.value = 1;
    const treble = ctx.createBiquadFilter(); treble.type = 'highshelf'; treble.frequency.value = 3000;
    source.connect(bass).connect(mid).connect(treble).connect(gain).connect(ctx.destination);
    return { gain, bass, mid, treble };
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
    };

    setDeck(prev => ({ ...prev, song, isPlaying: false, currentTime: 0 }));
  }, [initAudioCtx, createChain]);

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

  // Apply EQ
  useEffect(() => {
    if (nodesARef.current) {
      nodesARef.current.bass.gain.value = deckA.bass;
      nodesARef.current.mid.gain.value = deckA.mid;
      nodesARef.current.treble.gain.value = deckA.treble;
      nodesARef.current.gain.gain.value = deckA.gain;
    }
  }, [deckA.bass, deckA.mid, deckA.treble, deckA.gain]);

  useEffect(() => {
    if (nodesBRef.current) {
      nodesBRef.current.bass.gain.value = deckB.bass;
      nodesBRef.current.mid.gain.value = deckB.mid;
      nodesBRef.current.treble.gain.value = deckB.treble;
      nodesBRef.current.gain.gain.value = deckB.gain;
    }
  }, [deckB.bass, deckB.mid, deckB.treble, deckB.gain]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const DeckUI = ({ deck, label, setDeck, deckKey }: { deck: DeckState; label: string; setDeck: React.Dispatch<React.SetStateAction<DeckState>>; deckKey: 'A' | 'B' }) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Badge variant={deck.isPlaying ? "default" : "secondary"} className="text-xs font-bold">
          <Disc3 className={`h-3 w-3 mr-1 ${deck.isPlaying ? 'animate-spin' : ''}`} />
          DECK {label}
        </Badge>
        <span className="text-xs text-muted-foreground font-mono">
          {formatTime(deck.currentTime)} / {formatTime(deck.duration)}
        </span>
      </div>

      {/* Song name */}
      <div className="bg-background/50 rounded px-2 py-1 text-xs truncate border border-border/50">
        {deck.song ? `${deck.song.artist} - ${deck.song.title}` : 'No track loaded'}
      </div>

      {/* Seek bar */}
      <Slider
        value={[deck.currentTime]}
        max={deck.duration || 100}
        step={0.1}
        onValueChange={([v]) => seekDeck(deckKey, v)}
        className="cursor-pointer"
      />

      {/* Controls */}
      <div className="flex items-center gap-2 justify-center">
        <Button size="icon" variant={deck.isPlaying ? "default" : "outline"} onClick={() => togglePlay(deckKey)} className="h-10 w-10 rounded-full">
          {deck.isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
      </div>

      {/* Volume */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Volume2 className="h-3 w-3" /> Vol
        </div>
        <Slider value={[deck.volume * 100]} max={100} onValueChange={([v]) => setDeck(prev => ({ ...prev, volume: v / 100 }))} />
      </div>

      {/* EQ */}
      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { label: 'BASS', key: 'bass' as const },
          { label: 'MID', key: 'mid' as const },
          { label: 'TREBLE', key: 'treble' as const },
        ].map(({ label: eqLabel, key }) => (
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
    </div>
  );

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Music className="h-4 w-4 text-primary" />
          DJ Mixer
        </CardTitle>
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

        {/* Song List */}
        <div className="space-y-1 max-h-40 overflow-y-auto">
          <span className="text-[10px] text-muted-foreground font-bold">TRACK LIBRARY</span>
          {songs?.slice(0, 20).map(song => (
            <div key={song.id} className="flex items-center gap-2 text-xs p-1.5 rounded hover:bg-accent/50 cursor-pointer group">
              <span className="flex-1 truncate">{song.artist} - {song.title}</span>
              <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px] opacity-0 group-hover:opacity-100" onClick={() => loadToDeck('A', song)}>A</Button>
              <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px] opacity-0 group-hover:opacity-100" onClick={() => loadToDeck('B', song)}>B</Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default DJMixer;
