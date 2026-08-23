import type { Request, Response } from 'express';
import { createApp } from '../server.js';

const appPromise = createApp(false);

export default async function handler(req: Request, res: Response): Promise<void> {
  const app = await appPromise;
  if (!req.url.startsWith('/api')) {
    req.url = `/api${req.url}`;
  }
  app(req, res);
}
