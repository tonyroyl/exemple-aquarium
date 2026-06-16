# Onde — Direction visuelle & identité

> Maquette d'exploration. Objectif : fixer l'identité (nom, palette, typo, poissons,
> lumière, écrans) **avant** d'écrire le moteur de rendu canvas/WebGL.

---

## 1. Nom

**Onde** — proposition principale.

- Mot unique, français, court, contemplatif. Évoque l'ondulation de l'eau et de la lumière.
- Se prononce à l'international, fonctionne comme marque.
- Wordmark en bas-de-casse : `onde` — discret, jamais en capitales criardes.

Alternatives explorées :
- **Lull** — la accalmie, l'apaisement. Plus anglo, très « slow ».
- **Abysse** — plus profond, plus sombre ; pousse vers une identité nocturne dominante.

> La maquette utilise **Onde**. Le nom est isolé dans une seule variable
> (`--app-name` / `data-name`) pour être changé en un endroit.

---

## 2. Palette

Reprend strictement la direction du projet, organisée en tokens.

### Eau — Jour
| Token | Hex | Rôle |
|---|---|---|
| `--water-day-1` | `#0a4a6e` | Haut / surface |
| `--water-day-2` | `#1a8fa8` | Milieu |
| `--water-day-3` | `#2dd4bf` | Profondeur lumineuse |

Dégradé vertical `#0a4a6e → #1a8fa8 → #2dd4bf`.

### Eau — Nuit
| Token | Hex | Rôle |
|---|---|---|
| `--water-night-1` | `#050d1a` | Haut / surface |
| `--water-night-2` | `#0a2540` | Milieu |
| `--water-night-3` | `#0d3b4a` | Profondeur |

Dégradé vertical `#050d1a → #0a2540 → #0d3b4a`.

### Lumière & accents
| Token | Hex | Opacité d'usage | Rôle |
|---|---|---|---|
| `--light` | `#e0f7ff` | 0.05 – 0.15 | Caustiques, god rays, écume |
| `--accent` | `#5fd9c8` | 0.6 – 1.0 | Accent UI (turquoise désaturé) |
| `--ink` | `#dff3f0` | 0.7 – 0.9 | Texte UI sur l'eau |
| `--ink-dim` | `#8fb8be` | 0.5 | Texte secondaire / labels |

**Règle absolue :** aucune couleur primaire pure. Les accents restent désaturés.

---

## 3. Système typographique

UI minimale, trois usages seulement.

| Usage | Police | Graisse | Traitement |
|---|---|---|---|
| Wordmark / titre app | Sans-serif géométrique | 300 (Light) | `letter-spacing: 0.35em`, bas-de-casse |
| Compteur de poissons | Sans-serif géométrique | 200 (Thin) | Chiffres tabulaires, grands, alignés |
| Labels & bouton « Nourrir » | Sans-serif | 400 (Regular) | `letter-spacing: 0.15em`, petites capitales optiques |

- Pile recommandée : **Space Grotesk** ou **Outfit** (géométrique léger),
  fallback `system-ui, -apple-system, "Segoe UI", sans-serif`.
- Le **chiffre** est la seule donnée mise en avant. Tout le reste s'efface.
- Échelle : titre `0.8rem`, compteur `2.5rem`, labels `0.7rem`. Petit, aéré, respirant.

---

## 4. Poissons — 4 espèces stylisées

Style **flat élégant** : silhouettes nettes, dégradés doux internes, zéro contour cartoon,
zéro œil exagéré. Chaque espèce a une fonction de composition (taille / profondeur / rythme).

| # | Espèce | Silhouette | Rôle visuel | Mouvement |
|---|---|---|---|---|
| 1 | **Voile** (koï à voiles) | Long corps, nageoires fluides | Pièce maîtresse, premier plan | Lent, ample, queue très ondulante |
| 2 | **Lame** (poisson-ange) | Triangle haut, fin | Verticalité, contraste de forme | Moyen, vire en courbe |
| 3 | **Vif** (tétra) | Fuselé, petit | Nuée, scintillement | Rapide, saccades douces, boids |
| 4 | **Planeur** (raie) | Disque aplati | Fond, profondeur, calme | Très lent, plane au sol, flou de profondeur |

Conventions de nage (pour le futur moteur) :
- Trajectoires en **courbes de Bézier**, jamais linéaires.
- Oscillation de queue **synchronisée à la vitesse** (plus vite = battement plus rapide).
- **Boids** sur les Vifs : séparation / alignement / cohésion.
- Poissons de fond : **flou de profondeur** + opacité réduite (0.5–0.7).

