const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

// マーカー画像保存用のディレクトリ
const MARKERS_DIR = process.env.LAMBDA_TASK_ROOT 
  ? path.join(process.env.LAMBDA_TASK_ROOT, 'markers')
  : path.join(__dirname, '../../public/markers');

async function ensureMarkersDir() {
  try {
    await fs.access(MARKERS_DIR);
  } catch (error) {
    // ディレクトリが存在しない場合は作成
    await fs.mkdir(MARKERS_DIR, { recursive: true });
  }
}

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    console.log('Upload request received');
    
    // Content-Typeがmultipart/form-dataかapplication/jsonかチェック
    const contentType = event.headers['content-type'] || event.headers['Content-Type'] || '';
    
    if (contentType.includes('application/json')) {
      // JSON形式でBase64データを受信
      const body = JSON.parse(event.body);
      const { fileName, fileData, projectName } = body;
      
      if (!fileName || !fileData) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'fileName and fileData are required' }),
        };
      }

      // Base64データをデコード
      const base64Data = fileData.replace(/^data:image\/[a-z]+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      
      // ファイル名を安全化
      const fileExtension = path.extname(fileName);
      const baseName = (projectName || 'marker').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      const timestamp = Date.now();
      const uniqueFileName = `${baseName}_${timestamp}${fileExtension}`;
      
      // マーカーディレクトリの確保
      await ensureMarkersDir();
      
      // ファイル保存
      const filePath = path.join(MARKERS_DIR, uniqueFileName);
      await fs.writeFile(filePath, buffer);
      
      // 公開URL生成
      const publicUrl = `/markers/${uniqueFileName}`;
      
      console.log(`Marker image saved: ${uniqueFileName}`);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          fileName: uniqueFileName,
          url: publicUrl,
          message: 'Marker image uploaded successfully'
        }),
      };
    } else {
      // 現在のところJSON形式のみサポート
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Only JSON format with base64 data is supported' 
        }),
      };
    }

  } catch (error) {
    console.error('Upload error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Upload failed', 
        details: error.message 
      }),
    };
  }
};