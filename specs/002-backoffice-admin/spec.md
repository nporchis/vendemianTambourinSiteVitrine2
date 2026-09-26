# Feature Specification: Backoffice d'administration

**Feature Branch**: `002-backoffice-admin`

**Created**: 2026-09-26

**Status**: Draft

**Input**: User description: "Backoffice d'administration pour le site Vendémian Tambourin : interface protégée par authentification permettant à un ou plusieurs administrateurs du club de gérer le contenu affiché sur le site public (feature 001) sans intervention d'un développeur — calendrier des compétitions, galerie photo (upload + catégories), infos du club (histoire, chiffres clés, bureau/membres), partenaires, et consultation des demandes de contact reçues via le formulaire public. Réutilise le même schéma Drizzle/D1 que le front public."

## Clarifications

### Session 2026-09-26

- Q: Si un administrateur oublie son mot de passe, comment peut-il retrouver l'accès au backoffice ? → A: Réinitialisation par email (lien envoyé à l'adresse enregistrée, via l'infrastructure email déjà en place).
- Q: Au bout de combien de temps d'inactivité la session d'un administrateur doit-elle expirer automatiquement ? → A: 24 heures.
- Q: Après combien de tentatives de connexion échouées le système doit-il bloquer temporairement un compte, et pour combien de temps ? → A: 5 tentatives / 15 minutes.
- Q: Quelles limites de taille et de format doivent s'appliquer aux photos téléversées dans la galerie ? → A: 10 Mo maximum, formats JPEG/PNG/WebP.
- Q: Quelle exigence minimale de complexité doit avoir le mot de passe d'un compte administrateur ? → A: 12 caractères minimum (pas de règle de composition supplémentaire).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Gérer le calendrier des compétitions (Priority: P1)

Un administrateur du club se connecte au backoffice et ajoute une nouvelle compétition à venir
(date, adversaire/lieu, catégorie), modifie une compétition existante, ou saisit le résultat d'une
compétition passée (score, classement) une fois celle-ci jouée. Le site public reflète ces
changements immédiatement.

**Why this priority**: Le calendrier est le contenu qui change le plus souvent (chaque saison,
chaque match) et c'était la fonctionnalité la plus visible côté public (US1 de la feature 001).
Sans cette capacité, le site public devient vite obsolète.

**Independent Test**: Se connecter au backoffice, créer une compétition à venir avec une date
future, vérifier qu'elle apparaît sur la page publique `/calendrier` dans la section "À venir" ;
éditer une compétition passée pour lui ajouter un résultat, vérifier son affichage public.

**Acceptance Scenarios**:

1. **Given** un administrateur connecté sur le backoffice, **When** il crée une compétition avec
   une date future et une catégorie valides, **Then** la compétition apparaît sur la page publique
   du calendrier, triée par date, sans redéploiement.
2. **Given** une compétition passée sans résultat, **When** l'administrateur y ajoute un score et
   un classement, **Then** le site public affiche le résultat sous forme de badge victoire/défaite.
3. **Given** une compétition existante, **When** l'administrateur la supprime, **Then** elle
   disparaît immédiatement du site public.

---

### User Story 2 - Authentification et accès sécurisé (Priority: P1)

Un administrateur du club se connecte au backoffice avec ses identifiants ; toute personne non
authentifiée qui tente d'accéder à une page ou une action du backoffice est refusée et redirigée
vers l'écran de connexion. Un administrateur existant peut créer un compte pour un nouvel
administrateur (par ex. un nouveau membre du bureau) et révoquer l'accès d'un administrateur qui
quitte ses fonctions.

**Why this priority**: C'est un prérequis non-négociable (principe I de la constitution :
Sécurité by Design) à toutes les autres user stories — aucune fonctionnalité de gestion de contenu
ne peut être livrée sans que l'accès soit d'abord verrouillé.

**Independent Test**: Tenter d'accéder à une URL du backoffice sans être connecté → redirection
vers la connexion. Se connecter avec des identifiants valides → accès accordé. Créer un second
compte administrateur depuis le backoffice, se déconnecter, se reconnecter avec ce second compte →
accès accordé avec les mêmes droits.

**Acceptance Scenarios**:

1. **Given** un visiteur non authentifié, **When** il accède à une URL du backoffice, **Then** il
   est redirigé vers l'écran de connexion et aucune donnée du backoffice ne lui est présentée.
2. **Given** des identifiants invalides, **When** un utilisateur tente de se connecter, **Then**
   l'accès est refusé avec un message d'erreur générique (sans indiquer si c'est l'identifiant ou
   le mot de passe qui est incorrect).
