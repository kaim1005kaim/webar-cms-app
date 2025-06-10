const express = require('express');
const cors = require('cors');
const { DataManager, APIResponse, APIError, validators, errorHandler, asyncHandler } = require('./utils');

const app = express();
const PORT = process.env.PORT || 3001;
const dataManager = new DataManager();

// ミドルウェア
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://webar-cms-app.netlify.app'] 
    : true,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// リクエストログ
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// ヘルスチェック
app.get('/health', (req, res) => {
  res.json(APIResponse.success({ status: 'healthy', timestamp: new Date().toISOString() }));
});

// Models API
app.get('/api/models', asyncHandler(async (req, res) => {
  const data = await dataManager.readModels();
  res.json(APIResponse.success(data.models, 'Models retrieved successfully'));
}));

app.get('/api/models/:id', asyncHandler(async (req, res) => {
  const data = await dataManager.readModels();
  const model = data.models.find(m => m.id === req.params.id);
  
  if (!model) {
    throw new APIError('MODEL_NOT_FOUND', 'Model not found', 404);
  }
  
  res.json(APIResponse.success(model, 'Model retrieved successfully'));
}));

app.post('/api/models', asyncHandler(async (req, res) => {
  validators.model(req.body);
  
  const data = await dataManager.readModels();
  const newModel = {
    id: `model${Date.now()}`,
    title: req.body.title,
    description: req.body.description || '',
    model_url: req.body.model_url,
    thumbnail_url: req.body.thumbnail_url || '',
    created_at: new Date().toISOString()
  };
  
  data.models.push(newModel);
  await dataManager.writeModels(data);
  
  res.status(201).json(APIResponse.success(newModel, 'Model created successfully'));
}));

app.put('/api/models/:id', asyncHandler(async (req, res) => {
  const data = await dataManager.readModels();
  const modelIndex = data.models.findIndex(m => m.id === req.params.id);
  
  if (modelIndex === -1) {
    throw new APIError('MODEL_NOT_FOUND', 'Model not found', 404);
  }
  
  // 部分的な更新をバリデーション
  if (req.body.title !== undefined || req.body.model_url !== undefined) {
    validators.model({ ...data.models[modelIndex], ...req.body });
  }
  
  data.models[modelIndex] = {
    ...data.models[modelIndex],
    ...req.body,
    id: req.params.id,
    created_at: data.models[modelIndex].created_at,
    updated_at: new Date().toISOString()
  };
  
  await dataManager.writeModels(data);
  res.json(APIResponse.success(data.models[modelIndex], 'Model updated successfully'));
}));

app.delete('/api/models/:id', asyncHandler(async (req, res) => {
  const data = await dataManager.readModels();
  const modelIndex = data.models.findIndex(m => m.id === req.params.id);
  
  if (modelIndex === -1) {
    throw new APIError('MODEL_NOT_FOUND', 'Model not found', 404);
  }
  
  data.models.splice(modelIndex, 1);
  await dataManager.writeModels(data);
  
  res.json(APIResponse.success(null, 'Model deleted successfully'));
}));

// Projects API
app.get('/api/projects', asyncHandler(async (req, res) => {
  const data = await dataManager.readProjects();
  res.json(APIResponse.success(data.projects, 'Projects retrieved successfully'));
}));

app.get('/api/projects/:id', asyncHandler(async (req, res) => {
  const data = await dataManager.readProjects();
  const project = data.projects.find(p => p.id === req.params.id);
  
  if (!project) {
    throw new APIError('PROJECT_NOT_FOUND', 'Project not found', 404);
  }
  
  res.json(APIResponse.success(project, 'Project retrieved successfully'));
}));

app.post('/api/projects', asyncHandler(async (req, res) => {
  validators.project(req.body);
  
  const data = await dataManager.readProjects();
  const newProject = {
    id: req.body.id || `project_${Date.now()}`,
    name: req.body.name,
    creator: req.body.creator || { userId: 'anonymous', name: 'Anonymous' },
    marker: {
      imageUrl: req.body.marker?.imageUrl || './placeholder.svg',
      nftDescriptor: req.body.marker?.nftDescriptor || `./markers/${req.body.name?.replace(/\s+/g, '_').toLowerCase()}`,
      printTemplate: req.body.marker?.printTemplate || 'A4'
    },
    character: {
      modelUrl: req.body.character?.modelUrl || 'keyholder-default',
      scale: req.body.character?.scale || 1.0,
      position: req.body.character?.position || [0, 0.5, 0],
      animations: req.body.character?.animations || ['rotation']
    },
    metadata: {
      description: req.body.metadata?.description || '',
      tags: req.body.metadata?.tags || [],
      isPublic: req.body.metadata?.isPublic !== false
    },
    created_at: req.body.created_at || new Date().toISOString()
  };
  
  data.projects.push(newProject);
  await dataManager.writeProjects(data);
  
  res.status(201).json(APIResponse.success(newProject, 'Enhanced project created successfully'));
}));

app.put('/api/projects/:id', asyncHandler(async (req, res) => {
  const data = await dataManager.readProjects();
  const projectIndex = data.projects.findIndex(p => p.id === req.params.id);
  
  if (projectIndex === -1) {
    throw new APIError('PROJECT_NOT_FOUND', 'Project not found', 404);
  }
  
  // 部分的な更新をバリデーション
  if (req.body.name !== undefined) {
    validators.project({ ...data.projects[projectIndex], ...req.body });
  }
  
  data.projects[projectIndex] = {
    ...data.projects[projectIndex],
    ...req.body,
    id: req.params.id,
    created_at: data.projects[projectIndex].created_at,
    updated_at: new Date().toISOString()
  };
  
  await dataManager.writeProjects(data);
  res.json(APIResponse.success(data.projects[projectIndex], 'Project updated successfully'));
}));

app.delete('/api/projects/:id', asyncHandler(async (req, res) => {
  const data = await dataManager.readProjects();
  const projectIndex = data.projects.findIndex(p => p.id === req.params.id);
  
  if (projectIndex === -1) {
    throw new APIError('PROJECT_NOT_FOUND', 'Project not found', 404);
  }
  
  data.projects.splice(projectIndex, 1);
  await dataManager.writeProjects(data);
  
  res.json(APIResponse.success(null, 'Project deleted successfully'));
}));

// Markers API
app.get('/api/markers', asyncHandler(async (req, res) => {
  const data = await dataManager.readProjects();
  res.json(APIResponse.success(data.markers, 'Markers retrieved successfully'));
}));

app.get('/api/markers/:projectId', asyncHandler(async (req, res) => {
  const data = await dataManager.readProjects();
  const markers = data.markers.filter(m => m.projectId === req.params.projectId);
  res.json(APIResponse.success(markers, 'Project markers retrieved successfully'));
}));

// 404ハンドラー
app.use('*', (req, res) => {
  res.status(404).json(APIResponse.error('NOT_FOUND', `Route ${req.originalUrl} not found`));
});

// エラーハンドラー
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 CMS API server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});