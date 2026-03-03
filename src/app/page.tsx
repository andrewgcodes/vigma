'use client';

import dynamic from 'next/dynamic';

const DesignCanvas = dynamic(() => import('@/components/DesignCanvas'), {
  ssr: false,
  loading: () => (
    <div className="w-screen h-screen bg-canvas-bg flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-400 flex items-center justify-center mx-auto mb-4 shadow-lg">
          <span className="text-white font-bold text-xl">V</span>
        </div>
        <h1 className="text-lg font-semibold text-canvas-text mb-1">Vigma</h1>
        <p className="text-sm text-canvas-text-secondary">Loading design tool...</p>
        <div className="mt-4 w-32 h-1 bg-canvas-border rounded-full mx-auto overflow-hidden">
          <div className="h-full bg-canvas-accent rounded-full animate-pulse" style={{ width: '60%' }} />
        </div>
      </div>
    </div>
  ),
});

export default function Home() {
  return <DesignCanvas />;
}
