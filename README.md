# Saisonnier Logé — PWA d'offres saisonnières logées (hôtellerie-restauration)

Application web installable sur mobile (PWA) qui agrège les offres d'emploi **saisonnières
logées** en hôtellerie-restauration (bar, salle, management) sur des destinations cibles
configurables (Saint-Barthélemy, Suisse, Alpes françaises, Corse, Polynésie française,
Outre-Mer...), et centralise les recherches sur les sites qui n'ont pas d'API.

## Stack et choix techniques

| Composant | Choix | Pourquoi |
|---|---|---|
| Back-end | Node.js + Express | Léger, un seul langage avec le front, écosystème mature |
| Base de données | **`node:sqlite`** (module natif de Node ≥ 22, pas de dépendance externe) | SQLite reste le choix le plus simple à lancer en local, comme suggéré ; le module natif de Node évite toute compilation native (`better-sqlite3` nécessite un toolchain C++) et fonctionne "out of the box" |
| Tâche planifiée | `node-cron` | Suggestion initiale, simple et fiable |
| Front | React (Vite) en PWA | Suggestion initiale ; Vite donne un build de prod rapide et un mode dev avec rechargement à chaud |
| PWA | `vite-plugin-pwa` (manifest + service worker généré) | Génère automatiquement un service worker robuste (Workbox) et le manifest installable |
| Tests back-end | Runner de test natif de Node (`node --test`) + `supertest` | Aucune dépendance de test à ajouter (Vitest/Jest), suffisant pour des fonctions pures + routes Express |

Le front est **buildé et servi directement par le serveur Express** (un seul process,
un seul port) : c'est le plus simple à démarrer et à installer sur mobile, pas besoin de
CORS ni de reverse proxy en production. En développement, `vite` tourne sur son propre port
avec un proxy vers l'API (voir plus bas).

## Arborescence

```
server/            API Express + SQLite + sync France Travail + cron
  src/config/       destinations cibles, catégories de postes, mots-clés, patterns "logé"
  src/services/     scoring.js, links.js (liens intelligents), francetravail.js, sync.js
  src/routes/       jobs, destinations, links, meta (badge / sync)
  src/data/         offres de démonstration (mode sans clé API)
  tests/            37 tests (node --test)
web/                React + Vite + PWA (manifest, service worker, icônes)
```

## Lancer l'application

Prérequis : Node.js ≥ 22 (pour `node:sqlite`).

```bash
npm install        # installe les deux workspaces (server + web)
npm test           # lance les 37 tests back-end (node --test)
npm start          # build le front (web/dist) puis démarre le serveur sur http://localhost:3000
```

Ouvrez `http://localhost:3000` sur votre téléphone (ou passez Chrome en mode "responsive
mobile" sur desktop) : l'app propose alors "Ajouter à l'écran d'accueil" / "Installer
l'application" comme n'importe quelle PWA.

Pour développer avec rechargement à chaud du front :
```bash
npm run dev:server   # terminal 1 : API sur :3000
npm run dev:web      # terminal 2 : Vite sur :5173, proxy /api vers :3000
```

Tant qu'aucune clé France Travail n'est configurée, l'app tourne avec **12 offres de
démonstration** (`server/src/data/mock-offers.js`) couvrant les 6 destinations et les 3
types de poste, avec un mélange volontaire d'offres logées / non logées pour vérifier le
tri par score et les filtres.

## Fonctionnement

- **France Travail (API officielle)** : `server/src/services/francetravail.js` s'authentifie
  en OAuth2 *client_credentials*, puis interroge `/partenaire/offresdemploi/v2/offres/search`
  avec segmentation **par destination × par catégorie de poste × par département**, en
  paginant par fenêtres de 150 jusqu'à la limite de l'API (dernière fenêtre `1000-1149`).
  `server/src/services/sync.js` orchestre cette boucle, calcule un score par offre
  (`services/scoring.js`) et upsert en base par `external_id` (déduplication).
- **Score de pertinence** (`services/scoring.js`, testé dans `tests/scoring.test.js`) :
  logement mentionné (+50, le critère le plus important), contrat saisonnier (+15),
  poste correspondant à la catégorie (+25 titre / +10 description), destination confirmée
  dans le texte (+10). La détection du logement gère aussi les tournures négatives
  ("pas de logement", "logement non fourni") pour éviter les faux positifs.
- **Liens intelligents** (`services/links.js`) : URLs de recherche pré-filtrées vers Indeed,
  Jooble, APEC (cadres) et L'Hôtellerie-Restauration (pages de territoire vérifiées :
  `/emploi/corse`, `/emploi/suisse`, `/emploi/saint-barthelemy`, `/emploi/outre-mer`...),
  plus une liste de liens statiques vers des espaces de recrutement directs (Le Barthélemy
  Hôtel & Spa, Cheval Blanc) à enrichir vous-même.
