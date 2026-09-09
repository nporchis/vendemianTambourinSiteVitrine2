<!--
Sync Impact Report
Version change: (template, unratified) → 1.0.0
Modified principles: n/a (initial ratification)
Added sections:
  - Core Principles: I. Sécurité by Design, II. Performance & Accessibilité,
    III. Simplicité (YAGNI), IV. Séparation Front public / Backoffice
  - Contraintes de Contenu & Technique
  - Workflow de Développement
  - Governance
Removed sections: none (initial ratification from template)
Templates requiring updates:
  - .specify/templates/plan-template.md — ⚠ pending manual check (not reviewed in this run)
  - .specify/templates/spec-template.md — ⚠ pending manual check
  - .specify/templates/tasks-template.md — ⚠ pending manual check
Follow-up TODOs: none
-->

# Vendémian Tambourin SiteV2 Constitution

## Core Principles

### I. Sécurité by Design (NON-NEGOTIABLE)
Toute donnée entrante (formulaire de contact, saisies du backoffice) DOIT être validée et
assainie côté serveur ; le client n'est jamais une source de confiance. Le backoffice DOIT être
protégé par authentification et aucune route d'administration ne doit être accessible sans
session valide. Les secrets (clés API, identifiants, jetons) ne sont jamais committés en clair
dans le dépôt et doivent être gérés via variables d'environnement ou un gestionnaire de secrets.
**Rationale**: le site expose un backoffice capable de modifier le contenu public du club ; une
faille de sécurité aurait un impact direct et visible sur l'image du club et ses membres.

### II. Performance & Accessibilité
Les pages publiques (Accueil, présentation du club, calendrier de compétition, galerie photo,
liens utiles, contact) DOIVENT respecter les seuils "Good" des Core Web Vitals (LCP, CLS, INP)
mesurés via Lighthouse/PageSpeed. Les images, en particulier celles de la galerie photo, DOIVENT
être optimisées, redimensionnées et chargées en lazy-loading. Le site DOIT rester navigable au
clavier et respecter au minimum les critères WCAG AA (contrastes, textes alternatifs, structure
sémantique HTML). **Rationale**: le public visé (membres, familles, visiteurs occasionnels) navigue
majoritairement depuis un mobile ; un site lent ou inaccessible nuit directement à l'objectif de
visibilité et d'attractivité du club.

### III. Simplicité (YAGNI)
Seules les fonctionnalités explicitement demandées sont construites : Accueil, présentation du
club, calendrier de compétition, galerie photo, liens utiles, contact, et le backoffice de gestion
de ce contenu. Aucune fonctionnalité spéculative (multi-langue, e-commerce, espace membre avancé,
etc.) n'est ajoutée sans demande explicite préalable. Les solutions techniques éprouvées et un
stack minimal sont préférés aux abstractions ou frameworks superflus. **Rationale**: le club ne
dispose pas de ressources dédiées pour maintenir une architecture complexe ; chaque composant
ajouté est un coût de maintenance futur à justifier.

### IV. Séparation Front public / Backoffice
Le front public reste consultable par tous sans authentification. Le backoffice est le seul point
d'entrée autorisé pour modifier le contenu affiché sur le front (pas d'édition manuelle de
fichiers ou de base de données en production). Toute donnée éditable via le backoffice (calendrier,
galerie, informations du club, coordonnées de contact) DOIT reposer sur un modèle de données clair
et versionné. **Rationale**: c'est l'exigence fonctionnelle centrale du projet — un site
consultable publiquement couplé à une interface d'administration de contenu simple pour les
membres du club non-développeurs.

## Contraintes de Contenu & Technique

Le site remplace https://vendemiantambourin5.wixsite.com/vendemian-tambourin en conservant les
mêmes rubriques fonctionnelles (Accueil, présentation du club, calendrier de compétition, galerie
photo, liens utiles, contact) tout en améliorant l'expérience utilisateur, la performance et
l'accessibilité par rapport à la version Wix existante. Le choix du stack technique est fait lors
de `/speckit-plan`, mais il DOIT permettre : un hébergement simple et abordable pour une
association sportive, une gestion de contenu accessible à un administrateur non-développeur via le
backoffice, et de bonnes performances sur mobile.

## Workflow de Développement

Chaque nouvelle fonctionnalité suit le cycle Spec Kit : `/speckit-specify` → `/speckit-plan` →
`/speckit-tasks` → `/speckit-implement`. Toute fonctionnalité touchant à l'authentification du
backoffice ou à la sécurité DOIT faire l'objet d'une revue explicite avant merge.

## Governance

Cette constitution prévaut sur toute pratique de développement ad-hoc au sein du projet. Toute
modification DOIT être documentée dans un Sync Impact Report et accompagnée d'un incrément de
version sémantique (MAJOR pour un retrait/redéfinition incompatible d'un principe, MINOR pour
l'ajout d'un principe ou d'une section, PATCH pour une clarification). Les revues de code et de
plan DOIVENT vérifier la conformité aux principes ci-dessus ; toute complexité additionnelle non
justifiée doit être signalée et simplifiée.

**Version**: 1.0.0 | **Ratified**: 2026-09-09 | **Last Amended**: 2026-09-09
