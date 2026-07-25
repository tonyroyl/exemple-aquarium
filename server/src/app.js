import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { jobsRouter } from './routes/jobs.js';
import { destinationsRouter } from './routes/destinations.js';
import { linksRouter } from './routes/links.js';
import { metaRouter } from './routes/meta.js';

export function createApp(db, { webDistPath } = {}) {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.use('/api/jobs', jobsRouter(db));
  app.use('/api/destinations', destinationsRouter(db));
  app.use('/api/links', linksRouter(db));
  app.use('/api/meta', metaRouter(db));

  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

  if (webDistPath && fs.existsSync(webDistPath)) {
    app.use(express.static(webDistPath));
    app.get(/^(?!\/api).*/, (req, res) => {
      res.sendFile(path.join(webDistPath, 'index.html'));
    });
  }

  return app;
}
