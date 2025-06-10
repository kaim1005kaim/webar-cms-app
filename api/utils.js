const fs = require('fs').promises;
const path = require('path');

// 統一されたファイル操作ユーティリティ
class DataManager {
  constructor() {
    this.MODELS_FILE = path.join(__dirname, '..', 'models.json');
    this.PROJECTS_FILE = path.join(__dirname, '..', 'keyholder-projects.json');
  }

  async readModels() {
    try {
      const data = await fs.readFile(this.MODELS_FILE, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading models file:', error);
      return { models: [] };
    }
  }

  async writeModels(data) {
    try {
      await fs.writeFile(this.MODELS_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error writing models file:', error);
      throw error;
    }
  }

  async readProjects() {
    try {
      const data = await fs.readFile(this.PROJECTS_FILE, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading projects file:', error);
      return { projects: [], markers: [] };
    }
  }

  async writeProjects(data) {
    try {
      await fs.writeFile(this.PROJECTS_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error writing projects file:', error);
      throw error;
    }
  }
}

// 統一されたAPIレスポンス
class APIResponse {
  static success(data, message = 'Success') {
    return {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    };
  }

  static error(code, message, details = null) {
    return {
      success: false,
      error: {
        code,
        message,
        details
      },
      timestamp: new Date().toISOString()
    };
  }
}

// 統一されたエラーハンドリング
class APIError extends Error {
  constructor(code, message, statusCode = 500, details = null) {
    super(message);
    this.name = 'APIError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

// バリデーション関数
const validators = {
  project: (data) => {
    const required = ['name'];
    const missing = required.filter(field => !data[field]);
    
    if (missing.length > 0) {
      throw new APIError(
        'VALIDATION_ERROR',
        `Missing required fields: ${missing.join(', ')}`,
        400,
        { missingFields: missing }
      );
    }

    // 名前の長さチェック
    if (data.name && data.name.length > 100) {
      throw new APIError(
        'VALIDATION_ERROR',
        'Project name must be 100 characters or less',
        400
      );
    }

    return true;
  },

  model: (data) => {
    const required = ['title', 'model_url'];
    const missing = required.filter(field => !data[field]);
    
    if (missing.length > 0) {
      throw new APIError(
        'VALIDATION_ERROR',
        `Missing required fields: ${missing.join(', ')}`,
        400,
        { missingFields: missing }
      );
    }

    // URLの簡易バリデーション
    if (data.model_url && !data.model_url.match(/^https?:\/\/.+/)) {
      throw new APIError(
        'VALIDATION_ERROR',
        'model_url must be a valid HTTP/HTTPS URL',
        400
      );
    }

    return true;
  }
};

// 統一されたエラーハンドラーミドルウェア
function errorHandler(err, req, res, next) {
  console.error('API Error:', err);

  if (err instanceof APIError) {
    return res.status(err.statusCode).json(
      APIResponse.error(err.code, err.message, err.details)
    );
  }

  // 予期しないエラー
  return res.status(500).json(
    APIResponse.error(
      'INTERNAL_ERROR',
      'Internal server error',
      process.env.NODE_ENV === 'development' ? err.stack : null
    )
  );
}

// 非同期エラーキャッチャー
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  DataManager,
  APIResponse,
  APIError,
  validators,
  errorHandler,
  asyncHandler
};