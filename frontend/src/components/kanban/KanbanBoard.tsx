import React, { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import type { Task, WorkflowStatus } from '../../api/types';
import { KanbanColumn } from './KanbanColumn';
import { TaskCard } from './TaskCard';

const COLUMNS: WorkflowStatus[] = ['Backlog', 'In Progress', 'Review', 'Done'];

interface KanbanBoardProps {
  tasks: Task[];
  showCriticalPath: boolean;
  onMoveTask: (
    taskId: number,
    targetStatus: WorkflowStatus,
    targetPosition: number
  ) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: number) => void;
  onManageDependencies: (task: Task) => void;
  onAddTaskToColumn: (column: WorkflowStatus) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tasks,
  showCriticalPath,
  onMoveTask,
  onEditTask,
  onDeleteTask,
  onManageDependencies,
  onAddTaskToColumn,
}) => {
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const allTasksMap: Record<number, Task> = {};
  tasks.forEach((t) => {
    allTasksMap[t.id] = t;
  });

  const getTasksByColumn = (status: WorkflowStatus): Task[] => {
    return tasks
      .filter((t) => t.workflow_status === status)
      .sort((a, b) => a.position - b.position);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find((t) => t.id === Number(active.id));
    if (task) setActiveTask(task);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeId = Number(active.id);
    const activeTaskObj = tasks.find((t) => t.id === activeId);
    if (!activeTaskObj) return;

    // Check if dropped directly onto a column or onto another task
    let targetStatus: WorkflowStatus | null = null;
    let targetPosition = 0;

    const overIdStr = String(over.id);
    if (COLUMNS.includes(overIdStr as WorkflowStatus)) {
      targetStatus = overIdStr as WorkflowStatus;
      const columnTasks = getTasksByColumn(targetStatus);
      targetPosition = columnTasks.length;
    } else {
      const overTaskId = Number(over.id);
      const overTaskObj = tasks.find((t) => t.id === overTaskId);
      if (overTaskObj) {
        targetStatus = overTaskObj.workflow_status;
        targetPosition = overTaskObj.position;
      }
    }

    if (
      targetStatus &&
      (activeTaskObj.workflow_status !== targetStatus ||
        activeTaskObj.position !== targetPosition)
    ) {
      onMoveTask(activeId, targetStatus, targetPosition);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex-1 p-6 overflow-x-auto">
        <div className="flex gap-5 min-w-max items-start h-[calc(100vh-130px)]">
          {COLUMNS.map((columnId) => (
            <KanbanColumn
              key={columnId}
              id={columnId}
              title={columnId}
              tasks={getTasksByColumn(columnId)}
              allTasksMap={allTasksMap}
              showCriticalPath={showCriticalPath}
              onEditTask={onEditTask}
              onDeleteTask={onDeleteTask}
              onManageDependencies={onManageDependencies}
              onAddTaskToColumn={onAddTaskToColumn}
            />
          ))}
        </div>
      </div>

      <DragOverlay>
        {activeTask ? (
          <div className="w-[320px]">
            <TaskCard
              task={activeTask}
              allTasksMap={allTasksMap}
              showCriticalPath={showCriticalPath}
              onEdit={() => {}}
              onDelete={() => {}}
              onManageDependencies={() => {}}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
