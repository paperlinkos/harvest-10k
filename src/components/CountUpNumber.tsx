import React, { useEffect, useState, useRef } from 'react';

interface CountUpNumberProps {
  value?: number;
  end?: number; // Alias for value to prevent prop mismatch errors
  duration?: number; // duration in ms
  className?: string;
  prefix?: string;
  suffix?: string;
  formatNumber?: boolean;
}

export const CountUpNumber: React.FC<CountUpNumberProps> = ({
  value,
  end,
  duration = 800,
  className = '',
  prefix = '',
  suffix = '',
  formatNumber = true,
}) => {
  const numericTarget = value !== undefined ? value : (end !== undefined ? end : 0);
  const [displayValue, setDisplayValue] = useState<number>(numericTarget);
  const previousValueRef = useRef<number>(numericTarget);
  const startTimeRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const startValue = previousValueRef.current;
    const endValue = numericTarget;

    if (startValue === endValue) {
      setDisplayValue(endValue);
      return;
    }

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + (endValue - startValue) * easeOut);

      setDisplayValue(current);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(endValue);
        previousValueRef.current = endValue;
        startTimeRef.current = null;
      }
    };

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    startTimeRef.current = null;
    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [numericTarget, duration]);

  const formatted = formatNumber
    ? (displayValue ?? 0).toLocaleString('en-US')
    : (displayValue ?? 0).toString();

  return (
    <span className={`font-mono-tabular inline-block tracking-tight ${className}`}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
};
