import { JOB_CATEGORIES, HOUSING_PATTERNS, HOUSING_NEGATION_PATTERNS, SEASONAL_CONTRACT_PATTERNS } from '../config/jobCategories.js';

function matchesAny(text, patterns) {
  if (!text) return false;
  return patterns.some((p) => p.test(text));
}

const COMBINING_DIACRITICS = new RegExp('[̀-ͯ]', 'g');

function normalize(text) {
  return (text || '').normalize('NFD').replace(COMBINING_DIACRITICS, '').toLowerCase();
}

function stripHousingNegations(text) {
  return HOUSING_NEGATION_PATTERNS.reduce((acc, pattern) => acc.replace(pattern, ''), text);
}

export function isHousingMentioned(description) {
  const withoutNegations = stripHousingNegations(normalize(description));
  return matchesAny(withoutNegations, HOUSING_PATTERNS);
}

export function isSeasonalContract({ contractType, description } = {}) {
  return matchesAny(normalize(contractType), SEASONAL_CONTRACT_PATTERNS) || matchesAny(normalize(description), SEASONAL_CONTRACT_PATTERNS);
}

function categoryTitleMatch(title, category) {
  const normTitle = normalize(title);
  return category.titleKeywords.some((kw) => normTitle.includes(normalize(kw)));
}

function categoryDescriptionMatch(description, category) {
  const normDesc = normalize(description);
  return category.ftKeywords.concat(category.titleKeywords).some((kw) => normDesc.includes(normalize(kw)));
}

function destinationTextMatch(text, destination) {
  if (!destination || !destination.searchTerms) return false;
  const normText = normalize(text);
  return destination.searchTerms.some((term) => normText.includes(normalize(term)));
}

/**
 * Calcule un score de pertinence (0-100+) pour une offre, en fonction de la
 * destination ciblée et de la catégorie de poste. Le logement fourni est le
 * critère le plus lourdement pondéré, conformément au besoin utilisateur.
 */
export function computeScore(job, destination, categoryKey) {
  const { title = '', description = '', contractType = '' } = job;
  const category = JOB_CATEGORIES.find((c) => c.key === categoryKey);

  const housingMentioned = isHousingMentioned(description) || isHousingMentioned(title);
  const seasonal = isSeasonalContract({ contractType, description });
  const titleMatch = category ? categoryTitleMatch(title, category) : false;
  const descMatch = category ? categoryDescriptionMatch(description, category) : false;
  const destinationMatch = destinationTextMatch(`${title} ${description}`, destination);

  let score = 0;
  if (housingMentioned) score += 50;
  if (seasonal) score += 15;
  if (titleMatch) score += 25;
  else if (descMatch) score += 10;
  if (destinationMatch) score += 10;

  return {
    score,
    housingMentioned,
    seasonal,
    categoryMatch: titleMatch || descMatch,
    destinationMatch,
  };
}

export function categoryForTitle(title) {
  const normTitle = normalize(title);
  const match = JOB_CATEGORIES.find((c) => c.titleKeywords.some((kw) => normTitle.includes(normalize(kw))));
  return match ? match.key : null;
}
