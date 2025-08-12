// lib/metrics.ts
'use client';
import * as React from 'react';

export function useRenderCounter(name: string, threshold = 20, windowMs = 2000) {
  const renders = React.useRef(0);
  const start = React.useRef(performance.now());

  React.useEffect(() => {
    renders.current += 1;
    const now = performance.now();
    if (now - start.current > windowMs) {
      if (renders.current > threshold) {
        // No rompas nada: solo log
        // eslint-disable-next-line no-console
        console.warn(`[Perf] ${name} rendered ${renders.current}x in ${Math.round(now - start.current)}ms`);
      }
      renders.current = 0;
      start.current = now;
    }
  });
}

export function mark(name: string) {
  try { performance.mark(name); } catch {}
}
export function measure(name: string, start: string, end?: string) {
  try {
    if (end) performance.mark(end);
    performance.measure(name, start, end);
  } catch {}
}