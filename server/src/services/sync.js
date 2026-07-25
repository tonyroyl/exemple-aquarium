import { JOB_CATEGORIES } from '../config/jobCategories.js';
import { computeScore } from './scoring.js';
import { hasCredentials, searchOffers, mapOffer } from './francetravail.js';

function getEnabledDestinations(db) {
  const rows = db.prepare('SELECT * FROM destinations WHERE enabled = 1').all();
  return rows.map((row) => ({
    key: row.key,
    label: row.label,
    ftDepartments: JSON.parse(row.ft_departments),
    ftCoverage: Boolean(row.ft_coverage),
    lhrSlug: row.lhr_slug,
    searchTerms: JSON.parse(row.search_terms),
  }));
}

const upsertStmt = (db) => db.prepare(`
  INSERT INTO jobs (
    external_id, source, title, company, location_label, department_code, description,
    contract_type, url, destination_key, category_key, housing_mentioned, seasonal, score,
    date_created, date_updated, first_seen_at, last_seen_at, raw_json
  ) VALUES (
    @externalId, 'france_travail', @title, @company, @locationLabel, @departmentCode, @description,
    @contractType, @url, @destinationKey, @categoryKey, @housingMentioned, @seasonal, @score,
    @dateCreated, @dateUpdated, datetime('now'), datetime('now'), @rawJson
  )
  ON CONFLICT(external_id) DO UPDATE SET
    title = excluded.title,
    company = excluded.company,
    location_label = excluded.location_label,
    department_code = excluded.department_code,
    description = excluded.description,
    contract_type = excluded.contract_type,
    url = excluded.url,
    destination_key = excluded.destination_key,
    category_key = excluded.category_key,
    housing_mentioned = excluded.housing_mentioned,
    seasonal = excluded.seasonal,
    score = excluded.score,
    date_updated = excluded.date_updated,
    last_seen_at = datetime('now')
`);

function upsertOffer(db, offer, destination, categoryKey) {
  const exists = db.prepare('SELECT id FROM jobs WHERE external_id = ?').get(offer.externalId);
  const { score, housingMentioned, seasonal } = computeScore(
    { title: offer.title, description: offer.description, contractType: offer.contractType },
    destination,
    categoryKey
  );
  upsertStmt(db).run({
    externalId: offer.externalId,
    title: offer.title,
    company: offer.company,
    locationLabel: offer.locationLabel,
    departmentCode: offer.departmentCode,
    description: offer.description,
    contractType: offer.contractType,
    url: offer.url,
    destinationKey: destination.key,
    categoryKey,
    housingMentioned: housingMentioned ? 1 : 0,
    seasonal: seasonal ? 1 : 0,
    score,
    dateCreated: offer.dateCreated,
    dateUpdated: offer.dateUpdated,
    rawJson: JSON.stringify(offer.raw || {}),
  });
  return !exists;
}

/**
 * Boucle de synchronisation : pour chaque destination active x catégorie de poste,
 * interroge France Travail (départements de la destination, mots-clés de la
 * catégorie, contrat saisonnier) puis upsert les résultats en base (dédup par
 * external_id). Si aucune clé API n'est configurée, utilise les offres de
 * démonstration fournies dans data/mock-offers.json.
 */
export async function runSync(db, { loadMockOffers } = {}) {
  const startedAt = new Date().toISOString();
  const logStmt = db.prepare('INSERT INTO sync_log (started_at, jobs_fetched, jobs_new) VALUES (?, 0, 0)');
  const logResult = logStmt.run(startedAt);
  const logId = Number(logResult.lastInsertRowid);

  let fetched = 0;
  let created = 0;

  try {
    if (!hasCredentials()) {
      const mockOffers = loadMockOffers ? await loadMockOffers() : [];
      const destinations = getEnabledDestinations(db);
      for (const mock of mockOffers) {
        const destination = destinations.find((d) => d.key === mock.destinationKey) || destinations[0];
        const isNew = upsertOffer(db, mock.offer, destination, mock.categoryKey);
        fetched += 1;
        if (isNew) created += 1;
      }
    } else {
      const destinations = getEnabledDestinations(db).filter((d) => d.ftCoverage && d.ftDepartments.length);
      for (const destination of destinations) {
        for (const category of JOB_CATEGORIES) {
          for (const departement of destination.ftDepartments) {
            const raw = await searchOffers({
              motsCles: category.ftKeywords.join(','),
              departement,
              typeContrat: 'SAI',
            });
            for (const rawOffer of raw) {
              const offer = mapOffer(rawOffer);
              const isNew = upsertOffer(db, offer, destination, category.key);
              fetched += 1;
              if (isNew) created += 1;
            }
          }
        }
      }
    }

    db.prepare('UPDATE sync_log SET finished_at = ?, jobs_fetched = ?, jobs_new = ? WHERE id = ?')
      .run(new Date().toISOString(), fetched, created, logId);
  } catch (err) {
    db.prepare('UPDATE sync_log SET finished_at = ?, jobs_fetched = ?, jobs_new = ?, error = ? WHERE id = ?')
      .run(new Date().toISOString(), fetched, created, String(err.message || err), logId);
    throw err;
  }

  return { fetched, created };
}
