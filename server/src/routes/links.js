import { Router } from 'express';
import { buildSmartLinks, STATIC_EMPLOYER_LINKS, MANUAL_SOURCES } from '../services/links.js';
import { JOB_CATEGORIES } from '../config/jobCategories.js';

function rowToDestination(row) {
  return {
    key: row.key,
    label: row.label,
    ftCoverage: Boolean(row.ft_coverage),
    lhrSlug: row.lhr_slug,
    searchTerms: JSON.parse(row.search_terms),
  };
}

export function linksRouter(db) {
  const router = Router();

  router.get('/', (req, res) => {
    const { destination: destinationKey, category: categoryKey, housingOnly } = req.query;

    const destRow = destinationKey
      ? db.prepare('SELECT * FROM destinations WHERE key = ?').get(destinationKey)
      : null;
    const destination = destRow ? rowToDestination(destRow) : null;

    if (destinationKey && !destination) {
      return res.status(404).json({ error: 'destination introuvable' });
    }

    const category = JOB_CATEGORIES.find((c) => c.key === categoryKey);
    const keyword = category ? category.searchKeyword : 'hôtellerie restauration';

    const smartLinks = buildSmartLinks({
      keyword,
      destination,
      housingOnly: housingOnly !== 'false',
    });

    const employerLinks = STATIC_EMPLOYER_LINKS.filter(
      (link) => !destinationKey || link.destinationKey === destinationKey
    );

    return res.json({ smartLinks, employerLinks, manualSources: MANUAL_SOURCES });
  });

  return router;
}
