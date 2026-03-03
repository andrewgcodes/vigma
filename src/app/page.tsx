'use client';

import dynamic from 'next/dynamic';

const DesignCanvas = dynamic(() => import('@/components/DesignCanvas'), {
  ssr: false,
  loading: () => (
    <div className="w-screen h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center animate-pulse">
          <span className="text-white text-lg font-bold">V</span>
        </div>
        <p className="text-sm text-gray-400">Loading Vigma...</p>
      </div>
    </div>
  ),
});

export default function Home() {
  return <DesignCanvas />;
}
