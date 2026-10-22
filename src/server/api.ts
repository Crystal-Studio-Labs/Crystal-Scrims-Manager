import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type http from 'node:http';
import { db, guilds, scrimLobbies, slotRegistrations, scrimMatchResults, teams } from '../db/index.js';
import { eq, desc, and } from 'drizzle-orm';
import { ScrimService } from '../services/scrimService.js';
import { PointsService } from '../services/pointsService.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';
import type { ExtendedClient } from '../client/ExtendedClient.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to send JSON responses with CORS & Security headers
function sendJson(res: http.ServerResponse, statusCode: number, data: any) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  });
  res.end(JSON.stringify(data, null, 2));
}

// Helper to parse JSON request bodies safely with size limits
async function parseBody(req: http.IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    const MAX_BODY_SIZE = 1024 * 1024; // 1MB limit to prevent memory exhaustion / DoS

    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > MAX_BODY_SIZE) {
        req.destroy();
        reject(new Error('Request payload too large (1MB limit exceeded)'));
      }
    });

    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });

    req.on('error', (err) => {
      reject(err);
    });
  });
}

// MIME types dictionary for static dashboard assets
const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

// Verify Bearer Token or X-API-Key header against configured ADMIN_API_KEY
function isAuthorizedAdmin(req: http.IncomingMessage): boolean {
  const authHeader = req.headers['authorization'];
  const xApiKey = req.headers['x-api-key'];

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    if (token === env.ADMIN_API_KEY) return true;
  }

  if (xApiKey && typeof xApiKey === 'string' && xApiKey.trim() === env.ADMIN_API_KEY) {
    return true;
  }

  return false;
}

