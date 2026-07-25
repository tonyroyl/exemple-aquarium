import { Router } from 'express';

function rowToDestination(row) {
  return {
    key: row.key,
    label: row.label,
    ftDepartments: JSON.parse(row.ft_departments),
    ftCoverage: Boolean(row.ft_coverage),
    lhrSlug: row.lhr_slug,
    searchTerms: JSON.parse(row.search_terms),
    enabled: Boolean(row.enabled),
  };
}

function slugifyKey(label) {
  return label
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function destinationsRouter(db) {
  const router = Router();

  router.get('/', (req, res) => {
    const rows = db.prepare('SELECT * FROM destinations ORDER BY label').all();
    res.json(rows.map(rowToDestination));
  });

  router.post('/', (req, res) => {
    const { label, ftDepartments = [], ftCoverage = true, lhrSlug = null, searchTerms = [] } = req.body || {};
    if (!label || typeof label !== 'string') {
      return res.status(400).json({ error: 'label requis' });
    }
    const key = slugifyKey(label);
    if (!key) {
      return res.status(400).json({ error: 'label invalide' });
    }
    const existing = db.prepare('SELECT key FROM destinations WHERE key = ?').get(key);
    if (existing) {
      return res.status(409).json({ error: 'une destination avec ce nom existe déjà' });
    }
    db.prepare(
      `INSERT INTO destinations (key, label, ft_departments, ft_coverage, lhr_slug, search_terms, enabled)
       VALUES (?, ?, ?, ?, ?, ?, 1)`
    ).run(key, label, JSON.stringify(ftDepartments), ftCoverage ? 1 : 0, lhrSlug, JSON.stringify(searchTerms));
    const row = db.prepare('SELECT * FROM destinations WHERE key = ?').get(key);
    return res.status(201).json(rowToDestination(row));
  });

  router.patch('/:key', (req, res) => {
    const { key } = req.params;
    const row = db.prepare('SELECT * FROM destinations WHERE key = ?').get(key);
    if (!row) {
      return res.status(404).json({ error: 'destination introuvable' });
    }
    const {
      label = row.label,
      ftDepartments = JSON.parse(row.ft_departments),
      ftCoverage = Boolean(row.ft_coverage),
      lhrSlug = row.lhr_slug,
      searchTerms = JSON.parse(row.search_terms),
      enabled = Boolean(row.enabled),
    } = req.body || {};

    db.prepare(
      `UPDATE destinations SET label = ?, ft_departments = ?, ft_coverage = ?, lhr_slug = ?, search_terms = ?, enabled = ?
       WHERE key = ?`
    ).run(label, JSON.stringify(ftDepartments), ftCoverage ? 1 : 0, lhrSlug, JSON.stringify(searchTerms), enabled ? 1 : 0, key);

    const updated = db.prepare('SELECT * FROM destinations WHERE key = ?').get(key);
    return res.json(rowToDestination(updated));
  });

  router.delete('/:key', (req, res) => {
    const { key } = req.params;
    const row = db.prepare('SELECT * FROM destinations WHERE key = ?').get(key);
    if (!row) {
      return res.status(404).json({ error: 'destination introuvable' });
    }
    db.prepare('DELETE FROM destinations WHERE key = ?').run(key);
    return res.status(204).send();
  });

  return router;
}
