'use client';

interface QuickAction {
  id: string;
  icon: string;
  label: string;
  shortcut?: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'default' | 'primary' | 'danger';
}

interface QuickActionsProps {
  actions: QuickAction[];
  position?: 'top' | 'bottom';
}

export default function QuickActions({ actions, position = 'bottom' }: QuickActionsProps) {
  return (
    <div className={`absolute ${position === 'top' ? 'top-4' : 'bottom-4'} left-1/2 -translate-x-1/2 z-10`}>
      <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200 p-1.5 flex items-center gap-1">
        {actions.map((action, index) => (
          <button
            key={action.id}
            onClick={action.onClick}
            disabled={action.disabled}
            className={`
              relative flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all
              ${action.variant === 'primary' 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : action.variant === 'danger'
                ? 'bg-red-50 text-red-600 hover:bg-red-100'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
              }
              ${action.disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <span className="material-symbols-outlined text-lg">{action.icon}</span>
            <span>{action.label}</span>
            {action.shortcut && (
              <kbd className="ml-1 px-1.5 py-0.5 bg-white/20 border border-current/20 rounded text-xs font-mono">
                {action.shortcut}
              </kbd>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// Preset action sets
export const FLOORPLAN_ACTIONS = {
  selection: (onDelete: () => void, selected: boolean) => [
    { id: 'delete', icon: 'delete', label: 'Delete', shortcut: 'Del', onClick: onDelete, disabled: !selected, variant: 'danger' as const },
  ],
  
  edit: (onUndo: () => void, onRedo: () => void, canUndo: boolean, canRedo: boolean) => [
    { id: 'undo', icon: 'undo', label: 'Undo', shortcut: '⌘Z', onClick: onUndo, disabled: !canUndo },
    { id: 'redo', icon: 'redo', label: 'Redo', shortcut: '⌘Y', onClick: onRedo, disabled: !canRedo },
  ],
  
  project: (onSave: () => void, onExport: () => void, onNew: () => void) => [
    { id: 'save', icon: 'save', label: 'Save', shortcut: '⌘S', onClick: onSave, variant: 'primary' as const },
    { id: 'export', icon: 'download', label: 'Export', shortcut: '⌘E', onClick: onExport },
    { id: 'new', icon: 'add', label: 'New', onClick: onNew },
  ],
};
