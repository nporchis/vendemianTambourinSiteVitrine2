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

## GET /api/photos?categoryId={id}&cursor={cursor}&limit={n}

Liste les photos **paginées** (FR-018), filtrables par catégorie via le paramètre de requête
optionnel `categoryId`. Tri par `createdAt DESC, id DESC` (voir `data-model.md`). `cursor` est le
`nextCursor` reçu lors de l'appel précédent (absent pour la première page). `limit` est optionnel,
défaut et maximum 12.

**200 OK**
```json
{
  "items": [
    {
      "id": "string",
      "imageUrl": "string",
      "caption": "string | null",
      "categoryId": "string",
      "takenOrEventDate": "2026-08-01T00:00:00.000Z | null"
    }
  ],
  "nextCursor": "string | null"
}
```
`items: []` et `nextCursor: null` si aucune photo (état vide géré côté front, FR-011).
`nextCursor: null` signale également la fin de la liste (plus rien à charger au défilement,
voir Edge Case correspondant dans `spec.md`).

## GET /api/useful-links

**200 OK**
```json
[{ "id": "string", "label": "string", "url": "string", "category": "string | null" }]
```

## POST /api/contact

Soumet une demande de contact. Requiert un jeton Cloudflare Turnstile valide (FR-012), l'accusé de
réception de la mention RGPD (FR-013), et respecte une limite de fréquence par adresse IP (FR-020).
La confirmation de succès n'est renvoyée que si l'email de notification au club a bien été envoyé
(FR-017).

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

**429 Too Many Requests** — limite de fréquence par IP dépassée (FR-020) :
```json
{ "errors": { "rateLimit": "Trop de demandes envoyées récemment, merci de réessayer plus tard." } }
```

**502 Bad Gateway** — demande validée et enregistrée, mais l'envoi de l'email de notification au
club a échoué (FR-017) ; la confirmation de succès n'est donc pas renvoyée, bien que la demande
reste persistée côté serveur :
```json
{ "errors": { "notification": "Votre demande n'a pas pu être transmise, merci de réessayer." } }
```

**Comportement serveur** (principe I — Sécurité by Design) :
1. Vérifier la limite de fréquence par IP (Cloudflare KV, FR-020) — `429` si dépassée.
2. Valider tous les champs (voir `data-model.md` → ContactRequest) — `400` si invalide.
3. Vérifier `captchaToken` auprès de l'API Cloudflare Turnstile (`siteverify`) — `403` si échec.
4. Enregistrer la demande avec `submittedAt` et `purgeAt = submittedAt + 12 mois`.
5. Envoyer une notification email au club, **en l'attendant** (appel bloquant).
6. Si l'envoi échoue : renseigner `notificationSentAt = null`, retourner `502` (la demande reste
   enregistrée, voir `research.md` §11). Si l'envoi réussit : renseigner `notificationSentAt =
   now()`, retourner `201` avec la confirmation.
