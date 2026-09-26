import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task } from '../../api/types';
import { Badge } from '../ui/Badge';
import {
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  Zap,
  Trash2,
  Edit2,
  Link as LinkIcon,
} from 'lucide-react';

interface TaskCardProps {
  task: Task;
  allTasksMap: Record<number, Task>;
  showCriticalPath: boolean;
  onEdit: (task: Task) => void;
  onDelete: (taskId: number) => void;
  onManageDependencies: (task: Task) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  allTasksMap,
  showCriticalPath,
  onEdit,
  onDelete,
  onManageDependencies,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: 'Task',
      task,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isCritical = task.is_critical && showCriticalPath;

  // Blocking task names for tooltip
  const blockingTaskNames = task.blocking_prerequisites
    .map((id) => allTasksMap[id]?.title || `Task #${id}`)
    .join(', ');

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative rounded-xl border bg-slate-900/90 p-4 shadow-md transition-all duration-200 select-none ${
        isDragging
          ? 'opacity-40 ring-2 ring-sky-500 shadow-2xl scale-105'
          : 'hover:border-slate-600 hover:shadow-lg'
      } ${
        isCritical
          ? 'border-amber-500/60 ring-1 ring-amber-500/30 bg-gradient-to-b from-amber-950/20 to-slate-900/90'
          : 'border-slate-800'
      }`}
    >
      {/* Top Badges & Actions */}
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Dynamic Ready vs Blocked Badge */}
          {task.is_blocked ? (
            <Badge
              variant="rose"
              title={`Prerequisites incomplete: ${blockingTaskNames}`}
              className="cursor-help"
            >
              <AlertTriangle className="w-3 h-3 text-rose-400" />
              Blocked
            </Badge>
          ) : (
            <Badge variant="emerald">
              <CheckCircle className="w-3 h-3 text-emerald-400" />
              Ready
            </Badge>
          )}

          {/* Critical Path Badge */}
          {isCritical && (
            <Badge variant="amber" className="animate-pulse">
              <Zap className="w-3 h-3 fill-amber-400" />
              Critical Path
            </Badge>
          )}
        </div>

        {/* Action icons */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
          <button
            onClick={() => onManageDependencies(task)}
            title="Manage Prerequisites"
            className="p-1 rounded text-slate-400 hover:text-sky-400 hover:bg-slate-800 transition"
          >
            <LinkIcon className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onEdit(task)}
            title="Edit Task"
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(task.id)}
            title="Delete Task"
            className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Task Drag Handle & Title */}
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <h3 className="text-sm font-semibold text-white tracking-tight leading-snug group-hover:text-sky-300 transition-colors">
          <span className="text-slate-500 font-mono text-xs mr-1.5">#{task.id}</span>
          {task.title}
        </h3>

        {task.description && (
          <p className="mt-1 text-xs text-slate-400 line-clamp-2 leading-relaxed">
            {task.description}
          </p>
        )}
      </div>

      {/* Blocking tooltip warning if blocked */}
      {task.is_blocked && task.blocking_prerequisites.length > 0 && (
        <div className="mt-2.5 px-2.5 py-1.5 rounded-lg bg-rose-950/40 border border-rose-500/20 text-[11px] text-rose-300 flex items-center gap-1.5">
          <AlertTriangle className="w-3 h-3 shrink-0 text-rose-400" />
          <span className="truncate">Waiting on: {blockingTaskNames}</span>
        </div>
      )}

      {/* Dates & Schedule Metadata */}
      <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-1" title="Start Date -> End Date">
          <Calendar className="w-3 h-3 text-slate-500" />
          <span>
            {task.start_date} <span className="text-slate-600">→</span> {task.end_date}
          </span>
        </div>

        <div className="flex items-center gap-1" title="Duration">
          <Clock className="w-3 h-3 text-slate-500" />
          <span className="font-medium text-slate-300">{task.duration}d</span>
        </div>
      </div>
    </div>
  );
};
