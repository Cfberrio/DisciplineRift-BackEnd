// components/metrics-provider.tsx
'use client';
import * as React from 'react';
import { mark } from '@/lib/metrics';

export default function MetricsProvider({ children }: { children: React.ReactNode }) {
  React.useEffect(() => { mark('page_load_start'); }, []);
  return <>{children}</>;
}