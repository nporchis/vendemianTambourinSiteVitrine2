# Implementation Plan: Backoffice d'administration

**Branch**: `002-backoffice-admin` | **Date**: 2026-09-26 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-backoffice-admin/spec.md`

## Summary

Ajouter au site Next.js/Cloudflare existant (feature 001) une interface d'administration
(`/admin/**`) protégée par authentification session-based (identifiant/mot de passe, D1),
permettant à un ou plusieurs administrateurs du club de créer/modifier/supprimer tout le contenu
déjà lu par le front public (compétitions, photos/catégories, infos du club, bureau, partenaires),
de consulter/traiter/supprimer les demandes de contact, et de gérer d'autres comptes
administrateur. Réutilise entièrement le schéma Drizzle/D1, les schémas Zod de validation et
l'infrastructure email/rate-limiting déjà en place pour la feature 001 ; ajoute uniquement 4
nouvelles tables (admin, admin_session, password_reset_token, admin_audit_log), une colonne sur
`contact_request`, et un bucket Cloudflare R2 pour les fichiers image téléversés.

## Technical Context

**Language/Version**: TypeScript 5, Next.js 16.3.6 (App Router), React 19.2 — identique à la
feature 001, même dépôt/app (pas de nouveau projet).

**Primary Dependencies**: `drizzle-orm`, `zod` (schémas déjà écrits mais inutilisés côté écriture :
`ClubInfoSchema`, `CompetitionSchema`, `PhotoSchema`, `PhotoCategorySchema`, `PartnerSchema`,
`BoardMemberSchema` dans `src/lib/validation.ts`), `node:crypto` (hachage de mot de passe scrypt,
disponible via le flag de compatibilité `nodejs_compat` déjà activé — aucune nouvelle dépendance
npm requise pour l'authentification).

**Storage**: Cloudflare D1 (extension du schéma existant, mêmes migrations Drizzle) + nouveau
bucket Cloudflare R2 (`vt-site-media`) pour les fichiers photo/logo téléversés (l'entité `Photo` et
`Partner.logoUrl` ne stockent qu'une URL, comme en feature 001 ; R2 héberge désormais les fichiers
réels, servis par une route dédiée).

**Testing**: Vitest (unitaire + intégration via `wrangler` `getPlatformProxy` pour D1/KV/R2) et
Playwright + `@axe-core/playwright` (E2E), mêmes outils et conventions que la feature 001.

**Target Platform**: Cloudflare Workers, même Worker `vt-site` (pas de déploiement séparé — le
backoffice est un ensemble de routes supplémentaires dans la même app Next.js).

**Project Type**: web-service (extension de l'app Next.js unique existante).

**Performance Goals**: pas de seuil Core Web Vitals formel (le principe II de la constitution vise
explicitement les pages publiques) ; cible pragmatique : actions d'écriture (formulaires CRUD)
retournent en moins de 1s en conditions normales, cohérent avec le reste de l'app.

**Constraints**: toute route/page sous `/admin` DOIT exiger une session valide (principe I) ;
mots de passe hachés (scrypt + sel), jamais stockés ni journalisés en clair ; jetons de session et
de réinitialisation de mot de passe stockés hachés en base (uniquement leur valeur en clair part en
cookie/email, jamais persistée) ; cookie de session `HttpOnly`, `Secure`, `SameSite=Lax` ; limites
déjà clarifiées dans spec.md (session 24h, blocage 5/15min, mot de passe ≥12 caractères, upload
≤10 Mo JPEG/PNG/WebP).

**Scale/Scope**: quelques comptes administrateur (bureau du club), usage occasionnel et non
concurrent à grande échelle — aucune considération de montée en charge horizontale au-delà de ce
que Workers/D1 offrent déjà nativement.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Sécurité by Design (NON-NEGOTIABLE)** — PASS. C'est l'objet même de cette feature : toute
  route backoffice exige une session valide (vérifiée à la fois par `proxy.ts` pour les pages et
  par chaque route handler pour les actions d'écriture, en profondeur — défense en profondeur),
  toute saisie est validée côté serveur avec les schémas Zod déjà écrits pour la feature 001,
  aucun secret nouveau n'est committé (le hachage scrypt ne nécessite pas de clé secrète externe ;
  les identifiants Resend existent déjà en secret Worker).
- **II. Performance & Accessibilité** — PASS (portée réduite). Le principe cible explicitement les
  6 pages publiques ; le backoffice n'est pas soumis au même audit Lighthouse formel, mais reste
  navigable au clavier et sémantiquement correct (formulaires natifs, labels associés) par défaut
  d'hygiène, sans effort de conformité WCAG AA dédié au-delà de ça.
- **III. Simplicité (YAGNI)** — PASS. Un seul rôle administrateur (pas de RBAC granulaire), une
  seule app/Worker (pas de sous-domaine ou service séparé pour le backoffice), réutilisation
  maximale du schéma/validation/email/rate-limit déjà écrits en feature 001, `node:crypto` plutôt
  qu'une dépendance tierce pour le hachage de mot de passe.
- **IV. Séparation Front public / Backoffice** — PASS. Le front public reste lisible sans
  authentification (aucune route publique existante n'est modifiée) ; le backoffice devient le
  seul point d'écriture du contenu (aucune édition manuelle de la base en production après cette
  feature).

Aucune violation → pas de Complexity Tracking à documenter.

**Re-check post Phase 1 (design)**: confirmé après rédaction de `data-model.md` et des contrats —
aucune table ni endpoint supplémentaire non anticipé n'a été introduit, la conception reste
alignée avec les 4 principes ci-dessus (4 nouvelles tables minimales, 1 colonne ajoutée, aucune
nouvelle dépendance npm, double vérification de session documentée dans `research.md` §4).

## Project Structure

### Documentation (this feature)

```text
specs/002-backoffice-admin/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   ├── admin-api.md
│   └── media.md
└── tasks.md             # Phase 2 output (/speckit-tasks command — NOT created by /speckit-plan)
```

### Source Code (repository root)

Extension de l'app Next.js unique existante (feature 001) — pas de nouveau projet/dossier racine.

```text
src/
├── app/
│   ├── admin/                          # Pages backoffice (Server Components, session requise)
│   │   ├── login/page.tsx              # Publique (hors gate proxy)
│   │   ├── mot-de-passe-oublie/page.tsx        # Publique
│   │   ├── reinitialiser-mot-de-passe/page.tsx # Publique (lien à durée limitée)
│   │   ├── page.tsx                    # Tableau de bord
│   │   ├── competitions/
│   │   ├── galerie/
│   │   ├── club/                       # Infos club + bureau
│   │   ├── partenaires/
│   │   ├── contacts/                   # Demandes de contact
│   │   └── comptes/                    # Gestion des comptes administrateur
│   ├── api/
│   │   └── admin/                      # Route Handlers d'écriture (mêmes conventions que /api existant)
│   │       ├── auth/{login,logout,password-reset}/route.ts
│   │       ├── competitions/[[...id]]/route.ts
│   │       ├── photos/[[...id]]/route.ts
│   │       ├── photo-categories/[[...id]]/route.ts
│   │       ├── club-info/route.ts
│   │       ├── board-members/[[...id]]/route.ts
│   │       ├── partners/[[...id]]/route.ts
│   │       ├── contact-requests/[[...id]]/route.ts
│   │       └── admins/[[...id]]/route.ts
│   └── media/[key]/route.ts            # Route PUBLIQUE : sert les fichiers R2 (photos/logos)
├── lib/
│   ├── auth/
│   │   ├── password.ts                 # scrypt hash/verify (node:crypto)
│   │   ├── session.ts                  # création/validation/révocation de session (D1 + cookie)
│   │   └── require-admin.ts            # garde réutilisée par chaque route handler /api/admin/**
│   ├── audit-log.ts                    # écriture du journal d'audit (D1)
│   ├── media-storage.ts                # écriture/suppression d'objets R2 + génération de clé
│   └── email.ts                        # étendu : sendEmail générique réutilisé par le reset
├── proxy.ts                            # Gate `/admin/**` (sauf login/reset) : redirige si session absente/invalide
└── scheduled/
    └── purge-contact-requests.ts       # (existant, inchangé)

tests/
├── unit/                               # password.ts, session.ts, media-storage.ts
├── integration/                        # route handlers /api/admin/** via getPlatformProxy (D1/KV/R2)
└── e2e/                                # Playwright : login, CRUD par entité, gestion de comptes
```

**Structure Decision**: extension in-place de l'app Next.js/Worker unique de la feature 001 (pas de
projet séparé). Les écritures passent par des Route Handlers REST sous `/api/admin/**` (même
convention que l'unique endpoint d'écriture existant, `POST /api/contact`), plutôt que des Server
Actions, pour rester cohérent avec le style déjà établi et testé (Vitest contre `getPlatformProxy`,
Playwright contre le build Workers). Les pages `/admin/**` sont des Server Components qui lisent
les données directement via les fonctions `src/lib/*.ts` partagées (même convention que le front
public) et soumettent leurs formulaires aux Route Handlers correspondants.
