# API Contract: Front public du club Vendémian Tambourin

**Feature**: `001-front-public-club` | **Date**: 2026-09-09

API REST exposée par les Route Handlers Next.js (`src/app/api/**/route.ts`), déployés sur
Cloudflare Pages/Workers via l'adapter OpenNext, consommée par le front public.
Les endpoints de lecture exposent le contenu géré (à terme) par le backoffice ; l'endpoint
`POST /api/contact` est le seul endpoint d'écriture de cette feature.

Format des réponses : JSON. Format des erreurs de validation : `{ "errors": { "<champ>": "<message>" } }`.

## GET /api/club-info

Retourne les informations de présentation du club (singleton).

**200 OK**
```json
{
  "historyText": "string",
  "values": "string",
  "teamInfo": "string | null",
  "contactEmail": "string",
  "contactPhone": "string | null",
  "socialLinks": [{ "label": "string", "url": "string" }]
}
```

## GET /api/competitions

Liste les compétitions, triées par date décroissante côté client pour séparer à venir / passées.

**200 OK**
```json
[
  {
    "id": "string",
    "name": "string",
    "date": "2026-10-12T09:00:00.000Z",
    "location": "string",
    "description": "string | null",
    "result": "string | null",
    "status": "upcoming | past"
  }
]
```
Liste vide `[]` si aucune compétition (état vide géré côté front, FR-011).

## GET /api/photo-categories

Liste les catégories/événements disponibles pour le filtrage de la galerie.

**200 OK**
```json
[{ "id": "string", "name": "string" }]
```

## GET /api/photos?categoryId={id}

Liste les photos, filtrables par catégorie via le paramètre de requête optionnel `categoryId`.

**200 OK**
```json
[
  {
    "id": "string",
    "imageUrl": "string",
    "caption": "string | null",
    "categoryId": "string",
    "takenOrEventDate": "2026-08-01T00:00:00.000Z | null"
  }
]
```
Liste vide `[]` si aucune photo (état vide géré côté front, FR-011).

## GET /api/useful-links

**200 OK**
```json
[{ "id": "string", "label": "string", "url": "string", "category": "string | null" }]
```

## POST /api/contact

Soumet une demande de contact. Requiert un jeton Cloudflare Turnstile valide (FR-012) et l'accusé
de réception de la mention RGPD (FR-013).

**Request body**
```json
{
  "name": "string",
  "email": "string",
  "message": "string",
  "captchaToken": "string",
  "rgpdNoticeAcknowledged": true
}
```

**201 Created**
```json
{ "confirmation": "Votre demande a bien été envoyée." }
```

**400 Bad Request** — validation échouée (champ requis manquant, email invalide, mention RGPD non
acquittée) :
```json
{ "errors": { "email": "Adresse email invalide" } }
```

**403 Forbidden** — vérification Turnstile échouée côté serveur :
```json
{ "errors": { "captchaToken": "Vérification anti-bot échouée" } }
```

**Comportement serveur** (principe I — Sécurité by Design) :
1. Valider tous les champs (voir `data-model.md` → ContactRequest).
2. Vérifier `captchaToken` auprès de l'API Cloudflare Turnstile (`siteverify`) avant tout traitement.
3. Enregistrer la demande avec `submittedAt` et `purgeAt = submittedAt + 12 mois`.
4. Envoyer une notification email au club.
5. Retourner la confirmation au client.
