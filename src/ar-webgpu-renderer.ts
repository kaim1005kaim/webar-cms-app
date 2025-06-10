import { WebGPURenderer } from './webgpu-renderer.js';
import type { ARTrackingState } from './types/index.js';

// 簡易ログガーとパフォーマンスユーティリティ
const logger = {
  info: (msg: string, ...args: any[]) => console.log(`[INFO] ${msg}`, ...args),
  warn: (msg: string, ...args: any[]) => console.warn(`[WARN] ${msg}`, ...args),
  error: (msg: string, ...args: any[]) => console.error(`[ERROR] ${msg}`, ...args),
  debug: (msg: string, ...args: any[]) => console.debug(`[DEBUG] ${msg}`, ...args),
};

const performance = {
  mark: (name: string) => window.performance.mark(name),
  measure: (name: string, start: string, end: string) => window.performance.measure(name, start, end),
};

export class ARWebGPURenderer extends WebGPURenderer {
    private arMatrix: Float32Array = new Float32Array(16);
    private projectionMatrix: Float32Array = new Float32Array(16);
    private modelMatrix: Float32Array = new Float32Array(16);
    private uniformBuffer: GPUBuffer | null = null;
    private pipeline: GPURenderPipeline | null = null;
    private isInitialized: boolean = false;
    
    constructor(canvas: HTMLCanvasElement) {
        super(canvas);
        this.initializeARMatrices();
    }
    
    async initialize(): Promise<boolean> {
        performance.mark('ar-webgpu-init-start');
        
        const success = await super.initialize();
        if (!success) {
            logger.warn('WebGPU initialization failed, falling back to WebGL');
            return false;
        }
        
        try {
            await this.initializeARResources();
            this.isInitialized = true;
            
            performance.mark('ar-webgpu-init-end');
            performance.measure('ar-webgpu-init', 'ar-webgpu-init-start', 'ar-webgpu-init-end');
            
            logger.info('AR WebGPU renderer initialized successfully');
            return true;
        } catch (error) {
            logger.error('AR WebGPU renderer initialization failed:', error);
            return false;
        }
    }
    
