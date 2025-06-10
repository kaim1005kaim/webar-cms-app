import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ARKeyholderApp } from './ar-app.js';
import { WebGPURenderer } from './webgpu-renderer.js';

interface Model {
  id: string;
  title: string;
  description: string;
  model_url: string;
  thumbnail_url: string;
  created_at: string;
}

interface ARMatrix {
  elements: number[];
}

class EnhancedWebARApp {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer | null = null;
  private controls: OrbitControls | null = null;
  private loader: GLTFLoader;
  private currentModel: THREE.Object3D | null = null;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private arKeyholderApp: ARKeyholderApp | null = null;
  private webgpuRenderer: WebGPURenderer | null = null;
  private isARMode: boolean = false;
  private markerMatrix: Float32Array = new Float32Array(16);

  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    
    this.loader = new GLTFLoader();
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    
    this.init();
  }

  private async init(): Promise<void> {
    await this.initializeRenderers();
    this.setupScene();
    this.setupEventListeners();
    this.loadModelsFromAPI();
    this.animate();
  }
  
  private async initializeRenderers(): Promise<void> {
    // WebGPU初期化を試行
    const webgpuCanvas = document.getElementById('webgpu-canvas') as HTMLCanvasElement;
    if (webgpuCanvas && navigator.gpu) {
      try {
        this.webgpuRenderer = new WebGPURenderer(webgpuCanvas);
        const webgpuSupported = await this.webgpuRenderer.initialize();
        
        if (webgpuSupported) {
          console.log('WebGPU レンダラーを初期化しました');
          this.arKeyholderApp = new ARKeyholderApp();
          return;
        }
      } catch (error) {
        console.warn('WebGPU初期化に失敗、WebGLにフォールバック:', error);
      }
    }
    
    // WebGLフォールバック
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    if (canvas) {
      this.renderer = new THREE.WebGLRenderer({ 
        canvas, 
        antialias: true,
        alpha: true 
      });
      
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.setPixelRatio(window.devicePixelRatio);
      this.renderer.shadowMap.enabled = true;
      
      this.controls = new OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
    }
  }

  private setupScene(): void {
    this.scene.background = new THREE.Color(0x222222);
    this.scene.fog = new THREE.Fog(0x222222, 10, 50);
    
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -10;
    directionalLight.shadow.camera.right = 10;
    directionalLight.shadow.camera.top = 10;
    directionalLight.shadow.camera.bottom = -10;
    this.scene.add(directionalLight);
    
    const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x333333);
    this.scene.add(gridHelper);
    
    this.camera.position.set(5, 5, 5);
    this.camera.lookAt(0, 0, 0);
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', () => this.onWindowResize());
    this.renderer.domElement.addEventListener('click', (event) => this.onMouseClick(event));
    this.renderer.domElement.addEventListener('mousemove', (event) => this.onMouseMove(event));
  }

  private onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private onMouseMove(event: MouseEvent): void {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  }

  private onMouseClick(event: MouseEvent): void {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    if (this.currentModel) {
      const intersects = this.raycaster.intersectObject(this.currentModel, true);
      
      if (intersects.length > 0) {
        this.playModelAnimation();
      }
    }
  }

  private playModelAnimation(): void {
    if (!this.currentModel) return;
    
    const startRotation = this.currentModel.rotation.y;
    const targetRotation = startRotation + Math.PI * 2;
    const duration = 1000;
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      this.currentModel!.rotation.y = startRotation + (targetRotation - startRotation) * progress;
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    animate();
  }

  private async loadModelsFromAPI(): Promise<void> {
    try {
      const response = await fetch('/api/models');
      const models: Model[] = await response.json();
      
      if (models.length > 0) {
        this.loadModel(models[0]);
      }
      
      document.getElementById('loader')!.style.display = 'none';
    } catch (error) {
      console.error('Failed to load models:', error);
      this.showError('モデルの読み込みに失敗しました');
    }
  }

  private loadModel(model: Model): void {
    const titleEl = document.getElementById('model-title');
    const descEl = document.getElementById('model-description');
    
    if (titleEl) titleEl.textContent = model.title;
    if (descEl) descEl.textContent = model.description;
    
    if (this.currentModel) {
      this.scene.remove(this.currentModel);
    }
    
    this.loader.load(
      model.model_url,
      (gltf) => {
        this.currentModel = gltf.scene;
        this.currentModel.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        
        const box = new THREE.Box3().setFromObject(this.currentModel);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2 / maxDim;
        this.currentModel.scale.multiplyScalar(scale);
        
        this.currentModel.position.sub(center.multiplyScalar(scale));
        this.currentModel.position.y = 0;
        
        this.scene.add(this.currentModel);
      },
      (progress) => {
        console.log('Loading progress:', (progress.loaded / progress.total) * 100 + '%');
      },
      (error) => {
        console.error('Error loading model:', error);
        this.showError('3Dモデルの読み込みに失敗しました');
      }
    );
  }

  private showError(message: string): void {
    const loader = document.getElementById('loader');
    if (loader) {
      loader.innerHTML = `<div class="error">${message}</div>`;
    }
  }

  private animate(): void {
    requestAnimationFrame(() => this.animate());
    
    if (this.controls) {
      this.controls.update();
    }
    
    if (this.renderer && !this.isARMode) {
      this.renderer.render(this.scene, this.camera);
    }
  }
  
  // AR関連のメソッド
  onMarkerFound(matrix: number[]): void {
    this.isARMode = true;
    this.markerMatrix.set(matrix);
    
    if (this.arKeyholderApp) {
      // WebGPU ARレンダリング開始
      console.log('WebGPU ARレンダリング開始');
    }
  }
  
  onMarkerLost(): void {
    this.isARMode = false;
    console.log('ARモード終了');
  }
  
  async loadARModel(modelUrl: string): Promise<void> {
    if (this.arKeyholderApp) {
      await this.arKeyholderApp.loadCharacterModel(modelUrl);
    }
  }
}

// グローバルアクセス用
let webARAppInstance: EnhancedWebARApp | null = null;

window.addEventListener('DOMContentLoaded', () => {
  webARAppInstance = new EnhancedWebARApp();
  
  // HTML側からアクセス可能にする
  (window as any).webARApp = webARAppInstance;
});

export { EnhancedWebARApp };