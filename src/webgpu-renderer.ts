export class WebGPURenderer {
  protected device: GPUDevice | null = null;
  protected context: GPUCanvasContext | null = null;
  protected format: GPUTextureFormat = 'bgra8unorm';
  private canvas: HTMLCanvasElement;
  private isSupported: boolean = false;
  private depthTexture: GPUTexture | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }

  async initialize(): Promise<boolean> {
    if (!navigator.gpu) {
      console.warn('WebGPU is not supported in this browser');
      return false;
    }

    try {
      const adapter = await navigator.gpu.requestAdapter();
      if (!adapter) {
        console.warn('No appropriate GPUAdapter found');
        return false;
      }

      this.device = await adapter.requestDevice();
      this.context = this.canvas.getContext('webgpu') as GPUCanvasContext;
      
      if (!this.context) {
        console.warn('Failed to get WebGPU context');
        return false;
      }

      this.format = navigator.gpu.getPreferredCanvasFormat();
      this.context.configure({
        device: this.device,
        format: this.format,
        alphaMode: 'premultiplied',
      });
      
      // 深度テクスチャを作成
      this.createDepthTexture();

      this.isSupported = true;
      return true;
    } catch (error) {
      console.error('WebGPU initialization failed:', error);
      return false;
    }
  }

  createBuffer(data: Float32Array | Uint16Array, usage: GPUBufferUsageFlags): GPUBuffer | null {
    if (!this.device) return null;

    const buffer = this.device.createBuffer({
      size: data.byteLength,
      usage,
      mappedAtCreation: true,
    });

    const mappedRange = buffer.getMappedRange();
    if (data instanceof Float32Array) {
      new Float32Array(mappedRange).set(data);
    } else {
      new Uint16Array(mappedRange).set(data);
    }
    buffer.unmap();

    return buffer;
  }

  createShaderModule(code: string): GPUShaderModule | null {
    if (!this.device) return null;

    return this.device.createShaderModule({
      code,
    });
  }

  private createDepthTexture(): void {
    if (!this.device) return;
    
    this.depthTexture = this.device.createTexture({
      size: [this.canvas.width, this.canvas.height],
      format: 'depth24plus',
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });
  }
  
  beginRenderPass(): GPURenderPassEncoder | null {
    if (!this.device || !this.context) return null;

    const commandEncoder = this.device.createCommandEncoder();
    const textureView = this.context.getCurrentTexture().createView();

    const renderPassDescriptor: GPURenderPassDescriptor = {
      colorAttachments: [
        {
          view: textureView,
          clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 0.0 }, // 透明に設定
          loadOp: 'clear',
          storeOp: 'store',
        },
      ],
      depthStencilAttachment: {
        view: this.depthTexture!.createView(),
        depthClearValue: 1.0,
        depthLoadOp: 'clear',
        depthStoreOp: 'store',
      },
    };

    return commandEncoder.beginRenderPass(renderPassDescriptor);
  }

  get supported(): boolean {
    return this.isSupported;
  }

  get gpuDevice(): GPUDevice | null {
    return this.device;
  }
  
  onResize(width: number, height: number): void {
    if (!this.context || !this.device) return;
    
    this.canvas.width = width;
    this.canvas.height = height;
    
    // 深度テクスチャを再作成
    if (this.depthTexture) {
      this.depthTexture.destroy();
    }
    this.createDepthTexture();
  }
}

export const vertexShaderCode = `
struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) color: vec3<f32>,
};

@vertex
fn main(
  @location(0) position: vec3<f32>,
  @location(1) color: vec3<f32>
) -> VertexOutput {
  var output: VertexOutput;
  output.position = vec4<f32>(position, 1.0);
  output.color = color;
  return output;
}
`;

export const fragmentShaderCode = `
@fragment
fn main(@location(0) color: vec3<f32>) -> @location(0) vec4<f32> {
  return vec4<f32>(color, 1.0);
}
`;