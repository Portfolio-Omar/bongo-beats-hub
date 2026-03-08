import React from 'react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { BarChart3, Waves, Circle } from 'lucide-react';

interface VisualizerSelectorProps {
  value: 'bars' | 'wave' | 'circle';
  onChange: (style: 'bars' | 'wave' | 'circle') => void;
}

const VisualizerSelector: React.FC<VisualizerSelectorProps> = ({ value, onChange }) => {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(v) => { if (v) onChange(v as 'bars' | 'wave' | 'circle'); }}
      className="bg-muted/30 backdrop-blur-sm rounded-full p-0.5 border border-border/30"
    >
      <ToggleGroupItem value="bars" className="rounded-full h-7 w-7 p-0 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
        <BarChart3 className="h-3.5 w-3.5" />
      </ToggleGroupItem>
      <ToggleGroupItem value="wave" className="rounded-full h-7 w-7 p-0 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
        <Waves className="h-3.5 w-3.5" />
      </ToggleGroupItem>
      <ToggleGroupItem value="circle" className="rounded-full h-7 w-7 p-0 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
        <Circle className="h-3.5 w-3.5" />
      </ToggleGroupItem>
    </ToggleGroup>
  );
};

export default VisualizerSelector;
