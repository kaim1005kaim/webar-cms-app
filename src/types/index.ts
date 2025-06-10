// プロジェクトで使用する型定義を統一

export interface Project {
  id: string;
  name: string;
  creator: {
    userId: string;
    name: string;
  };
  marker: {
    imageUrl: string;
    nftDescriptor: string;
    printTemplate?: string;
  };
  character: {
    modelUrl: string;
    scale: number;
    position: [number, number, number];
    animations: string[];
  };
  metadata: {
    description: string;
    tags: string[];
    isPublic: boolean;
  };
  created_at: string;
}

export interface Marker {
  id: string;
  projectId: string;
  name: string;
  imageUrl: string;
  nftData: string;
  trackingQuality: 'excellent' | 'good' | 'fair' | 'poor';
  printRecommendations: {
    minSize: string;
    dpi: number;
    contrast: 'high' | 'medium' | 'low';
  };
}

export interface Model {
  id: string;
  title: string;
  description: string;
  model_url: string;
  thumbnail_url: string;
  created_at: string;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface ProjectsData {
  projects: Project[];
  markers: Marker[];
}

export interface ModelsData {
  models: Model[];
}

// WebGPU関連の型定義
export interface WebGPUCapabilities {
  supported: boolean;
  device?: GPUDevice;
  format?: GPUTextureFormat;
}

// AR関連の型定義
export interface ARTrackingState {
  isTracking: boolean;
  confidence: number;
  matrix: Float32Array;
}

export interface ARConfiguration {
  trackingMethod: 'best' | 'marker' | 'nft';
  sourceType: 'webcam' | 'image' | 'video';
  debugUI: boolean;
  smoothing: {
    enabled: boolean;
    count: number;
    tolerance: number;
    threshold: number;
  };
}

// API エラー型
export class APIError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}