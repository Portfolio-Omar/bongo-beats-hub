import React from 'react';
import { useAudioFX, EQ_PRESETS, EQPreset } from '@/hooks/useAudioFX';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { AudioLines, Volume2, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

interface AudioFXPanelProps {
  audioElement: HTMLAudioElement | null;
  compact?: boolean;
}

const BAND_LABELS = ['60', '170', '310', '600', '1K', '3K', '6K', '12K', '14K', '16K'];

const AudioFXPanel: React.FC<AudioFXPanelProps> = ({ audioElement, compact = false }) => {
  const {
    state,
    toggleEQ,
    setPreset,
    setBandGain,
    setVolumeBoost,
    toggleBassBoost,
    setBassGain,
  } = useAudioFX(audioElement);

  const presetKeys = Object.keys(EQ_PRESETS).filter(k => k !== 'custom') as EQPreset[];

  if (compact) {
    return (
      <div className="space-y-3 p-3">
        {/* EQ toggle + presets row */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 mr-2">
            <AudioLines className={`h-4 w-4 ${state.eqEnabled ? 'text-primary' : 'text-muted-foreground'}`} />
            <span className="text-xs font-medium">EQ</span>
            <Switch checked={state.eqEnabled} onCheckedChange={toggleEQ} className="scale-75" />
          </div>
          {state.eqEnabled && presetKeys.map(key => (
            <Button
              key={key}
              variant={state.preset === key ? 'default' : 'outline'}
              size="sm"
              className="h-6 px-2 text-[10px] rounded-full"
              onClick={() => setPreset(key)}
            >
              {EQ_PRESETS[key].label}
            </Button>
          ))}
        </div>

        {/* Bass + Volume row */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 flex-1">
            <Zap className={`h-3.5 w-3.5 flex-shrink-0 ${state.bassBoostEnabled ? 'text-primary' : 'text-muted-foreground'}`} />
            <button onClick={toggleBassBoost} className="text-[10px] font-medium min-w-[32px]">Bass</button>
            <Slider
              value={[state.bassBoostGain]}
              onValueChange={(v) => setBassGain(v[0])}
              max={12} step={0.5}
              className="flex-1"
              disabled={!state.bassBoostEnabled}
            />
            <span className="text-[10px] text-muted-foreground font-mono w-8 text-right">
              {state.bassBoostEnabled ? `+${state.bassBoostGain}` : 'Off'}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-1">
            <Volume2 className={`h-3.5 w-3.5 flex-shrink-0 ${state.volumeBoost > 100 ? 'text-primary' : 'text-muted-foreground'}`} />
            <span className="text-[10px] font-medium min-w-[24px]">Vol</span>
            <Slider
              value={[state.volumeBoost]}
              onValueChange={(v) => setVolumeBoost(v[0])}
              min={0} max={200} step={5}
              className="flex-1"
            />
            <span className="text-[10px] text-muted-foreground font-mono w-8 text-right">
              {state.volumeBoost}%
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Full panel (for Player page)
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md space-y-4"
    >
      {/* EQ Section */}
      <div className="p-4 rounded-xl bg-card/30 backdrop-blur-sm border border-border/30">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <AudioLines className={`h-4 w-4 ${state.eqEnabled ? 'text-primary' : 'text-muted-foreground'}`} />
            <span className="text-sm font-semibold">Equalizer</span>
          </div>
          <Switch checked={state.eqEnabled} onCheckedChange={toggleEQ} />
        </div>

        {/* Presets */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {presetKeys.map(key => (
            <Button
              key={key}
              variant={state.preset === key ? 'default' : 'outline'}
              size="sm"
              className={`h-7 px-3 text-xs rounded-full transition-all ${
                state.preset === key ? 'shadow-md' : 'opacity-70 hover:opacity-100'
              }`}
              onClick={() => setPreset(key)}
              disabled={!state.eqEnabled}
            >
              {EQ_PRESETS[key].label}
            </Button>
          ))}
          {state.preset === 'custom' && (
            <Button variant="default" size="sm" className="h-7 px-3 text-xs rounded-full shadow-md" disabled>
              Custom
            </Button>
          )}
        </div>

        {/* EQ Bands - vertical sliders */}
        {state.eqEnabled && (
          <div className="flex items-end justify-between gap-1 h-32">
            {state.bands.map((gain, i) => (
              <div key={i} className="flex flex-col items-center flex-1 h-full">
                <div className="flex-1 w-full flex items-center justify-center relative">
                  <input
                    type="range"
                    min={-12}
                    max={12}
                    step={0.5}
                    value={gain}
                    onChange={(e) => setBandGain(i, parseFloat(e.target.value))}
                    className="absolute h-full appearance-none cursor-pointer"
                    style={{
                      writingMode: 'vertical-lr',
                      direction: 'rtl',
                      width: '20px',
                      background: 'transparent',
                    }}
                  />
                  {/* Visual bar */}
                  <div className="absolute bottom-0 w-1.5 rounded-full bg-muted overflow-hidden" style={{ height: '100%' }}>
                    <div
                      className="absolute w-full bg-primary rounded-full transition-all"
                      style={{
                        height: `${Math.abs(gain) / 12 * 50}%`,
                        transform: gain < 0 ? 'translateY(100%)' : 'translateY(0)',
                        bottom: gain >= 0 ? '50%' : `${50 - Math.abs(gain) / 12 * 50}%`,
                      }}
                    />
                  </div>
                </div>
                <span className="text-[8px] text-muted-foreground mt-1 font-mono">{BAND_LABELS[i]}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bass Boost */}
      <div className="p-4 rounded-xl bg-card/30 backdrop-blur-sm border border-border/30">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleBassBoost}
            className={`h-9 w-9 rounded-full flex-shrink-0 ${state.bassBoostEnabled ? 'text-primary bg-primary/10' : 'text-muted-foreground'}`}
          >
            <Zap className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium">Bass Boost</span>
              <span className="text-[10px] text-muted-foreground font-mono">
                {state.bassBoostEnabled ? `+${state.bassBoostGain}dB` : 'Off'}
              </span>
            </div>
            <Slider
              value={[state.bassBoostGain]}
              onValueChange={(v) => setBassGain(v[0])}
              max={12} step={0.5}
              disabled={!state.bassBoostEnabled}
            />
          </div>
        </div>
      </div>

      {/* Volume Booster */}
      <div className="p-4 rounded-xl bg-card/30 backdrop-blur-sm border border-border/30">
        <div className="flex items-center gap-3">
          <div className={`h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0 ${state.volumeBoost > 100 ? 'text-primary bg-primary/10' : 'text-muted-foreground bg-muted/50'}`}>
            <Volume2 className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium">Volume Booster</span>
              <span className="text-[10px] text-muted-foreground font-mono">{state.volumeBoost}%</span>
            </div>
            <Slider
              value={[state.volumeBoost]}
              onValueChange={(v) => setVolumeBoost(v[0])}
              min={0} max={200} step={5}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AudioFXPanel;
