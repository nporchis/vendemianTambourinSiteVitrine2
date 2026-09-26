# Data Model: Backoffice d'administration

**Feature**: `002-backoffice-admin` | **Date**: 2026-09-26

Étend le schéma D1/Drizzle de la feature 001 (`drizzle/schema.ts`). Les entités `Competition`,
`Photo`, `PhotoCategory`, `ClubInfo`, `BoardMember`, `Partner` existent déjà et ne changent pas de
forme — seules les capacités d'écriture leur sont ajoutées par cette feature (voir
`contracts/admin-api.md`). Seule `ContactRequest` gagne une colonne. Quatre entités sont nouvelles.

## Administrateur (nouvelle — table `admin`)

| Champ | Type | Règles |
|---|---|---|
| `id` | string (UUID) | identifiant unique |
| `email` | string | requis, unique, format email valide — sert d'identifiant de connexion et de destinataire de réinitialisation de mot de passe |
| `passwordHash` | string | requis, sortie de `scrypt` (sel + hash concaténés/encodés), jamais exposé par aucune lecture API |
| `active` | boolean | `true` par défaut ; passer à `false` désactive le compte sans le supprimer (FR-003) |
| `createdAt` | datetime | généré serveur à la création |

**Validation**:
- `email` unique (contrainte DB + vérification applicative avec message explicite en cas de
  doublon).
- Mot de passe (reçu en clair uniquement à la création/changement, jamais stocké tel quel) : au
  moins 12 caractères (clarification spec.md), haché avant toute écriture.
- Un compte ne peut pas se désactiver ou se supprimer lui-même s'il est le dernier compte `active`
  (FR-004, Edge Cases) — vérifié applicativement avant l'écriture (`COUNT(*) WHERE active = true`).

**Lifecycle**: création par un administrateur déjà connecté → désactivation (`active = false`,
invalide les sessions actives, FR-003) ou suppression → un compte désactivé peut être réactivé
(remet `active = true`) sans recréer de compte.

## AdminSession (nouvelle — table `admin_session`)

| Champ | Type | Règles |
|---|---|---|
| `id` | string (UUID) | identifiant unique |
| `adminId` | string (FK → Administrateur) | requis |
| `tokenHash` | string | SHA-256 du jeton envoyé en cookie ; seul le hash est persisté |
| `expiresAt` | datetime | requis ; prolongé de 24h à chaque requête authentifiée réussie (fenêtre glissante, clarification spec.md), plafonné à 30 jours depuis `createdAt` |
| `createdAt` | datetime | généré serveur à la connexion |

**Validation**:
- Une session est valide si `now < expiresAt` ET le compte `Administrateur` associé est `active`.
- La désactivation/suppression d'un `Administrateur` supprime immédiatement toutes ses lignes
  `AdminSession` (FR-003 : invalidation immédiate).

**Lifecycle**: créée à la connexion réussie → prolongée à chaque usage → supprimée à la
déconnexion explicite, à l'expiration, ou à la désactivation du compte associé.

## PasswordResetToken (nouvelle — table `password_reset_token`)

| Champ | Type | Règles |
|---|---|---|
| `id` | string (UUID) | identifiant unique |
| `adminId` | string (FK → Administrateur) | requis |
| `tokenHash` | string | SHA-256 du jeton envoyé par email ; seul le hash est persisté |
| `expiresAt` | datetime | requis ; courte durée de vie (1h) |
| `usedAt` | datetime \| null | renseigné dès l'utilisation du jeton, empêche toute réutilisation |

**Validation**:
- Un jeton n'est accepté que si `usedAt IS NULL` et `now < expiresAt`.
- La demande de réinitialisation est soumise à la même limite de fréquence que la connexion
  (`research.md` §5) pour éviter le spam d'emails.
- Ne jamais révéler si l'email fourni correspond ou non à un compte existant (message identique
  dans les deux cas) — évite l'énumération de comptes.

**Lifecycle**: créé à la demande de réinitialisation → consommé (usage unique) à la confirmation
avec un nouveau mot de passe, qui invalide aussi toutes les `AdminSession` actives du compte
(changement de mot de passe = déconnexion de toutes les sessions, bonne pratique de sécurité).

## AdminAuditLog (nouvelle — table `admin_audit_log`)

| Champ | Type | Règles |
|---|---|---|
| `id` | string (UUID) | identifiant unique |
| `actorAdminId` | string (FK → Administrateur) | administrateur ayant effectué l'action |
| `action` | enum(`admin_created`, `admin_updated`, `admin_deactivated`, `admin_reactivated`, `admin_deleted`) | requis (FR-017 : uniquement les actions sensibles sur les comptes) |
| `targetAdminId` | string (FK → Administrateur) \| null | compte concerné par l'action (peut différer de l'acteur) |
| `createdAt` | datetime | généré serveur |

**Lifecycle**: écriture uniquement (append-only), jamais modifié ni supprimé par le backoffice ;
consultable en lecture seule dans la section « Comptes ».

## ContactRequest (existante — modifiée)

Ajout d'une colonne à l'entité déjà définie en feature 001
(`specs/001-front-public-club/data-model.md`) :

| Champ | Type | Règles |
|---|---|---|
| `processedAt` | datetime \| null *(nouveau)* | renseigné quand un administrateur marque la demande comme traitée (FR-014) ; `null` = non traitée |

**Validation** (ajout) :
- Marquer comme traitée est idempotent (renseigne `processedAt = now()` s'il est `null`, sans effet
  si déjà renseigné).
- La suppression manuelle par un administrateur (FR-014) retire définitivement la ligne, comme le
  fait déjà la purge automatique à 12 mois — aucune différence de comportement entre les deux
  déclencheurs de suppression.

## Fichiers média (hors D1 — Cloudflare R2)

Comme pour le rate limiting de la feature 001 (stockage hors D1 dans KV), les fichiers image
téléversés ne sont pas des lignes D1 mais des objets **Cloudflare R2** (binding `MEDIA_BUCKET`,
bucket `vt-site-media`) :

| Clé objet | Valeur | Référencé par |
|---|---|---|
| `photos/{uuid}.{ext}` | octets du fichier image (JPEG/PNG/WebP, ≤ 10 Mo) | `photo.image_url` = `/media/photos/{uuid}.{ext}` |
| `logos/{uuid}.{ext}` | octets du logo partenaire | `partner.logo_url` = `/media/logos/{uuid}.{ext}` |

Voir `research.md` §3 et `contracts/media.md` pour la route de service publique.

## Résumé des relations

```
Administrateur (1) ──< (N) AdminSession
Administrateur (1) ──< (N) PasswordResetToken
Administrateur (1) ──< (N) AdminAuditLog [en tant qu'acteur]
Administrateur (1) ──< (N) AdminAuditLog [en tant que cible, nullable]

# Entités existantes (feature 001), inchangées dans leur forme :
PhotoCategory (1) ──< (N) Photo
ClubInfo (singleton) ──< (N) BoardMember (via aucune FK, association implicite au singleton)
ContactRequest (autonome, +processedAt)
Partner (autonome)
Competition (autonome)
```
