import React, { useRef, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Zap, Disc3 } from 'lucide-react';

/**
 * DJ Sound FX pad: scratch + airhorn + drums + risers, all synthesized
 * with the WebAudio API so it works offline with zero assets.
 */
const SoundFXPad: React.FC = () => {
  const ctxRef = useRef<AudioContext | null>(null);
  const [active, setActive] = useState<string | null>(null);

  const ctx = useCallback(() => {
    if (!ctxRef.current) ctxRef.current = new AudioContext();
    if (ctxRef.current.state === 'suspended') ctxRef.current.resume();
    return ctxRef.current;
  }, []);

  const flash = (id: string) => {
    setActive(id);
    setTimeout(() => setActive(null), 200);
  };

  // Vinyl scratch effect
  const scratch = (forward: boolean) => {
    flash(forward ? 'scratch-fwd' : 'scratch-rev');
    const c = ctx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    const filter = c.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 800;
    filter.Q.value = 8;

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(forward ? 200 : 1200, c.currentTime);
    osc.frequency.exponentialRampToValueAtTime(forward ? 1200 : 200, c.currentTime + 0.25);

    gain.gain.setValueAtTime(0.0001, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.5, c.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.3);

    osc.connect(filter).connect(gain).connect(c.destination);
    osc.start();
    osc.stop(c.currentTime + 0.3);
  };

  const airhorn = () => {
    flash('airhorn');
    const c = ctx();
    [600, 900].forEach((freq, i) => {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, c.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.3, c.currentTime + 0.05);
      gain.gain.setValueAtTime(0.3, c.currentTime + 0.5);
      gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.7);
      osc.connect(gain).connect(c.destination);
      osc.start(c.currentTime + i * 0.05);
      osc.stop(c.currentTime + 0.75);
    });
  };

  const kick = () => {
    flash('kick');
    const c = ctx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.frequency.setValueAtTime(150, c.currentTime);
    osc.frequency.exponentialRampToValueAtTime(0.01, c.currentTime + 0.2);
    gain.gain.setValueAtTime(0.6, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.25);
    osc.connect(gain).connect(c.destination);
    osc.start();
    osc.stop(c.currentTime + 0.3);
  };

  const snare = () => {
    flash('snare');
    const c = ctx();
    const buf = c.createBuffer(1, c.sampleRate * 0.2, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2);
    const src = c.createBufferSource();
    src.buffer = buf;
    const filter = c.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1500;
    const gain = c.createGain();
    gain.gain.value = 0.5;
    src.connect(filter).connect(gain).connect(c.destination);
    src.start();
  };

  const riser = () => {
    flash('riser');
    const c = ctx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, c.currentTime);
    osc.frequency.exponentialRampToValueAtTime(2000, c.currentTime + 1.5);
    gain.gain.setValueAtTime(0.0001, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.25, c.currentTime + 1.5);
    gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 1.6);
    osc.connect(gain).connect(c.destination);
    osc.start();
    osc.stop(c.currentTime + 1.6);
  };

  const drop = () => {
    flash('drop');
    const c = ctx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(2000, c.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, c.currentTime + 0.8);
    gain.gain.setValueAtTime(0.0001, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.5, c.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.85);
    osc.connect(gain).connect(c.destination);
    osc.start();
    osc.stop(c.currentTime + 0.9);
  };

  const applause = () => {
    flash('applause');
    const c = ctx();
    const buf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.4 * Math.pow(Math.sin((i / data.length) * Math.PI), 0.5);
    }
    const src = c.createBufferSource();
    src.buffer = buf;
    const filter = c.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 2000;
    src.connect(filter).connect(c.destination);
    src.start();
  };

  const pads = [
    { id: 'scratch-fwd', label: '↻ Scratch', emoji: '🎚️', onClick: () => scratch(true) },
    { id: 'scratch-rev', label: '↺ Reverse', emoji: '🔄', onClick: () => scratch(false) },
    { id: 'airhorn', label: 'Airhorn', emoji: '📯', onClick: airhorn },
    { id: 'kick', label: 'Kick', emoji: '🥁', onClick: kick },
    { id: 'snare', label: 'Snare', emoji: '🪘', onClick: snare },
    { id: 'riser', label: 'Riser', emoji: '🚀', onClick: riser },
    { id: 'drop', label: 'Drop', emoji: '💥', onClick: drop },
    { id: 'applause', label: 'Applause', emoji: '👏', onClick: applause },
  ];

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" /> Sound FX & Scratch Pad
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-2">
          {pads.map(pad => (
            <Button
              key={pad.id}
              onClick={pad.onClick}
              variant={active === pad.id ? 'default' : 'outline'}
              className="h-16 flex flex-col items-center justify-center gap-1 text-xs transition-all active:scale-95"
            >
              <span className="text-lg">{pad.emoji}</span>
              <span className="text-[10px]">{pad.label}</span>
            </Button>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground mt-2 text-center">
          <Disc3 className="inline h-3 w-3 mr-1" />
          Tap any pad to fire FX over your live stream
        </p>
      </CardContent>
    </Card>
  );
};

export default SoundFXPad;