3. **Given** un administrateur connecté, **When** il crée un compte pour un nouvel administrateur,
   **Then** ce nouveau compte peut se connecter et accéder à l'ensemble des fonctionnalités du
   backoffice.
4. **Given** un administrateur connecté, **When** il révoque (désactive ou supprime) le compte d'un
   autre administrateur, **Then** ce compte ne peut plus se connecter et toute session déjà ouverte
   pour ce compte est invalidée.
5. **Given** un administrateur inactif pendant 24 heures, **When** sa session expire,
   **Then** il doit se reconnecter pour continuer à utiliser le backoffice.
6. **Given** un administrateur qui a oublié son mot de passe, **When** il demande une
   réinitialisation, **Then** il reçoit un lien de réinitialisation à son adresse email enregistrée
   lui permettant de définir un nouveau mot de passe.
7. **Given** 5 tentatives de connexion échouées consécutives sur un même compte, **When** une 6ᵉ
   tentative est effectuée, **Then** le compte est temporairement bloqué pendant 15 minutes, même
   avec les bons identifiants.

---

### User Story 3 - Gérer la galerie photo (Priority: P2)

Un administrateur ajoute de nouvelles photos à la galerie publique (par exemple après un
événement), en les associant à une catégorie existante ou en créant une nouvelle catégorie, et peut
retirer une photo qui ne doit plus être visible.

**Why this priority**: Contenu visuel très demandé après chaque compétition/événement, mais moins
fréquent et moins critique dans l'urgence que la mise à jour du calendrier.

**Independent Test**: Uploader une photo avec une catégorie, vérifier qu'elle apparaît sur
`/galerie` filtrable par cette catégorie ; supprimer une photo, vérifier sa disparition immédiate.

**Acceptance Scenarios**:

1. **Given** un administrateur connecté, **When** il téléverse une photo et lui assigne une
   catégorie existante, **Then** la photo apparaît dans la galerie publique sous cette catégorie.
2. **Given** aucune catégorie ne convient, **When** l'administrateur crée une nouvelle catégorie
   lors de l'ajout d'une photo, **Then** cette catégorie devient disponible pour le filtre public de
   la galerie.
3. **Given** un fichier de plus de 10 Mo ou dans un format autre que JPEG/PNG/WebP, **When**
   l'administrateur tente de le téléverser, **Then** le système refuse l'import et explique la
   raison (taille ou format non supporté).
4. **Given** une photo existante, **When** l'administrateur la supprime, **Then** elle disparaît
   immédiatement de la galerie publique.

---

### User Story 4 - Gérer les informations du club (Priority: P2)

Un administrateur met à jour les informations générales du club affichées sur le site public :
histoire/présentation, chiffres clés (ex. nombre de licenciés, année de création), et la liste des
membres du bureau (nom, rôle, éventuellement photo).

**Why this priority**: Ce contenu change rarement (une fois par saison typiquement pour le bureau)
mais doit rester modifiable sans développeur, notamment lors du renouvellement annuel du bureau.

**Independent Test**: Modifier le texte de présentation et un chiffre clé, vérifier leur affichage
sur la page d'accueil et `/le-club` ; ajouter/retirer un membre du bureau, vérifier la mise à jour
de la liste publique.

**Acceptance Scenarios**:

1. **Given** un administrateur connecté, **When** il modifie le texte de présentation du club ou un
   chiffre clé, **Then** le contenu mis à jour est visible sur les pages publiques concernées.
2. **Given** un nouveau bureau élu, **When** l'administrateur ajoute, modifie ou retire des membres
   du bureau, **Then** la liste publique des membres du bureau reflète ces changements.

---

### User Story 5 - Gérer les partenaires (Priority: P3)

Un administrateur ajoute, modifie ou retire un partenaire du club (nom, niveau
principal/soutien/institutionnel, logo, lien éventuel), reflété sur la page publique
`/partenaires`.

**Why this priority**: Contenu qui change peu souvent (quelques fois par an au renouvellement des
partenariats), et dont l'absence de mise à jour immédiate a un impact limité sur l'expérience des
visiteurs du site.

**Independent Test**: Ajouter un partenaire avec un niveau donné, vérifier son apparition dans la
bonne section de `/partenaires` ; retirer un partenaire, vérifier sa disparition.

**Acceptance Scenarios**:

1. **Given** un administrateur connecté, **When** il ajoute un partenaire avec un nom, un niveau et
   un logo, **Then** le partenaire apparaît publiquement dans la section correspondant à son
   niveau.
2. **Given** un partenariat qui prend fin, **When** l'administrateur retire ce partenaire,
   **Then** il n'apparaît plus sur la page publique.

