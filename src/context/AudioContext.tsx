import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { Song } from '@/types/music';
import { EQ_PRESETS, EQPreset, AudioFXState } from '@/hooks/useAudioFX';

interface SleepTimerState {
  active: boolean;
  remaining: number; // seconds remaining
  duration: number; // total seconds
}

interface AudioContextType {
  currentSong: Song | null;
  isPlaying: boolean;
  playlist: Song[];
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isShuffled: boolean;
  isRepeating: boolean;
  crossfadeEnabled: boolean;
  crossfadeDuration: number;
  sleepTimer: SleepTimerState;
  fxState: AudioFXState;
  analyserNode: AnalyserNode | null;
  playSong: (song: Song, playlist?: Song[]) => void;
  togglePlayPause: () => void;
  playNext: () => void;
  playPrevious: () => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  seekTo: (time: number) => void;
  audioRef: React.RefObject<HTMLAudioElement>;
  setPlaylist: (songs: Song[]) => void;
  addToQueue: (song: Song) => void;
  removeFromQueue: (songId: string) => void;
  toggleCrossfade: () => void;
  setCrossfadeDuration: (seconds: number) => void;
  setSleepTimer: (minutes: number) => void;
  cancelSleepTimer: () => void;
  // FX controls
  toggleEQ: () => void;
  setEQPreset: (preset: EQPreset) => void;
  setEQBandGain: (index: number, gain: number) => void;
  setVolumeBoost: (value: number) => void;
  toggleBassBoost: () => void;
  setBassGain: (gain: number) => void;
}

const AudioCtx = createContext<AudioContextType | undefined>(undefined);

export const useAudio = () => {
  const context = useContext(AudioCtx);
  if (!context) throw new Error('useAudio must be used within an AudioProvider');
  return context;
};

const DEFAULT_FX: AudioFXState = {
  eqEnabled: false,
  preset: 'flat',
  bands: [...EQ_PRESETS.flat.gains],
  volumeBoost: 100,
  bassBoostEnabled: false,
  bassBoostGain: 6,
};

function loadFXState(): AudioFXState {
  try {
    const saved = localStorage.getItem('audioFX');
    return saved ? { ...DEFAULT_FX, ...JSON.parse(saved) } : DEFAULT_FX;
  } catch { return DEFAULT_FX; }
}

