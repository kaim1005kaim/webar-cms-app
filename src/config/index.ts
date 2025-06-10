// Enhanced configuration management for WebAR application

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
    // New: Resolution settings for different devices
    resolution: {
      standard: ResolutionConfig;
      ios: ResolutionConfig;
    };
  };
  webgpu: {
    fallbackToWebGL: boolean;
    preferredFormat: string;
    antialias: boolean;
    powerPreference: 'low-power' | 'high-performance';
  };
  positioning: {
    defaultPosition: { x: number; y: number; z: number };
    adjustmentStep: number;
    fineAdjustmentStep: number;
    presets: {
      center: { x: number; y: number; z: number };
      elevated: { x: number; y: number; z: number };
      forward: { x: number; y: number; z: number };
    };
  };
  cache: {
    models: number; // seconds
    markers: number; // seconds
  };
  development: {
    enableLogs: boolean;
    enablePerformanceMonitoring: boolean;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
  };
}

interface ResolutionConfig {
  sourceWidth: number;
  sourceHeight: number;
  displayWidth: number;
  displayHeight: number;
  maxDetectionRate: number;
  canvasWidth: number;
  canvasHeight: number;
}

// Enhanced environment configurations
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
    resolution: {
      standard: {
        sourceWidth: 1280,
        sourceHeight: 720,
        displayWidth: 1280,
        displayHeight: 720,
        maxDetectionRate: 30,
        canvasWidth: 1280,
        canvasHeight: 720,
      },
      ios: {
        sourceWidth: 960,
        sourceHeight: 640,
        displayWidth: 960,
        displayHeight: 640,
        maxDetectionRate: 25,
        canvasWidth: 960,
        canvasHeight: 640,
      },
    },
  },
  webgpu: {
    fallbackToWebGL: true,
    preferredFormat: 'bgra8unorm',
    antialias: true,
    powerPreference: 'high-performance',
  },
  positioning: {
    defaultPosition: { x: 0, y: 0, z: 0 },
    adjustmentStep: 0.1,
    fineAdjustmentStep: 0.01,
    presets: {
      center: { x: 0, y: 0, z: 0 },
      elevated: { x: 0, y: 0.1, z: 0 },
      forward: { x: 0, y: 0, z: 0.1 },
    },
  },
  cache: {
    models: 3600, // 1 hour
    markers: 86400, // 1 day
  },
  development: {
    enableLogs: true,
    enablePerformanceMonitoring: true,
    logLevel: 'debug',
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
    logLevel: 'error',
  },
};

// Environment detection with fallback
const isProduction = typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'production';
const isDevelopment = !isProduction;

export const config: AppConfig = isProduction ? productionConfig : developmentConfig;

export const ENV = {
  isDevelopment,
  isProduction,
  nodeEnv: process.env.NODE_ENV || 'development',
} as const;

// Enhanced logging utility with levels
export const logger = {
  debug: (msg: string, ...args: any[]) => {
    if (config.development.enableLogs && config.development.logLevel === 'debug') {
      console.debug(`[DEBUG] ${msg}`, ...args);
    }
  },
  info: (msg: string, ...args: any[]) => {
    if (config.development.enableLogs && ['debug', 'info'].includes(config.development.logLevel)) {
      console.log(`[INFO] ${msg}`, ...args);
    }
  },
  warn: (msg: string, ...args: any[]) => {
    if (config.development.enableLogs && ['debug', 'info', 'warn'].includes(config.development.logLevel)) {
      console.warn(`[WARN] ${msg}`, ...args);
    }
  },
  error: (msg: string, ...args: any[]) => {
    if (config.development.enableLogs) {
      console.error(`[ERROR] ${msg}`, ...args);
    }
  },
};

// Enhanced performance monitoring utility
export const performance = {
  mark: (name: string) => {
    if (config.development.enablePerformanceMonitoring && window.performance) {
      window.performance.mark(name);
    }
  },
  measure: (name: string, startMark: string, endMark: string) => {
    if (config.development.enablePerformanceMonitoring && window.performance) {
      try {
        window.performance.measure(name, startMark, endMark);
        const measure = window.performance.getEntriesByName(name)[0];
        logger.debug(`Performance [${name}]: ${measure.duration.toFixed(2)}ms`);
      } catch (error) {
        logger.warn(`Performance measurement failed: ${name}`, error);
      }
    }
  },
  now: () => window.performance.now(),
};

// Device detection utilities
export const device = {
  isIOS: () => /iPad|iPhone|iPod/.test(navigator.userAgent),
  isSafari: () => /^((?!chrome|android).)*safari/i.test(navigator.userAgent),
  isIOSSafari: () => device.isIOS() && device.isSafari(),
  isWebGPUSupported: () => !!navigator.gpu,
  getPixelRatio: () => window.devicePixelRatio || 1,
  
  getDeviceInfo: () => ({
    userAgent: navigator.userAgent,
    isIOS: device.isIOS(),
    isSafari: device.isSafari(),
    webGPU: device.isWebGPUSupported(),
    pixelRatio: device.getPixelRatio(),
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight
  })
};

// Application state management
export class AppState {
  private state: Map<string, any> = new Map();
  private listeners: Map<string, Function[]> = new Map();

  set<T>(key: string, value: T): void {
    const oldValue = this.state.get(key);
    this.state.set(key, value);
    
    if (oldValue !== value) {
      this.notify(key, value, oldValue);
    }
  }

  get<T>(key: string): T | undefined {
    return this.state.get(key);
  }

  subscribe(key: string, callback: Function): () => void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, []);
    }
    this.listeners.get(key)!.push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(key);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  private notify(key: string, newValue: any, oldValue: any): void {
    const callbacks = this.listeners.get(key);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(newValue, oldValue);
        } catch (error) {
          logger.error(`State change callback error for key "${key}":`, error);
        }
      });
    }
  }
}

export const appState = new AppState();