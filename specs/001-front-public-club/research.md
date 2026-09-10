# Phase 0 Research: Front public du club Vendémian Tambourin

**Feature**: `001-front-public-club` | **Date**: 2026-09-10 (révisé pour stack Next.js/Cloudflare)

Ce document résout les inconnues techniques identifiées dans le Technical Context du plan, en
s'appuyant sur la constitution (hébergement simple/abordable, backoffice utilisable par un
non-développeur, bonnes performances mobile, sécurité by design, YAGNI) et sur l'arbitrage explicite
de l'utilisateur en faveur de la popularité de la stack (React/Next.js) tout en gardant le coût
d'hébergement le plus bas possible.

## 1. Framework front/full-stack

- **Decision**: Next.js 15+ (App Router) avec TypeScript et React, déployé sur Cloudflare
  Pages/Workers via l'adapter officiel `@opennextjs/cloudflare` (OpenNext).
- **Rationale**: Next.js est le framework front le plus utilisé au monde — bassin de développeurs le
  plus large, documentation et tutoriels abondants, facilite la reprise du projet par un futur
  contributeur (priorité explicite de l'utilisateur sur la popularité de la stack). L'App Router
  permet des Server Components par défaut (rendu HTML côté serveur, JS minimal envoyé au client) et
  ne réserve les Client Components qu'aux éléments réellement interactifs (filtre galerie,
  formulaire de contact), ce qui limite l'impact sur les Core Web Vitals malgré un framework plus
  lourd par défaut qu'un générateur de site statique. OpenNext est aujourd'hui l'adapter Cloudflare
  officiellement recommandé par l'écosystème Next.js (remplaçant `@cloudflare/next-on-pages`),
  avec un support large des fonctionnalités App Router (Route Handlers, revalidation, streaming).
- **Alternatives considérées**:
  - Astro (mode SSR) : meilleur fit technique pur pour un site majoritairement en lecture (JS
    quasi nul par défaut), mais écosystème plus restreint et moins connu des développeurs
    potentiels — écarté suite à l'arbitrage explicite de l'utilisateur en faveur de la popularité.
  - Nuxt (Vue) : bon compromis performance/popularité (notamment en France), mais popularité
    globale et bassin de développeurs inférieurs à React/Next.js.
  - Next.js + Vercel : intégration la plus fluide pour Next.js (même éditeur), mais écarté au
    profit de Cloudflare pour l'hébergement (bande passante gratuite illimitée sur Cloudflare
    contre un plan Hobby Vercel plus restrictif et pensé pour un usage non-commercial, cf. section 4).

## 2. Style / UI

- **Decision**: Tailwind CSS (intégration officielle via PostCSS, compatible Next.js App Router).
- **Rationale**: permet de construire rapidement des pages responsive et accessibles (contrastes,
  structure) sans CSS custom volumineux ; purge automatique du CSS non utilisé → bundle léger,
  aligné avec le principe Performance & Accessibilité. Intégration standard et documentée avec
  Next.js.
- **Alternatives considérées**: CSS Modules (plus de boilerplate, natif Next.js mais moins rapide à
  écrire), librairie de composants complète type MUI (poids et complexité superflus au regard du
  principe Simplicité/YAGNI pour un site à 6 pages).

## 3. Stockage des données

- **Decision**: Cloudflare D1 (SQLite managé par Cloudflare) via Drizzle ORM.
- **Rationale**: hébergeur unique avec le front (pas de compte tiers Neon/Supabase à gérer pour le
  club), free tier généreux, latence minimale car colocalisé avec les Workers exécutant Next.js via
  OpenNext. Nécessaire pour persister les demandes de contact (purge à 12 mois, cf. clarification
  RGPD) et, à terme, le contenu géré par le backoffice (compétitions, photos, infos club, liens
  utiles) sur un modèle de données clair et versionné (principe IV). Drizzle fournit des migrations
  versionnées et un typage sûr adapté à D1 et aux Route Handlers Next.js, simple à maintenir sans
  équipe dédiée.
- **Alternatives considérées**: Postgres externe (Neon/Supabase) — viable et très répandu avec
  Next.js, mais ajoute un hébergeur/compte supplémentaire hors écosystème Cloudflare et de la
  latence réseau additionnelle depuis les Workers ; Prisma — support D1/edge runtime encore plus
  contraignant (nécessite Prisma Accelerate ou le driver adapter D1) que Drizzle, dont le support D1
  est natif et plus simple en environnement Workers.

## 4. Hébergement

- **Decision**: Cloudflare Pages (front Next.js via OpenNext) + Cloudflare Workers (Route Handlers
  API/SSR) + D1 (base de données), le tout sur un compte Cloudflare unique.
