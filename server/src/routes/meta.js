import { Router } from 'express';
import { runSync } from '../services/sync.js';
import { hasCredentials } from '../services/francetravail.js';
import { loadMockOffers } from '../data/mock-offers.js';

export function metaRouter(db) {
  const router = Router();

  router.get('/badge', (req, res) => {
    const lastVisitRow = db.prepare("SELECT value FROM app_meta WHERE key = 'last_visit_at'").get();
    const lastVisitAt = lastVisitRow?.value || null;
    const newCount = lastVisitAt
      ? db.prepare('SELECT COUNT(*) AS c FROM jobs WHERE first_seen_at > ?').get(lastVisitAt).c
      : db.prepare('SELECT COUNT(*) AS c FROM jobs').get().c;
    res.json({ newCount, lastVisitAt });
  });

  router.post('/mark-visited', (req, res) => {
    // On utilise datetime('now') côté SQLite (et non new Date().toISOString() côté JS)
    // pour rester dans le même format que first_seen_at/last_seen_at : les deux valeurs
    // sont comparées par simple comparaison de chaînes ailleurs dans cette route.
    db.prepare(
      `INSERT INTO app_meta (key, value) VALUES ('last_visit_at', datetime('now'))
       ON CONFLICT(key) DO UPDATE SET value = datetime('now')`
    ).run();
    const row = db.prepare("SELECT value FROM app_meta WHERE key = 'last_visit_at'").get();
    res.json({ lastVisitAt: row.value });
  });

  router.get('/sync-status', (req, res) => {
    const row = db.prepare('SELECT * FROM sync_log ORDER BY id DESC LIMIT 1').get();
    res.json({
      lastSync: row || null,
      usingMockData: !hasCredentials(),
    });
  });

  router.post('/sync-run', async (req, res) => {
    try {
      const result = await runSync(db, { loadMockOffers: hasCredentials() ? undefined : loadMockOffers });
      res.json(result);
    } catch (err) {
      res.status(502).json({ error: String(err.message || err) });
    }
  });

  return router;
}
