# Feature Specification: Front public du club Vendémian Tambourin

**Feature Branch**: `001-front-public-club`

**Created**: 2026-09-09

**Status**: Draft

**Input**: User description: "Front public du site du club Vendémian Tambourin, en remplacement de https://vendemiantambourin5.wixsite.com/vendemian-tambourin. Le front doit être accessible publiquement sans authentification et présenter : une page Accueil, une page de présentation du club, un calendrier de compétition, une galerie photo, une page de liens utiles, et une page/formulaire de contact. Le contenu affiché (calendrier, galerie, infos du club, coordonnées) doit être géré via un backoffice (feature séparée, pas encore spécifiée) — pour cette feature, le contenu peut être considéré comme déjà disponible via un modèle de données/API à définir."

## Clarifications

### Session 2026-09-09

- Q: Comment le formulaire de contact doit-il se protéger contre les soumissions abusives (spam, bots) ? → A: CAPTCHA/anti-bot (reCAPTCHA, hCaptcha...)
- Q: Les données personnelles saisies dans le formulaire de contact doivent-elles être accompagnées d'une mention/consentement RGPD et d'une durée de conservation définie ? → A: Mention RGPD + durée de conservation définie
- Q: Quelle durée de conservation doit être appliquée aux demandes de contact avant suppression/purge automatique ? → A: 12 mois
- Q: La galerie photo doit-elle permettre de filtrer/regrouper les photos par événement ou catégorie, ou s'agit-il d'une simple liste chronologique sans regroupement ? → A: Regroupement par événement/catégorie
- Q: Pour les compétitions passées, faut-il montrer un résultat (classement, score) en plus de la date/nom/lieu ? → A: Ajouter un résultat optionnel (classement/score)

### Session 2026-09-23

- Q: Si l'envoi de l'email de notification au club échoue après validation et enregistrement de la demande de contact, le visiteur doit-il quand même voir la confirmation de succès ? → A: Non — la confirmation n'est affichée que si l'email a été envoyé avec succès (message d'erreur explicite sinon)
- Q: Le bouton « Charger plus de photos » de la galerie implique-t-il une pagination serveur réelle, ou un simple affichage progressif d'une liste déjà chargée ? → A: Pagination serveur réelle, déclenchée automatiquement au défilement (infinite scroll), sans clic supplémentaire
- Q: La mention RGPD du formulaire de contact doit-elle renvoyer vers une page dédiée « Politique de confidentialité » ? → A: Oui — page publique statique dédiée, liée depuis la mention RGPD
- Q: Le formulaire de contact doit-il appliquer une limite de fréquence (rate limiting) par IP en plus de Turnstile ? → A: Oui — limite de fréquence par adresse IP en complément de Turnstile
- Q: Une page 404 personnalisée est-elle requise, ou la page par défaut du framework suffit-elle ? → A: Oui — page 404 personnalisée, dans le style du site, avec lien de retour vers l'accueil

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Découvrir le club (Priority: P1)

Un visiteur arrive sur le site pour la première fois et souhaite comprendre ce qu'est le club, son
activité (tambourin), et se faire une première impression via la page d'accueil et la page de
présentation.

**Why this priority**: C'est le point d'entrée de tout visiteur ; sans cette page, le site n'a pas
de valeur. C'est le remplacement direct de la page d'accueil du site Wix actuel.

**Independent Test**: Peut être testé en accédant à l'accueil et à la page de présentation sans
connexion, et en vérifiant que les informations clés du club (nom, activité, présentation) y sont
visibles.

**Acceptance Scenarios**:

1. **Given** un visiteur non authentifié, **When** il ouvre la page d'accueil, **Then** il voit le
   nom du club, une présentation courte et les principaux points d'entrée (calendrier, galerie,
   contact).
2. **Given** un visiteur sur la page d'accueil, **When** il navigue vers la page de présentation,
   **Then** il voit l'histoire du club, ses valeurs et les informations sur l'encadrement/l'équipe.

---

### User Story 2 - Consulter le calendrier des compétitions (Priority: P1)

