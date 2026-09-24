# Data Model: Front public du club Vendémian Tambourin

**Feature**: `001-front-public-club` | **Date**: 2026-09-09, révisé le 2026-09-24 (Partner, BoardMember, keyFigures, sujet du contact)

Modèle de données consommé (lecture) par le front public, stocké dans Cloudflare D1 (SQLite) via
Drizzle ORM. Les écritures de contenu (compétitions, photos, infos club, membres du bureau, partenaires)
sont hors
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
| `takenOrEventDate` | datetime \| null | optionnel, informatif (date réelle de l'événement) |
| `createdAt` | datetime | généré serveur à l'insertion ; clé de tri stable pour la pagination par curseur de la galerie (FR-018), indépendante de `takenOrEventDate` (nullable/potentiellement dupliqué) |

**Pagination** (`GET /api/photos`, FR-018) : tri par `createdAt DESC, id DESC` (tie-breaker),
curseur opaque encodant le dernier `(createdAt, id)` reçu — voir `contracts/api.md` et
`research.md` §9.

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
| `teamInfo` | string \| null | optionnel ; texte libre complémentaire sur l'encadrement (entraîneurs) |
| `keyFigures` | array<{ `value`: string, `label`: string }> | optionnel ; 4 éléments au plus, affichés dans l'ordre du tableau sur l'accueil (FR-024) ; `value` ≤ 8 caractères (ex. « 1923 », « +80 », « N1 ») |
| `contactEmail` | string | requis, format email valide |
| `contactPhone` | string \| null | optionnel |
| `socialLinks` | array<{ `label`: string, `url`: string }> | optionnel |

## BoardMember (Membre du bureau)

| Champ | Type | Règles |
|---|---|---|
| `id` | string (UUID) | identifiant unique |
| `firstName` | string | requis |
| `lastNameInitial` | string | requis, 1 caractère (affiché « Prénom X. », FR-026) |
| `role` | string | requis (ex. « Président », « Trésorier ») |
| `sortOrder` | integer | requis ; ordre d'affichage croissant |

Seule l'initiale du nom est stockée (limitation des données personnelles, `research.md` §15).

## Partner (Partenaire) — remplace UsefulLink

| Champ | Type | Règles |
|---|---|---|
| `id` | string (UUID) | identifiant unique |
| `name` | string | requis |
| `level` | enum(`principal`, `soutien`, `institutionnel`) | requis ; détermine le groupe d'affichage (FR-005) |
| `websiteUrl` | string (URL) \| null | optionnel ; ouvert dans un nouvel onglet (`rel="noopener"`) |
| `description` | string \| null | optionnel ; courte (≤ 120 caractères) |
| `logoUrl` | string (URL) \| null | optionnel ; image déjà optimisée (même règle que `Photo.imageUrl`) |
| `sortOrder` | integer | requis ; ordre croissant au sein d'un niveau |

**Affichage** : niveaux dans l'ordre principal → soutien → institutionnel ; un niveau sans
partenaire n'est pas rendu ; aucun partenaire → état vide + bloc « Devenir partenaire ».

## ContactRequest (Demande de contact)

| Champ | Type | Règles |
|---|---|---|
| `id` | string (UUID) | identifiant unique |
| `firstName` | string | requis (FR-006), ≤ 80 caractères |
| `lastName` | string | requis (FR-006), ≤ 80 caractères |
| `email` | string | requis, format email valide (FR-007) |
| `subject` | enum(`adhesion`, `partenariat`, `galerie`, `presse`, `autre`) | requis (FR-023) ; libellés dans `src/lib/contact-subjects.ts` |
| `message` | string | requis |
| `submittedAt` | datetime | généré serveur à la création |
| `captchaVerified` | boolean | doit être `true` (vérifié via Cloudflare Turnstile) pour que la requête soit acceptée (FR-012) |
| `rgpdNoticeAcknowledged` | boolean | doit être `true` (mention affichée et validée à la saisie, FR-013) |
| `purgeAt` | datetime | calculé = `submittedAt` + 12 mois (FR-014) ; utilisé par le job de purge |
| `notificationSentAt` | datetime \| null | horodatage de l'envoi réussi de l'email de notification au club ; `null` si l'envoi a échoué (FR-017) — la ligne reste enregistrée même dans ce cas, voir `research.md` §11 |

**Validation** (côté serveur, principe I — Sécurité by Design) :
- Limite de fréquence par IP vérifiée **avant** toute validation de champ (FR-020, voir
  `research.md` §10 — stockage hors D1, dans Cloudflare KV).
- `firstName`, `lastName`, `email`, `message` non vides ; `subject` dans la liste fermée (FR-023).
- `email` conforme à un format RFC 5322 simplifié.
- `captchaVerified` doit être vérifié côté serveur via l'API Cloudflare Turnstile avant tout enregistrement.
- Requête rejetée avec message d'erreur explicite si un champ requis manque ou si l'email est
  invalide (FR-007), sans perte des autres champs déjà saisis côté client.
- La confirmation de succès n'est renvoyée que si l'email de notification a été envoyé avec succès
  (FR-017) ; la ligne `ContactRequest` reste enregistrée même si cet envoi échoue.

**Lifecycle**: création unique à la soumission du formulaire (avec `notificationSentAt` renseigné ou
`null` selon le succès de l'envoi email) → suppression automatique (job planifié) lorsque
`now >= purgeAt`. Aucune mise à jour après création, sauf le cas particulier de `notificationSentAt`
qui pourrait être renseigné par un futur mécanisme de nouvel essai (hors scope de cette feature).

## Stockage additionnel hors D1 (rate limiting du formulaire de contact)

En complément des entités D1 ci-dessus, `POST /api/contact` s'appuie sur un compteur **Cloudflare
KV** éphémère (binding `RATE_LIMIT_KV`) pour appliquer la limite de fréquence par IP (FR-020) — ce
n'est pas une entité métier versionnée par migration Drizzle, mais un état technique à courte durée
de vie :

| Clé | Valeur | TTL |
|---|---|---|
| `contact:{sha256(ip)}` | nombre de soumissions dans la fenêtre courante | 3600s (1h) |

Voir `research.md` §10 pour le détail de la décision et les alternatives écartées.

## Résumé des relations

```
PhotoCategory (1) ──< (N) Photo

ClubInfo, BoardMember, Partner, Competition, ContactRequest : entités indépendantes, sans relation
entre elles. La compétition affichée dans « Prochain match » (FR-025) est dérivée : première
`Competition` dont `date` est postérieure à l'instant courant.

Migration : la table `useful_link` est supprimée (aucune donnée de production à ce stade) ;
`contact_request.name` est remplacé par `first_name` + `last_name`, et `subject` est ajouté.
```
