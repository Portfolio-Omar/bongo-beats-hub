import React, { useRef, useEffect, useCallback } from 'react';
import { useAudio } from '@/context/AudioContext';

interface AudioVisualizerProps {
  className?: string;
  barCount?: number;
  style?: 'bars' | 'wave' | 'circle';
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  className = '',
  barCount = 64,
  style = 'bars',
}) => {
  const { analyserNode, isPlaying } = useAudio();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const analyser = analyserNode;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      animRef.current = requestAnimationFrame(render);
      analyser.getByteFrequencyData(dataArray);

      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      if (style === 'bars') {
        const step = Math.floor(bufferLength / barCount);
        const barWidth = width / barCount;
        const gap = 1;

        for (let i = 0; i < barCount; i++) {
          const value = dataArray[i * step] / 255;
          const barHeight = value * height * 0.9;

          // Gradient color based on frequency
          const hue = (i / barCount) * 60 + 260; // purple to gold range
          const saturation = 70 + value * 30;
          const lightness = 45 + value * 15;

          ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;

          const x = i * barWidth + gap / 2;
          const y = height - barHeight;
          const w = barWidth - gap;

          // Rounded tops
          ctx.beginPath();
          ctx.roundRect(x, y, w, barHeight, [w / 2, w / 2, 0, 0]);
          ctx.fill();
        }
      } else if (style === 'wave') {
        ctx.beginPath();
        const sliceWidth = width / bufferLength;

        analyser.getByteTimeDomainData(dataArray);

        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0;
          const y = (v * height) / 2;
          const x = i * sliceWidth;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }

        ctx.strokeStyle = 'hsl(262, 83%, 58%)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Mirror
        ctx.beginPath();
        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0;
          const y = height - (v * height) / 2;
          const x = i * sliceWidth;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = 'hsl(45, 100%, 51%)';
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.5;
        ctx.stroke();
        ctx.globalAlpha = 1;
      } else if (style === 'circle') {
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) * 0.3;

        for (let i = 0; i < barCount; i++) {
          const step = Math.floor(bufferLength / barCount);
          const value = dataArray[i * step] / 255;
          const angle = (i / barCount) * Math.PI * 2 - Math.PI / 2;
          const barLen = value * radius * 0.8 + 2;

          const x1 = centerX + Math.cos(angle) * radius;
          const y1 = centerY + Math.sin(angle) * radius;
          const x2 = centerX + Math.cos(angle) * (radius + barLen);
          const y2 = centerY + Math.sin(angle) * (radius + barLen);

          const hue = (i / barCount) * 60 + 260;
          ctx.strokeStyle = `hsl(${hue}, 80%, ${50 + value * 20}%)`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }

        // Inner glow circle
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
        gradient.addColorStop(0, 'hsla(262, 83%, 58%, 0.1)');
        gradient.addColorStop(1, 'hsla(262, 83%, 58%, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    render();
  }, [analyserNode, barCount, style]);

  useEffect(() => {
    if (isPlaying && analyserNode) {
      draw();
    }
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isPlaying, analyserNode, draw]);

  // Resize canvas to parent
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  return (
    <div className={`relative ${className}`}>
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
};

export default AudioVisualizer;
