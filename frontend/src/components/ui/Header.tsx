import React from 'react';
import {
  LayoutDashboard,
  GitFork,
  Sparkles,
  Plus,
  RotateCcw,
  Zap,
} from 'lucide-react';

interface HeaderProps {
  currentView: 'kanban' | 'graph';
  onViewChange: (view: 'kanban' | 'graph') => void;
  showCriticalPath: boolean;
  onToggleCriticalPath: () => void;
  onOpenNewTaskModal: () => void;
  onOpenDependencyModal: () => void;
  onOpenAIModal: () => void;
  onResetData: () => void;
  taskCount: number;
  dependencyCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onViewChange,
  showCriticalPath,
  onToggleCriticalPath,
  onOpenNewTaskModal,
  onOpenDependencyModal,
  onOpenAIModal,
  onResetData,
  taskCount,
  dependencyCount,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-30 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
      {/* Brand & Project Info */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20 text-white font-black text-xl">
          ⚡
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-white tracking-tight">TaskFlow Pro</h1>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30">
              DAG Engine
            </span>
          </div>
          <p className="text-xs text-slate-400">
            {taskCount} tasks • {dependencyCount} directed dependency edges
          </p>
        </div>
      </div>

      {/* View Switcher & Critical Path Toggle */}
      <div className="flex items-center gap-3">
        {/* Toggle View */}
        <div className="flex bg-slate-800/90 p-1 rounded-xl border border-slate-700/60 shadow-inner">
          <button
            onClick={() => onViewChange('kanban')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              currentView === 'kanban'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            Kanban Board
          </button>
          <button
            onClick={() => onViewChange('graph')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              currentView === 'graph'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <GitFork className="w-3.5 h-3.5" />
            DAG Graph View
          </button>
        </div>

        {/* Critical Path Toggle */}
        <button
          onClick={onToggleCriticalPath}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition shadow-sm ${
            showCriticalPath
              ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 ring-1 ring-amber-500/40'
              : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
          }`}
          title="Highlight tasks on the critical (longest duration) path"
        >
          <Zap className={`w-3.5 h-3.5 ${showCriticalPath ? 'text-amber-400 fill-amber-400' : ''}`} />
          Critical Path
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenAIModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/20 border border-purple-500/40 text-purple-300 hover:bg-purple-600/30 text-xs font-medium transition shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          AI Suggest
        </button>

        <button
          onClick={onOpenDependencyModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 text-xs font-medium transition"
        >
          <GitFork className="w-3.5 h-3.5 text-sky-400" />
          Dependencies
        </button>

        <button
          onClick={onOpenNewTaskModal}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold shadow-md shadow-sky-500/25 transition"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Task
        </button>

        <button
          onClick={onResetData}
          className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition border border-transparent hover:border-slate-700"
          title="Reset to 8 seed tasks dataset"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
