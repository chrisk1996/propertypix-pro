'use client';

import { Editor, type SidebarTab, ViewerToolbarLeft, ViewerToolbarRight, useEditor } from '@pascal-app/editor';
import { useCallback, useEffect, useState } from 'react';

const SIDEBAR_TABS: (SidebarTab & { component: React.ComponentType })[] = [
  {
    id: 'site',
    label: 'Scene',
    component: () => null, // Built-in SitePanel handles this
  },
];

// Demo scene URL
const DEMO_SCENE_URL = '/demos/demo_simple.json';

// Component to set initial phase after scene loads
function PhaseSetter({ sceneLoaded }: { sceneLoaded: boolean }) {
  useEffect(() => {
    if (sceneLoaded) {
      // After scene loads, switch to structure phase so tools are visible
      const timer = setTimeout(() => {
        useEditor.getState().setPhase('structure');
        useEditor.getState().setMode('build');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [sceneLoaded]);
  return null;
}

export default function FloorPlanPage() {
  const [sceneData, setSceneData] = useState<any>(null);

  // Load demo scene on mount
  useEffect(() => {
    fetch(DEMO_SCENE_URL)
      .then((res) => res.json())
      .then((data) => {
        setSceneData(data);
      })
      .catch((err) => {
        console.error('Failed to load demo scene:', err);
      });
  }, []);

  // Callback to provide scene data to editor
  const onLoad = useCallback(async () => {
    if (sceneData) {
      return sceneData;
    }
    // Return null to try loading from localStorage or show empty scene
    return null;
  }, [sceneData]);

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

  return (
    <div className="h-screen w-screen">
      <PhaseSetter sceneLoaded={!!sceneData} />
      <Editor
        layoutVersion="v2"
        projectId="floorplan-v2"
        sidebarTabs={SIDEBAR_TABS}
        viewerToolbarLeft={<ViewerToolbarLeft />}
        viewerToolbarRight={<ViewerToolbarRight />}
        onLoad={onLoad}
      />
    </div>
  );
}
