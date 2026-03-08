'use client';
import dynamic from 'next/dynamic';
import { HUDOverlay } from '@/components/ui/HUDOverlay';

// Dynamically import CesiumViewer with no SSR since it heavily relies on window/WebGL
const CesiumViewer = dynamic(() => import('@/components/viewer/CesiumViewer'), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-slate-200">
      <div className="font-mono text-[11px] tabular-nums text-neon-cyan tracking-tight animate-pulse uppercase">
        Booting God's Eye Engine...
      </div>
    </div>
  )
});

export default function Home() {
  return (
    <main className="relative flex h-screen w-screen overflow-hidden bg-slate-950">
      <div className="absolute inset-0 z-0">
        <CesiumViewer />
      </div>
      <HUDOverlay />
    </main>
  );
}
