'use client';

import dynamic from 'next/dynamic';
import { useUIStore } from '@/stores/ui';

// Mapbox GL JS requires browser APIs — disable SSR
const MapCanvas = dynamic(() => import('@/components/map/MapCanvas'), {
  ssr: false,
  loading: () => <MapLoadingScreen />,
});

export default function HomePage() {
  return (
    <main className="relative h-screen w-screen overflow-hidden">
      <MapCanvas />
      <StatusBar />
    </main>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function MapLoadingScreen() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-pos-primary">
      <div className="text-center">
        <div className="pos-loading-pulse mb-4 text-4xl font-mono font-bold text-pos-accent">
          PublicOS
        </div>
        <p className="text-sm text-pos-muted">Initializing spatial engine...</p>
      </div>
    </div>
  );
}

function StatusBar() {
  const isMapReady = useUIStore((s) => s.isMapReady);

  return (
    <div className="absolute bottom-0 left-0 right-0 z-10 flex h-6 items-center justify-between bg-pos-surface/80 px-3 text-[10px] font-mono text-pos-muted backdrop-blur-sm">
      <span>PublicOS 2.0 — Phase 1: Sovereign Foundation</span>
      <span className="flex items-center gap-1.5">
        <span
          className={`inline-block h-1.5 w-1.5 rounded-full ${
            isMapReady ? 'bg-green-500' : 'bg-yellow-500'
          }`}
        />
        {isMapReady ? 'Engine Ready' : 'Loading...'}
      </span>
    </div>
  );
}
