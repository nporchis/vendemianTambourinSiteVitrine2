# Phase 0 Research: Backoffice d'administration

**Feature**: `002-backoffice-admin` | **Date**: 2026-09-26

Aucun `NEEDS CLARIFICATION` ne subsiste dans le Technical Context du plan — toutes les décisions
ci-dessous sont motivées par la réutilisation maximale de ce qui existe déjà dans le dépôt
(feature 001) et par le principe Simplicité (YAGNI) de la constitution.

## 1. Hachage du mot de passe

- **Decision**: `scrypt` via le module natif `node:crypto` (disponible grâce au flag de
  compatibilité `nodejs_compat` déjà activé dans `wrangler.toml`), sel aléatoire par compte stocké
  à côté du hash.
- **Rationale**: aucune dépendance npm supplémentaire à auditer/maintenir ; `scrypt` est une KDF
  mémoire-dure recommandée (résiste au craquage GPU), l'implémentation Node est éprouvée. Le
  binding `nodejs_compat` expose déjà `node:crypto` dans le Worker — vérifié via
  `compatibility_flags` de `wrangler.toml`.
- **Alternatives considered**: `bcryptjs` (pure JS, plus lent en pur JS sans binding natif, et
  dépendance tierce alors qu'une solution native existe) ; Argon2 via WASM (`hash-wasm` ou
  équivalent) — le plus recommandé "state of the art" en 2026, mais ajoute une dépendance et une
  taille de bundle pour un gain marginal face à `scrypt` sur un projet à faible surface d'attaque
  (quelques comptes, déjà protégé par blocage après 5 échecs) ; rejeté au nom de YAGNI, à
  reconsidérer si un audit de sécurité futur l'exige.

## 2. Stratégie de session

- **Decision**: session opaque stockée en base D1 (table `admin_session`) : un jeton aléatoire
  haute entropie (`crypto.randomUUID()` + octets aléatoires) est envoyé en cookie `HttpOnly`,
  `Secure`, `SameSite=Lax` ; seul son hash SHA-256 est persisté en D1 avec `expiresAt`. Expiration
  glissante : chaque requête authentifiée réussie prolonge `expiresAt` de 24h (clarification
  spec.md), sans dépasser une durée absolue de 30 jours pour limiter la durée de vie d'un cookie
  volé.
- **Rationale**: une session en base est révocable immédiatement (FR-003 : désactiver un compte
  invalide ses sessions actives), ce qu'un JWT stateless ne permet pas sans liste de révocation
  (qui reviendrait de toute façon à une vérification en base — autant garder l'approche simple).
- **Alternatives considered**: JWT signé stateless (rejeté : pas de révocation immédiate possible,
  contradictoire avec FR-003) ; bibliothèque tierce de session (Lucia, etc. — rejetée, Lucia n'est
  d'ailleurs plus maintenue en tant que librairie ; la table + quelques fonctions dans
  `src/lib/auth/session.ts` suffisent, cohérent avec YAGNI).

## 3. Stockage des fichiers image téléversés

- **Decision**: nouveau bucket Cloudflare R2 (`vt-site-media`, binding `MEDIA_BUCKET`). Une route
  Next.js publique `GET /media/[key]` lit l'objet depuis R2 et le sert (avec les en-têtes de cache
  appropriés) ; l'URL retournée (`/media/<clé>`) est stockée telle quelle dans les colonnes
  existantes `photo.image_url` / `partner.logo_url` (déjà de simples chaînes URL depuis la feature
  001 — aucune migration de type nécessaire sur ces colonnes).
