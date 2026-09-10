# Implementation Plan: Front public du club Vendémian Tambourin

**Branch**: `001-front-public-club` | **Date**: 2026-09-10 (révisé pour stack Next.js) | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-front-public-club/spec.md`

## Summary

Livrer le front public du site du club Vendémian Tambourin (accueil, présentation, calendrier des
compétitions, galerie photo, liens utiles, contact), consultable sans authentification, en
remplacement du site Wix actuel. Approche technique : application Next.js (App Router,
TypeScript) déployée sur Cloudflare Pages/Workers via l'adapter officiel OpenNext
(`@opennextjs/cloudflare`), consommant une API interne (Route Handlers Next.js) adossée à
Cloudflare D1/Drizzle ; le contenu (compétitions, photos, infos club, liens utiles) est lu depuis ce
modèle de données — son édition via un backoffice reste une feature séparée. Le formulaire de
contact persiste les demandes (purge automatique à 12 mois, RGPD) et notifie le club par email,
protégé par Cloudflare Turnstile. Stack et hébergement choisis pour maximiser la popularité/le
bassin de développeurs (React/Next.js) tout en restant 100% dans l'écosystème Cloudflare (budget
nul/faible, un seul fournisseur d'hébergement/DB).

## Technical Context

**Language/Version**: TypeScript 5.x, runtime Cloudflare Workers (compatible Node.js 20 APIs)

**Primary Dependencies**: Next.js 15+ (App Router, TypeScript), adapter `@opennextjs/cloudflare`,
React 18+, Tailwind CSS, Drizzle ORM, Zod (validation), Cloudflare Turnstile (client + vérification
serveur)

**Storage**: Cloudflare D1 (SQLite managé) via Drizzle ORM — voir `data-model.md`

**Testing**: Vitest (unitaire/intégration), Playwright + `@axe-core/playwright` (E2E + accessibilité)
exécutés contre `wrangler pages dev` (via OpenNext)

**Target Platform**: Web responsive (mobile, tablette, desktop), hébergé sur Cloudflare Pages/Workers

**Project Type**: Application web full-stack (front + API) — projet Next.js unique (pages/composants
React et Route Handlers API dans le même projet, pas de séparation `frontend/`/`backend/`)

**Performance Goals**: Seuils "Good" Core Web Vitals (LCP < 2.5s, INP < 200ms, CLS < 0.1) sur mobile
standard, conforme à SC-002 (contenu principal affiché < 2,5s)

**Constraints**: WCAG AA (clavier, contrastes, alternatives textuelles) ; images en lazy-loading via
`next/image` ; hébergement à coût nul/faible adapté à une association sportive, dans un écosystème
unique (Cloudflare) ; aucune donnée sensible en clair dans le dépôt ; validation serveur systématique
(principe I) ; composants interactifs (filtre galerie, formulaire de contact) limités à des Client
Components React ciblés — les pages restent des Server Components par défaut pour limiter le JS
envoyé au client (principe II)

**Scale/Scope**: 6 pages publiques, trafic faible à modéré (club amateur), jeu de données restreint
(dizaines de compétitions/photos/liens)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principe | Évaluation | Statut |
|---|---|---|
| I. Sécurité by Design | Validation serveur (Zod) dans le Route Handler `POST /api/contact`, Cloudflare Turnstile vérifié serveur avant écriture, aucun secret committé (variables d'environnement Wrangler pour D1/Turnstile/email), pas de route d'admin dans cette feature (backoffice hors scope) | PASS |
| II. Performance & Accessibilité | Server Components par défaut (JS minimal envoyé au client), Client Components React limités au filtre galerie et au formulaire de contact, `next/image` pour le lazy-loading/redimensionnement automatique, Tailwind pour un HTML sémantique/accessible, audits Lighthouse/axe-core prévus dans quickstart.md | PASS |
| III. Simplicité (YAGNI) | Un seul framework full-stack, un seul fournisseur d'hébergement/DB (Cloudflare), pas de fonctionnalité hors périmètre spec (pas de multi-langue, pas d'e-commerce) ; stack limitée à Next.js/Drizzle/Tailwind/Zod | PASS |
| IV. Séparation Front public / Backoffice | Cette feature ne fait que lire le contenu (compétitions, photos, infos club, liens) via l'API interne ; seule écriture = `ContactRequest`, qui n'est pas du "contenu du site" au sens du principe (pas d'édition manuelle de données en prod, modèle versionné via migrations Drizzle) | PASS |

Aucune violation → section Complexity Tracking non renseignée.

## Project Structure

### Documentation (this feature)

```text
specs/001-front-public-club/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── api.md            # Phase 1 output
└── tasks.md              # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── layout.tsx                       # Layout racine (Header/Footer, meta, lien d'évitement)
│   ├── page.tsx                         # Accueil (US1)
│   ├── presentation/page.tsx            # Présentation du club (US1)
│   ├── calendrier/page.tsx              # Calendrier compétitions (US2)
│   ├── galerie/page.tsx                 # Galerie photo (US3)
│   ├── liens-utiles/page.tsx            # Liens utiles (US4)
│   ├── contact/page.tsx                 # Formulaire de contact (US4)
│   └── api/
│       ├── club-info/route.ts
│       ├── competitions/route.ts
│       ├── photo-categories/route.ts
│       ├── photos/route.ts
│       ├── useful-links/route.ts
│       └── contact/route.ts
├── components/
│   ├── layout/                          # Header, Footer, Nav (Server Components)
│   ├── competitions/                    # Liste/carte compétition (Server Component)
│   ├── gallery/                         # Grille photo (Server) + filtre catégorie (Client Component)
│   └── contact/                         # Formulaire + mention RGPD + Turnstile (Client Component)
├── lib/
│   ├── db.ts                            # Client Drizzle + binding D1
│   ├── validation.ts                    # Schémas Zod (dont ContactRequest)
│   ├── turnstile.ts                     # Vérification serveur Cloudflare Turnstile
│   └── email.ts                         # Notification email transactionnel
└── styles/
    └── globals.css                      # Tailwind