---

### User Story 6 - Consulter et traiter les demandes de contact (Priority: P3)

Un administrateur consulte la liste des demandes envoyées via le formulaire de contact public
(nom, coordonnées, sujet, message, date de réception), peut la marquer comme traitée, et peut la
supprimer manuellement (par exemple à la demande de la personne concernée, au titre du droit à
l'effacement RGPD, sans attendre la purge automatique à 12 mois).

**Why this priority**: Fonctionnalité de consultation qui apporte de la valeur mais dont l'absence
n'empêche pas le fonctionnement du site public ni la réception effective des emails de
notification déjà en place (feature 001) ; elle vient compléter le suivi côté club.

**Independent Test**: Soumettre une demande via le formulaire public, vérifier qu'elle apparaît
dans le backoffice ; la marquer comme traitée puis la supprimer, vérifier qu'elle disparaît de la
liste.

**Acceptance Scenarios**:

1. **Given** une nouvelle demande de contact soumise sur le site public, **When** l'administrateur
   ouvre la liste des demandes dans le backoffice, **Then** la demande apparaît avec l'ensemble de
   ses informations et son statut (non traitée).
2. **Given** une demande de contact, **When** l'administrateur la marque comme traitée, **Then**
   son statut est mis à jour et reste visible dans l'historique.
3. **Given** une demande de contact, **When** l'administrateur la supprime manuellement, **Then**
   elle est retirée définitivement de la base, avant même l'échéance de purge automatique de 12
   mois.

---

### Edge Cases

- Un administrateur tente de supprimer son propre compte, ou celui du dernier compte administrateur
  restant : le système doit empêcher de se retrouver sans aucun administrateur capable de se
  connecter.
- Deux administrateurs modifient la même compétition/photo/partenaire en même temps : la dernière
  sauvegarde l'emporte, sans message d'erreur bloquant (cohérent avec le principe Simplicité —
  pas de verrouillage collaboratif complexe pour un petit club).
- Un administrateur téléverse une photo dupliquée ou de très mauvaise qualité : le système ne
  bloque pas ce cas (pas de modération de contenu automatisée), c'est à l'administrateur d'assurer
  la qualité éditoriale.
- Une compétition est créée avec une date passée : le système l'accepte (utile pour
  ajouter rétroactivement un match manqué) et l'affiche directement dans la section "Passées".
- Le dernier chiffre clé ou la liste du bureau est vidée entièrement : le site public doit gérer
  gracieusement l'absence de contenu (masquer la section plutôt que planter), comme déjà prévu pour
  la feature 001.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Le système DOIT exiger une authentification valide pour accéder à toute page ou
  action du backoffice ; tout accès non authentifié est redirigé vers un écran de connexion.
- **FR-002**: Le système DOIT permettre à un administrateur connecté de créer un nouveau compte
  administrateur (identifiant, mot de passe d'au moins 12 caractères).
- **FR-003**: Le système DOIT permettre à un administrateur connecté de désactiver ou supprimer un
  autre compte administrateur, invalidant immédiatement ses sessions actives.
- **FR-004**: Le système DOIT empêcher la suppression ou désactivation du dernier compte
  administrateur restant, pour garantir qu'un accès reste toujours possible.
- **FR-005**: Le système DOIT bloquer temporairement un compte pendant 15 minutes après 5 tentatives
  de connexion échouées consécutives, afin de limiter les attaques par force brute.
- **FR-006**: Les sessions administrateur DOIVENT expirer après 24 heures d'inactivité et être
  invalidables manuellement (déconnexion explicite).
- **FR-006a**: Le système DOIT permettre à un administrateur ayant oublié son mot de passe de
  demander un lien de réinitialisation envoyé à son adresse email enregistrée, valable pour une
  durée limitée, lui permettant de définir un nouveau mot de passe.
- **FR-007**: Le système DOIT permettre de créer, modifier et supprimer une compétition
  (catégorie, date, adversaire/lieu, et résultat optionnel une fois jouée).
- **FR-008**: Le système DOIT permettre de téléverser une photo, de lui assigner une catégorie
  existante ou nouvelle, et de la supprimer de la galerie.
- **FR-009**: Le système DOIT valider à l'upload que chaque fichier photo ne dépasse pas 10 Mo et
  respecte l'un des formats JPEG, PNG ou WebP, et refuser tout fichier ne respectant pas ces limites
  avec un message explicite.
- **FR-010**: Le système DOIT permettre de modifier le texte de présentation du club et ses
  chiffres clés.
- **FR-011**: Le système DOIT permettre de créer, modifier et supprimer un membre du bureau (nom,
  rôle, photo optionnelle).
- **FR-012**: Le système DOIT permettre de créer, modifier et supprimer un partenaire (nom, niveau,
  logo, lien optionnel).
- **FR-013**: Le système DOIT afficher la liste des demandes de contact reçues via le formulaire
  public, avec leurs informations et un statut traité/non traité.
- **FR-014**: Le système DOIT permettre de marquer une demande de contact comme traitée et de la
  supprimer manuellement à tout moment, indépendamment de la purge automatique à 12 mois déjà en
  place.
- **FR-015**: Toute création, modification ou suppression de contenu via le backoffice DOIT être
  immédiatement reflétée sur le site public, sans redéploiement ni étape de validation
  intermédiaire.
- **FR-016**: Le système DOIT valider côté serveur toutes les données saisies dans le backoffice
  (formats, champs obligatoires, tailles), indépendamment de toute validation côté client.
- **FR-017**: Le système DOIT consigner qui a effectué chaque modification de contenu sensible
  (création/modification/suppression de compte administrateur) et quand, à des fins d'audit.

### Key Entities *(include if feature involves data)*

- **Administrateur** : compte permettant de se connecter au backoffice (identifiant, mot de passe
  stocké de façon sécurisée, statut actif/désactivé). Toutes les entités ci-dessous existent déjà
  côté schéma de données (feature 001) — le backoffice ajoute les capacités de création/
  modification/suppression dessus.
- **Compétition** : réutilise l'entité existante (catégorie, date, adversaire/lieu, résultat
  optionnel).
