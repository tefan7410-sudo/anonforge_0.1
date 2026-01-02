import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CountdownTimerProps {
  targetDate: Date;
  compact?: boolean;
  onComplete?: () => void;
  className?: string;
}

export function CountdownTimer({ 
  targetDate, 
  compact = false, 
  onComplete,
  className 
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft(targetDate));

  useEffect(() => {
    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft(targetDate);
      setTimeLeft(newTimeLeft);
      
      if (newTimeLeft.total <= 0) {
        clearInterval(timer);
        onComplete?.();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate, onComplete]);

  if (timeLeft.total <= 0) {
    return (
      <span className={cn("text-primary font-medium", className)}>
        Launching now!
      </span>
    );
  }

  if (compact) {
    if (timeLeft.days > 0) {
      return (
        <span className={cn("flex items-center gap-1.5 text-sm", className)}>
          <Clock className="h-3.5 w-3.5" />
          {timeLeft.days}d {timeLeft.hours}h
        </span>
      );
    }
    if (timeLeft.hours > 0) {
      return (
        <span className={cn("flex items-center gap-1.5 text-sm", className)}>
          <Clock className="h-3.5 w-3.5" />
          {timeLeft.hours}h {timeLeft.minutes}m
        </span>
      );
    }
    return (
      <span className={cn("flex items-center gap-1.5 text-sm text-primary animate-pulse", className)}>
        <Clock className="h-3.5 w-3.5" />
        {timeLeft.minutes}m {timeLeft.seconds}s
      </span>
    );
  }

  // Full format
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Clock className="h-5 w-5 text-primary" />
      <div className="flex items-baseline gap-1">
        <span className="font-display text-lg font-semibold">Launching in</span>
        {timeLeft.days > 0 && (
          <span className="text-primary font-bold">{timeLeft.days}d</span>
        )}
        {(timeLeft.days > 0 || timeLeft.hours > 0) && (
          <span className="text-primary font-bold">{timeLeft.hours}h</span>
        )}
        <span className="text-primary font-bold">{timeLeft.minutes}m</span>
        {timeLeft.days === 0 && (
          <span className="text-primary font-bold">{timeLeft.seconds}s</span>
        )}
      </div>
    </div>
  );
}

function calculateTimeLeft(targetDate: Date) {
  const now = new Date().getTime();
  const target = targetDate.getTime();
  const difference = target - now;

  if (difference <= 0) {
    return { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  return {
    total: difference,
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  };
}
