import { useState, useEffect, useRef, useCallback } from 'react';

// EQ band definitions (Hz)
const EQ_BANDS = [60, 170, 310, 600, 1000, 3000, 6000, 12000, 14000, 16000] as const;

export type EQPreset = 'flat' | 'rock' | 'jazz' | 'pop' | 'classical' | 'bass_boost' | 'vocal' | 'custom';

interface EQPresetData {
  label: string;
  gains: number[]; // one per band, dB
}

export const EQ_PRESETS: Record<EQPreset, EQPresetData> = {
  flat:        { label: 'Flat',       gains: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  rock:        { label: 'Rock',       gains: [5, 4, 3, 1, -1, 1, 3, 4, 5, 5] },
  jazz:        { label: 'Jazz',       gains: [3, 2, 1, 2, -1, -1, 0, 1, 2, 3] },
  pop:         { label: 'Pop',        gains: [-1, 1, 3, 4, 3, 1, -1, -2, -1, 0] },
  classical:   { label: 'Classical',  gains: [4, 3, 2, 1, -1, -1, 0, 2, 3, 4] },
  bass_boost:  { label: 'Bass Boost', gains: [6, 5, 4, 2, 0, 0, 0, 0, 0, 0] },
  vocal:       { label: 'Vocal',      gains: [-2, -1, 0, 2, 4, 4, 2, 0, -1, -2] },
  custom:      { label: 'Custom',     gains: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
};

export interface AudioFXState {
  eqEnabled: boolean;
  preset: EQPreset;
  bands: number[]; // current gain per band
  volumeBoost: number; // 0-200 (percentage, 100 = normal)
  bassBoostEnabled: boolean;
  bassBoostGain: number; // 0-12 dB
}

const DEFAULT_STATE: AudioFXState = {
  eqEnabled: false,
  preset: 'flat',
  bands: [...EQ_PRESETS.flat.gains],
  volumeBoost: 100,
  bassBoostEnabled: false,
  bassBoostGain: 6,
};

export function useAudioFX(audioElement: HTMLAudioElement | null) {
  const [state, setState] = useState<AudioFXState>(() => {
    try {
      const saved = localStorage.getItem('audioFX');
      return saved ? { ...DEFAULT_STATE, ...JSON.parse(saved) } : DEFAULT_STATE;
    } catch {
      return DEFAULT_STATE;
    }
  });

  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const eqFiltersRef = useRef<BiquadFilterNode[]>([]);
  const bassFilterRef = useRef<BiquadFilterNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const connectedRef = useRef(false);

  // Persist
  useEffect(() => {
    localStorage.setItem('audioFX', JSON.stringify(state));
  }, [state]);

  const initAudioChain = useCallback(() => {
    if (!audioElement || connectedRef.current) return;

    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = ctx;

      const source = ctx.createMediaElementSource(audioElement);
      sourceRef.current = source;

      // EQ filters
      const filters = EQ_BANDS.map((freq, i) => {
        const f = ctx.createBiquadFilter();
        f.type = i === 0 ? 'lowshelf' : i === EQ_BANDS.length - 1 ? 'highshelf' : 'peaking';
        f.frequency.value = freq;
        f.Q.value = 1.4;
        f.gain.value = state.eqEnabled ? state.bands[i] : 0;
        return f;
      });
      eqFiltersRef.current = filters;

      // Bass boost filter
      const bassFilter = ctx.createBiquadFilter();
      bassFilter.type = 'lowshelf';
      bassFilter.frequency.value = 100;
      bassFilter.gain.value = state.bassBoostEnabled ? state.bassBoostGain : 0;
      bassFilterRef.current = bassFilter;

      // Volume boost (gain node)
      const gainNode = ctx.createGain();
      gainNode.gain.value = state.volumeBoost / 100;
      gainNodeRef.current = gainNode;

      // Chain: source → EQ filters → bass filter → gain → destination
      let lastNode: AudioNode = source;
      filters.forEach(f => {
        lastNode.connect(f);
        lastNode = f;
      });
      lastNode.connect(bassFilter);
      bassFilter.connect(gainNode);
      gainNode.connect(ctx.destination);

      connectedRef.current = true;
    } catch (e) {
      console.warn('AudioFX init failed:', e);
    }
  }, [audioElement]);

  // Init on first play
  useEffect(() => {
    if (!audioElement) return;
    const handlePlay = () => {
      if (!connectedRef.current) initAudioChain();
      if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume();
      }
    };
    audioElement.addEventListener('play', handlePlay);
    return () => audioElement.removeEventListener('play', handlePlay);
  }, [audioElement, initAudioChain]);

  // Sync EQ bands
  useEffect(() => {
    eqFiltersRef.current.forEach((f, i) => {
      f.gain.value = state.eqEnabled ? state.bands[i] : 0;
    });
  }, [state.eqEnabled, state.bands]);

  // Sync bass boost
  useEffect(() => {
    if (bassFilterRef.current) {
      bassFilterRef.current.gain.value = state.bassBoostEnabled ? state.bassBoostGain : 0;
    }
  }, [state.bassBoostEnabled, state.bassBoostGain]);

  // Sync volume boost
  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = state.volumeBoost / 100;
    }
  }, [state.volumeBoost]);

  // Actions
  const toggleEQ = useCallback(() => {
    setState(p => ({ ...p, eqEnabled: !p.eqEnabled }));
  }, []);

  const setPreset = useCallback((preset: EQPreset) => {
    if (preset === 'custom') {
      setState(p => ({ ...p, preset: 'custom' }));
    } else {
      setState(p => ({ ...p, preset, bands: [...EQ_PRESETS[preset].gains] }));
    }
  }, []);

  const setBandGain = useCallback((index: number, gain: number) => {
    setState(p => {
      const bands = [...p.bands];
      bands[index] = Math.max(-12, Math.min(12, gain));
      return { ...p, bands, preset: 'custom' };
    });
  }, []);

  const setVolumeBoost = useCallback((value: number) => {
    setState(p => ({ ...p, volumeBoost: Math.max(0, Math.min(200, value)) }));
  }, []);

  const toggleBassBoost = useCallback(() => {
    setState(p => ({ ...p, bassBoostEnabled: !p.bassBoostEnabled }));
  }, []);

  const setBassGain = useCallback((gain: number) => {
    setState(p => ({ ...p, bassBoostGain: Math.max(0, Math.min(12, gain)) }));
  }, []);

  return {
    state,
    eqBands: EQ_BANDS,
    presets: EQ_PRESETS,
    toggleEQ,
    setPreset,
    setBandGain,
    setVolumeBoost,
    toggleBassBoost,
    setBassGain,
  };
}