Un membre, parent de membre, ou visiteur souhaite connaître les prochaines compétitions du club
(dates, lieux) ainsi que les compétitions passées.

**Why this priority**: C'est une des informations les plus recherchées par les familles et membres
du club ; son absence rendrait le site incomplet par rapport au site Wix actuel.

**Independent Test**: Peut être testé en accédant à la page calendrier et en vérifiant que les
événements affichés incluent au minimum une date, un nom et un lieu, triés de façon compréhensible
(à venir / passés).

**Acceptance Scenarios**:

1. **Given** des compétitions enregistrées, **When** un visiteur ouvre la page calendrier, **Then**
   il voit la liste des compétitions à venir avec date, nom et lieu.
2. **Given** aucune compétition à venir enregistrée, **When** un visiteur ouvre la page calendrier,
   **Then** un message clair indique qu'aucune compétition n'est planifiée pour le moment.

---

### User Story 3 - Parcourir la galerie photo (Priority: P2)

Un visiteur souhaite voir des photos du club, de ses membres et de ses événements pour se faire une
idée de l'ambiance et de l'activité.

**Why this priority**: Renforce l'attractivité et la confiance, mais le site reste fonctionnel sans
elle dans un premier temps (contrairement au calendrier ou à la présentation).

**Independent Test**: Peut être testé en accédant à la page galerie et en vérifiant que les photos
s'affichent correctement et restent lisibles/naviguables sur mobile.

**Acceptance Scenarios**:

1. **Given** des photos enregistrées, **When** un visiteur ouvre la galerie, **Then** il voit une
   première page de photos affichées de façon lisible.
2. **Given** un visiteur qui a chargé la première page de photos, **When** il fait défiler la page
   jusqu'au bas des photos déjà affichées, **Then** la page suivante de photos se charge
   automatiquement, sans clic supplémentaire (FR-018).
3. **Given** aucune photo enregistrée, **When** un visiteur ouvre la galerie, **Then** un message
   clair indique que la galerie sera bientôt disponible.

---

### User Story 4 - Trouver des liens utiles et contacter le club (Priority: P3)

Un visiteur souhaite accéder à des ressources externes utiles (fédération, partenaires, réseaux
sociaux) et/ou contacter le club pour une question (inscription, partenariat, presse).

**Why this priority**: Utile et attendu, mais moins critique au quotidien que la découverte du
club, le calendrier ou la galerie ; peut être livré après les autres parcours.

**Independent Test**: Peut être testé en accédant à la page liens utiles et en vérifiant que les
liens s'ouvrent correctement, puis en soumettant le formulaire de contact et en vérifiant qu'une
confirmation ou une erreur claire s'affiche.

**Acceptance Scenarios**:

1. **Given** une liste de liens utiles configurée, **When** un visiteur ouvre la page liens utiles,
   **Then** il voit les liens avec leur libellé et peut les ouvrir.
2. **Given** un visiteur sur la page de contact, **When** il remplit et soumet le formulaire avec
   des informations valides, **Then** il reçoit une confirmation que sa demande a bien été envoyée.
3. **Given** un visiteur sur la page de contact, **When** il soumet le formulaire avec un champ
   requis manquant ou un email invalide, **Then** un message d'erreur clair lui indique quoi
   corriger, sans perdre les autres champs déjà saisis.

---

### Edge Cases

- Que se passe-t-il si le calendrier ou la galerie ne contient aucun élément (site tout juste
  lancé, backoffice pas encore alimenté) ? → un état vide explicite doit être affiché (voir US2,
  US3), jamais une page cassée ou vide sans explication.
- Que se passe-t-il si le formulaire de contact est soumis avec des données invalides ou
  incomplètes ? → l'utilisateur doit voir clairement quels champs corriger, sans perdre sa saisie.
- Que se passe-t-il si un visiteur accède au site depuis un mobile avec une connexion lente ? → les
  pages, notamment la galerie, doivent rester utilisables (voir principe Performance &
  Accessibilité de la constitution).
- Que se passe-t-il si un lien utile externe est cassé ou obsolète ? → hors scope technique de cette
  feature (dépend du contenu saisi côté backoffice), mais le lien doit s'ouvrir dans un nouvel
  onglet sans casser la navigation du site.
