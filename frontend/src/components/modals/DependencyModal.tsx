import React, { useState } from 'react';
import type { Task, Dependency } from '../../api/types';
import { X, ArrowRight, Plus, Trash2, GitFork, AlertCircle } from 'lucide-react';

interface DependencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  dependencies: Dependency[];
  onAddDependency: (precursorId: number, dependentId: number) => Promise<boolean>;
  onDeleteDependency: (dependencyId: number) => void;
  initialSelectedTask?: Task | null;
}

export const DependencyModal: React.FC<DependencyModalProps> = ({
  isOpen,
  onClose,
  tasks,
  dependencies,
  onAddDependency,
  onDeleteDependency,
  initialSelectedTask,
}) => {
  const [precursorId, setPrecursorId] = useState<number>(
    initialSelectedTask ? initialSelectedTask.id : tasks[0]?.id || 0
  );
  const [dependentId, setDependentId] = useState<number>(
    tasks[1]?.id || tasks[0]?.id || 0
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const tasksMap: Record<number, Task> = {};
  tasks.forEach((t) => {
    tasksMap[t.id] = t;
  });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (precursorId === dependentId) {
      setErrorMsg('Self-dependencies are not allowed (a task cannot depend on itself).');
      return;
    }

    const alreadyExists = dependencies.some(
      (d) => d.precursor_id === precursorId && d.dependent_id === dependentId
    );
    if (alreadyExists) {
      setErrorMsg('This dependency relationship already exists.');
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await onAddDependency(precursorId, dependentId);
      if (success) {
        setErrorMsg(null);
      }
    } catch (err: any) {
      setErrorMsg(typeof err === 'string' ? err : err?.message || 'Failed to add dependency');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-xl rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <GitFork className="w-5 h-5 text-sky-400" />
            <h3 className="text-base font-bold text-white">Manage Dependencies</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Add Dependency Form */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 mb-4">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5">
            Add Directed Prerequisite Edge
          </h4>

          {errorMsg && (
            <div className="mb-3 p-3 rounded-lg bg-rose-950/60 border border-rose-500/30 text-rose-200 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleAdd} className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row items-center gap-2 text-xs">
              <div className="flex-1 w-full">
                <label className="block text-[11px] text-slate-400 mb-1">
                  Prerequisite Task (Must Finish First)
                </label>
                <select
                  value={precursorId}
                  onChange={(e) => {
                    setPrecursorId(Number(e.target.value));
                    setErrorMsg(null);
                  }}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white focus:border-sky-500 focus:outline-none"
                >
                  {tasks.map((t) => (
                    <option key={t.id} value={t.id}>
                      #{t.id}: {t.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4 text-slate-500 hidden sm:block">
                <ArrowRight className="w-4 h-4" />
              </div>

              <div className="flex-1 w-full">
                <label className="block text-[11px] text-slate-400 mb-1">
                  Dependent Task (Waits for Prerequisite)
                </label>
                <select
                  value={dependentId}
                  onChange={(e) => {
                    setDependentId(Number(e.target.value));
                    setErrorMsg(null);
                  }}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white focus:border-sky-500 focus:outline-none"
                >
                  {tasks.map((t) => (
                    <option key={t.id} value={t.id}>
                      #{t.id}: {t.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end mt-1">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-sky-500/20 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Dependency Edge
              </button>
            </div>
          </form>
        </div>

        {/* Existing Dependencies List */}
        <div className="flex-1 overflow-y-auto">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Active Dependency Chains ({dependencies.length})
          </h4>

          {dependencies.length === 0 ? (
            <p className="text-slate-500 text-xs italic py-4 text-center">
              No dependencies defined. All tasks can run independently.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {dependencies.map((dep) => {
                const prec = tasksMap[dep.precursor_id];
                const depT = tasksMap[dep.dependent_id];

                return (
                  <div
                    key={dep.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-950/40 text-xs hover:border-slate-700 transition"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
                      <span className="font-semibold text-white truncate max-w-[40%]">
                        #{dep.precursor_id} {prec?.title || 'Unknown'}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                      <span className="font-semibold text-white truncate max-w-[40%]">
                        #{dep.dependent_id} {depT?.title || 'Unknown'}
                      </span>
                    </div>

                    <button
                      onClick={() => onDeleteDependency(dep.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                      title="Remove dependency edge"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