drizzle/
├── schema.ts                            # Competition, Photo, PhotoCategory, ClubInfo,
│                                         # UsefulLink, ContactRequest
└── migrations/

wrangler.toml                            # Config Cloudflare Pages/Workers + binding D1
open-next.config.ts                      # Config adapter OpenNext pour Cloudflare

tests/
├── unit/                                 # Zod schemas, statut compétition, calcul purgeAt
├── integration/                          # Route Handlers API (GET/POST) contre D1 de test
└── e2e/                                  # Playwright : 4 user stories + audit a11y
```

**Structure Decision**: application web unique Next.js (App Router) hébergeant à la fois le front
public (`src/app/**/page.tsx`, Server Components par défaut) et l'API de lecture/contact
(`src/app/api/**/route.ts`), déployée sur Cloudflare Pages/Workers via l'adapter OpenNext, avec
Cloudflare D1 comme base de données — pas de séparation `frontend/`/`backend/` distincte, un seul
fournisseur d'hébergement/DB, conformément au principe Simplicité (YAGNI) et à la contrainte
d'hébergement simple/abordable de la constitution. Next.js est retenu pour sa popularité et son
large bassin de développeurs (facilite la reprise du projet par un futur contributeur), au prix
d'une vigilance accrue sur le JS envoyé au client (Server Components par défaut, Client Components
limités au strict nécessaire) pour respecter les seuils de performance du principe II. Le futur
backoffice (feature séparée) réutilisera le même schéma Drizzle/D1 et pourra ajouter ses propres
routes API protégées par authentification, sans toucher à la structure du front public.

## Complexity Tracking

*Aucune violation de la Constitution Check — section non applicable.*
