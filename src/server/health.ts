import http from 'node:http';
import { logger } from '../utils/logger.js';
import type { ExtendedClient } from '../client/ExtendedClient.js';

export function startHealthServer(client: ExtendedClient, port: number = 8080): http.Server {
  const server = http.createServer((req, res) => {
    const url = req.url || '/';

    if (url === '/health' || url === '/ping' || url === '/') {
      const memoryUsage = process.memoryUsage();
      const payload = {
        status: 'ok',
        botStatus: client.isReady() ? 'online' : 'connecting',
        guilds: client.guilds.cache.size,
        users: client.users.cache.size,
        uptimeSeconds: Math.floor(process.uptime()),
        memoryMB: {
          rss: (memoryUsage.rss / 1024 / 1024).toFixed(2),
          heapUsed: (memoryUsage.heapUsed / 1024 / 1024).toFixed(2),
        },
        timestamp: new Date().toISOString(),
      };

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(payload, null, 2));
      return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  });

  server.listen(port, () => {
    logger.success(`🌐 Healthcheck keep-alive server listening on port ${port}`);
    logger.info(`   Ping URL: http://localhost:${port}/health`);
  });

  return server;
}
