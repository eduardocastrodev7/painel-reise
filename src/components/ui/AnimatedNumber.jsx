// src/components/ui/AnimatedNumber.jsx
import { useEffect, useRef, useState } from 'react';

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

export function AnimatedNumber({
  value,
  formatFn = (n) => String(n ?? 0),
  duration = 650,
}) {
  const to = Number(value ?? 0);
  const prevRef = useRef(to);
  const [display, setDisplay] = useState(to);

  useEffect(() => {
    const from = Number(prevRef.current ?? 0);
    const target = Number(value ?? 0);

    if (!Number.isFinite(from) || !Number.isFinite(target) || duration <= 0) {
      prevRef.current = target;
      setDisplay(target);
      return;
    }

    if (from === target) {
      setDisplay(target);
      return;
    }

    const start = performance.now();
    let raf = 0;

    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = easeOutCubic(t);
      const current = from + (target - from) * eased;

      setDisplay(current);

      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        prevRef.current = target;
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return <span>{formatFn(display)}</span>;
}