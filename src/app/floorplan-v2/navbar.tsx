'use client';

import { useState, useEffect } from 'react';
import { Settings, Pencil, Share2, Eye, EyeOff, ChevronDown, X } from 'lucide-react';
import { SettingsPanel } from '@pascal-app/editor';
import { createClient } from '@/utils/supabase/client';

interface FloorplanNavbarProps {
  projectId?: string | null;
  projectName?: string;
}

export function FloorplanNavbar({ projectId, projectName = 'Untitled Project' }: FloorplanNavbarProps) {
  const supabase = createClient();
  const [showSettings, setShowSettings] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [name, setName] = useState(projectName);
  const [isPublic, setIsPublic] = useState(true);

  // Update local name when prop changes
  useEffect(() => {
    setName(projectName);
  }, [projectName]);

  // Save name to database
  const handleNameSave = async (newName: string) => {
    setIsEditingName(false);
    
    if (!projectId || newName === projectName) return;

    try {
      const { error } = await supabase
        .from('floorplan_projects')
        .update({ name: newName })
        .eq('id', projectId);

      if (error) {
        console.error('[Navbar] Failed to update name:', error);
        setName(projectName); // Revert on error
      }
    } catch (err) {
      console.error('[Navbar] Name update error:', err);
      setName(projectName);
    }
  };

  return (
    <>
      {/* Top navbar */}
      <div className="flex h-12 items-center justify-between border-b border-border bg-sidebar px-4">
        {/* Left side - Logo + Project name */}
        <div className="flex items-center gap-4">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
              <span className="text-primary-foreground font-bold text-sm">PP</span>
            </div>
            <span className="font-semibold text-sm hidden sm:inline">Zestio</span>
          </a>

          {/* Divider */}
          <div className="h-6 w-px bg-border" />

          {/* Project name */}
          <div className="flex items-center gap-2">
            {isEditingName ? (
              <input 
                className="bg-background border border-border rounded px-2 py-1 text-sm w-48"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => handleNameSave(name)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleNameSave(name);
                  } else if (e.key === 'Escape') {
                    setName(projectName);
                    setIsEditingName(false);
                  }
                }}
                autoFocus
              />
            ) : (
              <button 
                className="flex items-center gap-1.5 text-sm hover:bg-accent px-2 py-1 rounded transition-colors"
                onClick={() => setIsEditingName(true)}
              >
                <span className="text-muted-foreground">{name}</span>
                <Pencil className="h-3 w-3 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>

        {/* Center - Share & Visibility */}
        <div className="flex items-center gap-3">
          {/* Share button */}
          <button className="flex items-center gap-1.5 text-sm hover:bg-accent px-3 py-1.5 rounded-md transition-colors">
            <Share2 className="h-4 w-4" />
            <span>Share</span>
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </button>

          {/* Visibility toggle */}
          <button 
            className="flex items-center gap-1.5 text-sm hover:bg-accent px-3 py-1.5 rounded-md transition-colors"
            onClick={() => setIsPublic(!isPublic)}
            title={isPublic ? 'Public - anyone can view' : 'Private - only you can view'}
          >
            {isPublic ? (
              <>
                <Eye className="h-4 w-4" />
                <span className="hidden sm:inline">Public</span>
              </>
            ) : (
              <>
                <EyeOff className="h-4 w-4" />
                <span className="hidden sm:inline">Private</span>
              </>
            )}
          </button>
        </div>

        {/* Right side - Settings */}
        <div className="flex items-center gap-2">
          <button 
            className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent transition-colors"
            onClick={() => setShowSettings(!showSettings)}
            title="Settings"
          >
            <Settings className="h-4 w-4" />
          </button>

          {/* User avatar placeholder */}
          <button className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
            U
          </button>
        </div>
      </div>

      {/* Settings panel overlay */}
      {showSettings && (
        <div className="absolute right-0 top-12 z-50 h-[calc(100%-48px)] w-80 border-l border-border bg-sidebar shadow-xl">
          <div className="flex items-center justify-between border-b border-border p-3">
            <span className="font-medium text-sm">Settings</span>
            <button 
              className="flex h-6 w-6 items-center justify-center rounded hover:bg-accent"
              onClick={() => setShowSettings(false)}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="h-[calc(100%-48px)] overflow-y-auto">
            <SettingsPanel projectId={projectId} />
          </div>
        </div>
      )}
    </>
  );
}
