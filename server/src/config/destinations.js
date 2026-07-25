// Destinations cibles par défaut. Configurable/enrichissable via la table `destinations`
// en base (voir services/db.js) : ceci ne sert qu'à amorcer les données au premier lancement.
//
// `ftDepartments` : codes département France Travail (paramètre `departement` de l'API
// Offres d'emploi v2) permettant de segmenter les requêtes. Certaines destinations
// (Suisse, Polynésie française) ne sont pas couvertes par France Travail (organisme
// français) : `ftCoverage: false` le signale pour ne pas générer d'appels API inutiles
// et pour prévenir l'utilisateur dans l'interface.
//
// `lhrSlug` : slug de territoire vérifié sur lhotellerie-restauration.fr (ex: /emploi/corse).
export const DEFAULT_DESTINATIONS = [
  {
    key: 'saint_barthelemy',
    label: 'Saint-Barthélemy',
    ftDepartments: ['977'],
    ftCoverage: true,
    lhrSlug: 'saint-barthelemy',
    searchTerms: ['Saint-Barthélemy', 'Saint Barthelemy', 'St Barth', 'Gustavia'],
  },
  {
    key: 'suisse',
    label: 'Suisse',
    ftDepartments: [],
    ftCoverage: false,
    lhrSlug: 'suisse',
    searchTerms: ['Suisse', 'Genève', 'Verbier', 'Gstaad', 'Zermatt', 'Crans-Montana'],
  },
  {
    key: 'alpes_francaises',
    label: 'Alpes françaises',
    ftDepartments: ['73', '74', '05', '04', '06'],
    ftCoverage: true,
    lhrSlug: 'auvergne-rhone-alpes',
    searchTerms: ['Alpes', 'Savoie', 'Haute-Savoie', 'Courchevel', 'Val d’Isère', 'Chamonix', 'Megève'],
  },
  {
    key: 'corse',
    label: 'Corse',
    ftDepartments: ['2A', '2B'],
    ftCoverage: true,
    lhrSlug: 'corse',
    searchTerms: ['Corse', 'Ajaccio', 'Bastia', 'Porto-Vecchio', 'Calvi'],
  },
  {
    key: 'polynesie_francaise',
    label: 'Polynésie française',
    ftDepartments: ['987'],
    ftCoverage: false,
    lhrSlug: 'polynesie-francaise',
    searchTerms: ['Polynésie', 'Tahiti', 'Bora Bora', 'Moorea'],
  },
  {
    key: 'outre_mer',
    label: 'Outre-Mer (autres)',
    ftDepartments: ['971', '972', '973', '974', '975', '976', '988'],
    ftCoverage: true,
    lhrSlug: 'outre-mer',
    searchTerms: ['Guadeloupe', 'Martinique', 'Guyane', 'Réunion', 'Mayotte', 'Nouvelle-Calédonie', 'Saint-Pierre-et-Miquelon'],
  },
];
