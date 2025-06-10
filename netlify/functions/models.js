const fs = require('fs').promises;
const path = require('path');

const MODELS_FILE = path.join(__dirname, '../../models.json');

async function readModels() {
  try {
    const data = await fs.readFile(MODELS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading models file:', error);
    return { models: [] };
  }
}

async function writeModels(data) {
  try {
    await fs.writeFile(MODELS_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing models file:', error);
    throw error;
  }
}

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  const path = event.path.replace('/.netlify/functions/', '');
  const segments = path.split('/');
  const modelId = segments[1];

  try {
    switch (event.httpMethod) {
      case 'GET':
        const data = await readModels();
        if (modelId) {
          // GET /api/models/:id
          const model = data.models.find(m => m.id === modelId);
          if (!model) {
            return {
              statusCode: 404,
              headers,
              body: JSON.stringify({ error: 'Model not found' }),
            };
          }
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(model),
          };
        } else {
          // GET /api/models
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(data),
          };
        }

      case 'POST':
        // POST /api/models
        const postData = await readModels();
        const newModel = JSON.parse(event.body);
        newModel.id = `model${Date.now()}`;
        newModel.created_at = new Date().toISOString();
        
        postData.models.push(newModel);
        await writeModels(postData);
        
        return {
          statusCode: 201,
          headers,
          body: JSON.stringify(newModel),
        };

      case 'PUT':
        // PUT /api/models/:id
        if (!modelId) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Model ID is required' }),
          };
        }
        
        const putData = await readModels();
        const modelIndex = putData.models.findIndex(m => m.id === modelId);
        
        if (modelIndex === -1) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: 'Model not found' }),
          };
        }
        
        const updateData = JSON.parse(event.body);
        putData.models[modelIndex] = {
          ...putData.models[modelIndex],
          ...updateData,
          id: modelId,
          created_at: putData.models[modelIndex].created_at,
        };
        
        await writeModels(putData);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(putData.models[modelIndex]),
        };

      case 'DELETE':
        // DELETE /api/models/:id
        if (!modelId) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Model ID is required' }),
          };
        }
        
        const deleteData = await readModels();
        const deleteIndex = deleteData.models.findIndex(m => m.id === modelId);
        
        if (deleteIndex === -1) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: 'Model not found' }),
          };
        }
        
        deleteData.models.splice(deleteIndex, 1);
        await writeModels(deleteData);
        
        return {
          statusCode: 204,
          headers,
          body: '',
        };

      default:
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({ error: 'Method not allowed' }),
        };
    }
  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};