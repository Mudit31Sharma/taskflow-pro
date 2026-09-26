import React, { useState, useEffect, useCallback } from 'react';
import type {
  Task,
  Dependency,
  WorkflowStatus,
  TaskCreatePayload,
  TaskUpdatePayload,
} from './api/types';
import { api } from './api/client';
import { Header } from './components/ui/Header';
import { KanbanBoard } from './components/kanban/KanbanBoard';
import { DAGVisualizer } from './components/graph/DAGVisualizer';
import { TaskModal } from './components/modals/TaskModal';
import { DependencyModal } from './components/modals/DependencyModal';
import { AISuggestionsModal } from './components/modals/AISuggestionsModal';
import { ToastContainer, type ToastMessage } from './components/ui/Toast';
import { Loader2 } from 'lucide-react';

export const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [dependencies, setDependencies] = useState<Dependency[]>([]);
  const [criticalPath, setCriticalPath] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentView, setCurrentView] = useState<'kanban' | 'graph'>('kanban');
  const [showCriticalPath, setShowCriticalPath] = useState(true);

  // Modals state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [defaultColumn, setDefaultColumn] = useState<WorkflowStatus>('Backlog');

  const [isDependencyModalOpen, setIsDependencyModalOpen] = useState(false);
  const [selectedDepTask, setSelectedDepTask] = useState<Task | null>(null);

  const [isAIModalOpen, setIsAIModalOpen] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 6000);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Fetch full graph state from backend
  const loadGraph = useCallback(async () => {
    try {
      const data = await api.getGraph();
      setTasks(data.tasks);
      setDependencies(data.dependencies);
      setCriticalPath(data.critical_path);
    } catch (err: any) {
      console.error('Failed to load graph:', err);
      addToast({
        type: 'error',
        title: 'Connection Error',
        message: 'Could not connect to FastAPI backend server. Ensure backend is running.',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGraph();
  }, [loadGraph]);

  // Handle Drag & Drop move
  const handleMoveTask = async (
    taskId: number,
    targetStatus: WorkflowStatus,
    targetPosition: number
  ) => {
    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, workflow_status: targetStatus, position: targetPosition }
          : t
      )
    );

    try {
      await api.moveTask(taskId, targetStatus, targetPosition);
      // Reload to recalculate dynamic Ready/Blocked states across dependent tasks
      await loadGraph();
    } catch (err: any) {
      console.error('Failed to move task:', err);
      addToast({
        type: 'error',
        title: 'Move Failed',
        message: typeof err === 'string' ? err : 'Unable to persist card movement.',
      });
      loadGraph();
    }
  };

  // Task Creation & Editing
  const handleCreateOrUpdateTask = async (
    payload: TaskCreatePayload | TaskUpdatePayload
  ) => {
    try {
      if (editingTask) {
        await api.updateTask(editingTask.id, payload);
        addToast({
          type: 'success',
          title: 'Task Updated',
          message: `Saved changes to #${editingTask.id}. Downstream schedules recalculated.`,
        });
      } else {
        await api.createTask(payload as TaskCreatePayload);
        addToast({
          type: 'success',
          title: 'Task Created',
          message: 'New task added to board successfully.',
        });
      }
      setEditingTask(null);
      await loadGraph();
    } catch (err: any) {
      console.error('Failed to save task:', err);
      addToast({
        type: 'error',
        title: 'Operation Failed',
        message: typeof err === 'string' ? err : 'Could not save task.',
      });
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    if (!window.confirm(`Delete Task #${taskId}? Any connected dependencies will also be removed.`)) {
      return;
    }

    try {
      await api.deleteTask(taskId);
      addToast({
        type: 'success',
        title: 'Task Deleted',
        message: `Task #${taskId} and associated dependency edges removed.`,
      });
      await loadGraph();
    } catch (err: any) {
      console.error('Failed to delete task:', err);
      addToast({
        type: 'error',
        title: 'Delete Failed',
        message: typeof err === 'string' ? err : 'Could not delete task.',
      });
    }
  };

  // Dependencies
  const handleAddDependency = async (
    precursorId: number,
    dependentId: number
  ): Promise<boolean> => {
    try {
      await api.createDependency(precursorId, dependentId);
      addToast({
        type: 'success',
        title: 'Dependency Created',
        message: `Added edge: #${precursorId} -> #${dependentId}. Schedule updated.`,
      });
      await loadGraph();
      return true;
    } catch (err: any) {
      const msg = err?.message || (typeof err === 'string' ? err : 'Cycle detection error');
      addToast({
        type: 'error',
        title: 'Invalid Dependency Rejected',
        message: msg,
        cycle: err?.cycle,
      });
      throw err;
    }
  };

  const handleDeleteDependency = async (depId: number) => {
    try {
      await api.deleteDependency(depId);
      addToast({
        type: 'success',
        title: 'Dependency Removed',
        message: 'Prerequisite constraint removed. Graph re-evaluated.',
      });
      await loadGraph();
    } catch (err: any) {
      console.error('Failed to delete dependency:', err);
      addToast({
        type: 'error',
        title: 'Action Failed',
        message: 'Could not remove dependency.',
      });
    }
  };

  // Reset to Seed
  const handleResetData = async () => {
    if (!window.confirm('Reset the board to the default 8 realistic software engineering tasks?')) {
      return;
    }
    setLoading(true);
    try {
      await api.resetGraph();
      addToast({
        type: 'success',
        title: 'Board Reset',
        message: 'Loaded sample engineering tasks with diamond dependencies.',
      });
      await loadGraph();
    } catch (err: any) {
      console.error('Failed to reset data:', err);
      addToast({
        type: 'error',
        title: 'Reset Failed',
        message: 'Could not reset dataset.',
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Header
        currentView={currentView}
        onViewChange={setCurrentView}
        showCriticalPath={showCriticalPath}
        onToggleCriticalPath={() => setShowCriticalPath((prev) => !prev)}
        onOpenNewTaskModal={() => {
          setEditingTask(null);
          setDefaultColumn('Backlog');
          setIsTaskModalOpen(true);
        }}
        onOpenDependencyModal={() => {
          setSelectedDepTask(null);
          setIsDependencyModalOpen(true);
        }}
        onOpenAIModal={() => setIsAIModalOpen(true)}
        onResetData={handleResetData}
        taskCount={tasks.length}
        dependencyCount={dependencies.length}
      />

      <main className="flex-1 flex flex-col relative overflow-hidden">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-10 h-10 animate-spin text-sky-400" />
            <p className="text-sm font-medium">Initializing TaskFlow Pro DAG Engine...</p>
          </div>
        ) : currentView === 'kanban' ? (
          <KanbanBoard
            tasks={tasks}
            showCriticalPath={showCriticalPath}
            onMoveTask={handleMoveTask}
            onEditTask={(task) => {
              setEditingTask(task);
              setIsTaskModalOpen(true);
            }}
            onDeleteTask={handleDeleteTask}
            onManageDependencies={(task) => {
              setSelectedDepTask(task);
              setIsDependencyModalOpen(true);
            }}
            onAddTaskToColumn={(col) => {
              setEditingTask(null);
              setDefaultColumn(col);
              setIsTaskModalOpen(true);
            }}
          />
        ) : (
          <DAGVisualizer
            tasks={tasks}
            dependencies={dependencies}
            criticalPath={criticalPath}
            showCriticalPath={showCriticalPath}
            onSelectTask={(task) => {
              setEditingTask(task);
              setIsTaskModalOpen(true);
            }}
          />
        )}
      </main>

      {/* Modals */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setEditingTask(null);
        }}
        onSubmit={handleCreateOrUpdateTask}
        initialTask={editingTask}
        defaultColumn={defaultColumn}
      />

      <DependencyModal
        isOpen={isDependencyModalOpen}
        onClose={() => {
          setIsDependencyModalOpen(false);
          setSelectedDepTask(null);
        }}
        tasks={tasks}
        dependencies={dependencies}
        onAddDependency={handleAddDependency}
        onDeleteDependency={handleDeleteDependency}
        initialSelectedTask={selectedDepTask}
      />

      <AISuggestionsModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        tasks={tasks}
        dependencies={dependencies}
        onAcceptSuggestion={handleAddDependency}
      />

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};

export default App;
