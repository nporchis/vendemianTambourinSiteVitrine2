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

- [X] T001 Initialiser le projet Next.js (App Router, TypeScript strict) avec
      `npx create-next-app@latest`, installer et configurer l'adapter `@opennextjs/cloudflare`
      (`open-next.config.ts`)
- [X] T002 [P] Installer et configurer Tailwind CSS v4 (intégration officielle Next.js) et créer
      `src/styles/globals.css` en important les tokens de
      `specs/001-front-public-club/design/tokens.css` ; charger Barlow et Barlow Condensed via
      `next/font/google` (voir `design-system.md`)
- [X] T003 [P] Installer Drizzle ORM + `drizzle-kit`, créer `drizzle.config.ts` ciblant un binding
      D1 nommé `DB`
- [X] T004 [P] Créer `wrangler.toml` : projet Pages/Workers, binding D1 `DB` (base créée via
      `wrangler d1 create vt-site-db`), binding KV `RATE_LIMIT_KV` (namespace créé via `wrangler
      kv:namespace create RATE_LIMIT_KV`, FR-020), configuration du Cron Trigger de purge (voir T051)
- [X] T005 [P] Configurer ESLint + Prettier pour TypeScript/Next.js (`.eslintrc`, `.prettierrc`)
- [X] T006 [P] Installer l'outillage de test : Vitest, Playwright, `@axe-core/playwright` ; ajouter
      les scripts npm `test`, `test:e2e` et `preview` (build OpenNext + `wrangler pages dev`) dans
      `package.json`
- [X] T007 [P] Créer `.dev.vars.example` documentant les variables d'environnement requises :
      `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`, `EMAIL_PROVIDER_API_KEY`,
      `CLUB_NOTIFICATION_EMAIL`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Schéma de données, client DB, layout et infrastructure partagée par toutes les user
stories

**⚠️ CRITICAL**: Aucune user story ne peut démarrer avant la fin de cette phase