- **Photo** / **Catégorie de photo** : réutilise les entités existantes ; ajoute la capacité
  d'upload de fichier (pas seulement de métadonnées).
- **Informations du club** : réutilise l'entité singleton existante (histoire, chiffres clés).
- **Membre du bureau** : réutilise l'entité existante.
- **Partenaire** : réutilise l'entité existante.
- **Demande de contact** : réutilise l'entité existante ; ajoute un statut traité/non traité et
  une action de suppression manuelle en plus de la purge automatique.
- **Journal d'audit** *(nouvelle)* : trace des actions sensibles (qui, quoi, quand) sur les comptes
  administrateur.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un administrateur peut publier une nouvelle compétition sur le site public en moins
  de 2 minutes depuis sa connexion au backoffice, sans aucune intervention d'un développeur.
- **SC-002**: 100% des tentatives d'accès non authentifiées à une page du backoffice sont
  bloquées et redirigées vers l'écran de connexion.
- **SC-003**: Toute modification de contenu effectuée dans le backoffice est visible sur le site
  public en moins de 10 secondes.
- **SC-004**: Un nouvel administrateur (par ex. un membre du bureau nouvellement élu) peut obtenir
  un accès fonctionnel au backoffice en moins de 5 minutes, sans support technique externe.
- **SC-005**: Une demande de contact peut être retrouvée, marquée traitée puis supprimée
  manuellement par un administrateur en moins de 1 minute.

## Assumptions

- L'authentification est un système autonome propre au site (identifiant/mot de passe), sans
  dépendance à un fournisseur d'identité externe (pas de SSO/OAuth tiers) — cohérent avec le
  principe Simplicité (YAGNI) et le fait qu'il s'agit d'un club à faible effectif d'administrateurs.
- Un seul niveau de droits existe pour les comptes administrateur (pas de rôles différenciés du
  type "éditeur" vs "super-admin") : tout administrateur peut gérer l'ensemble du contenu et des
  comptes — périmètre volontairement simple pour un petit club, à réévaluer si le nombre
  d'administrateurs augmente significativement.
- Le backoffice réutilise le même schéma de données (Drizzle/D1) que le front public (feature 001)
  ; aucune nouvelle entité de contenu n'est introduite, seule une entité de comptes administrateur
  et un journal d'audit minimal s'ajoutent.
- Les demandes de contact restent soumises à la purge automatique à 12 mois déjà en place (feature
  001) même si elles n'ont pas été traitées manuellement entre-temps.
- Le backoffice est accessible depuis un ordinateur ou une tablette ; contrairement au site public,
  un support mobile pleinement optimisé n'est pas requis (les administrateurs gèrent le contenu
  principalement depuis un poste fixe ou une tablette), mais l'interface doit rester utilisable
  sans être inaccessible sur mobile.
- Il n'existe pas de limite fixée par la spécification au nombre de comptes administrateur ; c'est
  au premier administrateur (créé lors de la mise en place initiale, hors périmètre utilisateur de
  cette feature) d'inviter les suivants.
