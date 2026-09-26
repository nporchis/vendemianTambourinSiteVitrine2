# Contract: Service des fichiers média (R2)

**Feature**: `002-backoffice-admin` | **Date**: 2026-09-26

## GET /media/{key}

Route **publique** (aucune authentification requise — les photos/logos doivent rester visibles sur
le front public, comme n'importe quelle image de la feature 001). Sert un objet du bucket R2
`vt-site-media` (binding `MEDIA_BUCKET`).

- **200 OK** — corps = octets de l'image, `Content-Type` déduit de l'extension, en-tête
  `Cache-Control: public, max-age=31536000, immutable` (les clés incluent un UUID, jamais
  réutilisées après suppression — sûr de mettre en cache indéfiniment).
- **404 Not Found** — clé inexistante (photo supprimée entre-temps, par exemple).

`{key}` correspond exactement à la clé objet stockée dans `photo.image_url` / `partner.logo_url`
sans le préfixe `/media/` (voir `data-model.md` — « Fichiers média »), par exemple
`photos/3fae1e2c-....jpg`.

Consommé par `next/image` via `remotePatterns` (déjà configuré pour tout hôte `https://` dans
`next.config.ts`) — le binding `IMAGES` de l'adaptateur OpenNext optimise ces URLs à la volée comme
n'importe quelle autre image externe, sans changement de configuration.

## Écriture (interne, pas un contrat public)

Il n'existe pas de route d'écriture directe sur `/media/**` : les objets R2 sont créés/supprimés
uniquement en conséquence des endpoints `/api/admin/photos` et `/api/admin/partners` de
`contracts/admin-api.md`, via `src/lib/media-storage.ts`. Une photo/logo supprimé via l'API admin
supprime aussi son objet R2 correspondant (pas de fichier orphelin).
