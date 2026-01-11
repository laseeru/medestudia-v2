/**
 * Local development server for API functions
 * Run with: npx tsx api-server.ts
 */

import { createServer } from 'http';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load environment variables from .env.local
const envFile = join(process.cwd(), '.env.local');
let envVars: Record<string, string> = {};
try {
  const envContent = readFileSync(envFile, 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
        envVars[key.trim()] = value;
      }
    }
  });
  // Set environment variables
  Object.entries(envVars).forEach(([key, value]) => {
    process.env[key] = value;
  });
} catch (e) {
  console.warn('⚠️  Could not load .env.local:', e);
}

const port = 3001;

const server = createServer(async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.url === '/api/ai' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const requestBody = JSON.parse(body);
        
        // Dynamically import the handler
        const handlerModule = await import('./api/ai.ts');
        const handler = handlerModule.default;
        
        // Create Vercel-compatible request/response
        const vercelReq = {
          method: 'POST',
          body: requestBody,
          headers: req.headers as Record<string, string>,
          query: {},
        };

        let statusCode = 200;
        let responseData: any = null;

        const vercelRes = {
          status: (code: number) => {
            statusCode = code;
            return {
              json: (data: any) => {
                responseData = data;
              },
            };
          },
          json: (data: any) => {
            responseData = data;
          },
        };

        await handler(vercelReq, vercelRes);

        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(responseData));
      } catch (error: any) {
        console.error('❌ API Error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          type: 'error',
          error: error.message || 'Internal server error'
        }));
      }
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

server.listen(port, () => {
  console.log(`✅ API server running on http://localhost:${port}`);
  const apiKey = envVars.AZURE_FOUNDRY_API_KEY || envVars.DEEPSEEK_API_KEY;
  console.log(`📝 API Key loaded: ${apiKey ? '✅ Yes' : '❌ No (check .env.local)'}`);
  console.log(`🌐 Frontend should proxy /api requests to this server`);
});

