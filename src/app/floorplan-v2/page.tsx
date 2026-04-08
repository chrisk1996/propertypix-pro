'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';

// Dynamic imports to prevent SSR
const Editor = dynamic(
  () => import('@pascal-app/editor').then((mod) => mod.Editor),
  { ssr: false }
);
const ViewerToolbarLeft = dynamic(
  () => import('@pascal-app/editor').then((mod) => mod.ViewerToolbarLeft),
  { ssr: false }
);
const ViewerToolbarRight = dynamic(
  () => import('@pascal-app/editor').then((mod) => mod.ViewerToolbarRight),
  { ssr: false }
);
const ScenePanel = dynamic(
  () => import('@pascal-app/editor').then((mod) => mod.ScenePanel),
  { ssr: false }
);

export default function FloorPlanPage() {
  const [sceneData, setSceneData] = useState<any>(null);

  useEffect(() => {
    fetch('/demos/demo_simple.json')
      .then((res) => res.json())
      .then(setSceneData)
      .catch(console.error);
  }, []);

  if (!sceneData) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading Floor Planner...</p>
        </div>
      </div>
    );
  }

  const onLoad = async () => sceneData;

  return (
    <div className="fixed inset-0 flex flex-col bg-gray-900">
      <Editor
        layoutVersion="v2"
        projectId="floorplan-v2"
        sidebarTabs={[
          { id: 'scene', label: 'Scene', component: ScenePanel },
        ]}
        viewerToolbarLeft={<ViewerToolbarLeft />}
        viewerToolbarRight={<ViewerToolbarRight />}
        onLoad={onLoad}
      />
    </div>
  );
}