- Que se passe-t-il si l'envoi de l'email de notification au club échoue alors que la demande de
  contact a été validée ? → le visiteur voit un message d'erreur explicite (pas de confirmation de
  succès), sans perte des champs déjà saisis (voir FR-017).
- Que se passe-t-il lorsque le visiteur a fait défiler la galerie jusqu'à la dernière page de
  photos disponible ? → le défilement ne déclenche plus de nouveau chargement, sans erreur ni
  message intrusif (voir FR-018).
- Que se passe-t-il si une même adresse IP dépasse la limite de fréquence de soumission du
  formulaire de contact ? → un message d'erreur explicite indique que la limite est atteinte et
  invite à réessayer plus tard, sans perte des champs déjà saisis (voir FR-020).
- Que se passe-t-il si un visiteur accède à une URL inexistante ? → une page 404 personnalisée,
  dans le style du site, s'affiche avec un lien de retour vers l'accueil (voir FR-021).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Le système DOIT afficher une page d'accueil publique, accessible sans authentification,
  présentant le club et ses points d'entrée principaux (présentation, calendrier, galerie, contact).
- **FR-002**: Le système DOIT afficher une page de présentation du club incluant son histoire, ses
  valeurs et des informations sur l'encadrement/l'équipe.
- **FR-003**: Le système DOIT afficher un calendrier des compétitions listant les événements avec au
  minimum un nom, une date et un lieu, en distinguant les événements à venir des événements passés.
- **FR-004**: Le système DOIT afficher une galerie photo présentant des images du club et de ses
  événements.
- **FR-018**: Le système DOIT charger les photos de la galerie par page côté serveur (pagination) et
  charger automatiquement la page suivante lorsque le visiteur atteint le bas des photos déjà
  affichées (défilement infini), sans action de clic supplémentaire.
- **FR-005**: Le système DOIT afficher une page de liens utiles listant des ressources externes
  (fédération, partenaires, réseaux sociaux, etc.) avec un libellé et une URL.
- **FR-006**: Le système DOIT fournir un moyen de contact permettant à un visiteur d'envoyer une
  demande au club, comprenant au minimum un formulaire (nom, email, message).
- **FR-007**: Le système DOIT valider les champs du formulaire de contact avant envoi (champs
  requis, format d'email) et afficher un message de confirmation en cas de succès ou un message
  d'erreur explicite en cas d'échec.
- **FR-008**: Le système DOIT rendre l'ensemble des pages publiques listées (accueil, présentation,
  calendrier, galerie, liens utiles, contact, politique de confidentialité) consultables sans
  compte ni connexion.
- **FR-009**: Le système DOIT afficher le contenu des pages (calendrier, galerie, informations du
  club, liens utiles, coordonnées) à partir de données pouvant être mises à jour sans modification
  du code du front public.
- **FR-010**: Le système DOIT rester utilisable et lisible sur mobile, tablette et ordinateur de
  bureau.
- **FR-011**: Le système DOIT afficher un état vide explicite et compréhensible lorsque le
  calendrier ou la galerie ne contient aucun élément.
- **FR-012**: Le système DOIT protéger le formulaire de contact contre les soumissions automatisées
  via un mécanisme anti-bot (CAPTCHA) avant l'envoi.
- **FR-013**: Le système DOIT afficher, au moment de la saisie du formulaire de contact, une mention
  d'information sur l'usage des données transmises (RGPD).
- **FR-014**: Le système DOIT supprimer automatiquement les demandes de contact 12 mois après leur
  date d'envoi.
- **FR-015**: Le système DOIT permettre de regrouper et filtrer les photos de la galerie par
  événement ou catégorie.
- **FR-016**: Le système DOIT afficher, pour une compétition passée, un résultat (classement ou
  score) lorsque celui-ci est renseigné.
- **FR-017**: Le système DOIT n'afficher le message de confirmation de succès de la demande de
  contact que si l'email de notification au club a été envoyé avec succès ; en cas d'échec de cet
  envoi, un message d'erreur explicite DOIT être affiché au visiteur, sans perte des champs déjà
  saisis.