- **Sources manuelles** : rappel des groupes Facebook et de News de Saint-Barth à consulter
  vous-même (pas d'API, pas de scraping).
- **Badge "nouvelles offres"** : compare `first_seen_at` des offres à la date de dernière
  visite (`app_meta.last_visit_at`), remis à zéro à la visite de l'onglet "Offres".
- **Destinations configurables** : ajout / activation / désactivation / suppression depuis
  l'onglet "Destinations" (persisté en base, table `destinations`).

## Obtenir une clé France Travail (francetravail.io)

1. Aller sur **https://francetravail.io** et créer un compte (bouton "Se connecter" /
   "Créer un compte") avec une adresse e-mail professionnelle.
2. Une fois connecté, aller dans **"Mes applications"** (espace développeur) puis cliquer sur
   **"Créer une application"**.
3. Donner un nom à l'application (ex. `saisonnier-loge`), puis dans la liste des API
   proposées, **souscrire à l'API "Offres d'emploi v2"** (`api_offresdemploiv2`).
4. Une fois l'application créée, France Travail génère un **Identifiant client (Client ID)**
   et une **Clé secrète (Client Secret)** — la clé secrète ne s'affiche généralement qu'une
   seule fois : copiez-la immédiatement.
5. Ouvrez `server/.env` (copiez `server/.env.example` si le fichier n'existe pas encore :
   `cp server/.env.example server/.env`) et collez vos identifiants :
   ```
   FT_CLIENT_ID=votre_identifiant_client
   FT_CLIENT_SECRET=votre_cle_secrete
   ```
6. Relancez `npm start` (ou `npm run dev:server`). Le message d'avertissement "mode
   démonstration" disparaît, et la tâche planifiée (toutes les 6h par défaut, réglable via
   `SYNC_CRON` dans `.env`) interroge désormais la vraie API au démarrage puis
   périodiquement. Vous pouvez aussi déclencher une synchronisation manuelle avec
   `npm run seed --workspace server`.

**Important** : ne committez jamais `server/.env` (déjà exclu par `.gitignore`) — les
identifiants ne doivent jamais être codés en dur dans le dépôt.

## Limites connues / à enrichir

- Les URLs de recherche Indeed / L'Hôtellerie-Restauration ont été vérifiées manuellement
  (formats réels observés) ; Jooble n'expose pas de code région public documenté, donc le
  lien intègre la destination directement dans le mot-clé plutôt qu'un paramètre régional.
- France Travail ne couvre pas (ou très peu) la Suisse et la Polynésie française : ces
  destinations s'appuient presque entièrement sur les liens intelligents et les sources
  manuelles — c'est signalé dans l'interface.
- La liste "Espaces de recrutement directs" (Werecruit, Cheval Blanc...) est volontairement
  minimale : à enrichir dans `server/src/services/links.js` (`STATIC_EMPLOYER_LINKS`) au fil
  de vos recherches.
