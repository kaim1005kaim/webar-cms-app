// 環境設定の統一管理

interface AppConfig {
  api: {
    baseURL: string;
    timeout: number;
  };
  ar: {
    trackingMethod: 'best' | 'marker' | 'nft';
    sourceType: 'webcam' | 'image' | 'video';
    debugUI: boolean;
    smoothing: {
      enabled: boolean;
      count: number;
      tolerance: number;
      threshold: number;
    };
  };
  webgpu: {
    fallbackToWebGL: boolean;
    preferredFormat: string;
  };
  cache: {
    models: number; // seconds
    markers: number; // seconds
  };
  development: {
    enableLogs: boolean;
    enablePerformanceMonitoring: boolean;
  };
}

// 環境別設定
const developmentConfig: AppConfig = {
  api: {
    baseURL: '',
    timeout: 10000,
  },
  ar: {
    trackingMethod: 'best',
    sourceType: 'webcam',
    debugUI: true,
    smoothing: {
      enabled: true,
      count: 10,
      tolerance: 0.01,
      threshold: 5,
    },
  },
  webgpu: {
    fallbackToWebGL: true,
    preferredFormat: 'bgra8unorm',
  },
  cache: {
    models: 3600, // 1 hour
    markers: 86400, // 1 day
  },
  development: {
    enableLogs: true,
    enablePerformanceMonitoring: true,
  },
};

const productionConfig: AppConfig = {
  ...developmentConfig,
  ar: {
    ...developmentConfig.ar,
    debugUI: false,
  },
  cache: {
    models: 31536000, // 1 year
    markers: 86400, // 1 day
  },
  development: {
    enableLogs: false,
    enablePerformanceMonitoring: false,
  },
};

// 環境判定
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = !isProduction;

export const config: AppConfig = isProduction ? productionConfig : developmentConfig;

export const ENV = {
  isDevelopment,
  isProduction,
  nodeEnv: process.env.NODE_ENV || 'development',
} as const;

// ログユーティリティ
export const logger = {
  debug: (...args: any[]) => {
    if (config.development.enableLogs) {
      console.log('[DEBUG]', ...args);
    }
  },
  info: (...args: any[]) => {
    if (config.development.enableLogs) {
      console.info('[INFO]', ...args);
    }
  },
  warn: (...args: any[]) => {
    console.warn('[WARN]', ...args);
  },
  error: (...args: any[]) => {
    console.error('[ERROR]', ...args);
  },
};

// パフォーマンス監視ユーティリティ
export const performance = {
  mark: (name: string) => {
    if (config.development.enablePerformanceMonitoring && window.performance) {
      window.performance.mark(name);
    }
  },
  measure: (name: string, startMark: string, endMark: string) => {
    if (config.development.enablePerformanceMonitoring && window.performance) {
      window.performance.measure(name, startMark, endMark);
      const measure = window.performance.getEntriesByName(name)[0];
      logger.debug(`Performance [${name}]: ${measure.duration.toFixed(2)}ms`);
    }
  },
};