---

## 5. Ambiance lumineuse

- **Caustiques** : voiles clairs `--light` à 0.05–0.12, dérive < 0.5 px/frame, échelle large.
- **God rays** : 2–3 faisceaux diagonaux descendant de la surface, très doux, additifs.
- **Bulles** : remontée continue, tailles/vitesses variées, légère dérive latérale, fondu en haut.
- **Vignette** : assombrissement subtil des bords pour concentrer le regard.
- Nuit : caustiques et god rays quasi éteints, bulles plus rares, ambiance abyssale.

---

## 6. Écrans (maquette)

1. **Aquarium plein écran** — la scène vivante. UI réduite : wordmark (haut-gauche),
   compteur de poissons (haut-droite), bouton « Nourrir » (bas-centre). Tout est translucide.
2. **Panneau de réglages** — discret, translucide (`backdrop-blur`), apparaît au survol/clic
   de l'engrenage. Trois réglages : **Vitesse**, **Densité**, **Thème** (jour/nuit).
3. **État vide / nuit** — aquarium nocturne sans poissons : surface au repos, quelques bulles
   lointaines, lumière éteinte. Démontre le calme absolu et le mode « fond d'écran » sans UI.

Mode **fond d'écran** : un geste masque toute l'UI ; ne reste que l'eau vivante.

---

## 7. Notes techniques (cible d'implémentation)

- 60 fps constant via `requestAnimationFrame`, rendu **canvas/WebGL** (la maquette HTML/CSS
  ci-jointe ne sert qu'à valider le look, pas la perf).
- Tous les paramètres visuels exposés en **variables CSS / constantes en tête de fichier**.
- Pas de reflow DOM coûteux dans la boucle d'animation.

---

## Fichiers

- `DESIGN.md` — ce document.
- `index.html` — **moteur WebGL temps réel** (la version réaliste, ci-dessous).
- `styleguide.html` — maquette flat de référence (tokens, 3 écrans, jour/nuit).

---

## 8. Moteur WebGL (`index.html`)

Implémentation temps réel auto-contenue, sans dépendance externe (les polices
Google sont décoratives, fallback `system-ui`). Rendu en plusieurs passes :

**Pipeline de rendu**
1. **Fond** (fragment shader plein écran) : dégradé d'eau jour/nuit + **caustiques**
   itératives (domaine ondulé, dérive lente) atténuées vers le fond + **god rays**
   diagonaux + grain de profondeur.
2. **Poissons** : vrais maillages (triangle strip de 72 segments) générés par espèce.
   Le vertex shader applique l'**ondulation de la colonne** — onde sinusoïdale voyageant
   queue→tête, amplitude max à la queue, **synchronisée à la vitesse**. Cap/miroir gérés
   pour garder le ventre vers le bas. Brume de profondeur + bords adoucis = **flou de profondeur**.
3. **Bulles & nourriture** : points additifs (glow).
4. **Post-traitement** : scène → FBO, extraction des hautes lumières → **bloom** séparable
   (demi-résolution) → composite avec tone-mapping doux, vignette et grain.

**Simulation**
- **Boids** par espèce : séparation / alignement / cohésion + errance + maintien dans
  le cadre. Les **Vifs** forment des nuées serrées et rapides ; **Voile** et **Planeur**
  restent lents et solitaires ; le **Planeur** patrouille le fond (`band`).
- **Nourrir** : lâche des granulés qui coulent ; les poissons proches passent en
  comportement d'approche et les « mangent » (petite bulle à la clé).

**Réglages live** : Vitesse (limite de vélocité + cadence de queue), Densité
(0–60 poissons, recomposés à la volée), Thème (couleurs/caustiques/rays interpolés
en douceur). **Double-clic** = mode fond d'écran (UI masquée). L'**état vide / nuit**
= densité 0 + thème nuit.

**Perf** : `requestAnimationFrame`, `devicePixelRatio` plafonné à 1.75, bloom en
demi-résolution, boids O(n²) borné (n ≤ 60). Repli gracieux si WebGL absent → lien
vers `styleguide.html`.

> Tous les tokens visuels restent centralisés : `:root` (UI) et la table `THEMES` /
> `SPECIES` en tête de script (couleurs, vitesses, profils de silhouette).