- [X] T008 Définir le schéma Drizzle complet dans `drizzle/schema.ts` avec les tables suivantes
      (types et règles exactes de `data-model.md`) :
      - `competition` : `id` (UUID, PK), `name` (requis), `date` (datetime, requis), `location`
        (requis), `description` (nullable), `result` (nullable, résultat affiché uniquement si
        compétition passée)
      - `photo_category` : `id` (UUID, PK), `name` (requis, unique)
      - `photo` : `id` (UUID, PK), `image_url` (requis), `caption` (nullable), `category_id` (FK →
        `photo_category`, requis), `taken_or_event_date` (datetime, nullable), `created_at`
        (datetime, généré serveur à l'insertion, clé de tri pour la pagination par curseur FR-018)
      - `club_info` : `id` (PK fixe, singleton), `history_text` (requis), `values` (requis),
        `team_info` (nullable), `contact_email` (requis, format email), `contact_phone`
        (nullable), `social_links` (JSON array `{label, url}`, optionnel), `key_figures` (JSON
        array `{value, label}`, 4 au plus, FR-024)
      - `board_member` : `id` (UUID, PK), `first_name` (requis), `last_name_initial` (requis, 1
        caractère), `role` (requis), `sort_order` (integer, requis) (FR-026)
      - `partner` : `id` (UUID, PK), `name` (requis), `level` (enum `principal | soutien |
        institutionnel`, requis), `website_url` (nullable), `description` (nullable),
        `logo_url` (nullable), `sort_order` (integer, requis) (FR-005)
      - `contact_request` : `id` (UUID, PK), `first_name` (requis), `last_name` (requis), `email`
        (requis, format email), `subject` (enum `adhesion | partenariat | galerie | presse |
        autre`, requis, FR-023), `message` (requis), `submitted_at` (datetime, généré serveur), `captcha_verified`
        (boolean, doit être `true` avant tout enregistrement), `rgpd_notice_acknowledged`
        (boolean, doit être `true`), `purge_at` (datetime = `submitted_at` + 12 mois),
        `notification_sent_at` (datetime, nullable — renseigné si l'email de notification a été
        envoyé avec succès, `null` sinon ; FR-017)
- [X] T009 Générer et appliquer la migration initiale (`npx drizzle-kit generate` puis
      `npx drizzle-kit migrate`) dans `drizzle/migrations/`
- [X] T010 [P] Implémenter le client Drizzle + accès au binding D1 dans `src/lib/db.ts`
- [X] T011 [P] Implémenter les helpers Zod partagés dans `src/lib/validation.ts` (validateurs
      réutilisables : chaîne non vide, format email RFC 5322 simplifié, URL valide)
- [X] T012 [P] Créer le layout racine `src/app/layout.tsx` (Server Component : HTML sémantique,
      meta, lien d'évitement clavier, structure WCAG AA)
- [X] T013 [P] Créer les composants de layout `src/components/layout/Header.tsx` (Server Component :
      écusson `public/brand/logo-vendemian-tambourin.png` lien vers `/`, navigation Accueil / Le
      tambourin / Le club / Calendrier / Galerie / Partenaires / Contact avec `aria-current` sur la
      page courante, FR-027) et `src/components/layout/Footer.tsx` (liens Partenaires, Contact,
      `/politique-de-confidentialite`, FR-019, FR-027)
- [X] T013a [P] Créer `src/components/layout/MobileMenu.tsx` (`"use client"`) : bouton « Menu » (44px)
      ouvrant un panneau plein écran sombre en `role="dialog"` `aria-modal`, focus piégé, Échap ferme,
      focus rendu au bouton (FR-010, FR-027, `design-system.md` §5)
- [X] T013b [P] Créer les composants d'interface partagés dans `src/components/ui/` : `PageHero.tsx`
      (bandeau sombre à grand titre ~124px desktop / `clamp()` mobile, mot surligné jaune),
      `SectionHead.tsx` (en-tête numéroté « 01 » à chiffre jaune contouré), `Button.tsx`
      (jaune / sombre / contour), `Chip.tsx` (filtre) — voir maquettes v11 et `design-system.md`
- [X] T013c [P] Ajouter l'écusson du club comme favicon et image de partage (`src/app/icon.png`,
      métadonnées `openGraph` dans `layout.tsx`)
- [X] T014 [P] Créer le helper de réponse API `src/lib/api-response.ts` implémentant le format
      d'erreur standard `{ "errors": { "<champ>": "<message>" } }` de `contracts/api.md`
- [X] T015 Créer le script de seed `scripts/seed.ts` (exposé via `npm run seed`) : 1 compétition à
      venir, 1 compétition passée avec `result` renseigné, 2 `photo_category`, 14 `photo` (avec
      `created_at` échelonnés, pour exercer la pagination FR-018 sur au moins 2 pages), 1
      `club_info` avec 4 `key_figures`, 4 `board_member`, 5 `partner` répartis sur les 3 niveaux
      (dont 1 sans site) (jeu de données de `quickstart.md`)

**Checkpoint**: Schéma, DB, layout et validation partagés prêts — les user stories peuvent démarrer

---

## Phase 3: User Story 1 - Découvrir le club (Priority: P1) 🎯 MVP

**Goal**: Un visiteur non authentifié comprend ce qu'est le club et le sport via l'accueil (chiffres
clés, prochain match), « Le club » et « Le tambourin » (FR-001, FR-002, FR-008, FR-022, FR-024,
FR-025, FR-026, FR-027)

**Independent Test**: Accéder à `/`, `/le-club` et `/le-tambourin` sans connexion et vérifier le nom
du club, la présentation courte, les chiffres clés, le bloc « Prochain match » et son compte à
rebours, l'histoire, les valeurs, les membres du bureau et le contenu du sport

### Tests for User Story 1

- [X] T016 [P] [US1] Test E2E Playwright `tests/e2e/discover-club.spec.ts` : ouvrir `/` sans
      authentification, vérifier nom du club + présentation courte + 4 chiffres clés + bloc
      « Prochain match » ; sans compétition à venir, le bloc est absent (FR-025) ; ouvrir
      `/le-club`, vérifier histoire/valeurs/membres du bureau « Prénom X. — rôle » (FR-026) ; ouvrir
      `/le-tambourin`, vérifier règles/terrain/rôles/frise 1923 (FR-022) ; navigation commune et
      `aria-current` sur chaque page (FR-027) ; audit `@axe-core/playwright` sur les trois pages
- [X] T016a [P] [US1] Test unitaire Vitest `tests/unit/countdown.test.ts` : calcul jours/heures/
      minutes/secondes restants, borné à zéro (jamais négatif), et sélection de la prochaine
      compétition (première `date > now`, aucune si toutes passées) (FR-025)
- [X] T017 [P] [US1] Test unitaire Vitest `tests/unit/club-info-schema.test.ts` : valider le schéma
      Zod `ClubInfo` (rejet si `historyText`, `values` ou `contactEmail` manquants ou email au
      format invalide)

### Implementation for User Story 1

- [X] T018 [P] [US1] Ajouter les schémas Zod `ClubInfoSchema` (`historyText` requis, `values`
      requis, `teamInfo` optionnel, `contactEmail` requis au format email valide, `contactPhone`
      optionnel, `socialLinks` tableau optionnel de `{label, url}`, `keyFigures` tableau optionnel de
      4 `{value ≤ 8 car., label}` au plus) et `BoardMemberSchema` (`firstName`, `lastNameInitial`
      1 caractère, `role` requis) dans `src/lib/validation.ts`
- [X] T019 [US1] Implémenter `GET /api/club-info` dans `src/app/api/club-info/route.ts` : lit la
      ligne singleton `club_info` et les `board_member` triés par `sort_order` via `src/lib/db.ts`
      et retourne le JSON conforme à `contracts/api.md` (dont `keyFigures` et `boardMembers`)
- [X] T019a [P] [US1] Implémenter `src/lib/next-competition.ts` (module autonome, sans dépendance
      envers `src/lib/competitions.ts` de l'US2) : `getNextCompetition` (lecture D1, première
      `date > now` par date croissante, `null` sinon) et `timeRemaining(target, now)` borné à zéro
      (FR-025)
- [X] T019b [P] [US1] Créer `src/components/home/Countdown.tsx` (`"use client"`) : le rendu serveur
      n'affiche que la date du match (`<time>`) ; le décompte n'est calculé qu'après montage côté
      client (`useEffect`), pour éviter tout écart d'hydratation ; jours/heures/minutes/secondes mis à
      jour chaque seconde, bornés à zéro ; sous
      `prefers-reduced-motion: reduce`, mise à jour à la minute sans secondes ni transition ; pas
      d'`aria-live` (la date en clair porte l'information) (FR-025, `research.md` §16)
