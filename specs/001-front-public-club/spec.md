# Feature Specification: Front public du club Vendémian Tambourin

**Feature Branch**: `001-front-public-club`

**Created**: 2026-09-09

**Status**: Draft — révisée le 2026-09-24 (maquettes v11 validées)

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

### Révision 2026-09-24 (maquettes v11 validées)

Décisions prises avec l'utilisateur après fusion de la direction « Fronton » et du contenu de la
maquette « Site vitrine » (référence visuelle : https://claude.ai/artifact/HMJG4Z85iZobGTzk8gWjYR,
version 11) :

- La page « Liens utiles » est remplacée par une page « Partenaires » (FR-005) ; l'entité Lien utile
  disparaît au profit de l'entité Partenaire.
- Nouvelle page publique « Le tambourin » présentant le sport, au contenu statique (FR-022).
- Formulaire de contact : prénom et nom séparés, sujet obligatoire parmi une liste fermée,
  présélectionnable depuis d'autres pages (FR-006, FR-023).
- Accueil : chiffres clés du club et bloc « Prochain match » avec compte à rebours (FR-024, FR-025).
- La page de présentation devient « Le club » et liste les membres du bureau (FR-002, FR-026).
- Navigation principale et pied de page redéfinis (FR-027).
- Hors périmètre confirmé, reporté à une feature ultérieure : équipes et effectifs, actualités,
  adhésion en ligne, filtre du calendrier par équipe, classement de championnat, palmarès, envoi de
  photos par les visiteurs.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Découvrir le club (Priority: P1)

Un visiteur arrive sur le site pour la première fois et souhaite comprendre ce qu'est le club, son
activité (le tambourin), et se faire une première impression via la page d'accueil, la page « Le
club » et la page « Le tambourin ».

**Why this priority**: C'est le point d'entrée de tout visiteur ; sans cette page, le site n'a pas
de valeur. C'est le remplacement direct de la page d'accueil du site Wix actuel.

**Independent Test**: Peut être testé en accédant à l'accueil, à la page « Le club » et à la page
« Le tambourin » sans connexion, et en vérifiant que les informations clés du club (nom, activité,
chiffres clés, prochain match, présentation) y sont visibles.

**Acceptance Scenarios**:

1. **Given** un visiteur non authentifié, **When** il ouvre la page d'accueil, **Then** il voit le
   nom du club, une présentation courte, les chiffres clés du club et les principaux points d'entrée
   (le tambourin, calendrier, contact).
2. **Given** au moins une compétition à venir enregistrée, **When** un visiteur ouvre la page
   d'accueil, **Then** il voit un bloc « Prochain match » présentant la prochaine compétition (nom,
   date, heure, lieu) et le temps restant avant son début (FR-025).
3. **Given** un visiteur sur la page d'accueil, **When** il navigue vers la page « Le club »,
   **Then** il voit l'histoire du club, ses valeurs et la liste des membres du bureau avec leur rôle.
4. **Given** un visiteur qui ne connaît pas le sport, **When** il ouvre la page « Le tambourin »,
   **Then** il voit les règles en bref, un schéma du terrain, les rôles des joueurs et l'histoire du
   sport, y compris la fondation du club en 1923.

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

### User Story 4 - Découvrir les partenaires et contacter le club (Priority: P3)

Un visiteur souhaite voir qui soutient le club (partenaires privés et institutionnels), et/ou
contacter le club pour une question (essai, adhésion, partenariat, photos, presse).

**Why this priority**: Utile et attendu, mais moins critique au quotidien que la découverte du
club, le calendrier ou la galerie ; peut être livré après les autres parcours.

**Independent Test**: Peut être testé en accédant à la page partenaires et en vérifiant que les
partenaires sont regroupés par niveau et que leurs liens s'ouvrent correctement, puis en soumettant
le formulaire de contact et en vérifiant qu'une confirmation ou une erreur claire s'affiche.

**Acceptance Scenarios**:

1. **Given** des partenaires enregistrés, **When** un visiteur ouvre la page partenaires, **Then** il
   voit les partenaires regroupés par niveau (principal, soutien, institutionnel), dans l'ordre
   défini, et peut ouvrir le site d'un partenaire lorsqu'il est renseigné.
2. **Given** un visiteur sur la page de contact, **When** il remplit et soumet le formulaire avec
   des informations valides, **Then** il reçoit une confirmation que sa demande a bien été envoyée.
3. **Given** un visiteur sur la page de contact, **When** il soumet le formulaire avec un champ
   requis manquant ou un email invalide, **Then** un message d'erreur clair lui indique quoi
   corriger, sans perdre les autres champs déjà saisis.
