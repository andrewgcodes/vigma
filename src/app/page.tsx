'use client';

import dynamic from 'next/dynamic';
import TopBar from '@/components/TopBar';
import Toolbar from '@/components/Toolbar';
import LayersPanel from '@/components/LayersPanel';
import PropertiesPanel from '@/components/PropertiesPanel';
import StatusBar from '@/components/StatusBar';

const DesignCanvas = dynamic(() => import('@/components/DesignCanvas'), {
  ssr: false,
  loading: () => (
    <div className="canvas-loading">
      <div className="loading-spinner" />
      <span>Loading canvas...</span>
    </div>
  ),
});

export default function Home() {
  return (
    <div className="app-layout">
      <TopBar />
      <div className="workspace">
        <Toolbar />
        <div className="canvas-area">
          <LayersPanel />
          <DesignCanvas />
          <PropertiesPanel />
        </div>
      </div>
      <StatusBar />
    </div>
  );
}