export async function handleApiAndStatic(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  client: ExtendedClient
): Promise<boolean> {
  const rawUrl = req.url || '/';
  const method = req.method || 'GET';
  const urlPath = rawUrl.split('?')[0];

  // 1. Handle CORS Preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
      'Access-Control-Max-Age': '86400',
    });
    res.end();
    return true;
  }

  // 2. Healthcheck & Telemetry Endpoint
  if (urlPath === '/health' || urlPath === '/ping') {
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
  if (rawUrl.startsWith('/api/v1/')) {
    try {
      // 3A. Public Guilds Registry
      if (urlPath === '/api/v1/public/guilds' && method === 'GET') {
        const allGuilds = await db.select({
          guildId: guilds.guildId,
          name: guilds.name,
          prefix: guilds.prefix,
          categoryName: guilds.categoryName,
          createdAt: guilds.createdAt,
        }).from(guilds).all();

        sendJson(res, 200, { success: true, guilds: allGuilds });
        return true;
      }

      // 3B. Public Scrims List (SECURE: Strips roomId and roomPassword)
      if (urlPath === '/api/v1/public/scrims' && method === 'GET') {
        const parsedUrl = new URL(rawUrl, 'http://localhost:8080');
        const guildId = parsedUrl.searchParams.get('guildId');

        const lobbies = guildId
          ? await db.select().from(scrimLobbies).where(eq(scrimLobbies.guildId, guildId)).orderBy(desc(scrimLobbies.createdAt)).all()
          : await db.select().from(scrimLobbies).orderBy(desc(scrimLobbies.createdAt)).all();

        // Strip sensitive room credentials from public responses
        const sanitizedLobbies = lobbies.map(({ roomId, roomPassword, ...safe }) => safe);

        sendJson(res, 200, { success: true, lobbies: sanitizedLobbies });
        return true;
      }

      // 3C. Public Slotlist (SECURE: Strips roomId and roomPassword from lobby)
      if (urlPath.startsWith('/api/v1/public/slotlist/') && method === 'GET') {
        const lobbyId = urlPath.replace('/api/v1/public/slotlist/', '').trim();
        const data = await ScrimService.getSlotlist(lobbyId);

        // Sanitize lobby object
        const { roomId, roomPassword, ...safeLobby } = data.lobby;

        sendJson(res, 200, {
          success: true,
          lobby: safeLobby,
          confirmed: data.confirmed,
          waitlist: data.waitlist,
        });
        return true;
      }

      // 3D. Public Leaderboard Standings
      if (urlPath.startsWith('/api/v1/public/leaderboard/') && method === 'GET') {
        const lobbyId = urlPath.replace('/api/v1/public/leaderboard/', '').trim();
        const data = await PointsService.getLeaderboard(lobbyId);

        // Strip room credentials from returned lobby if present
        const { roomId, roomPassword, ...safeLobby } = data.lobby;

        sendJson(res, 200, {
          success: true,
          lobby: safeLobby,
          results: data.results,
        });
        return true;
      }

      // ==========================================
      // 3E. ADMIN SECURE ROUTES (Requires ADMIN_API_KEY)
      // ==========================================
      if (rawUrl.startsWith('/api/v1/admin/')) {
        if (!isAuthorizedAdmin(req)) {
          sendJson(res, 401, {
            error: 'Unauthorized: Missing or invalid Admin API Key. Provide "Authorization: Bearer <ADMIN_API_KEY>" header.',
          });
          return true;
        }

        // POST /api/v1/admin/scrims/:lobbyId/action
        if (urlPath.startsWith('/api/v1/admin/scrims/') && method === 'POST') {
          const parts = urlPath.replace('/api/v1/admin/scrims/', '').split('/');
          const lobbyId = parts[0];
          const body = await parseBody(req);
          const action = body.action;

          if (action === 'open') {
            const lobby = await ScrimService.openRegistration(lobbyId, body.channelId || '');
            sendJson(res, 200, { success: true, message: 'Registration opened', lobbyId: lobby.lobbyId });
            return true;
          }

          if (action === 'close') {
            const lobby = await ScrimService.closeRegistration(lobbyId);
            sendJson(res, 200, { success: true, message: 'Registration locked', lobbyId: lobby.lobbyId });
            return true;
          }

          if (action === 'status') {
            if (!body.status) {
              sendJson(res, 400, { error: 'Status is required' });
              return true;
            }
            const lobby = await ScrimService.setStatus(lobbyId, String(body.status).toUpperCase());
            sendJson(res, 200, { success: true, message: "Status updated to " + body.status, lobbyId: lobby.lobbyId });
            return true;
          }

          if (action === 'cancel') {
            const lobby = await ScrimService.cancelLobby(lobbyId);
            sendJson(res, 200, { success: true, message: 'Lobby cancelled', lobbyId: lobby.lobbyId });
            return true;
          }

          if (action === 'kick') {
            if (!body.target) {
              sendJson(res, 400, { error: 'Target slot number or team name is required to kick' });
              return true;
            }
            const result = await ScrimService.kickTeam(lobbyId, String(body.target));
            sendJson(res, 200, { success: true, message: 'Team kicked', result });
            return true;
          }

          if (action === 'set-idp') {
            if (!body.roomId || !body.roomPassword) {
              sendJson(res, 400, { error: 'Both roomId and roomPassword are required' });
              return true;
            }
            await ScrimService.setRoomCredentials(lobbyId, String(body.roomId), String(body.roomPassword));
            sendJson(res, 200, { success: true, message: 'Credentials updated successfully' });
            return true;
          }

          sendJson(res, 400, { error: `Unsupported admin action: ${action}` });
          return true;
        }

        // POST /api/v1/admin/points/add
        if (urlPath === '/api/v1/admin/points/add' && method === 'POST') {
          const body = await parseBody(req);
          if (!body.lobbyId || !body.teamName || body.placement === undefined || body.kills === undefined) {
            sendJson(res, 400, { error: 'lobbyId, teamName, placement, and kills are required' });
            return true;
          }

          const result = await PointsService.addResult({
            lobbyId: String(body.lobbyId),
            teamIdentifier: String(body.teamName),
            placement: Number(body.placement),
            kills: Number(body.kills),
            matchRound: body.round ? Number(body.round) : 1,
          });
          sendJson(res, 200, { success: true, result });
          return true;
        }
      }

      sendJson(res, 404, { error: 'API route not found' });
      return true;
    } catch (err: any) {
      logger.error('API execution error:', err);
      sendJson(res, 500, { error: err.message || 'Internal API Error' });
      return true;
    }
  }

  // 4. Static File Serving with Path Traversal Protection (LFI Defense)
  const staticDirs = [
    path.resolve(process.cwd(), 'dashboard/dist'),
    path.resolve(__dirname, '../../dashboard/dist'),
    path.resolve(__dirname, '../public'),
  ];

  const staticRoot = staticDirs.find((d) => fs.existsSync(d));

  if (staticRoot && method === 'GET') {
    // Sanitize path against directory traversal (e.g. /../../etc/passwd or %2e%2e)
    const decodedUrl = decodeURIComponent(urlPath);
    const safeRelPath = path.normalize(decodedUrl).replace(/^(\.\.[\/\\])+/, '');
    let filePath = path.resolve(staticRoot, safeRelPath.startsWith(path.sep) ? safeRelPath.slice(1) : safeRelPath);

    // Hard Boundary Check: filePath must reside strictly inside staticRoot
    if (!filePath.startsWith(staticRoot)) {
      sendJson(res, 403, { error: 'Forbidden: Path traversal blocked' });
      return true;
    }

    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(staticRoot, 'index.html');
    }

    if (fs.existsSync(filePath)) {
      const ext = path.extname(filePath);
      const mime = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, {
        'Content-Type': mime,
        'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
      });
      fs.createReadStream(filePath).pipe(res);
      return true;
    }
  }

  return false;
}
