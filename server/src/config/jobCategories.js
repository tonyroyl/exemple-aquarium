// Catégories de postes ciblées (bar / salle / management) et mots-clés associés.
// `ftKeywords` alimente le paramètre `motsCles` de l'API France Travail.
export const JOB_CATEGORIES = [
  {
    key: 'bar',
    label: 'Bar',
    searchKeyword: 'barman',
    ftKeywords: ['barman', 'barmaid', 'bartender', 'chef de bar', 'responsable de bar'],
    titleKeywords: ['barman', 'barmaid', 'bartender', 'bar'],
  },
  {
    key: 'salle',
    label: 'Salle / Restaurant',
    searchKeyword: 'serveur restaurant',
    ftKeywords: ['serveur', 'serveuse', 'chef de rang', 'maître d’hôtel', 'maitre d hotel', 'commis de salle', 'runner restauration'],
    titleKeywords: ['serveur', 'serveuse', 'chef de rang', 'maitre d', 'maître d', 'salle', 'commis de salle'],
  },
  {
    key: 'management',
    label: 'Management',
    searchKeyword: 'directeur adjoint restaurant',
    ftKeywords: ['directeur adjoint', 'directeur restaurant', 'directeur hôtel', 'manager restaurant', 'responsable restauration', 'responsable de salle', 'F&B manager', 'food and beverage manager'],
    titleKeywords: ['directeur', 'directrice', 'manager', 'responsable', 'f&b', 'food and beverage'],
  },
];

// Termes signalant explicitement un logement fourni : le coeur du critère de l'utilisateur.
// IMPORTANT : ces patterns sont testés contre du texte déjà passé par normalize()
// (minuscules, accents supprimés) dans scoring.js — ne pas utiliser d'accents ici,
// et éviter \b juste après une lettre qui serait accentuée en français (cf. tests).
export const HOUSING_PATTERNS = [
  /\bloge(e|es|s)?\b/,
  /nourri[e]?[\s-]?loge/,
  /logement (fourni|assur|inclus|de fonction|possible|propos)/,
  /hebergement (fourni|assur|inclus|propos)/,
  /chambre (fournie|de fonction|mise a disposition)/,
  /studio (fourni|mis a disposition)/,
];

export const SEASONAL_CONTRACT_PATTERNS = [/saisonnier/, /cdd[\s-]?saisonnier/];

// Tournures négatives ("pas de logement", "sans hébergement", "logement non fourni"...)
// à retirer du texte avant de tester HOUSING_PATTERNS, pour éviter les faux positifs.
export const HOUSING_NEGATION_PATTERNS = [
  /\b(pas|aucun[e]?|sans|ni)\b[^,.;]{0,12}\b(loge[a-z]*|logement|hebergement|chambre|studio)[^,.;]*/g,
  /\b(loge[a-z]*|logement|hebergement)\s+non\s+(fourni[e]?|assure[e]?|inclus[e]?)[^,.;]*/g,
];
