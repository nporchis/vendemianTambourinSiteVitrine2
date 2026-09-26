# API Contract: Backoffice d'administration

**Feature**: `002-backoffice-admin` | **Date**: 2026-09-26

Étend `specs/001-front-public-club/contracts/api.md`. Tous les endpoints ci-dessous vivent sous
`/api/admin/**` (Route Handlers Next.js), exigent une session administrateur valide (cookie de
session, voir `research.md` §2 et §4), et renvoient `401` (non authentifié) ou `403` (compte
désactivé) sans exécuter l'action si la session est absente/invalide. Format des réponses et des
erreurs de validation identique à l'existant : JSON, `{ "errors": { "<champ>": "<message>" } }`.

## Authentification

### POST /api/admin/auth/login

Corps : `{ "email": "string", "password": "string" }`.

- **200 OK** — pose le cookie de session (`HttpOnly`, `Secure`, `SameSite=Lax`), corps
  `{ "ok": true }`.
- **401 Unauthorized** — identifiants invalides ou compte désactivé ; message générique identique
  dans les deux cas (`{ "errors": { "form": "Identifiants incorrects." } }`) pour ne pas révéler
  lequel des deux est en cause.
- **429 Too Many Requests** — 5 échecs consécutifs pour cet email dans les 15 dernières minutes
  (clarification spec.md).

### POST /api/admin/auth/logout

Invalide la session courante (supprime la ligne `AdminSession` et le cookie). **200 OK**
systématique.

### POST /api/admin/auth/password-reset/request

Corps : `{ "email": "string" }`. Envoie un email de réinitialisation si le compte existe.
**200 OK** dans tous les cas (`{ "ok": true }`), y compris si l'email est inconnu, pour ne pas
permettre l'énumération de comptes. Soumis à la même limite de fréquence que le login.

### POST /api/admin/auth/password-reset/confirm

Corps : `{ "token": "string", "password": "string" }`.

- **200 OK** — nouveau mot de passe appliqué, toutes les sessions du compte invalidées.
- **400 Bad Request** — jeton invalide, expiré ou déjà utilisé, ou mot de passe < 12 caractères ;
  `{ "errors": { "token" | "password": "message" } }`.

## Comptes administrateur

### GET /api/admin/admins

Liste tous les comptes (email, statut actif, date de création — jamais le hash de mot de passe).

### POST /api/admin/admins

Corps : `{ "email": "string", "password": "string" }`. Crée un nouveau compte. **201 Created**.
`409 Conflict` si l'email existe déjà.

### PATCH /api/admin/admins/{id}

Corps partiel : `{ "active"?: boolean, "password"?: "string" }`. **200 OK**. **409 Conflict** si la
désactivation concerne le dernier compte `active` (FR-004).

### DELETE /api/admin/admins/{id}

**204 No Content**. **409 Conflict** si c'est le dernier compte administrateur.

Chaque création/modification/désactivation/suppression écrit une ligne `AdminAuditLog` (FR-017).

## Contenu (CRUD réutilisant les schémas Zod existants de `src/lib/validation.ts`)

Même style que les endpoints de lecture publics déjà documentés dans
`specs/001-front-public-club/contracts/api.md` (`GET /api/competitions`, etc.), avec en plus les
méthodes d'écriture ci-dessous. Toutes valident le corps avec le schéma Zod correspondant déjà
existant et retournent `{ "errors": { ... } }` en `400` en cas d'échec.

| Ressource | Endpoints d'écriture | Schéma Zod réutilisé |
|---|---|---|
| Compétition | `POST /api/admin/competitions`, `PATCH /api/admin/competitions/{id}`, `DELETE /api/admin/competitions/{id}` | `CompetitionSchema` |
| Catégorie de photo | `POST /api/admin/photo-categories`, `DELETE /api/admin/photo-categories/{id}` | `PhotoCategorySchema` |
| Photo | `POST /api/admin/photos` (`multipart/form-data` : fichier + `categoryId` + `caption`?), `PATCH /api/admin/photos/{id}` (métadonnées seules), `DELETE /api/admin/photos/{id}` | `PhotoSchema` (le champ `imageUrl` est déduit de l'upload, pas saisi) |
| Infos du club | `PATCH /api/admin/club-info` (singleton, pas de create/delete) | `ClubInfoSchema` |
| Membre du bureau | `POST /api/admin/board-members`, `PATCH /api/admin/board-members/{id}`, `DELETE /api/admin/board-members/{id}` | `BoardMemberSchema` |
| Partenaire | `POST /api/admin/partners` (`multipart/form-data` si logo joint), `PATCH /api/admin/partners/{id}`, `DELETE /api/admin/partners/{id}` | `PartnerSchema` |

`POST /api/admin/photos` et `POST|PATCH /api/admin/partners` avec logo : **413 Payload Too Large**
si le fichier dépasse 10 Mo, **415 Unsupported Media Type** si le format n'est ni JPEG, ni PNG, ni
WebP (clarification spec.md) — message explicite dans `{ "errors": { "file": "..." } }`.

## Demandes de contact

### GET /api/admin/contact-requests

Liste les demandes (les plus récentes en premier), avec leur statut (`processedAt`).

### PATCH /api/admin/contact-requests/{id}

Corps : `{ "processed": true }`. Renseigne `processedAt`. **200 OK**.

### DELETE /api/admin/contact-requests/{id}

Suppression manuelle immédiate (FR-014), indépendante de la purge automatique à 12 mois déjà en
place (feature 001). **204 No Content**.
