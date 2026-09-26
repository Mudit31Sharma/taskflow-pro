import type {
  GraphResponse,
  Task,
  Dependency,
  TaskCreatePayload,
  TaskUpdatePayload,
  WorkflowStatus,
  AISuggestionResponse,
} from './types';

const API_BASE = import.meta.env.VITE_API_URL || '';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorDetail: any = 'An unexpected error occurred';
    try {
      const json = await res.json();
      errorDetail = json.detail || json.message || errorDetail;
    } catch {
      errorDetail = res.statusText;
    }
    throw errorDetail;
  }
  if (res.status === 204) {
    return {} as T;
  }
  return res.json();
}

export const api = {
  async getGraph(): Promise<GraphResponse> {
    const res = await fetch(`${API_BASE}/api/graph`);
    return handleResponse<GraphResponse>(res);
  },

  async resetGraph(): Promise<GraphResponse> {
    const res = await fetch(`${API_BASE}/api/graph/reset`, { method: 'POST' });
    return handleResponse<GraphResponse>(res);
  },

  async createTask(payload: TaskCreatePayload): Promise<Task> {
    const res = await fetch(`${API_BASE}/api/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse<Task>(res);
  },

  async updateTask(id: number, payload: TaskUpdatePayload): Promise<Task> {
    const res = await fetch(`${API_BASE}/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse<Task>(res);
  },

  async moveTask(
    id: number,
    workflow_status: WorkflowStatus,
    position: number
  ): Promise<Task[]> {
    const res = await fetch(`${API_BASE}/api/tasks/${id}/move`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workflow_status, position }),
    });
    return handleResponse<Task[]>(res);
  },

  async deleteTask(id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/api/tasks/${id}`, {
      method: 'DELETE',
    });
    return handleResponse<void>(res);
  },

  async createDependency(
    precursor_id: number,
    dependent_id: number
  ): Promise<Dependency> {
    const res = await fetch(`${API_BASE}/api/dependencies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ precursor_id, dependent_id }),
    });
    return handleResponse<Dependency>(res);
  },

  async deleteDependency(id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/api/dependencies/${id}`, {
      method: 'DELETE',
    });
    return handleResponse<void>(res);
  },

  async deleteDependencyByEdge(
    precursor_id: number,
    dependent_id: number
  ): Promise<void> {
    const res = await fetch(
      `${API_BASE}/api/dependencies/edge/${precursor_id}/${dependent_id}`,
      {
        method: 'DELETE',
      }
    );
    return handleResponse<void>(res);
  },

  async getAISuggestions(): Promise<AISuggestionResponse> {
    const res = await fetch(`${API_BASE}/api/ai/suggest`, {
      method: 'POST',
    });
    return handleResponse<AISuggestionResponse>(res);
  },
};
