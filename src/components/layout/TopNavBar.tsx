'use client';

import { useState } from 'react';
import Link from 'next/link';

interface TopNavBarProps {
  title?: string;
  onSave?: () => void;
  onExport?: () => void;
}

export default function TopNavBar({ title = 'Editor Workspace', onSave, onExport }: TopNavBarProps) {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <header className="fixed top-0 right-0 left-64 h-20 flex items-center justify-between px-10 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="flex items-center gap-8">
        <h2 className="font-['Plus_Jakarta_Sans'] font-bold text-slate-800 text-lg">{title}</h2>
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 bg-slate-100 border-none rounded-full w-72 focus:ring-2 focus:ring-blue-200 text-sm transition-all focus:bg-white focus:shadow-sm"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        {/* Tab Navigation */}
        <nav className="flex gap-8">
          <Link href="#" className="text-blue-600 font-semibold border-b-2 border-blue-600 py-1 text-sm">Drafts</Link>
          <Link href="#" className="text-slate-500 hover:text-slate-900 transition-all py-1 text-sm">Shared</Link>
          <Link href="#" className="text-slate-500 hover:text-slate-900 transition-all py-1 text-sm">Archived</Link>
        </nav>

        <div className="h-6 w-px bg-slate-200 mx-2" />

        {/* Actions */}
        <div className="flex items-center gap-4">
          <button className="text-slate-500 hover:text-blue-600 transition-colors">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button className="text-slate-500 hover:text-blue-600 transition-colors">
            <span className="material-symbols-outlined">history</span>
          </button>

          {onSave && (
            <button
              onClick={onSave}
              className="px-4 py-2 text-blue-600 font-semibold hover:bg-blue-50 rounded-lg transition-colors text-sm"
            >
              Save
            </button>
          )}

          {onExport && (
            <button
              onClick={onExport}
              className="px-6 py-2 bg-slate-900 text-white font-bold rounded-lg hover:opacity-90 transition-opacity text-sm"
            >
              Export
            </button>
          )}

          {/* User Avatar */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center ml-2 border-2 border-white shadow-sm">
            <span className="text-white font-bold text-sm">C</span>
          </div>
        </div>
      </div>
    </header>
  );
}
