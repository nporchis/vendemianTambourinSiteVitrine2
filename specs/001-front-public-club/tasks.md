---

description: "Task list template for feature implementation"
---

# Tasks: Front public du club Vendémian Tambourin

**Input**: Design documents from `/specs/001-front-public-club/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api.md, quickstart.md

**Tests**: Le plan (`plan.md` → Testing) et le quickstart (`quickstart.md` → Tests automatisés)
prescrivent explicitement Vitest (unitaire/intégration) et Playwright + `@axe-core/playwright`
(E2E + a11y) comme livrables de la feature ; les tâches de test sont donc incluses ci-dessous.

**Organization**: Tâches groupées par user story (US1–US4, priorités du spec.md) pour permettre une
implémentation et une validation indépendantes de chaque parcours.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Peut s'exécuter en parallèle (fichiers différents, pas de dépendance bloquante)
- **[Story]**: User story concernée (US1, US2, US3, US4)
- Chemins de fichiers exacts inclus dans chaque description

## Path Conventions

Projet Next.js (App Router) unique (voir `plan.md` → Project Structure) :
`src/app/**/page.tsx`, `src/app/api/**/route.ts`, `src/components/**`, `src/lib/**`, `drizzle/**`,
`tests/{unit,integration,e2e}/**`, `wrangler.toml` et `open-next.config.ts` à la racine.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialisation du projet Next.js/Cloudflare et de l'outillage partagé

- [ ] T001 Initialiser le projet Next.js (App Router, TypeScript strict) avec
      `npx create-next-app@latest`, installer et configurer l'adapter `@opennextjs/cloudflare`
      (`open-next.config.ts`)
- [ ] T002 [P] Installer et configurer Tailwind CSS (intégration officielle Next.js) et créer
      `src/styles/globals.css`
- [ ] T003 [P] Installer Drizzle ORM + `drizzle-kit`, créer `drizzle.config.ts` ciblant un binding
      D1 nommé `DB`
- [ ] T004 [P] Créer `wrangler.toml` : projet Pages/Workers, binding D1 `DB` (base créée via
      `wrangler d1 create vt-site-db`), configuration du Cron Trigger de purge (voir T051)
- [ ] T005 [P] Configurer ESLint + Prettier pour TypeScript/Next.js (`.eslintrc`, `.prettierrc`)
- [ ] T006 [P] Installer l'outillage de test : Vitest, Playwright, `@axe-core/playwright` ; ajouter
      les scripts npm `test`, `test:e2e` et `preview` (build OpenNext + `wrangler pages dev`) dans
      `package.json`
- [ ] T007 [P] Créer `.dev.vars.example` documentant les variables d'environnement requises :
      `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`, `EMAIL_PROVIDER_API_KEY`,
      `CLUB_NOTIFICATION_EMAIL`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Schéma de données, client DB, layout et infrastructure partagée par toutes les user
stories

**⚠️ CRITICAL**: Aucune user story ne peut démarrer avant la fin de cette phase

- [ ] T008 Définir le schéma Drizzle complet dans `drizzle/schema.ts` avec les tables suivantes
      (types et règles exactes de `data-model.md`) :
      - `competition` : `id` (UUID, PK), `name` (requis), `date` (datetime, requis), `location`
        (requis), `description` (nullable), `result` (nullable, résultat affiché uniquement si
        compétition passée)
      - `photo_category` : `id` (UUID, PK), `name` (requis, unique)
      - `photo` : `id` (UUID, PK), `image_url` (requis), `caption` (nullable), `category_id` (FK →
        `photo_category`, requis), `taken_or_event_date` (datetime, nullable)
      - `club_info` : `id` (PK fixe, singleton), `history_text` (requis), `values` (requis),
        `team_info` (nullable), `contact_email` (requis, format email), `contact_phone`
        (nullable), `social_links` (JSON array `{label, url}`, optionnel)
      - `useful_link` : `id` (UUID, PK), `label` (requis), `url` (requis, valide), `category`
        (nullable)
      - `contact_request` : `id` (UUID, PK), `name` (requis), `email` (requis, format email),
        `message` (requis), `submitted_at` (datetime, généré serveur), `captcha_verified`
        (boolean, doit être `true` avant tout enregistrement), `rgpd_notice_acknowledged`
        (boolean, doit être `true`), `purge_at` (datetime = `submitted_at` + 12 mois)
- [ ] T009 Générer et appliquer la migration initiale (`npx drizzle-kit generate` puis
      `npx drizzle-kit migrate`) dans `drizzle/migrations/`
- [ ] T010 [P] Implémenter le client Drizzle + accès au binding D1 dans `src/lib/db.ts`
- [ ] T011 [P] Implémenter les helpers Zod partagés dans `src/lib/validation.ts` (validateurs
      réutilisables : chaîne non vide, format email RFC 5322 simplifié, URL valide)
- [ ] T012 [P] Créer le layout racine `src/app/layout.tsx` (Server Component : HTML sémantique,
      meta, lien d'évitement clavier, structure WCAG AA)
- [ ] T013 [P] Créer les composants de layout `src/components/layout/Header.tsx` (Server Component :
      nom du club, navigation vers les 6 pages publiques) et `src/components/layout/Footer.tsx`
- [ ] T014 [P] Créer le helper de réponse API `src/lib/api-response.ts` implémentant le format
      d'erreur standard `{ "errors": { "<champ>": "<message>" } }` de `contracts/api.md`
- [ ] T015 Créer le script de seed `scripts/seed.ts` (exposé via `npm run seed`) : 1 compétition à
      venir, 1 compétition passée avec `result` renseigné, 2 `photo_category`, 3 `photo`, 1
      `club_info`, 2 `useful_link` (jeu de données de `quickstart.md`)

**Checkpoint**: Schéma, DB, layout et validation partagés prêts — les user stories peuvent démarrer

---

## Phase 3: User Story 1 - Découvrir le club (Priority: P1) 🎯 MVP

**Goal**: Un visiteur non authentifié comprend ce qu'est le club via l'accueil et la présentation
(FR-001, FR-002, FR-008)

**Independent Test**: Accéder à `/` et `/presentation` sans connexion et vérifier la présence du
nom du club, d'une présentation courte, des points d'entrée (calendrier, galerie, contact),
l'histoire, les valeurs et les infos d'encadrement

### Tests for User Story 1

- [ ] T016 [P] [US1] Test E2E Playwright `tests/e2e/discover-club.spec.ts` : ouvrir `/` sans
      authentification, vérifier nom du club + présentation courte + liens vers calendrier/galerie/
      contact ; ouvrir `/presentation`, vérifier histoire/valeurs/encadrement ; inclure un audit
      `@axe-core/playwright` sur les deux pages
- [ ] T017 [P] [US1] Test unitaire Vitest `tests/unit/club-info-schema.test.ts` : valider le schéma
      Zod `ClubInfo` (rejet si `historyText`, `values` ou `contactEmail` manquants ou email au
      format invalide)

### Implementation for User Story 1

- [ ] T018 [P] [US1] Ajouter le schéma Zod `ClubInfoSchema` dans `src/lib/validation.ts` :
      `historyText` requis, `values` requis, `teamInfo` optionnel, `contactEmail` requis au format
      email valide, `contactPhone` optionnel, `socialLinks` tableau optionnel de `{label, url}`
- [ ] T019 [US1] Implémenter `GET /api/club-info` dans `src/app/api/club-info/route.ts` : lit la
      ligne singleton `club_info` via `src/lib/db.ts` et retourne le JSON conforme à
      `contracts/api.md`
- [ ] T020 [US1] Implémenter `src/app/page.tsx` (Accueil, FR-001, Server Component) : nom du club,
      présentation courte et liens vers `/calendrier`, `/galerie`, `/contact`, à partir de `GET
      /api/club-info`
- [ ] T021 [US1] Implémenter `src/app/presentation/page.tsx` (FR-002, Server Component) : histoire
      (`historyText`), valeurs (`values`) et infos d'encadrement/équipe (`teamInfo`) à partir de
      `GET /api/club-info`

**Checkpoint**: US1 fonctionnelle et testable indépendamment (MVP)

---

## Phase 4: User Story 2 - Consulter le calendrier des compétitions (Priority: P1)

**Goal**: Afficher les compétitions à venir et passées avec nom/date/lieu, résultat optionnel pour
les compétitions passées, et un état vide explicite (FR-003, FR-011, FR-016)

**Independent Test**: Ouvrir `/calendrier` avec des données seedées et vérifier la séparation
à venir/passées, l'affichage du résultat pour une compétition passée, puis vider la table et
vérifier le message d'état vide

### Tests for User Story 2

- [ ] T022 [P] [US2] Test E2E Playwright `tests/e2e/calendrier.spec.ts` : compétition à venir
      visible avec nom/date/lieu ; compétition passée avec `result` affiche son résultat ; table
      vidée → message d'état vide explicite (FR-011) ; audit `@axe-core/playwright`
- [ ] T023 [P] [US2] Test unitaire Vitest `tests/unit/competition-status.test.ts` : la fonction de
      dérivation de statut retourne `upcoming` si `date` ≥ maintenant, `past` sinon ; `result` n'est
      exposé côté affichage que si `status = past`

### Implementation for User Story 2

- [ ] T024 [P] [US2] Ajouter le schéma Zod `CompetitionSchema` dans `src/lib/validation.ts` :
      `name`, `date`, `location` requis et non vides ; `description` et `result` optionnels
- [ ] T025 [US2] Implémenter la fonction de dérivation de statut et de tri dans
      `src/lib/competitions.ts` (`status: 'upcoming' | 'past'` dérivé de `date` vs. date courante,
      non stocké ; tri par date décroissante)
- [ ] T026 [US2] Implémenter `GET /api/competitions` dans `src/app/api/competitions/route.ts` :
      liste les compétitions via `src/lib/db.ts` et `src/lib/competitions.ts`, retourne `[]` si
      aucune compétition (FR-011)
- [ ] T027 [P] [US2] Créer `src/components/competitions/CompetitionList.tsx` (Server Component) :
      affiche les compétitions à venir séparément des passées, résultat affiché uniquement si
      `status = past` et `result` non nul (FR-016)
- [ ] T028 [US2] Implémenter `src/app/calendrier/page.tsx` (FR-003, Server Component) : consomme
      `GET /api/competitions`, utilise `CompetitionList`, affiche un message d'état vide explicite
      si la liste est vide (FR-011)

**Checkpoint**: US1 et US2 fonctionnelles indépendamment

---

## Phase 5: User Story 3 - Parcourir la galerie photo (Priority: P2)

**Goal**: Afficher les photos du club regroupées/filtrables par événement ou catégorie, avec
chargement progressif et état vide explicite (FR-004, FR-011, FR-015)

**Independent Test**: Ouvrir `/galerie`, vérifier l'affichage lisible et le lazy-loading, filtrer
par catégorie, puis vider la table `Photo` et vérifier le message d'état vide

### Tests for User Story 3

- [ ] T029 [P] [US3] Test E2E Playwright `tests/e2e/galerie.spec.ts` : photos affichées avec
      lazy-loading (vérifier le comportement `next/image` / throttling réseau) ; filtre par
      catégorie ne montre que les photos de la catégorie sélectionnée (FR-015) ; table vidée →
      message d'état vide (FR-011) ; audit `@axe-core/playwright`

### Implementation for User Story 3

- [ ] T030 [P] [US3] Ajouter les schémas Zod `PhotoCategorySchema` (`name` requis, unique) et
      `PhotoSchema` (`imageUrl` requis, `categoryId` requis, `caption` et `takenOrEventDate`
      optionnels) dans `src/lib/validation.ts`
- [ ] T031 [US3] Implémenter `GET /api/photo-categories` dans
      `src/app/api/photo-categories/route.ts`
- [ ] T032 [US3] Implémenter `GET /api/photos` dans `src/app/api/photos/route.ts` avec filtrage
      optionnel par le paramètre de requête `categoryId`, retourne `[]` si aucune photo (FR-011)
- [ ] T033 [P] [US3] Configurer un loader d'image personnalisé compatible Cloudflare (Images/R2)
      pour `next/image` dans `next.config.ts` (l'optimisation d'image native n'étant pas disponible
      telle quelle sur Workers, cf. `research.md` §8)
- [ ] T034 [P] [US3] Créer `src/components/gallery/GalleryGrid.tsx` (Server Component) : grille de
      photos utilisant `next/image` pour le lazy-loading, groupées visuellement par catégorie
- [ ] T035 [P] [US3] Créer `src/components/gallery/CategoryFilter.tsx` (`"use client"`, Client
      Component React) : filtre les photos affichées par `categoryId` sans rechargement de page
      (FR-015)
- [ ] T036 [US3] Implémenter `src/app/galerie/page.tsx` (FR-004, Server Component) : consomme `GET
      /api/photo-categories` et `GET /api/photos`, intègre `GalleryGrid` et `CategoryFilter`,
      affiche un état vide explicite si aucune photo (FR-011)

**Checkpoint**: US1, US2 et US3 fonctionnelles indépendamment

---

## Phase 6: User Story 4 - Trouver des liens utiles et contacter le club (Priority: P3)

**Goal**: Lister les liens utiles externes et permettre l'envoi d'une demande de contact validée,
protégée anti-bot, avec mention RGPD et purge automatique à 12 mois (FR-005, FR-006, FR-007,
FR-012, FR-013, FR-014)

**Independent Test**: Ouvrir `/liens-utiles` et vérifier l'ouverture des liens en nouvel onglet ;
soumettre `/contact` avec des données valides + Turnstile → confirmation ; soumettre avec un email
invalide → erreur explicite sans perte de saisie

### Tests for User Story 4

- [ ] T037 [P] [US4] Test E2E Playwright `tests/e2e/liens-utiles.spec.ts` : chaque lien utile
      s'affiche avec son libellé et s'ouvre dans un nouvel onglet (`target="_blank"`) ; audit
      `@axe-core/playwright`
- [ ] T038 [P] [US4] Test E2E Playwright `tests/e2e/contact.spec.ts` : soumission valide + challenge
      Turnstile → message de confirmation ; soumission avec email invalide ou champ requis manquant
      → message d'erreur explicite, autres champs conservés ; mention RGPD visible avant envoi ;
      audit `@axe-core/playwright`
- [ ] T039 [P] [US4] Test d'intégration Vitest `tests/integration/contact-api.test.ts` :
      `POST /api/contact` contre une D1 de test — 201 si données valides + Turnstile vérifié ; 400
      si champ requis manquant/email invalide ; 403 si Turnstile invalide ; vérifie que la ligne
      `contact_request` créée a `purge_at = submitted_at + 12 mois`
- [ ] T040 [P] [US4] Test unitaire Vitest `tests/unit/purge-contact-requests.test.ts` : la logique
      de purge supprime uniquement les `contact_request` dont `purge_at <= now`

### Implementation for User Story 4

- [ ] T041 [P] [US4] Ajouter le schéma Zod `UsefulLinkSchema` (`label` et `url` requis, `category`
      optionnel) dans `src/lib/validation.ts`
- [ ] T042 [US4] Implémenter `GET /api/useful-links` dans `src/app/api/useful-links/route.ts`
- [ ] T043 [US4] Implémenter `src/app/liens-utiles/page.tsx` (FR-005, Server Component) : consomme
      `GET /api/useful-links`, chaque lien ouvert avec `target="_blank" rel="noopener noreferrer"`
- [ ] T044 [P] [US4] Ajouter le schéma Zod `ContactRequestSchema` dans `src/lib/validation.ts` :
      `name`, `email` (format email), `message` requis et non vides ; `captchaToken` requis ;
      `rgpdNoticeAcknowledged` doit être `true`
- [ ] T045 [P] [US4] Implémenter la vérification serveur Cloudflare Turnstile dans
      `src/lib/turnstile.ts` (appel `siteverify` avec `TURNSTILE_SECRET_KEY`)
- [ ] T046 [P] [US4] Implémenter l'envoi de notification email transactionnel dans
      `src/lib/email.ts` (provider externe, ex. Resend, via `EMAIL_PROVIDER_API_KEY` et
      `CLUB_NOTIFICATION_EMAIL`)
- [ ] T047 [US4] Implémenter `POST /api/contact` dans `src/app/api/contact/route.ts` (dépend de
      T044, T045, T046) : valider les champs (400 si invalide, format `{errors: {...}}`), vérifier
      `captchaToken` via `src/lib/turnstile.ts` (403 si échec), calculer `purgeAt = submittedAt +
      12 mois`, insérer via `src/lib/db.ts`, notifier par email, retourner `201` avec confirmation
- [ ] T048 [P] [US4] Créer `src/components/contact/RgpdNotice.tsx` (Server Component) : mention
      d'information RGPD affichée à la saisie du formulaire (FR-013)
- [ ] T049 [US4] Créer `src/components/contact/ContactForm.tsx` (`"use client"`, Client Component
      React) : champs nom/email/message, widget Turnstile, intègre `RgpdNotice`, validation côté
      client avant envoi, affichage des erreurs serveur sans perte des champs déjà saisis (Edge
      Case)
- [ ] T050 [US4] Implémenter `src/app/contact/page.tsx` (FR-006, Server Component) : intègre
      `ContactForm` et `RgpdNotice`, affiche la confirmation après succès
- [ ] T051 [US4] Implémenter le job de purge planifié `src/scheduled/purge-contact-requests.ts`
      (Cloudflare Cron Trigger, déclenché via le handler `scheduled` d'OpenNext) : supprime les
      `contact_request` où `purge_at <= now` (FR-014), référencé dans `wrangler.toml` (voir T004)

**Checkpoint**: Les 4 user stories fonctionnent indépendamment

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Validation transverse de performance, accessibilité et conformité à la constitution

- [ ] T052 [P] Exécuter `npm run test` (Vitest) et `npm run test:e2e` (Playwright) sur l'ensemble
      des suites et corriger les échecs
- [ ] T053 [P] Exécuter l'audit Lighthouse mobile (`npx lighthouse ... --preset=mobile`) sur les 6
      pages publiques (via `npm run preview`) et vérifier les seuils "Good" (LCP < 2.5s, INP <
      200ms, CLS < 0.1, SC-002)
- [ ] T053a [P] Ajouter des assertions de layout responsive dans les suites Playwright existantes
      (`tests/e2e/discover-club.spec.ts`, `calendrier.spec.ts`, `galerie.spec.ts`,
      `liens-utiles.spec.ts`, `contact.spec.ts`) sur 3 viewports (mobile 375px, tablette 768px,
      desktop 1280px) : pas de débordement horizontal, navigation utilisable, contenu principal
      visible sans perte de fonctionnalité (FR-010, SC-004)
- [ ] T054 [P] Vérifier l'absence de violations critiques WCAG AA (rapport axe-core agrégé des
      suites E2E) sur les 6 pages publiques
- [ ] T055 Vérifier qu'aucun secret n'est committé (`.dev.vars` ignoré par git, secrets déclarés
      via `wrangler secret` en production) — principe I de la constitution
- [ ] T056 Exécuter l'ensemble des scénarios de `quickstart.md` manuellement via `npm run preview`
      (`wrangler pages dev` après build OpenNext) et confirmer chaque résultat attendu

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: aucune dépendance — démarrage immédiat
- **Foundational (Phase 2)**: dépend de Setup — bloque toutes les user stories
- **User Stories (Phase 3–6)**: dépendent toutes de Foundational ; peuvent ensuite être menées en
  parallèle ou séquentiellement dans l'ordre de priorité P1 → P1 → P2 → P3
- **Polish (Phase 7)**: dépend de la complétion des user stories souhaitées

### User Story Dependencies

- **US1 (P1)**: après Foundational — aucune dépendance envers une autre story
- **US2 (P1)**: après Foundational — indépendante d'US1 (page distincte, mais peut réutiliser
  `Header`/`Footer` de la Phase 2)
- **US3 (P2)**: après Foundational — indépendante d'US1/US2
- **US4 (P3)**: après Foundational — indépendante d'US1/US2/US3 (le lien vers `/calendrier`,
  `/galerie`, `/contact` sur l'accueil est un simple lien HTML, pas une dépendance fonctionnelle)

### Within Each User Story

- Tests (E2E/unitaires/intégration) avant l'implémentation correspondante
- Schémas Zod avant les Route Handlers API
- Route Handlers API avant les pages qui les consomment
- Composants avant la page qui les intègre

### Parallel Opportunities

- Toutes les tâches [P] de la Phase 1 en parallèle
- Toutes les tâches [P] de la Phase 2 en parallèle (après T008/T009)
- Une fois la Phase 2 terminée, US1, US2, US3, US4 peuvent être menées en parallèle par des
  développeurs différents
- Au sein de chaque story, tests [P] et schémas [P] en parallèle

---

## Parallel Example: User Story 2

```bash
# Lancer les tests de la US2 en parallèle :
Task: "Test E2E calendrier dans tests/e2e/calendrier.spec.ts"
Task: "Test unitaire statut compétition dans tests/unit/competition-status.test.ts"

# Puis, une fois le schéma Zod prêt, le composant d'affichage en parallèle de l'endpoint :
Task: "Créer CompetitionList.tsx dans src/components/competitions/CompetitionList.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 uniquement)

1. Compléter Phase 1 (Setup) et Phase 2 (Foundational — bloquant)
2. Compléter Phase 3 (US1 — Découvrir le club)
3. **STOP et VALIDER** : tester US1 indépendamment (T016, T017)
4. Déployer/démontrer si prêt

### Livraison incrémentale

1. Setup + Foundational → fondation prête
2. US1 (Découvrir le club) → valider → déployer (MVP)
3. US2 (Calendrier) → valider → déployer
4. US3 (Galerie) → valider → déployer
5. US4 (Liens utiles et contact) → valider → déployer
6. Polish transverse (Phase 7)

### Stratégie en équipe parallèle

Une fois Foundational terminé : un développeur par user story (US1, US2, US3, US4), intégration et
tests indépendants, puis Polish commun.

---

## Notes

- [P] = fichiers différents, pas de dépendance bloquante
- [Story] mappe chaque tâche à sa user story pour la traçabilité
- Chaque user story est complétable et testable indépendamment
- Vérifier que les tests échouent avant l'implémentation correspondante
- Commit après chaque tâche ou groupe logique
- S'arrêter à chaque checkpoint pour valider la story indépendamment
- Éviter : tâches vagues, conflits sur un même fichier, dépendances inter-stories qui casseraient
  l'indépendance
