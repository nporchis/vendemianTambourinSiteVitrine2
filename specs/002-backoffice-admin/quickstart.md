# Quickstart: Backoffice d'administration

**Feature**: `002-backoffice-admin` | **Date**: 2026-09-26

Guide de validation end-to-end une fois implémentée. Référez-vous à `data-model.md` et
`contracts/admin-api.md`/`contracts/media.md` pour le détail des champs et endpoints. Complète
`specs/001-front-public-club/quickstart.md` (prérequis D1/KV/Turnstile/email déjà là-bas restent
valables).

## Prérequis additionnels (par rapport à la feature 001)

- Un bucket R2 créé et déclaré dans `wrangler.toml` :
  `npx wrangler r2 bucket create vt-site-media`, binding `MEDIA_BUCKET`.
- Migrations Drizzle appliquées (ajoute `admin`, `admin_session`, `password_reset_token`,
  `admin_audit_log`, et la colonne `contact_request.processed_at`).
- Un premier compte administrateur créé (script de seed dédié, hors périmètre utilisateur de cette
  feature — c'est un prérequis technique de mise en place, pas une fonctionnalité du backoffice
  lui-même) : `npm run seed:admin -- --email=... --password=...`.

## Installation

```bash
npm install
npx wrangler r2 bucket create vt-site-media       # une seule fois
npx drizzle-kit migrate                            # applique les nouvelles migrations sur D1
npm run seed:admin -- --email=admin@club.fr --password="un-mot-de-passe-d-au-moins-12-caracteres"
npm run dev                                         # ou npm run preview pour les bindings Cloudflare (D1/KV/R2)
```

## Scénarios de validation (alignés sur les User Stories du spec)

### 1. Authentification et accès sécurisé (US2, P1)

1. Ouvrir `/admin` sans être connecté → redirigé vers `/admin/login`, aucune donnée backoffice
   visible (FR-001, SC-002).
2. Se connecter avec des identifiants invalides → message d'erreur générique, pas d'indication sur
   ce qui est incorrect.
3. Échouer la connexion 5 fois de suite sur le même compte → la 6ᵉ tentative (même avec les bons
   identifiants) est bloquée pendant 15 minutes (clarification spec.md).
4. Se connecter avec des identifiants valides → accès accordé au tableau de bord `/admin`.
5. Depuis `/admin/comptes`, créer un second compte administrateur → se déconnecter, se reconnecter
   avec ce second compte → mêmes droits, accès à toutes les sections (FR-002, SC-004).
6. Désactiver le premier compte depuis le second → toute session ouverte du premier compte est
   invalidée immédiatement (rechargement d'une page → redirection vers `/admin/login`) (FR-003).
7. Tenter de désactiver/supprimer le compte actuellement connecté alors qu'il est le dernier compte
   actif restant → refusé avec un message explicite (FR-004, Edge Case).
8. Sur `/admin/login`, demander un lien de réinitialisation de mot de passe pour un email existant
   → recevoir l'email (ou le voir loggé en `dev-log`), l'ouvrir, définir un nouveau mot de passe →
   se connecter avec ; vérifier que toutes les anciennes sessions de ce compte sont invalidées.
9. Réutiliser le même lien de réinitialisation une seconde fois → refusé (jeton déjà utilisé).

**Attendu**: aucune donnée ni action backoffice accessible sans session valide, comptes gérables
depuis l'UI, verrous de sécurité (blocage, expiration, réinitialisation) fonctionnels.

### 2. Gérer le calendrier (US1, P1)

1. Depuis `/admin/competitions`, créer une compétition à venir → l'ouvrir sur le site public
   `/calendrier` : apparaît dans « À venir », sans redéploiement (FR-007, FR-015, SC-001, SC-003).
2. Éditer une compétition passée pour y ajouter un résultat → vérifier le badge victoire/défaite
   public.
3. Supprimer une compétition → disparaît immédiatement du site public.

### 3. Gérer la galerie photo (US3, P2)

1. Depuis `/admin/galerie`, téléverser une photo JPEG de 3 Mo avec une catégorie existante →
   apparaît dans `/galerie` sous cette catégorie (FR-008).
2. Créer une nouvelle catégorie au passage → disponible immédiatement dans le filtre public.
3. Tenter de téléverser un fichier de 15 Mo → refusé, message explicite sur la limite de 10 Mo
   (FR-009, clarification spec.md).
4. Tenter de téléverser un fichier `.gif` → refusé, message explicite sur les formats acceptés
   (JPEG/PNG/WebP).
5. Supprimer une photo → disparaît immédiatement de la galerie publique et son objet R2 associé
   n'est plus servi (`GET /media/{key}` renvoie 404).

### 4. Gérer les infos du club (US4, P2)

1. Modifier le texte de présentation et un chiffre clé depuis `/admin/club` → vérifier
   l'affichage mis à jour sur `/` et `/le-club` (FR-010).
2. Ajouter puis retirer un membre du bureau → liste publique mise à jour (FR-011).

### 5. Gérer les partenaires (US5, P3)

1. Ajouter un partenaire avec un niveau et un logo depuis `/admin/partenaires` → apparaît dans la
   bonne section de `/partenaires` (FR-012).
2. Retirer un partenaire → disparaît de la page publique.

### 6. Consulter et traiter les demandes de contact (US6, P3)

1. Soumettre une demande via le formulaire public `/contact` → elle apparaît dans
   `/admin/contacts` avec toutes ses informations et le statut « non traitée » (FR-013).
2. La marquer comme traitée → statut mis à jour, reste visible dans la liste.
3. La supprimer manuellement → retirée définitivement, avant l'échéance des 12 mois de purge
   automatique (FR-014, SC-005).

## Tests automatisés

```bash
npm run test        # Vitest — password.ts (scrypt), session.ts, media-storage.ts, validation réutilisée
npm run test:e2e     # Playwright — les 6 scénarios ci-dessus + audit a11y (axe-core) sur les pages /admin
```

## Vérification de la sécurité (principe I)

```bash
npm run preview
# Vérifier qu'aucune page/route /admin/** ni /api/admin/** ne répond avec un contenu autre
# qu'une redirection/401 sans cookie de session valide :
curl -i http://localhost:8788/admin
curl -i http://localhost:8788/api/admin/competitions
```
