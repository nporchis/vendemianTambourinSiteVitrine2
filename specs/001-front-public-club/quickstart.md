# Quickstart: Front public du club Vendémian Tambourin

**Feature**: `001-front-public-club` | **Date**: 2026-09-09

Guide de validation end-to-end de la feature une fois implémentée. Référez-vous à `data-model.md`
et `contracts/api.md` pour le détail des champs et endpoints.

## Prérequis

- Node.js 20 LTS, npm
- Un compte Cloudflare + CLI `wrangler` authentifié (`wrangler login`)
- Une base D1 créée (`wrangler d1 create vt-site-db`) et déclarée dans `wrangler.toml`
- Un namespace KV créé (`wrangler kv:namespace create RATE_LIMIT_KV`) et déclaré dans
  `wrangler.toml`, utilisé pour la limite de fréquence par IP du formulaire de contact (FR-020)
- Variables d'environnement (`.dev.vars` pour le dev local, secrets Wrangler en production) :
  - `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`
  - `EMAIL_PROVIDER_API_KEY`, `CLUB_NOTIFICATION_EMAIL`

## Installation

```bash
npm install
npx drizzle-kit migrate    # applique les migrations sur la base D1 (locale ou distante)
npm run seed                # jeu de données minimal : 1 compétition à venir, 1 passée avec résultat, 2 catégories photo, 3 photos, 1 club-info (4 chiffres clés), 4 membres du bureau, 5 partenaires sur 3 niveaux
npm run dev                 # next dev, pour un développement rapide sans bindings Cloudflare
npm run preview             # build OpenNext + `wrangler pages dev`, pour tester avec les bindings Cloudflare (D1, Turnstile)
```

## Scénarios de validation (alignés sur les User Stories du spec)

### 1. Découvrir le club (US1, P1)

1. Ouvrir `/` sans authentification.
2. Vérifier la présence du nom du club, d'une présentation courte, des 4 chiffres clés (FR-024)
   et du bloc « Prochain match » avec un compte à rebours qui décroît (FR-025).
3. Activer « réduire les animations » (DevTools → Rendering → `prefers-reduced-motion: reduce`),
   recharger : le compte à rebours ne s'anime plus chaque seconde.
4. Passer la date de la seule compétition à venir dans le passé (`wrangler d1 execute`), recharger :
   le bloc « Prochain match » n'est plus affiché.
5. Naviguer vers `/le-club` : histoire, valeurs, membres du bureau au format « Prénom X. — rôle »
   (FR-026). Naviguer vers `/le-tambourin` : règles, schéma du terrain, rôles, frise avec 1923
   (FR-022).
6. Vérifier sur chaque page la navigation Accueil / Le tambourin / Le club / Calendrier / Galerie /
   Partenaires / Contact et la page courante signalée (FR-027).

**Attendu**: pages accessibles sans connexion, contenu visible (FR-001, FR-002, FR-008, FR-022,
FR-024–FR-027).

### 2. Consulter le calendrier (US2, P1)

1. Ouvrir `/calendrier` avec le jeu de données seedé.
2. Vérifier qu'une compétition à venir s'affiche avec nom/date/lieu, séparée des compétitions
   passées.
3. Vérifier qu'une compétition passée avec `result` renseigné affiche son résultat (FR-016).
4. Vider la table `Competition` et recharger : vérifier le message d'état vide (FR-011).

### 3. Parcourir la galerie (US3, P2)

1. Ouvrir `/galerie` avec plus de 12 photos seedées (pour que la pagination soit exercée).
2. Vérifier l'affichage des photos avec lazy-loading (network throttling mobile dans les DevTools).
3. Filtrer par catégorie/événement et vérifier que seules les photos de la catégorie s'affichent
   (FR-015).
4. Faire défiler jusqu'au bas des photos déjà chargées et vérifier qu'une page suivante se charge
   automatiquement, sans clic (FR-018) ; répéter jusqu'à épuisement (`nextCursor: null`) et vérifier
   qu'aucun nouvel appel n'est déclenché à ce moment.
5. Vider la table `Photo` et recharger : vérifier le message d'état vide (FR-011).

### 4. Partenaires et contact (US4, P3)

1. Ouvrir `/partenaires` : partenaires groupés principal → soutien → institutionnel ; un partenaire
   avec site s'ouvre dans un nouvel onglet, un partenaire sans site n'est pas cliquable (FR-005).
2. Cliquer « Devenir partenaire » → `/contact?sujet=partenariat` avec « Partenariat » présélectionné ;
   tester aussi « Viens essayer » (accueil) et « Envoyer mes photos » (galerie), puis
   `/contact?sujet=inconnu` → aucune présélection (FR-023).
3. Ouvrir `/contact`, soumettre le formulaire (prénom, nom, email, sujet, message) avec des données
   valides + valider le challenge Turnstile → vérifier le message de confirmation (FR-006, FR-007,
   FR-012) et que l'email reçu par le club mentionne le sujet.
3. Vérifier en base qu'une ligne `ContactRequest` a été créée avec `purgeAt` = `submittedAt` + 12
   mois (FR-014), `notificationSentAt` renseigné, et qu'un email de notification a été envoyé au
   club (FR-017).
4. Soumettre le formulaire avec un email invalide → vérifier le message d'erreur explicite et la
   conservation des autres champs saisis (FR-007, Edge Case).
5. Vérifier que la mention RGPD est visible avant l'envoi (FR-013) et que le lien qu'elle contient
   ouvre bien `/politique-de-confidentialite` (FR-019).
6. Simuler un échec du provider email (ex. `EMAIL_PROVIDER_API_KEY` invalide en local) et soumettre
   le formulaire → vérifier une erreur `502` explicite côté client (pas de confirmation de succès),
   puis vérifier en base que la ligne `ContactRequest` a quand même été créée, avec
   `notificationSentAt = null` (FR-017).
7. Soumettre le formulaire 6 fois de suite depuis la même IP (dépassant le seuil proposé de 5/heure)
   → vérifier que la 6ᵉ soumission retourne une erreur `429` explicite (FR-020).

### 5. Politique de confidentialité et page 404 (FR-019, FR-021)

1. Ouvrir `/politique-de-confidentialite` directement → vérifier que la page s'affiche, dans le
   style du site, sans authentification (FR-019).
2. Ouvrir une URL inexistante (ex. `/page-qui-n-existe-pas`) → vérifier l'affichage d'une page 404
   personnalisée, dans le style du site, avec un lien de retour vers l'accueil (FR-021).

### 6. Mise à jour de contenu sans redéploiement (SC-005)

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

Vérifier LCP, CLS, INP au niveau "Good" sur les 9 pages publiques (les 7 pages de contenu +
politique de confidentialité + 404), et absence de violations critiques WCAG AA dans le rapport
Lighthouse/axe-core.
