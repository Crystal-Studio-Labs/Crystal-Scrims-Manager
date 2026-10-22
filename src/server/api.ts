import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type http from 'node:http';
import { db, guilds, scrimLobbies, slotRegistrations, scrimMatchResults, teams } from '../db/index.js';
import { eq, desc, and } from 'drizzle-orm';
import { ScrimService } from '../services/scrimService.js';
import { PointsService } from '../services/pointsService.js';
import { logger } from '../utils/logger.js';
import type { ExtendedClient } from '../client/ExtendedClient.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to send JSON responses with CORS headers
function sendJson(res: http.ServerResponse, statusCode: number, data: any) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(JSON.stringify(data, null, 2));
}

// Helper to parse JSON request bodies
async function parseBody(req: http.IncomingMessage): Promise<any> {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
  });
}

// MIME types dictionary for static dashboard assets
const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

export async function handleApiAndStatic(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  client: ExtendedClient
): Promise<boolean> {
  const url = req.url || '/';
  const method = req.method || 'GET';

  // 1. Handle CORS Preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    res.end();
    return true;
  }

  // 2. Healthcheck Endpoint
  if (url === '/health' || url === '/ping') {
    const mem = process.memoryUsage();
    sendJson(res, 200, {
      status: 'ok',
      botStatus: client.isReady() ? 'online' : 'connecting',
      guilds: client.guilds.cache.size,
      users: client.users.cache.size,
      uptimeSeconds: Math.floor(process.uptime()),
      memoryMB: {
        rss: (mem.rss / 1024 / 1024).toFixed(2),
        heapUsed: (mem.heapUsed / 1024 / 1024).toFixed(2),
      },
      timestamp: new Date().toISOString(),
    });
    return true;
  }

  // 3. REST API Routes (/api/v1/...)
  if (url.startsWith('/api/v1/')) {
    try {
      // GET /api/v1/public/guilds
      if (url === '/api/v1/public/guilds' && method === 'GET') {
        const allGuilds = await db.select().from(guilds).all();
        sendJson(res, 200, { success: true, guilds: allGuilds });
        return true;
      }

      // GET /api/v1/public/scrims
      if (url.startsWith('/api/v1/public/scrims') && method === 'GET') {
        const parsedUrl = new URL(url, 'http://localhost:8080');
        const guildId = parsedUrl.searchParams.get('guildId');

        const lobbies = guildId
          ? await db.select().from(scrimLobbies).where(eq(scrimLobbies.guildId, guildId)).orderBy(desc(scrimLobbies.createdAt)).all()
          : await db.select().from(scrimLobbies).orderBy(desc(scrimLobbies.createdAt)).all();

        sendJson(res, 200, { success: true, lobbies });
        return true;
      }

      // GET /api/v1/public/slotlist/:lobbyId
      if (url.startsWith('/api/v1/public/slotlist/') && method === 'GET') {
        const lobbyId = url.replace('/api/v1/public/slotlist/', '').split('?')[0];
        const data = await ScrimService.getSlotlist(lobbyId);
        sendJson(res, 200, { success: true, ...data });
        return true;
      }

      // GET /api/v1/public/leaderboard/:lobbyId
      if (url.startsWith('/api/v1/public/leaderboard/') && method === 'GET') {
        const lobbyId = url.replace('/api/v1/public/leaderboard/', '').split('?')[0];
        const data = await PointsService.getLeaderboard(lobbyId);
        sendJson(res, 200, { success: true, ...data });
        return true;
      }

      // POST /api/v1/admin/scrims/:lobbyId/action
      if (url.startsWith('/api/v1/admin/scrims/') && method === 'POST') {
        const parts = url.replace('/api/v1/admin/scrims/', '').split('/');
        const lobbyId = parts[0];
        const body = await parseBody(req);
        const action = body.action;

        if (action === 'open') {
          const lobby = await ScrimService.openRegistration(lobbyId, body.channelId || '');
          sendJson(res, 200, { success: true, message: 'Registration opened', lobby });
          return true;
        }

        if (action === 'close') {
          const lobby = await ScrimService.closeRegistration(lobbyId);
          sendJson(res, 200, { success: true, message: 'Registration locked', lobby });
          return true;
        }

        if (action === 'cancel') {
          const lobby = await ScrimService.cancelLobby(lobbyId);
          sendJson(res, 200, { success: true, message: 'Lobby cancelled', lobby });
          return true;
        }

        if (action === 'kick') {
          const result = await ScrimService.kickTeam(lobbyId, body.target);
          sendJson(res, 200, { success: true, message: 'Team kicked', result });
          return true;
        }

        if (action === 'set-idp') {
          const lobby = await ScrimService.setRoomCredentials(lobbyId, body.roomId, body.roomPassword);
          sendJson(res, 200, { success: true, message: 'Credentials updated', lobby });
          return true;
        }

        sendJson(res, 400, { error: `Unsupported admin action: ${action}` });
        return true;
      }

      // POST /api/v1/admin/points/add
      if (url === '/api/v1/admin/points/add' && method === 'POST') {
        const body = await parseBody(req);
        const result = await PointsService.addResult({
          lobbyId: body.lobbyId,
          teamIdentifier: body.teamName,
          placement: body.placement,
          kills: body.kills,
          matchRound: body.round,
        });
        sendJson(res, 200, { success: true, result });
        return true;
      }

      sendJson(res, 404, { error: 'API route not found' });
      return true;
    } catch (err: any) {
      sendJson(res, 500, { error: err.message || 'Internal API Error' });
      return true;
    }
  }

  // 4. Static File Serving for Dashboard (Vite SPA Fallback)
  // Check dashboard/dist or dist/public
  const staticDirs = [
    path.resolve(process.cwd(), 'dashboard/dist'),
    path.resolve(__dirname, '../../dashboard/dist'),
    path.resolve(__dirname, '../public'),
  ];

  let staticRoot = staticDirs.find((d) => fs.existsSync(d));

  if (staticRoot && method === 'GET') {
    let filePath = path.join(staticRoot, url === '/' ? 'index.html' : url);
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(staticRoot, 'index.html');
    }

    if (fs.existsSync(filePath)) {
      const ext = path.extname(filePath);
      const mime = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, {
        'Content-Type': mime,
        'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000',
      });
      fs.createReadStream(filePath).pipe(res);
      return true;
    }
  }

  return false;
}
