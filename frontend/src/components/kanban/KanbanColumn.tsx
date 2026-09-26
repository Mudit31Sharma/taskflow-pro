import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import type { Task, WorkflowStatus } from '../../api/types';
import { TaskCard } from './TaskCard';
import { Plus } from 'lucide-react';

interface KanbanColumnProps {
  id: WorkflowStatus;
  title: string;
  tasks: Task[];
  allTasksMap: Record<number, Task>;
  showCriticalPath: boolean;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: number) => void;
  onManageDependencies: (task: Task) => void;
  onAddTaskToColumn: (column: WorkflowStatus) => void;
}

const columnColorStyles: Record<
  WorkflowStatus,
  { border: string; dot: string; bgHeader: string }
> = {
  Backlog: {
    border: 'border-slate-800',
    dot: 'bg-slate-400',
    bgHeader: 'bg-slate-800/40',
  },
  'In Progress': {
    border: 'border-sky-500/30',
    dot: 'bg-sky-400',
    bgHeader: 'bg-sky-950/20',
  },
  Review: {
    border: 'border-purple-500/30',
    dot: 'bg-purple-400',
    bgHeader: 'bg-purple-950/20',
  },
  Done: {
    border: 'border-emerald-500/30',
    dot: 'bg-emerald-400',
    bgHeader: 'bg-emerald-950/20',
  },
};

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  id,
  title,
  tasks,
  allTasksMap,
  showCriticalPath,
  onEditTask,
  onDeleteTask,
  onManageDependencies,
  onAddTaskToColumn,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: {
      type: 'Column',
      column: id,
    },
  });

  const colors = columnColorStyles[id];
  const blockedCount = tasks.filter((t) => t.is_blocked).length;

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col rounded-2xl border bg-slate-900/50 backdrop-blur-sm min-w-[300px] w-full max-w-sm h-full transition-colors ${
        colors.border
      } ${isOver ? 'ring-2 ring-sky-500/50 bg-slate-800/30' : ''}`}
    >
      {/* Column Header */}
      <div
        className={`px-4 py-3 border-b border-slate-800/80 rounded-t-2xl flex items-center justify-between ${colors.bgHeader}`}
      >
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${colors.dot}`} />
          <h2 className="text-sm font-bold text-white tracking-tight">{title}</h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold border border-slate-700/60">
            {tasks.length}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {blockedCount > 0 && (
            <span
              title={`${blockedCount} task(s) currently blocked by unfinished prerequisites`}
              className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30"
            >
              {blockedCount} blocked
            </span>
          )}
          <button
            onClick={() => onAddTaskToColumn(id)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title={`Add task to ${title}`}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Task Cards Droppable Area */}
      <div className="flex-1 p-3 flex flex-col gap-3 overflow-y-auto min-h-[450px]">
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              allTasksMap={allTasksMap}
              showCriticalPath={showCriticalPath}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
              onManageDependencies={onManageDependencies}
            />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-800/80 rounded-xl p-6 text-center text-slate-600 text-xs">
            No tasks in {title}
          </div>
        )}
      </div>
    </div>
  );
};
