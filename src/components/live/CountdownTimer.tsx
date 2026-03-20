import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  targetDate: string;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ targetDate }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const update = () => {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) {
        setExpired(true);
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  if (expired) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-primary font-semibold animate-pulse">
        <Clock className="h-3 w-3" /> Starting soon...
      </div>
    );
  }

  const blocks = [
    { value: timeLeft.days, label: 'd' },
    { value: timeLeft.hours, label: 'h' },
    { value: timeLeft.minutes, label: 'm' },
    { value: timeLeft.seconds, label: 's' },
  ].filter((b, i) => b.value > 0 || i >= 2); // always show min+sec

  return (
    <div className="flex items-center gap-1.5">
      <Clock className="h-3 w-3 text-muted-foreground" />
      <div className="flex items-center gap-1">
        {blocks.map(({ value, label }) => (
          <span key={label} className="text-xs font-mono font-bold bg-muted/80 px-1.5 py-0.5 rounded text-foreground">
            {String(value).padStart(2, '0')}{label}
          </span>
        ))}
      </div>
    </div>
  );
};

export default CountdownTimer;
