import { useState, useEffect, useRef, useCallback } from 'react';

interface BassBoostState {
  enabled: boolean;
  gain: number; // 0-12 dB
  frequency: number; // Hz
}

export function useBassBoost(audioElement: HTMLAudioElement | null) {
  const [bassBoost, setBassBoost] = useState<BassBoostState>(() => {
    const saved = localStorage.getItem('bassBoost');
    return saved ? JSON.parse(saved) : { enabled: false, gain: 6, frequency: 100 };
  });

  const audioContextRef = useRef<AudioContext | null>(null);
  const biquadFilterRef = useRef<BiquadFilterNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const connectedRef = useRef(false);

  useEffect(() => {
    localStorage.setItem('bassBoost', JSON.stringify(bassBoost));
  }, [bassBoost]);

  const initAudioContext = useCallback(() => {
    if (!audioElement || connectedRef.current) return;

    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = ctx;

      const source = ctx.createMediaElementSource(audioElement);
      sourceRef.current = source;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowshelf';
      filter.frequency.value = bassBoost.frequency;
      filter.gain.value = bassBoost.enabled ? bassBoost.gain : 0;
      biquadFilterRef.current = filter;

      source.connect(filter);
      filter.connect(ctx.destination);
      connectedRef.current = true;
    } catch (e) {
      console.warn('Bass boost init failed:', e);
    }
  }, [audioElement]);

  // Init on first play
  useEffect(() => {
    if (!audioElement) return;

    const handlePlay = () => {
      if (!connectedRef.current) {
        initAudioContext();
      }
      if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume();
      }
    };

    audioElement.addEventListener('play', handlePlay);
    return () => audioElement.removeEventListener('play', handlePlay);
  }, [audioElement, initAudioContext]);

  // Update filter params
  useEffect(() => {
    if (!biquadFilterRef.current) return;
    biquadFilterRef.current.gain.value = bassBoost.enabled ? bassBoost.gain : 0;
    biquadFilterRef.current.frequency.value = bassBoost.frequency;
  }, [bassBoost.enabled, bassBoost.gain, bassBoost.frequency]);

  const toggleBassBoost = useCallback(() => {
    setBassBoost(prev => ({ ...prev, enabled: !prev.enabled }));
  }, []);

  const setBassGain = useCallback((gain: number) => {
    setBassBoost(prev => ({ ...prev, gain: Math.max(0, Math.min(12, gain)) }));
  }, []);

  const setBassFrequency = useCallback((frequency: number) => {
    setBassBoost(prev => ({ ...prev, frequency: Math.max(60, Math.min(250, frequency)) }));
  }, []);

  return {
    bassBoost,
    toggleBassBoost,
    setBassGain,
    setBassFrequency,
  };
}