const EQ_BANDS = [60, 170, 310, 600, 1000, 3000, 6000, 12000, 14000, 16000];

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playlist, setPlaylist] = useState<Song[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [isRepeating, setIsRepeating] = useState(false);
  const [crossfadeEnabled, setCrossfadeEnabled] = useState(() => localStorage.getItem('crossfade') === 'true');
  const [crossfadeDuration, setCrossfadeDurationState] = useState(() => {
    const saved = localStorage.getItem('crossfadeDuration');
    return saved ? parseInt(saved) : 3;
  });
  const [sleepTimer, setSleepTimerState] = useState<SleepTimerState>({ active: false, remaining: 0, duration: 0 });
  const [fxState, setFxState] = useState<AudioFXState>(loadFXState);
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);

  const audioRef = useRef<HTMLAudioElement>(null);
  const webAudioCtxRef = useRef<globalThis.AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const eqFiltersRef = useRef<BiquadFilterNode[]>([]);
  const bassFilterRef = useRef<BiquadFilterNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioChainInitRef = useRef(false);
  const sleepIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const crossfadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Persist FX state
  useEffect(() => {
    localStorage.setItem('audioFX', JSON.stringify(fxState));
  }, [fxState]);

  useEffect(() => {
    localStorage.setItem('crossfade', String(crossfadeEnabled));
  }, [crossfadeEnabled]);

  useEffect(() => {
    localStorage.setItem('crossfadeDuration', String(crossfadeDuration));
  }, [crossfadeDuration]);

  // --- Web Audio Chain (singleton) ---
  const initAudioChain = useCallback(() => {
    if (audioChainInitRef.current || !audioRef.current) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      webAudioCtxRef.current = ctx;

      const source = ctx.createMediaElementSource(audioRef.current);
      sourceRef.current = source;

      // EQ filters
      const filters = EQ_BANDS.map((freq, i) => {
        const f = ctx.createBiquadFilter();
        f.type = i === 0 ? 'lowshelf' : i === EQ_BANDS.length - 1 ? 'highshelf' : 'peaking';
        f.frequency.value = freq;
        f.Q.value = 1.4;
        f.gain.value = fxState.eqEnabled ? fxState.bands[i] : 0;
        return f;
      });
      eqFiltersRef.current = filters;

      // Bass boost
      const bassFilter = ctx.createBiquadFilter();
      bassFilter.type = 'lowshelf';
      bassFilter.frequency.value = 100;
      bassFilter.gain.value = fxState.bassBoostEnabled ? fxState.bassBoostGain : 0;
      bassFilterRef.current = bassFilter;

      // Gain (volume booster)
      const gainNode = ctx.createGain();
      gainNode.gain.value = fxState.volumeBoost / 100;
      gainNodeRef.current = gainNode;

      // Analyser
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      setAnalyserNode(analyser);

      // Chain: source → EQ → bass → gain → analyser → destination
      let last: AudioNode = source;
      filters.forEach(f => { last.connect(f); last = f; });
      last.connect(bassFilter);
      bassFilter.connect(gainNode);
      gainNode.connect(analyser);
      analyser.connect(ctx.destination);

      audioChainInitRef.current = true;
    } catch (e) {
      console.warn('Audio chain init failed:', e);
    }
  }, []);

  // Init on first play
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const handlePlay = () => {
      if (!audioChainInitRef.current) initAudioChain();
      if (webAudioCtxRef.current?.state === 'suspended') {
        webAudioCtxRef.current.resume();
      }
    };
    el.addEventListener('play', handlePlay);
    return () => el.removeEventListener('play', handlePlay);
  }, [initAudioChain]);

  // Sync EQ bands
  useEffect(() => {
    eqFiltersRef.current.forEach((f, i) => {
      f.gain.value = fxState.eqEnabled ? fxState.bands[i] : 0;
    });
  }, [fxState.eqEnabled, fxState.bands]);

  // Sync bass boost
  useEffect(() => {
    if (bassFilterRef.current) {
      bassFilterRef.current.gain.value = fxState.bassBoostEnabled ? fxState.bassBoostGain : 0;
    }
  }, [fxState.bassBoostEnabled, fxState.bassBoostGain]);

  // Sync volume boost
  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = fxState.volumeBoost / 100;
    }
  }, [fxState.volumeBoost]);

  // --- Crossfade logic ---
  const startCrossfadeToNext = useCallback(() => {
    if (!audioRef.current || !crossfadeEnabled) return false;
    // fade out current
    const el = audioRef.current;
    const fadeDur = crossfadeDuration * 1000;
    const startVol = el.volume;
    const fadeStart = Date.now();

    const fadeOut = () => {
      const elapsed = Date.now() - fadeStart;
      const progress = Math.min(elapsed / fadeDur, 1);
      el.volume = startVol * (1 - progress);
      if (progress < 1) {
        requestAnimationFrame(fadeOut);
      }
    };
    fadeOut();
    return true;
  }, [crossfadeEnabled, crossfadeDuration]);

  // --- Play Song ---
  const playSong = useCallback((song: Song, newPlaylist?: Song[]) => {
    setCurrentSong(song);
    if (newPlaylist) setPlaylist(newPlaylist);

    if (crossfadeTimerRef.current) {
      clearTimeout(crossfadeTimerRef.current);
      crossfadeTimerRef.current = null;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.volume = volume;
      audioRef.current.src = song.audio_url;
      audioRef.current.crossOrigin = 'anonymous';
      audioRef.current.load();

      // Fade in if crossfade enabled
      if (crossfadeEnabled) {
        audioRef.current.volume = 0;
        const fadeDur = crossfadeDuration * 1000;
        const fadeStart = Date.now();
        const targetVol = volume;
        const fadeIn = () => {
          if (!audioRef.current) return;
          const elapsed = Date.now() - fadeStart;
          const progress = Math.min(elapsed / fadeDur, 1);
          audioRef.current.volume = targetVol * progress;
          if (progress < 1) requestAnimationFrame(fadeIn);
        };
        audioRef.current.play().then(() => {
          setIsPlaying(true);
          fadeIn();
        }).catch(e => { console.error('Play error:', e); setIsPlaying(false); });
      } else {
        audioRef.current.play().then(() => setIsPlaying(true)).catch(e => {
          console.error('Play error:', e);
          setIsPlaying(false);
        });
      }
    }
  }, [volume, crossfadeEnabled, crossfadeDuration]);

  const togglePlayPause = useCallback(() => {
    if (!audioRef.current || !currentSong) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
    }
  }, [isPlaying, currentSong]);

  const playNext = useCallback(() => {
    if (!currentSong || playlist.length === 0) return;
    const idx = playlist.findIndex(s => s.id === currentSong.id);
    const next = isShuffled
      ? Math.floor(Math.random() * playlist.length)
      : (idx + 1) % playlist.length;
    playSong(playlist[next], playlist);
  }, [currentSong, playlist, isShuffled, playSong]);

  const playPrevious = useCallback(() => {
    if (!currentSong || playlist.length === 0) return;
    const idx = playlist.findIndex(s => s.id === currentSong.id);
    const prev = isShuffled
      ? Math.floor(Math.random() * playlist.length)
      : idx === 0 ? playlist.length - 1 : idx - 1;
    playSong(playlist[prev], playlist);
  }, [currentSong, playlist, isShuffled, playSong]);

  const setVolume = useCallback((v: number) => {
    setVolumeState(v);
    if (audioRef.current) audioRef.current.volume = v;
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted(m => {
      if (audioRef.current) audioRef.current.muted = !m;
      return !m;
    });
  }, []);

  const toggleShuffle = useCallback(() => setIsShuffled(s => !s), []);
  const toggleRepeat = useCallback(() => setIsRepeating(r => !r), []);

  const seekTo = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const addToQueue = useCallback((song: Song) => {
    setPlaylist(prev => prev.some(s => s.id === song.id) ? prev : [...prev, song]);
  }, []);

  const removeFromQueue = useCallback((songId: string) => {
    setPlaylist(prev => prev.filter(s => s.id !== songId));
  }, []);

  // Crossfade toggles
  const toggleCrossfade = useCallback(() => setCrossfadeEnabled(c => !c), []);
  const setCrossfadeDuration = useCallback((s: number) => setCrossfadeDurationState(Math.max(1, Math.min(10, s))), []);

  // --- Sleep Timer ---
  const setSleepTimer = useCallback((minutes: number) => {
    if (sleepIntervalRef.current) clearInterval(sleepIntervalRef.current);
    const totalSeconds = minutes * 60;
    setSleepTimerState({ active: true, remaining: totalSeconds, duration: totalSeconds });

    sleepIntervalRef.current = setInterval(() => {
      setSleepTimerState(prev => {
        if (prev.remaining <= 1) {
          // Time's up - pause
          if (audioRef.current) {
            audioRef.current.pause();
            setIsPlaying(false);
          }
          if (sleepIntervalRef.current) clearInterval(sleepIntervalRef.current);
          return { active: false, remaining: 0, duration: 0 };
        }
        return { ...prev, remaining: prev.remaining - 1 };
      });
    }, 1000);
  }, []);

  const cancelSleepTimer = useCallback(() => {
    if (sleepIntervalRef.current) clearInterval(sleepIntervalRef.current);
    setSleepTimerState({ active: false, remaining: 0, duration: 0 });
  }, []);

  // --- FX Actions ---
  const toggleEQ = useCallback(() => setFxState(p => ({ ...p, eqEnabled: !p.eqEnabled })), []);
  const setEQPreset = useCallback((preset: EQPreset) => {
    if (preset === 'custom') setFxState(p => ({ ...p, preset: 'custom' }));
    else setFxState(p => ({ ...p, preset, bands: [...EQ_PRESETS[preset].gains] }));
  }, []);
  const setEQBandGain = useCallback((index: number, gain: number) => {
    setFxState(p => {
      const bands = [...p.bands];
      bands[index] = Math.max(-12, Math.min(12, gain));
      return { ...p, bands, preset: 'custom' };
    });
  }, []);
  const setVolumeBoost = useCallback((v: number) => {
    setFxState(p => ({ ...p, volumeBoost: Math.max(0, Math.min(200, v)) }));
  }, []);
  const toggleBassBoost = useCallback(() => setFxState(p => ({ ...p, bassBoostEnabled: !p.bassBoostEnabled })), []);
  const setBassGain = useCallback((g: number) => {
    setFxState(p => ({ ...p, bassBoostGain: Math.max(0, Math.min(12, g)) }));
  }, []);

  // --- Audio element handlers ---
  const handleTimeUpdate = useCallback(() => {
    if (!audioRef.current) return;
    setCurrentTime(audioRef.current.currentTime);

    // Crossfade: start fading out near end
    if (crossfadeEnabled && audioRef.current.duration) {
      const remaining = audioRef.current.duration - audioRef.current.currentTime;
      if (remaining <= crossfadeDuration && remaining > crossfadeDuration - 0.2 && playlist.length > 0) {
        startCrossfadeToNext();
        crossfadeTimerRef.current = setTimeout(() => {
          playNext();
        }, crossfadeDuration * 1000);
      }
    }
  }, [crossfadeEnabled, crossfadeDuration, playlist, startCrossfadeToNext, playNext]);

  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) setDuration(audioRef.current.duration);
  }, []);

  const handleEnded = useCallback(() => {
    if (currentSong && audioRef.current) {
      window.dispatchEvent(new CustomEvent('song-ended', {
        detail: {
          song: currentSong,
          playDuration: audioRef.current.currentTime,
          songDuration: audioRef.current.duration,
        },
      }));
    }
    // If crossfade already triggered next, skip
    if (crossfadeTimerRef.current) {
      crossfadeTimerRef.current = null;
      return;
    }
    if (isRepeating && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(console.error);
    } else if (playlist.length > 0) {
      playNext();
    } else {
      setIsPlaying(false);
    }
  }, [isRepeating, playlist, playNext, currentSong]);

  // Cleanup sleep timer
  useEffect(() => {
    return () => {
      if (sleepIntervalRef.current) clearInterval(sleepIntervalRef.current);
    };
  }, []);

  return (
    <AudioCtx.Provider value={{
      currentSong, isPlaying, playlist, currentTime, duration, volume, isMuted,
      isShuffled, isRepeating, crossfadeEnabled, crossfadeDuration, sleepTimer,
      fxState, analyserNode,
      playSong, togglePlayPause, playNext, playPrevious, setVolume, toggleMute,
      toggleShuffle, toggleRepeat, seekTo, audioRef, setPlaylist, addToQueue, removeFromQueue,
      toggleCrossfade, setCrossfadeDuration, setSleepTimer, cancelSleepTimer,
      toggleEQ, setEQPreset, setEQBandGain, setVolumeBoost, toggleBassBoost, setBassGain,
    }}>
      {children}
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        preload="metadata"
      />
    </AudioCtx.Provider>
  );
};
