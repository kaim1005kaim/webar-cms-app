const fs = require('fs').promises;
const path = require('path');

const PROJECTS_FILE = path.join(process.cwd(), 'keyholder-projects.json');

async function readProjectsFile() {
  try {
    const data = await fs.readFile(PROJECTS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading projects file:', error);
    return { projects: [], markers: [] };
  }
}

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
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
  const projectId = segments[1];

  try {
    if (event.httpMethod === 'GET') {
      const data = await readProjectsFile();
      
      if (projectId) {
        // GET /api/markers/:projectId - プロジェクトのマーカー取得
        const markers = data.markers.filter(m => m.projectId === projectId);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(markers),
        };
      } else {
        // GET /api/markers - マーカー一覧
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(data.markers),
        };
      }
    } else {
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