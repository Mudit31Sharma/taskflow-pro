import React, { useState, useEffect } from 'react';
import type { Task, Dependency, AISuggestion } from '../../api/types';
import { api } from '../../api/client';
import {
  X,
  Sparkles,
  ArrowRight,
  Check,
  RotateCcw,
  ShieldCheck,
  Loader2,
} from 'lucide-react';

interface AISuggestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  dependencies: Dependency[];
  onAcceptSuggestion: (precursorId: number, dependentId: number) => Promise<boolean>;
}

export const AISuggestionsModal: React.FC<AISuggestionsModalProps> = ({
  isOpen,
  onClose,
  tasks,
  onAcceptSuggestion,
}) => {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [acceptedEdges, setAcceptedEdges] = useState<Set<string>>(new Set());

  const tasksMap: Record<number, Task> = {};
  tasks.forEach((t) => {
    tasksMap[t.id] = t;
  });

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const res = await api.getAISuggestions();
      setSuggestions(res.suggestions);
    } catch (err) {
      console.error('Failed to load AI suggestions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchSuggestions();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAccept = async (s: AISuggestion) => {
    const key = `${s.precursor_id}-${s.dependent_id}`;
    const success = await onAcceptSuggestion(s.precursor_id, s.dependent_id);
    if (success) {
      setAcceptedEdges((prev) => new Set(prev).add(key));
    }
  };

  const handleDismiss = (s: AISuggestion) => {
    setSuggestions((prev) =>
      prev.filter(
        (item) =>
          !(
            item.precursor_id === s.precursor_id &&
            item.dependent_id === s.dependent_id
          )
      )
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-2xl rounded-2xl border border-purple-500/40 bg-slate-900 p-6 shadow-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                AI Dependency Assistant
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Human-in-the-Loop
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Grounds recommendations in your task context and validates them against cycles.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Safety & Grounding Notice Banner */}
        <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-500/30 mb-4 flex items-start gap-2.5 text-xs text-purple-200">
          <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            AI suggestions are never committed directly to the database. Each recommendation
            requires explicit user acceptance and is rigorously checked by our backend DFS cycle
            detector before being persisted.
          </p>
        </div>

        {/* Suggestions List */}
        <div className="flex-1 overflow-y-auto pr-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
              <p className="text-xs font-medium">Analyzing task context & graph relationships...</p>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              No new candidate dependencies detected for the current tasks.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {suggestions.map((s) => {
                const prec = tasksMap[s.precursor_id];
                const depT = tasksMap[s.dependent_id];
                const key = `${s.precursor_id}-${s.dependent_id}`;
                const isAccepted = acceptedEdges.has(key);

                return (
                  <div
                    key={key}
                    className={`p-4 rounded-xl border transition-all ${
                      isAccepted
                        ? 'border-emerald-500/40 bg-emerald-950/20'
                        : 'border-slate-800 bg-slate-950/50 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2 text-xs font-semibold text-white">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-sky-400 border border-slate-700">
                          #{s.precursor_id} {prec?.title || 'Unknown'}
                        </span>
                        <ArrowRight className="w-4 h-4 text-purple-400 shrink-0" />
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700">
                          #{s.dependent_id} {depT?.title || 'Unknown'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isAccepted ? (
                          <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                            <Check className="w-3.5 h-3.5" />
                            Applied
                          </span>
                        ) : (
                          <>
                            <button
                              onClick={() => handleDismiss(s)}
                              className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition"
                            >
                              Dismiss
                            </button>
                            <button
                              onClick={() => handleAccept(s)}
                              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-600/20 transition"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Accept Edge
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed pl-1">
                      <strong className="text-slate-300 font-medium">Rationale:</strong> {s.reason}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={fetchSuggestions}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Re-analyze Tasks
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