- **FR-019**: Le système DOIT afficher une page publique dédiée présentant la politique de
  confidentialité (usage et durée de conservation des données du formulaire de contact),
  accessible sans authentification et liée depuis la mention RGPD du formulaire de contact
  (FR-013).
- **FR-020**: Le système DOIT limiter le nombre de soumissions du formulaire de contact acceptées
  par adresse IP sur une fenêtre de temps glissante, en complément de la vérification anti-bot
  Turnstile (FR-012), et retourner une erreur explicite au-delà de cette limite.
- **FR-021**: Le système DOIT afficher une page 404 personnalisée, dans le style visuel du site,
  pour toute URL inexistante, avec au minimum un lien de retour vers la page d'accueil.

### Key Entities *(include if feature involves data)*

- **Compétition**: événement du calendrier du club — nom, date, lieu, description optionnelle,
  statut dérivé (à venir / passée), résultat optionnel (classement/score) affiché uniquement pour
  les compétitions passées.
- **Photo**: élément de la galerie — image, légende optionnelle, regroupement par événement ou
  catégorie (utilisé pour le filtrage).
- **Informations du club**: contenu de présentation — texte de présentation/histoire, valeurs,
  coordonnées de contact affichées, réseaux sociaux.
- **Lien utile**: ressource externe référencée — libellé, URL, catégorie optionnelle.
- **Demande de contact**: message envoyé via le formulaire — nom, email, message, date d'envoi,
  validation anti-bot (CAPTCHA), mention RGPD affichée à la saisie ; supprimée automatiquement 12
  mois après la date d'envoi.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un visiteur trouve les informations essentielles du club (présentation, prochaine
  compétition, moyen de contact) en moins de 2 minutes depuis la page d'accueil.
- **SC-002**: 95% des pages publiques affichent leur contenu principal en moins de 2,5 secondes sur
  une connexion mobile standard.
- **SC-003**: Un visiteur peut envoyer une demande via le formulaire de contact et obtenir une
  confirmation en moins d'1 minute, sans assistance externe.
- **SC-004**: L'ensemble des pages publiques reste pleinement lisible et navigable sur mobile,
  tablette et ordinateur de bureau, sans perte de contenu ni de fonctionnalité.
- **SC-005**: Une mise à jour du contenu (calendrier, galerie, infos du club, liens utiles) réalisée
  côté gestion de contenu est visible sur le front public sans intervention technique ni
  redéploiement du code.

## Assumptions

- Le contenu affiché (calendrier, galerie, informations du club, liens utiles, coordonnées) est
  fourni par un modèle de données/API géré par une feature backoffice séparée, pas encore
  spécifiée ; pour cette feature, ce contenu est considéré comme déjà disponible en lecture.
- Les demandes envoyées via le formulaire de contact sont transmises aux responsables du club par un
  canal dont le choix technique (ex. email) sera défini lors du `/speckit-plan` ; cette feature se
  limite à la capture, la validation et la confirmation d'envoi du message.
- Aucun compte utilisateur ni authentification n'est nécessaire côté front public ; l'accès au
  backoffice fait l'objet d'une feature séparée.
- Le volume de trafic attendu correspond à celui d'un club de sport amateur (faible à modéré), sans
  besoin de scalabilité massive.
- Les photos de la galerie sont fournies dans un format déjà adapté au web ; leur optimisation lors
  de l'ajout (upload côté backoffice) est hors scope de cette feature front public.
- Le contenu de la page « Politique de confidentialité » (FR-019) est un texte juridique statique,
  non géré via le backoffice (contrairement au calendrier, à la galerie, aux infos du club et aux
  liens utiles) ; il évolue au même rythme que le code du front public.
- Le seuil exact de la limite de fréquence par IP du formulaire de contact (FR-020) n'est pas fixé
  par cette spec ; à titre de point de départ raisonnable pour un club amateur (faible volume), 5
  soumissions par heure et par IP est proposé, à affiner lors de `/speckit-plan` si besoin.
