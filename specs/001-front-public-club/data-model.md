# Data Model: Front public du club Vendémian Tambourin

**Feature**: `001-front-public-club` | **Date**: 2026-09-09

Modèle de données consommé (lecture) par le front public, stocké dans Cloudflare D1 (SQLite) via
Drizzle ORM. Les écritures de contenu (compétitions, photos, infos club, liens utiles) sont hors
scope de cette feature et relèvent du futur backoffice ; seule l'écriture des demandes de contact
(`ContactRequest`) fait partie de cette feature. Les types `boolean` sont stockés en `integer`
(0/1) conformément aux conventions SQLite/D1.

## Competition (Compétition)

| Champ | Type | Règles |
|---|---|---|
| `id` | string (UUID) | identifiant unique |
| `name` | string | requis |
| `date` | datetime | requis ; détermine le statut dérivé |
| `location` | string | requis |
| `description` | string \| null | optionnel |
| `result` | string \| null | optionnel ; classement/score, affiché uniquement si la compétition est passée (FR-016) |
| `status` | enum(`upcoming`, `past`) | dérivé de `date` vs. date courante, non stocké |

**Validation**: `name`, `date`, `location` non vides. `result` ignoré côté affichage si `status = upcoming`.

## Photo

| Champ | Type | Règles |
|---|---|---|
| `id` | string (UUID) | identifiant unique |
| `imageUrl` | string (URL) | requis, format déjà optimisé pour le web (hypothèse spec) |
| `caption` | string \| null | optionnel |
| `categoryId` | string (FK → PhotoCategory) | requis pour permettre le regroupement/filtrage (FR-015) |
| `takenOrEventDate` | datetime \| null | optionnel, utilisé pour le tri |

## PhotoCategory (Événement / Catégorie)

| Champ | Type | Règles |
|---|---|---|
| `id` | string (UUID) | identifiant unique |
| `name` | string | requis, unique (ex. "Compétition régionale 2026", "Vie du club") |

**Relationship**: une `PhotoCategory` a plusieurs `Photo` ; une `Photo` appartient à exactement une
`PhotoCategory`.

## ClubInfo (Informations du club — singleton)

| Champ | Type | Règles |
|---|---|---|
| `id` | string | identifiant fixe (singleton, une seule ligne) |
| `historyText` | string | requis ; histoire du club |
| `values` | string | requis ; valeurs du club |
| `teamInfo` | string \| null | optionnel ; encadrement/équipe |
| `contactEmail` | string | requis, format email valide |
| `contactPhone` | string \| null | optionnel |
| `socialLinks` | array<{ `label`: string, `url`: string }> | optionnel |

## UsefulLink (Lien utile)

| Champ | Type | Règles |
|---|---|---|
| `id` | string (UUID) | identifiant unique |
| `label` | string | requis |
| `url` | string (URL) | requis, valide, ouvert en nouvel onglet côté front (Edge Case) |
| `category` | string \| null | optionnel |

## ContactRequest (Demande de contact)

| Champ | Type | Règles |
|---|---|---|
| `id` | string (UUID) | identifiant unique |
| `name` | string | requis (FR-006) |
| `email` | string | requis, format email valide (FR-007) |
| `message` | string | requis |
| `submittedAt` | datetime | généré serveur à la création |
| `captchaVerified` | boolean | doit être `true` (vérifié via Cloudflare Turnstile) pour que la requête soit acceptée (FR-012) |
| `rgpdNoticeAcknowledged` | boolean | doit être `true` (mention affichée et validée à la saisie, FR-013) |
| `purgeAt` | datetime | calculé = `submittedAt` + 12 mois (FR-014) ; utilisé par le job de purge |

**Validation** (côté serveur, principe I — Sécurité by Design) :
- `name`, `email`, `message` non vides.
- `email` conforme à un format RFC 5322 simplifié.
- `captchaVerified` doit être vérifié côté serveur via l'API Cloudflare Turnstile avant tout enregistrement.
- Requête rejetée avec message d'erreur explicite si un champ requis manque ou si l'email est
  invalide (FR-007), sans perte des autres champs déjà saisis côté client.

**Lifecycle**: création unique à la soumission du formulaire → suppression automatique (job planifié)
lorsque `now >= purgeAt`. Aucune mise à jour après création (pas d'édition d'une demande existante).

## Résumé des relations

```
PhotoCategory (1) ──< (N) Photo

ClubInfo, UsefulLink, Competition, ContactRequest : entités indépendantes, sans relation entre elles.
```
