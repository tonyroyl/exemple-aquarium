// Client pour l'API publique France Travail (ex Pôle Emploi) — "Offres d'emploi" v2.
// Doc portail : https://francetravail.io/data/api/offres-emploi
// Référence d'implémentation : github.com/creach-t/job-search-france-travail-api
//
// Auth : OAuth2 client_credentials. Identifiants lus depuis process.env (jamais en dur).
// Segmentation obligatoire : l'API ne renvoie que ~1150 offres par requête
// (fenêtre `range`, de "0-0" à "1000-1149" au maximum, cf. header Content-Range).
// On segmente donc par destination x catégorie de poste pour rester sous cette limite
// et ne rien manquer.

const TOKEN_URL = process.env.FT_TOKEN_URL || 'https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=%2Fpartenaire';
const SCOPE = process.env.FT_SCOPE || 'api_offresdemploiv2 o2dsoffre';
const BASE_URL = process.env.FT_BASE_URL || 'https://api.francetravail.io';
const SEARCH_PATH = '/partenaire/offresdemploi/v2/offres/search';

const RANGE_STEP = 150; // taille de page raisonnable, alignée sur la référence citée
const RANGE_MAX_START = 1000; // dernière fenêtre possible : 1000-1149

let cachedToken = null; // { accessToken, expiresAt }

export function hasCredentials() {
  return Boolean(process.env.FT_CLIENT_ID && process.env.FT_CLIENT_SECRET);
}

export async function getAccessToken(fetchImpl = fetch) {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 5000) {
    return cachedToken.accessToken;
  }
  if (!hasCredentials()) {
    throw new Error('FT_CLIENT_ID / FT_CLIENT_SECRET manquants dans .env');
  }
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: process.env.FT_CLIENT_ID,
    client_secret: process.env.FT_CLIENT_SECRET,
    scope: SCOPE,
  });
  const res = await fetchImpl(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  if (!res.ok) {
    throw new Error(`Échec authentification France Travail (${res.status})`);
  }
  const data = await res.json();
  cachedToken = {
    accessToken: data.access_token,
    expiresAt: Date.now() + (data.expires_in || 1500) * 1000,
  };
  return cachedToken.accessToken;
}

function parseContentRange(header) {
  // Format attendu : "offres 0-149/437"
  if (!header) return null;
  const match = header.match(/(\d+)-(\d+)\/(\d+)/);
  if (!match) return null;
  return { start: Number(match[1]), end: Number(match[2]), total: Number(match[3]) };
}

/**
 * Recherche paginée d'offres pour un jeu de paramètres donné (mots-clés + départements
 * + type de contrat). S'arrête quand toutes les offres disponibles sont récupérées ou
 * que la limite de fenêtre de l'API (1000-1149) est atteinte.
 */
export async function searchOffers(params, { fetchImpl = fetch } = {}) {
  const token = await getAccessToken(fetchImpl);
  const results = [];
  let start = 0;

  while (start <= RANGE_MAX_START) {
    const end = Math.min(start + RANGE_STEP - 1, RANGE_MAX_START + 149);
    const query = new URLSearchParams({ ...params, range: `${start}-${end}` });
    const res = await fetchImpl(`${BASE_URL}${SEARCH_PATH}?${query.toString()}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    });

    if (res.status === 204) break; // aucune offre
    if (!res.ok) {
      throw new Error(`Échec recherche France Travail (${res.status})`);
    }

    const data = await res.json();
    const offres = data.resultats || [];
    results.push(...offres);

    const range = parseContentRange(res.headers.get('content-range'));
    if (!range || range.end >= range.total - 1 || offres.length < RANGE_STEP) break;
    start = range.end + 1;
  }

  return results;
}

export function mapOffer(raw) {
  return {
    externalId: raw.id,
    title: raw.intitule,
    company: raw.entreprise?.nom || null,
    locationLabel: raw.lieuTravail?.libelle || null,
    departmentCode: (raw.lieuTravail?.codePostal || '').slice(0, 2) || null,
    description: raw.description || '',
    contractType: raw.typeContratLibelle || raw.typeContrat || '',
    url: raw.origineOffre?.urlOrigine || `https://candidat.francetravail.fr/offres/recherche/detail/${raw.id}`,
    dateCreated: raw.dateCreation || null,
    dateUpdated: raw.dateActualisation || null,
    raw,
  };
}
