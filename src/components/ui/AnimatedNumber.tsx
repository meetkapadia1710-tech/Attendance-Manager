import { useEffect, useRef, useState } from 'react';
import { animate } from 'framer-motion';

interface Props {
  value: number;
  format?: (v: number) => string;
  duration?: number;
  className?: string;
}

export function AnimatedNumber({
  value,
  format = v => v.toFixed(1),
  duration = 0.7,
  className = '',
}: Props) {
  const [display, setDisplay] = useState(() => format(value));
  const prevRef = useRef(value);
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      setDisplay(format(value));
      prevRef.current = value;
      return;
    }
    const from = prevRef.current;
    prevRef.current = value;
    const controls = animate(from, value, {
      duration,
      ease: [0.25, 0.1, 0.25, 1.0],
      onUpdate: v => setDisplay(format(v)),
    });
    return () => controls.stop();
  }, [value, format, duration]);

  return <span className={className}>{display}</span>;
}