- **Rationale**: free tier avec bande passante illimitée (contrairement à Vercel, dont le plan
  Hobby est explicitement pensé pour un usage non-commercial et dont la bande passante gratuite est
  plus limitée), adapté à une association sportive à budget contraint ; un seul fournisseur à gérer
  pour l'hébergement, le edge compute et la base de données, ce qui réduit la charge opérationnelle
  pour une équipe sans DevOps dédié (principe Simplicité). Ce choix a été comparé explicitement à
  Vercel (l'hébergeur "natif" de Next.js) et maintenu pour des raisons de coût, malgré une
  intégration légèrement moins directe.
- **Alternatives considérées**: Vercel + Postgres externe (intégration Next.js la plus fluide, mais
  écarté pour le coût potentiel à plus grande échelle et le plan Hobby non prévu pour un usage
  associatif à bande passante illimitée) ; hébergement mutualisé classique (LAMP/WordPress) — écarté
  car incompatible avec le choix explicite d'une stack React/Next.js ; VPS auto-géré (charge
  opérationnelle contraire au principe Simplicité).

## 5. Protection anti-spam du formulaire de contact (clarification)

- **Decision**: Cloudflare Turnstile (mode "managed", quasi invisible), rendu côté client dans un
  Client Component React, vérifié côté serveur (Route Handler, exécuté sur Workers) avant tout
  traitement du formulaire.
- **Rationale**: répond à la clarification "CAPTCHA/anti-bot" ; solution native Cloudflare, gratuite,
  sans dépendance à un service Google, cohérente avec le reste de la stack d'hébergement.
  Vérification faite dans le même environnement d'exécution (Workers) que le reste de l'API.
- **Alternatives considérées**: reCAPTCHA v3 (fonctionnellement équivalent, plus répandu avec
  Next.js/Vercel, mais ajoute une dépendance Google externe hors écosystème Cloudflare), hCaptcha
  (équivalent, Turnstile préféré pour son intégration native avec l'hébergement choisi), honeypot
  seul (protection plus faible, ne satisfait pas pleinement l'exigence retenue lors de la
  clarification).

## 6. Canal de transmission des demandes de contact

- **Decision**: persistance en base D1 (table `ContactRequest`) + notification par email au club via
  un provider transactionnel externe (ex. Resend), appelé depuis le Route Handler `POST
  /api/contact` exécuté sur Workers.
- **Rationale**: la persistance est requise pour garantir la purge automatique à 12 mois (FR-014,
  via un Cron Trigger Cloudflare planifié) et la future visibilité des demandes côté backoffice ;
  l'email transactionnel avertit immédiatement les responsables du club. Cloudflare Email Workers
  (envoi natif) est encore limité en usage transactionnel sortant vers des adresses arbitraires au
  moment de l'écriture ; un provider externe reste donc le choix le plus fiable pour cette
  notification, la persistance restant elle 100% Cloudflare.
- **Alternatives considérées**: Cloudflare Email Workers seul (limitations sur l'envoi
  transactionnel externe), email uniquement sans persistance (ne permettrait pas la purge
  contrôlée ni l'audit), intégration Slack/webhook (dépendance non demandée, hors scope YAGNI).

## 7. Tests

- **Decision**: Vitest (tests unitaires/intégration) + Playwright (tests end-to-end, y compris
  vérifications d'accessibilité via `@axe-core/playwright`), exécutés contre le build Next.js servi
  localement via `wrangler pages dev` (après build OpenNext).
- **Rationale**: toolchain JS/TS moderne standard, largement documentée pour Next.js ; Playwright
  permet de tester les parcours sur viewport mobile et de vérifier WCAG AA (principe II) en
  conditions proches du réel, y compris dans l'environnement d'exécution Cloudflare Workers.
- **Alternatives considérées**: Jest (historiquement plus utilisé avec Next.js, mais Vitest est plus
  rapide et a un support ESM/TS natif équivalent), Cypress (Playwright offre un meilleur support
  multi-navigateur et outillage a11y prêt à l'emploi).

## 8. Gestion des images de la galerie

- **Decision**: composant `next/image` avec stockage des fichiers sur Cloudflare Images ou R2 (selon
  volumétrie/coût), référencés par URL en base D1, en utilisant un loader d'image personnalisé
  compatible Cloudflare (l'optimisation d'image native de Next.js n'étant pas disponible telle
  quelle sur Workers).
- **Rationale**: lazy-loading et tailles responsive requis par le principe Performance &
  Accessibilité ; reste dans l'écosystème Cloudflare (pas de CDN tiers additionnel). L'hypothèse
  spec indique que les photos sont déjà fournies dans un format adapté au web. Le loader
  personnalisé est un point de vigilance identifié par l'adapter OpenNext (fonctionnalité en mode
  dégradé par rapport à un hébergement Vercel natif), mais reste résolu simplement via un loader
  pointant vers Cloudflare Images/R2.
- **Alternatives considérées**: balises `<img>` brutes (pas de lazy-load/srcset automatique), DAM
  tiers dédié (surdimensionné pour l'échelle d'un club amateur), stockage S3 externe (ajoute un
  fournisseur hors écosystème Cloudflare sans bénéfice net ici).

## Résumé des inconnues résolues

Toutes les entrées `NEEDS CLARIFICATION` du Technical Context sont résolues par les décisions
ci-dessus ; aucune inconnue bloquante ne subsiste avant la conception (Phase 1). Ce document
remplace la version précédente basée sur Astro, à la demande explicite de l'utilisateur en faveur
d'une stack React/Next.js plus répandue, tout en conservant l'hébergement 100% Cloudflare retenu
précédemment pour son coût nul à cette échelle.
