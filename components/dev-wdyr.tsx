// components/dev-wdyr.tsx
'use client';
import { useEffect } from 'react';

export default function DevWDYR() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const React = require('react');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const wdyr = require('@welldone-software/why-did-you-render');
    wdyr(React, {
      trackHooks: false, // evita conflicto con Next Dev Overlay
      trackAllPureComponents: false,
      exclude: [/NextLogo|Dev(Overlay|Tools)|HotReload|AppRouter|ServerRoot/i],
    });
  }, []);
  return null;
}