# Implementation Plan: Front public du club Vendémian Tambourin

**Branch**: `001-front-public-club` | **Date**: 2026-09-10 (révisé pour stack Next.js), 2026-09-23 (révisé pour clarifications FR-017–FR-021), 2026-09-24 (révisé pour maquettes v11 : FR-022–FR-027) | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-front-public-club/spec.md`

## Summary

Livrer le front public du site du club Vendémian Tambourin (accueil, le tambourin, le club,
calendrier des compétitions, galerie photo, partenaires, contact), consultable sans authentification, en
remplacement du site Wix actuel. Approche technique : application Next.js (App Router,
TypeScript) déployée sur Cloudflare Pages/Workers via l'adapter officiel OpenNext
(`@opennextjs/cloudflare`), consommant une API interne (Route Handlers Next.js) adossée à
Cloudflare D1/Drizzle ; le contenu (compétitions, photos, infos club dont chiffres clés, membres du bureau, partenaires)
est lu depuis ce
modèle de données — son édition via un backoffice reste une feature séparée. Le formulaire de
contact persiste les demandes (purge automatique à 12 mois, RGPD) et notifie le club par email,
protégé par Cloudflare Turnstile et une limite de fréquence par IP ; la confirmation de succès
n'est renvoyée que si l'email de notification part effectivement. La galerie photo est paginée
côté serveur avec chargement automatique au défilement (infinite scroll). Trois pages
supplémentaires complètent le périmètre : « Le tambourin » et la politique de confidentialité
(contenu statique dans le code) et une page 404 personnalisée. Révision 2026-09-24 : l'accueil
affiche les chiffres clés et un bloc « Prochain match » avec compte à rebours (petit Client
Component), le formulaire de contact gagne prénom/nom/sujet (sujet présélectionnable via
`?sujet=`), « Liens utiles » devient « Partenaires ». Référence visuelle : maquettes v11
(https://claude.ai/artifact/HMJG4Z85iZobGTzk8gWjYR) et `design-system.md`. Stack et hébergement choisis pour maximiser la popularité/le bassin de développeurs
(React/Next.js) tout en restant 100% dans l'écosystème Cloudflare (budget nul/faible, un seul
fournisseur d'hébergement/DB).

## Technical Context

**Language/Version**: TypeScript 5.x, runtime Cloudflare Workers (compatible Node.js 20 APIs)

**Primary Dependencies**: Next.js 15+ (App Router, TypeScript), adapter `@opennextjs/cloudflare`,
React 18+, Tailwind CSS, Drizzle ORM, Zod (validation), Cloudflare Turnstile (client + vérification
serveur)

**Storage**: Cloudflare D1 (SQLite managé) via Drizzle ORM — voir `data-model.md` ; Cloudflare KV
(compteur éphémère de rate limiting par IP, TTL 1h — voir `research.md` §10)

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
Components React ciblés (filtre/scroll galerie, formulaire de contact, compte à rebours du
prochain match) — les pages restent des Server Components par défaut, rendues dynamiquement lorsqu'elles lisent
D1 (fraîcheur du contenu, SC-005, `research.md` §20) pour limiter le JS
envoyé au client (principe II) ; galerie paginée côté serveur (défilement infini, FR-018) pour
limiter le payload initial et le JS transféré sur mobile ; formulaire de contact protégé par
Turnstile + une limite de fréquence par IP (FR-020), confirmation de succès conditionnée à l'envoi
effectif de l'email de notification (FR-017)

**Scale/Scope**: 9 pages publiques (accueil, le tambourin, le club, calendrier, galerie,
partenaires, contact, politique de confidentialité, 404 — FR-008/FR-019/FR-021/FR-022), trafic
faible à modéré (club amateur), jeu de données restreint (dizaines de compétitions/photos/partenaires)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principe | Évaluation | Statut |
|---|---|---|
| I. Sécurité by Design | Validation serveur (Zod) dans le Route Handler `POST /api/contact`, Cloudflare Turnstile vérifié serveur avant écriture, limite de fréquence par IP (Cloudflare KV, FR-020) en complément de Turnstile, aucun secret committé (variables d'environnement Wrangler pour D1/KV/Turnstile/email), pas de route d'admin dans cette feature (backoffice hors scope) | PASS |
| II. Performance & Accessibilité | Server Components par défaut (JS minimal envoyé au client), Client Components React limités au filtre galerie/scroll infini, au formulaire de contact et au compte à rebours (respect de `prefers-reduced-motion`, FR-025), `next/image` pour le lazy-loading/redimensionnement automatique, pagination serveur de la galerie (FR-018, payload initial réduit), Tailwind pour un HTML sémantique/accessible, audits Lighthouse/axe-core prévus dans quickstart.md | PASS |
| III. Simplicité (YAGNI) | Un seul framework full-stack, un seul fournisseur d'hébergement/DB/KV (Cloudflare), pas de fonctionnalité hors périmètre spec (pas de multi-langue, pas d'e-commerce ; équipes, actualités, adhésion, classement explicitement reportés) ; rate limiting via KV natif plutôt qu'une file d'attente/service tiers ; stack limitée à Next.js/Drizzle/Tailwind/Zod | PASS |
| IV. Séparation Front public / Backoffice | Cette feature ne fait que lire le contenu (compétitions, photos, infos club, membres du bureau, partenaires) via l'API interne ; seules écritures = `ContactRequest` (D1) et le compteur de rate limiting (KV, éphémère), qui ne sont pas du "contenu du site" au sens du principe (pas d'édition manuelle de données en prod, modèle versionné via migrations Drizzle) ; les pages politique de confidentialité et « Le tambourin » sont des textes statiques du front, non gérés via le backoffice (assumptions spec.md) | PASS |

Aucune violation → section Complexity Tracking non renseignée. Réévaluation post-conception
(Phase 1, intégrant FR-017–FR-021 puis FR-022–FR-027) : toujours PASS sur les 4 principes — voir
détail par décision dans `research.md` §9–§20.

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
│   ├── page.tsx                         # Accueil (US1) : chiffres clés + prochain match (FR-024, FR-025)
│   ├── le-tambourin/page.tsx            # Présentation du sport (US1, FR-022), texte statique
│   ├── le-club/page.tsx                 # Le club : histoire, valeurs, bureau (US1, FR-002, FR-026)
│   ├── calendrier/page.tsx              # Calendrier compétitions (US2)
│   ├── galerie/page.tsx                 # Galerie photo (US3)
│   ├── partenaires/page.tsx             # Partenaires par niveau + « Devenir partenaire » (US4, FR-005)
│   ├── contact/page.tsx                 # Formulaire de contact, lit `?sujet=` (US4, FR-006, FR-023)
│   ├── politique-de-confidentialite/page.tsx  # Politique de confidentialité (FR-019), texte statique
│   ├── not-found.tsx                    # Page 404 personnalisée (FR-021, convention App Router)
│   └── api/
│       ├── club-info/route.ts
│       ├── competitions/route.ts
│       ├── photo-categories/route.ts
│       ├── photos/route.ts              # paginé (cursor/limit, FR-018 — voir contracts/api.md)
│       ├── partners/route.ts
│       └── contact/route.ts             # rate limit KV + Turnstile + email bloquant (FR-017, FR-020)
├── components/
│   ├── layout/                          # Header (écusson + nav FR-027), Footer, MobileMenu (Client)
│   ├── home/                            # KeyFigures, NextMatch (Server) + Countdown (Client, FR-025)
│   ├── ui/                              # PageHero (grand titre), SectionHead (numérotée), Button, Chip
│   ├── competitions/                    # Liste/carte compétition (Server Component)
│   ├── gallery/                         # Grille photo (Server) + filtre catégorie + scroll infini (Client Component)
│   ├── partners/                        # Tuiles partenaires par niveau (Server Component)
│   └── contact/                         # Formulaire + sujet + mention RGPD + Turnstile (Client Component)
├── lib/
│   ├── db.ts                            # Client Drizzle + binding D1
│   ├── validation.ts                    # Schémas Zod (dont ContactRequest, sujets FR-023)
│   ├── contact-subjects.ts              # Liste fermée des sujets + slugs `?sujet=` (FR-023)
│   ├── turnstile.ts                     # Vérification serveur Cloudflare Turnstile
│   ├── email.ts                         # Notification email transactionnel (envoi bloquant, FR-017)
│   └── rate-limit.ts                    # Compteur KV par IP hachée, TTL 1h (FR-020)
└── styles/
    └── globals.css                      # Tailwind

drizzle/
├── schema.ts                            # Competition, Photo, PhotoCategory, ClubInfo,
│                                         # BoardMember, Partner, ContactRequest
└── migrations/

wrangler.toml                            # Config Cloudflare Pages/Workers + bindings D1 et KV (rate limiting)
open-next.config.ts                      # Config adapter OpenNext pour Cloudflare

tests/
├── unit/                                 # Zod schemas, statut compétition, calcul purgeAt
├── integration/                          # Route Handlers API (GET/POST) contre D1 de test
└── e2e/                                  # Playwright : 4 user stories + audit a11y

public/brand/logo-vendemian-tambourin.png  # Écusson du club (header, favicon) — SVG attendu à terme
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
