export type WorkflowStatus = 'Backlog' | 'In Progress' | 'Review' | 'Done';

export interface Task {
  id: number;
  title: string;
  description: string;
  workflow_status: WorkflowStatus;
  position: number;
  start_date: string;
  duration: number;
  end_date: string;
  is_ready: boolean;
  is_blocked: boolean;
  blocking_prerequisites: number[];
  is_critical: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Dependency {
  id: number;
  precursor_id: number;
  dependent_id: number;
}

export interface GraphResponse {
  tasks: Task[];
  dependencies: Dependency[];
  critical_path: number[];
}

export interface TaskCreatePayload {
  title: string;
  description?: string;
  workflow_status?: WorkflowStatus;
  start_date?: string;
  duration?: number;
}

export interface TaskUpdatePayload {
  title?: string;
  description?: string;
  workflow_status?: WorkflowStatus;
  start_date?: string;
  duration?: number;
  position?: number;
}

export interface AISuggestion {
  precursor_id: number;
  dependent_id: number;
  reason: string;
}

export interface AISuggestionResponse {
  suggestions: AISuggestion[];
}

export interface ApiError {
  detail: {
    message?: string;
    cycle?: number[];
  } | string;
}
