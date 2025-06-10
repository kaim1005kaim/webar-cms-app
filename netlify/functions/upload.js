// Netlify Functionsでは書き込み可能ディレクトリが限られているため、
// Base64データを処理してプロジェクトデータに含める方式を採用

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
    
    // JSON形式でBase64データを受信
    const body = JSON.parse(event.body || '{}');
    const { fileName, fileData, projectName } = body;
    
    if (!fileName || !fileData) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'fileName and fileData are required' }),
      };
    }

    // Base64データの検証
    if (!fileData.startsWith('data:image/')) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid image data format' }),
      };
    }
    
    // ファイル名を安全化
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substr(2, 9);
    const baseName = (projectName || 'marker').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const fileExtension = fileName.split('.').pop() || 'png';
    const uniqueFileName = `${baseName}_${timestamp}_${randomId}.${fileExtension}`;
    
    // Netlify Functionsでは物理ファイルを保存できないため、
    // Base64データをそのまま返して、プロジェクトデータに含める
    const virtualUrl = `data:marker/${uniqueFileName}`;
    
    console.log(`Marker image processed: ${uniqueFileName}`);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        fileName: uniqueFileName,
        url: virtualUrl,
        data: fileData, // Base64データを含める
        message: 'Marker image processed successfully'
      }),
    };

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