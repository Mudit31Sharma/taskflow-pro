import React, { useMemo } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  BackgroundVariant,
  MiniMap,
  MarkerType,
} from '@xyflow/react';
import type { Node, Edge } from '@xyflow/react';
import type { Task, Dependency } from '../../api/types';
import { Badge } from '../ui/Badge';
import { CheckCircle, AlertTriangle, Zap, Clock } from 'lucide-react';

interface DAGVisualizerProps {
  tasks: Task[];
  dependencies: Dependency[];
  criticalPath: number[];
  showCriticalPath: boolean;
  onSelectTask: (task: Task) => void;
}

// Custom Node for React Flow
const DAGTaskNode = ({ data }: { data: any }) => {
  const task: Task = data.task;
  const isCritical = data.isCritical;

  return (
    <div
      onClick={() => data.onSelect(task)}
      className={`w-64 p-3.5 rounded-xl border bg-slate-900/95 shadow-xl cursor-pointer transition-all duration-200 select-none ${
        isCritical
          ? 'border-amber-500 ring-2 ring-amber-500/40 shadow-amber-500/10'
          : 'border-slate-700/80 hover:border-sky-500/80'
      }`}
    >
      <div className="flex items-center justify-between gap-1 mb-2">
        <span className="font-mono text-[11px] font-semibold text-slate-400">
          #{task.id}
        </span>

        <div className="flex items-center gap-1">
          {task.is_blocked ? (
            <Badge variant="rose" size="sm">
              <AlertTriangle className="w-2.5 h-2.5" />
              Blocked
            </Badge>
          ) : (
            <Badge variant="emerald" size="sm">
              <CheckCircle className="w-2.5 h-2.5" />
              Ready
            </Badge>
          )}

          {isCritical && (
            <Badge variant="amber" size="sm">
              <Zap className="w-2.5 h-2.5 fill-amber-400" />
              Critical
            </Badge>
          )}
        </div>
      </div>

      <h4 className="text-xs font-bold text-white tracking-tight line-clamp-1">
        {task.title}
      </h4>

      <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-2">
        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
          {task.workflow_status}
        </span>
        <div className="flex items-center gap-1 text-slate-400">
          <Clock className="w-3 h-3 text-slate-500" />
          <span>{task.duration}d</span>
        </div>
      </div>
    </div>
  );
};

const nodeTypes = {
  taskNode: DAGTaskNode,
};

export const DAGVisualizer: React.FC<DAGVisualizerProps> = ({
  tasks,
  dependencies,
  criticalPath,
  showCriticalPath,
  onSelectTask,
}) => {
  const criticalPathSet = useMemo(() => new Set(criticalPath), [criticalPath]);

  // Compute layered positions (topological layout)
  const { nodes, edges } = useMemo(() => {
    // Determine depth for each node
    const inDegree: Record<number, number> = {};
    const adj: Record<number, number[]> = {};
    const allIds = tasks.map((t) => t.id);

    allIds.forEach((id) => {
      inDegree[id] = 0;
      adj[id] = [];
    });

    dependencies.forEach((d) => {
      if (adj[d.precursor_id]) {
        adj[d.precursor_id].push(d.dependent_id);
      }
      if (inDegree[d.dependent_id] !== undefined) {
        inDegree[d.dependent_id] += 1;
      }
    });

    // Compute depth / level
    const depth: Record<number, number> = {};
    allIds.forEach((id) => {
      depth[id] = 0;
    });

    // Simple BFS depth calculation
    const queue = allIds.filter((id) => inDegree[id] === 0);
    while (queue.length > 0) {
      const u = queue.shift()!;
      (adj[u] || []).forEach((v) => {
        if ((depth[u] || 0) + 1 > (depth[v] || 0)) {
          depth[v] = (depth[u] || 0) + 1;
        }
        inDegree[v] -= 1;
        if (inDegree[v] === 0) {
          queue.push(v);
        }
      });
    }

    // Group tasks by level
    const levels: Record<number, Task[]> = {};
    tasks.forEach((t) => {
      const d = depth[t.id] || 0;
      if (!levels[d]) levels[d] = [];
      levels[d].push(t);
    });

    // Build React Flow nodes
    const flowNodes: Node[] = [];
    const LEVEL_X_GAP = 320;
    const NODE_Y_GAP = 130;

    Object.entries(levels).forEach(([lvlStr, levelTasks]) => {
      const level = Number(lvlStr);
      levelTasks.forEach((task, idx) => {
        const isCritical = criticalPathSet.has(task.id) && showCriticalPath;
        flowNodes.push({
          id: String(task.id),
          type: 'taskNode',
          position: {
            x: level * LEVEL_X_GAP + 60,
            y: idx * NODE_Y_GAP + 60,
          },
          data: {
            task,
            isCritical,
            onSelect: onSelectTask,
          },
        });
      });
    });

    // Build React Flow directed edges
    const flowEdges: Edge[] = dependencies.map((d) => {
      const isCriticalEdge =
        showCriticalPath &&
        criticalPathSet.has(d.precursor_id) &&
        criticalPathSet.has(d.dependent_id);

      return {
        id: `e-${d.precursor_id}-${d.dependent_id}`,
        source: String(d.precursor_id),
        target: String(d.dependent_id),
        animated: isCriticalEdge,
        style: {
          stroke: isCriticalEdge ? '#f59e0b' : '#38bdf8',
          strokeWidth: isCriticalEdge ? 2.5 : 1.5,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isCriticalEdge ? '#f59e0b' : '#38bdf8',
          width: 16,
          height: 16,
        },
      };
    });

    return { nodes: flowNodes, edges: flowEdges };
  }, [tasks, dependencies, criticalPathSet, showCriticalPath, onSelectTask]);

  return (
    <div className="w-full h-[calc(100vh-80px)] bg-slate-950 relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
        className="bg-slate-950"
      >
        <Background color="#334155" gap={20} size={1} variant={BackgroundVariant.Dots} />
        <Controls className="bg-slate-900 border border-slate-700 text-white fill-white" />
        <MiniMap
          nodeColor={(n) => (criticalPathSet.has(Number(n.id)) && showCriticalPath ? '#f59e0b' : '#38bdf8')}
          maskColor="rgba(15, 23, 42, 0.7)"
          className="bg-slate-900 border border-slate-700 rounded-lg overflow-hidden"
        />
      </ReactFlow>
    </div>
  );
};
