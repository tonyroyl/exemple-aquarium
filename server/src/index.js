import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cron from 'node-cron';
import { createApp } from './app.js';
import { getDb } from './db.js';
import { runSync } from './services/sync.js';
import { hasCredentials } from './services/francetravail.js';
import { loadMockOffers } from './data/mock-offers.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
const SYNC_CRON = process.env.SYNC_CRON || '0 */6 * * *'; // toutes les 6h par défaut
const webDistPath = path.join(__dirname, '..', '..', 'web', 'dist');

const db = getDb();
const app = createApp(db, { webDistPath });

async function triggerSync(reason) {
  try {
    const result = await runSync(db, { loadMockOffers: hasCredentials() ? undefined : loadMockOffers });
    console.log(`[sync:${reason}] ${result.fetched} offres analysées, ${result.created} nouvelles.`);
  } catch (err) {
    console.error(`[sync:${reason}] échec :`, err.message || err);
  }
}

if (!hasCredentials()) {
  console.warn(
    '⚠️  FT_CLIENT_ID / FT_CLIENT_SECRET absents de .env : utilisation des offres de démonstration (mock).'
  );
}

cron.schedule(SYNC_CRON, () => triggerSync('cron'));

app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
  triggerSync('startup');
});
