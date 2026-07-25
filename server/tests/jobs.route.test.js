import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import supertest from 'supertest';
import { createDb } from '../src/db.js';
import { createApp } from '../src/app.js';
import { runSync } from '../src/services/sync.js';
import { loadMockOffers } from '../src/data/mock-offers.js';

let request;
let db;

before(async () => {
  delete process.env.FT_CLIENT_ID;
  delete process.env.FT_CLIENT_SECRET;
  db = createDb(':memory:');
  await runSync(db, { loadMockOffers });
  const app = createApp(db);
  request = supertest(app);
});

describe('GET /api/jobs', () => {
  test('renvoie la liste des offres triée par score décroissant', async () => {
    const res = await request.get('/api/jobs');
    assert.equal(res.status, 200);
    assert.ok(res.body.length > 0);
    const scores = res.body.map((j) => j.score);
    const sorted = [...scores].sort((a, b) => b - a);
    assert.deepEqual(scores, sorted);
  });

  test('filtre par destination', async () => {
    const res = await request.get('/api/jobs?destination=corse');
    assert.equal(res.status, 200);
    assert.ok(res.body.length > 0);
    res.body.forEach((job) => assert.equal(job.destinationKey, 'corse'));
  });

  test('filtre par catégorie de poste', async () => {
    const res = await request.get('/api/jobs?category=bar');
    assert.equal(res.status, 200);
    res.body.forEach((job) => assert.equal(job.categoryKey, 'bar'));
  });

  test('filtre "logement fourni uniquement"', async () => {
    const res = await request.get('/api/jobs?housingOnly=true');
    assert.equal(res.status, 200);
    assert.ok(res.body.length > 0);
    res.body.forEach((job) => assert.equal(job.housingMentioned, true));
  });

  test('combine plusieurs filtres', async () => {
    const res = await request.get('/api/jobs?destination=saint_barthelemy&category=bar&housingOnly=true');
    assert.equal(res.status, 200);
    res.body.forEach((job) => {
      assert.equal(job.destinationKey, 'saint_barthelemy');
      assert.equal(job.categoryKey, 'bar');
      assert.equal(job.housingMentioned, true);
    });
  });
});

describe('PATCH /api/jobs/:id/status', () => {
  test('met à jour le statut d’une offre', async () => {
    const list = await request.get('/api/jobs');
    const jobId = list.body[0].id;

    const res = await request.patch(`/api/jobs/${jobId}/status`).send({ status: 'interessante' });
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'interessante');

    const refreshed = await request.get('/api/jobs?status=interessante');
    assert.ok(refreshed.body.some((j) => j.id === jobId));
  });

  test('rejette un statut invalide', async () => {
    const list = await request.get('/api/jobs');
    const jobId = list.body[0].id;
    const res = await request.patch(`/api/jobs/${jobId}/status`).send({ status: 'inconnu' });
    assert.equal(res.status, 400);
  });

  test('renvoie 404 pour une offre inexistante', async () => {
    const res = await request.patch('/api/jobs/999999/status').send({ status: 'vue' });
    assert.equal(res.status, 404);
  });
});

describe('GET /api/destinations', () => {
  test('renvoie les 6 destinations par défaut', async () => {
    const res = await request.get('/api/destinations');
    assert.equal(res.status, 200);
    assert.equal(res.body.length, 6);
  });

  test('permet d’ajouter puis de retirer une destination personnalisée', async () => {
    const created = await request.post('/api/destinations').send({ label: 'Martinique Sud', ftDepartments: ['972'] });
    assert.equal(created.status, 201);
    assert.equal(created.body.key, 'martinique_sud');

    const deleted = await request.delete(`/api/destinations/${created.body.key}`);
    assert.equal(deleted.status, 204);

    const list = await request.get('/api/destinations');
    assert.ok(!list.body.some((d) => d.key === 'martinique_sud'));
  });

  test('permet de désactiver une destination existante', async () => {
    const res = await request.patch('/api/destinations/suisse').send({ enabled: false });
    assert.equal(res.status, 200);
    assert.equal(res.body.enabled, false);
    // remet en état pour ne pas affecter les autres tests
    await request.patch('/api/destinations/suisse').send({ enabled: true });
  });
});

describe('GET /api/links', () => {
  test('retourne des liens intelligents valides pour une destination', async () => {
    const res = await request.get('/api/links?destination=corse&category=bar');
    assert.equal(res.status, 200);
    assert.ok(res.body.smartLinks.length >= 4);
    res.body.smartLinks.forEach((l) => assert.match(l.url, /^https:\/\//));
    assert.ok(Array.isArray(res.body.manualSources));
  });

  test('404 pour une destination inconnue', async () => {
    const res = await request.get('/api/links?destination=atlantide');
    assert.equal(res.status, 404);
  });
});

describe('GET /api/meta/badge et POST /api/meta/mark-visited', () => {
  test('le badge décompte les nouvelles offres puis se remet à zéro après visite', async () => {
    const before = await request.get('/api/meta/badge');
    assert.equal(before.status, 200);
    assert.ok(before.body.newCount > 0);

    const visited = await request.post('/api/meta/mark-visited');
    assert.equal(visited.status, 200);

    const after = await request.get('/api/meta/badge');
    assert.equal(after.body.newCount, 0);
  });
});
