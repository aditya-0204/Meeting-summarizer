import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import meetingRoutes from './server/routes/meetingRoutes.js';
import { errorHandler } from './server/middleware/errorHandler.js';
import { config } from './server/config/env.js';

async function startServer() {
  const app = express();
  // Middleware for parsing JSON and URL-encoded bodies
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Basic security and CORS headers
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'Meeting Summarizer API',
      version: '1.0.0',
      timestamp: new Date().toISOString()
    });
  });

  // Mount REST API routes FIRST
  app.use('/api/meetings', meetingRoutes);

  // Centralized Error Handling Middleware for APIs
  app.use(errorHandler);

  // Vite middleware for development vs static asset serving in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(config.port, '0.0.0.0', () => {
    console.log(`[Meeting Summarizer] Server listening on http://0.0.0.0:${config.port}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server boot error:', err);
  process.exit(1);
});
