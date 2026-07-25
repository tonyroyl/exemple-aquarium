import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { createDb } from '../src/db.js';
import { runSync } from '../src/services/sync.js';
import { loadMockOffers, MOCK_OFFERS } from '../src/data/mock-offers.js';

before(() => {
  delete process.env.FT_CLIENT_ID;
  delete process.env.FT_CLIENT_SECRET;
});

describe('runSync (mode démo, sans identifiants France Travail)', () => {
  test('insère toutes les offres de démonstration en base', async () => {
    const db = createDb(':memory:');
    const result = await runSync(db, { loadMockOffers });
    assert.equal(result.fetched, MOCK_OFFERS.length);
    assert.equal(result.created, MOCK_OFFERS.length);

    const count = db.prepare('SELECT COUNT(*) AS c FROM jobs').get().c;
    assert.equal(count, MOCK_OFFERS.length);
  });

  test('est idempotent : relancer le sync ne recrée pas de doublons', async () => {
    const db = createDb(':memory:');
    await runSync(db, { loadMockOffers });
    const secondRun = await runSync(db, { loadMockOffers });
    assert.equal(secondRun.created, 0);
    assert.equal(secondRun.fetched, MOCK_OFFERS.length);

    const count = db.prepare('SELECT COUNT(*) AS c FROM jobs').get().c;
    assert.equal(count, MOCK_OFFERS.length);
  });

  test('calcule un score et un flag logement pour chaque offre insérée', async () => {
    const db = createDb(':memory:');
    await runSync(db, { loadMockOffers });
    const rows = db.prepare('SELECT * FROM jobs').all();
    assert.ok(rows.length > 0);
    rows.forEach((row) => {
      assert.equal(typeof row.score, 'number');
      assert.ok([0, 1].includes(row.housing_mentioned));
    });

    const loggedOffer = db.prepare("SELECT * FROM jobs WHERE external_id = 'MOCK-CORSE-SALLE-1'").get();
    assert.equal(loggedOffer.housing_mentioned, 1);

    const notLoggedOffer = db.prepare("SELECT * FROM jobs WHERE external_id = 'MOCK-CORSE-BAR-1'").get();
    assert.equal(notLoggedOffer.housing_mentioned, 0);
  });

  test('enregistre une entrée dans sync_log', async () => {
    const db = createDb(':memory:');
    await runSync(db, { loadMockOffers });
    const log = db.prepare('SELECT * FROM sync_log ORDER BY id DESC LIMIT 1').get();
    assert.ok(log);
    assert.ok(log.finished_at);
    assert.equal(log.error, null);
  });
});
