'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
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

function FloorPlanEditor() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const projectIdParam = searchParams.get('project');
  const isNewProject = searchParams.get('new') === 'true';
  const [sceneData, setSceneData] = useState<SceneGraph | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState<string>('Untitled Project');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize: Load or create project
  useEffect(() => {
    async function initializeProject() {
      try {
        // If "new=true", create a blank project
        if (isNewProject) {
          console.log('[FloorPlan] Creating new project...');
          
          const { data, error: insertError } = await supabase
            .from('floorplan_projects')
            .insert({ 
              name: `Floor Plan ${new Date().toLocaleDateString()}`,
              scene_data: null 
            })
            .select('id, name')
            .single();

          if (insertError) {
            console.error('[FloorPlan] Insert error:', insertError);
            setError('Failed to create project: ' + insertError.message);
            setIsLoading(false);
            return;
          }

          if (data?.id) {
            console.log('[FloorPlan] Project created:', data.id);
            // Redirect to project URL (removes ?new=true)
            router.replace(`/floorplan-v2?project=${data.id}`);
            return;
          }
        }

        // If project ID is in URL, load that project
        if (projectIdParam) {
          const { data, error: fetchError } = await supabase
            .from('floorplan_projects')
            .select('id, name, scene_data')
            .eq('id', projectIdParam)
            .single();

          if (fetchError) {
            console.error('[FloorPlan] Fetch error:', fetchError);
            setError('Project not found');
            setIsLoading(false);
            return;
          }

          if (data) {
            setProjectId(data.id);
            setProjectName(data.name || 'Untitled Project');
            setSceneData(data.scene_data);
            localStorage.setItem('floorplan-v2-project-id', data.id);
            setIsLoading(false);
            return;
          }
        }

        // Check for existing project in localStorage
        const storedProjectId = localStorage.getItem('floorplan-v2-project-id');
        if (storedProjectId && !projectIdParam && !isNewProject) {
          const { data } = await supabase
            .from('floorplan_projects')
            .select('id, name, scene_data')
            .eq('id', storedProjectId)
            .single();

          if (data?.scene_data) {
            setProjectId(data.id);
            setProjectName(data.name || 'Untitled Project');
            setSceneData(data.scene_data);
            setIsLoading(false);
            return;
          }
        }

        // No project - load demo scene
        if (!isNewProject) {
          const res = await fetch('/demos/demo_simple.json');
          const demoData = await res.json();
          setSceneData(demoData);
        }
        setIsLoading(false);
      } catch (err) {
        console.error('[FloorPlan] Init error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load');
        setIsLoading(false);
      }
    }
    initializeProject();
  }, [projectIdParam, isNewProject, router]);

  // Load scene handler
  const onLoad = useCallback(async (): Promise<SceneGraph | null> => {
    return sceneData;
  }, [sceneData]);

  // Save scene handler - saves to Supabase
  const onSave = useCallback(async (scene: SceneGraph) => {
    console.log('[FloorPlan] Saving scene...', { projectId, nodeCount: Object.keys(scene.nodes).length });

    try {
      if (projectId) {
        const { error: updateError } = await supabase
          .from('floorplan_projects')
          .update({ scene_data: scene, updated_at: new Date().toISOString() })
          .eq('id', projectId);

        if (updateError) throw updateError;
        console.log('[FloorPlan] Scene updated');
      } else {
        const { data, error: insertError } = await supabase
          .from('floorplan_projects')
          .insert({ scene_data: scene, name: `Floor Plan ${new Date().toLocaleDateString()}` })
          .select('id')
          .single();

        if (insertError) throw insertError;

        if (data?.id) {
          setProjectId(data.id);
          localStorage.setItem('floorplan-v2-project-id', data.id);
          console.log('[FloorPlan] New project created:', data.id);
        }
      }
    } catch (err) {
      console.error('[FloorPlan] Save error:', err);
      localStorage.setItem('floorplan-v2-backup', JSON.stringify(scene));
    }
  }, [projectId]);

  // Error state
  if (error) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold mb-2">Error</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <button 
            onClick={() => router.push('/floorplan')} 
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
          >
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
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
        navbarSlot={<FloorplanNavbar projectId={projectId} />}
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

export default function FloorPlanPage() {
  return (
    <Suspense fallback={
      <div className="h-screen w-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading Floor Planner...</p>
        </div>
      </div>
    }>
      <FloorPlanEditor />
    </Suspense>
  );
}
