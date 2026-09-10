# Quickstart: Front public du club Vendémian Tambourin

**Feature**: `001-front-public-club` | **Date**: 2026-09-09

Guide de validation end-to-end de la feature une fois implémentée. Référez-vous à `data-model.md`
et `contracts/api.md` pour le détail des champs et endpoints.

## Prérequis

- Node.js 20 LTS, npm
- Un compte Cloudflare + CLI `wrangler` authentifié (`wrangler login`)
- Une base D1 créée (`wrangler d1 create vt-site-db`) et déclarée dans `wrangler.toml`
- Variables d'environnement (`.dev.vars` pour le dev local, secrets Wrangler en production) :
  - `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`
  - `EMAIL_PROVIDER_API_KEY`, `CLUB_NOTIFICATION_EMAIL`

## Installation

```bash
npm install
npx drizzle-kit migrate    # applique les migrations sur la base D1 (locale ou distante)
npm run seed                # jeu de données minimal : 1 compétition à venir, 1 passée avec résultat, 2 catégories photo, 3 photos, 1 club-info, 2 liens utiles
npm run dev                 # next dev, pour un développement rapide sans bindings Cloudflare
npm run preview             # build OpenNext + `wrangler pages dev`, pour tester avec les bindings Cloudflare (D1, Turnstile)
```

## Scénarios de validation (alignés sur les User Stories du spec)

### 1. Découvrir le club (US1, P1)

1. Ouvrir `/` sans authentification.
2. Vérifier la présence du nom du club, d'une présentation courte, et des liens vers calendrier,
   galerie, contact.
3. Naviguer vers `/presentation` et vérifier histoire, valeurs, encadrement/équipe.

**Attendu**: pages accessibles sans connexion, contenu visible (FR-001, FR-002, FR-008).

### 2. Consulter le calendrier (US2, P1)

1. Ouvrir `/calendrier` avec le jeu de données seedé.
2. Vérifier qu'une compétition à venir s'affiche avec nom/date/lieu, séparée des compétitions
   passées.
3. Vérifier qu'une compétition passée avec `result` renseigné affiche son résultat (FR-016).
4. Vider la table `Competition` et recharger : vérifier le message d'état vide (FR-011).

### 3. Parcourir la galerie (US3, P2)

1. Ouvrir `/galerie`.
2. Vérifier l'affichage des photos avec lazy-loading (network throttling mobile dans les DevTools).
3. Filtrer par catégorie/événement et vérifier que seules les photos de la catégorie s'affichent
   (FR-015).
4. Vider la table `Photo` et recharger : vérifier le message d'état vide (FR-011).

### 4. Liens utiles et contact (US4, P3)

1. Ouvrir `/liens-utiles`, vérifier que chaque lien s'ouvre dans un nouvel onglet.
2. Ouvrir `/contact`, soumettre le formulaire avec des données valides + valider le challenge
   Turnstile → vérifier le message de confirmation (FR-006, FR-007, FR-012).
3. Vérifier en base qu'une ligne `ContactRequest` a été créée avec `purgeAt` = `submittedAt` + 12
   mois (FR-014), et qu'un email de notification a été envoyé au club.
4. Soumettre le formulaire avec un email invalide → vérifier le message d'erreur explicite et la
   conservation des autres champs saisis (FR-007, Edge Case).
5. Vérifier que la mention RGPD est visible avant l'envoi (FR-013).

### 5. Mise à jour de contenu sans redéploiement (SC-005)

1. Modifier directement une ligne `club_info` ou `competition` en base D1 (ex. `wrangler d1
   execute vt-site-db --command "UPDATE club_info SET values = '...' WHERE id = '...'"`), sans
   toucher au code ni relancer de build.
2. Recharger la page concernée (`/` ou `/calendrier`) et vérifier que le changement est visible
   immédiatement.

**Attendu**: le contenu est piloté par la base D1, aucune recompilation/redéploiement n'est
nécessaire pour qu'une mise à jour de contenu soit visible (FR-009, SC-005).

## Tests automatisés

```bash
npm run test        # Vitest — validation des schémas, logique de statut compétition, purge 12 mois
npm run test:e2e     # Playwright — parcours des 4 scénarios ci-dessus + audit a11y (axe-core)
```

## Vérification performance/accessibilité (principe II)

```bash
npm run preview
npx lighthouse http://localhost:8788 --preset=mobile
```

Vérifier LCP, CLS, INP au niveau "Good" sur les 6 pages publiques, et absence de violations
critiques WCAG AA dans le rapport Lighthouse/axe-core.
