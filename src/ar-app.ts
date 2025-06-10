import { ARWebGPURenderer } from './ar-webgpu-renderer.js';

export class ARKeyholderApp {
    private arWebGPURenderer: ARWebGPURenderer | null = null;
    private arScene: any = null;
    private trackingAnchor: any = null;
    private isTracking: boolean = false;
    
    constructor() {
        this.init();
    }
    
    async init(): Promise<void> {
        await this.initWebGPU();
        this.initARTracking();
        this.startRenderLoop();
    }
    
    private async initWebGPU(): Promise<void> {
        const canvas = document.getElementById('webgpu-canvas') as HTMLCanvasElement;
        if (!canvas) {
            console.error('WebGPU canvas not found');
            return;
        }
        
        this.arWebGPURenderer = new ARWebGPURenderer(canvas);
        const supported = await this.arWebGPURenderer.initialize();
        
        if (!supported) {
            console.warn('WebGPU not supported, falling back to WebGL');
            this.initWebGLFallback();
        }
    }
    
    private initWebGLFallback(): void {
        // WebGPU非対応時のThree.js フォールバック
        console.log('Initializing WebGL fallback...');
        // 既存のThree.js実装を使用
    }
    
    private initARTracking(): void {
        // AR.jsとの連携初期化
        this.arScene = document.querySelector('a-scene');
        this.trackingAnchor = document.querySelector('#nft-marker');
        
        if (this.trackingAnchor) {
            this.trackingAnchor.addEventListener('markerFound', () => {
                this.isTracking = true;
                this.onMarkerFound();
            });
            
            this.trackingAnchor.addEventListener('markerLost', () => {
                this.isTracking = false;
                this.onMarkerLost();
            });
        }
    }
    
    private onMarkerFound(): void {
        console.log('AR Marker found - starting WebGPU rendering');
        // WebGPU高精細レンダリング開始
    }
    
    private onMarkerLost(): void {
        console.log('AR Marker lost - pausing WebGPU rendering');
        // WebGPUレンダリング一時停止
    }
    
    private startRenderLoop(): void {
        const render = () => {
            if (this.isTracking && this.arWebGPURenderer) {
                this.updateARMatrix();
                this.arWebGPURenderer.renderARModel(new ArrayBuffer(0)); // 実際のモデルデータを渡す
            }
            requestAnimationFrame(render);
        };
        render();
    }
    
    private updateARMatrix(): void {
        if (!this.trackingAnchor || !this.arWebGPURenderer) return;
        
        // AR.jsからマトリックスを取得してWebGPUに渡す
        const arMatrix = this.trackingAnchor.object3D?.matrixWorld?.elements;
        if (arMatrix) {
            this.arWebGPURenderer.updateARMatrix(arMatrix);
        }
    }
    
    async loadCharacterModel(modelUrl: string): Promise<void> {
        try {
            const response = await fetch(modelUrl);
            const modelData = await response.arrayBuffer();
            
            if (this.arWebGPURenderer) {
                await this.arWebGPURenderer.renderARModel(modelData);
            }
        } catch (error) {
            console.error('Failed to load character model:', error);
        }
    }
}

// グローバルに公開
(window as any).ARKeyholderApp = ARKeyholderApp;