- [X] T019c [P] [US1] Créer `src/components/home/NextMatch.tsx` (Server Component : carte jaune/noire
      nom, date, heure, lieu + `Countdown`) et `src/components/home/KeyFigures.tsx` (4 chiffres clés
      au plus, rien si vide) (FR-024, FR-025)
- [X] T020 [US1] Implémenter `src/app/page.tsx` (Accueil, FR-001, Server Component) : hero plein
      écran sur la photo du fronton (titre « La balle vole, nous suivons. » en bas de l'image),
      `KeyFigures`, `NextMatch` (masqué sans compétition à venir), bloc Le club, bande « Viens
      essayer » vers `/contact?sujet=adhesion` ; données de `GET /api/club-info` et
      `getNextCompetition` ; rendu dynamique à chaque requête (`export const dynamic =
      'force-dynamic'`, `research.md` §20) (FR-001, FR-008, FR-009, FR-023, FR-024, FR-025, SC-005)
- [X] T021 [US1] Implémenter `src/app/le-club/page.tsx` (FR-002, FR-026, Server Component) :
      `PageHero`, histoire (`historyText`), valeurs (`values`), liste des membres du bureau
      « Prénom X. — rôle », bande de contact, à partir de `GET /api/club-info` ; rendu dynamique
      (`research.md` §20, FR-008, FR-009)
- [X] T021a [P] [US1] Implémenter `src/app/le-tambourin/page.tsx` (FR-022, Server Component,
      contenu statique) : règles en bref (4 points), schéma du terrain en SVG/HTML accessible
      (`role="img"` + description textuelle), rôles fonds/tiers/cordiers, frise historique avec la
      fondation du club en 1923, citation (`research.md` §18)

**Checkpoint**: US1 fonctionnelle et testable indépendamment (MVP)

---

## Phase 4: User Story 2 - Consulter le calendrier des compétitions (Priority: P1)

**Goal**: Afficher les compétitions à venir et passées avec nom/date/lieu, résultat optionnel pour
les compétitions passées, et un état vide explicite (FR-003, FR-011, FR-016)

**Independent Test**: Ouvrir `/calendrier` avec des données seedées et vérifier la séparation
à venir/passées, l'affichage du résultat pour une compétition passée, puis vider la table et
vérifier le message d'état vide

### Tests for User Story 2

- [X] T022 [P] [US2] Test E2E Playwright `tests/e2e/calendrier.spec.ts` : compétition à venir
      visible avec nom/date/lieu ; compétition passée avec `result` affiche son résultat ; table
      vidée → message d'état vide explicite (FR-011) ; audit `@axe-core/playwright`
- [X] T023 [P] [US2] Test unitaire Vitest `tests/unit/competition-status.test.ts` : la fonction de
      dérivation de statut retourne `upcoming` si `date` ≥ maintenant, `past` sinon ; `result` n'est
      exposé côté affichage que si `status = past`

### Implementation for User Story 2

- [X] T024 [P] [US2] Ajouter le schéma Zod `CompetitionSchema` dans `src/lib/validation.ts` :
      `name`, `date`, `location` requis et non vides ; `description` et `result` optionnels
- [X] T025 [US2] Implémenter la fonction de dérivation de statut et de tri dans
      `src/lib/competitions.ts` (`status: 'upcoming' | 'past'` dérivé de `date` vs. date courante,
      non stocké ; tri par date décroissante)
- [X] T026 [US2] Implémenter `GET /api/competitions` dans `src/app/api/competitions/route.ts` :
      liste les compétitions via `src/lib/db.ts` et `src/lib/competitions.ts`, retourne `[]` si
      aucune compétition (FR-011)
- [X] T027 [P] [US2] Créer `src/components/competitions/CompetitionList.tsx` (Server Component) :
      affiche les compétitions à venir séparément des passées, résultat affiché uniquement si
      `status = past` et `result` non nul (FR-016)
- [X] T028 [US2] Implémenter `src/app/calendrier/page.tsx` (FR-003, Server Component) : consomme
      `GET /api/competitions`, `PageHero` + sections numérotées « À venir » / « Derniers résultats »,
      utilise `CompetitionList`, rendu dynamique (`research.md` §20, FR-008, FR-009), affiche un message d'état vide explicite
      si la liste est vide (FR-011)

**Checkpoint**: US1 et US2 fonctionnelles indépendamment

---

## Phase 5: User Story 3 - Parcourir la galerie photo (Priority: P2)

**Goal**: Afficher les photos du club regroupées/filtrables par événement ou catégorie, paginées
côté serveur avec chargement automatique au défilement, et état vide explicite (FR-004, FR-011,
FR-015, FR-018)

**Independent Test**: Ouvrir `/galerie`, vérifier l'affichage lisible et le lazy-loading, filtrer
par catégorie, faire défiler jusqu'à charger une page suivante automatiquement, puis vider la table
`Photo` et vérifier le message d'état vide

### Tests for User Story 3

- [X] T029 [P] [US3] Test E2E Playwright `tests/e2e/galerie.spec.ts` : photos affichées avec
      lazy-loading (vérifier le comportement `next/image` / throttling réseau) ; filtre par
      catégorie ne montre que les photos de la catégorie sélectionnée (FR-015) ; défilement jusqu'au
      bas des photos déjà affichées déclenche le chargement automatique de la page suivante, sans
      clic, et le défilement au-delà de la dernière page ne déclenche plus d'appel (`nextCursor:
      null`) (FR-018) ; table vidée → message d'état vide (FR-011) ; audit `@axe-core/playwright`

### Implementation for User Story 3

- [X] T030 [P] [US3] Ajouter les schémas Zod `PhotoCategorySchema` (`name` requis, unique) et
      `PhotoSchema` (`imageUrl` requis, `categoryId` requis, `caption` et `takenOrEventDate`
      optionnels) dans `src/lib/validation.ts`
- [X] T031 [US3] Implémenter `GET /api/photo-categories` dans
      `src/app/api/photo-categories/route.ts`
- [X] T031a [P] [US3] Implémenter les helpers de curseur opaque dans `src/lib/pagination.ts` :
      `encodeCursor({createdAt, id})` / `decodeCursor(string)` en base64, tri de référence
      `createdAt DESC, id DESC` (FR-018, `research.md` §9)
- [X] T032 [US3] Implémenter `GET /api/photos` dans `src/app/api/photos/route.ts` (dépend de T031a)
      avec filtrage optionnel par le paramètre de requête `categoryId`, pagination par curseur
      (`cursor`, `limit` — défaut et max 12) triée `created_at DESC, id DESC`, retourne
      `{ items: [...], nextCursor }` avec `items: []` et `nextCursor: null` si aucune photo (FR-011,
      FR-018, voir `contracts/api.md`)
- [X] T033 [P] [US3] Configurer un loader d'image personnalisé compatible Cloudflare (Images/R2)
      pour `next/image` dans `next.config.ts` (l'optimisation d'image native n'étant pas disponible
      telle quelle sur Workers, cf. `research.md` §8)
- [X] T034 [P] [US3] Créer `src/components/gallery/GalleryGrid.tsx` (Server Component) : grille de
      photos utilisant `next/image` pour le lazy-loading, groupées visuellement par catégorie,
      reçoit la première page (`items`, `nextCursor`) en props
- [X] T034a [P] [US3] Créer `src/components/gallery/InfiniteScrollTrigger.tsx` (`"use client"`,
      Client Component React) : sentinelle observée via `IntersectionObserver`, déclenche
      automatiquement l'appel `GET /api/photos?cursor=...` (page suivante) quand elle entre dans le
      viewport, ajoute les photos reçues à la grille, cesse tout appel quand `nextCursor: null`,
      sans action de clic (FR-018)
- [X] T035 [P] [US3] Créer `src/components/gallery/CategoryFilter.tsx` (`"use client"`, Client
      Component React) : filtre les photos affichées par `categoryId` sans rechargement de page
      (FR-015)
- [X] T036 [US3] Implémenter `src/app/galerie/page.tsx` (FR-004, Server Component) : consomme `GET
      /api/photo-categories` et la première page de `GET /api/photos`, intègre `PageHero`,
      `GalleryGrid`, `InfiniteScrollTrigger` et `CategoryFilter`, affiche un état vide explicite si
      aucune photo (FR-011) ; bloc « Tu as pris des photos ? » vers `/contact?sujet=galerie` (FR-023) ;
      rendu dynamique (`research.md` §20, FR-008, FR-009)

**Checkpoint**: US1, US2 et US3 fonctionnelles indépendamment

---

## Phase 6: User Story 4 - Découvrir les partenaires et contacter le club (Priority: P3)

**Goal**: Présenter les partenaires par niveau et permettre l'envoi d'une demande de contact validée
(prénom, nom, email, sujet présélectionnable, message),
protégée anti-bot et par une limite de fréquence par IP, avec mention RGPD (liée à une page
politique de confidentialité), confirmation conditionnée à l'envoi effectif de l'email de
notification, et purge automatique à 12 mois (FR-005, FR-006, FR-007, FR-012, FR-013, FR-014,
FR-017, FR-019, FR-020, FR-023)

**Independent Test**: Ouvrir `/partenaires` et vérifier le regroupement par niveau et l'ouverture
des sites en nouvel onglet ; « Devenir partenaire » présélectionne le sujet Partenariat ;
soumettre `/contact` avec des données valides + Turnstile → confirmation ; soumettre avec un email
invalide → erreur explicite sans perte de saisie ; dépasser la limite de fréquence par IP → erreur
429 ; simuler un échec d'envoi email → erreur explicite sans confirmation, demande tout de même
persistée ; ouvrir la page politique de confidentialité depuis le lien de la mention RGPD

### Tests for User Story 4

- [X] T037 [P] [US4] Test E2E Playwright `tests/e2e/partenaires.spec.ts` : partenaires groupés
      principal → soutien → institutionnel, niveau vide non affiché, site ouvert dans un nouvel
      onglet (`target="_blank"`), partenaire sans site non cliquable ; « Devenir partenaire » mène à
      `/contact?sujet=partenariat` avec le sujet présélectionné (FR-005, FR-023) ; audit
      `@axe-core/playwright`
- [X] T038 [P] [US4] Test E2E Playwright `tests/e2e/contact.spec.ts` : soumission valide (prénom,
      nom, email, sujet, message) + challenge Turnstile → message de confirmation ; `?sujet=adhesion`,
      `?sujet=galerie` présélectionnent le bon sujet, `?sujet=inconnu` n'en présélectionne aucun
      (FR-023) ; soumission avec email invalide ou champ requis manquant
      → message d'erreur explicite, autres champs conservés ; mention RGPD visible avant envoi et
      son lien mène vers `/politique-de-confidentialite` (FR-019) ; audit `@axe-core/playwright`
- [X] T038a [P] [US4] Test E2E Playwright `tests/e2e/politique-confidentialite.spec.ts` : page
      accessible sans authentification, contenu présent (usage et durée de conservation des données,
      FR-019) ; audit `@axe-core/playwright`
- [X] T039 [P] [US4] Test d'intégration Vitest `tests/integration/contact-api.test.ts` :
      `POST /api/contact` contre une D1 de test — 201 si données valides + Turnstile vérifié, avec
      `notification_sent_at` renseigné et `subject` enregistré ; 400 si champ requis manquant/email
      invalide/sujet hors liste ; 403 si
      Turnstile invalide ; 502 si l'envoi email échoue (provider mocké en erreur) — la ligne
      `contact_request` reste créée avec `notification_sent_at = null` (FR-017) ; vérifie que la
      ligne `contact_request` créée a `purge_at = submitted_at + 12 mois`
- [X] T039a [P] [US4] Test d'intégration Vitest `tests/integration/contact-rate-limit.test.ts` :
      `POST /api/contact` depuis la même IP simulée (en-tête `CF-Connecting-IP`) au-delà du seuil
      configuré (5/heure) retourne 429 sur la requête excédentaire ; une IP différente n'est pas
      affectée par le compteur de la première (FR-020)
- [X] T040 [P] [US4] Test unitaire Vitest `tests/unit/purge-contact-requests.test.ts` : la logique
      de purge supprime uniquement les `contact_request` dont `purge_at <= now`

### Implementation for User Story 4

- [X] T041 [P] [US4] Ajouter le schéma Zod `PartnerSchema` (`name` et `level` requis, `level` ∈
      `principal | soutien | institutionnel`, `websiteUrl` et `logoUrl` URL optionnelles,
      `description` ≤ 120 caractères optionnelle) dans `src/lib/validation.ts`
- [X] T042 [US4] Implémenter `GET /api/partners` dans `src/app/api/partners/route.ts` : tri par niveau
      (principal, soutien, institutionnel) puis `sort_order`, `[]` si aucun partenaire
- [X] T043 [US4] Créer `src/components/partners/PartnerTiles.tsx` et implémenter
      `src/app/partenaires/page.tsx` (FR-005, Server Component) : `PageHero`, un groupe par niveau non
      vide (tuiles jaunes pour « principal », tuiles blanches sinon), logo via `next/image` si
      présent, site ouvert avec `target="_blank" rel="noopener noreferrer"`, état vide explicite si
      aucun partenaire, bloc « Devenir partenaire » vers `/contact?sujet=partenariat` ; rendu
      dynamique (`research.md` §20, FR-008, FR-009)
- [X] T043a [P] [US4] Créer `src/lib/contact-subjects.ts` : liste fermée `adhesion`, `partenariat`,
      `galerie`, `presse`, `autre` avec libellés, et `parseSubjectParam(slug)` renvoyant `null` pour
      une valeur inconnue (FR-023, `research.md` §17)
- [X] T044 [P] [US4] Ajouter le schéma Zod `ContactRequestSchema` dans `src/lib/validation.ts` :
      `firstName`, `lastName` (≤ 80 caractères), `email` (format email), `message` requis et non
      vides ; `subject` enum issu de `src/lib/contact-subjects.ts` ; `captchaToken` requis ;
      `rgpdNoticeAcknowledged` doit être `true` (FR-007)
- [X] T045 [P] [US4] Implémenter la vérification serveur Cloudflare Turnstile dans
      `src/lib/turnstile.ts` (appel `siteverify` avec `TURNSTILE_SECRET_KEY`) (FR-012)
- [X] T046 [P] [US4] Implémenter l'envoi de notification email transactionnel dans
      `src/lib/email.ts` (provider externe, ex. Resend, via `EMAIL_PROVIDER_API_KEY` et
      `CLUB_NOTIFICATION_EMAIL`) — objet de l'email = libellé du sujet, corps = prénom, nom, email et
      message (FR-023) —, appel bloquant (`await`) avec un timeout explicite (10s) permettant
      de détecter et propager un échec d'envoi au Route Handler (FR-017, `research.md` §11)
- [X] T046a [P] [US4] Implémenter la limite de fréquence par IP dans `src/lib/rate-limit.ts` :
      hacher l'IP (`CF-Connecting-IP`) en SHA-256, incrémenter le compteur `RATE_LIMIT_KV` (clé
      `contact:{ipHash}`, TTL 3600s), retourner si la requête courante dépasse le seuil (5 par
      défaut, ajustable) (FR-020, `research.md` §10)
- [X] T047 [US4] Implémenter `POST /api/contact` dans `src/app/api/contact/route.ts` (dépend de
      T044, T045, T046, T046a) dans cet ordre : (1) vérifier la limite de fréquence via
      `src/lib/rate-limit.ts` (429 si dépassée, FR-020), (2) valider les champs (400 si invalide,
      format `{errors: {...}}`), (3) vérifier `captchaToken` via `src/lib/turnstile.ts` (403 si
      échec), (4) calculer `purgeAt = submittedAt + 12 mois` et insérer via `src/lib/db.ts`, (5)
      envoyer l'email via `src/lib/email.ts` en l'attendant — si l'envoi échoue, renseigner
      `notificationSentAt = null` et retourner `502` sans annuler l'insertion D1 ; si l'envoi
      réussit, renseigner `notificationSentAt = now()` et retourner `201` avec confirmation (FR-017)
- [X] T047a [P] [US4] Implémenter `src/app/politique-de-confidentialite/page.tsx` (FR-019, Server
      Component) : contenu statique présentant l'usage et la durée de conservation (12 mois, FR-014)
      des données du formulaire de contact, ainsi que l'affichage des membres du bureau (prénom +
      initiale, avec leur accord) et la manière de demander leur retrait
- [X] T048 [P] [US4] Créer `src/components/contact/RgpdNotice.tsx` (Server Component) : mention
      d'information RGPD affichée à la saisie du formulaire (FR-013), incluant un lien vers
      `/politique-de-confidentialite` (FR-019)
- [X] T049 [US4] Créer `src/components/contact/ContactForm.tsx` (`"use client"`, Client Component
      React) : champs prénom/nom/email/sujet (`<select>` alimenté par `src/lib/contact-subjects.ts`,
      valeur initiale reçue en prop)/message, widget Turnstile, intègre `RgpdNotice`, validation côté
      client avant envoi, affichage des erreurs serveur sans perte des champs déjà saisis (FR-007,
      FR-012, Edge Case)
- [X] T050 [US4] Implémenter `src/app/contact/page.tsx` (FR-006, FR-023, Server Component) : lit
      `searchParams.sujet` via `parseSubjectParam` pour présélectionner le sujet, `PageHero`, carte
      des coordonnées du club, intègre `ContactForm` et `RgpdNotice`, affiche la confirmation après succès (`201`) ou un message
      d'erreur explicite en cas de `429` (limite de fréquence, FR-020) ou `502` (échec d'envoi email,
      FR-017), sans perte des champs déjà saisis
- [X] T051 [US4] Implémenter le job de purge planifié `src/scheduled/purge-contact-requests.ts`
      (Cloudflare Cron Trigger, déclenché via le handler `scheduled` d'OpenNext) : supprime les
      `contact_request` où `purge_at <= now` (FR-014), référencé dans `wrangler.toml` (voir T004)

**Checkpoint**: Les 4 user stories fonctionnent indépendamment

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Validation transverse de performance, accessibilité et conformité à la constitution

- [X] T052 [P] Exécuter `npm run test` (Vitest) et `npm run test:e2e` (Playwright) sur l'ensemble
      des suites et corriger les échecs
- [ ] T053 [P] Exécuter l'audit Lighthouse mobile (`npx lighthouse ... --preset=mobile`) sur les 9
      pages publiques (via `npm run preview`) et vérifier les seuils "Good" (LCP < 2.5s, INP <
      200ms, CLS < 0.1, SC-002)
- [X] T053a [P] Ajouter des assertions de layout responsive dans les suites Playwright existantes
      (`tests/e2e/discover-club.spec.ts`, `calendrier.spec.ts`, `galerie.spec.ts`,
      `partenaires.spec.ts`, `contact.spec.ts`, `politique-confidentialite.spec.ts`,
      `not-found.spec.ts`) sur 3 viewports (mobile 375px, tablette 768px, desktop 1280px) : pas de
      débordement horizontal, navigation utilisable, contenu principal visible sans perte de
      fonctionnalité (FR-010, SC-004)
- [X] T054 [P] Vérifier l'absence de violations critiques WCAG AA (rapport axe-core agrégé des
      suites E2E) sur les 9 pages publiques
- [ ] T055 Vérifier qu'aucun secret n'est committé (`.dev.vars` ignoré par git, secrets déclarés
      via `wrangler secret` en production) — principe I de la constitution
- [ ] T056 Exécuter l'ensemble des scénarios de `quickstart.md` manuellement via `npm run preview`
      (`wrangler pages dev` après build OpenNext) et confirmer chaque résultat attendu
- [X] T056a [P] Test E2E Playwright `tests/e2e/not-found.spec.ts` : une URL inexistante affiche la
      page 404 personnalisée dans le style du site, avec un lien de retour vers l'accueil (FR-021) ;
      audit `@axe-core/playwright`
- [X] T056b [P] Implémenter `src/app/not-found.tsx` (FR-021, Server Component, convention Next.js
      App Router) : réutilise `Header`/`Footer`, message explicite « page introuvable » et lien de
      retour vers `/`

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
- **US4 (P3)**: après Foundational — indépendante d'US1/US2/US3 (les liens `/contact?sujet=...`
  depuis l'accueil, la galerie et les partenaires sont de simples liens HTML ; `contact-subjects.ts`
  (T043a) doit exister avant T049/T050)

### Within Each User Story

- Tests (E2E/unitaires/intégration) avant l'implémentation correspondante
- Schémas Zod avant les Route Handlers API
- `src/lib/pagination.ts` (T031a) avant `GET /api/photos` (T032)
- `src/lib/rate-limit.ts` (T046a), `src/lib/turnstile.ts` (T045) et `src/lib/email.ts` (T046) avant
  `POST /api/contact` (T047)
- Route Handlers API avant les pages qui les consomment
- Composants avant la page qui les intègre

### Nouvelles tâches issues des clarifications FR-017–FR-021 (2026-09-23)

- **FR-018** (pagination galerie) : T008 (schéma `created_at`), T031a, T032, T034, T034a, T036,
  T029, T015 (seed 14 photos)
- **FR-020** (rate limiting) : T004 (binding KV), T046a, T039a, T047
- **FR-017** (confirmation liée à l'email) : T008 (schéma `notification_sent_at`), T046, T047, T050,
  T039, T038
- **FR-019** (politique de confidentialité) : T013 (footer), T047a, T048, T038a
- **FR-021** (404 personnalisée) : T056a, T056b

### Révision « maquettes v11 » (2026-09-24)

- **FR-005** (Partenaires, remplace Liens utiles) : T008 (`partner`), T015, T037, T041, T042, T043
- **FR-022** (page Le tambourin) : T016, T021a
- **FR-023** (sujet du contact) : T008 (`subject`), T020, T036, T038, T039, T043, T043a, T044, T046,
  T049, T050
- **FR-024 / FR-025** (chiffres clés, prochain match) : T008 (`key_figures`), T016, T016a, T018,
  T019, T019a, T019b, T019c, T020
- **FR-026** (bureau) : T008 (`board_member`), T015, T016, T018, T019, T021, T047a (mention
  dans la politique de confidentialité)
- **Analyse du 2026-09-24** : T019a rendu autonome (plus de dépendance US1 → US2) ; rendu dynamique
  des pages alimentées par la base (T020, T021, T028, T036, T043) ; décompte calculé après montage
  (T019b) ; références FR-007 / FR-012 explicitées (T044, T045, T049)
- **FR-027** (navigation, écusson) : T013, T013a, T013c, T016
- **Design v11** (grands titres, sections numérotées) : T002, T013b, puis chaque page

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
5. US4 (Partenaires et contact) → valider → déployer
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
