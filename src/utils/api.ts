import type { APIResponse, Project, Model } from '../types/index.js';

// API レスポンス統一ユーティリティ
export class APIClient {
  private baseURL: string;

  constructor(baseURL: string = '') {
    this.baseURL = baseURL;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<APIResponse<T>> {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: error,
        },
      };
    }
  }

  // プロジェクト関連API
  async getProjects(): Promise<APIResponse<Project[]>> {
    return this.makeRequest<Project[]>('/api/projects');
  }

  async getProject(id: string): Promise<APIResponse<Project>> {
    return this.makeRequest<Project>(`/api/projects/${id}`);
  }

  async createProject(project: Omit<Project, 'id' | 'created_at'>): Promise<APIResponse<Project>> {
    return this.makeRequest<Project>('/api/projects', {
      method: 'POST',
      body: JSON.stringify(project),
    });
  }

  async updateProject(id: string, project: Partial<Project>): Promise<APIResponse<Project>> {
    return this.makeRequest<Project>(`/api/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(project),
    });
  }

  async deleteProject(id: string): Promise<APIResponse<void>> {
    return this.makeRequest<void>(`/api/projects/${id}`, {
      method: 'DELETE',
    });
  }

  // モデル関連API
  async getModels(): Promise<APIResponse<Model[]>> {
    return this.makeRequest<Model[]>('/api/models');
  }

  async getModel(id: string): Promise<APIResponse<Model>> {
    return this.makeRequest<Model>(`/api/models/${id}`);
  }
}

// グローバルAPIクライアントインスタンス
export const api = new APIClient();

// ローディング状態管理ユーティリティ
export class LoadingManager {
  private loadingStates: Map<string, boolean> = new Map();
  private callbacks: Map<string, (() => void)[]> = new Map();

  setLoading(key: string, isLoading: boolean): void {
    this.loadingStates.set(key, isLoading);
    this.notifyCallbacks(key);
  }

  isLoading(key: string): boolean {
    return this.loadingStates.get(key) || false;
  }

  onLoadingChange(key: string, callback: () => void): void {
    if (!this.callbacks.has(key)) {
      this.callbacks.set(key, []);
    }
    this.callbacks.get(key)!.push(callback);
  }

  private notifyCallbacks(key: string): void {
    const callbacks = this.callbacks.get(key) || [];
    callbacks.forEach(callback => callback());
  }
}

export const loadingManager = new LoadingManager();