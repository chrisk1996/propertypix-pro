'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { SceneGraph } from '@pascal-app/editor';
import { FloorplanNavbar } from './navbar';

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

// Types
type SaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'paused' | 'error';

export default function FloorPlanPage() {
  const [sceneData, setSceneData] = useState<SceneGraph | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [isLoading, setIsLoading] = useState(true);

  // Initialize: Load or create project
  useEffect(() => {
    async function initializeProject() {
      try {
        // Check for existing project in localStorage
        const storedProjectId = localStorage.getItem('floorplan-v2-project-id');
        
        if (storedProjectId) {
          // Try to load from Supabase
          const { data, error } = await supabase
            ?.from('floorplan_projects')
            .select('scene_data')
            .eq('id', storedProjectId)
            .single() || { data: null, error: { message: 'Supabase not configured' } };
          
          if (data?.scene_data) {
            setProjectId(storedProjectId);
            setSceneData(data.scene_data);
            setIsLoading(false);
            return;
          }
        }
        
        // No existing project - load demo scene
        const res = await fetch('/demos/demo_simple.json');
        const demoData = await res.json();
        setSceneData(demoData);
        setIsLoading(false);
      } catch (err) {
        console.error('[FloorPlan] Init error:', err);
        // Fallback to demo
        try {
          const res = await fetch('/demos/demo_simple.json');
          const demoData = await res.json();
          setSceneData(demoData);
        } catch (e) {
          console.error('[FloorPlan] Failed to load demo:', e);
        }
        setIsLoading(false);
      }
    }
    
    initializeProject();
  }, []);

  // Load scene handler
  const onLoad = useCallback(async (): Promise<SceneGraph | null> => {
    return sceneData;
  }, [sceneData]);

  // Save scene handler - saves to Supabase
  const onSave = useCallback(async (scene: SceneGraph) => {
    console.log('[FloorPlan] Saving scene...', { projectId, nodeCount: Object.keys(scene.nodes).length });
    
    try {
      if (projectId) {
        // Update existing project
        const { error } = await supabase
          ?.from('floorplan_projects')
          .update({ 
            scene_data: scene,
            updated_at: new Date().toISOString()
          })
          .eq('id', projectId) || { error: { message: 'Supabase not configured' } };
        
        if (error) throw error;
        console.log('[FloorPlan] Scene updated');
      } else {
        // Create new project
        const { data, error } = await supabase
          ?.from('floorplan_projects')
          .insert({ 
            scene_data: scene,
            name: `Floor Plan ${new Date().toLocaleDateString()}`
          })
          .select('id')
          .single() || { data: null, error: { message: 'Supabase not configured' } };
        
        if (error) throw error;
        
        if (data?.id) {
          setProjectId(data.id);
          localStorage.setItem('floorplan-v2-project-id', data.id);
          console.log('[FloorPlan] New project created:', data.id);
        }
      }
    } catch (err) {
      console.error('[FloorPlan] Save error:', err);
      // Fallback to localStorage
      localStorage.setItem('floorplan-v2-backup', JSON.stringify(scene));
      console.log('[FloorPlan] Saved to localStorage backup');
    }
  }, [projectId]);

  // Loading state
  if (isLoading || !sceneData) {
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
    <div className="fixed inset-0 flex flex-col bg-gray-900">
      <Editor
        layoutVersion="v2"
        projectId={projectId || 'floorplan-v2'}
        navbarSlot={<FloorplanNavbar />}
        sidebarTabs={[
          { id: 'site', label: 'Scene', component: () => null },
        ]}
        viewerToolbarLeft={<ViewerToolbarLeft />}
        viewerToolbarRight={<ViewerToolbarRight />}
        onLoad={onLoad}
        onSave={onSave}
        onSaveStatusChange={(status) => setSaveStatus(status)}
      />
      {/* Save status indicator */}
      <div className="fixed bottom-4 right-4 px-3 py-1.5 rounded-lg bg-gray-800/80 text-xs text-gray-400 backdrop-blur-sm">
        {saveStatus === 'saved' && '✓ Saved'}
        {saveStatus === 'saving' && '⟳ Saving...'}
        {saveStatus === 'pending' && '⏳ Pending...'}
        {saveStatus === 'error' && '⚠️ Save failed'}
        {saveStatus === 'idle' && '○ Unsaved'}
      </div>
    </div>
  );
}
