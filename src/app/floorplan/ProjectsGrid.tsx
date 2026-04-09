'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/utils/supabase/client';

interface Project {
  id: string;
  name: string;
  scene_data: any;
  created_at: string;
  updated_at: string;
  thumbnail_url?: string;
}

export default function ProjectsGrid() {
  const supabase = createClient();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProjects() {
      const { data, error } = await supabase
        .from('floorplan_projects')
        .select('*')
        .order('updated_at', { ascending: false });

      if (!error && data) {
        setProjects(data);
      }
      setLoading(false);
    }
    fetchProjects();
  }, [supabase]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;

    const { error } = await supabase
      .from('floorplan_projects')
      .delete()
      .eq('id', id);

    if (!error) {
      setProjects(projects.filter(p => p.id !== id));
    }
  };

  return (
    <div className="p-8">
      {/* Page Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <span className="text-xs uppercase tracking-wider text-blue-600 mb-2 block font-semibold">
            Project Management
          </span>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Floor Plan Projects</h2>
        </div>
        <Link
          href="/floorplan-v2?new=true"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
        >
          <span className="material-symbols-outlined">add</span>
          <span className="text-sm font-semibold">New Project</span>
        </Link>
      </div>

      {/* Filters Bar */}
      <div className="flex items-center gap-4 mb-8 border-b border-slate-200 pb-6">
        <button className="px-4 py-2 rounded-full bg-slate-900 text-white text-xs font-semibold">
          All Projects
        </button>
        <button className="px-4 py-2 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold hover:bg-slate-200 transition-colors">
          Drafts
        </button>
        <button className="px-4 py-2 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold hover:bg-slate-200 transition-colors">
          Rendered
        </button>
        <button className="px-4 py-2 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold hover:bg-slate-200 transition-colors">
          Published
        </button>
        <div className="ml-auto flex items-center gap-2 text-slate-400">
          <span className="text-xs font-semibold mr-2">Sort by:</span>
          <button className="flex items-center gap-1 text-xs font-bold text-slate-900">
            Date Modified
            <span className="material-symbols-outlined text-sm">keyboard_arrow_down</span>
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12 text-slate-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-400 mx-auto mb-4"></div>
          <p>Loading projects...</p>
        </div>
      )}

      {/* Project Grid */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {/* Add New Project Card */}
          <Link
            href="/floorplan-v2?new=true"
            className="group relative aspect-[4/5] border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center gap-4 hover:border-blue-500 hover:bg-blue-50/50 transition-all"
          >
            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-slate-600 text-2xl">add_box</span>
            </div>
            <span className="text-xs uppercase tracking-wider font-bold text-slate-600">
              Start New Design
            </span>
          </Link>

          {/* Real Project Cards */}
          {projects.map((project) => (
            <div key={project.id} className="group flex flex-col">
              <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-slate-100 mb-4">
                {/* Project thumbnail */}
                {project.thumbnail_url ? (
                  <Image
                    src={project.thumbnail_url}
                    alt={project.name || 'Floor plan'}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-slate-200 flex items-center justify-center">
                    <span className="material-symbols-outlined text-5xl text-slate-400">floor_plan</span>
                  </div>
                )}

                {/* Status Badge */}
                <div className="absolute top-3 right-3 backdrop-blur-sm px-2 py-1 rounded-md bg-white/90 text-slate-600 text-[10px] font-bold uppercase tracking-wider">
                  Draft
                </div>

                {/* Hover Actions */}
                <div className="absolute inset-0 bg-slate-900/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <Link
                    href={`/floorplan-v2?project=${project.id}`}
                    className="w-10 h-10 bg-white text-slate-900 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                  >
                    <span className="material-symbols-outlined">visibility</span>
                  </Link>
                  <Link
                    href={`/floorplan-v2?project=${project.id}`}
                    className="w-10 h-10 bg-white text-slate-900 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                  >
                    <span className="material-symbols-outlined">edit</span>
                  </Link>
                </div>
              </div>

              {/* Project Info */}
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-slate-900">{project.name || 'Untitled Project'}</h3>
                  <p className="text-xs text-slate-400">
                    Modified {formatDate(project.updated_at)}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(project.id)}
                  className="material-symbols-outlined text-slate-300 hover:text-red-500 transition-colors"
                >
                  delete
                </button>
              </div>
            </div>
          ))}

          {/* Empty State */}
          {projects.length === 0 && (
            <div className="col-span-full text-center py-12 text-slate-400">
              <span className="material-symbols-outlined text-4xl mb-2 block">folder_open</span>
              <p>No projects yet. Create your first floor plan!</p>
            </div>
          )}
        </div>
      )}

      {/* Footer Meta */}
      {projects.length > 0 && (
        <div className="mt-12 pt-6 border-t border-slate-200 flex justify-between items-center">
          <p className="text-xs text-slate-400 font-semibold">
            Displaying {projects.length} of {projects.length} Projects
          </p>
          <div className="flex gap-2">
            <button className="w-8 h-8 rounded-full flex items-center justify-center border border-slate-200 hover:bg-slate-100 transition-colors">
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </button>
            <button className="w-8 h-8 rounded-full flex items-center justify-center border border-slate-200 bg-slate-900 text-white text-xs font-bold">
              1
            </button>
            <button className="w-8 h-8 rounded-full flex items-center justify-center border border-slate-200 hover:bg-slate-100 transition-colors">
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