4. **Given** un visiteur sur la page partenaires, **When** il clique sur « Devenir partenaire »,
   **Then** il arrive sur le formulaire de contact avec le sujet « Partenariat » déjà sélectionné
   (FR-023).

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
- Que se passe-t-il si le site d'un partenaire est cassé ou obsolète ? → hors scope technique de
  cette feature (dépend du contenu saisi côté backoffice), mais le lien doit s'ouvrir dans un
  nouvel onglet sans casser la navigation du site. Un partenaire sans site est affiché sans lien.
- Que se passe-t-il si aucun partenaire n'est enregistré, ou si un niveau n'a aucun partenaire ? →
  un niveau vide n'est pas affiché ; sans aucun partenaire, un état vide explicite s'affiche,
  accompagné du bloc « Devenir partenaire ».
- Que se passe-t-il s'il n'y a aucune compétition à venir ? → le bloc « Prochain match » de
  l'accueil n'est pas affiché (FR-025) ; le reste de la page est inchangé.
- Que se passe-t-il quand l'heure de début du prochain match est atteinte pendant que la page est
  ouverte ? → le compte à rebours s'arrête à zéro sans valeur négative ; le bloc bascule sur la
  compétition suivante au prochain chargement de la page.
- Que se passe-t-il si le visiteur a activé la réduction des animations ? → le compte à rebours et
  les éléments animés n'utilisent aucune animation de mouvement (FR-025).
- Que se passe-t-il si un lien vers le formulaire de contact porte un sujet inconnu ? → aucun sujet
  n'est présélectionné et le visiteur doit en choisir un (FR-023).
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
  présentant le club et ses points d'entrée principaux (le tambourin, le club, calendrier, contact).
- **FR-002**: Le système DOIT afficher une page « Le club » incluant son histoire, ses valeurs et la
  liste des membres du bureau (FR-026).
- **FR-003**: Le système DOIT afficher un calendrier des compétitions listant les événements avec au
  minimum un nom, une date et un lieu, en distinguant les événements à venir des événements passés.
- **FR-004**: Le système DOIT afficher une galerie photo présentant des images du club et de ses
  événements.
- **FR-018**: Le système DOIT charger les photos de la galerie par page côté serveur (pagination) et
  charger automatiquement la page suivante lorsque le visiteur atteint le bas des photos déjà
  affichées (défilement infini), sans action de clic supplémentaire.
- **FR-005**: Le système DOIT afficher une page « Partenaires » listant les partenaires du club
  regroupés par niveau (principal, soutien, institutionnel) et triés selon un ordre d'affichage ;
  chaque partenaire présente son nom et, lorsqu'ils sont renseignés, son logo, une description
  courte et un lien vers son site s'ouvrant dans un nouvel onglet. La page DOIT proposer un bloc
  « Devenir partenaire » menant au formulaire de contact avec le sujet « Partenariat » présélectionné.
- **FR-006**: Le système DOIT fournir un formulaire de contact permettant à un visiteur d'envoyer une
  demande au club, avec les champs prénom, nom, email, sujet et message, tous obligatoires.
- **FR-007**: Le système DOIT valider les champs du formulaire de contact avant envoi (champs
  requis, format d'email) et afficher un message de confirmation en cas de succès ou un message
  d'erreur explicite en cas d'échec.
- **FR-008**: Le système DOIT rendre l'ensemble des pages publiques listées (accueil, le tambourin,
  le club, calendrier, galerie, partenaires, contact, politique de confidentialité) consultables sans
  compte ni connexion.
- **FR-009**: Le système DOIT afficher le contenu des pages (calendrier, galerie, informations du
  club dont chiffres clés et membres du bureau, partenaires, coordonnées) à partir de données
  pouvant être mises à jour sans modification du code du front public.
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
  (FR-012), et retourner une erreur explicite au-delà de cette limite.
- **FR-021**: Le système DOIT afficher une page 404 personnalisée, dans le style visuel du site,
  pour toute URL inexistante, avec au minimum un lien de retour vers la page d'accueil.
- **FR-022**: Le système DOIT afficher une page publique « Le tambourin » présentant le sport : les
  règles en bref, un schéma du terrain, les rôles des joueurs (fonds, tiers, cordiers), une frise
  historique incluant la fondation du club en 1923, et une citation. Son contenu est statique,
  maintenu avec le code du front public.
- **FR-023**: Le champ « sujet » du formulaire de contact DOIT proposer une liste fermée : Adhésion /
  essai, Partenariat, Galerie / photos, Presse, Autre. Un lien vers le formulaire DOIT pouvoir
  présélectionner un sujet de cette liste ; les appels à l'action « Viens essayer » (accueil),
  « Devenir partenaire » (partenaires) et « Envoyer mes photos » (galerie) présélectionnent
  respectivement Adhésion / essai, Partenariat et Galerie / photos. Le sujet DOIT être transmis
  au club avec la demande.