    private async initializeARResources(): Promise<void> {
        if (!this.device) throw new Error('WebGPU device not available');
        
        // ユニフォームバッファの作成
        this.uniformBuffer = this.device.createBuffer({
            size: 256, // 4x4 matrices (3) + light params
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        
        // レンダリングパイプラインの作成
        this.pipeline = this.createAdvancedMaterial();
        
        if (!this.pipeline) {
            throw new Error('Failed to create WebGPU pipeline');
        }
    }
    
    private initializeARMatrices(): void {
        // 単位行列で初期化
        this.arMatrix.set([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]);
        
        // 投影行列の初期化（AR用）
        this.projectionMatrix.set([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, -1, -1,
            0, 0, -0.1, 0
        ]);
    }
    
    updateARMatrix(matrix: number[]): void {
        if (matrix.length !== 16) {
            logger.warn('Invalid AR matrix length:', matrix.length);
            return;
        }
        
        this.arMatrix.set(matrix);
        this.updateTransform();
    }
    
    updateTrackingState(state: ARTrackingState): void {
        if (state.isTracking && state.matrix) {
            this.updateARMatrix(Array.from(state.matrix));
        }
    }
    
    private updateTransform(): void {
        // ARマトリックスを使用してモデル変換を更新
        this.modelMatrix.set(this.arMatrix);
        
        // ユニフォームバッファを更新
        if (this.device && this.uniformBuffer) {
            const uniformData = new Float32Array([
                ...this.modelMatrix,      // 16 floats
                ...this.arMatrix,         // 16 floats  
                ...this.projectionMatrix, // 16 floats
                0, 10, 5, 1,             // light position + padding
                0, 0, 10, 1,             // camera position + padding
            ]);
            
            this.device.queue.writeBuffer(this.uniformBuffer, 0, uniformData);
        }
    }
    
    async renderARModel(modelData: ArrayBuffer): Promise<void> {
        if (!this.isInitialized || !this.device || !this.context || !this.pipeline) {
            logger.warn('AR WebGPU renderer not properly initialized');
            return;
        }
        
        performance.mark('ar-render-start');
        
        try {
            const commandEncoder = this.device.createCommandEncoder();
            const renderPass = this.beginRenderPass();
            
            if (renderPass) {
                this.renderWithARTransform(renderPass, modelData);
                renderPass.end();
                
                const commandBuffer = commandEncoder.finish();
                this.device.queue.submit([commandBuffer]);
            }
            
            performance.mark('ar-render-end');
            performance.measure('ar-render', 'ar-render-start', 'ar-render-end');
        } catch (error) {
            logger.error('AR rendering failed:', error);
        }
    }
    
    private renderWithARTransform(renderPass: GPURenderPassEncoder, modelData: ArrayBuffer): void {
        if (!this.pipeline || !this.uniformBuffer) return;
        
        // パイプラインとユニフォームバッファをバインド
        renderPass.setPipeline(this.pipeline);
        
        // キーホルダーモデルをレンダリング
        this.renderKeyholderModel(renderPass);
    }
    
    private renderKeyholderModel(renderPass: GPURenderPassEncoder): void {
        if (!this.device) return;
        
        // キーホルダーモデルのジオメトリを作成
        const keyholderGeometry = this.createKeyholderGeometry();
        if (!keyholderGeometry) return;
        
        // バインドグループを設定
        const bindGroup = this.device.createBindGroup({
            layout: this.pipeline!.getBindGroupLayout(0),
            entries: [{
                binding: 0,
                resource: { buffer: this.uniformBuffer! }
            }]
        });
        
        renderPass.setBindGroup(0, bindGroup);
        renderPass.setVertexBuffer(0, keyholderGeometry.vertexBuffer);
        renderPass.setIndexBuffer(keyholderGeometry.indexBuffer, 'uint16');
        renderPass.drawIndexed(keyholderGeometry.indexCount);
    }
    
    private createKeyholderGeometry(): { vertexBuffer: GPUBuffer, indexBuffer: GPUBuffer, indexCount: number } | null {
        if (!this.device) return null;
        
        // キーホルダーモデルの頂点データ（簡易版）
        const vertices = new Float32Array([
            // メインボディ (ボックス)
            -0.25, -0.35, -0.1,  0, 0, -1,  0, 0, // 前面
             0.25, -0.35, -0.1,  0, 0, -1,  1, 0,
             0.25,  0.35, -0.1,  0, 0, -1,  1, 1,
            -0.25,  0.35, -0.1,  0, 0, -1,  0, 1,
            
            -0.25, -0.35,  0.1,  0, 0,  1,  0, 0, // 背面
             0.25, -0.35,  0.1,  0, 0,  1,  1, 0,
             0.25,  0.35,  0.1,  0, 0,  1,  1, 1,
            -0.25,  0.35,  0.1,  0, 0,  1,  0, 1,
            
            // リング部分 (簡易化)
             0,  0.5, 0,  0, 1, 0,  0.5, 0.5,
        ]);
        
        const indices = new Uint16Array([
            0, 1, 2,  0, 2, 3, // 前面
            4, 6, 5,  4, 7, 6, // 背面
            0, 4, 5,  0, 5, 1, // 下面
            2, 6, 7,  2, 7, 3, // 上面
            0, 3, 7,  0, 7, 4, // 左面
            1, 5, 6,  1, 6, 2, // 右面
        ]);
        
        const vertexBuffer = this.createBuffer(vertices, GPUBufferUsage.VERTEX);
        const indexBuffer = this.createBuffer(indices, GPUBufferUsage.INDEX);
        
        if (!vertexBuffer || !indexBuffer) return null;
        
        return {
            vertexBuffer,
            indexBuffer,
            indexCount: indices.length
        };
    }
    
    // メソッドを削除（createKeyholderGeometryに統合）
    
    createAdvancedMaterial(): GPURenderPipeline | null {
        if (!this.device) return null;
        
        const shaderModule = this.device.createShaderModule({
            code: `
                struct Uniforms {
                    modelMatrix: mat4x4<f32>,
                    viewMatrix: mat4x4<f32>,
                    projectionMatrix: mat4x4<f32>,
                    lightPosition: vec3<f32>,
                    cameraPosition: vec3<f32>,
                }
                
                @group(0) @binding(0) var<uniform> uniforms: Uniforms;
                
                struct VertexInput {
                    @location(0) position: vec3<f32>,
                    @location(1) normal: vec3<f32>,
                    @location(2) uv: vec2<f32>,
                }
                
                struct VertexOutput {
                    @builtin(position) clipPosition: vec4<f32>,
                    @location(0) worldPosition: vec3<f32>,
                    @location(1) normal: vec3<f32>,
                    @location(2) uv: vec2<f32>,
                }
                
                @vertex
                fn vertexMain(input: VertexInput) -> VertexOutput {
                    var output: VertexOutput;
                    let worldPosition = uniforms.modelMatrix * vec4<f32>(input.position, 1.0);
                    output.clipPosition = uniforms.projectionMatrix * uniforms.viewMatrix * worldPosition;
                    output.worldPosition = worldPosition.xyz;
                    output.normal = normalize((uniforms.modelMatrix * vec4<f32>(input.normal, 0.0)).xyz);
                    output.uv = input.uv;
                    return output;
                }
                
                @fragment
                fn fragmentMain(input: VertexOutput) -> @location(0) vec4<f32> {
                    // 高品質キーホルダーレンダリング
                    let lightDir = normalize(uniforms.lightPosition - input.worldPosition);
                    let viewDir = normalize(uniforms.cameraPosition - input.worldPosition);
                    let normal = normalize(input.normal);
                    
                    // メタリックフィニッシュ
                    let NdotL = max(dot(normal, lightDir), 0.0);
                    let baseColor = vec3<f32>(0.9, 0.1, 0.3); // 鰮やかな赤
                    let metallic = 0.8;
                    let roughness = 0.2;
                    
                    // 簡易スペキュラーリフレクション
                    let halfVector = normalize(lightDir + viewDir);
                    let NdotH = max(dot(normal, halfVector), 0.0);
                    let specular = pow(NdotH, (1.0 - roughness) * 128.0) * metallic;
                    
                    let ambient = vec3<f32>(0.1, 0.1, 0.15);
                    let diffuse = baseColor * NdotL * (1.0 - metallic);
                    let specularHighlight = vec3<f32>(1.0, 1.0, 1.0) * specular;
                    
                    return vec4<f32>(ambient + diffuse + specularHighlight, 1.0);
                }
            `
        });
        
        return this.device.createRenderPipeline({
            layout: 'auto',
            vertex: {
                module: shaderModule,
                entryPoint: 'vertexMain',
                buffers: [{
                    arrayStride: 32, // position(12) + normal(12) + uv(8)
                    attributes: [
                        { format: 'float32x3', offset: 0, shaderLocation: 0 },
                        { format: 'float32x3', offset: 12, shaderLocation: 1 },
                        { format: 'float32x2', offset: 24, shaderLocation: 2 },
                    ]
                }]
            },
            fragment: {
                module: shaderModule,
                entryPoint: 'fragmentMain',
                targets: [{ format: this.format }]
            },
            primitive: {
                topology: 'triangle-list',
                cullMode: 'back',
            },
            depthStencil: {
                depthWriteEnabled: true,
                depthCompare: 'less',
                format: 'depth24plus',
            }
        });
    }
}