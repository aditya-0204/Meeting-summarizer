import type { Request, Response } from 'express';
import { createApp } from '../server.js';

const appPromise = createApp(false);

export default async function handler(_req: Request, res: Response): Promise<void> {
  const app = await appPromise;
  const request = _req;
  request.url = '/api/health';
  app(request, res);
}
