import 'dotenv/config';
import { getDb } from '../db.js';
import { runSync } from '../services/sync.js';
import { hasCredentials } from '../services/francetravail.js';
import { loadMockOffers } from '../data/mock-offers.js';

const db = getDb();
const result = await runSync(db, { loadMockOffers: hasCredentials() ? undefined : loadMockOffers });
console.log(`Seed terminé : ${result.fetched} offres analysées, ${result.created} nouvelles.`);
process.exit(0);
