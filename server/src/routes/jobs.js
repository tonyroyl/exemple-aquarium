import { Router } from 'express';

const VALID_STATUSES = ['nouvelle', 'vue', 'interessante', 'ecartee'];

function rowToJob(row, lastVisitAt) {
  return {
    id: row.id,
    externalId: row.external_id,
    source: row.source,
    title: row.title,
    company: row.company,
    locationLabel: row.location_label,
    departmentCode: row.department_code,
    description: row.description,
    contractType: row.contract_type,
    url: row.url,
    destinationKey: row.destination_key,
    categoryKey: row.category_key,
    housingMentioned: Boolean(row.housing_mentioned),
    seasonal: Boolean(row.seasonal),
    score: row.score,
    dateCreated: row.date_created,
    dateUpdated: row.date_updated,
    firstSeenAt: row.first_seen_at,
    lastSeenAt: row.last_seen_at,
    status: row.status || 'nouvelle',
    isNew: lastVisitAt ? row.first_seen_at > lastVisitAt : true,
  };
}

export function jobsRouter(db) {
  const router = Router();

  router.get('/', (req, res) => {
    const { destination, category, housingOnly, status, search } = req.query;

    const clauses = [];
    const params = {};

    if (destination) {
      clauses.push('j.destination_key = @destination');
      params.destination = destination;
    }
    if (category) {
      clauses.push('j.category_key = @category');
      params.category = category;
    }
    if (housingOnly === 'true') {
      clauses.push('j.housing_mentioned = 1');
    }
    if (status) {
      clauses.push("COALESCE(s.status, 'nouvelle') = @status");
      params.status = status;
    }
    if (search) {
      clauses.push('(j.title LIKE @search OR j.description LIKE @search OR j.company LIKE @search)');
      params.search = `%${search}%`;
    }

    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const rows = db
      .prepare(
        `SELECT j.*, s.status AS status
         FROM jobs j
         LEFT JOIN job_status s ON s.job_id = j.id
         ${where}
         ORDER BY j.score DESC, j.date_created DESC`
      )
      .all(params);

    const lastVisitRow = db.prepare("SELECT value FROM app_meta WHERE key = 'last_visit_at'").get();
    const lastVisitAt = lastVisitRow?.value || null;

    res.json(rows.map((row) => rowToJob(row, lastVisitAt)));
  });

  router.patch('/:id/status', (req, res) => {
    const { id } = req.params;
    const { status } = req.body || {};
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: `status invalide, attendu: ${VALID_STATUSES.join(', ')}` });
    }
    const job = db.prepare('SELECT id FROM jobs WHERE id = ?').get(id);
    if (!job) {
      return res.status(404).json({ error: 'offre introuvable' });
    }
    db.prepare(
      `INSERT INTO job_status (job_id, status, updated_at) VALUES (?, ?, datetime('now'))
       ON CONFLICT(job_id) DO UPDATE SET status = excluded.status, updated_at = datetime('now')`
    ).run(id, status);
    return res.json({ id: Number(id), status });
  });

  return router;
}
