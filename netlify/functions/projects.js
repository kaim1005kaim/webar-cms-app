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

async function writeProjectsFile(data) {
  try {
    await fs.writeFile(PROJECTS_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing projects file:', error);
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
  const projectId = segments[1];

  try {
    switch (event.httpMethod) {
      case 'GET':
        const data = await readProjectsFile();
        if (projectId) {
          // GET /api/projects/:id
          const project = data.projects.find(p => p.id === projectId);
          if (!project) {
            return {
              statusCode: 404,
              headers,
              body: JSON.stringify({ error: 'Project not found' }),
            };
          }
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(project),
          };
        } else {
          // GET /api/projects
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(data.projects),
          };
        }

      case 'POST':
        // POST /api/projects
        const postData = await readProjectsFile();
        const newProject = JSON.parse(event.body);
        newProject.id = `project${Date.now()}`;
        newProject.created_at = new Date().toISOString();
        
        // デフォルト値の設定
        if (!newProject.name) newProject.name = 'Untitled Project';
        if (!newProject.creator) newProject.creator = { userId: 'anonymous', name: 'Anonymous' };
        if (!newProject.marker) newProject.marker = {};
        if (!newProject.character) newProject.character = {};
        if (!newProject.metadata) newProject.metadata = { isPublic: false };
        
        postData.projects.push(newProject);
        await writeProjectsFile(postData);
        
        return {
          statusCode: 201,
          headers,
          body: JSON.stringify(newProject),
        };

      case 'PUT':
        // PUT /api/projects/:id
        if (!projectId) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Project ID is required' }),
          };
        }
        
        const putData = await readProjectsFile();
        const projectIndex = putData.projects.findIndex(p => p.id === projectId);
        
        if (projectIndex === -1) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: 'Project not found' }),
          };
        }
        
        const updateData = JSON.parse(event.body);
        putData.projects[projectIndex] = {
          ...putData.projects[projectIndex],
          ...updateData,
          id: projectId,
          created_at: putData.projects[projectIndex].created_at,
        };
        
        await writeProjectsFile(putData);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(putData.projects[projectIndex]),
        };

      case 'DELETE':
        // DELETE /api/projects/:id
        if (!projectId) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Project ID is required' }),
          };
        }
        
        const deleteData = await readProjectsFile();
        const deleteIndex = deleteData.projects.findIndex(p => p.id === projectId);
        
        if (deleteIndex === -1) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: 'Project not found' }),
          };
        }
        
        deleteData.projects.splice(deleteIndex, 1);
        await writeProjectsFile(deleteData);
        
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