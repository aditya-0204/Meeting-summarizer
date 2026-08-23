import type { Request, Response } from 'express';
import { createApp } from '../../server.js';

const appPromise = createApp(false);

export default async function handler(req: Request, res: Response): Promise<void> {
  const app = await appPromise;
  const requestPath = req.url || '/';
  if (requestPath.startsWith('/api/meetings')) {
    req.url = requestPath;
  } else if (requestPath.startsWith('/meetings')) {
    req.url = `/api${requestPath}`;
  } else {
    req.url = `/api/meetings${requestPath}`;
  }
  app(req, res);
}