- **Rationale**: R2 a un palier gratuit généreux (10 Go de stockage, pas de frais de sortie vers
  Internet) contrairement à Cloudflare Images qui nécessite un abonnement payant — cohérent avec la
  contrainte constitutionnelle d'« hébergement simple et abordable pour une association sportive ».
  Le binding `IMAGES` déjà présent dans `wrangler.toml` (utilisé automatiquement par l'adaptateur
  OpenNext pour l'optimisation `next/image`, research.md §8 de la feature 001) continue de
  fonctionner sans changement : il transforme à la volée n'importe quelle URL `https://` autorisée
  par `remotePatterns`, y compris désormais `/media/*`.
- **Alternatives considered**: Cloudflare Images pour le stockage ET la transformation (rejeté :
  palier payant, alors que R2 + le binding `IMAGES` existant couvrent déjà les deux besoins
  séparément et gratuitement) ; stocker les images en base64 dans D1 (rejeté : D1 n'est pas conçu
  pour de gros blobs, gonflerait la base et les temps de requête, contraire au principe
  Performance).

## 4. Point d'application du contrôle d'accès

- **Decision**: double vérification — `src/proxy.ts` (équivalent du middleware en Next 16) bloque
  toute requête vers `/admin/**` (hors `login`, `mot-de-passe-oublie`, `reinitialiser-mot-de-passe`)
  sans cookie de session valide, ET chaque Route Handler `/api/admin/**` revalide indépendamment la
  session via `requireAdminSession()` avant toute lecture/écriture (défense en profondeur : un
  attaquant qui contournerait le proxy — via un appel direct à l'API par exemple — resterait
  bloqué).
- **Rationale**: le principe I de la constitution est non-négociable et explicite ("aucune route
  d'administration ne doit être accessible sans session valide") — une seule couche de protection
  serait un point de défaillance unique.
- **Alternatives considered**: vérification uniquement dans le proxy (rejeté : les Route Handlers
  restent atteignables directement sans passer par les pages, donc sans garantie que le proxy les
  couvre selon la configuration du `matcher`) ; vérification uniquement par route (rejeté : pas de
  redirection UX propre vers l'écran de connexion pour les pages).

## 5. Réutilisation de l'infrastructure existante

- **Decision**: généraliser `isRateLimited` (`src/lib/rate-limit.ts`, déjà paramétrable en
  `limit`/`windowSeconds`) pour le blocage de connexion (clé `login:{sha256(email)}`, 5/15min) et
  pour limiter les demandes de réinitialisation de mot de passe (même clé, fenêtre plus longue,
  évite le spam d'emails) ; extraire un `sendEmail({ to, subject, text }, config)` générique dans
  `src/lib/email.ts` à partir de `sendContactNotification`, réutilisé par l'email de
  réinitialisation de mot de passe (même provider Resend, même mode `dev-log` en local) ; réutiliser
  telles quelles les schémas Zod déjà écrits (`CompetitionSchema`, `PhotoSchema`,
  `PhotoCategorySchema`, `ClubInfoSchema`, `BoardMemberSchema`, `PartnerSchema`) pour valider les
  écritures du backoffice.
- **Rationale**: ce code a été écrit en anticipation du backoffice pendant la feature 001 (visible
  dans `src/lib/validation.ts`) mais n'était utilisé nulle part côté écriture — l'utiliser évite de
  dupliquer des règles de validation déjà correctes et testées côté lecture.
- **Alternatives considered**: réécrire une validation dédiée au backoffice (rejeté : duplication
  inutile, risque de divergence entre les règles lues par le front et celles appliquées à
  l'écriture).

## 6. Journal d'audit

- **Decision**: table `admin_audit_log` minimale (id, `actor_admin_id`, `action`,
  `target_admin_id` nullable, `created_at`), alimentée uniquement pour les actions sensibles listées
  par FR-017 (création/modification/suppression/désactivation d'un compte administrateur). Pas de
  journalisation des modifications de contenu (compétitions, photos, etc.) — hors périmètre de
  FR-017 et de la spec.
- **Rationale**: reste au plus près de ce que FR-017 demande explicitement, évite une
  fonctionnalité d'audit générique non demandée (YAGNI).
- **Alternatives considered**: journaliser toute modification de contenu (rejeté : non demandé par
  la spec, ajouterait une table/volume de données et une UI de consultation supplémentaires sans
  valeur métier identifiée à ce stade).
