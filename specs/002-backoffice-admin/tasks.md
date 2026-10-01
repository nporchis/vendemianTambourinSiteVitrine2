---

description: "Task list template for feature implementation"
---

# Tasks: Backoffice d'administration

**Input**: Design documents from `/specs/002-backoffice-admin/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/admin-api.md,
contracts/media.md, quickstart.md

**Tests**: Le plan (`plan.md` → Testing) et le quickstart (`quickstart.md` → Tests automatisés)
prescrivent Vitest (unitaire/intégration) et Playwright + `@axe-core/playwright` (E2E), comme pour
la feature 001 ; les tâches de test sont donc incluses ci-dessous.

**Organization**: Tâches groupées par user story (US1–US6, priorités du spec.md). L'authentification
de base (connexion/déconnexion/réinitialisation de mot de passe/garde de session) est un
prérequis bloquant pour toutes les stories — elle vit en Phase 2 (Foundational), pas dans la story
US2, car aucune autre story n'est testable sans elle (constitution, principe I). La story US2 ne
couvre donc que la partie « gestion d'autres comptes » (créer/désactiver/supprimer un
administrateur, journal d'audit), qui est elle bien indépendante et différable.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Peut s'exécuter en parallèle (fichiers différents, pas de dépendance bloquante)
- **[Story]**: User story concernée (US1–US6)
- Chemins de fichiers exacts inclus dans chaque description

## Path Conventions

Extension du projet Next.js (App Router) unique de la feature 001 (voir `plan.md` → Project
Structure) : `src/app/admin/**/page.tsx`, `src/app/api/admin/**/route.ts`,
`src/app/media/[key]/route.ts`, `src/lib/**`, `drizzle/**`, `tests/{unit,integration,e2e}/**`,
`wrangler.toml` à la racine.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Provisionnement de l'infrastructure Cloudflare additionnelle (R2)

- [X] T001 Créer le bucket R2 (`npx wrangler r2 bucket create vt-site-media`) et déclarer le
      binding dans `wrangler.toml` : `[[r2_buckets]]` `binding = "MEDIA_BUCKET"`,
      `bucket_name = "vt-site-media"`
- [X] T002 [P] Régénérer les types d'environnement Cloudflare (`npm run cf-typegen`) pour exposer
      `MEDIA_BUCKET: R2Bucket` dans `CloudflareEnv` (`cloudflare-env.d.ts`)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Schéma de données étendu, authentification de base (connexion, garde de session,
mot de passe oublié), stockage média — infrastructure dont **toutes** les user stories dépendent

**⚠️ CRITICAL**: Aucune user story ne peut démarrer avant la fin de cette phase

- [X] T003 Étendre `drizzle/schema.ts` avec les tables suivantes (types et règles exactes de
      `data-model.md`) :
      - `admin` : `id` (UUID, PK), `email` (requis, **unique**, format email valide),
        `password_hash` (requis, sortie `scrypt`, jamais exposée en lecture), `active` (boolean,
        défaut `true`), `created_at` (datetime, généré serveur)
      - `admin_session` : `id` (UUID, PK), `admin_id` (FK → `admin`, requis), `token_hash` (requis,
        SHA-256 du jeton cookie), `expires_at` (datetime, requis, prolongé de 24h par requête
        authentifiée, plafonné à 30 jours depuis `created_at`), `created_at` (datetime)
      - `password_reset_token` : `id` (UUID, PK), `admin_id` (FK → `admin`, requis), `token_hash`
        (requis, SHA-256 du jeton email), `expires_at` (datetime, requis, 1h de validité),
        `used_at` (datetime, nullable — empêche toute réutilisation)
      - `admin_audit_log` : `id` (UUID, PK), `actor_admin_id` (FK → `admin`, requis), `action`
        (enum `admin_created | admin_updated | admin_deactivated | admin_reactivated |
        admin_deleted`, requis), `target_admin_id` (FK → `admin`, nullable), `created_at`
        (datetime, généré serveur)
      - `contact_request` : ajouter la colonne `processed_at` (datetime, nullable — `null` = non
        traitée, FR-014)
- [X] T004 Générer et appliquer la migration (`npx drizzle-kit generate` puis
      `npx drizzle-kit migrate`) dans `drizzle/migrations/`
- [X] T005 [P] Implémenter le hachage de mot de passe dans `src/lib/auth/password.ts` :
      `hashPassword(password)` / `verifyPassword(password, hash)` via `node:crypto` `scrypt`, sel
      aléatoire par appel, mot de passe en clair jamais journalisé
- [X] T006 [P] Implémenter `src/lib/auth/session.ts` : `createSession(db, adminId)` (génère un
      jeton haute entropie, persiste son hash SHA-256 avec `expiresAt = now + 24h`, retourne le
      jeton en clair pour le cookie), `validateSession(db, token)` (valide hash + `expiresAt` +
      compte `active`, prolonge `expiresAt` de 24h plafonné à 30 jours), `revokeSession(db, id)`,
      `revokeAllSessionsForAdmin(db, adminId)` (FR-003, appelé à la désactivation/suppression d'un
      compte et au changement de mot de passe)
- [X] T007 [P] Généraliser `src/lib/rate-limit.ts` : ajouter une fonction `isLoginRateLimited(kv,
      email)` réutilisant `isRateLimited` avec la clé `login:{sha256(email)}`, `limit = 5`,
      `windowSeconds = 900` (5 tentatives / 15 min, clarification spec.md), réutilisée pour le
      login ET la demande de réinitialisation de mot de passe
- [X] T008 [P] Généraliser `src/lib/email.ts` : extraire `sendEmail({ to, subject, text }, config)`
      à partir du corps de `sendContactNotification` (qui l'appelle désormais), même comportement
      `dev-log`/erreurs
- [X] T009 [P] Implémenter `src/lib/media-storage.ts` : `putMediaObject(bucket, prefix, file)`
      (valide `file.size <= 10 * 1024 * 1024` et `file.type` dans
      `["image/jpeg", "image/png", "image/webp"]`, génère la clé `{prefix}/{uuid}.{ext}`, écrit
      dans `MEDIA_BUCKET`, retourne `/media/{clé}`) et `deleteMediaObject(bucket, key)`
- [X] T010 [P] Créer la route publique `src/app/media/[key]/route.ts` : lit l'objet R2 correspondant
      à `key`, retourne ses octets avec `Content-Type` déduit et
      `Cache-Control: public, max-age=31536000, immutable` ; **404** si absent
- [X] T011 [P] Implémenter `src/lib/auth/require-admin.ts` : lit le cookie de session, appelle
      `validateSession`, retourne l'administrateur authentifié ou `null` — utilisé par chaque route
      handler `/api/admin/**`
- [X] T012 Créer `src/proxy.ts` (remplace `middleware.ts` en Next 16) : bloque toute requête vers
      `/admin/**` sauf `/admin/login`, `/admin/mot-de-passe-oublie`,
      `/admin/reinitialiser-mot-de-passe` sans cookie de session valide, redirige vers
      `/admin/login` (FR-001, SC-002)
- [X] T013 [P] [US2] Implémenter `POST /api/admin/auth/login` dans
      `src/app/api/admin/auth/login/route.ts` : `isLoginRateLimited` avant toute vérification,
      `verifyPassword`, `createSession`, pose le cookie `HttpOnly`/`Secure`/`SameSite=Lax`, message
      d'erreur générique identique pour identifiants invalides et compte désactivé (contracts/admin-api.md)
- [X] T014 [P] Implémenter `POST /api/admin/auth/logout` dans
      `src/app/api/admin/auth/logout/route.ts` : `revokeSession` + suppression du cookie
- [X] T015 [P] Implémenter `POST /api/admin/auth/password-reset/request` et
      `POST /api/admin/auth/password-reset/confirm` dans
      `src/app/api/admin/auth/password-reset/{request,confirm}/route.ts` : jeton `password_reset_token`
      à usage unique (1h), email envoyé via `sendEmail`, réponse `200` identique que l'email existe
      ou non (anti-énumération), `confirm` exige un mot de passe d'au moins 12 caractères
      (clarification spec.md) et appelle `revokeAllSessionsForAdmin`
- [X] T016 [P] Créer `src/app/admin/login/page.tsx` (formulaire email/mot de passe, lien « mot de
      passe oublié »)
- [X] T017 [P] Créer `src/app/admin/mot-de-passe-oublie/page.tsx` (formulaire email) et
      `src/app/admin/reinitialiser-mot-de-passe/page.tsx` (formulaire nouveau mot de passe, lit le
      jeton depuis l'URL)
- [X] T018 Créer `src/app/admin/layout.tsx` : navigation entre sections (Tableau de bord,
      Compétitions, Galerie, Club, Partenaires, Contacts, Comptes), bouton de déconnexion — utilisé
      par toutes les pages `/admin/**` sauf login/reset
- [X] T019 [P] Créer le script `scripts/seed-admin.ts` (exposé via `npm run seed:admin -- --email=
      ... --password=...`) : crée un premier compte `admin` actif avec mot de passe haché
      (prérequis de mise en place, hors périmètre utilisateur de la feature — voir quickstart.md)
- [X] T020 [P] Créer `robots.txt` (`src/app/robots.ts`) `Disallow: /admin` — évite l'indexation de
      l'écran de connexion (défense en profondeur, principe I)

**Checkpoint**: schéma, hachage/session/reset, garde d'accès, stockage média et layout admin prêts
— les user stories peuvent démarrer

---

## Phase 3: User Story 1 - Gérer le calendrier des compétitions (Priority: P1) 🎯 MVP

**Goal**: un administrateur connecté peut créer, modifier et supprimer une compétition, visible
immédiatement sur `/calendrier`

**Independent Test**: se connecter (compte seedé T019), créer une compétition à venir, vérifier son
apparition sur `/calendrier` ; éditer une compétition passée pour lui ajouter un résultat, vérifier
le badge public ; supprimer une compétition, vérifier sa disparition

### Tests for User Story 1

- [X] T021 [P] [US1] Test d'intégration `tests/integration/admin-competitions-api.test.ts` :
      création/modification/suppression via `/api/admin/competitions`, rejet sans session (401),
      validation `CompetitionSchema` (400 si champ manquant)

### Implementation for User Story 1

- [X] T022 [US1] Implémenter `POST /api/admin/competitions`, `PATCH /api/admin/competitions/[id]`,
      `DELETE /api/admin/competitions/[id]` dans `src/app/api/admin/competitions/[[...id]]/route.ts`
      (garde `requireAdminSession`, validation `CompetitionSchema` de `src/lib/validation.ts`)
- [X] T023 [US1] Créer `src/app/admin/competitions/page.tsx` (liste triée par date, séparée à
      venir/passées) + `src/app/admin/competitions/CompetitionForm.tsx` (`"use client"`, création et
      édition, champ résultat visible uniquement pour une date passée)
- [X] T024 [US1] [P] Test E2E `tests/e2e/admin-competitions.spec.ts` (scénario 2 de
      `quickstart.md`) : créer, éditer un résultat, supprimer, vérifier la répercussion sur
      `/calendrier` sans redéploiement

**Checkpoint**: le calendrier est administrable de bout en bout, indépendamment des autres stories

---

## Phase 4: User Story 2 - Gérer les comptes administrateur (Priority: P1)

**Goal**: un administrateur connecté peut créer un compte pour un nouveau collègue, désactiver ou
supprimer un compte existant (sauf le dernier restant), et consulter le journal d'audit associé

**Independent Test**: depuis `/admin/comptes`, créer un second compte, s'y reconnecter, désactiver
le premier compte et vérifier l'invalidation immédiate de ses sessions ; tenter de désactiver le
dernier compte restant et vérifier le refus

### Tests for User Story 2

- [X] T025 [P] [US2] Test d'intégration `tests/integration/admin-accounts-api.test.ts` : création,
      désactivation (+ invalidation des sessions actives via `revokeAllSessionsForAdmin`),
      suppression, refus de désactiver/supprimer le dernier compte actif (409), écriture d'une
      ligne `admin_audit_log` à chaque action sensible (FR-017)

### Implementation for User Story 2

- [X] T026 [US2] Implémenter `GET /api/admin/admins`, `POST /api/admin/admins`,
      `PATCH /api/admin/admins/[id]`, `DELETE /api/admin/admins/[id]` dans
      `src/app/api/admin/admins/[[...id]]/route.ts` : validation email unique (409 si doublon),
      mot de passe ≥ 12 caractères à la création, garde « dernier compte actif » (FR-004, 409),
      appel à `revokeAllSessionsForAdmin` sur désactivation/suppression, écriture
      `admin_audit_log` via `src/lib/audit-log.ts` (dépend de T003, T006, T011)
- [X] T027 [US2] Créer `src/app/admin/comptes/page.tsx` (liste des comptes avec statut, formulaire
      de création, actions désactiver/réactiver/supprimer, lecture seule du journal d'audit)
- [X] T028 [P] [US2] Test E2E `tests/e2e/admin-accounts.spec.ts` (scénarios 5–7 de
      `quickstart.md`) : création d'un second compte, désactivation invalidant la session, refus de
      supprimer le dernier compte actif

**Checkpoint**: plusieurs administrateurs peuvent être gérés indépendamment, en plus du compte
seedé initial

---

## Phase 5: User Story 3 - Gérer la galerie photo (Priority: P2)

**Goal**: un administrateur peut téléverser une photo (avec catégorie existante ou nouvelle) et en
supprimer une, répercuté immédiatement sur `/galerie`

**Independent Test**: téléverser une photo JPEG avec une catégorie, vérifier son apparition
filtrable sur `/galerie` ; supprimer la photo, vérifier sa disparition et l'objet R2 associé
(`GET /media/{key}` → 404)

### Tests for User Story 3

- [X] T029 [P] [US3] Test d'intégration `tests/integration/admin-photos-api.test.ts` : upload
      multipart valide, rejet > 10 Mo (413), rejet format non supporté (415, ex. `.gif`), suppression
      d'une photo supprime aussi l'objet R2 (`deleteMediaObject`)

### Implementation for User Story 3

- [X] T030 [US3] Implémenter `POST /api/admin/photo-categories`,
      `DELETE /api/admin/photo-categories/[id]` dans
      `src/app/api/admin/photo-categories/[[...id]]/route.ts` (`PhotoCategorySchema`, nom unique)
- [X] T031 [US3] Implémenter `POST /api/admin/photos` (`multipart/form-data` : fichier +
      `categoryId` + `caption`? → `putMediaObject` puis `PhotoSchema` sur les métadonnées),
      `PATCH /api/admin/photos/[id]` (métadonnées seules), `DELETE /api/admin/photos/[id]`
      (`deleteMediaObject` puis suppression de la ligne) dans
      `src/app/api/admin/photos/[[...id]]/route.ts`
- [X] T032 [US3] Créer `src/app/admin/galerie/page.tsx` (grille des photos existantes avec
      suppression) + `src/app/admin/galerie/PhotoUploadForm.tsx` (`"use client"`, sélection/
      création de catégorie, aperçu avant envoi)
- [X] T033 [P] [US3] Test E2E `tests/e2e/admin-galerie.spec.ts` (scénarios 3 de `quickstart.md`) :
      upload avec nouvelle catégorie, rejet fichier trop lourd/mauvais format, suppression

**Checkpoint**: la galerie est administrable indépendamment des autres stories

---

## Phase 6: User Story 4 - Gérer les informations du club (Priority: P2)

**Goal**: un administrateur peut modifier la présentation du club, ses chiffres clés, et la liste
du bureau

**Independent Test**: modifier le texte de présentation et un chiffre clé, vérifier l'affichage sur
`/` et `/le-club` ; ajouter puis retirer un membre du bureau, vérifier la liste publique

### Tests for User Story 4

- [X] T034 [P] [US4] Test d'intégration `tests/integration/admin-club-info-api.test.ts` :
      `PATCH /api/admin/club-info` (singleton, `ClubInfoSchema`, max 4 `keyFigures`), CRUD
      `board-members` (`BoardMemberSchema`)

### Implementation for User Story 4

- [X] T035 [US4] Implémenter `PATCH /api/admin/club-info` dans
      `src/app/api/admin/club-info/route.ts` (singleton existant, pas de create/delete,
      `ClubInfoSchema`)
- [X] T036 [US4] Implémenter `POST /api/admin/board-members`, `PATCH /api/admin/board-members/[id]`,
      `DELETE /api/admin/board-members/[id]` dans
      `src/app/api/admin/board-members/[[...id]]/route.ts` (`BoardMemberSchema`)
- [X] T037 [US4] Créer `src/app/admin/club/page.tsx` (formulaire présentation/chiffres clés + liste
      ordonnée des membres du bureau avec ajout/suppression)
- [X] T038 [P] [US4] Test E2E `tests/e2e/admin-club.spec.ts` (scénarios de `quickstart.md` §4) :
      modification de la présentation, ajout/retrait d'un membre du bureau

**Checkpoint**: les infos du club sont administrables indépendamment des autres stories

---

## Phase 7: User Story 5 - Gérer les partenaires (Priority: P3)

**Goal**: un administrateur peut ajouter, modifier et retirer un partenaire (avec logo)

**Independent Test**: ajouter un partenaire avec un niveau et un logo, vérifier son apparition dans
la bonne section de `/partenaires` ; le retirer, vérifier sa disparition

### Tests for User Story 5

- [X] T039 [P] [US5] Test d'intégration `tests/integration/admin-partners-api.test.ts` : création
      avec logo (multipart), modification, suppression (supprime aussi le logo R2 le cas échéant)

### Implementation for User Story 5

- [X] T040 [US5] Implémenter `POST /api/admin/partners` (`multipart/form-data` si logo joint,
      `putMediaObject` sur préfixe `logos/`), `PATCH /api/admin/partners/[id]`,
      `DELETE /api/admin/partners/[id]` dans `src/app/api/admin/partners/[[...id]]/route.ts`
      (`PartnerSchema`)
- [X] T041 [US5] Créer `src/app/admin/partenaires/page.tsx` (liste groupée par niveau, formulaire
      création/édition avec upload de logo optionnel)
- [X] T042 [P] [US5] Test E2E `tests/e2e/admin-partenaires.spec.ts` (scénarios de `quickstart.md`
      §5) : ajout avec logo, apparition dans la bonne section, retrait

**Checkpoint**: les partenaires sont administrables indépendamment des autres stories

---

## Phase 8: User Story 6 - Consulter et traiter les demandes de contact (Priority: P3)

**Goal**: un administrateur peut consulter les demandes de contact reçues, les marquer comme
traitées, et les supprimer manuellement

**Independent Test**: soumettre une demande via `/contact`, vérifier son apparition dans
`/admin/contacts` ; la marquer traitée, vérifier le changement de statut ; la supprimer, vérifier sa
disparition définitive

### Tests for User Story 6

- [X] T043 [P] [US6] Test d'intégration `tests/integration/admin-contact-requests-api.test.ts` :
      liste, `PATCH` idempotent (`processedAt` renseigné une seule fois), suppression manuelle
      immédiate (indépendante de `purgeAt`)

### Implementation for User Story 6

- [X] T044 [US6] Implémenter `GET /api/admin/contact-requests`,
      `PATCH /api/admin/contact-requests/[id]` (`{ "processed": true }` → `processedAt`),
      `DELETE /api/admin/contact-requests/[id]` dans
      `src/app/api/admin/contact-requests/[[...id]]/route.ts`
- [X] T045 [US6] Créer `src/app/admin/contacts/page.tsx` (liste triée par date de réception, statut
      traité/non traité, actions marquer traité / supprimer)
- [X] T046 [P] [US6] Test E2E `tests/e2e/admin-contacts.spec.ts` (scénarios de `quickstart.md` §6) :
      apparition d'une nouvelle demande, marquage traité, suppression manuelle

**Checkpoint**: toutes les user stories sont fonctionnelles indépendamment les unes des autres

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: vérifications transverses une fois toutes les stories complètes

- [X] T047 [P] Exécuter `npm run test` (Vitest) et `npm run test:e2e` (Playwright) sur l'ensemble
      des suites (feature 001 + 002) et corriger les échecs
- [X] T048 [P] Audit `@axe-core/playwright` sur les pages `/admin/**` (login inclus) : pas de
      violation critique (labels de formulaire, contrastes, navigation clavier — hygiène par défaut,
      principe II en portée réduite pour le backoffice)
- [X] T049 Exécuter les 6 scénarios de `quickstart.md` de bout en bout contre `npm run preview`
- [X] T050 Vérifier qu'aucune route `/admin/**` ni `/api/admin/**` ne répond avec autre chose qu'une
      redirection/401 sans cookie de session valide (`curl` manuel, voir `quickstart.md` §
      « Vérification de la sécurité »)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: aucune dépendance — peut démarrer immédiatement
- **Foundational (Phase 2)**: dépend de Setup (le bucket R2 doit exister avant `media-storage.ts`)
  — **bloque** toutes les user stories
- **User Stories (Phase 3–8)**: dépendent toutes de Foundational ; ensuite indépendantes entre
  elles (peuvent être menées dans n'importe quel ordre ou en parallèle)
- **Polish (Phase 9)**: dépend de toutes les stories souhaitées

### User Story Dependencies

- **US1 (P1, calendrier)**: après Foundational — aucune dépendance aux autres stories
- **US2 (P1, comptes)**: après Foundational — aucune dépendance aux autres stories (le compte
  seedé T019 suffit pour tester US1/US3–US6 sans US2)
- **US3 (P2, galerie)**: après Foundational — aucune dépendance
- **US4 (P2, club)**: après Foundational — aucune dépendance
- **US5 (P3, partenaires)**: après Foundational — aucune dépendance
- **US6 (P3, contacts)**: après Foundational — aucune dépendance

### Parallel Opportunities

- T001–T002 (Setup) en parallèle
- Au sein du Foundational : T005–T011, T013–T017, T019–T020 sont sur des fichiers distincts et
  peuvent être menés en parallèle une fois T003–T004 (schéma/migration) posés ; T012 (proxy)
  dépend de T011 ; T018 (layout admin) peut se faire en parallèle du reste
- Une fois Foundational terminé, les 6 phases de user story peuvent être menées en parallèle par
  différentes personnes/agents
- Au sein de chaque story, la tâche de test d'intégration [P] peut être écrite en parallèle de
  l'implémentation ; le test E2E [P] arrive après que la page admin de la story existe

---

## Implementation Strategy

### MVP First (User Story 1 + auth de base)

1. Compléter Phase 1 (Setup) et Phase 2 (Foundational — inclut la connexion/déconnexion, sans
   laquelle rien n'est testable)
2. Compléter Phase 3 (US1 — calendrier)
3. **STOP et VALIDER** : scénario 2 de `quickstart.md` fonctionne de bout en bout
4. Déployer/démontrer si prêt — un administrateur peut déjà gérer seul le calendrier avec le compte
   seedé (T019), sans attendre la gestion multi-comptes (US2)

### Incremental Delivery

1. Setup + Foundational → fondation prête (auth + stockage média + layout)
2. US1 (calendrier) → tester indépendamment → MVP
3. US2 (comptes) → tester indépendamment → plusieurs administrateurs peuvent désormais collaborer
4. US3 (galerie) → US4 (club) → US5 (partenaires) → US6 (contacts), dans n'importe quel ordre,
   chacune testée indépendamment
5. Polish (Phase 9) une fois les stories désirées complètes

## Notes

- [P] tasks = fichiers différents, pas de dépendance bloquante
- [Story] label trace la tâche vers sa user story
- Chaque contrainte de champ citée dans `data-model.md` est reprise verbatim dans les tâches
  Foundational (T003) pour ne pas la laisser à l'appréciation de l'implémentation
- L'authentification de base (login/logout/reset/garde de session) est volontairement en
  Foundational et non en US2 : elle bloque objectivement toutes les autres stories, contrairement à
  la gestion d'*autres* comptes (US2) qui reste différable
