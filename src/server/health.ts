import http from 'node:http';
import { logger } from '../utils/logger.js';
import type { ExtendedClient } from '../client/ExtendedClient.js';
import { handleApiAndStatic } from './api.js';

export function startHealthServer(client: ExtendedClient, port: number = 8080): http.Server {
  const server = http.createServer(async (req, res) => {
    try {
      const handled = await handleApiAndStatic(req, res, client);
      if (handled) return;

      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Endpoint not found' }));
    } catch (err: any) {
      logger.error('Error handling HTTP request:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal Server Error' }));
    }
  });

  server.listen(port, () => {
    logger.success(`🌐 Web Server (API + Healthcheck + Dashboard) listening on port ${port}`);
    logger.info(`   Local API URL: http://localhost:${port}/api/v1/public/guilds`);
    logger.info(`   Health Ping URL: http://localhost:${port}/health`);
  });

  return server;
}
