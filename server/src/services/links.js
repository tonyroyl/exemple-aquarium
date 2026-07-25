// Génération de "liens intelligents" vers des sites sans API publique.
// On ne scrape jamais ces sites : on construit uniquement des URLs de recherche
// pré-filtrées, vérifiées manuellement (voir README) sur des formats réels observés
// mi-2026. Ces formats peuvent évoluer ; à réajuster si un site change son moteur.

function qs(params) {
  return Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
}

export function buildIndeedUrl({ keyword, destinationLabel, housingOnly = true }) {
  const q = housingOnly ? `${keyword} logé` : keyword;
  return `https://fr.indeed.com/jobs?${qs({ q, l: destinationLabel })}`;
}

// Jooble expose "ckey" (mot-clé) dans ses propres liens internes ; les codes de
// région ("rgn") sont des identifiants numériques internes non documentés
// publiquement, donc on inclut la destination directement dans le mot-clé plutôt
// que de deviner un code région.
export function buildJoobleUrl({ keyword, destinationLabel, housingOnly = true }) {
  const ckey = housingOnly ? `${keyword} logé ${destinationLabel}` : `${keyword} ${destinationLabel}`;
  return `https://fr.jooble.org/SearchResult?${qs({ ckey })}`;
}

// APEC (cadres/management) : motsCles est un paramètre confirmé de son moteur de recherche.
export function buildApecUrl({ keyword, destinationLabel }) {
  const motsCles = `${keyword} ${destinationLabel}`.trim();
  return `https://cadres.apec.fr/home/mes-offres/recherche-des-offres-demploi/liste-des-offres-demploi.html?${qs({ motsCles })}`;
}

// L'Hôtellerie-Restauration organise ses offres par pages de territoire (slugs
// vérifiés : /emploi/corse, /emploi/suisse, /emploi/saint-barthelemy,
// /emploi/polynesie-francaise, /emploi/outre-mer, /emploi/auvergne-rhone-alpes).
export function buildLhrUrl({ lhrSlug }) {
  if (!lhrSlug) return 'https://www.lhotellerie-restauration.fr/emploi/offre-emploi';
  return `https://www.lhotellerie-restauration.fr/emploi/${lhrSlug}`;
}

export function buildSmartLinks({ keyword, destination, housingOnly = true }) {
  const destinationLabel = destination?.label ?? '';
  return [
    { source: 'Indeed', url: buildIndeedUrl({ keyword, destinationLabel, housingOnly }) },
    { source: 'Jooble', url: buildJoobleUrl({ keyword, destinationLabel, housingOnly }) },
    { source: 'APEC (cadres / management)', url: buildApecUrl({ keyword, destinationLabel }) },
    {
      source: "L'Hôtellerie-Restauration",
      url: buildLhrUrl({ lhrSlug: destination?.lhrSlug }),
      note: destination?.key === 'saint_barthelemy' || destination?.key === 'polynesie_francaise'
        ? 'Page territoire dédiée (peu de résultats en direct : voir aussi la page Outre-Mer).'
        : undefined,
    },
  ];
}

// Espaces de recrutement directs de grands établissements (à enrichir par l'utilisateur).
export const STATIC_EMPLOYER_LINKS = [
  {
    label: 'Le Barthélemy Hôtel & Spa (St-Barth) — espace recrutement Werecruit',
    url: 'https://careers.werecruit.io/fr/le-barthelemy-hotel--spa',
    destinationKey: 'saint_barthelemy',
  },
  {
    label: 'Cheval Blanc — toutes les carrières du groupe (dont St-Barth Isle de France)',
    url: 'https://www.chevalblanc.com/fr/carrieres/offres/',
    destinationKey: 'saint_barthelemy',
  },
  {
    label: 'Cheval Blanc — plateforme de recrutement officielle',
    url: 'https://cheval-blanc.recruitmentplatform.com/FO/index.html',
    destinationKey: 'saint_barthelemy',
  },
];

// Sources à consulter soi-même : pas d'API, scraping interdit/non pertinent (Facebook, etc.).
export const MANUAL_SOURCES = [
  {
    label: 'Groupes Facebook "Emploi Saisonnier Hôtellerie-Restauration"',
    hint: "Rechercher sur Facebook : 'emploi saisonnier hôtellerie restauration' + nom de la destination.",
  },
  {
    label: 'Groupes Facebook Saint-Barthélemy (emploi / logement)',
    hint: "Rechercher sur Facebook : 'St Barth emploi', 'Saint-Barthélemy logement saisonnier'.",
  },
  {
    label: 'News de Saint-Barth (actualités locales, petites annonces)',
    hint: 'Consulter directement le site / la page suivie sur les réseaux sociaux — pas d’API publique disponible.',
  },
];