- **FR-024**: La page d'accueil DOIT afficher les chiffres clés du club (au plus 4, chacun composé
  d'une valeur courte et d'un libellé, par exemple « 1923 — Fondation »), dans l'ordre défini ;
  aucun chiffre n'est affiché s'il n'en existe aucun.
- **FR-025**: La page d'accueil DOIT afficher un bloc « Prochain match » présentant la prochaine
  compétition à venir (nom, date, heure, lieu) et un compte à rebours (jours, heures, minutes,
  secondes) jusqu'à son début ; le bloc N'EST PAS affiché s'il n'existe aucune compétition à venir.
  Le compte à rebours ne DOIT jamais afficher de valeur négative et DOIT respecter la préférence de
  réduction des animations du visiteur.
- **FR-026**: La page « Le club » DOIT lister les membres du bureau dans l'ordre défini, chacun avec
  son prénom, l'initiale de son nom et son rôle (ex. « Jean-Marc R. — Président »).
- **FR-027**: Toutes les pages DOIVENT partager la même navigation principale — Accueil, Le
  tambourin, Le club, Calendrier, Galerie, Partenaires, Contact — avec l'écusson du club renvoyant à
  l'accueil et la page courante signalée, ainsi qu'un pied de page donnant accès à Partenaires,
  Contact et Politique de confidentialité.

### Key Entities *(include if feature involves data)*

- **Compétition**: événement du calendrier du club — nom, date, lieu, description optionnelle,
  statut dérivé (à venir / passée), résultat optionnel (classement/score) affiché uniquement pour
  les compétitions passées.
- **Photo**: élément de la galerie — image, légende optionnelle, regroupement par événement ou
  catégorie (utilisé pour le filtrage).
- **Informations du club**: contenu de présentation — texte de présentation/histoire, valeurs,
  chiffres clés (valeur + libellé, ordonnés, 4 au plus), coordonnées de contact affichées, réseaux
  sociaux.
- **Membre du bureau**: bénévole affiché sur la page « Le club » — prénom, initiale du nom, rôle,
  ordre d'affichage.
- **Partenaire**: soutien du club — nom, niveau (principal, soutien, institutionnel), lien optionnel
  vers son site, description courte optionnelle, logo optionnel, ordre d'affichage.
- **Demande de contact**: message envoyé via le formulaire — prénom, nom, email, sujet (liste fermée,
  FR-023), message, date d'envoi,
  validation anti-bot (CAPTCHA), mention RGPD affichée à la saisie ; supprimée automatiquement 12
  mois après la date d'envoi.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un visiteur trouve les informations essentielles du club (présentation, prochaine
  compétition, moyen de contact) en moins de 2 minutes depuis la page d'accueil ; la prochaine
  compétition est visible dès l'accueil, sans navigation supplémentaire.
- **SC-002**: 95% des pages publiques affichent leur contenu principal en moins de 2,5 secondes sur
  une connexion mobile standard.
- **SC-003**: Un visiteur peut envoyer une demande via le formulaire de contact et obtenir une
  confirmation en moins d'1 minute, sans assistance externe.
- **SC-004**: L'ensemble des pages publiques reste pleinement lisible et navigable sur mobile,
  tablette et ordinateur de bureau, sans perte de contenu ni de fonctionnalité.
- **SC-005**: Une mise à jour du contenu (calendrier, galerie, infos du club, membres du bureau,
  partenaires) réalisée
  côté gestion de contenu est visible sur le front public sans intervention technique ni
  redéploiement du code.

## Assumptions

- Le contenu affiché (calendrier, galerie, informations du club, membres du bureau, partenaires,
  coordonnées) est
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
- Le contenu des pages « Politique de confidentialité » (FR-019) et « Le tambourin » (FR-022) est
  statique, non géré via le backoffice (contrairement au calendrier, à la galerie, aux infos du club
  et aux partenaires) ; il évolue au même rythme que le code du front public.
- Les textes des maquettes v11 (chiffres clés, membres du bureau, partenaires, règles du tambourin,
  devise) sont des exemples : le contenu réel sera fourni et validé par le club. L'année de
  fondation retenue est 1923, conformément à l'écusson du club.
- Les membres du bureau sont affichés sous la forme prénom + initiale du nom, sans photo ni
  coordonnées, afin de limiter l'exposition de données personnelles.
- Hors périmètre de cette feature (reporté à une feature ultérieure) : équipes et effectifs,
  actualités, adhésion en ligne, filtre du calendrier par équipe, classement de championnat,
  palmarès, envoi de photos par les visiteurs (le bouton « Envoyer mes photos » mène au formulaire
  de contact).
- Le seuil exact de la limite de fréquence par IP du formulaire de contact (FR-020) n'est pas fixé
  par cette spec ; à titre de point de départ raisonnable pour un club amateur (faible volume), 5
  soumissions par heure et par IP est proposé, à affiner lors de `/speckit-plan` si besoin.
